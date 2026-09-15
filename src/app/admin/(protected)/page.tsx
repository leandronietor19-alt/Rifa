import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/store";

export default async function AdminDashboardPage() {
  const [pendingOrders, paidOrders, products, lowStock] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({ where: { status: "PAID" }, select: { totalAmount: true } }),
    prisma.product.count(),
    prisma.productVariant.findMany({
      where: { stock: { lte: 3 }, product: { status: "ACTIVE" } },
      include: { product: true },
      orderBy: { stock: "asc" },
      take: 10,
    }),
  ]);

  const revenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Resumen</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-sm">
        <StatCard label="Pedidos pendientes" value={pendingOrders} href="/admin/pedidos" />
        <StatCard label="Recaudado" value={formatCurrency(revenue)} />
        <StatCard label="Productos" value={products} href="/admin/productos" />
        <StatCard label="Stock bajo" value={lowStock.length} />
      </div>

      <div className="flex gap-3 mb-8">
        <Link href="/admin/productos/nuevo" className="btn-primary rounded-md px-4 py-2 text-sm">
          + Nuevo producto
        </Link>
        <Link
          href="/admin/pedidos"
          className="rounded-md px-4 py-2 text-sm border border-black/15 hover:bg-black/5"
        >
          Ver pedidos
        </Link>
      </div>

      {lowStock.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg mb-3">Stock bajo (≤ 3 unidades)</h2>
          <div className="space-y-2">
            {lowStock.map((v) => (
              <Link
                key={v.id}
                href={`/admin/productos/${v.productId}`}
                className="flex items-center justify-between border border-black/10 rounded-lg px-4 py-2 bg-white hover:border-brand-gold text-sm"
              >
                <span>
                  {v.product.name} <span className="text-black/50">({v.label})</span>
                </span>
                <span className={v.stock === 0 ? "text-red-600 font-semibold" : "text-amber-700 font-semibold"}>
                  {v.stock} uds.
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const content = (
    <div className="border border-black/10 rounded-lg p-3 bg-white h-full">
      <div className="text-black/50 text-xs">{label}</div>
      <div className="font-semibold text-lg">{value}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="hover:border-brand-gold">
      {content}
    </Link>
  ) : (
    content
  );
}
