"use client";

import { useRouter } from "next/navigation";
import ProductForm, {
  emptyProductForm,
  type ProductFormValues,
} from "@/components/ProductForm";
import { createProduct } from "./actions";

export default function NewProductForm() {
  const router = useRouter();

  async function handleSubmit(values: ProductFormValues) {
    const result = await createProduct(values);
    if (!result.ok) return { ok: false, error: result.error };
    router.push(`/admin/productos/${result.productId}`);
    return { ok: true };
  }

  return (
    <ProductForm
      initialValues={emptyProductForm}
      submitLabel="Crear producto"
      onSubmit={handleSubmit}
    />
  );
}
