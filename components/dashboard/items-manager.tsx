"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { createItem, updateItem, deleteItem } from "@/app/actions/inventory";

interface Item {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  stock: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    transactions: number;
  };
}

interface ItemsManagerProps {
  items: Item[];
}

export function ItemsManager({ items }: ItemsManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modal States
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    stock: 0,
    unit: "pcs",
  });

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setFormData({
      sku: "",
      name: "",
      description: "",
      stock: 0,
      unit: "pcs",
    });
    setIsOpenAdd(true);
  };

  const handleOpenEdit = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      description: item.description || "",
      stock: item.stock, // Stock is read-only in edit
      unit: item.unit,
    });
    setIsOpenEdit(true);
  };

  const handleOpenDelete = (item: Item) => {
    setSelectedItem(item);
    setIsOpenDelete(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name || !formData.unit) {
      toast.error("Mohon isi semua field wajib");
      return;
    }

    startTransition(async () => {
      const res = await createItem(formData);
      if (res.success) {
        toast.success(`Barang "${formData.name}" berhasil ditambahkan!`);
        setIsOpenAdd(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menambahkan barang");
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!formData.sku || !formData.name || !formData.unit) {
      toast.error("Mohon isi semua field wajib");
      return;
    }

    startTransition(async () => {
      const res = await updateItem(selectedItem.id, {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        unit: formData.unit,
      });
      if (res.success) {
        toast.success(`Barang "${formData.name}" berhasil diperbarui!`);
        setIsOpenEdit(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui barang");
      }
    });
  };

  const handleDeleteSubmit = () => {
    if (!selectedItem) return;

    startTransition(async () => {
      const res = await deleteItem(selectedItem.id);
      if (res.success) {
        toast.success("Barang berhasil dihapus!");
        setIsOpenDelete(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus barang");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari SKU, nama barang, atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary"
          />
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="mr-2 size-4" /> Tambah Barang
        </Button>
      </div>

      <div className="rounded-xl border border-muted-foreground/10 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px] font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Nama Barang</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Deskripsi</TableHead>
                <TableHead className="text-right font-semibold">Stok</TableHead>
                <TableHead className="font-semibold">Satuan</TableHead>
                <TableHead className="text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package className="h-8 w-8 text-muted-foreground/60 stroke-[1.5]" />
                      <p>Tidak ada data barang ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.stock <= 5;
                  return (
                    <TableRow
                      key={item.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="font-mono font-semibold text-xs tracking-wider text-primary">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {item.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[300px] truncate text-muted-foreground text-sm">
                        {item.description || "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-sm font-bold ${
                            isLowStock
                              ? "bg-destructive/10 text-destructive animate-pulse"
                              : "text-foreground"
                          }`}
                        >
                          {item.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal text-xs bg-background">
                          {item.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/masuk?itemId=${item.id}`)}
                            title="Catat Barang Masuk"
                            className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          >
                            <ArrowDownToLine className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={item.stock === 0}
                            onClick={() => router.push(`/pengambilan?itemId=${item.id}`)}
                            title="Catat Pengambilan"
                            className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 disabled:opacity-30"
                          >
                            <ArrowUpFromLine className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Barang"
                            className="size-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(item)}
                            title="Hapus Barang"
                            className="size-8 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* DIALOG ADD ITEM */}
      <Dialog open={isOpenAdd} onOpenChange={setIsOpenAdd}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="size-5 text-primary" /> Tambah Barang Baru
              </DialogTitle>
              <DialogDescription>
                Daftarkan tipe barang baru ke dalam sistem inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sku" className="text-right">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value.toUpperCase() })
                  }
                  placeholder="E.g. LAP-ROG-01"
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g. Laptop Asus ROG"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Deskripsi
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Keterangan singkat barang..."
                  className="col-span-3 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">
                  Stok Awal
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">
                  Satuan <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="E.g. pcs, unit, box"
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenAdd(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Barang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG EDIT ITEM */}
      <Dialog open={isOpenEdit} onOpenChange={setIsOpenEdit}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="size-5 text-amber-500" /> Edit Detail Barang
              </DialogTitle>
              <DialogDescription>
                Ubah informasi barang. Kolom stok tidak dapat diubah dari sini.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-sku" className="text-right">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value.toUpperCase() })
                  }
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nama <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-description" className="text-right pt-2">
                  Deskripsi
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="col-span-3 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unit" className="text-right">
                  Satuan <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4 opacity-70">
                <Label className="text-right">Stok Saat Ini</Label>
                <Input
                  value={`${formData.stock} ${formData.unit}`}
                  disabled
                  className="col-span-3 bg-muted"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenEdit(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG CONFIRM DELETE */}
      <Dialog open={isOpenDelete} onOpenChange={setIsOpenDelete}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Hapus Barang
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus barang <strong>{selectedItem?.name}</strong> ({selectedItem?.sku})?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground bg-destructive/5 border border-destructive/10 rounded-lg p-3">
            ⚠️ <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan. Jika barang ini sudah memiliki riwayat transaksi masuk atau keluar, penghapusan mungkin akan gagal atau menghapus data transaksi terkait secara otomatis.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsOpenDelete(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={isPending}
            >
              {isPending ? "Menghapus..." : "Ya, Hapus Barang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
