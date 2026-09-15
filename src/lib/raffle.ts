import { prisma } from "@/lib/prisma";

export function formatRaffleNumber(n: number, digits: number): string {
  return n.toString().padStart(digits, "0");
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

/**
 * Expired PENDING orders keep blocking their numbers forever otherwise,
 * since nothing else transitions them. Numbers are never reused (there's
 * no pool to release them back into), so this only flips the order's
 * status. Sweep on every raffle read instead of relying solely on the
 * cron route, so it also works without Vercel Cron.
 */
export async function releaseExpiredReservations(raffleId?: string) {
  await prisma.order.updateMany({
    where: {
      status: "PENDING",
      reservedUntil: { lt: new Date() },
      ...(raffleId ? { raffleId } : {}),
    },
    data: { status: "EXPIRED" },
  });
}
