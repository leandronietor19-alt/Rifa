"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { raffleFormSchema } from "@/lib/validation";
import { allNumbersForRaffle } from "@/lib/raffle";
import type { RaffleFormValues } from "@/components/RaffleForm";

export async function createRaffle(values: RaffleFormValues) {
  await requireAdmin();

  const parsed = raffleFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const data = parsed.data;

  const maxNumber = data.totalNumbers - 1;
  if (String(maxNumber).length > data.digits) {
    return {
      ok: false as const,
      error: `Con ${data.digits} dígitos no se pueden representar ${data.totalNumbers} números. Aumenta los dígitos.`,
    };
  }

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
      totalNumbers: data.totalNumbers,
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

  const numberValues = allNumbersForRaffle(data.totalNumbers, data.digits);
  await prisma.raffleNumber.createMany({
    data: numberValues.map((number) => ({ raffleId: raffle.id, number })),
  });

  return { ok: true as const, raffleId: raffle.id };
}
