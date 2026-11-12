"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Users2,
  Lock,
  Check,
  Minus,
  ChevronLeft,
  Search,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import { toast } from "sonner";

interface PermissionRow {
  module: string;
  action: string;
  description: string;
  admin: boolean;
  pic: boolean;
  approver: boolean;
  viewer: boolean;
}

const PERMISSION_MATRIX: { category: string; permissions: PermissionRow[] }[] = [
  {
    category: "1. Manajemen Proyek & Jadwal",
    permissions: [
      {
        module: "Proyek",
        action: "Buat Proyek Baru",
        description: "Inisiasi proyek teknik baru, kode proyek, klasifikasi, dan penugasan kebun.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "Proyek",
        action: "Ubah Informasi & Target Proyek",
        description: "Memperbarui data teknis, target volume fisik, dan tanggal perencanaan proyek.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "Jadwal",
        action: "Revisi Jadwal & Kurva S",
        description: "Mencatat revisi baseline timeline dan deviasi durasi pelaksanaan pekerjaan.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "Proyek",
        action: "Hapus & Pulihkan Proyek",
        description: "Menghapus (soft delete) dan merestorasi proyek dari tempat sampah sistem.",
        admin: true,
        pic: false,
        approver: false,
        viewer: false,
      },
    ],
  },
  {
    category: "2. Dokumen & Persetujuan AFCE",
    permissions: [
      {
        module: "AFCE",
        action: "Input & Catat Dokumen AFCE",
        description: "Pencatatan nomor otorisasi belanja modal dan pagu anggaran resmi proyek.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "AFCE",
        action: "Catat Persetujuan AFCE (Evidence SAP)",
        description: "Mencatat approval resmi berjenjang berdasarkan dokumen dan data SAP.",
        admin: true,
        pic: true,
        approver: true,
        viewer: false,
      },
      {
        module: "AFCE",
        action: "Catat Penolakan / Permintaan Revisi AFCE",
        description: "Mencatat status penolakan atau instruksi revisi anggaran AFCE.",
        admin: true,
        pic: false,
        approver: true,
        viewer: false,
      },
    ],
  },
  {
    category: "3. Jalur Pengadaan Barang (PR & PO)",
    permissions: [
      {
        module: "Pengadaan Barang",
        action: "Catat Nomor PR SAP",
        description: "Mencatat rilis Purchase Requisition material sesuai standar SAP.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "Pengadaan Barang",
        action: "Catat Evaluasi Rekanan / Vendor",
        description: "Mencatat perbandingan penawaran harga dan rekomendasi supplier.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "Pengadaan Barang",
        action: "Terbitkan & Catat PO SAP",
        description: "Pencatatan nomor Purchase Order dan konfirmasi jadwal kirim rekanan.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "Pengadaan Barang",
        action: "Catat BAST & Good Receipt (GR)",
        description: "Mencatat serah terima barang fisik di kebun dan verifikasi kuantitas.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
    ],
  },
  {
    category: "4. Jalur Pengadaan Jasa (USPK & SPK)",
    permissions: [
      {
        module: "Kontrak Jasa",
        action: "Catat Usulan SPK (USPK)",
        description: "Menyusun draft ruang lingkup pekerjaan borongan teknik dan target volume.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "Kontrak Jasa",
        action: "Catat Evaluasi Teknis Vendor",
        description: "Mencatat evaluasi kesiapan alat berat, tenaga kerja, dan metode kerja.",
        admin: true,
        pic: true,
        approver: true,
        viewer: false,
      },
      {
        module: "Kontrak Jasa",
        action: "Penerbitan Kontrak SPK Rekanan",
        description: "Mencatat nomor SPK legalitas, nilai kontrak, dan periode pelaksanaan.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
    ],
  },
  {
    category: "5. Pelaksanaan Fisik & Monitoring Lapangan",
    permissions: [
      {
        module: "Progress",
        action: "Input Laporan Progress Harian & Mingguan",
        description: "Mencatat realisasi volume fisik lapangan, persentase kemajuan, dan kendala cuaca.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "Dokumentasi",
        action: "Unggah Foto Dokumentasi Lapangan",
        description: "Menyimpan foto fisik milestone 0%, 50%, 100% dan dokumen pendukung.",
        admin: true,
        pic: true,
        approver: false,
        viewer: false,
      },
      {
        module: "Kolaborasi",
        action: "Beri Komentar & Mention Pengguna",
        description: "Berpartisipasi dalam diskusi teknis proyek dan koordinasi internal.",
        admin: true,
        pic: true,
        approver: true,
        viewer: true,
      },
      {
        module: "Pemantauan",
        action: "Lihat Dashboard, Kurva S, & Unduh Laporan",
        description: "Akses monitoring visual, grafik performa, dan ekspor data laporan.",
        admin: true,
        pic: true,
        approver: true,
        viewer: true,
      },
    ],
  },
  {
    category: "6. Master Data & Tata Kelola Sistem",
    permissions: [
      {
        module: "Master Data",
        action: "Kelola Struktur Organisasi Kebun (Estate/Blok)",
        description: "Menambah dan mengubah data wilayah, PT, kebun, dan blok HGU kebun.",
        admin: true,
        pic: false,
        approver: false,
        viewer: false,
      },
      {
        module: "Master Data",
        action: "Kelola Katalog Material & Supplier",
        description: "Mengelola database material SAP dan direktori rekanan vendor.",
        admin: true,
        pic: false,
        approver: false,
        viewer: false,
      },
      {
        module: "Master Data",
        action: "Konfigurasi Matriks Approval AFCE",
        description: "Mengatur aturan tier nilai anggaran dan batasan wewenang level 1 - 9.",
        admin: true,
        pic: false,
        approver: false,
        viewer: false,
      },
      {
        module: "RBAC & User",
        action: "Kelola Akun Pengguna & Hak Akses (RBAC)",
        description: "Menetapkan peran Admin, PIC, Approver, Viewer, dan mengelola keamanan.",
        admin: true,
        pic: false,
        approver: false,
        viewer: false,
      },
      {
        module: "Audit & Sistem",
        action: "Akses Riwayat Audit Log & Maintenance",
        description: "Memantau rekam jejak transaksi seluruh personil dan pemeliharaan database.",
        admin: true,
        pic: false,
        approver: false,
        viewer: false,
      },
    ],
  },
];

const ROLES_INFO: {
  role: SystemRole;
  title: string;
  badgeClass: string;
  borderClass: string;
  desc: string;
}[] = [
  {
    role: "ADMIN",
    title: "Administrator WM-Toolkit",
    badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200",
    borderClass: "border-purple-200 dark:border-purple-900/50",
    desc: "Akses penuh tanpa batasan ke seluruh modul proyek, konfigurasi master data kebun, matriks approval, pengaturan hak akses RBAC, dan rekam audit log sistem.",
  },
  {
    role: "PIC",
    title: "Person in Charge (Pengelola Proyek)",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200",
    borderClass: "border-emerald-200 dark:border-emerald-900/50",
    desc: "Bertanggung jawab atas inisiasi proyek kebun, pencatatan rilis PR, evaluasi vendor, penerbitan PO, pengajuan USPK/SPK, dan update berkala progress fisik lapangan.",
  },
  {
    role: "APPROVER",
    title: "Pejabat Persetujuan (Approver AFCE)",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200",
    borderClass: "border-amber-200 dark:border-amber-900/50",
    desc: "Otoritas verifikasi dan pencatatan persetujuan dokumen AFCE berdasarkan data resmi SAP, meninjau evaluasi teknis rekanan, dan memantau status proyek.",
  },
  {
    role: "VIEWER",
    title: "Pemantau Sistem (Read-Only)",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200",
    borderClass: "border-blue-200 dark:border-blue-900/50",
    desc: "Akses read-only untuk memantau performa dashboard eksekutif, kurva S, jadwal Gantt, dan dokumen teknis tanpa memiliki hak menambah, mengubah, atau menghapus data.",
  },
];

export default function MasterDataRbacPage() {
  const { users, updateMasterDataUser } = useAppState();

  const [searchUser, setSearchUser] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const q = searchUser.toLowerCase();
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

  const handleRoleChange = async (user: AppUser, newRole: SystemRole) => {
    setUpdatingUserId(user.id);
    try {
      const ok = await updateMasterDataUser(user.id, {
        role: newRole,
        systemRole: newRole,
      });
      if (ok) {
        toast.success(`Peran ${user.name} berhasil diubah menjadi ${newRole}`);
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleCount = (role: SystemRole) => {
    return users.filter((u) => {
      const r = (u.systemRole || u.role || "").toUpperCase();
      return r === role && u.status === "Active";
    }).length;
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
            Manajemen Hak Akses & Otoritas Peran (RBAC)
          </h1>
          <p className="text-xs text-muted-foreground">
            Konfigurasi matriks wewenang berbasis peran (Admin, PIC, Approver, Viewer) dan penetapan peran pengguna internal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/master-data/users">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Users2 className="w-3.5 h-3.5" /> Kelola Data Pengguna
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Role Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES_INFO.map((r) => {
          const count = getRoleCount(r.role);
          const usersWithRole = users.filter((u) => {
            const roleStr = (u.systemRole || u.role || "").toUpperCase();
            return roleStr === r.role && u.status === "Active";
          });

          return (
            <Card key={r.role} className={`shadow-xs border ${r.borderClass}`}>
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 border ${r.badgeClass}`}>
                    {r.role}
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">
                    {count} Pengguna Aktif
                  </span>
                </div>
                <CardTitle className="text-xs font-bold text-foreground mt-2">
                  {r.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2.5">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {r.desc}
                </p>
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[10px] font-medium text-muted-foreground block mb-1">
                    Personil Aktif:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {usersWithRole.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground italic">Belum ada personil</span>
                    ) : (
                      usersWithRole.slice(0, 3).map((u) => (
                        <span
                          key={u.id}
                          className="text-[10px] bg-muted/60 text-foreground px-1.5 py-0.5 rounded border text-ellipsis overflow-hidden max-w-[120px] whitespace-nowrap"
                          title={`${u.name} (${u.email})`}
                        >
                          {u.name.split(",")[0]}
                        </span>
                      ))
                    )}
                    {usersWithRole.length > 3 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{usersWithRole.length - 3} lainnya
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="matrix" className="text-xs gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Matriks Hak Akses Modul
          </TabsTrigger>
          <TabsTrigger value="assignment" className="text-xs gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Penetapan Peran Pengguna Cepat
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Matriks Hak Akses Modul */}
        <TabsContent value="matrix" className="space-y-4">
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 border-b bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Matriks Otoritas Sistem Seluruh Modul (Role-Permission Matrix)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pemetaan wewenang operasional untuk masing-masing peran pada alur pencatatan dan monitoring proyek.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" /> Memiliki Wewenang
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Minus className="w-3.5 h-3.5" /> Tidak Memiliki Akses
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[280px]">Modul & Aksi Operasional</TableHead>
                      <TableHead className="min-w-[240px]">Deskripsi Kebijakan Wewenang</TableHead>
                      <TableHead className="w-[100px] text-center bg-purple-500/5">
                        <span className="font-bold text-purple-700 dark:text-purple-300">ADMIN</span>
                      </TableHead>
                      <TableHead className="w-[100px] text-center bg-emerald-500/5">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">PIC</span>
                      </TableHead>
                      <TableHead className="w-[100px] text-center bg-amber-500/5">
                        <span className="font-bold text-amber-700 dark:text-amber-300">APPROVER</span>
                      </TableHead>
                      <TableHead className="w-[100px] text-center bg-blue-500/5">
                        <span className="font-bold text-blue-700 dark:text-blue-300">VIEWER</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSION_MATRIX.map((cat, catIdx) => (
                      <React.Fragment key={cat.category}>
                        <TableRow className="bg-muted/40 hover:bg-muted/40 font-semibold text-xs border-y">
                          <TableCell colSpan={6} className="py-2 text-foreground font-bold">
                            {cat.category}
                          </TableCell>
                        </TableRow>
                        {cat.permissions.map((p, pIdx) => (
                          <TableRow key={`${catIdx}-${pIdx}`} className="hover:bg-muted/20 text-xs">
                            <TableCell className="font-semibold text-foreground whitespace-nowrap">
                              <span className="text-[10px] text-muted-foreground block font-normal">
                                {p.module}
                              </span>
                              {p.action}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-[11px] leading-relaxed">
                              {p.description}
                            </TableCell>
                            <TableCell className="text-center bg-purple-500/5">
                              {p.admin ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 text-muted-foreground">
                                  <Minus className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center bg-emerald-500/5">
                              {p.pic ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 text-muted-foreground">
                                  <Minus className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center bg-amber-500/5">
                              {p.approver ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 text-muted-foreground">
                                  <Minus className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center bg-blue-500/5">
                              {p.viewer ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" title="Read-Only">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 text-muted-foreground">
                                  <Minus className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Penetapan Peran Pengguna Cepat */}
        <TabsContent value="assignment" className="space-y-4">
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Penetapan Peran Pengguna (Quick User Role Assignment)
                </CardTitle>
                <CardDescription className="text-xs">
                  Ubah peran sistem masing-masing personil secara langsung tanpa perlu membuka dialog edit individu.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari personil, email, kebun..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-9 h-8 text-xs bg-background"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Nama Lengkap & Email</TableHead>
                    <TableHead className="w-[160px]">Jabatan Kedinasan</TableHead>
                    <TableHead className="w-[140px]">Penugasan Kebun</TableHead>
                    <TableHead className="w-[180px]">Peran Sistem (Role)</TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-xs p-0">
                        <EmptyState
                          title="Tidak ada pengguna yang cocok"
                          description="Gunakan kata kunci pencarian yang lain."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const currentRole = (u.systemRole || u.role || "PIC").toUpperCase() as SystemRole;
                      const isUpdating = updatingUserId === u.id;

                      return (
                        <TableRow key={u.id} className="hover:bg-muted/30 text-xs">
                          <TableCell className="font-semibold text-foreground whitespace-nowrap">
                            <div>{u.name}</div>
                            <div className="font-mono text-muted-foreground text-[11px] font-normal">
                              {u.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground whitespace-nowrap">
                            {u.jabatan || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {u.estateName || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Select
                              value={currentRole}
                              onValueChange={(val: SystemRole) => handleRoleChange(u, val)}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="h-7 w-[160px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">
                                  <span className="font-semibold text-purple-700 dark:text-purple-300">ADMIN</span>
                                </SelectItem>
                                <SelectItem value="PIC">
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">PIC</span>
                                </SelectItem>
                                <SelectItem value="APPROVER">
                                  <span className="font-semibold text-amber-700 dark:text-amber-300">APPROVER</span>
                                </SelectItem>
                                <SelectItem value="VIEWER">
                                  <span className="font-semibold text-blue-700 dark:text-blue-300">VIEWER</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge status={u.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
