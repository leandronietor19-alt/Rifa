import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/raffle";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  CLOSED: "Cerrada",
};

export default async function AdminDashboardPage() {
  const raffles = await prisma.raffle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { numbers: true } },
      numbers: { where: { status: "SOLD" }, select: { id: true } },
      orders: {
        where: { status: "PAID" },
        select: { totalAmount: true },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Rifas</h1>
        <Link href="/admin/rifas/nueva" className="btn-primary rounded-md px-4 py-2 text-sm">
          + Nueva rifa
        </Link>
      </div>

      {raffles.length === 0 ? (
        <p className="text-black/60">Todavía no has creado ninguna rifa.</p>
      ) : (
        <div className="space-y-3">
          {raffles.map((r) => {
            const revenue = r.orders.reduce((sum, o) => sum + o.totalAmount, 0);
            return (
              <Link
                key={r.id}
                href={`/admin/rifas/${r.id}`}
                className="block border border-black/10 rounded-xl p-4 bg-white hover:border-brand-gold transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{r.title}</h2>
                  <span className="text-xs rounded-full bg-black/5 px-2.5 py-1">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
                <p className="text-sm text-black/60 mt-1">
                  {r.numbers.length} / {r._count.numbers} números vendidos ·{" "}
                  {formatCurrency(revenue)} recaudados
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
