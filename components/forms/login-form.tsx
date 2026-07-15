// components/forms/login-form.tsx

"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogIn,
} from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] = useState<
    string | null
  >(null);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    startTransition(async () => {
      const result = await signIn(
        "credentials",
        {
          email,
          password,
          redirect: false,
        },
      );

      if (!result) {
        setError(
          "Tidak dapat memproses login.",
        );
        return;
      }

      if (result.error) {
        setError(
          "Email atau password salah.",
        );
        return;
      }

      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="email">
          Email
        </Label>

        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password
        </Label>

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          disabled={isPending}
          required
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={
          isPending ||
          !email.trim() ||
          !password
        }
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Masuk...
          </>
        ) : (
          <>
            <LogIn className="size-4" />
            Masuk
          </>
        )}
      </Button>
    </form>
  );
}