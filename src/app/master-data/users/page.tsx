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
  Briefcase,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppState } from "@/context/app-state-context";
import { AppUser, SystemRole } from "@/types";
import { formatIDDate } from "@/lib/utils";
import { toast } from "sonner";

function getRoleBadge(roleStr: string) {
  const normalized = (roleStr || "").toUpperCase();
  if (normalized.includes("ADMIN")) {
    return {
      label: "ADMIN",
      className: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200",
    };
  }
  if (normalized.includes("APPROVER")) {
    return {
      label: "APPROVER",
      className: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200",
    };
  }
  if (normalized.includes("VIEWER")) {
    return {
      label: "VIEWER",
      className: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200",
    };
  }
  return {
    label: "PIC",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200",
  };
}

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
  const [role, setRole] = useState<SystemRole>("PIC");
  const [jabatan, setJabatan] = useState("");
  const [estateName, setEstateName] = useState("Kebun Sei Silau");

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const roleText = (u.systemRole || u.role || "").toLowerCase();
    const jabatanText = (u.jabatan || "").toLowerCase();
    const estateText = (u.estateName || "").toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      roleText.includes(q) ||
      jabatanText.includes(q) ||
      estateText.includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName("");
    setEmail("@perkebunan.co.id");
    setRole("PIC");
    setJabatan("Estate Engineer");
    setEstateName("Kebun Sei Silau");
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingItem(user);
    setName(user.name);
    setEmail(user.email);
    const r = (user.systemRole || user.role || "PIC").toUpperCase();
    const validRole: SystemRole = r.includes("ADMIN")
      ? "ADMIN"
      : r.includes("APPROVER")
      ? "APPROVER"
      : r.includes("VIEWER")
      ? "VIEWER"
      : "PIC";
    setRole(validRole);
    setJabatan(
      user.jabatan ||
        (typeof user.role === "string" &&
        !["ADMIN", "PIC", "APPROVER", "VIEWER"].includes(user.role.toUpperCase())
          ? user.role
          : "") ||
        ""
    );
    setEstateName(user.estateName || "");
    setDialogOpen(true);
  };

  const handleToggleStatus = async (user: AppUser) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    const ok = await updateMasterDataUser(user.id, { status: newStatus });
    if (ok) {
      toast.success(`Status pengguna ${user.name} diubah menjadi ${newStatus}`);
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
          systemRole: role,
          jabatan: jabatan.trim() || "-",
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
          systemRole: role,
          jabatan: jabatan.trim() || "-",
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
            Manajemen personil internal, otorisasi peran sistem (Admin, PIC, Approver, Viewer), dan penugasan kebun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/master-data/rbac">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Atur Matriks RBAC
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Pengguna Baru
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama, email, role, atau jabatan..."
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
                <TableHead className="w-[120px] whitespace-nowrap">Peran (Role)</TableHead>
                <TableHead className="w-[150px] whitespace-nowrap">Jabatan Kedinasan</TableHead>
                <TableHead className="w-[140px] whitespace-nowrap">Penugasan Kebun</TableHead>
                <TableHead className="w-[85px] whitespace-nowrap">Status</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Diperbarui</TableHead>
                <TableHead className="w-[150px] text-right whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs p-0">
                    <EmptyState
                      title="Tidak ada pengguna yang cocok"
                      description="Ubah kata kunci pencarian Anda."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadge = getRoleBadge(u.systemRole || u.role);
                  return (
                    <TableRow key={u.id} className="hover:bg-muted/30 text-xs">
                      <TableCell className="font-semibold text-foreground whitespace-nowrap">
                        {u.name}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground whitespace-nowrap text-[11px]">
                        {u.email}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2 py-0.5 border ${roleBadge.className}`}
                        >
                          {roleBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground whitespace-nowrap">
                        {u.jabatan || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {u.estateName || "-"}
                      </TableCell>
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
                  );
                })
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
              Atur hak akses otorisasi peran sistem (RBAC) dan data kedinasan pengguna.
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
                placeholder="Contoh: Ir. Budi Santoso, M.M."
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

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Peran Otoritas (Role) <span className="text-rose-500">*</span>
              </label>
              <Select value={role} onValueChange={(val: SystemRole) => setRole(val)}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Pilih Peran Sistem..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <div className="flex flex-col py-0.5 text-left">
                      <span className="font-semibold text-purple-700 dark:text-purple-300">Admin</span>
                      <span className="text-[10px] text-muted-foreground">Administrator sistem (akses penuh seluruh modul & master data)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PIC">
                    <div className="flex flex-col py-0.5 text-left">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">PIC</span>
                      <span className="text-[10px] text-muted-foreground">Person in Charge (kelola proyek, PR/PO, USPK/SPK, dan progress)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="APPROVER">
                    <div className="flex flex-col py-0.5 text-left">
                      <span className="font-semibold text-amber-700 dark:text-amber-300">Approver</span>
                      <span className="text-[10px] text-muted-foreground">Pejabat persetujuan AFCE (SAP) dan evaluasi teknis</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="VIEWER">
                    <div className="flex flex-col py-0.5 text-left">
                      <span className="font-semibold text-blue-700 dark:text-blue-300">Viewer</span>
                      <span className="text-[10px] text-muted-foreground">Pemantau read-only (monitoring dashboard & dokumen tanpa hak ubah)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Peran ini menentukan wewenang RBAC pengguna dalam seluruh alur kerja proyek.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Jabatan Kedinasan
                </label>
                <Input
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Contoh: Manager Estate"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Unit Kerja / Kebun
                </label>
                <Input
                  value={estateName}
                  onChange={(e) => setEstateName(e.target.value)}
                  placeholder="Contoh: Kebun Sei Silau"
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
