// app/login/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";

import { authOptions } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl border bg-background shadow-sm">
            <Package className="size-6" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Inventory Barang
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Masuk untuk mengelola inventaris.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Masuk</CardTitle>

            <CardDescription>
              Gunakan akun yang telah terdaftar.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}