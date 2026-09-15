"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { createAdminSession, destroyAdminSession } from "@/lib/auth";

export async function login(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } });
  if (!admin) {
    return { ok: false, error: "Credenciales incorrectas" };
  }

  const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);
  if (!valid) {
    return { ok: false, error: "Credenciales incorrectas" };
  }

  await createAdminSession({ adminId: admin.id, email: admin.email });
  return { ok: true };
}

export async function logout() {
  await destroyAdminSession();
}
