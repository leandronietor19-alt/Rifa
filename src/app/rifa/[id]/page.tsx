import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations, formatCurrency } from "@/lib/raffle";
import RaffleOrderForm from "./RaffleOrderForm";

export default async function RafflePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await releaseExpiredReservations(id);

  const raffle = await prisma.raffle.findUnique({ where: { id } });
  if (!raffle) notFound();

  const soldCount = await prisma.raffleNumber.count({
    where: { raffleId: id, order: { status: "PAID" } },
  });

  const drawDateFormatted = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(raffle.drawDate);

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold">{raffle.title}</h1>
          <p className="mt-2 text-white/80 max-w-2xl whitespace-pre-line">
            {raffle.description}
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-white/60">Premio</div>
              <div className="font-semibold">{raffle.prizeDescription}</div>
            </div>
            <div>
              <div className="text-white/60">Precio por número</div>
              <div className="font-semibold">
                {formatCurrency(raffle.pricePerNumber)}
              </div>
            </div>
            <div>
              <div className="text-white/60">Sorteo</div>
              <div className="font-semibold">{drawDateFormatted}</div>
            </div>
            <div>
              <div className="text-white/60">Vendidos</div>
              <div className="font-semibold">{soldCount}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl w-full px-6 py-10 flex-1">
        {raffle.status !== "ACTIVE" ? (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
            {raffle.status === "CLOSED"
              ? "Esta rifa ya está cerrada. Gracias a todas las personas que participaron."
              : "Esta rifa todavía no está activa."}
          </div>
        ) : null}

        <RaffleOrderForm
          raffleId={raffle.id}
          pricePerNumber={raffle.pricePerNumber}
          reservationMinutes={raffle.reservationMinutes}
          purchasable={raffle.status === "ACTIVE"}
        />
      </main>

      <footer className="border-t border-black/10 py-6 text-center text-xs text-black/50">
        Rifa organizada por Debate España
      </footer>
    </div>
  );
}
