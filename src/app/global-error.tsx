"use client";

import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50 dark:bg-slate-950 font-sans">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Kesalahan Sistem Global
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
          {error.message || "Aplikasi mengalami kendala kritis. Silakan muat ulang."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="h-8 px-4 rounded-md text-xs font-semibold bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 flex items-center gap-1.5"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Muat Ulang Aplikasi
        </button>
      </body>
    </html>
  );
}
