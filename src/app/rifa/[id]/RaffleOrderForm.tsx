"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "./actions";

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

export default function RaffleOrderForm({
  raffleId,
  pricePerNumber,
  reservationMinutes,
  purchasable,
}: {
  raffleId: string;
  pricePerNumber: number;
  reservationMinutes: number;
  purchasable: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function clampQuantity(n: number) {
    if (Number.isNaN(n)) return 1;
    return Math.min(100, Math.max(1, Math.round(n)));
  }

  const total = quantity * pricePerNumber;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createOrder({
        raffleId,
        quantity,
        buyerName,
        buyerEmail,
        buyerPhone,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/pedido/${result.orderId}`);
    });
  }

  if (!purchasable) {
    return (
      <div className="border border-black/10 rounded-xl p-6 bg-white text-center text-black/60">
        Esta rifa no admite compras en este momento.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto border border-black/10 rounded-xl p-6 bg-white">
      <h2 className="font-semibold text-lg mb-4">Compra tus números</h2>

      <label htmlFor="quantity" className="block text-sm font-medium mb-1">
        ¿Cuántos números quieres?
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setQuantity((q) => clampQuantity(q - 1))}
          className="w-10 h-10 rounded-md border border-black/15 text-lg font-semibold hover:bg-black/5"
          aria-label="Restar uno"
        >
          −
        </button>
        <input
          id="quantity"
          type="number"
          min={1}
          max={100}
          value={quantity}
          onChange={(e) => setQuantity(clampQuantity(Number(e.target.value)))}
          className="w-20 text-center border border-black/15 rounded-md px-2 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setQuantity((q) => clampQuantity(q + 1))}
          className="w-10 h-10 rounded-md border border-black/15 text-lg font-semibold hover:bg-black/5"
          aria-label="Sumar uno"
        >
          +
        </button>
      </div>

      <p className="mt-3 text-sm text-black/60">
        {quantity} número{quantity !== 1 ? "s" : ""} × {formatEuros(pricePerNumber)}
      </p>
      <p className="text-2xl font-bold text-brand-navy">{formatEuros(total)}</p>
      <p className="mt-1 text-xs text-black/50">
        Los números se te asignan automáticamente al confirmar la reserva.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
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

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <p className="text-xs text-black/50">
          Los números se reservan durante {reservationMinutes} minutos mientras
          completas el pago. Si no se confirma el pago en ese plazo, la reserva
          caduca.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full rounded-md py-2.5 text-sm"
        >
          {isPending ? "Reservando…" : "Reservar y ver forma de pago"}
        </button>
      </form>
    </div>
  );
}
