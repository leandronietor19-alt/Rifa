"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validation";
import { releaseExpiredReservations, getSiteUrl } from "@/lib/raffle";
import { sendNewOrderEmails } from "@/lib/email";

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createOrder(input: unknown): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const { raffleId, quantity, buyerName, buyerEmail, buyerPhone } = parsed.data;

  await releaseExpiredReservations(raffleId);

  try {
    const { order, raffle, numbers } = await prisma.$transaction(async (tx) => {
      const current = await tx.raffle.findUnique({ where: { id: raffleId } });
      if (!current || current.status !== "ACTIVE") {
        throw new Error("RAFFLE_NOT_ACTIVE");
      }

      // Atomically claim the next `quantity` numbers: the UPDATE takes a row
      // lock on the raffle, so concurrent orders serialize instead of racing.
      const raffle = await tx.raffle.update({
        where: { id: raffleId },
        data: { nextNumber: { increment: quantity } },
      });
      const firstNumber = raffle.nextNumber - quantity;
      const numbers = Array.from({ length: quantity }, (_, i) => firstNumber + i);

      const reservedUntil = new Date(
        Date.now() + raffle.reservationMinutes * 60 * 1000
      );

      const order = await tx.order.create({
        data: {
          raffleId,
          buyerName,
          buyerEmail,
          buyerPhone,
          quantity,
          totalAmount: quantity * raffle.pricePerNumber,
          status: "PENDING",
          reservedUntil,
        },
      });

      await tx.raffleNumber.createMany({
        data: numbers.map((number) => ({ raffleId, orderId: order.id, number })),
      });

      return { order, raffle, numbers };
    });

    after(() =>
      sendNewOrderEmails({
        raffleId,
        raffleTitle: raffle.title,
        buyerName,
        buyerEmail,
        buyerPhone,
        numbers,
        digits: raffle.digits,
        totalAmount: order.totalAmount,
        reservationMinutes: raffle.reservationMinutes,
        bizumPhone: raffle.bizumPhone,
        bankAccount: raffle.bankAccount,
        bankHolder: raffle.bankHolder,
        paymentNotes: raffle.paymentNotes,
        orderId: order.id,
        siteUrl: getSiteUrl(),
      }).catch((err) => console.error("Email send failed", err))
    );

    return { ok: true, orderId: order.id };
  } catch (err) {
    if (err instanceof Error && err.message === "RAFFLE_NOT_ACTIVE") {
      return { ok: false, error: "Esta rifa ya no está activa." };
    }
    console.error(err);
    return { ok: false, error: "No se pudo completar la reserva. Inténtalo de nuevo." };
  }
}
