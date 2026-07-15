// components/forms/incoming-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createIncomingTransaction } from "@/app/actions/transaction-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ItemOption {
  id: string;
  sku: string;
  name: string;
  stock: number;
  unit: string;
}

interface IncomingFormProps {
  items: ItemOption[];
  defaultItemId?: string;
}

export function IncomingForm({
  items,
  defaultItemId,
}: IncomingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [itemId, setItemId] = useState(
    defaultItemId ?? items[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");

  const selectedItem = items.find(
    (item) => item.id === itemId,
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createIncomingTransaction({
        itemId,
        quantity: Number(quantity),
        supplier,
        notes,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Barang masuk berhasil dicatat", {
        description: selectedItem
          ? `Stok ${selectedItem.name} sekarang ${result.data.stock} ${selectedItem.unit}.`
          : undefined,
      });

      setQuantity("");
      setSupplier("");
      setNotes("");

      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="itemId">
            Barang
          </Label>

          <select
            id="itemId"
            name="itemId"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            disabled={isPending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {items.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name} — {item.sku}
              </option>
            ))}
          </select>

          {selectedItem && (
            <p className="text-xs text-muted-foreground">
              Stok saat ini:{" "}
              <span className="font-medium text-foreground">
                {selectedItem.stock} {selectedItem.unit}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">
            Jumlah Masuk
          </Label>

          <div className="relative">
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="Contoh: 10"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              disabled={isPending}
              required
              className="pr-16"
            />

            {selectedItem && (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                {selectedItem.unit}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">
          Supplier
          <span className="ml-1 font-normal text-muted-foreground">
            (opsional)
          </span>
        </Label>

        <Input
          id="supplier"
          name="supplier"
          type="text"
          maxLength={100}
          placeholder="Nama supplier atau sumber barang"
          value={supplier}
          onChange={(event) =>
            setSupplier(event.target.value)
          }
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">
          Catatan
          <span className="ml-1 font-normal text-muted-foreground">
            (opsional)
          </span>
        </Label>

        <Textarea
          id="notes"
          name="notes"
          maxLength={500}
          rows={4}
          placeholder="Tambahkan keterangan jika diperlukan..."
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          disabled={isPending}
          className="resize-none"
        />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              Perubahan stok
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {selectedItem && quantity
                ? `${selectedItem.stock} → ${
                    selectedItem.stock +
                    (Number(quantity) || 0)
                  } ${selectedItem.unit}`
                : "Masukkan jumlah untuk melihat perubahan stok."}
            </p>
          </div>

          <Button
            type="submit"
            disabled={
              isPending ||
              !itemId ||
              !quantity ||
              Number(quantity) <= 0
            }
            className="w-full sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <ArrowDownToLine className="size-4" />
                Catat Barang Masuk
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}