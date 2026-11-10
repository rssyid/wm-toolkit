"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Briefcase,
  Eye,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/context/app-state-context";
import { SystemRole, AppUser } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  const { users, switchDemoUser } = useAppState();

  // Selected demo user state (default: PIC Budi Santoso)
  const defaultUser = users.find((u) => u.systemRole === "PIC") || users[0];
  const [selectedUserId, setSelectedUserId] = useState<string>(defaultUser?.id || "usr-1");
  const [selectedRole, setSelectedRole] = useState<SystemRole>(defaultUser?.systemRole || "PIC");
  const [customEmail, setCustomEmail] = useState("");
  const [password, setPassword] = useState("wmtoolkit2026");
  const [isManualInput, setIsManualInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Quick profiles for 1-click select
  const quickProfiles: {
    role: SystemRole;
    userId: string;
    title: string;
    name: string;
    jabatan: string;
    icon: typeof ShieldCheck;
    badgeClass: string;
    description: string;
  }[] = [
    {
      role: "ADMIN",
      userId: "usr-3",
      title: "Administrator HO",
      name: "Dr. Raden Haryo, M.M.",
      jabatan: "Direktorat HO / Administrator Sistem",
      icon: ShieldCheck,
      badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300",
      description: "Akses penuh kelola Master Data, Matriks Persetujuan & Konfigurasi Sistem.",
    },
    {
      role: "PIC",
      userId: "usr-1",
      title: "PIC Proyek / EM",
      name: "Budi Santoso, S.T.",
      jabatan: "PIC Proyek / Estate Manager",
      icon: Briefcase,
      badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
      description: "Input & kelola PR, PO, GR, BAST, USPK, SPK, kurva S, log harian & dokumen.",
    },
    {
      role: "VIEWER",
      userId: "usr-6",
      title: "Auditor / Stakeholder",
      name: "Ir. Joko Prasetyo",
      jabatan: "Stakeholder Pemantau Lapangan",
      icon: Eye,
      badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
      description: "Akses pantau read-only untuk pengawasan berkala proyek teknis.",
    },
  ];

  const handleSelectQuick = (userId: string, role: SystemRole) => {
    setSelectedUserId(userId);
    setSelectedRole(role);
    setIsManualInput(false);
    setPassword("wmtoolkit2026");
  };

  const currentUserSelected = users.find((u) => u.id === selectedUserId) || defaultUser;
  const targetEmail = isManualInput ? customEmail : (currentUserSelected?.email || "budi.santoso@perkebunan.co.id");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: targetEmail,
        password: password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Gagal masuk: Email atau kata sandi tidak valid.");
        setIsLoading(false);
        return;
      }

      // Sync demo user profile for backward-compatible UI state
      if (currentUserSelected) {
        switchDemoUser(currentUserSelected, selectedRole);
      }

      toast.success(`Selamat datang kembali, ${currentUserSelected?.name || targetEmail}!`);
      router.push(callbackUrl);
      router.refresh();
    } catch {
      // Fallback in case of network issue
      if (currentUserSelected) {
        switchDemoUser(currentUserSelected, selectedRole);
      }
      toast.success(`Selamat datang di sesi lokal, ${currentUserSelected?.name}!`);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-radial from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Brand & Title */}
      <div className="w-full max-w-xl text-center mb-6 space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-xl shadow-md mb-2">
          WM
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          WM-Toolkit
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Sistem Pencatatan & Monitoring Proyek Teknis Perkebunan Kelapa Sawit Berbasis SAP
        </p>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-xl shadow-xl border-border/80">
        <CardHeader className="p-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Masuk ke Aplikasi (NextAuth Credentials)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Pilih profil peran cepat atau masukkan email & kata sandi internal.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300">
              Online Multi-User
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Quick Profile Cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              1. Pilih Peran Demo Cepat:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {quickProfiles.map((qp) => {
                const isSelected = !isManualInput && selectedUserId === qp.userId && selectedRole === qp.role;
                const Icon = qp.icon;

                return (
                  <button
                    key={qp.role}
                    type="button"
                    onClick={() => handleSelectQuick(qp.userId, qp.role)}
                    className={cn(
                      "flex flex-col text-left p-3 rounded-lg border transition-all text-xs relative",
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-border hover:border-muted-foreground/40 bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn(
                        "w-7 h-7 rounded-md flex items-center justify-center",
                        isSelected ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <Badge variant="outline" className={cn("text-[9px] font-bold px-1.5 py-0 border", qp.badgeClass)}>
                        {qp.role}
                      </Badge>
                    </div>

                    <span className="font-bold text-foreground text-xs">{qp.title}</span>
                    <span className="text-[11px] text-muted-foreground truncate mt-0.5">{qp.name}</span>
                    <p className="text-[10px] text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed">
                      {qp.description}
                    </p>

                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form details */}
          <form onSubmit={handleLogin} className="space-y-3.5 pt-2 border-t">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                2. Kredensial Pengguna:
              </label>
              <button
                type="button"
                onClick={() => setIsManualInput(!isManualInput)}
                className="text-[11px] text-emerald-600 hover:underline font-medium"
              >
                {isManualInput ? "Gunakan Pilihan Preset" : "Ketik Email Manual"}
              </button>
            </div>

            {!isManualInput ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Nama Akun Terpilih</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Role: <strong className="text-foreground">{selectedRole}</strong>
                  </span>
                </label>

                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    const uid = e.target.value;
                    setSelectedUserId(uid);
                    const u = users.find((usr) => usr.id === uid);
                    if (u?.systemRole) setSelectedRole(u.systemRole);
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — ({u.systemRole || "PIC"}) • {u.role}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Email Pengguna</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => {
                      if (!isManualInput) setIsManualInput(true);
                      setCustomEmail(e.target.value);
                    }}
                    placeholder="nama@perkebunan.co.id"
                    className="pl-8 text-xs h-8 font-mono text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Kata Sandi (Default: wmtoolkit2026)</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-8 text-xs h-8"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md gap-2"
            >
              {isLoading ? (
                <span>Memverifikasi Sesi...</span>
              ) : (
                <>
                  <span>Masuk sebagai {!isManualInput ? currentUserSelected?.name : targetEmail}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="p-4 bg-muted/20 border-t flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
            <span>Kredensial diverifikasi di database Neon PostgreSQL via NextAuth JWT session.</span>
          </div>
        </CardFooter>
      </Card>

      <p className="text-[11px] text-muted-foreground mt-6 text-center">
        © 2026 WM-Toolkit &bull; Proyek Teknis & Pemantauan Perkebunan Sawit Berkelanjutan
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">
          Memuat sesi login...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
