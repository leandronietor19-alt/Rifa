import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStoreSettings, formatCurrency } from "@/lib/store";

export default async function CatalogPage() {
  const [settings, products] = await Promise.all([
    getStoreSettings(),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl w-full px-6 py-10 flex-1">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
          {settings.storeName}
        </h1>
        {settings.description && (
          <p className="mt-2 text-black/60 max-w-2xl whitespace-pre-line">
            {settings.description}
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <p className="text-black/60">
          Todavía no hay productos disponibles. Vuelve pronto.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {products.map((product) => {
            const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
            const prices = product.variants.map((v) => v.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            return (
              <Link
                key={product.id}
                href={`/producto/${product.id}`}
                className="border border-black/10 rounded-xl overflow-hidden bg-white hover:border-brand-gold transition-colors flex flex-col"
              >
                <div className="aspect-square bg-black/5 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-black/30 text-sm">Sin imagen</span>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h2 className="font-semibold text-sm">{product.name}</h2>
                  <p className="mt-1 text-sm font-bold text-brand-navy">
                    {minPrice === maxPrice
                      ? formatCurrency(minPrice)
                      : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                  </p>
                  {totalStock === 0 && (
                    <span className="mt-1 text-xs text-red-600 font-medium">Agotado</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
