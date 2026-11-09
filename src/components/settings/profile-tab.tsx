"use client";

import React, { useState } from "react";
import { Camera, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { AFCEApprovalRole } from "@/types";
import { toast } from "sonner";

export function ProfileTab() {
  const { locations, userProfile, updateUserProfile } = useAppState();

  const [fullName, setFullName] = useState(userProfile.fullName);
  const [email, setEmail] = useState(userProfile.email);
  const [username, setUsername] = useState(userProfile.username);
  const [role, setRole] = useState(userProfile.role);
  const [timeZone, setTimeZone] = useState(userProfile.timeZone);
  const [selectedLocation, setSelectedLocation] = useState(userProfile.selectedLocation);
  const [bio, setBio] = useState(userProfile.bio);

  // Sync if context updates
  React.useEffect(() => {
    setFullName(userProfile.fullName);
    setEmail(userProfile.email);
    setUsername(userProfile.username);
    setRole(userProfile.role);
    setTimeZone(userProfile.timeZone);
    setSelectedLocation(userProfile.selectedLocation);
    setBio(userProfile.bio);
  }, [userProfile]);

  const handleSave = () => {
    updateUserProfile({
      fullName,
      email,
      username,
      role: role as AFCEApprovalRole | "Procurement Officer",
      timeZone: timeZone as "WIB" | "WITA" | "WIT",
      selectedLocation,
      bio,
    });
    toast.success("Profil operasional berhasil diperbarui & disimpan!");
  };

  const handleReset = () => {
    setFullName(userProfile.fullName);
    setEmail(userProfile.email);
    setUsername(userProfile.username);
    setRole(userProfile.role);
    setTimeZone(userProfile.timeZone);
    setSelectedLocation(userProfile.selectedLocation);
    setBio(userProfile.bio);
    toast.info("Perubahan profil dibatalkan");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="p-5 border-b bg-card">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Profil Pengguna
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola rincian identitas akun, jabatan operasional, kontak kedinasan, dan penugasan unit perkebunan.
        </p>
      </div>

      {/* Form Content - 2-Column Rows */}
      <div className="divide-y text-xs">
        {/* Row 1: Foto Profil */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Foto Profil</span>
            <span className="text-[11px] text-muted-foreground">
              Ditampilkan pada catatan persetujuan AFCE, riwayat progres, dan log aktivitas.
            </span>
          </div>
          <div className="md:w-2/3 flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-emerald-500/20 shadow-xs">
              <AvatarFallback className="bg-emerald-600 text-white font-semibold text-sm">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 shadow-xs"
                onClick={() => toast.info("Fitur unggah avatar terhubung ke penyimpanan lokal browser")}
              >
                <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                Ganti Foto
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
                onClick={() => toast.info("Avatar diatur kembali ke inisial nama")}
              >
                <X className="w-3.5 h-3.5" />
                Hapus
              </Button>
            </div>
          </div>
        </div>

        {/* Row 2: Nama Lengkap */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Nama Lengkap</span>
            <span className="text-[11px] text-muted-foreground">
              Nama lengkap beserta gelar resmi untuk pengesahan dokumen proyek.
            </span>
          </div>
          <div className="md:w-2/3">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-9 text-xs max-w-lg"
              placeholder="Contoh: Budi Santoso, S.T."
            />
          </div>
        </div>

        {/* Row 3: Alamat Email */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-xs">Alamat Email</span>
              <Badge
                variant="outline"
                className="text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1 py-0 px-1.5"
              >
                <CheckCircle2 className="w-2.5 h-2.5" /> Terverifikasi
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Alamat email SSO holding untuk menerima tembusan PR, PO, dan approval.
            </span>
          </div>
          <div className="md:w-2/3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-xs max-w-lg font-mono"
              placeholder="nama@perkebunan.co.id"
            />
          </div>
        </div>

        {/* Row 4: Username / ID Pengguna */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">ID Pengguna (Username)</span>
            <span className="text-[11px] text-muted-foreground">
              Pengenal akun unik untuk tag penugasan inspeksi dan histori revisi.
            </span>
          </div>
          <div className="md:w-2/3">
            <div className="flex items-center max-w-lg rounded-md border bg-background shadow-xs focus-within:ring-1 focus-within:ring-ring">
              <span className="px-3 text-xs text-muted-foreground select-none bg-muted/40 border-r py-2">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder="username"
              />
            </div>
          </div>
        </div>

        {/* Row 5: Detail Penugasan & Waktu */}
        <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Detail Penugasan Operasional</span>
            <span className="text-[11px] text-muted-foreground">
              Tingkat wewenang otorisasi AFCE, zona waktu server, dan penempatan unit.
            </span>
          </div>
          <div className="md:w-2/3 space-y-3.5 max-w-lg">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Peran & Jabatan Approval (Persona Simulator)
                </label>
                <Badge variant="outline" className="text-[10px] font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 py-0">
                  Wewenang Aktif
                </Badge>
              </div>
              <SearchableSelect
                value={role}
                onValueChange={(val) => setRole(val as any)}
                placeholder="Pilih Peran"
                searchPlaceholder="Cari peran..."
                triggerClassName="h-9 text-xs"
                options={[
                  { value: "Manager Estate", label: "Manager Estate (Tingkat 1 - ≤ 100 Juta)" },
                  { value: "Manager Area", label: "Manager Area (Tingkat 2 - 100 s.d 500 Juta)" },
                  { value: "Head Office", label: "Head Office / Direksi (Tingkat 3 - > 500 Juta)" },
                  { value: "Procurement Officer", label: "Procurement Officer (Rilis PR/PO & Vendor)" },
                ]}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Peran ini menentukan wewenang simulasi approval Anda pada alur dokumen AFCE di Workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Zona Waktu Kerja
                </label>
                <SearchableSelect
                  value={timeZone}
                  onValueChange={(val) => setTimeZone(val as "WIB" | "WITA" | "WIT")}
                  placeholder="Zona Waktu"
                  searchPlaceholder="Cari zona waktu..."
                  triggerClassName="h-9 text-xs"
                  options={[
                    { value: "WIB", label: "WIB (UTC+07:00) • Sumatera/Jawa" },
                    { value: "WITA", label: "WITA (UTC+08:00) • Kalimantan/Sulawesi" },
                    { value: "WIT", label: "WIT (UTC+09:00) • Maluku/Papua" },
                  ]}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Unit Kerja / Kebun Terdaftar
                </label>
                <SearchableSelect
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                  placeholder="Pilih Kebun"
                  searchPlaceholder="Cari kebun..."
                  triggerClassName="h-9 text-xs"
                  options={[
                    ...locations.map((loc) => ({
                      value: loc.name,
                      label: loc.name,
                      subLabel: loc.district,
                    })),
                    { value: "Kantor Direksi Medan", label: "Kantor Direksi Medan" },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 6: Bio & Catatan Penugasan */}
        <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="md:w-1/3">
            <span className="font-medium text-foreground block text-xs">Catatan Lingkup Kerja (Bio)</span>
            <span className="text-[11px] text-muted-foreground">
              Keterangan ringkas deskripsi tanggung jawab teknik untuk referensi tim internal.
            </span>
          </div>
          <div className="md:w-2/3 max-w-lg">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="text-xs resize-none"
              placeholder="Tulis ringkasan penugasan Anda..."
            />
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 bg-muted/20 border-t flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-8 text-xs"
        >
          Batal
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium"
        >
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}
