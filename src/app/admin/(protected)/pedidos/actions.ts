"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import { getSiteUrl, getStoreSettings } from "@/lib/store";
import { sendPaymentConfirmedEmail } from "@/lib/email";

export async function confirmOrder(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status !== "PENDING") {
    return { ok: false as const, error: "Este pedido no se puede confirmar." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID", confirmedAt: new Date() },
  });

  const settings = await getStoreSettings();
  after(() =>
    sendPaymentConfirmedEmail({
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerName,
      storeName: settings.storeName,
      items: order.items.map((i) => ({
        productName: i.productName,
        variantLabel: i.variantLabel,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      siteUrl: getSiteUrl(),
      orderId: order.id,
    }).catch((err) => console.error("Email send failed", err))
  );

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath(`/pedido/${orderId}`);
  return { ok: true as const };
}

export async function cancelOrder(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || (order.status !== "PENDING" && order.status !== "PAID")) {
    return { ok: false as const, error: "Este pedido no se puede cancelar." };
  }

  // Physical stock goes back into circulation on cancel.
  await prisma.$transaction([
    ...order.items
      .filter((item) => item.productVariantId)
      .map((item) =>
        prisma.productVariant.update({
          where: { id: item.productVariantId! },
          data: { stock: { increment: item.quantity } },
        })
      ),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
  ]);

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  revalidatePath("/");
  revalidatePath(`/pedido/${orderId}`);
  return { ok: true as const };
}
