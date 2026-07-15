// auth.ts

import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(1, "Password wajib diisi"),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });

        if (!parsedCredentials.success) {
          console.error(
            "[AUTH] Validasi credentials gagal:",
            parsedCredentials.error.flatten().fieldErrors,
          );

          return null;
        }

        const { email, password } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        console.log("[AUTH] User ditemukan:", Boolean(user));

        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          password,
          user.password,
        );

        console.log("[AUTH] Password cocok:", passwordMatches);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
};