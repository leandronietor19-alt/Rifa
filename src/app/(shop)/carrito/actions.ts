"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation";
import { releaseExpiredReservations, getSiteUrl } from "@/lib/store";
import { sendNewOrderEmails } from "@/lib/email";

export type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function checkout(input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const { items, buyerName, buyerEmail, buyerPhone, buyerAddress } = parsed.data;

  await releaseExpiredReservations();

  try {
    const { order, emailItems, settings } = await prisma.$transaction(async (tx) => {
      const settings = await tx.storeSettings.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default", storeName: "Tienda Baboon", description: "" },
      });

      let totalAmount = 0;
      const orderItemsData: {
        productVariantId: string;
        productName: string;
        variantLabel: string;
        unitPrice: number;
        quantity: number;
      }[] = [];

      for (const cartItem of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: cartItem.variantId },
          include: { product: true },
        });
        if (!variant || variant.product.status !== "ACTIVE") {
          throw new Error(`UNAVAILABLE:${cartItem.variantId}`);
        }

        const updateResult = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: cartItem.quantity } },
          data: { stock: { decrement: cartItem.quantity } },
        });
        if (updateResult.count !== 1) {
          throw new Error(`OUT_OF_STOCK:${variant.product.name} (${variant.label})`);
        }

        totalAmount += variant.price * cartItem.quantity;
        orderItemsData.push({
          productVariantId: variant.id,
          productName: variant.product.name,
          variantLabel: variant.label,
          unitPrice: variant.price,
          quantity: cartItem.quantity,
        });
      }

      const reservedUntil = new Date(Date.now() + settings.reservationMinutes * 60 * 1000);

      const order = await tx.order.create({
        data: {
          buyerName,
          buyerEmail,
          buyerPhone,
          buyerAddress,
          totalAmount,
          status: "PENDING",
          reservedUntil,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });

      return { order, emailItems: orderItemsData, settings };
    });

    after(() =>
      sendNewOrderEmails({
        orderId: order.id,
        storeName: settings.storeName,
        buyerName,
        buyerEmail,
        buyerPhone,
        items: emailItems.map((i) => ({
          productName: i.productName,
          variantLabel: i.variantLabel,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
        totalAmount: order.totalAmount,
        reservationMinutes: settings.reservationMinutes,
        bizumPhone: settings.bizumPhone,
        bankAccount: settings.bankAccount,
        bankHolder: settings.bankHolder,
        paymentNotes: settings.paymentNotes,
        siteUrl: getSiteUrl(),
      }).catch((err) => console.error("Email send failed", err))
    );

    return { ok: true, orderId: order.id };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("OUT_OF_STOCK:")) {
      return {
        ok: false,
        error: `Ya no queda stock suficiente de: ${err.message.replace("OUT_OF_STOCK:", "")}. Actualiza el carrito.`,
      };
    }
    if (err instanceof Error && err.message.startsWith("UNAVAILABLE:")) {
      return {
        ok: false,
        error: "Algún producto de tu carrito ya no está disponible. Actualiza el carrito.",
      };
    }
    console.error(err);
    return { ok: false, error: "No se pudo completar el pedido. Inténtalo de nuevo." };
  }
}
