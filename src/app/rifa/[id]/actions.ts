"use server";

import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validation";
import { releaseExpiredReservations } from "@/lib/raffle";

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string; unavailableNumbers?: string[] };

export async function createOrder(input: unknown): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const { raffleId, numbers, buyerName, buyerEmail, buyerPhone } = parsed.data;

  await releaseExpiredReservations(raffleId);

  const uniqueNumbers = Array.from(new Set(numbers));

  try {
    const order = await prisma.$transaction(async (tx) => {
      const raffle = await tx.raffle.findUnique({ where: { id: raffleId } });
      if (!raffle || raffle.status !== "ACTIVE") {
        throw new Error("RAFFLE_NOT_ACTIVE");
      }

      const reservedUntil = new Date(
        Date.now() + raffle.reservationMinutes * 60 * 1000
      );

      const order = await tx.order.create({
        data: {
          raffleId,
          buyerName,
          buyerEmail,
          buyerPhone,
          quantity: uniqueNumbers.length,
          totalAmount: uniqueNumbers.length * raffle.pricePerNumber,
          status: "PENDING",
          reservedUntil,
        },
      });

      const updateResult = await tx.raffleNumber.updateMany({
        where: {
          raffleId,
          number: { in: uniqueNumbers },
          status: "AVAILABLE",
        },
        data: {
          status: "RESERVED",
          orderId: order.id,
          reservedUntil,
        },
      });

      if (updateResult.count !== uniqueNumbers.length) {
        throw new Error("NUMBERS_UNAVAILABLE");
      }

      return order;
    });

    return { ok: true, orderId: order.id };
  } catch (err) {
    if (err instanceof Error && err.message === "NUMBERS_UNAVAILABLE") {
      const stillTaken = await prisma.raffleNumber.findMany({
        where: { raffleId, number: { in: uniqueNumbers }, NOT: { status: "AVAILABLE" } },
        select: { number: true },
      });
      return {
        ok: false,
        error:
          "Alguno de los números elegidos ya no está disponible. Actualiza la página e inténtalo de nuevo.",
        unavailableNumbers: stillTaken.map((n) => n.number),
      };
    }
    if (err instanceof Error && err.message === "RAFFLE_NOT_ACTIVE") {
      return { ok: false, error: "Esta rifa ya no está activa." };
    }
    console.error(err);
    return { ok: false, error: "No se pudo completar la reserva. Inténtalo de nuevo." };
  }
}
