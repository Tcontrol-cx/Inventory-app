// scripts/create-admin.mjs

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Administrator";

if (!email || !password) {
  throw new Error(
    "ADMIN_EMAIL dan ADMIN_PASSWORD wajib tersedia di environment.",
  );
}

if (password.length < 8) {
  throw new Error(
    "ADMIN_PASSWORD minimal 8 karakter.",
  );
}

try {
  const passwordHash = await bcrypt.hash(
    password,
    12,
  );

  await prisma.user.upsert({
    where: {
      email: email.toLowerCase(),
    },
    update: {
      name,
      password: passwordHash,
    },
    create: {
      name,
      email: email.toLowerCase(),
      password: passwordHash,
    },
  });

  console.log(
    `Admin berhasil dibuat: ${email.toLowerCase()}`,
  );
} finally {
  await prisma.$disconnect();
}