"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        Terjadi Kesalahan pada Halaman
      </h2>
      <p className="text-xs text-muted-foreground max-w-md">
        {error.message || "Sistem mengalami kendala saat memuat data. Silakan coba muat ulang halaman."}
      </p>
      <Button
        onClick={() => reset()}
        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
      >
        <RefreshCcw className="w-3.5 h-3.5" />
        Muat Ulang Komponen
      </Button>
    </div>
  );
}
