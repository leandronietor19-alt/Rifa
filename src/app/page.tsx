import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const activeRaffle = await prisma.raffle.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (activeRaffle) {
    redirect(`/rifa/${activeRaffle.id}`);
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold">Rifa Debate España</h1>
          <p className="mt-3 text-white/80">
            Ahora mismo no hay ninguna rifa activa. Vuelve pronto o contacta
            con la organización para más información.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10 text-center flex-1">
        <Link
          href="/admin/login"
          className="text-sm text-brand-navy underline underline-offset-4"
        >
          Acceso administración
        </Link>
      </main>
    </div>
  );
}
