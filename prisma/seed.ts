import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!@#", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@oculis.dev" },
    update: {},
    create: {
      email: "admin@oculis.dev",
      name: "Admin",
      passwordHash,
      role: "admin",
      tier: "enterprise",
    },
  });

  console.log(`Admin user ready: ${admin.email}`);
  console.log(`Password: Admin123!@#`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
