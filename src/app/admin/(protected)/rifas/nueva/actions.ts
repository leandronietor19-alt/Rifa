"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { raffleFormSchema } from "@/lib/validation";
import type { RaffleFormValues } from "@/components/RaffleForm";

export async function createRaffle(values: RaffleFormValues) {
  await requireAdmin();

  const parsed = raffleFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const data = parsed.data;

  const drawDate = new Date(data.drawDate);
  if (Number.isNaN(drawDate.getTime())) {
    return { ok: false as const, error: "Fecha del sorteo no válida" };
  }

  const raffle = await prisma.raffle.create({
    data: {
      title: data.title,
      description: data.description,
      prizeDescription: data.prizeDescription,
      imageUrl: data.imageUrl || null,
      pricePerNumber: Math.round(data.pricePerNumberEuros * 100),
      digits: data.digits,
      drawDate,
      status: "DRAFT",
      bizumPhone: data.bizumPhone || null,
      bankAccount: data.bankAccount || null,
      bankHolder: data.bankHolder || null,
      paymentNotes: data.paymentNotes || null,
      reservationMinutes: data.reservationMinutes,
    },
  });

  return { ok: true as const, raffleId: raffle.id };
}
