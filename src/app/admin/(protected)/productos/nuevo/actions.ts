"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { productFormSchema } from "@/lib/validation";
import type { ProductFormValues } from "@/components/ProductForm";

export async function createProduct(values: ProductFormValues) {
  await requireAdmin();

  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const data = parsed.data;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl || null,
      status: data.status,
      variants: {
        create: data.variants.map((v) => ({
          label: v.label,
          price: Math.round(v.priceEuros * 100),
          stock: v.stock,
        })),
      },
    },
  });

  return { ok: true as const, productId: product.id };
}
