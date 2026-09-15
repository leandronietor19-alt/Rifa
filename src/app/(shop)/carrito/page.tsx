"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { checkout } from "./actions";

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default function CartPage() {
  const router = useRouter();
  const { items, hydrated, updateQuantity, removeItem, clear, totalPrice } = useCart();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await checkout({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerAddress,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      clear();
      router.push(`/pedido/${result.orderId}`);
    });
  }

  if (!hydrated) {
    return <main className="mx-auto max-w-3xl w-full px-6 py-10 flex-1" />;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl w-full px-6 py-16 flex-1 text-center">
        <h1 className="text-xl font-bold text-brand-navy mb-2">Tu carrito está vacío</h1>
        <Link href="/" className="text-brand-navy underline">
          Ir a la tienda
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl w-full px-6 py-10 flex-1">
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Tu carrito</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.variantId}
            className="flex items-center gap-4 border border-black/10 rounded-lg p-3 bg-white"
          >
            <div className="w-16 h-16 bg-black/5 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-black/30 text-xs">Sin foto</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.productName}</p>
              <p className="text-xs text-black/50">{item.variantLabel}</p>
              <p className="text-sm font-semibold text-brand-navy">
                {formatEuros(item.price)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                className="w-7 h-7 rounded-md border border-black/15 hover:bg-black/5"
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                className="w-7 h-7 rounded-md border border-black/15 hover:bg-black/5"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.variantId)}
              className="text-xs text-black/40 hover:text-red-600"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 text-right text-xl font-bold text-brand-navy">
        Total: {formatEuros(totalPrice)}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 border-t border-black/10 pt-6 space-y-3">
        <h2 className="font-semibold text-lg">Datos de envío</h2>
        <div>
          <label htmlFor="buyerName" className="block text-sm font-medium mb-1">
            Nombre completo
          </label>
          <input
            id="buyerName"
            required
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="w-full border border-black/15 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="buyerEmail" className="block text-sm font-medium mb-1">
            Correo electrónico
          </label>
          <input
            id="buyerEmail"
            required
            type="email"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            className="w-full border border-black/15 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="buyerPhone" className="block text-sm font-medium mb-1">
            Teléfono
          </label>
          <input
            id="buyerPhone"
            required
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
            className="w-full border border-black/15 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="buyerAddress" className="block text-sm font-medium mb-1">
            Dirección de envío
          </label>
          <textarea
            id="buyerAddress"
            required
            rows={2}
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
            className="w-full border border-black/15 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full rounded-md py-2.5 text-sm"
        >
          {isPending ? "Procesando…" : "Confirmar pedido y ver forma de pago"}
        </button>
      </form>
    </main>
  );
}
