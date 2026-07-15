// app/(dashboard)/page.tsx

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  History,
  Package,
  PackageOpen,
  Plus,
} from "lucide-react";

import { getDashboardStats, getItems } from "@/lib/queries/inventory";
import { ItemsManager } from "@/components/dashboard/items-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  valuePrefix?: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  valuePrefix = "",
}: StatCardProps) {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="min-w-0 space-y-1">
          <CardDescription className="truncate text-sm">
            {title}
          </CardDescription>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {valuePrefix}
          {formatNumber(value)}
        </div>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const [stats, items] = await Promise.all([
  getDashboardStats(),
  getItems(),
]);

  const lowStockItems = items
    .filter((item) => item.stock <= 5)
    .sort((a, b) => a.stock - b.stock);

  return (
    <div className="min-w-0 flex-1">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <section className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Boxes className="size-4" />
              <span>Ringkasan inventaris</span>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Dashboard
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Pantau persediaan, barang masuk, dan pengambilan barang dari
                satu tempat.
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
            <Button
              nativeButton={false}
              variant="outline"
              className="w-full justify-center lg:w-auto"
              render={
                <Link href="/riwayat">
                  <History className="size-4" />
                  Lihat Riwayat
                </Link>
              }
            />

            <Button
              nativeButton={false}
              className="w-full justify-center lg:w-auto"
              render={
                <Link href="/masuk">
                  <ArrowDownToLine className="size-4" />
                  Catat Barang Masuk
                </Link>
              }
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Jenis Barang"
            value={stats.totalItems}
            description="Jenis barang yang terdaftar"
            icon={Package}
          />

          <StatCard
            title="Stok Menipis"
            value={lowStockItems.length}
            description="Barang dengan stok 5 atau kurang"
            icon={AlertTriangle}
          />

          <StatCard
            title="Barang Masuk"
            value={stats.totalIncoming}
            description="Akumulasi barang yang diterima"
            icon={ArrowDownToLine}
            valuePrefix="+"
          />

          <StatCard
            title="Pengambilan"
            value={stats.totalOutgoing}
            description="Akumulasi barang yang dikeluarkan"
            icon={ArrowUpFromLine}
            valuePrefix="-"
          />
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <Card className="overflow-hidden shadow-none">
              <CardHeader className="border-b">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">
                      Daftar Barang
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Kelola barang dan pantau jumlah stok saat ini.
                    </CardDescription>
                  </div>

                  <Button
                    nativeButton={false}
                    className="w-full shrink-0 sm:w-auto"
                    render={
                      <Link href="/masuk">
                        <Plus className="size-4" />
                        Barang Masuk
                      </Link>
                    }
                  />
                </div>
              </CardHeader>

              <CardContent className="min-w-0 p-0">
                <div className="min-w-0 overflow-x-auto">
                  <ItemsManager items={items} />
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="min-w-0">
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                    <AlertTriangle className="size-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      Stok Menipis
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Barang yang perlu segera ditambahkan.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {lowStockItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center">
                    <PackageOpen className="size-8 text-muted-foreground" />

                    <p className="mt-3 text-sm font-medium">
                      Semua stok aman
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Tidak ada barang dengan stok 5 atau kurang.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockItems.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="flex min-w-0 items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.sku}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline">
                            {item.stock} {item.unit}
                          </Badge>

                          <Button
                            nativeButton={false}
                            variant="outline"
                            size="xs"
                            render={
                              <Link href={`/masuk?itemId=${item.id}`}>
                                Restock
                              </Link>
                            }
                          />
                        </div>
                      </div>
                    ))}

                    {lowStockItems.length > 6 && (
                      <p className="pt-1 text-center text-xs text-muted-foreground">
                        +{lowStockItems.length - 6} barang lainnya
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </div>
  );
}