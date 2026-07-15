// components/forms/outgoing-form.tsx

"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpFromLine,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { createOutgoingTransaction } from "@/app/actions/transaction-actions";
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

interface OutgoingFormProps {
  items: ItemOption[];
  defaultItemId?: string;
}

export function OutgoingForm({
  items,
  defaultItemId,
}: OutgoingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [itemId, setItemId] = useState(
    defaultItemId ?? items[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState("");
  const [recipient, setRecipient] = useState("");
  const [notes, setNotes] = useState("");

  const selectedItem = items.find(
    (item) => item.id === itemId,
  );

  const numericQuantity = Number(quantity) || 0;

  const exceedsStock =
    selectedItem !== undefined &&
    numericQuantity > selectedItem.stock;

  const remainingStock = selectedItem
    ? selectedItem.stock - numericQuantity
    : 0;

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedItem) {
      toast.error("Pilih barang terlebih dahulu");
      return;
    }

    if (numericQuantity <= 0) {
      toast.error("Jumlah pengambilan harus lebih dari 0");
      return;
    }

    if (exceedsStock) {
      toast.error("Stok tidak mencukupi", {
        description: `Stok ${selectedItem.name} saat ini hanya ${selectedItem.stock} ${selectedItem.unit}.`,
      });
      return;
    }

    startTransition(async () => {
      const result = await createOutgoingTransaction({
        itemId,
        quantity: numericQuantity,
        recipient,
        notes,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Pengambilan barang berhasil dicatat", {
        description: `${selectedItem.name}: sisa stok ${result.data.stock} ${selectedItem.unit}.`,
      });

      setQuantity("");
      setRecipient("");
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
            onChange={(event) => {
              setItemId(event.target.value);
              setQuantity("");
            }}
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
              Stok tersedia:{" "}
              <span className="font-medium text-foreground">
                {selectedItem.stock} {selectedItem.unit}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">
            Jumlah Pengambilan
          </Label>

          <div className="relative">
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={selectedItem?.stock}
              step={1}
              inputMode="numeric"
              placeholder="Contoh: 5"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              disabled={
                isPending ||
                !selectedItem ||
                selectedItem.stock <= 0
              }
              required
              className="pr-16"
            />

            {selectedItem && (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                {selectedItem.unit}
              </span>
            )}
          </div>

          {exceedsStock && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="size-3.5" />
              Jumlah melebihi stok yang tersedia.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipient">
          Penerima / Pengambil
          <span className="ml-1 font-normal text-muted-foreground">
            (opsional)
          </span>
        </Label>

        <Input
          id="recipient"
          name="recipient"
          type="text"
          maxLength={100}
          placeholder="Nama orang, divisi, atau tujuan pengambilan"
          value={recipient}
          onChange={(event) =>
            setRecipient(event.target.value)
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
          placeholder="Tambahkan keperluan atau keterangan..."
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          disabled={isPending}
          className="resize-none"
        />
      </div>

      {selectedItem?.stock === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />

          <div>
            <p className="text-sm font-medium">
              Stok barang habis
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Tambahkan stok terlebih dahulu sebelum mencatat pengambilan.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              Perubahan stok
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {selectedItem && numericQuantity > 0
                ? `${selectedItem.stock} → ${Math.max(
                    remainingStock,
                    0,
                  )} ${selectedItem.unit}`
                : "Masukkan jumlah untuk melihat sisa stok."}
            </p>
          </div>

          <Button
            type="submit"
            disabled={
              isPending ||
              !selectedItem ||
              selectedItem.stock <= 0 ||
              numericQuantity <= 0 ||
              exceedsStock
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
                <ArrowUpFromLine className="size-4" />
                Catat Pengambilan
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}