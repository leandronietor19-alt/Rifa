import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations, formatCurrency, formatRaffleNumber } from "@/lib/raffle";
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

  await releaseExpiredReservations(preliminary.raffleId);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      raffle: true,
      numbers: { orderBy: { number: "asc" } },
    },
  });
  if (!order) notFound();

  const statusInfo = STATUS_LABEL[order.status] ?? STATUS_LABEL.PENDING;
  const hasPaymentInfo =
    order.raffle.bizumPhone || order.raffle.bankAccount || order.raffle.paymentNotes;

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link href={`/rifa/${order.raffleId}`} className="text-white/70 text-sm">
            ← {order.raffle.title}
          </Link>
          <h1 className="text-2xl font-bold mt-2">Tu pedido</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl w-full px-6 py-8 flex-1 space-y-6">
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
          <h2 className="font-semibold mb-3">Números reservados</h2>
          <div className="flex flex-wrap gap-2">
            {order.numbers.map((n) => (
              <span
                key={n.id}
                className="font-mono text-sm bg-brand-navy text-white rounded px-2 py-1"
              >
                {formatRaffleNumber(n.number, order.raffle.digits)}
              </span>
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
                {order.raffle.bizumPhone && (
                  <p>
                    <strong>Bizum:</strong> {order.raffle.bizumPhone}
                  </p>
                )}
                {order.raffle.bankAccount && (
                  <p>
                    <strong>Transferencia a:</strong> {order.raffle.bankAccount}
                    {order.raffle.bankHolder ? ` (${order.raffle.bankHolder})` : ""}
                  </p>
                )}
                {order.raffle.paymentNotes && (
                  <p className="whitespace-pre-line text-black/70">
                    {order.raffle.paymentNotes}
                  </p>
                )}
                <p className="text-black/70">
                  Indica en el concepto tu nombre y los números reservados para que
                  podamos identificar tu pago.
                </p>
              </div>
            ) : (
              <p className="text-sm text-black/60">
                Ponte en contacto con la organización de la rifa para conocer la
                forma de pago.
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
              Un miembro de la organización confirmará tu pago manualmente. Esta
              página se actualizará cuando lo hagan.
            </p>
          </section>
        )}

        <section className="border border-black/10 rounded-xl p-5 bg-white text-sm">
          <h2 className="font-semibold mb-2">Datos del comprador</h2>
          <p>{order.buyerName}</p>
          <p className="text-black/60">{order.buyerEmail}</p>
          <p className="text-black/60">{order.buyerPhone}</p>
        </section>
      </main>
    </div>
  );
}
