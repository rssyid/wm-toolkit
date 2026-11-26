"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/context/app-state-context";
import { useOnboarding } from "@/context/onboarding-context";
import { cn } from "@/lib/utils";

export function OnboardingChecklistBanner() {
  const { isLoading, projects } = useAppState();
  const {
    hydrated,
    steps,
    completedCount,
    totalSteps,
    progressPercent,
    isAllCompleted,
    nextRecommendedStep,
    referenceProject,
    dashboardWidgetHidden,
    toggleManualStep,
    setDashboardWidgetHidden,
  } = useOnboarding();

  const activeProjectsCount = projects.filter((p) => !p.deletedAt).length;
  const [expanded, setExpanded] = useState(false);
  const [hasInitializedExpanded, setHasInitializedExpanded] = useState(false);

  useEffect(() => {
    if (!hydrated || isLoading || hasInitializedExpanded) return;
    setExpanded(activeProjectsCount === 0 || completedCount < 2);
    setHasInitializedExpanded(true);
  }, [
    hydrated,
    isLoading,
    hasInitializedExpanded,
    activeProjectsCount,
    completedCount,
  ]);

  if (isLoading) {
    return (
      <div
        aria-label="Memuat checklist onboarding"
        className="rounded-xl border bg-card p-4 space-y-2.5"
      >
        <div className="h-4 w-56 rounded bg-muted animate-pulse" />
        <div className="h-2 w-full rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (!hydrated || dashboardWidgetHidden || isAllCompleted) {
    return null;
  }

  return (
    <section
      aria-label="Checklist onboarding pengguna baru"
      className="rounded-xl border border-emerald-300/80 dark:border-emerald-800 bg-card shadow-sm overflow-hidden"
    >
      <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-emerald-50/50 dark:bg-emerald-950/25">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <BookOpen
              className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-sm font-bold text-foreground">
              Panduan Awal Operasional PIC
            </h2>
            <Badge
              variant="outline"
              className="text-[11px] font-mono font-semibold border-emerald-300 bg-emerald-100/80 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200"
            >
              {completedCount}/{totalSteps} langkah selesai
            </Badge>
          </div>

          <div className="flex items-center gap-3 max-w-xl">
            <Progress
              value={progressPercent}
              aria-label={`Progres onboarding ${progressPercent} persen`}
              className="h-2 flex-1"
            />
            <span className="text-[11px] font-mono font-semibold text-foreground shrink-0">
              {progressPercent}%
            </span>
          </div>

          {nextRecommendedStep && (
            <p className="text-xs text-muted-foreground">
              Langkah berikutnya:{" "}
              <span className="font-semibold text-foreground">
                {nextRecommendedStep.order}. {nextRecommendedStep.title}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {nextRecommendedStep && !expanded && (
            <Button
              asChild
              size="sm"
              className="min-h-[40px] sm:min-h-0 h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Link href={nextRecommendedStep.resolvedHref}>
                <span>{nextRecommendedStep.resolvedActionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
            className="min-h-[40px] sm:min-h-0 h-9 text-xs gap-1.5"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ringkas</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tampilkan Daftar</span>
              </>
            )}
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="min-h-[40px] sm:min-h-0 h-9 text-xs gap-1.5"
          >
            <Link href="/guide">
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Buka Panduan Lengkap</span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDashboardWidgetHidden(true)}
            className="min-h-[40px] sm:min-h-0 h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sembunyikan</span>
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t divide-y divide-border bg-card">
          {referenceProject && (
            <div className="px-4 py-2 bg-muted/40 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
              <span>
                Proyek acuan tautan cepat:{" "}
                <strong className="font-mono text-foreground">
                  {referenceProject.code}
                </strong>{" "}
                - {referenceProject.name}
              </span>
              <Link
                href={`/workspace/${referenceProject.id}`}
                className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Lihat Ringkasan Proyek
              </Link>
            </div>
          )}

          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                step.isCompleted && "bg-muted/20"
              )}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  aria-pressed={step.isCompleted}
                  aria-label={
                    step.isAutoCompleted
                      ? `${step.title} sudah tercatat otomatis di sistem`
                      : step.isCompleted
                      ? `Batalkan tanda selesai untuk ${step.title}`
                      : `Tandai selesai untuk ${step.title}`
                  }
                  onClick={() => {
                    if (!step.isAutoCompleted) {
                      toggleManualStep(step.id);
                    }
                  }}
                  disabled={step.isAutoCompleted}
                  title={
                    step.isAutoCompleted
                      ? "Sudah terdeteksi otomatis dari data proyek di sistem"
                      : "Klik untuk menandai selesai atau belum"
                  }
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    step.isCompleted
                      ? "border-emerald-700 bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-600"
                      : "border-input bg-background hover:border-emerald-600",
                    step.isAutoCompleted && "cursor-default opacity-95"
                  )}
                >
                  {step.isCompleted ? (
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {step.order}
                    </span>
                  )}
                </button>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        step.isCompleted
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      {step.order}. {step.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-5",
                        step.branch === "barang"
                          ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                          : step.branch === "jasa"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {step.phase}
                    </Badge>
                    {step.isAutoCompleted && (
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        [Tercatat di Sistem]
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {step.shortSummary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-9 sm:pl-0 shrink-0">
                <Button
                  asChild
                  size="sm"
                  variant={step.isCompleted ? "outline" : "default"}
                  className={cn(
                    "min-h-[40px] sm:min-h-0 h-9 text-xs",
                    !step.isCompleted &&
                      "bg-emerald-700 hover:bg-emerald-800 text-white"
                  )}
                >
                  <Link href={step.resolvedHref}>{step.resolvedActionLabel}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
