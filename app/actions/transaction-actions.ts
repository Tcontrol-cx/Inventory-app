// app/actions/transaction-actions.ts

"use server";

import { revalidatePath } from "next/cache";

import { getActionErrorMessage } from "@/lib/action-error";
import { prisma } from "@/lib/prisma";
import {
  incomingTransactionSchema,
  outgoingTransactionSchema,
  type IncomingTransactionInput,
  type OutgoingTransactionInput,
} from "@/lib/validations/transaction";
import type { ActionResult } from "@/types/action-result";

interface TransactionActionData {
  transactionId: string;
  itemId: string;
  stock: number;
}

/**
 * Menambahkan stok barang dan mencatat transaksi MASUK secara atomik.
 */
export async function createIncomingTransaction(
  input: IncomingTransactionInput,
): Promise<ActionResult<TransactionActionData>> {
  try {
    const validated = incomingTransactionSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: {
          id: validated.itemId,
        },
        select: {
          id: true,
        },
      });

      if (!item) {
        throw new Error("Barang tidak ditemukan");
      }

      const updatedItem = await tx.item.update({
        where: {
          id: validated.itemId,
        },
        data: {
          stock: {
            increment: validated.quantity,
          },
        },
        select: {
          id: true,
          stock: true,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          type: "MASUK",
          itemId: validated.itemId,
          quantity: validated.quantity,
          supplier: normalizeOptionalText(validated.supplier),
          notes: normalizeOptionalText(validated.notes),
        },
        select: {
          id: true,
        },
      });

      return {
        transactionId: transaction.id,
        itemId: updatedItem.id,
        stock: updatedItem.stock,
      };
    });

    revalidateInventoryPages();

    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    console.error("Gagal mencatat barang masuk:", error);

    return {
      success: false,
      error: getActionErrorMessage(
        error,
        "Gagal mencatat barang masuk",
      ),
    };
  }
}

/**
 * Mengurangi stok dan mencatat transaksi KELUAR secara atomik.
 */
export async function createOutgoingTransaction(
  input: OutgoingTransactionInput,
): Promise<ActionResult<TransactionActionData>> {
  try {
    const validated = outgoingTransactionSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const updatedItemCount = await tx.item.updateMany({
        where: {
          id: validated.itemId,
          stock: {
            gte: validated.quantity,
          },
        },
        data: {
          stock: {
            decrement: validated.quantity,
          },
        },
      });

      if (updatedItemCount.count === 0) {
        const item = await tx.item.findUnique({
          where: {
            id: validated.itemId,
          },
          select: {
            stock: true,
          },
        });

        if (!item) {
          throw new Error("Barang tidak ditemukan");
        }

        throw new Error(
          `Stok tidak mencukupi. Stok saat ini: ${item.stock}`,
        );
      }

      const transaction = await tx.transaction.create({
        data: {
          type: "KELUAR",
          itemId: validated.itemId,
          quantity: validated.quantity,
          recipient: normalizeOptionalText(validated.recipient),
          notes: normalizeOptionalText(validated.notes),
        },
        select: {
          id: true,
        },
      });

      const updatedItem = await tx.item.findUniqueOrThrow({
        where: {
          id: validated.itemId,
        },
        select: {
          id: true,
          stock: true,
        },
      });

      return {
        transactionId: transaction.id,
        itemId: updatedItem.id,
        stock: updatedItem.stock,
      };
    });

    revalidateInventoryPages();

    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    console.error("Gagal mencatat pengambilan barang:", error);

    return {
      success: false,
      error: getActionErrorMessage(
        error,
        "Gagal mencatat pengambilan barang",
      ),
    };
  }
}

function normalizeOptionalText(
  value: string | undefined,
): string | null {
  const normalizedValue = value?.trim();

  return normalizedValue || null;
}

function revalidateInventoryPages(): void {
  revalidatePath("/");
  revalidatePath("/masuk");
  revalidatePath("/pengambilan");
  revalidatePath("/riwayat");
}