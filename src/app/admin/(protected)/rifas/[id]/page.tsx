import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations, formatCurrency } from "@/lib/raffle";
import EditRaffleForm from "./EditRaffleForm";
import OrdersTable, { type OrderRow } from "./OrdersTable";
import type { RaffleFormValues } from "@/components/RaffleForm";

function toLocalDatetimeInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminRafflePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await releaseExpiredReservations(id);

  const raffle = await prisma.raffle.findUnique({ where: { id } });
  if (!raffle) notFound();

  const [numberStats, orders] = await Promise.all([
    prisma.raffleNumber.groupBy({
      by: ["status"],
      where: { raffleId: id },
      _count: true,
    }),
    prisma.order.findMany({
      where: { raffleId: id },
      orderBy: { createdAt: "desc" },
      include: { numbers: { select: { number: true } } },
    }),
  ]);

  const stats = { AVAILABLE: 0, RESERVED: 0, SOLD: 0 } as Record<string, number>;
  numberStats.forEach((s) => {
    stats[s.status] = s._count;
  });

  const revenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const orderRows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    buyerName: o.buyerName,
    buyerEmail: o.buyerEmail,
    buyerPhone: o.buyerPhone,
    quantity: o.quantity,
    totalAmount: o.totalAmount,
    status: o.status,
    paymentReference: o.paymentReference,
    createdAt: o.createdAt.toISOString(),
    numbers: o.numbers.map((n) => n.number).sort(),
  }));

  const initialValues: RaffleFormValues = {
    title: raffle.title,
    description: raffle.description,
    prizeDescription: raffle.prizeDescription,
    imageUrl: raffle.imageUrl ?? "",
    pricePerNumberEuros: (raffle.pricePerNumber / 100).toString(),
    totalNumbers: raffle.totalNumbers.toString(),
    digits: raffle.digits.toString(),
    drawDate: toLocalDatetimeInputValue(raffle.drawDate),
    bizumPhone: raffle.bizumPhone ?? "",
    bankAccount: raffle.bankAccount ?? "",
    bankHolder: raffle.bankHolder ?? "",
    paymentNotes: raffle.paymentNotes ?? "",
    reservationMinutes: raffle.reservationMinutes.toString(),
    status: raffle.status,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-brand-navy">{raffle.title}</h1>
        <Link href={`/rifa/${raffle.id}`} className="text-sm text-brand-navy underline">
          Ver página pública →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 text-sm">
        <StatCard label="Disponibles" value={stats.AVAILABLE ?? 0} />
        <StatCard label="Reservados" value={stats.RESERVED ?? 0} />
        <StatCard label="Vendidos" value={stats.SOLD ?? 0} />
        <StatCard label="Recaudado" value={formatCurrency(revenue)} />
      </div>

      <section className="mb-10">
        <h2 className="font-semibold text-lg mb-3">Datos de la rifa</h2>
        <EditRaffleForm raffleId={raffle.id} initialValues={initialValues} />
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Pedidos ({orders.length})</h2>
        <OrdersTable orders={orderRows} />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-black/10 rounded-lg p-3 bg-white">
      <div className="text-black/50 text-xs">{label}</div>
      <div className="font-semibold text-lg">{value}</div>
    </div>
  );
}
