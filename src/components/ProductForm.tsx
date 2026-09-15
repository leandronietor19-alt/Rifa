"use client";

import { useState, useTransition } from "react";

export type VariantFormValues = {
  id?: string;
  label: string;
  priceEuros: string;
  stock: string;
};

export type ProductFormValues = {
  name: string;
  description: string;
  imageUrl: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  variants: VariantFormValues[];
};

export const emptyProductForm: ProductFormValues = {
  name: "",
  description: "",
  imageUrl: "",
  status: "DRAFT",
  variants: [{ label: "Talla única", priceEuros: "15", stock: "10" }],
};

let variantKeySeq = 0;

export default function ProductForm({
  initialValues,
  submitLabel,
  onSubmit,
}: {
  initialValues: ProductFormValues;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [values, setValues] = useState(initialValues);
  const [variantKeys, setVariantKeys] = useState(() =>
    initialValues.variants.map(() => `v${variantKeySeq++}`)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function setVariant(index: number, patch: Partial<VariantFormValues>) {
    setValues((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  function addVariant() {
    setVariantKeys((prev) => [...prev, `v${variantKeySeq++}`]);
    setValues((prev) => ({
      ...prev,
      variants: [...prev.variants, { label: "", priceEuros: "", stock: "0" }],
    }));
  }

  function removeVariant(index: number) {
    setVariantKeys((prev) => prev.filter((_, i) => i !== index));
    setValues((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(values);
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <Field label="Nombre del producto">
        <input
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Descripción">
        <textarea
          required
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="input"
        />
      </Field>

      <Field label="URL de imagen (opcional)">
        <input
          value={values.imageUrl}
          onChange={(e) => set("imageUrl", e.target.value)}
          className="input"
          placeholder="https://…"
        />
      </Field>

      <Field label="Estado">
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as ProductFormValues["status"])}
          className="input max-w-48"
        >
          <option value="DRAFT">Borrador (oculto)</option>
          <option value="ACTIVE">Activo (visible en la tienda)</option>
          <option value="ARCHIVED">Archivado</option>
        </select>
      </Field>

      <div className="border-t border-black/10 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Variantes (talla, color…)</h3>
          <button
            type="button"
            onClick={addVariant}
            className="text-sm text-brand-navy underline"
          >
            + Añadir variante
          </button>
        </div>

        <div className="space-y-3">
          {values.variants.map((variant, index) => (
            <div
              key={variantKeys[index]}
              className="grid grid-cols-[1fr_110px_90px_auto] gap-2 items-start"
            >
              <input
                required
                placeholder="Ej: M, Rojo - L, Talla única…"
                value={variant.label}
                onChange={(e) => setVariant(index, { label: e.target.value })}
                className="input"
              />
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Precio €"
                value={variant.priceEuros}
                onChange={(e) => setVariant(index, { priceEuros: e.target.value })}
                className="input"
              />
              <input
                required
                type="number"
                min="0"
                placeholder="Stock"
                value={variant.stock}
                onChange={(e) => setVariant(index, { stock: e.target.value })}
                className="input"
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                disabled={values.variants.length === 1}
                className="text-xs text-black/40 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed py-2"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-black/50 mt-2">
          Si el producto no tiene tallas ni colores, añade una única variante (ej. &quot;Talla
          única&quot;) con su precio y stock.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary rounded-md px-5 py-2.5 text-sm">
        {isPending ? "Guardando…" : submitLabel}
      </button>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
        <span className="block mt-1 font-normal">{children}</span>
      </label>
    </div>
  );
}
