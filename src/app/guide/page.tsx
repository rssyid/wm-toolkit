"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Eye,
  LayoutGrid,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkflowBranchMap } from "@/components/onboarding/workflow-branch-map";
import { useAppState } from "@/context/app-state-context";
import { useOnboarding } from "@/context/onboarding-context";
import {
  GlossaryItem,
  ONBOARDING_FAQ,
  ONBOARDING_GLOSSARY,
  OnboardingStepId,
} from "@/lib/onboarding-guide";
import { cn } from "@/lib/utils";

type GlossaryCategoryFilter = "Semua" | GlossaryItem["category"];

const GLOSSARY_CATEGORIES: GlossaryCategoryFilter[] = [
  "Semua",
  "Otorisasi",
  "Jalur Barang",
  "Jalur Jasa",
  "Pelaksanaan",
  "Sistem",
];

export default function GuidePage() {
  const {
    isLoading,
    loadError,
    refreshFromDatabase,
    activeRole,
  } = useAppState();
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
    openWelcomeModal,
    toggleManualStep,
    setDashboardWidgetHidden,
    resetOnboarding,
  } = useOnboarding();

  const [selectedStepId, setSelectedStepId] =
    useState<OnboardingStepId>("profile-setup");
  const hasInitializedSelectionRef = useRef(false);
  const stepDetailRef = useRef<HTMLDivElement | null>(null);

  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategory, setGlossaryCategory] =
    useState<GlossaryCategoryFilter>("Semua");
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    "faq-sap-manual": true,
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Pilih tahap berikutnya yang belum selesai saat pertama kali data siap
  useEffect(() => {
    if (!hydrated || isLoading || hasInitializedSelectionRef.current) return;
    if (nextRecommendedStep) {
      setSelectedStepId(nextRecommendedStep.id);
    } else if (steps[0]) {
      setSelectedStepId(steps[0].id);
    }
    hasInitializedSelectionRef.current = true;
  }, [hydrated, isLoading, nextRecommendedStep, steps]);

  const selectedIndex = useMemo(
    () => Math.max(0, steps.findIndex((s) => s.id === selectedStepId)),
    [steps, selectedStepId]
  );
  const selectedStep = steps[selectedIndex] ?? steps[0];
  const prevStep = selectedIndex > 0 ? steps[selectedIndex - 1] : null;
  const nextStep =
    selectedIndex < steps.length - 1 ? steps[selectedIndex + 1] : null;

  const filteredGlossary = useMemo(() => {
    const q = glossarySearch.trim().toLowerCase();
    return ONBOARDING_GLOSSARY.filter((item) => {
      if (glossaryCategory !== "Semua" && item.category !== glossaryCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.fullName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [glossarySearch, glossaryCategory]);

  const handleSelectStepAndScroll = (stepId: OnboardingStepId) => {
    setSelectedStepId(stepId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      stepDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleToggleFaq = (faqId: string) => {
    setOpenFaqIds((prev) => ({
      ...prev,
      [faqId]: !prev[faqId],
    }));
  };

  const handleConfirmReset = () => {
    resetOnboarding();
    setResetDialogOpen(false);
    toast.success("Checklist onboarding berhasil diatur ulang.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header Halaman */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Dokumentasi Operasional &amp; Onboarding Pengguna Baru</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panduan Operasional &amp; Onboarding PIC
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Alur pencatatan proyek teknis perkebunan sawit dari inisiasi proyek, persetujuan AFCE berbasis SAP, pengadaan barang dan jasa, hingga pelaporan portofolio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openWelcomeModal}
            className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1.5"
          >
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ringkasan Awal</span>
          </Button>

          {dashboardWidgetHidden && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDashboardWidgetHidden(false);
                toast.success("Checklist onboarding kembali ditampilkan di Dashboard.");
              }}
              className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tampilkan Checklist di Dashboard</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Atur Ulang Checklist</span>
          </Button>
        </div>
      </div>

      {/* State Memuat Data / Gangguan Server */}
      {isLoading ? (
        <div className="space-y-4" aria-label="Memuat data panduan">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="h-5 w-64 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-full rounded bg-muted animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 h-72 rounded-xl border bg-card animate-pulse" />
            <div className="lg:col-span-8 h-72 rounded-xl border bg-card animate-pulse" />
          </div>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-1 text-xs">
              <h2 className="font-bold text-foreground">
                Gagal Memuat Status Onboarding dari Database
              </h2>
              <p className="text-muted-foreground leading-relaxed">{loadError}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refreshFromDatabase()}
            className="min-h-[44px] sm:min-h-0 h-9 text-xs gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Muat Ulang Data</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Konteks Role jika bukan PIC */}
          {activeRole !== "PIC" && (
            <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck
                  className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">
                    Anda masuk sebagai role {activeRole}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {activeRole === "ADMIN"
                      ? "Panduan ini berfokus pada alur kerja harian PIC. Sebagai Admin, pastikan Master Data Kebun, Kategori Proyek, User, dan Matriks Approval telah dikonfigurasi sebelum tim mencatat proyek."
                      : activeRole === "APPROVER"
                      ? "Panduan ini menjelaskan alur lengkap PIC. Fokus tugas Anda berada pada Tahap 3 (Otorisasi AFCE) untuk mencatat verifikasi persetujuan SAP."
                      : "Panduan ini menjelaskan alur lengkap PIC. Akun Viewer Anda berjalan pada mode pantau (read-only) untuk meninjau progres proyek, Dashboard, dan Laporan."}
                  </p>
                </div>
              </div>
              {activeRole === "ADMIN" && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button asChild size="sm" variant="outline" className="h-9 text-xs">
                    <Link href="/master-data/locations">Master Data Kebun</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-9 text-xs">
                    <Link href="/master-data/approval-matrix">Matriks Approval</Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Blok 1: Ringkasan Progres + Peta Alur Dua Cabang */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">
                    Progres Onboarding Anda
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-[11px] font-mono font-semibold border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  >
                    {completedCount} dari {totalSteps} tahap selesai ({progressPercent}%)
                  </Badge>
                </div>

                <Progress
                  value={progressPercent}
                  aria-label={`Progres onboarding ${progressPercent} persen`}
                  className="h-2.5 max-w-2xl"
                />

                <p className="text-xs text-muted-foreground">
                  {referenceProject ? (
                    <>
                      Proyek acuan tautan langsung:{" "}
                      <Link
                        href={`/workspace/${referenceProject.id}`}
                        className="font-mono font-semibold text-foreground hover:text-emerald-700 dark:hover:text-emerald-400 underline-offset-2 hover:underline"
                      >
                        {referenceProject.code}
                      </Link>{" "}
                      ({referenceProject.name})
                    </>
                  ) : (
                    "Belum ada proyek aktif di workspace. Mulai dari Tahap 2 untuk membuat proyek pertama Anda."
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAllCompleted ? (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Seluruh tahap onboarding telah selesai</span>
                  </div>
                ) : (
                  nextRecommendedStep && (
                    <Button
                      asChild
                      size="sm"
                      className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                    >
                      <Link href={nextRecommendedStep.resolvedHref}>
                        <span>Lanjut: {nextRecommendedStep.resolvedActionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  )
                )}
              </div>
            </div>

            <WorkflowBranchMap
              steps={steps}
              selectedStepId={selectedStepId}
              onSelectStep={handleSelectStepAndScroll}
            />
          </div>

          {/* Blok 2: Panduan Langkah demi Langkah (Split Panel) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Daftar Tahap Kiri */}
            <aside
              aria-label="Daftar tahapan panduan"
              className="lg:col-span-4 lg:sticky lg:top-20 rounded-xl border bg-card p-3 space-y-1.5"
            >
              <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Daftar 7 Tahap Operasional
              </p>
              {steps.map((step) => {
                const isActive = step.id === selectedStepId;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setSelectedStepId(step.id)}
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "w-full min-h-[44px] flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "border-emerald-700 bg-emerald-50/80 dark:border-emerald-400 dark:bg-emerald-950/40"
                        : "border-transparent hover:bg-muted/70"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                        step.isCompleted
                          ? "bg-emerald-700 text-white dark:bg-emerald-600"
                          : isActive
                          ? "border-2 border-emerald-700 text-emerald-800 dark:border-emerald-400 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.isCompleted ? (
                        <Check className="w-3 h-3" aria-hidden="true" />
                      ) : (
                        step.order
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {step.phase}
                        </span>
                        {step.isAutoCompleted && (
                          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                            Otomatis
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-xs leading-snug mt-0.5",
                          isActive
                            ? "font-bold text-foreground"
                            : "font-medium text-foreground/90"
                        )}
                      >
                        {step.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </aside>

            {/* Detail Tahap Kanan */}
            {selectedStep && (
              <section
                ref={stepDetailRef}
                aria-label={`Detail ${selectedStep.title}`}
                className="lg:col-span-8 rounded-xl border bg-card p-5 sm:p-6 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-semibold",
                          selectedStep.branch === "barang"
                            ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : selectedStep.branch === "jasa"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "border-border bg-muted text-foreground"
                        )}
                      >
                        Tahap {selectedStep.order} &bull; {selectedStep.phase}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Estimasi {selectedStep.estimatedMinutes} menit</span>
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                      {selectedStep.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {selectedStep.objective}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={selectedStep.isCompleted ? "outline" : "default"}
                    disabled={selectedStep.isAutoCompleted}
                    onClick={() => toggleManualStep(selectedStep.id)}
                    className={cn(
                      "min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1.5 shrink-0",
                      selectedStep.isCompleted
                        ? "border-emerald-400 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300"
                        : "bg-emerald-700 hover:bg-emerald-800 text-white"
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {selectedStep.isAutoCompleted
                        ? "Tercatat Otomatis"
                        : selectedStep.isManualCompleted
                        ? "Selesai (Manual)"
                        : "Tandai Selesai"}
                    </span>
                  </Button>
                </div>

                {/* Prasyarat */}
                {selectedStep.prerequisites.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Prasyarat Sebelum Memulai
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground leading-relaxed">
                      {selectedStep.prerequisites.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Aturan & Guardrail Sistem */}
                {selectedStep.guardrails.length > 0 && (
                  <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Aturan &amp; Guardrail Sistem</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-amber-950/90 dark:text-amber-100/90 leading-relaxed">
                      {selectedStep.guardrails.map((rule, idx) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Langkah Praktik */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Langkah Praktik di WM-Toolkit
                  </h3>
                  <ol className="space-y-2.5">
                    {selectedStep.actions.map((act, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-lg border bg-muted/25 p-3 text-xs leading-relaxed text-foreground"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[11px] font-bold text-foreground border">
                          {idx + 1}
                        </span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Footer Navigasi Tahap */}
                <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Button
                    asChild
                    size="sm"
                    className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                  >
                    <Link href={selectedStep.resolvedHref}>
                      <span>{selectedStep.resolvedActionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </Button>

                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!prevStep}
                      onClick={() => prevStep && setSelectedStepId(prevStep.id)}
                      className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Tahap Sebelumnya</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!nextStep}
                      onClick={() => nextStep && setSelectedStepId(nextStep.id)}
                      className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1"
                    >
                      <span>Tahap Berikutnya</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Blok 3: Glosarium Istilah & FAQ Operasional */}
          <section
            aria-label="Referensi istilah dan pertanyaan umum"
            className="rounded-xl border bg-card p-4 sm:p-5 space-y-4"
          >
            <Tabs defaultValue="glosarium" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Referensi Operasional
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Padanan singkatan SAP/perkebunan sawit dan jawaban atas kendala umum di lapangan.
                  </p>
                </div>
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="glosarium" className="flex-1 sm:flex-initial text-xs">
                    Glosarium Istilah ({ONBOARDING_GLOSSARY.length})
                  </TabsTrigger>
                  <TabsTrigger value="faq" className="flex-1 sm:flex-initial text-xs">
                    FAQ Operasional ({ONBOARDING_FAQ.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Glosarium */}
              <TabsContent value="glosarium" className="space-y-4 mt-0">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                  <div className="w-full md:max-w-sm space-y-1">
                    <label
                      htmlFor="glossary-search"
                      className="text-xs font-semibold text-foreground block"
                    >
                      Cari Istilah Operasional
                    </label>
                    <div className="relative">
                      <Search
                        className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <Input
                        id="glossary-search"
                        value={glossarySearch}
                        onChange={(e) => setGlossarySearch(e.target.value)}
                        placeholder="Contoh: AFCE, BAST, USPK, Kurva-S..."
                        className="pl-8 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {GLOSSARY_CATEGORIES.map((cat) => {
                      const active = glossaryCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setGlossaryCategory(cat)}
                          aria-pressed={active}
                          className={cn(
                            "px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "border-emerald-700 bg-emerald-700 text-white"
                              : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredGlossary.length === 0 ? (
                  <EmptyState
                    icon={<Search className="w-7 h-7 opacity-60" />}
                    title="Istilah tidak ditemukan"
                    description={`Tidak ada istilah yang cocok dengan kata kunci "${glossarySearch}".`}
                    actionLabel="Reset Pencarian"
                    onAction={() => {
                      setGlossarySearch("");
                      setGlossaryCategory("Semua");
                    }}
                  />
                ) : (
                  <div className="divide-y divide-border rounded-lg border">
                    {filteredGlossary.map((item) => (
                      <div
                        key={item.term}
                        className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start"
                      >
                        <div className="md:col-span-4 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {item.term}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                              {item.category}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {item.fullName}
                          </p>
                        </div>
                        <p className="md:col-span-8 text-xs text-foreground/90 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab FAQ Operasional */}
              <TabsContent value="faq" className="space-y-2.5 mt-0">
                {ONBOARDING_FAQ.map((faq) => {
                  const isOpen = Boolean(openFaqIds[faq.id]);
                  return (
                    <div
                      key={faq.id}
                      className="rounded-lg border bg-background overflow-hidden"
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => handleToggleFaq(faq.id)}
                        className="w-full min-h-[44px] flex items-center justify-between gap-3 px-4 py-3 text-left text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3.5 pt-1 text-xs text-muted-foreground leading-relaxed border-t space-y-2">
                          <p>{faq.answer}</p>
                          {faq.relatedStepId && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleSelectStepAndScroll(faq.relatedStepId!)
                              }
                              className="h-8 text-[11px] gap-1"
                            >
                              <Compass className="w-3 h-3" aria-hidden="true" />
                              <span>Lihat Tahap Terkait</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </section>
        </>
      )}

      {/* Dialog Konfirmasi Atur Ulang Checklist */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Atur Ulang Checklist Onboarding
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1">
              Tindakan ini akan menghapus tanda centang manual Anda dan menampilkan kembali panel checklist di halaman Dashboard. Data proyek dan progres nyata di database tidak akan berubah.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(false)}
              className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmReset}
              className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Ya, Atur Ulang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
