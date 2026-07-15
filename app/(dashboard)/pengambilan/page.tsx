// app/(dashboard)/pengambilan/page.tsx

import { ArrowUpFromLine } from "lucide-react";

import { OutgoingForm } from "@/components/forms/outgoing-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getItemOptions } from "@/lib/queries/inventory";

interface PengambilanPageProps {
  searchParams: Promise<{
    itemId?: string;
  }>;
}

export default async function PengambilanPage({
  searchParams,
}: PengambilanPageProps) {
  const [items, params] = await Promise.all([
    getItemOptions(),
    searchParams,
  ]);

  const selectedItemId = items.some(
    (item) => item.id === params.itemId,
  )
    ? params.itemId
    : undefined;

  return (
    <div className="min-w-0 flex-1">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowUpFromLine className="size-4" />
            <span>Transaksi inventaris</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Pengambilan Barang
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Catat barang yang diambil dari gudang dan perbarui stok secara
              otomatis.
            </p>
          </div>
        </header>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Catat Pengambilan</CardTitle>

            <CardDescription>
              Pilih barang, masukkan jumlah yang diambil, dan tambahkan
              keterangan jika diperlukan.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm font-medium">
                  Belum ada barang
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Tambahkan barang terlebih dahulu sebelum mencatat
                  pengambilan.
                </p>
              </div>
            ) : (
              <OutgoingForm
                items={items}
                defaultItemId={selectedItemId}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}