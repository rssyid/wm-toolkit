"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage("Silakan masukkan email dan kata sandi Anda.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: cleanEmail,
        password: password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage("Email atau kata sandi tidak cocok, atau akun Anda dinonaktifkan.");
        toast.error("Gagal masuk. Periksa kembali email dan kata sandi Anda.");
        setIsLoading(false);
        return;
      }

      toast.success("Autentikasi berhasil! Mengalihkan ke dashboard...");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi gangguan koneksi ke server autentikasi.");
      toast.error("Gagal terhubung ke server autentikasi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-radial from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Brand & Title */}
      <div className="w-full max-w-md text-center mb-6 space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-xl shadow-md mb-2">
          WM
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          WM-Toolkit
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
          Sistem Pencatatan & Monitoring Proyek Teknis Perkebunan Kelapa Sawit Berbasis SAP
        </p>
      </div>

      {/* Main Login Card */}
      <Card className="w-full max-w-md shadow-xl border-border/80">
        <CardHeader className="p-6 pb-4 border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Masuk ke Sistem
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Gunakan alamat email perkebunan dan kata sandi terdaftar Anda untuk mengakses portal kerja.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Alamat Email Kedinasan
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perkebunan.co.id"
                  className="pl-9 text-xs h-9 font-medium"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-xs h-9 font-medium"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="p-4 bg-muted/20 border-t flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 mx-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Sesi aman terenkripsi & otorisasi berbasis peran (RBAC)</span>
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
