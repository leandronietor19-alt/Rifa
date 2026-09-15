import { prisma } from "@/lib/prisma";

export function formatRaffleNumber(n: number, digits: number): string {
  return n.toString().padStart(digits, "0");
}

export function allNumbersForRaffle(totalNumbers: number, digits: number): string[] {
  return Array.from({ length: totalNumbers }, (_, i) => formatRaffleNumber(i, digits));
}

export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

/**
 * Expired PENDING orders keep their numbers locked forever otherwise, since
 * nothing else transitions them. Sweep on every raffle read instead of
 * relying solely on the cron route, so it also works without Vercel Cron.
 */
export async function releaseExpiredReservations(raffleId?: string) {
  const now = new Date();

  const expiredOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      reservedUntil: { lt: now },
      ...(raffleId ? { raffleId } : {}),
    },
    select: { id: true },
  });

  if (expiredOrders.length === 0) return;

  const orderIds = expiredOrders.map((o) => o.id);

  await prisma.$transaction([
    prisma.raffleNumber.updateMany({
      where: { orderId: { in: orderIds } },
      data: { status: "AVAILABLE", orderId: null, reservedUntil: null },
    }),
    prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: "EXPIRED" },
    }),
  ]);
}
