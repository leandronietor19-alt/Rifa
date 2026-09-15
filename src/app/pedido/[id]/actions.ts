"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  orderId: z.string().min(1),
  reference: z.string().trim().min(1, "Indica una referencia").max(200),
});

export async function setPaymentReference(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.status !== "PENDING") {
    return { ok: false, error: "Este pedido ya no admite cambios." };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentReference: parsed.data.reference },
  });

  revalidatePath(`/pedido/${order.id}`);
  return { ok: true };
}
