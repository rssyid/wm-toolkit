"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Layers, Plus, Search, Edit2, Trash2, ChevronLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppState } from "@/context/app-state-context";
import { ProjectTypeItem } from "@/types";
import { formatIDDate } from "@/lib/utils";
import { toast } from "sonner";

export default function MasterDataProjectTypesPage() {
  const {
    projectTypes,
    addMasterDataProjectType,
    updateMasterDataProjectType,
    deleteMasterDataProjectType,
  } = useAppState();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectTypeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTypeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const filtered = (projectTypes || []).filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCode(`PT-NEW-${(projectTypes?.length || 0) + 1}`);
    setName("");
    setDescription("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: ProjectTypeItem) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setDescription(item.description);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (item: ProjectTypeItem) => {
    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    const ok = await updateMasterDataProjectType(item.id, { status: newStatus });
    if (ok) {
      toast.success(`Status tipe ${item.name} diubah menjadi ${newStatus}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const ok = await deleteMasterDataProjectType(deleteTarget.id);
      if (ok) {
        toast.success(`Tipe proyek ${deleteTarget.name} berhasil dihapus.`);
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error("Kode dan nama tipe proyek wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const ok = await updateMasterDataProjectType(editingItem.id, {
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
        });
        if (ok) {
          toast.success("Tipe proyek berhasil diperbarui!");
          setDialogOpen(false);
        }
      } else {
        const ok = await addMasterDataProjectType({
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          status: "Active",
        });
        if (ok) {
          toast.success("Tipe proyek baru berhasil ditambahkan!");
          setDialogOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/master-data"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Kembali ke Master Data
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Master Data Tipe Proyek
          </h1>
          <p className="text-xs text-muted-foreground">
            Klasifikasi proyek pekerjaan fisik infrastruktur kebun, pengadaan material, dan pekerjaan terpadu.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Tipe Proyek
        </Button>
      </div>

      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari kode atau tipe proyek..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {filtered.length} Tipe Terdaftar
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Kode Tipe</TableHead>
                <TableHead className="w-[240px]">Nama Tipe Proyek</TableHead>
                <TableHead className="min-w-[280px]">Ruang Lingkup & Deskripsi</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Status</TableHead>
                <TableHead className="w-[130px] whitespace-nowrap">Diperbarui</TableHead>
                <TableHead className="w-[170px] text-right whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs p-0">
                    <EmptyState
                      title="Tidak ada tipe proyek yang cocok"
                      description="Ubah kata kunci pencarian Anda."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-mono font-bold text-foreground whitespace-nowrap">
                      {item.code}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground whitespace-nowrap">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.description}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {formatIDDate(item.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(item)}
                          className="h-7 text-xs px-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(item)}
                          className={`h-7 text-xs px-2 ${
                            item.status === "Active"
                              ? "text-amber-600 hover:text-amber-700"
                              : "text-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          {item.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(item)}
                          className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingItem ? "Ubah Tipe Proyek" : "Tambah Tipe Proyek Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Klasifikasi jenis kegiatan teknik perkebunan untuk standarisasi alur AFCE.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Kode Tipe <span className="text-rose-500">*</span>
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: PT-CIVIL"
                className="font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama Tipe Proyek <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Pekerjaan Sipil Jalan & Jembatan"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Ruang Lingkup & Deskripsi
              </label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan jenis pekerjaan fisik atau belanja modal yang termasuk..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Tipe Proyek"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-rose-600">Hapus Tipe Proyek</DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus tipe proyek{" "}
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
              {isDeleting ? "Menghapus..." : "Hapus Tipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
