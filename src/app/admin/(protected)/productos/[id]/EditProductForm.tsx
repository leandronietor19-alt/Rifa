"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ProductForm, { type ProductFormValues } from "@/components/ProductForm";
import { updateProduct, deleteProduct } from "./actions";

export default function EditProductForm({
  productId,
  initialValues,
}: {
  productId: string;
  initialValues: ProductFormValues;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  async function handleSubmit(values: ProductFormValues) {
    setSaved(false);
    const result = await updateProduct(productId, values);
    if (result.ok) {
      setSaved(true);
      router.refresh();
    }
    return result;
  }

  function handleDelete() {
    if (
      !confirm(
        "¿Seguro que quieres eliminar este producto? Esta acción no se puede deshacer."
      )
    )
      return;
    startDeleteTransition(() => deleteProduct(productId));
  }

  return (
    <div>
      <ProductForm
        initialValues={initialValues}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
      />
      {saved && <p className="text-sm text-green-700 mt-3">Cambios guardados.</p>}

      <div className="mt-8 border-t border-black/10 pt-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-sm text-red-600 hover:underline"
        >
          {isDeleting ? "Eliminando…" : "Eliminar producto"}
        </button>
      </div>
    </div>
  );
}
