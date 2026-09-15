"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { raffleFormSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import type { RaffleFormValues } from "@/components/RaffleForm";

export async function updateRaffle(raffleId: string, values: RaffleFormValues) {
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

  const status = values.status ?? "DRAFT";

  await prisma.raffle.update({
    where: { id: raffleId },
    data: {
      title: data.title,
      description: data.description,
      prizeDescription: data.prizeDescription,
      imageUrl: data.imageUrl || null,
      pricePerNumber: Math.round(data.pricePerNumberEuros * 100),
      drawDate,
      status,
      bizumPhone: data.bizumPhone || null,
      bankAccount: data.bankAccount || null,
      bankHolder: data.bankHolder || null,
      paymentNotes: data.paymentNotes || null,
      reservationMinutes: data.reservationMinutes,
    },
  });

  revalidatePath(`/admin/rifas/${raffleId}`);
  revalidatePath(`/rifa/${raffleId}`);
  return { ok: true as const };
}

export async function confirmOrder(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING") {
    return { ok: false as const, error: "Este pedido no se puede confirmar." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", confirmedAt: new Date() },
    }),
    prisma.raffleNumber.updateMany({
      where: { orderId },
      data: { status: "SOLD", reservedUntil: null },
    }),
  ]);

  revalidatePath(`/admin/rifas/${order.raffleId}`);
  revalidatePath(`/rifa/${order.raffleId}`);
  revalidatePath(`/pedido/${orderId}`);
  return { ok: true as const };
}

export async function cancelOrder(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || (order.status !== "PENDING" && order.status !== "PAID")) {
    return { ok: false as const, error: "Este pedido no se puede cancelar." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
    prisma.raffleNumber.updateMany({
      where: { orderId },
      data: { status: "AVAILABLE", orderId: null, reservedUntil: null },
    }),
  ]);

  revalidatePath(`/admin/rifas/${order.raffleId}`);
  revalidatePath(`/rifa/${order.raffleId}`);
  revalidatePath(`/pedido/${orderId}`);
  return { ok: true as const };
}
