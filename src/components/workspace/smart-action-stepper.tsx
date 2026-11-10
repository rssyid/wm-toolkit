"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Send,
  ShoppingCart,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  Layers,
  Sparkles,
  PackageCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Project,
  AFCEDocument,
  PurchaseRequisition,
  PurchaseOrder,
  USPKItem,
  TechnicalEvaluation,
  SPKContract,
  VendorEvaluation,
} from "@/types";

interface SmartActionStepperProps {
  project: Project;
  afce?: AFCEDocument;
  prs: PurchaseRequisition[];
  pos: PurchaseOrder[];
  vendorEvaluations: VendorEvaluation[];
  uspks: USPKItem[];
  technicalEvaluations: TechnicalEvaluation[];
  spkContracts: SPKContract[];
  onOpenAfceAction?: () => void;
  onOpenPrDialog?: () => void;
  onOpenPoDialog?: (preselectedPrId?: string) => void;
  onOpenUspkDialog?: () => void;
  onOpenSpkDialog?: (uspkId?: string) => void;
  onOpenProgressDialog?: () => void;
  isViewerOnly?: boolean;
}

export function SmartActionStepper({
  project,
  afce,
  prs,
  pos,
  vendorEvaluations,
  uspks,
  technicalEvaluations,
  spkContracts,
  onOpenAfceAction,
  onOpenPrDialog,
  onOpenPoDialog,
  onOpenUspkDialog,
  onOpenSpkDialog,
  onOpenProgressDialog,
  isViewerOnly = false,
}: SmartActionStepperProps) {
  // 1. Analyze Lifecycle Stages
  const isAfceApproved = project.afceStatus === "Approved";
  const hasPrOrUspk = prs.length > 0 || uspks.length > 0;
  const hasPoOrSpk = pos.length > 0 || spkContracts.length > 0;
  const isPhysicalProgressStarted = project.progress > 0;
  const isCompleted = project.status === "Completed" || project.progress >= 100;

  // Lifecycle steps
  const steps = [
    {
      id: "init",
      title: "Inisiasi Proyek",
      desc: "Data teknis & anggaran",
      status: "done",
    },
    {
      id: "afce",
      title: "Otorisasi AFCE",
      desc: isAfceApproved
        ? "Disetujui SAP"
        : project.afceStatus === "Pending Approval"
        ? `Menunggu (${afce?.currentApproverRole || "Reviewer"})`
        : project.afceStatus === "Draft"
        ? "Draft Pengajuan"
        : project.afceStatus,
      status: isAfceApproved
        ? "done"
        : project.afceStatus === "Pending Approval" || project.afceStatus === "Draft"
        ? "current"
        : "warning",
    },
    {
      id: "procurement",
      title: "Pengadaan & Kontrak",
      desc: hasPoOrSpk
        ? `${pos.length} PO / ${spkContracts.length} SPK`
        : hasPrOrUspk
        ? "Proses Evaluasi"
        : isAfceApproved
        ? "Siap Dimulai"
        : "Menunggu AFCE",
      status: hasPoOrSpk
        ? "done"
        : hasPrOrUspk
        ? "current"
        : isAfceApproved
        ? "ready"
        : "waiting",
    },
    {
      id: "execution",
      title: "Pelaksanaan Lapangan",
      desc: isCompleted
        ? "Fisik 100% Selesai"
        : isPhysicalProgressStarted
        ? `Progres: ${project.progress}%`
        : hasPoOrSpk
        ? "Siap Dilaksanakan"
        : "Menunggu Kontrak",
      status: isCompleted
        ? "done"
        : isPhysicalProgressStarted
        ? "current"
        : hasPoOrSpk
        ? "ready"
        : "waiting",
    },
    {
      id: "closing",
      title: "Serah Terima (BAST)",
      desc: isCompleted ? "Proyek Selesai" : "Evaluasi Akhir",
      status: isCompleted ? "done" : "waiting",
    },
  ];

  // 2. Determine Next Action Recommendation
  let recommendation: {
    badge: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
    title: string;
    description: string;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    icon: React.ReactNode;
  } | null = null;

  if (project.afceStatus === "Draft") {
    recommendation = {
      badge: "Langkah 1: Pengajuan AFCE",
      badgeVariant: "default",
      title: "Dokumen AFCE Masih Berstatus Draft",
      description:
        "Ajukan dokumen AFCE ke sistem persetujuan berjenjang sesuai kewenangan nilai anggaran SAP.",
      primaryActionLabel: "Ajukan Approval AFCE",
      onPrimaryAction: onOpenAfceAction,
      icon: <Send className="w-5 h-5 text-blue-600" />,
    };
  } else if (project.afceStatus === "Pending Approval") {
    recommendation = {
      badge: "Menunggu Otorisasi",
      badgeVariant: "default",
      title: `Menunggu Persetujuan Otorisator: ${afce?.currentApproverRole || "Reviewer SAP"}`,
      description:
        "Catat realisasi persetujuan dan nomor otorisasi SAP setelah dokumen ditandatangani oleh pejabat terkait.",
      primaryActionLabel: `Input Otorisasi SAP (${afce?.currentApproverRole || "Reviewer"})`,
      onPrimaryAction: onOpenAfceAction,
      icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
    };
  } else if (project.afceStatus === "Need Revision") {
    recommendation = {
      badge: "Perlu Revisi",
      badgeVariant: "destructive",
      title: "Dokumen AFCE Memerlukan Perbaikan",
      description:
        "Otorisator meminta revisi atau klarifikasi data teknis/anggaran sebelum AFCE dapat disetujui.",
      primaryActionLabel: "Periksa & Update Dokumen AFCE",
      onPrimaryAction: onOpenAfceAction,
      icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
    };
  } else if (isAfceApproved && prs.length === 0 && uspks.length === 0) {
    recommendation = {
      badge: "Langkah 2: Mulai Pengadaan",
      badgeVariant: "default",
      title: "AFCE Disetujui! Anggaran Siap Dialokasikan",
      description:
        "Mulai alur pengadaan sesuai kebutuhan proyek: Pengadaan Barang (PR) atau Pekerjaan Jasa Kontraktor (USPK).",
      primaryActionLabel: "Buat PR (Jalur Barang)",
      onPrimaryAction: onOpenPrDialog,
      secondaryActionLabel: "Buat USPK (Jalur Jasa)",
      onSecondaryAction: onOpenUspkDialog,
      icon: <ShoppingCart className="w-5 h-5 text-emerald-600" />,
    };
  } else {
    // Check pending vendor evaluation on PR
    const prNeedingEval = prs.find(
      (pr) => !vendorEvaluations.some((ve) => ve.prId === pr.id)
    );
    // Check recommended eval without PO
    const recommendedEvalWithoutPo = vendorEvaluations.find(
      (ve) =>
        ve.result === "RECOMMENDED" &&
        !pos.some((po) => po.relatedPrId === ve.prId)
    );
    // Check pending tech eval on USPK
    const uspkNeedingEval = uspks.find(
      (u) => !technicalEvaluations.some((te) => te.uspkId === u.id)
    );
    // Check recommended tech eval without SPK
    const recommendedTechEvalWithoutSpk = technicalEvaluations.find(
      (te) =>
        te.result === "RECOMMENDED" &&
        !spkContracts.some((s) => s.uspkId === te.uspkId)
    );

    if (prNeedingEval) {
      recommendation = {
        badge: "Evaluasi Rekanan Diperlukan",
        badgeVariant: "default",
        title: `PR ${prNeedingEval.prNumber} Menunggu Evaluasi Rekanan`,
        description:
          "Catat hasil evaluasi harga dan spesifikasi vendor untuk menerbitkan Purchase Order.",
        primaryActionLabel: "Input Evaluasi Rekanan",
        onPrimaryAction: () => {
          if (onOpenPoDialog) onOpenPoDialog(prNeedingEval.id);
        },
        icon: <ClipboardCheck className="w-5 h-5 text-blue-600" />,
      };
    } else if (recommendedEvalWithoutPo) {
      recommendation = {
        badge: "Siap Terbitkan PO",
        badgeVariant: "default",
        title: `Evaluasi Selesai untuk ${recommendedEvalWithoutPo.supplierName}`,
        description:
          "Rekanan telah direkomendasikan. Buat Purchase Order (PO) untuk pengadaan material.",
        primaryActionLabel: "Terbitkan PO Sekarang",
        onPrimaryAction: () => {
          if (onOpenPoDialog) onOpenPoDialog(recommendedEvalWithoutPo.prId);
        },
        icon: <ShoppingCart className="w-5 h-5 text-emerald-600" />,
      };
    } else if (uspkNeedingEval) {
      recommendation = {
        badge: "Evaluasi Teknis Jasa",
        badgeVariant: "default",
        title: `USPK ${uspkNeedingEval.uspkNumber} Menunggu Evaluasi Teknis`,
        description:
          "Catat hasil evaluasi kelayakan teknis, metode kerja, dan kapasitas kontraktor.",
        primaryActionLabel: "Lihat di Tab Pengadaan",
        onPrimaryAction: undefined,
        icon: <ClipboardCheck className="w-5 h-5 text-purple-600" />,
      };
    } else if (recommendedTechEvalWithoutSpk) {
      recommendation = {
        badge: "Siap Rilis SPK",
        badgeVariant: "default",
        title: `Evaluasi Teknis Disetujui: Rekanan Siap Kontrak SPK`,
        description:
          "Terbitkan Surat Perintah Kerja (SPK) resmi agar rekanan dapat memulai pekerjaan di lapangan.",
        primaryActionLabel: "Rilis Kontrak SPK",
        onPrimaryAction: () => {
          if (onOpenSpkDialog) onOpenSpkDialog(recommendedTechEvalWithoutSpk.uspkId);
        },
        icon: <FileCheck2 className="w-5 h-5 text-emerald-600" />,
      };
    } else if (!isCompleted) {
      recommendation = {
        badge: "Pelaksanaan Berjalan",
        badgeVariant: "default",
        title: `Pekerjaan Fisik Sedang Berjalan (Kemajuan: ${project.progress}%)`,
        description:
          "Pantau realisasi Kurva S harian/mingguan dan catat kemajuan fisik volume serta dokumentasi foto.",
        primaryActionLabel: "Input Progres Harian/Mingguan",
        onPrimaryAction: onOpenProgressDialog,
        icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      };
    } else {
      recommendation = {
        badge: "Proyek Selesai",
        badgeVariant: "default",
        title: "Seluruh Item Pekerjaan Telah Mencapai 100%",
        description:
          "Pekerjaan fisik telah tuntas. Pastikan seluruh Berita Acara Serah Terima (BAST) dan penutupan kontrak SPK telah terdokumentasi.",
        primaryActionLabel: undefined,
        icon: <PackageCheck className="w-5 h-5 text-emerald-600" />,
      };
    }
  }

  return (
    <div className="space-y-3">
      {/* 1. Horizontal Lifecycle Timeline Bar */}
      <Card className="p-3.5 shadow-xs border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Alur Lifecycle Proyek
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            Status Terkini: <strong className="text-foreground">{project.status}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {steps.map((st, idx) => {
            const isDone = st.status === "done";
            const isCurrent = st.status === "current";
            const isReady = st.status === "ready";
            const isWarn = st.status === "warning";

            return (
              <div
                key={st.id}
                className={cn(
                  "p-2 rounded-md border text-xs transition-all relative",
                  isDone
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : isCurrent
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-xs"
                    : isReady
                    ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200"
                    : isWarn
                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                    : "bg-muted/40 border-muted text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-[11px] mb-0.5">
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-amber-600 text-white animate-pulse"
                        : isReady
                        ? "bg-blue-600 text-white"
                        : "bg-muted-foreground/30 text-foreground"
                    )}
                  >
                    {isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                  </span>
                  <span className="truncate">{st.title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1 pl-5">
                  {st.desc}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Recommended Next Action Callout */}
      {recommendation && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/70 bg-gradient-to-r from-emerald-50/60 via-card to-background dark:from-emerald-950/20 dark:via-background dark:to-background p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/50 shrink-0 mt-0.5">
              {recommendation.icon}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                  {recommendation.badge}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {recommendation.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {recommendation.description}
              </p>
            </div>
          </div>

          {!isViewerOnly && (
            <div className="flex items-center gap-2 shrink-0 pl-11 md:pl-0">
              {recommendation.secondaryActionLabel && recommendation.onSecondaryAction && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={recommendation.onSecondaryAction}
                  className="h-8 text-xs gap-1.5"
                >
                  {recommendation.secondaryActionLabel}
                </Button>
              )}
              {recommendation.primaryActionLabel && recommendation.onPrimaryAction && (
                <Button
                  size="sm"
                  onClick={recommendation.onPrimaryAction}
                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {recommendation.primaryActionLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
