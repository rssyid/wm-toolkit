"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  Shield,
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
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppState } from "@/context/app-state-context";
import { AppUser } from "@/types";
import { formatIDDate } from "@/lib/utils";
import { toast } from "sonner";

export default function MasterDataUsersPage() {
  const { users, addMasterDataUser, updateMasterDataUser, deleteMasterDataUser } = useAppState();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [editingItem, setEditingItem] = useState<AppUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<any>("Manager Estate");
  const [estateName, setEstateName] = useState("Kebun Sei Silau");

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName("");
    setEmail("@perkebunan.co.id");
    setRole("Estate Engineer");
    setEstateName("Kebun Sei Silau");
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingItem(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setEstateName(user.estateName || "");
    setDialogOpen(true);
  };

  const handleToggleStatus = async (user: AppUser) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    const ok = await updateMasterDataUser(user.id, { status: newStatus });
    if (ok) {
      toast.success(`Status user ${user.name} diubah menjadi ${newStatus}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const ok = await deleteMasterDataUser(deleteTarget.id);
      if (ok) {
        toast.success(`Pengguna ${deleteTarget.name} berhasil dihapus.`);
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Nama dan email pengguna wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const ok = await updateMasterDataUser(editingItem.id, {
          name: name.trim(),
          email: email.trim(),
          role,
          estateName: estateName.trim(),
        });
        if (ok) {
          toast.success("Data pengguna berhasil diperbarui!");
          setDialogOpen(false);
        }
      } else {
        const ok = await addMasterDataUser({
          name: name.trim(),
          email: email.trim(),
          role,
          estateName: estateName.trim(),
          status: "Active",
        });
        if (ok) {
          toast.success("Pengguna baru berhasil ditambahkan!");
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
            Daftar Pengguna & Otoritas Peran (Users & Roles)
          </h1>
          <p className="text-xs text-muted-foreground">
            Manajemen personil internal, hak akses persetujuan AFCE, dan otorisasi rilis PR/PO.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Pengguna Baru
        </Button>
      </div>

      {/* Table Card */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama, email, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {filteredUsers.length} Pengguna Terdaftar
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Nama Lengkap</TableHead>
                <TableHead className="w-[180px]">Email</TableHead>
                <TableHead className="w-[140px] whitespace-nowrap">Peran (Role)</TableHead>
                <TableHead className="w-[140px] whitespace-nowrap">Penugasan Kebun</TableHead>
                <TableHead className="w-[85px] whitespace-nowrap">Status</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Diperbarui</TableHead>
                <TableHead className="w-[150px] text-right whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs p-0">
                    <EmptyState
                      title="Tidak ada pengguna yang cocok"
                      description="Ubah kata kunci pencarian Anda."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-semibold text-foreground whitespace-nowrap">
                      {u.name}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap text-[11px]">
                      {u.email}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 whitespace-nowrap inline-flex items-center">
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{u.estateName || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {formatIDDate(u.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(u)}
                          className="h-7 text-xs px-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(u)}
                          className={`h-7 text-xs px-2 ${
                            u.status === "Active"
                              ? "text-amber-600 hover:text-amber-700"
                              : "text-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          {u.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(u)}
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
              {editingItem ? "Ubah Data Pengguna" : "Tambah Pengguna Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atur hak akses otorisasi persetujuan dan rilis transaksi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ir. Budi Santoso"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Alamat Email Resmi <span className="text-rose-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perkebunan.co.id"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Peran Otoritas (Role)
                </label>
                <SearchableSelect
                  value={role}
                  onValueChange={(val: any) => setRole(val)}
                  placeholder="Pilih Role..."
                  searchPlaceholder="Cari peran..."
                  options={[
                    { value: "Manager Estate", label: "Manager Estate" },
                    { value: "Manager Area", label: "Manager Area" },
                    { value: "Head Office", label: "Head Office" },
                    { value: "Estate Engineer", label: "Estate Engineer" },
                    { value: "Procurement Officer", label: "Procurement Officer" },
                  ]}
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Unit Kerja / Kebun
                </label>
                <Input
                  value={estateName}
                  onChange={(e) => setEstateName(e.target.value)}
                  placeholder="Kebun Sei Silau"
                />
              </div>
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
              {isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-rose-600">Hapus Data Pengguna</DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus akun pengguna{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong> ({deleteTarget?.email}) dari database?
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
              {isDeleting ? "Menghapus..." : "Hapus Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
