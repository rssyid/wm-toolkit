"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  Star,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppState } from "@/context/app-state-context";
import { Supplier } from "@/types";
import { formatIDDate } from "@/lib/utils";
import { toast } from "sonner";

export default function MasterDataSuppliersPage() {
  const { suppliers, addMasterDataSupplier, updateMasterDataSupplier, deleteMasterDataSupplier } = useAppState();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Kontraktor Sipil");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [npwp, setNpwp] = useState("");
  const [rating, setRating] = useState<number>(4.8);

  const filteredSuppliers = suppliers.filter((sup) => {
    const q = search.toLowerCase();
    return (
      sup.code.toLowerCase().includes(q) ||
      sup.name.toLowerCase().includes(q) ||
      sup.category.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    const seq = String(suppliers.length + 1).padStart(4, "0");
    setCode(`VND-${seq}`);
    setName("");
    setCategory("Kontraktor Sipil & Tata Air");
    setContactPerson("");
    setPhone("");
    setNpwp("");
    setRating(4.5);
    setDialogOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingItem(sup);
    setCode(sup.code);
    setName(sup.name);
    setCategory(sup.category);
    setContactPerson(sup.contactPerson);
    setPhone(sup.phone);
    setNpwp(sup.npwp);
    setRating(sup.rating);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (sup: Supplier) => {
    const newStatus = sup.status === "Active" ? "Inactive" : "Active";
    setTogglingId(sup.id);
    try {
      const ok = await updateMasterDataSupplier(sup.id, { status: newStatus });
      if (ok) {
        toast.success(`Status rekanan ${sup.name} diubah menjadi ${newStatus}`);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const ok = await deleteMasterDataSupplier(deleteTarget.id);
      if (ok) {
        toast.success(`Rekanan ${deleteTarget.name} berhasil dihapus.`);
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error("Kode dan nama rekanan wajib diisi");
      return;
    }
    if (Number.isNaN(Number(rating)) || rating < 0 || rating > 5) {
      toast.error("Rating kinerja harus bernilai antara 0 sampai 5");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const ok = await updateMasterDataSupplier(editingItem.id, {
          code: code.trim(),
          name: name.trim(),
          category: category.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          npwp: npwp.trim(),
          rating,
        });
        if (ok) {
          toast.success("Data supplier berhasil diperbarui!");
          setDialogOpen(false);
        }
      } else {
        const ok = await addMasterDataSupplier({
          code: code.trim(),
          name: name.trim(),
          category: category.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          npwp: npwp.trim(),
          rating,
          status: "Active",
        });
        if (ok) {
          toast.success("Supplier baru berhasil ditambahkan!");
          setDialogOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/master-data"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Kembali ke Master Data
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Daftar Rekanan & Supplier (Vendors)
          </h1>
          <p className="text-xs text-muted-foreground">
            Direktori kontraktor, penyedia material, precast, alat berat, dan evaluasi rating kinerja.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Rekanan Baru
        </Button>
      </div>

      {/* Table Card */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari kode atau nama rekanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {filteredSuppliers.length} Rekanan Terdaftar
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[95px]">Kode Vendor</TableHead>
                <TableHead className="min-w-[170px]">Nama Perusahaan Rekanan</TableHead>
                <TableHead className="w-[145px]">Kualifikasi / Bidang</TableHead>
                <TableHead className="w-[125px]">Contact Person</TableHead>
                <TableHead className="w-[115px]">No. Telepon</TableHead>
                <TableHead className="w-[130px]">NPWP</TableHead>
                <TableHead className="w-[75px] text-center">Rating</TableHead>
                <TableHead className="w-[85px] whitespace-nowrap">Status</TableHead>
                <TableHead className="w-[130px] text-right whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-xs p-0">
                    <EmptyState
                      title="Tidak ada rekanan yang cocok"
                      description="Ubah kata kunci pencarian Anda."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((sup) => (
                  <TableRow key={sup.id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-mono font-bold text-foreground whitespace-nowrap">
                      {sup.code}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {sup.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap inline-block">
                        {sup.category}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{sup.contactPerson}</TableCell>
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">{sup.phone}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {sup.npwp}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {sup.rating}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={sup.status} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(sup)}
                          className="h-7 text-xs px-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={togglingId === sup.id}
                          onClick={() => handleToggleStatus(sup)}
                          className={`h-7 text-xs px-2 ${
                            sup.status === "Active"
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {sup.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(sup)}
                          className="h-7 text-xs px-2 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent scrollable className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingItem ? "Ubah Data Rekanan" : "Tambah Rekanan Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan nomor kode vendor, NPWP resmi, dan nomor kontak aktif.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  Kode Vendor <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VND-..."
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  Rating Kinerja (1-5)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  Nama Perusahaan Rekanan <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: PT Wira Rekayasa Konstruksi"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  Kualifikasi / Spesialisasi
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Kontraktor Sipil & Tata Air"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  Contact Person (PIC)
                </label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Nama PIC"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground block">
                  Nomor Telepon / WA
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-..."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Nomor Pokok Wajib Pajak (NPWP)</label>
              <Input
                value={npwp}
                onChange={(e) => setNpwp(e.target.value)}
                placeholder="01.423.854.2-121.000"
                className="h-9 font-mono text-xs"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data Rekanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-rose-600">Hapus Data Rekanan</DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus rekanan{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong> ({deleteTarget?.code}) dari database?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus Rekanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
