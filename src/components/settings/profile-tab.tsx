"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  X,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { AFCEApprovalRole } from "@/types";
import { changeCurrentUserPasswordAction } from "@/server/actions/users";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/webp", 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Gagal membaca berkas gambar"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca berkas gambar"));
    reader.readAsDataURL(file);
  });
}

export function ProfileTab() {
  const { locations, userProfile, updateUserProfile, activeRole } = useAppState();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form States
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [email, setEmail] = useState(userProfile.email);
  const [username, setUsername] = useState(userProfile.username);
  const [role, setRole] = useState(userProfile.role);
  const [timeZone, setTimeZone] = useState(userProfile.timeZone);
  const [selectedLocation, setSelectedLocation] = useState(userProfile.selectedLocation);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  // Sync if context updates
  React.useEffect(() => {
    setFullName(userProfile.fullName);
    setEmail(userProfile.email);
    setUsername(userProfile.username);
    setRole(userProfile.role);
    setTimeZone(userProfile.timeZone);
    setSelectedLocation(userProfile.selectedLocation);
    setBio(userProfile.bio);
    setAvatarUrl(userProfile.avatarUrl || "");
  }, [userProfile]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format berkas harus berupa gambar (JPEG, PNG, atau WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto profil tidak boleh melebihi 5 MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const compressedDataUrl = await compressImage(file);
      setAvatarUrl(compressedDataUrl);
      updateUserProfile({ avatarUrl: compressedDataUrl });
      toast.success("Foto profil berhasil diperbarui!");
    } catch (err: any) {
      toast.error(err?.message || "Gagal memproses foto profil");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    updateUserProfile({ avatarUrl: "" });
    toast.info("Foto profil dihapus, kembali ke inisial nama.");
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Nama lengkap dan email tidak boleh kosong");
      return;
    }

    setIsSavingProfile(true);
    try {
      updateUserProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        role: role as AFCEApprovalRole | "Procurement Officer",
        timeZone: timeZone as "WIB" | "WITA" | "WIT",
        selectedLocation,
        bio: bio.trim(),
        avatarUrl,
      });
      toast.success("Profil akun berhasil diperbarui dan disimpan!");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetProfile = () => {
    setFullName(userProfile.fullName);
    setEmail(userProfile.email);
    setUsername(userProfile.username);
    setRole(userProfile.role);
    setTimeZone(userProfile.timeZone);
    setSelectedLocation(userProfile.selectedLocation);
    setBio(userProfile.bio);
    setAvatarUrl(userProfile.avatarUrl || "");
    toast.info("Perubahan profil dibatalkan");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Kata sandi saat ini wajib diisi");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok dengan kata sandi baru");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("Kata sandi baru tidak boleh sama dengan kata sandi saat ini");
      return;
    }

    setIsSubmittingPass(true);
    try {
      const res = await changeCurrentUserPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        toast.success(res.message || "Kata sandi akun Anda berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Gagal mengganti kata sandi");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan saat mengganti kata sandi");
    } finally {
      setIsSubmittingPass(false);
    }
  };

  const getInitials = (name: string) => {
    return (name || "U")
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Profil Pengguna */}
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

        {/* Hidden File Input for Avatar */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
          onChange={handleAvatarFileChange}
        />

        {/* Form Content - 2-Column Rows */}
        <div className="divide-y text-xs">
          {/* Row 1: Foto Profil */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="md:w-1/3">
              <span className="font-medium text-foreground block text-xs">Foto Profil (Avatar)</span>
              <span className="text-[11px] text-muted-foreground">
                Ditampilkan pada topbar aplikasi, riwayat progress, persetujuan AFCE, dan log aktivitas.
              </span>
            </div>
            <div className="md:w-2/3 flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-emerald-500/20 shadow-xs shrink-0">
                {avatarUrl ? (
                  <AvatarImage
                    src={avatarUrl}
                    alt={fullName || "Avatar"}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-emerald-600 text-white font-semibold text-base">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingAvatar}
                  className="h-8 text-xs gap-1.5 shadow-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  {avatarUrl ? "Ganti Foto" : "Unggah Foto"}
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
                    onClick={handleRemoveAvatar}
                  >
                    <X className="w-3.5 h-3.5" />
                    Hapus
                  </Button>
                )}
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
                placeholder="Contoh: Ir. Budi Santoso, M.M."
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
                Alamat email SSO resmi holding untuk notifikasi transaksi proyek.
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
                Tingkat wewenang otorisasi sistem, zona waktu server, dan penempatan unit kerja.
              </span>
            </div>
            <div className="md:w-2/3 space-y-3.5 max-w-lg">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-foreground block">
                    Peran Sistem & Hak Akses (RBAC)
                  </label>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold py-0.5 px-2 border",
                      activeRole === "ADMIN"
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-300"
                        : activeRole === "PIC"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300"
                        : activeRole === "APPROVER"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-300"
                    )}
                  >
                    {activeRole}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg border bg-muted/40 space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Jabatan Kedinasan:</span>
                    <Input
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-7 text-xs w-48 font-semibold text-foreground"
                      placeholder="Manager Estate"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium pt-1">
                    <span className="text-muted-foreground">Status Wewenang:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terdaftar di Sistem
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                  Peran sistem (Admin, PIC, Approver, Viewer) dikelola oleh Administrator holding melalui modul Master Data Pengguna.
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
                      { value: "WIB", label: "WIB (UTC+07:00) : Sumatera/Jawa" },
                      { value: "WITA", label: "WITA (UTC+08:00) : Kalimantan/Sulawesi" },
                      { value: "WIT", label: "WIT (UTC+09:00) : Maluku/Papua" },
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
                      { value: "Direktorat HO Jakarta", label: "Direktorat HO Jakarta" },
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
            onClick={handleResetProfile}
            disabled={isSavingProfile}
            className="h-8 text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium"
          >
            {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan Profil"}
          </Button>
        </div>
      </div>

      {/* Card 2: Keamanan Akun & Ganti Kata Sandi */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <div className="p-5 border-b bg-card">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Keamanan Akun & Ganti Kata Sandi
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Perbarui kata sandi akun resmi Anda untuk mengamankan akses proyek, data transaksi, dan wewenang approval.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="p-5 space-y-4 text-xs max-w-lg">
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Kata Sandi Saat Ini <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showCurrentPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama Anda"
                className="pr-9 text-xs h-9"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="pr-9 text-xs h-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="pr-9 text-xs h-9"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Kata sandi harus terdiri dari sekurang-kurangnya 6 karakter. Dianjurkan menggunakan kombinasi huruf dan angka.
          </p>

          <div className="pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingPass}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium gap-1.5"
            >
              {isSubmittingPass ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memperbarui Kata Sandi...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Perbarui Kata Sandi
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
