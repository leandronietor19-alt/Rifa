"use client";

import { useState, useTransition } from "react";
import { setPaymentReference } from "./actions";

export default function PaymentReferenceForm({
  orderId,
  currentReference,
}: {
  orderId: string;
  currentReference: string | null;
}) {
  const [value, setValue] = useState(currentReference ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await setPaymentReference({ orderId, reference: value });
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar la referencia");
        return;
      }
      setMessage("Referencia guardada. Gracias.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col sm:flex-row gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ej: nombre y últimos 4 dígitos del Bizum"
        className="flex-1 border border-black/15 rounded-md px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending || value.trim().length === 0}
        className="btn-primary rounded-md px-4 py-2 text-sm whitespace-nowrap"
      >
        {isPending ? "Guardando…" : "Guardar referencia"}
      </button>
      {message && <p className="text-sm text-green-700 self-center">{message}</p>}
      {error && <p className="text-sm text-red-600 self-center">{error}</p>}
    </form>
  );
}
