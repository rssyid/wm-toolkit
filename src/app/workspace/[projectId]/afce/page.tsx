"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  FileEdit,
  Package,
  TrendingUp,
  RefreshCw,
  Archive,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { EmptyState } from "@/components/shared/empty-state";
import { AFCEActionDialog } from "@/components/afce/afce-action-dialog";
import { AFCEEditDialog } from "@/components/afce/afce-edit-dialog";
import { AFCEStepper } from "@/components/afce/afce-stepper";
import { useAppState } from "@/context/app-state-context";
import {
  AFCEApprovalLevelItem,
  ApprovalLevel,
  APPROVAL_LEVEL_LABELS,
} from "@/types";
import { formatIDDate, formatIDR } from "@/lib/utils";
import {
  generateMatrixLevelsFromTier,
  findMatchingApprovalTier,
  isAfceLevelsOutOfSync,
} from "@/lib/approval-matrix-utils";
import { toast } from "sonner";

export default function AFCEApprovalTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const {
    projects,
    afces,
    submitAfceApproval,
    syncAfceWithMatrix,
    softDeleteAfce,
    restoreAfce,
    approvalMatrix,
    canEditProjects,
    canApproveAfce,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const projectAfces = afces.filter((a) => a.projectId === projectId);
  const activeAfce = projectAfces.find((a) => !a.deletedAt);
  const archivedAfces = projectAfces.filter((a) => !!a.deletedAt);

  const [showArchived, setShowArchived] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"Approve" | "Revise" | "Reject">("Approve");
  const [selectedTargetLevel, setSelectedTargetLevel] = useState<
    AFCEApprovalLevelItem | undefined
  >(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!project) return null;

  if (!activeAfce) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 opacity-60" />}
          title="Dokumen AFCE Aktif Tidak Ditemukan"
          description={
            archivedAfces.length > 0
              ? "Dokumen AFCE proyek ini berada dalam arsip terhapus. Anda dapat memulihkannya di bawah."
              : "Dokumen AFCE belum tercatat untuk proyek ini."
          }
        />
        {archivedAfces.length > 0 && canEditProjects && (
          <Card className="p-4 border-amber-300 dark:border-amber-800 space-y-2 text-xs">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Arsip AFCE Terhapus ({archivedAfces.length})
            </p>
            {archivedAfces.map((arch) => (
              <div
                key={arch.id}
                className="flex items-center justify-between p-2.5 rounded border bg-card"
              >
                <div>
                  <span className="font-mono font-bold">{arch.afceNumber}</span>
                  <span className="text-muted-foreground ml-2">{formatIDR(arch.value)}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void restoreAfce(arch.id)}
                  className="h-8 text-xs gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Pulihkan AFCE
                </Button>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  const matchedTier = findMatchingApprovalTier(activeAfce.value, approvalMatrix);
  const fallbackLevels = matchedTier
    ? generateMatrixLevelsFromTier(matchedTier, activeAfce.id, activeAfce.status)
    : [];

  const computedMatrixLevels: AFCEApprovalLevelItem[] =
    activeAfce.approvalMatrixLevels && activeAfce.approvalMatrixLevels.length > 0
      ? activeAfce.approvalMatrixLevels
      : fallbackLevels;

  const afce = {
    ...activeAfce,
    approvalMatrixLevels: computedMatrixLevels,
  };

  const isOutOfSync = isAfceLevelsOutOfSync(afce, approvalMatrix);
  const sapEvidenceValue = afce.sapScreenshotPlaceholder?.trim();
  const isSapEvidenceUrl =
    !!sapEvidenceValue &&
    (sapEvidenceValue.startsWith("https://") || sapEvidenceValue.startsWith("/api/files/"));

  const handleRequestApproval = async (note: string, successMessage: string) => {
    setIsProcessing(true);
    try {
      const ok = await submitAfceApproval(afce.id, note);
      if (ok) {
        toast.success(successMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmArchive = async () => {
    setIsProcessing(true);
    try {
      const ok = await softDeleteAfce(afce.id);
      if (ok) {
        setArchiveConfirmOpen(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const openAction = (act: "Approve" | "Revise" | "Reject", targetLevel?: AFCEApprovalLevelItem) => {
    if (!canApproveAfce) return;
    setDialogAction(act);
    setSelectedTargetLevel(targetLevel);
    setActionDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header Dokumen AFCE */}
      <Card className="shadow-sm p-5 bg-card border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {afce.afceNumber}
              </span>
              <StatusBadge status={afce.status} />
              <span className="text-xs text-muted-foreground">&bull;</span>
              <span className="text-xs font-mono text-muted-foreground">
                SAP Ref: {afce.sapDocNumber || "-"}
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatIDR(afce.value)}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
              <span>
                Reviewer Berwenang:{" "}
                <strong className="text-foreground">{afce.currentApproverRole}</strong> (Level{" "}
                {afce.currentLevel} dari {afce.requiredLevels || computedMatrixLevels.length})
              </span>
              {afce.submittedAt && (
                <span>
                  &bull; Diajukan:{" "}
                  <strong className="font-mono text-foreground">
                    {formatIDDate(afce.submittedAt)}
                  </strong>
                </span>
              )}
              {afce.approvedAt && (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  &bull; Disetujui:{" "}
                  <strong className="font-mono">{formatIDDate(afce.approvedAt)}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEditProjects && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditDialogOpen(true)}
                className="h-9 gap-1.5 text-xs shadow-sm"
              >
                <FileEdit className="w-3.5 h-3.5" /> Ubah Dokumen AFCE
              </Button>
            )}

            {afce.status === "Draft" && canEditProjects && (
              <Button
                size="sm"
                disabled={isProcessing}
                onClick={() =>
                  void handleRequestApproval(
                    "Pengajuan persetujuan AFCE oleh tim teknis kebun.",
                    "Permintaan persetujuan AFCE berhasil diajukan."
                  )
                }
                className="h-9 gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm font-semibold"
              >
                <Send className="w-3.5 h-3.5" /> Ajukan Approval AFCE
              </Button>
            )}

            {afce.status === "Need Revision" && canEditProjects && (
              <Button
                size="sm"
                disabled={isProcessing}
                onClick={() =>
                  void handleRequestApproval(
                    "Pengajuan ulang dokumen AFCE setelah perbaikan.",
                    "Dokumen AFCE berhasil diajukan ulang untuk otorisasi."
                  )
                }
                className="h-9 gap-1.5 text-xs bg-amber-800 hover:bg-amber-900 text-white shadow-sm font-semibold"
              >
                <Send className="w-3.5 h-3.5" /> Ajukan Ulang Otorisasi
              </Button>
            )}

            {afce.status === "Pending Approval" && canApproveAfce && (
              <>
                <Button
                  size="sm"
                  onClick={() => openAction("Approve")}
                  className="h-9 gap-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Setujui AFCE
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAction("Revise")}
                  className="h-9 gap-1 text-xs text-amber-800 border-amber-300 hover:bg-amber-50 dark:text-amber-300"
                >
                  Minta Revisi
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAction("Reject")}
                  className="h-9 gap-1 text-xs text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-300"
                >
                  Tolak
                </Button>
              </>
            )}

            {afce.status === "Pending Approval" && !canApproveAfce && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-medium">
                <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>
                  Menunggu Persetujuan: <strong>{afce.currentApproverRole}</strong>
                </span>
              </div>
            )}

            {afce.status === "Approved" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>AFCE Disetujui Penuh</span>
              </div>
            )}

            {canEditProjects && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setArchiveConfirmOpen(true)}
                className="h-9 text-xs gap-1 text-muted-foreground hover:text-rose-700"
              >
                <Archive className="w-3.5 h-3.5" /> Arsipkan
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Banner Cabang Paralel Pasca Persetujuan */}
      {afce.status === "Approved" && (
        <Card className="border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  AFCE Disetujui &amp; Jalur Pengadaan Terbuka
                </h3>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Anggaran investasi telah disetujui. Lanjutkan pencatatan pada Jalur Barang (PR &amp; PO) maupun Jalur Jasa &amp; Pelaksanaan Fisik.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                asChild
                size="sm"
                className="h-9 gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm font-semibold"
              >
                <Link href={`/workspace/${projectId}/procurement?track=barang`}>
                  <Package className="w-3.5 h-3.5" /> Ke Jalur Barang &amp; Jasa
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 text-xs border-emerald-400 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-200"
              >
                <Link href={`/workspace/${projectId}/execution?tab=progress`}>
                  <TrendingUp className="w-3.5 h-3.5" /> Ke Pelaksanaan Proyek
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Peringatan Matriks Out-of-Sync */}
      {isOutOfSync && canEditProjects && (
        <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/80 dark:bg-amber-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>
              Jenjang otorisasi AFCE belum selaras dengan Master Data Matriks SOP terkini untuk nilai{" "}
              <strong>{formatIDR(afce.value)}</strong>.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => void syncAfceWithMatrix(afce.id)}
            className="h-9 text-xs bg-amber-800 hover:bg-amber-900 text-white font-semibold shrink-0 gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sinkronkan Matriks SOP
          </Button>
        </div>
      )}

      {/* Visual Stepper Persetujuan Berjenjang */}
      <AFCEStepper
        afce={afce}
        onOpenActionDialog={
          canApproveAfce ? (level, act) => openAction(act, level) : undefined
        }
      />

      {/* Panel Aksi Otorisasi Aktif (hanya untuk Approver / Admin) */}
      {afce.status === "Pending Approval" && canApproveAfce && (
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-foreground">
                  Pencatatan Keputusan Otorisasi SAP (Level {afce.currentLevel}:{" "}
                  {afce.currentApproverRole})
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Catat keputusan otorisasi berdasarkan verifikasi persetujuan SAP oleh pejabat berwenang.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => openAction("Approve")}
                className="h-9 gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Setujui AFCE
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAction("Revise")}
                className="h-9 gap-1 text-xs text-amber-800 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
              >
                Minta Revisi
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAction("Reject")}
                className="h-9 gap-1 text-xs text-rose-700 border-rose-300 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300"
              >
                Tolak
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Referensi Matriks SOP */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-sm font-semibold">
              Matriks Tingkat Persetujuan (Approval Matrix SOP)
            </CardTitle>
          </div>
          {canEditProjects && (
            <div className="flex items-center gap-2">
              {isOutOfSync && (
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300">
                  Belum Sinkron
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => void syncAfceWithMatrix(afce.id)}
                className="h-8 text-xs gap-1.5 text-emerald-800 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sinkronkan Matriks SOP
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batasan Nilai AFCE</TableHead>
                <TableHead>Level Penyetuju (Hierarki)</TableHead>
                <TableHead>Status Berlaku</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvalMatrix.map((tier) => {
                const isApplicable =
                  afce.value >= tier.minValue && afce.value <= tier.maxValue;
                return (
                  <TableRow
                    key={tier.id}
                    className={
                      isApplicable ? "bg-emerald-50/50 dark:bg-emerald-950/20 font-medium" : ""
                    }
                  >
                    <TableCell className="font-medium text-xs">{tier.tierName}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {tier.levels
                        .filter(Boolean)
                        .map((code) => APPROVAL_LEVEL_LABELS[code as ApprovalLevel] || code)
                        .join(" > ") || "-"}
                    </TableCell>
                    <TableCell>
                      {isApplicable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                          Matriks Berlaku
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Riwayat Persetujuan & Bukti Otorisasi SAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <CardTitle className="text-sm font-semibold">
                  Riwayat Pencatatan Persetujuan AFCE
                </CardTitle>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {afce.history.length} Aksi Tercatat
              </span>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pejabat &amp; Peran</TableHead>
                    <TableHead>Tindakan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="min-w-[180px]">Catatan</TableHead>
                    <TableHead>Ref Dokumen SAP</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {afce.history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                        Belum ada riwayat otorisasi tercatat untuk dokumen AFCE ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    afce.history.map((rec) => (
                      <TableRow key={rec.id} className="text-xs">
                        <TableCell>
                          <div className="font-semibold text-foreground">{rec.approverName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {rec.approverJabatan || rec.approverRole}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                              rec.action === "Approve"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : rec.action === "Revise"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : rec.action === "Reject"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {rec.action}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatIDDate(rec.approvalDate || rec.timestamp.split(" ")[0])}
                        </TableCell>
                        <TableCell className="text-foreground">{rec.note || "-"}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {rec.sapDocNumber || afce.sapDocNumber || "-"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={rec.newStatus} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Lampiran Bukti SAP AFCE</span>
              <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </h3>

            {sapEvidenceValue ? (
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-xs">
                <p className="text-[11px] text-muted-foreground">
                  Bukti dokumen otorisasi SAP ERP yang tersimpan pada sistem:
                </p>
                <AttachmentPreview
                  filename={sapEvidenceValue}
                  fileUrl={isSapEvidenceUrl ? sapEvidenceValue : undefined}
                  title={`Bukti Otorisasi SAP ${afce.afceNumber}`}
                  description={`Ref SAP: ${afce.sapDocNumber || "-"}`}
                  docNumber={afce.sapDocNumber || afce.afceNumber}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Belum ada bukti otorisasi SAP yang dilampirkan. Gunakan{" "}
                <strong>Ubah Dokumen AFCE</strong> atau unggah saat pencatatan approval.
              </div>
            )}

            {archivedAfces.length > 0 && canEditProjects && (
              <div className="pt-2 border-t space-y-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowArchived((s) => !s)}
                  className="w-full h-8 text-xs justify-between"
                >
                  <span>Arsip AFCE Terhapus ({archivedAfces.length})</span>
                  <span>{showArchived ? "Tutup" : "Lihat"}</span>
                </Button>
                {showArchived &&
                  archivedAfces.map((arch) => (
                    <div
                      key={arch.id}
                      className="flex items-center justify-between p-2 rounded border bg-muted/20 text-xs"
                    >
                      <span className="font-mono font-semibold">{arch.afceNumber}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void restoreAfce(arch.id)}
                        className="h-7 text-[11px] gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Pulihkan
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Dialog Konfirmasi Arsip AFCE */}
      <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Arsipkan Dokumen AFCE</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Dokumen <strong>{afce.afceNumber}</strong> akan dipindahkan ke arsip terhapus (soft delete) dan dapat dipulihkan kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => setArchiveConfirmOpen(false)}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isProcessing}
              onClick={handleConfirmArchive}
              className="h-9 text-xs"
            >
              Ya, Arsipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AFCEActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        afce={afce}
        targetLevelItem={selectedTargetLevel}
        initialAction={dialogAction}
      />

      <AFCEEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        afce={afce}
      />
    </div>
  );
}
