"use client";

import React from "react";
import Link from "next/link";
import {
  Boxes,
  FileCheck2,
  FileSpreadsheet,
  PackageCheck,
  Hammer,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PipelineStatusBarProps {
  // Jalur Barang Metrics
  afceApprovedCount: number;
  prReleasedCount: number;
  poReleasedCount: number;
  grReceivedCount: number;

  // Jalur Jasa Metrics
  uspkCount: number;
  techEvalCompletedCount: number;
  spkActiveCount: number;
  inProgressProjectsCount: number;
}

export function PipelineStatusBar({
  afceApprovedCount,
  prReleasedCount,
  poReleasedCount,
  grReceivedCount,
  uspkCount,
  techEvalCompletedCount,
  spkActiveCount,
  inProgressProjectsCount,
}: PipelineStatusBarProps) {
  return (
    <Card className="shadow-xs border bg-card/50 backdrop-blur-xs overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Alur Dua Jalur Pelaksanaan Operasional (Dual-Track Workflow)
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Setelah AFCE disetujui, alur bercabang paralel ke Pengadaan Barang & Pekerjaan Jasa
          </span>
        </div>

        {/* Dual Pipelines Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Jalur 1: Pengadaan Barang */}
          <div className="rounded-lg bg-blue-50/40 dark:bg-blue-950/20 p-3 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                  Jalur Barang (Material & Pengadaan)
                </span>
              </div>
              <Link
                href="/workspace?procurement=released_pr"
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <span>Buka Logistik</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {/* Step 1: AFCE Disetujui */}
              <div className="bg-background/90 rounded-md p-2 border border-blue-100/60 dark:border-blue-900/30 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground leading-tight">
                  1. AFCE Setuju
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-foreground">
                    {afceApprovedCount}
                  </span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                </div>
              </div>

              {/* Step 2: PR Released */}
              <div className="bg-background/90 rounded-md p-2 border border-blue-100/60 dark:border-blue-900/30 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground leading-tight">
                  2. PR Released
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                    {prReleasedCount}
                  </span>
                  <FileSpreadsheet className="w-3 h-3 text-blue-500 shrink-0" />
                </div>
              </div>

              {/* Step 3: PO Terbit */}
              <div className="bg-background/90 rounded-md p-2 border border-blue-100/60 dark:border-blue-900/30 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground leading-tight">
                  3. PO Terbit
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {poReleasedCount}
                  </span>
                  <FileCheck2 className="w-3 h-3 text-indigo-500 shrink-0" />
                </div>
              </div>

              {/* Step 4: Material GR */}
              <div className="bg-background/90 rounded-md p-2 border border-blue-100/60 dark:border-blue-900/30 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground leading-tight">
                  4. GR Diterima
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400">
                    {grReceivedCount}
                  </span>
                  <PackageCheck className="w-3 h-3 text-teal-500 shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Jalur 2: Pekerjaan Jasa */}
          <div className="rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 p-3 border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                  Jalur Jasa (Kontrak & Konstruksi Fisik)
                </span>
              </div>
              <Link
                href="/workspace"
                className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <span>Buka Kontrak</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {/* Step 1: Usulan USPK */}
              <div className="bg-background/90 rounded-md p-2 border border-emerald-100/60 dark:border-emerald-900/30 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground leading-tight">
                  1. Usulan USPK
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                    {uspkCount}
                  </span>
                  <ClipboardList className="w-3 h-3 text-amber-500 shrink-0" />
                </div>
              </div>

              {/* Step 2: Evaluasi Teknis */}
              <div className="bg-background/90 rounded-md p-2 border border-emerald-100/60 dark:border-emerald-900/30 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground leading-tight">
                  2. Eval Teknis
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                    {techEvalCompletedCount}
                  </span>
                  <CheckCircle2 className="w-3 h-3 text-purple-500 shrink-0" />
                </div>
              </div>

              {/* Step 3: SPK Aktif */}
              <div className="bg-background/90 rounded-md p-2 border border-emerald-100/60 dark:border-emerald-900/30 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground leading-tight">
                  3. SPK Aktif
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {spkActiveCount}
                  </span>
                  <Hammer className="w-3 h-3 text-emerald-500 shrink-0" />
                </div>
              </div>

              {/* Step 4: Progres Fisik */}
              <div className="bg-background/90 rounded-md p-2 border border-emerald-100/60 dark:border-emerald-900/30 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground leading-tight">
                  4. Fisik Lapangan
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold font-mono text-foreground">
                    {inProgressProjectsCount}
                  </span>
                  <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
