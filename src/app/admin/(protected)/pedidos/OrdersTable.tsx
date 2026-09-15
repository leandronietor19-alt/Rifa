"use client";

import { useState, useTransition } from "react";
import { confirmOrder, cancelOrder } from "./actions";

export type OrderRow = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  totalAmount: number;
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
  paymentReference: string | null;
  createdAt: string;
  items: { productName: string; variantLabel: string; quantity: number }[];
};

const STATUS_LABEL: Record<OrderRow["status"], { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-amber-100 text-amber-800" },
  PAID: { label: "Pagado", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", className: "bg-black/10 text-black/60" },
  EXPIRED: { label: "Caducado", className: "bg-black/10 text-black/60" },
};

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [filter, setFilter] = useState<"ALL" | OrderRow["status"]>("ALL");

  const visible = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex gap-2 mb-4 text-xs">
        {(["ALL", "PENDING", "PAID", "CANCELLED", "EXPIRED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 border ${
              filter === s
                ? "bg-brand-navy text-white border-brand-navy"
                : "border-black/15 text-black/60"
            }`}
          >
            {s === "ALL" ? "Todos" : STATUS_LABEL[s].label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-black/50">No hay pedidos en esta categoría.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const [status, setStatus] = useState(order.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const statusInfo = STATUS_LABEL[status];

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmOrder(order.id);
      if (!result.ok) setError(result.error);
      else setStatus("PAID");
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelOrder(order.id);
      if (!result.ok) setError(result.error);
      else setStatus("CANCELLED");
    });
  }

  return (
    <div className="border border-black/10 rounded-lg p-4 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{order.buyerName}</p>
          <p className="text-xs text-black/60">
            {order.buyerEmail} · {order.buyerPhone}
          </p>
          <p className="text-xs text-black/50 whitespace-pre-line">{order.buyerAddress}</p>
        </div>
        <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>

      <ul className="mt-2 text-sm space-y-0.5">
        {order.items.map((item, i) => (
          <li key={i} className="text-black/70">
            {item.quantity}× {item.productName}{" "}
            <span className="text-black/50">({item.variantLabel})</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold">{formatEuros(order.totalAmount)}</span>
        <span className="text-black/50 text-xs">
          {new Date(order.createdAt).toLocaleString("es-ES")}
        </span>
        {order.paymentReference && (
          <span className="text-black/70 text-xs">Ref: {order.paymentReference}</span>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {status === "PENDING" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="btn-primary rounded-md px-3 py-1.5 text-xs"
          >
            Confirmar pago
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-md px-3 py-1.5 text-xs border border-black/15 text-black/70 hover:bg-black/5"
          >
            Cancelar
          </button>
        </div>
      )}
      {status === "PAID" && (
        <div className="mt-3">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-md px-3 py-1.5 text-xs border border-black/15 text-black/70 hover:bg-black/5"
          >
            Cancelar pedido
          </button>
        </div>
      )}
    </div>
  );
}
