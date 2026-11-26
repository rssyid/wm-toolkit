"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Clock, Wallet } from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import {
  formatCompactIDR,
  type PortfolioSummary,
} from "@/lib/report-portfolio-utils";

interface PortfolioExecutiveSummaryProps {
  summary: PortfolioSummary;
  isDelayedFilterActive: boolean;
  onToggleDelayedFilter: () => void;
}

export function PortfolioExecutiveSummary({
  summary,
  isDelayedFilterActive,
  onToggleDelayedFilter,
}: PortfolioExecutiveSummaryProps) {
  const poSharePct =
    summary.totalAfceValue > 0
      ? Math.min(100, (summary.totalPoValue / summary.totalAfceValue) * 100)
      : 0;
  const spkSharePct =
    summary.totalAfceValue > 0
      ? Math.min(
          Math.max(0, 100 - poSharePct),
          (summary.totalSpkValue / summary.totalAfceValue) * 100
        )
      : 0;
  const isOverBudget = summary.totalCommittedValue > summary.totalAfceValue && summary.totalAfceValue > 0;

  return (
    <section
      aria-label="Ringkasan eksekutif portofolio"
      className="grid grid-cols-1 gap-4 lg:grid-cols-12 print-avoid-break"
    >
      {/* Blok Kiri (7 kolom): Komitmen Anggaran AFCE vs PO (Barang) & SPK (Jasa) */}
      <div className="lg:col-span-7 rounded-lg border bg-card p-4 sm:p-5 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Wallet className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>Komitmen Anggaran AFCE terhadap Realisasi PO &amp; SPK</span>
            </div>
            <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {formatIDR(summary.totalAfceValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total plafon AFCE dari {summary.totalProjects} proyek pada cakupan laporan
            </p>
          </div>

          <div
            className={cn(
              "inline-flex flex-col items-start sm:items-end rounded-md border px-3 py-1.5 shrink-0",
              isOverBudget
                ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            )}
          >
            <span className="text-[11px] font-medium">Serapan Komitmen</span>
            <span className="text-lg font-bold tabular-nums leading-tight">
              {summary.overallAbsorptionPercent}%
            </span>
          </div>
        </div>

        {/* Proporsi Visual PO vs SPK terhadap AFCE */}
        <div className="space-y-2">
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-muted flex"
            role="img"
            aria-label={`Proporsi serapan PO ${Math.round(poSharePct)} persen dan SPK ${Math.round(spkSharePct)} persen dari plafon AFCE`}
          >
            {poSharePct > 0 && (
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
                style={{ width: `${poSharePct}%` }}
                title={`Komitmen PO Barang: ${formatIDR(summary.totalPoValue)}`}
              />
            )}
            {spkSharePct > 0 && (
              <div
                className="h-full bg-amber-600 dark:bg-amber-500 transition-all"
                style={{ width: `${spkSharePct}%` }}
                title={`Komitmen SPK Jasa: ${formatIDR(summary.totalSpkValue)}`}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 pt-1">
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-600 dark:bg-blue-500 shrink-0" aria-hidden="true" />
                <span>Komitmen PO (Barang)</span>
              </div>
              <p className="mt-1 text-sm font-bold text-foreground tabular-nums">
                {formatCompactIDR(summary.totalPoValue)}
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums truncate">
                {formatIDR(summary.totalPoValue)}
              </p>
            </div>

            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-600 dark:bg-amber-500 shrink-0" aria-hidden="true" />
                <span>Komitmen SPK (Jasa)</span>
              </div>
              <p className="mt-1 text-sm font-bold text-foreground tabular-nums">
                {formatCompactIDR(summary.totalSpkValue)}
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums truncate">
                {formatIDR(summary.totalSpkValue)}
              </p>
            </div>

            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-400 dark:bg-slate-500 shrink-0" aria-hidden="true" />
                <span>Sisa Plafon AFCE</span>
              </div>
              <p
                className={cn(
                  "mt-1 text-sm font-bold tabular-nums",
                  summary.totalRemainingAfceValue < 0
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-foreground"
                )}
              >
                {formatCompactIDR(summary.totalRemainingAfceValue)}
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums truncate">
                {formatIDR(summary.totalRemainingAfceValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blok Kanan (5 kolom): Kesehatan Eksekusi, Progres & Peringatan EWS */}
      <div className="lg:col-span-5 rounded-lg border bg-card p-4 sm:p-5 flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              Kesehatan Eksekusi &amp; Risiko Jadwal
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {summary.avgProgress}%
              </span>
              <span className="text-xs text-muted-foreground">
                rata-rata progres fisik
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleDelayedFilter}
            aria-pressed={isDelayedFilterActive}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:pointer-events-none",
              summary.delayedCount > 0
                ? isDelayedFilterActive
                  ? "border-rose-600 bg-rose-700 text-white"
                  : "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            )}
            title="Klik untuk memfilter proyek dengan peringatan EWS atau terlambat"
          >
            {summary.delayedCount > 0 ? (
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <div className="leading-tight">
              <div className="text-xs font-bold tabular-nums">
                {summary.delayedCount} Proyek EWS
              </div>
              <div className="text-[10px] opacity-90">
                {summary.delayedCount > 0
                  ? isDelayedFilterActive
                    ? "Filter aktif (klik batal)"
                    : "Klik untuk fokus"
                  : "Jadwal terkendali"}
              </div>
            </div>
          </button>
        </div>

        {/* Breakdown Status Proyek */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border px-2.5 py-2">
            <span className="text-[11px] text-muted-foreground block">Berjalan</span>
            <span className="text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums">
              {summary.inProgressCount}
            </span>
          </div>
          <div className="rounded-md border px-2.5 py-2">
            <span className="text-[11px] text-muted-foreground block">Selesai</span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {summary.completedCount}
            </span>
          </div>
          <div className="rounded-md border px-2.5 py-2">
            <span className="text-[11px] text-muted-foreground block">Rencana</span>
            <span className="text-base font-bold text-foreground tabular-nums">
              {summary.plannedCount}
            </span>
          </div>
          <div className="rounded-md border px-2.5 py-2">
            <span className="text-[11px] text-muted-foreground block">Ditunda</span>
            <span className="text-base font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              {summary.onHoldCount}
            </span>
          </div>
        </div>

        {/* Catatan Revisi Jadwal */}
        <div className="flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Total revisi jadwal tercatat</span>
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            {summary.totalRevisions} kali revisi
          </span>
        </div>
      </div>
    </section>
  );
}
