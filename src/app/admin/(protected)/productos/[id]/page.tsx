import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";
import type { ProductFormValues } from "@/components/ProductForm";

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  });
  if (!product) notFound();

  const initialValues: ProductFormValues = {
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl ?? "",
    status: product.status,
    variants: product.variants.map((v) => ({
      id: v.id,
      label: v.label,
      priceEuros: (v.price / 100).toString(),
      stock: v.stock.toString(),
    })),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-brand-navy">{product.name}</h1>
        {product.status === "ACTIVE" && (
          <Link
            href={`/producto/${product.id}`}
            className="text-sm text-brand-navy underline"
          >
            Ver en la tienda →
          </Link>
        )}
      </div>

      <div className="mt-6">
        <EditProductForm productId={product.id} initialValues={initialValues} />
      </div>
    </div>
  );
}
