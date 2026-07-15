// lib/validations/transaction.ts

import { z } from "zod";

export const incomingTransactionSchema = z.object({
  itemId: z.string().min(1, "Barang wajib dipilih"),
  quantity: z.coerce
    .number()
    .int("Jumlah harus berupa bilangan bulat")
    .positive("Jumlah harus lebih dari 0"),
  supplier: z
    .string()
    .trim()
    .max(100, "Nama supplier maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
});

export const outgoingTransactionSchema = z.object({
  itemId: z.string().min(1, "Barang wajib dipilih"),
  quantity: z.coerce
    .number()
    .int("Jumlah harus berupa bilangan bulat")
    .positive("Jumlah harus lebih dari 0"),
  recipient: z
    .string()
    .trim()
    .max(100, "Penerima maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
});

export type IncomingTransactionInput = z.infer<
  typeof incomingTransactionSchema
>;

export type OutgoingTransactionInput = z.infer<
  typeof outgoingTransactionSchema
>;