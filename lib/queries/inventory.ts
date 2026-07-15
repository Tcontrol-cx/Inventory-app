// lib/queries/inventory.ts

import { prisma } from "@/lib/prisma";

export async function getItems() {
  return prisma.item.findMany({
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getItemOptions() {
  return prisma.item.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      stock: true,
      unit: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getDashboardStats() {
  const [
    totalItems,
    lowStockItems,
    incomingAggregate,
    outgoingAggregate,
  ] = await Promise.all([
    prisma.item.count(),

    prisma.item.count({
      where: {
        stock: {
          lte: 5,
        },
      },
    }),

    prisma.transaction.aggregate({
      where: {
        type: "MASUK",
      },
      _sum: {
        quantity: true,
      },
    }),

    prisma.transaction.aggregate({
      where: {
        type: "KELUAR",
      },
      _sum: {
        quantity: true,
      },
    }),
  ]);

  return {
    totalItems,
    lowStockItems,
    totalIncoming: incomingAggregate._sum.quantity ?? 0,
    totalOutgoing: outgoingAggregate._sum.quantity ?? 0,
  };
}

export async function getRecentTransactions(limit = 10) {
  return prisma.transaction.findMany({
    take: limit,
    include: {
      item: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}

export async function getTransactionHistory() {
  return prisma.transaction.findMany({
    include: {
      item: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
        },
      },
    },
    orderBy: [
      {
        date: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}