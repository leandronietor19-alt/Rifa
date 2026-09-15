import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/store";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  ARCHIVED: "Archivado",
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Productos</h1>
        <Link href="/admin/productos/nuevo" className="btn-primary rounded-md px-4 py-2 text-sm">
          + Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-black/60">Todavía no has creado ningún producto.</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
            const prices = p.variants.map((v) => v.price);
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const maxPrice = prices.length ? Math.max(...prices) : 0;

            return (
              <Link
                key={p.id}
                href={`/admin/productos/${p.id}`}
                className="flex items-center gap-4 border border-black/10 rounded-xl p-4 bg-white hover:border-brand-gold transition-colors"
              >
                <div className="w-14 h-14 bg-black/5 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-black/30 text-[10px]">Sin foto</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{p.name}</h2>
                    <span className="text-xs rounded-full bg-black/5 px-2.5 py-1">
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                  <p className="text-sm text-black/60 mt-1">
                    {p.variants.length} variante{p.variants.length !== 1 ? "s" : ""} ·{" "}
                    {minPrice === maxPrice
                      ? formatCurrency(minPrice)
                      : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}{" "}
                    · {totalStock} uds. en stock
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
