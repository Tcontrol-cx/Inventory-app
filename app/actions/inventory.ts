"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Zod schemas for validation
const ItemSchema = z.object({
  sku: z.string().min(3, "SKU minimal 3 karakter").max(20, "SKU maksimal 20 karakter"),
  name: z.string().min(3, "Nama barang minimal 3 karakter"),
  description: z.string().optional().nullable(),
  stock: z.coerce.number().nonnegative("Stok awal tidak boleh negatif").default(0),
  unit: z.string().min(1, "Satuan harus diisi").default("pcs"),
});

const TransactionSchema = z.object({
  type: z.enum(["MASUK", "KELUAR"]),
  itemId: z.string().min(1, "Barang harus dipilih"),
  quantity: z.coerce.number().positive("Jumlah harus lebih besar dari 0"),
  notes: z.string().optional().nullable(),
  recipient: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  date: z.coerce.date().default(() => new Date()),
});

export async function getItems() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
    return { success: true, data: items };
  } catch (error: any) {
    console.error("Error in getItems:", error);
    return { success: false, error: "Gagal mengambil data barang" };
  }
}

export async function createItem(formData: any) {
  try {
    const validated = ItemSchema.parse(formData);

    // Check if SKU already exists
    const existing = await prisma.item.findUnique({
      where: { sku: validated.sku },
    });

    if (existing) {
      return { success: false, error: "SKU sudah digunakan oleh barang lain" };
    }

    const item = await prisma.item.create({
      data: {
        sku: validated.sku,
        name: validated.name,
        description: validated.description || null,
        stock: validated.stock,
        unit: validated.unit,
      },
    });

    // If initial stock is greater than 0, create an initial incoming transaction
    if (item.stock > 0) {
      await prisma.transaction.create({
        data: {
          type: "MASUK",
          itemId: item.id,
          quantity: item.stock,
          notes: "Stok awal saat pendaftaran barang",
          supplier: "Sistem",
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/masuk");
    revalidatePath("/pengambilan");
    revalidatePath("/riwayat");
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Error in createItem:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Data tidak valid",
      };
    }
    return { success: false, error: error.message || "Gagal menambah barang baru" };
  }
}

export async function updateItem(id: string, formData: any) {
  try {
    const UpdateSchema = ItemSchema.omit({ stock: true });
    const validated = UpdateSchema.parse(formData);

    // Check if SKU is used by another item
    const existing = await prisma.item.findFirst({
      where: {
        sku: validated.sku,
        id: { not: id },
      },
    });

    if (existing) {
      return { success: false, error: "SKU sudah digunakan oleh barang lain" };
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        sku: validated.sku,
        name: validated.name,
        description: validated.description || null,
        unit: validated.unit,
      },
    });

    revalidatePath("/");
    revalidatePath("/masuk");
    revalidatePath("/pengambilan");
    revalidatePath("/riwayat");
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Error in updateItem:", error);
   if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Data tidak valid",
      };
    }
    return { success: false, error: error.message || "Gagal memperbarui barang" };
  }
}

export async function deleteItem(id: string) {
  try {
    await prisma.item.delete({
      where: { id },
    });
    revalidatePath("/");
    revalidatePath("/masuk");
    revalidatePath("/pengambilan");
    revalidatePath("/riwayat");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteItem:", error);
    return { success: false, error: "Gagal menghapus barang. Barang ini mungkin memiliki riwayat transaksi." };
  }
}

export async function recordTransaction(formData: any) {
  try {
    const validated = TransactionSchema.parse(formData);

    const item = await prisma.item.findUnique({
      where: { id: validated.itemId },
    });

    if (!item) {
      return { success: false, error: "Barang tidak ditemukan" };
    }

    if (validated.type === "KELUAR") {
      if (item.stock < validated.quantity) {
        return {
          success: false,
          error: `Stok tidak mencukupi. Stok saat ini: ${item.stock} ${item.unit}, jumlah yang diambil: ${validated.quantity} ${item.unit}`,
        };
      }

      // Decrement stock
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            type: validated.type,
            itemId: validated.itemId,
            quantity: validated.quantity,
            notes: validated.notes || null,
            recipient: validated.recipient || "Umum",
            date: validated.date,
          },
        }),
        prisma.item.update({
          where: { id: validated.itemId },
          data: { stock: { decrement: validated.quantity } },
        }),
      ]);
    } else {
      // Increment stock
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            type: validated.type,
            itemId: validated.itemId,
            quantity: validated.quantity,
            notes: validated.notes || null,
            supplier: validated.supplier || "Umum",
            date: validated.date,
          },
        }),
        prisma.item.update({
          where: { id: validated.itemId },
          data: { stock: { increment: validated.quantity } },
        }),
      ]);
    }

    revalidatePath("/");
    revalidatePath("/masuk");
    revalidatePath("/pengambilan");
    revalidatePath("/riwayat");
    return { success: true };
  } catch (error: any) {
    console.error("Error in recordTransaction:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Data tidak valid" };
    }
    return { success: false, error: error.message || "Gagal mencatat transaksi" };
  }
}

export async function getTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      include: {
        item: true,
      },
    });
    return { success: true, data: JSON.parse(JSON.stringify(transactions)) };
  } catch (error: any) {
    console.error("Error in getTransactions:", error);
    return { success: false, error: "Gagal mengambil data transaksi" };
  }
}

export async function getDashboardStats() {
  try {
    // 1. Total items count
    let totalItems = await prisma.item.count();

    // Auto-seed if database is empty
    if (totalItems === 0) {
      await seedDatabase();
      totalItems = await prisma.item.count();
    }

    // 2. Low stock items (stock <= 5)
    const lowStockItems = await prisma.item.findMany({
      where: {
        stock: { lte: 5 },
      },
      orderBy: { stock: "asc" },
      take: 5,
    });
    const lowStockCount = await prisma.item.count({
      where: {
        stock: { lte: 5 },
      },
    });

    // 3. Total incoming & outgoing count
    const totalIncoming = await prisma.transaction.aggregate({
      where: { type: "MASUK" },
      _sum: { quantity: true },
    });
    const totalOutgoing = await prisma.transaction.aggregate({
      where: { type: "KELUAR" },
      _sum: { quantity: true },
    });

    // 4. Recent transactions (last 5)
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: {
        item: true,
      },
    });

    // 5. Recent activity in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = await prisma.transaction.findMany({
      where: {
        date: { gte: thirtyDaysAgo }
      },
      include: {
        item: true
      },
      orderBy: { date: "desc" },
      take: 10
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify({
        totalItems,
        lowStockCount,
        lowStockItems,
        totalIncomingQuantity: totalIncoming._sum.quantity || 0,
        totalOutgoingQuantity: totalOutgoing._sum.quantity || 0,
        recentTransactions,
        recentActivity,
      })),
    };
  } catch (error: any) {
    console.error("Error in getDashboardStats:", error);
    return { success: false, error: "Gagal mengambil statistik dashboard" };
  }
}

export async function seedDatabase() {
  try {
    const sampleItems = [
      { sku: "LAP-ROG-01", name: "Laptop ASUS ROG Zephyrus G14", description: "Laptop gaming high-end ASUS ROG Zephyrus G14 AMD Ryzen 9", stock: 8, unit: "unit" },
      { sku: "KB-K2-01", name: "Keyboard Keychron K2 Wireless", description: "Keyboard mechanical Keychron K2 RGB Hot-swappable Gateron Brown", stock: 25, unit: "unit" },
      { sku: "MS-G502-01", name: "Mouse Logitech G502 Hero", description: "Mouse gaming Logitech G502 Hero High Performance 25K DPI", stock: 15, unit: "unit" },
      { sku: "MON-DELL-24", name: "Monitor Dell IPS 24\" S2421HN", description: "Monitor Dell IPS 24 inch Full HD 75Hz Dual HDMI", stock: 4, unit: "unit" },
      { sku: "KBL-HDMI-02", name: "Kabel HDMI v2.0 2 Meter", description: "Kabel HDMI v2.0 Ultra HD 4K 60Hz nylon braided panjang 2 meter", stock: 50, unit: "pcs" },
      { sku: "MJ-KYU-01", name: "Meja Kerja Jati Minimalis", description: "Meja kerja kayu jati solid ukuran 120x60cm dengan laci", stock: 2, unit: "unit" },
    ];

    // Clear existing tables to prevent duplicate seed issues if run manually
    await prisma.transaction.deleteMany();
    await prisma.item.deleteMany();

    for (const itemData of sampleItems) {
      const item = await prisma.item.create({
        data: itemData,
      });

      // Add a matching incoming transaction for the initial stock
      await prisma.transaction.create({
        data: {
          type: "MASUK",
          itemId: item.id,
          quantity: item.stock,
          notes: "Stok awal (Seeding data otomatis)",
          supplier: "Supplier Utama (PT Elektronik Jaya)",
          date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000), // random date in last 5 days
        },
      });
    }

    // Also add 3-4 outgoing transactions to make it look realistic
    const items = await prisma.item.findMany();
    const transactionsData = [
      { itemId: items.find(i => i.sku === "KB-K2-01")?.id, quantity: 3, notes: "Diambil untuk divisi IT Developer", recipient: "Budi (IT Developer)", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { itemId: items.find(i => i.sku === "MS-G502-01")?.id, quantity: 5, notes: "Diambil untuk divisi Marketing", recipient: "Siti (Marketing)", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { itemId: items.find(i => i.sku === "MON-DELL-24")?.id, quantity: 1, notes: "Diambil untuk monitor kasir depan", recipient: "Ani (Kasir)", date: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    ];

    for (const tx of transactionsData) {
      if (tx.itemId) {
        await prisma.transaction.create({
          data: {
            type: "KELUAR",
            itemId: tx.itemId,
            quantity: tx.quantity,
            notes: tx.notes,
            recipient: tx.recipient,
            date: tx.date,
          },
        });

        // Decrement item stock
        await prisma.item.update({
          where: { id: tx.itemId },
          data: { stock: { decrement: tx.quantity } },
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/masuk");
    revalidatePath("/pengambilan");
    revalidatePath("/riwayat");
    return { success: true };
  } catch (error: any) {
    console.error("Error seeding database:", error);
    return { success: false, error: error.message };
  }
}
