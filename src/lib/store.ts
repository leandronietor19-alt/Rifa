import { prisma } from "@/lib/prisma";

export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const STORE_SETTINGS_ID = "default";

export async function getStoreSettings() {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: STORE_SETTINGS_ID },
  });
  if (settings) return settings;

  // Should always exist after `npm run seed`, but fall back defensively so
  // pages don't crash if it's somehow missing.
  return prisma.storeSettings.create({
    data: {
      id: STORE_SETTINGS_ID,
      storeName: "Tienda Baboon",
      description: "",
      reservationMinutes: 60,
    },
  });
}

/**
 * Expired PENDING orders keep their reserved stock locked forever
 * otherwise, since nothing else transitions them. Restores each item's
 * stock (stock is real inventory, so it must go back into
 * circulation) and flips the order to EXPIRED. Sweep on every storefront
 * read instead of relying solely on the cron route, so it also works
 * without Vercel Cron.
 */
export async function releaseExpiredReservations() {
  const expiredOrders = await prisma.order.findMany({
    where: { status: "PENDING", reservedUntil: { lt: new Date() } },
    include: { items: true },
  });

  for (const order of expiredOrders) {
    await prisma.$transaction([
      ...order.items
        .filter((item) => item.productVariantId)
        .map((item) =>
          prisma.productVariant.update({
            where: { id: item.productVariantId! },
            data: { stock: { increment: item.quantity } },
          })
        ),
      prisma.order.update({ where: { id: order.id }, data: { status: "EXPIRED" } }),
    ]);
  }
}
