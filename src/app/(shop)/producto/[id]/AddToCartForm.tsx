"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

type Variant = {
  id: string;
  label: string;
  price: number;
  stock: number;
};

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default function AddToCartForm({
  productId,
  productName,
  imageUrl,
  variants,
}: {
  productId: string;
  productName: string;
  imageUrl: string | null;
  variants: Variant[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => v.id === variantId);
  const singleVariant = variants.length === 1;
  const outOfStock = !selected || selected.stock === 0;

  function handleAdd() {
    if (!selected || outOfStock) return;
    addItem(
      {
        variantId: selected.id,
        productId,
        productName,
        variantLabel: selected.label,
        price: selected.price,
        imageUrl,
      },
      quantity
    );
    setAdded(true);
  }

  return (
    <div className="space-y-4">
      {!singleVariant && (
        <div>
          <label className="block text-sm font-medium mb-2">Elige una opción</label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stock === 0}
                onClick={() => {
                  setVariantId(v.id);
                  setAdded(false);
                }}
                className={`rounded-md border px-3 py-2 text-sm ${
                  v.id === variantId
                    ? "bg-brand-navy border-brand-navy text-white"
                    : "border-black/15 hover:border-brand-gold"
                } ${v.stock === 0 ? "opacity-40 cursor-not-allowed line-through" : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <p className="text-2xl font-bold text-brand-navy">{formatEuros(selected.price)}</p>
      )}

      {outOfStock ? (
        <p className="text-sm text-red-600 font-medium">Sin stock disponible.</p>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-md border border-black/15 font-semibold hover:bg-black/5"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={selected?.stock ?? 1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.min(
                      selected?.stock ?? 1,
                      Math.max(1, Math.round(Number(e.target.value)) || 1)
                    )
                  )
                }
                className="w-16 text-center border border-black/15 rounded-md px-2 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(selected?.stock ?? 1, q + 1))
                }
                className="w-9 h-9 rounded-md border border-black/15 font-semibold hover:bg-black/5"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="btn-primary w-full rounded-md py-2.5 text-sm"
          >
            Añadir al carrito
          </button>

          {added && (
            <div className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              <span>Añadido al carrito.</span>
              <button
                type="button"
                onClick={() => router.push("/carrito")}
                className="underline font-medium"
              >
                Ver carrito
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
