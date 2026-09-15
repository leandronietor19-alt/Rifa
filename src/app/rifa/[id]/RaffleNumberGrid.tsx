"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "./actions";

type NumberStatus = "AVAILABLE" | "RESERVED" | "SOLD";
type RaffleNumber = { number: string; status: NumberStatus };

const STATUS_STYLES: Record<NumberStatus, string> = {
  AVAILABLE:
    "bg-white border-black/15 text-foreground hover:border-brand-gold hover:bg-amber-50 cursor-pointer",
  RESERVED: "bg-amber-100 border-amber-200 text-amber-700 cursor-not-allowed",
  SOLD: "bg-black/10 border-black/10 text-black/40 cursor-not-allowed line-through",
};

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

export default function RaffleNumberGrid({
  raffleId,
  pricePerNumber,
  reservationMinutes,
  initialNumbers,
  purchasable,
}: {
  raffleId: string;
  pricePerNumber: number;
  reservationMinutes: number;
  initialNumbers: RaffleNumber[];
  purchasable: boolean;
}) {
  const router = useRouter();
  const [numbers, setNumbers] = useState(initialNumbers);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/raffles/${raffleId}/numbers`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: { numbers: RaffleNumber[] } = await res.json();
        setNumbers(data.numbers);
        setSelected((prev) => {
          const stillAvailable = new Set(
            data.numbers.filter((n) => n.status === "AVAILABLE").map((n) => n.number)
          );
          const next = new Set<string>();
          prev.forEach((n) => {
            if (stillAvailable.has(n)) next.add(n);
          });
          return next;
        });
      } catch {
        // ignore transient polling failures
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [raffleId]);

  const filteredNumbers = useMemo(() => {
    if (!search.trim()) return numbers;
    return numbers.filter((n) => n.number.includes(search.trim()));
  }, [numbers, search]);

  function toggleNumber(n: RaffleNumber) {
    if (!purchasable || n.status !== "AVAILABLE") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n.number)) next.delete(n.number);
      else next.add(n.number);
      return next;
    });
  }

  const total = selected.size * pricePerNumber;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selected.size === 0) {
      setError("Selecciona al menos un número.");
      return;
    }

    startTransition(async () => {
      const result = await createOrder({
        raffleId,
        numbers: Array.from(selected),
        buyerName,
        buyerEmail,
        buyerPhone,
      });

      if (!result.ok) {
        setError(result.error);
        if (result.unavailableNumbers?.length) {
          setSelected((prev) => {
            const next = new Set(prev);
            result.unavailableNumbers!.forEach((n) => next.delete(n));
            return next;
          });
          setNumbers((prev) =>
            prev.map((n) =>
              result.unavailableNumbers!.includes(n.number)
                ? { ...n, status: n.status === "AVAILABLE" ? "RESERVED" : n.status }
                : n
            )
          );
        }
        return;
      }

      router.push(`/pedido/${result.orderId}`);
    });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-4 text-xs">
            <LegendItem colorClass="bg-white border border-black/15" label="Disponible" />
            <LegendItem colorClass="bg-amber-100 border border-amber-200" label="Reservado" />
            <LegendItem colorClass="bg-black/10 border border-black/10" label="Vendido" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar número…"
            className="border border-black/15 rounded-md px-3 py-1.5 text-sm w-40"
          />
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2 max-h-[560px] overflow-y-auto p-1">
          {filteredNumbers.map((n) => (
            <button
              key={n.number}
              type="button"
              onClick={() => toggleNumber(n)}
              disabled={!purchasable || n.status !== "AVAILABLE"}
              className={`rounded-md border py-2 text-sm font-mono transition-colors ${
                selected.has(n.number)
                  ? "bg-brand-navy border-brand-navy text-white"
                  : STATUS_STYLES[n.status]
              }`}
            >
              {n.number}
            </button>
          ))}
          {filteredNumbers.length === 0 && (
            <p className="col-span-full text-sm text-black/50 py-6 text-center">
              No hay números que coincidan con «{search}».
            </p>
          )}
        </div>
      </section>

      <aside className="border border-black/10 rounded-xl p-5 h-fit lg:sticky lg:top-6 bg-white">
        <h2 className="font-semibold text-lg">Tu selección</h2>

        {selected.size === 0 ? (
          <p className="mt-2 text-sm text-black/50">
            Elige uno o varios números del panel para reservarlos.
          </p>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from(selected)
                .sort()
                .map((n) => (
                  <span
                    key={n}
                    className="font-mono text-xs bg-brand-navy text-white rounded px-1.5 py-0.5"
                  >
                    {n}
                  </span>
                ))}
            </div>
            <p className="mt-3 text-sm">
              {selected.size} número{selected.size !== 1 ? "s" : ""} ×{" "}
              {formatEuros(pricePerNumber)}
            </p>
            <p className="text-xl font-bold text-brand-navy">{formatEuros(total)}</p>
          </>
        )}

        {purchasable ? (
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
              completas el pago. Si no se confirma el pago en ese plazo, volverán a
              estar disponibles.
            </p>

            <button
              type="submit"
              disabled={selected.size === 0 || isPending}
              className="btn-primary w-full rounded-md py-2.5 text-sm"
            >
              {isPending ? "Reservando…" : "Reservar y ver forma de pago"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-black/50">
            Esta rifa no admite compras en este momento.
          </p>
        )}
      </aside>
    </div>
  );
}

function LegendItem({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded-sm ${colorClass}`} />
      <span className="text-black/60">{label}</span>
    </div>
  );
}
