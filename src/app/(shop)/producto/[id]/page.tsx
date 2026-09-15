import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AddToCartForm from "./AddToCartForm";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  });

  if (!product || product.status !== "ACTIVE") notFound();

  return (
    <main className="mx-auto max-w-4xl w-full px-6 py-10 flex-1">
      <Link href="/" className="text-sm text-brand-navy underline">
        ← Volver a la tienda
      </Link>

      <div className="mt-4 grid sm:grid-cols-2 gap-8">
        <div className="aspect-square bg-black/5 rounded-xl overflow-hidden flex items-center justify-center">
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

        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{product.name}</h1>
          <p className="mt-2 text-black/70 whitespace-pre-line">{product.description}</p>

          <div className="mt-6">
            <AddToCartForm
              productId={product.id}
              productName={product.name}
              imageUrl={product.imageUrl}
              variants={product.variants.map((v) => ({
                id: v.id,
                label: v.label,
                price: v.price,
                stock: v.stock,
              }))}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
