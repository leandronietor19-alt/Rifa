"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { productFormSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProductFormValues } from "@/components/ProductForm";

export async function updateProduct(productId: string, values: ProductFormValues) {
  await requireAdmin();

  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const data = parsed.data;

  const existingVariants = await prisma.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  const existingIds = new Set(existingVariants.map((v) => v.id));
  const submittedIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id!));
  const idsToDelete = [...existingIds].filter((id) => !submittedIds.has(id));

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl || null,
        status: data.status,
      },
    }),
    ...(idsToDelete.length
      ? [prisma.productVariant.deleteMany({ where: { id: { in: idsToDelete } } })]
      : []),
    ...data.variants.map((v) =>
      v.id && existingIds.has(v.id)
        ? prisma.productVariant.update({
            where: { id: v.id },
            data: { label: v.label, price: Math.round(v.priceEuros * 100), stock: v.stock },
          })
        : prisma.productVariant.create({
            data: {
              productId,
              label: v.label,
              price: Math.round(v.priceEuros * 100),
              stock: v.stock,
            },
          })
    ),
  ]);

  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/admin/productos");
  revalidatePath("/");
  revalidatePath(`/producto/${productId}`);
  return { ok: true as const };
}

export async function deleteProduct(productId: string) {
  await requireAdmin();

  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}
