"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { storeSettingsSchema, type StoreSettingsInput } from "@/lib/validation";
import { STORE_SETTINGS_ID } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function updateStoreSettings(values: StoreSettingsInput) {
  await requireAdmin();

  const parsed = storeSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const data = parsed.data;

  await prisma.storeSettings.upsert({
    where: { id: STORE_SETTINGS_ID },
    update: {
      storeName: data.storeName,
      description: data.description || "",
      logoUrl: data.logoUrl || null,
      bizumPhone: data.bizumPhone || null,
      bankAccount: data.bankAccount || null,
      bankHolder: data.bankHolder || null,
      paymentNotes: data.paymentNotes || null,
      reservationMinutes: data.reservationMinutes,
    },
    create: {
      id: STORE_SETTINGS_ID,
      storeName: data.storeName,
      description: data.description || "",
      logoUrl: data.logoUrl || null,
      bizumPhone: data.bizumPhone || null,
      bankAccount: data.bankAccount || null,
      bankHolder: data.bankHolder || null,
      paymentNotes: data.paymentNotes || null,
      reservationMinutes: data.reservationMinutes,
    },
  });

  revalidatePath("/admin/ajustes");
  revalidatePath("/");
  return { ok: true as const };
}
