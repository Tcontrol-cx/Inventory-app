// lib/action-error.ts

import { z } from "zod";

export function getActionErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}