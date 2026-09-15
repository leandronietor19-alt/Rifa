import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/raffle";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await releaseExpiredReservations(id);

  const numbers = await prisma.raffleNumber.findMany({
    where: { raffleId: id },
    select: { number: true, status: true },
    orderBy: { number: "asc" },
  });

  return NextResponse.json({ numbers });
}
