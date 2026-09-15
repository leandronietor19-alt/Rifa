import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrador";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL y ADMIN_PASSWORD deben estar definidos (revisa tu .env)"
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  console.log(`Admin listo: ${admin.email}`);

  // Only create on first run — leave later edits made from /admin/ajustes
  // alone on subsequent deploys instead of overwriting them every time.
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: process.env.NEXT_PUBLIC_SITE_NAME || "Baboon",
      description: "Merchandising oficial de Baboon.",
      reservationMinutes: 60,
    },
  });

  console.log("Ajustes de tienda listos.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
