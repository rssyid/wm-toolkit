"use client";

import React from "react";
import {
  ArrowDown,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Circle,
  Compass,
  Package,
} from "lucide-react";
import { OnboardingStepId, OnboardingStepView } from "@/lib/onboarding-guide";
import { cn } from "@/lib/utils";

interface WorkflowBranchMapProps {
  steps: OnboardingStepView[];
  selectedStepId: OnboardingStepId;
  onSelectStep: (stepId: OnboardingStepId) => void;
}

function StepNodeButton({
  step,
  isSelected,
  onSelect,
  subtitle,
  tone = "neutral",
}: {
  step?: OnboardingStepView;
  isSelected: boolean;
  onSelect: (id: OnboardingStepId) => void;
  subtitle?: string;
  tone?: "neutral" | "barang" | "jasa";
}) {
  if (!step) return null;

  const statusText = step.isCompleted
    ? "Selesai"
    : isSelected
    ? "Dipilih"
    : "Belum";

  return (
    <button
      type="button"
      onClick={() => onSelect(step.id)}
      aria-pressed={isSelected}
      className={cn(
        "w-full min-h-[44px] text-left rounded-lg border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-emerald-700 ring-2 ring-emerald-700/25 bg-emerald-50/70 dark:border-emerald-400 dark:ring-emerald-400/25 dark:bg-emerald-950/35"
          : tone === "barang"
          ? "border-blue-200 dark:border-blue-900 bg-card hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
          : tone === "jasa"
          ? "border-emerald-200 dark:border-emerald-900 bg-card hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
          : "border-border bg-card hover:bg-muted/60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-mono font-semibold text-muted-foreground">
          Tahap {step.order} &bull; {step.phase}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0",
            step.isCompleted
              ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : isSelected
              ? "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
              : "border-border bg-muted text-muted-foreground"
          )}
        >
          {step.isCompleted ? (
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
          ) : isSelected ? (
            <Compass className="w-3 h-3" aria-hidden="true" />
          ) : (
            <Circle className="w-3 h-3" aria-hidden="true" />
          )}
          <span>{statusText}</span>
        </span>
      </div>

      <p className="mt-1 text-xs font-bold text-foreground leading-snug">
        {step.title}
      </p>
      {subtitle && (
        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </button>
  );
}

export function WorkflowBranchMap({
  steps,
  selectedStepId,
  onSelectStep,
}: WorkflowBranchMapProps) {
  const byId = new Map(steps.map((s) => [s.id, s]));

  const step1 = byId.get("profile-setup");
  const step2 = byId.get("create-project");
  const step3 = byId.get("afce-approval");
  const step4 = byId.get("goods-track");
  const step5 = byId.get("service-track");
  const step6 = byId.get("execution-progress");
  const step7 = byId.get("reports-monitoring");

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            Peta Alur Kerja End-to-End WM-Toolkit
          </h2>
          <p className="text-xs text-muted-foreground">
            Pilih salah satu tahap di bawah untuk membaca langkah praktik dan aturan sistemnya.
          </p>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          Satu proyek dapat menjalankan Jalur Barang dan Jalur Jasa secara paralel
        </span>
      </div>

      {/* Fase 1: Pra-Otorisasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
        <StepNodeButton
          step={step1}
          isSelected={selectedStepId === "profile-setup"}
          onSelect={onSelectStep}
          subtitle="Profil PIC, unit kebun, dan notifikasi"
        />
        <StepNodeButton
          step={step2}
          isSelected={selectedStepId === "create-project"}
          onSelect={onSelectStep}
          subtitle="Wizard 4 langkah + WBS 100% + AFCE awal"
        />
        <StepNodeButton
          step={step3}
          isSelected={selectedStepId === "afce-approval"}
          onSelect={onSelectStep}
          subtitle="Catat persetujuan SAP hingga status Approved"
        />
      </div>

      {/* Titik Percabangan */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-border" />
        <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
          <ArrowDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>AFCE Approved: Percabangan Paralel Terbuka</span>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Fase 2: Dua Cabang Paralel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cabang Jalur Barang */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/35 dark:bg-blue-950/15 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
              <Package className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Cabang 1: Jalur Pengadaan Barang</span>
            </div>
            <span className="text-[10px] font-mono text-blue-800 dark:text-blue-300">
              1 PR : N PO
            </span>
          </div>

          <StepNodeButton
            step={step4}
            isSelected={selectedStepId === "goods-track"}
            onSelect={onSelectStep}
            tone="barang"
            subtitle="PR SAP -> Evaluasi Vendor (Recommended) -> PO -> GR Parsial -> BAST"
          />

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-blue-900/85 dark:text-blue-200/85 pt-0.5">
            <span>PR Rilis</span>
            <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>Evaluasi Vendor</span>
            <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>PO Material</span>
            <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>GR &amp; BAST</span>
          </div>
        </div>

        {/* Cabang Jalur Jasa */}
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/35 dark:bg-emerald-950/15 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
              <Briefcase className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Cabang 2: Jalur Pekerjaan Jasa</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300">
              1 USPK : 1 SPK
            </span>
          </div>

          <div className="space-y-2">
            <StepNodeButton
              step={step5}
              isSelected={selectedStepId === "service-track"}
              onSelect={onSelectStep}
              tone="jasa"
              subtitle="USPK -> Evaluasi Teknis -> Kontrak SPK Aktif"
            />
            <StepNodeButton
              step={step6}
              isSelected={selectedStepId === "execution-progress"}
              onSelect={onSelectStep}
              tone="jasa"
              subtitle="Log Progres Harian/Mingguan, Kurva-S, WBS, Gantt & Berkas Drive"
            />
          </div>
        </div>
      </div>

      {/* Fase 3: Pelaporan & Penutupan */}
      <div className="pt-1">
        <StepNodeButton
          step={step7}
          isSelected={selectedStepId === "reports-monitoring"}
          onSelect={onSelectStep}
          subtitle="Pantau EWS di Dashboard, tindak lanjuti Notifikasi, lalu ekspor Laporan Portofolio Excel/CSV"
        />
      </div>
    </div>
  );
}
