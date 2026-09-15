import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations, formatCurrency, getStoreSettings } from "@/lib/store";
import CountdownTimer from "./CountdownTimer";
import PaymentReferenceForm from "./PaymentReferenceForm";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente de pago", className: "bg-amber-100 text-amber-800" },
  PAID: { label: "Pago confirmado", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", className: "bg-black/10 text-black/60" },
  EXPIRED: { label: "Reserva caducada", className: "bg-black/10 text-black/60" },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const preliminary = await prisma.order.findUnique({ where: { id } });
  if (!preliminary) notFound();

  await releaseExpiredReservations();

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: true },
    }),
    getStoreSettings(),
  ]);
  if (!order) notFound();

  const statusInfo = STATUS_LABEL[order.status] ?? STATUS_LABEL.PENDING;
  const hasPaymentInfo = settings.bizumPhone || settings.bankAccount || settings.paymentNotes;

  return (
    <main className="mx-auto max-w-3xl w-full px-6 py-10 flex-1 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Tu pedido</h1>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
        {order.status === "PENDING" && order.reservedUntil && (
          <p className="text-sm text-black/60">
            Tiempo restante: <CountdownTimer deadline={order.reservedUntil.toISOString()} />
          </p>
        )}
      </div>

      <section className="border border-black/10 rounded-xl p-5 bg-white">
        <h2 className="font-semibold mb-3">Artículos</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                {item.quantity}× {item.productName}{" "}
                <span className="text-black/50">({item.variantLabel})</span>
              </span>
              <span className="font-medium">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-lg font-bold text-brand-navy">
          Total: {formatCurrency(order.totalAmount)}
        </p>
      </section>

      {order.status === "PENDING" && (
        <section className="border border-black/10 rounded-xl p-5 bg-white">
          <h2 className="font-semibold mb-2">Cómo pagar</h2>
          {hasPaymentInfo ? (
            <div className="text-sm space-y-1.5">
              {settings.bizumPhone && (
                <p>
                  <strong>Bizum:</strong> {settings.bizumPhone}
                </p>
              )}
              {settings.bankAccount && (
                <p>
                  <strong>Transferencia a:</strong> {settings.bankAccount}
                  {settings.bankHolder ? ` (${settings.bankHolder})` : ""}
                </p>
              )}
              {settings.paymentNotes && (
                <p className="whitespace-pre-line text-black/70">{settings.paymentNotes}</p>
              )}
              <p className="text-black/70">
                Indica en el concepto tu nombre y el número de pedido para que podamos
                identificar tu pago.
              </p>
            </div>
          ) : (
            <p className="text-sm text-black/60">
              Ponte en contacto con la tienda para conocer la forma de pago.
            </p>
          )}

          <h3 className="font-medium text-sm mt-4">
            ¿Ya has pagado? Déjanos una referencia
          </h3>
          <PaymentReferenceForm
            orderId={order.id}
            currentReference={order.paymentReference}
          />
          <p className="mt-3 text-xs text-black/50">
            Confirmaremos tu pago manualmente. Esta página se actualizará cuando lo
            hagamos.
          </p>
        </section>
      )}

      <section className="border border-black/10 rounded-xl p-5 bg-white text-sm">
        <h2 className="font-semibold mb-2">Datos de envío</h2>
        <p>{order.buyerName}</p>
        <p className="text-black/60">{order.buyerEmail}</p>
        <p className="text-black/60">{order.buyerPhone}</p>
        <p className="text-black/60 whitespace-pre-line">{order.buyerAddress}</p>
      </section>
    </main>
  );
}
