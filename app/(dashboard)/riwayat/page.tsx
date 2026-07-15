// app/(dashboard)/riwayat/page.tsx

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTransactionHistory } from "@/lib/queries/inventory";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function RiwayatPage() {
  const transactions = await getTransactionHistory();

  return (
    <div className="min-w-0 flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="size-4" />
            <span>Riwayat inventaris</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Riwayat Transaksi
            </h1>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Catatan barang masuk dan pengambilan barang.
            </p>
          </div>
        </header>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Semua Transaksi</CardTitle>

            <CardDescription>
              Transaksi diurutkan dari yang terbaru.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {transactions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <History className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-4 text-sm font-medium">
                  Belum ada riwayat transaksi
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Transaksi barang masuk dan pengambilan akan muncul di sini.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-lg border md:block">
                  <table className="w-full">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Tanggal
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Barang
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Tipe
                        </th>

                        <th className="px-4 py-3 text-right text-sm font-medium">
                          Jumlah
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Keterangan
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {transactions.map((transaction) => {
                        const isIncoming =
                          transaction.type === "MASUK";

                        const description = isIncoming
                          ? transaction.supplier
                          : transaction.recipient;

                        return (
                          <tr
                            key={transaction.id}
                            className="transition-colors hover:bg-muted/30"
                          >
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground">
                              {dateFormatter.format(transaction.date)}
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm font-medium">
                                {transaction.item.name}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {transaction.item.sku}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <Badge
                                variant={
                                  isIncoming
                                    ? "secondary"
                                    : "outline"
                                }
                                className="gap-1.5"
                              >
                                {isIncoming ? (
                                  <ArrowDownToLine className="size-3.5" />
                                ) : (
                                  <ArrowUpFromLine className="size-3.5" />
                                )}

                                {isIncoming
                                  ? "Barang Masuk"
                                  : "Pengambilan"}
                              </Badge>
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold">
                              {isIncoming ? "+" : "-"}
                              {transaction.quantity}{" "}
                              {transaction.item.unit}
                            </td>

                            <td className="max-w-xs px-4 py-4">
                              <p className="truncate text-sm">
                                {description || transaction.notes || "-"}
                              </p>

                              {description && transaction.notes && (
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {transaction.notes}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {transactions.map((transaction) => {
                    const isIncoming =
                      transaction.type === "MASUK";

                    const description = isIncoming
                      ? transaction.supplier
                      : transaction.recipient;

                    return (
                      <article
                        key={transaction.id}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {transaction.item.name}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {transaction.item.sku}
                            </p>
                          </div>

                          <p className="shrink-0 font-semibold">
                            {isIncoming ? "+" : "-"}
                            {transaction.quantity}{" "}
                            {transaction.item.unit}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <Badge
                            variant={
                              isIncoming
                                ? "secondary"
                                : "outline"
                            }
                            className="gap-1.5"
                          >
                            {isIncoming ? (
                              <ArrowDownToLine className="size-3.5" />
                            ) : (
                              <ArrowUpFromLine className="size-3.5" />
                            )}

                            {isIncoming
                              ? "Barang Masuk"
                              : "Pengambilan"}
                          </Badge>

                          <time className="text-right text-xs text-muted-foreground">
                            {dateFormatter.format(transaction.date)}
                          </time>
                        </div>

                        {(description || transaction.notes) && (
                          <div className="mt-4 border-t pt-3">
                            {description && (
                              <p className="text-sm">
                                {description}
                              </p>
                            )}

                            {transaction.notes && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {transaction.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}