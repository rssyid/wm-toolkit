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
  Layers,
  Building2,
  ExternalLink,
  FileEdit,
  Package,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { AFCEActionDialog } from "@/components/afce/afce-action-dialog";
import { AFCEEditDialog } from "@/components/afce/afce-edit-dialog";
import { AFCEStepper } from "@/components/afce/afce-stepper";
import { useAppState } from "@/context/app-state-context";
import { AFCEDocument, AFCEApprovalLevelItem, ApprovalLevel, APPROVAL_LEVEL_LABELS } from "@/types";
import { formatIDDate, formatIDR } from "@/lib/utils";
import {
  findMatchingApprovalTier,
  generateMatrixLevelsFromTier,
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
    approvalMatrix,
    canEditProjects,
    canApproveAfce,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const foundAfce = afces.find((a) => a.projectId === projectId);

  const matchedTier = findMatchingApprovalTier(
    foundAfce?.value || project?.afceValue || 0,
    approvalMatrix
  );
  const fallbackLevels = matchedTier
    ? generateMatrixLevelsFromTier(
        matchedTier,
        `afce-${project?.id || projectId}`,
        foundAfce?.status || project?.afceStatus
      )
    : [];

  // Safe fallback to guarantee afce document is always defined
  const baseAfce: AFCEDocument | undefined =
    foundAfce ||
    (project
      ? {
          id: `afce-${project.id}`,
          afceNumber: project.afceNumber,
          projectId: project.id,
          projectCode: project.code,
          projectName: project.name,
          value: project.afceValue,
          status: project.afceStatus,
          currentLevel:
            project.afceStatus === "Approved"
              ? fallbackLevels.length
              : project.afceStatus === "Draft"
              ? 0
              : 1,
          requiredLevels: fallbackLevels.length,
          currentApproverRole: fallbackLevels[0]?.label || "Water Management",
          sapDocNumber: project.sapDocNumber || "AFCE-SAP-REF",
          sapScreenshotPlaceholder: "SAP_AFCE_Authorization_420M.png",
          history: [],
          approvalMatrixLevels: fallbackLevels,
        }
      : undefined);

  // Compute or fallback matrix levels dynamically from approvalMatrix
  const computedMatrixLevels: AFCEApprovalLevelItem[] =
    baseAfce?.approvalMatrixLevels && baseAfce.approvalMatrixLevels.length > 0
      ? baseAfce.approvalMatrixLevels
      : fallbackLevels;

  const afce: AFCEDocument | undefined = baseAfce
    ? {
        ...baseAfce,
        approvalMatrixLevels: computedMatrixLevels,
      }
    : undefined;

  const isOutOfSync = afce ? isAfceLevelsOutOfSync(afce, approvalMatrix) : false;

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"Approve" | "Revise" | "Reject">("Approve");
  const [selectedTargetLevel, setSelectedTargetLevel] = useState<AFCEApprovalLevelItem | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!project || !afce) return null;

  const handleRequestApproval = () => {
    if (!afce) return;
    submitAfceApproval(afce.id, "Pengajuan persetujuan AFCE oleh tim teknis kebun.");
    toast.success("Permintaan persetujuan AFCE telah diajukan ke Level 1 untuk otorisasi SAP.");
  };

  const openAction = (act: "Approve" | "Revise" | "Reject", targetLevel?: AFCEApprovalLevelItem) => {
    setDialogAction(act);
    setSelectedTargetLevel(targetLevel);
    setActionDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* AFCE Header Card */}
      <Card className="shadow-xs p-5 bg-gradient-to-r from-card via-card to-muted/20 border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {afce ? afce.afceNumber : project.afceNumber}
              </span>
              <StatusBadge status={afce ? afce.status : project.afceStatus} />
              <span className="text-xs text-muted-foreground">&bull;</span>
              <span className="text-xs font-mono text-muted-foreground">
                SAP Ref: {afce?.sapDocNumber || "AFCE-SAP-REF"}
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatIDR(afce ? afce.value : project.afceValue)}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
              <span>
                Reviewer Berwenang:{" "}
                <b className="text-foreground">
                  {afce ? afce.currentApproverRole : "Water Management"}
                </b>{" "}
                (Tingkat Level {afce ? afce.currentLevel : 1} dari {afce ? afce.requiredLevels : computedMatrixLevels.length})
              </span>
              {afce?.submittedAt && (
                <span>
                  &bull; Diajukan: <b className="font-mono text-foreground">{formatIDDate(afce.submittedAt)}</b>
                </span>
              )}
              {afce?.approvedAt && (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  &bull; Disetujui Tanggal: <b className="font-mono">{formatIDDate(afce.approvedAt)}</b>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
              className="gap-1.5 text-xs shadow-xs"
            >
              <FileEdit className="w-3.5 h-3.5" /> Ubah Dokumen AFCE
            </Button>

            {afce?.status === "Draft" && canEditProjects && (
              <Button
                size="sm"
                onClick={handleRequestApproval}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
              >
                <Send className="w-3.5 h-3.5" /> Request AFCE Approval
              </Button>
            )}

            {afce?.status === "Need Revision" && canEditProjects && (
              <Button
                size="sm"
                onClick={() => {
                  submitAfceApproval(afce.id, "Pengajuan ulang dokumen AFCE setelah perbaikan.");
                  toast.success("Dokumen AFCE berhasil diajukan ulang untuk otorisasi!");
                }}
                className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs font-semibold"
              >
                <Send className="w-3.5 h-3.5" /> Ajukan Ulang Otorisasi (Re-submit)
              </Button>
            )}

            {afce?.status === "Pending Approval" && canApproveAfce && (
              <>
                <Button
                  size="sm"
                  onClick={() => openAction("Approve")}
                  className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Setujui AFCE
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAction("Revise")}
                  className="gap-1 text-xs text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-300"
                >
                  Minta Revisi
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAction("Reject")}
                  className="gap-1 text-xs text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-300"
                >
                  Tolak
                </Button>
              </>
            )}

            {afce?.status === "Pending Approval" && !canApproveAfce && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-medium">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Menunggu Persetujuan: <strong>{afce.currentApproverRole || "Reviewer"}</strong></span>
              </div>
            )}

            {afce?.status === "Approved" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>AFCE Disetujui Penuh & SAP Release Valid</span>
              </div>
            )}
          </div>
        </div>
      </Card>
      {/* Post-Approval Procurement Branching Banner (Dua Cabang Paralel) */}
      {afce?.status === "Approved" && (
        <Card className="border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  AFCE Disetujui Penuh & SAP Release Valid &bull; Jalur Pengadaan Terbuka
                </h4>
              </div>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300">
                Anggaran investasi telah disetujui Direksi. Anda dapat melanjutkan ke dua cabang paralel:
                pengadaan material di <b>Jalur Barang (PR & PO)</b> atau kontrak & pelaksanaan di <b>Jalur Jasa & Pelaksanaan Fisik</b>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link href={`/workspace/${projectId}/pr`}>
                <Button size="sm" className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs font-semibold">
                  <Package className="w-3.5 h-3.5" /> Ke Jalur Barang (PR & PO)
                </Button>
              </Link>
              <Link href={`/workspace/${projectId}/progress`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs border-emerald-400 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-200">
                  <TrendingUp className="w-3.5 h-3.5" /> Ke Pelaksanaan Proyek (Progress)
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Out of Sync Warning Banner */}
      {isOutOfSync && (
        <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/80 dark:bg-amber-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Jenjang otorisasi dokumen AFCE ini belum sesuai dengan Master Data Matriks SOP terkini untuk nilai <b>{formatIDR(afce.value)}</b>.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => syncAfceWithMatrix(afce.id)}
            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sinkronkan dengan Matriks SOP
          </Button>
        </div>
      )}

      {/* Visual Stepper Persetujuan Berjenjang SAP */}
      <AFCEStepper
        afce={afce}
        onOpenActionDialog={(level, act) => openAction(act, level)}
      />

      {/* Panel Form Input Persetujuan AFCE Aktif */}
      {afce?.status === "Pending Approval" && (
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-bold text-foreground">
                  Input Keputusan Otorisasi SAP (Level {afce.currentLevel}: {afce.currentApproverRole})
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Dokumen ini sedang menunggu otorisasi pejabat berwenang. Klik tombol keputusan untuk membuka formulir evaluasi:
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => openAction("Approve")}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" /> Setujui AFCE (Approve)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAction("Revise")}
                className="gap-1 text-xs text-amber-700 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
              >
                Minta Revisi
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAction("Reject")}
                className="gap-1 text-xs text-rose-700 border-rose-300 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300"
              >
                Tolak
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Approval Matrix Configuration SOP Reference */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-semibold">
              Matriks Tingkat Persetujuan (Approval Matrix SOP)
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isOutOfSync && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300">
                Belum Sinkron
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncAfceWithMatrix(afce.id)}
              className="h-7 text-xs gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400"
              title="Sinkronkan susunan level approval dokumen ini dengan konfigurasi Master Data Matriks Approval SOP terkini"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sinkronkan Matriks SOP
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batasan Nilai AFCE</TableHead>
                <TableHead>Level Penyetuju (Hierarki)</TableHead>
                <TableHead>Status Tingkat Proyek Ini</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvalMatrix.map((tier) => {
                const projectVal = afce ? afce.value : project.afceValue;
                const isApplicable = projectVal >= tier.minValue && projectVal <= tier.maxValue;

                return (
                  <TableRow
                    key={tier.id}
                    className={isApplicable ? "bg-emerald-50/50 dark:bg-emerald-950/20 font-medium" : ""}
                  >
                    <TableCell className="font-medium text-xs">
                      {tier.tierName}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {tier.levels
                        .filter(Boolean)
                        .map((code) => APPROVAL_LEVEL_LABELS[code as ApprovalLevel] || code)
                        .join(" → ") || "-"}
                    </TableCell>
                    <TableCell>
                      {isApplicable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                          &check; Matriks Berlaku
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

      {/* AFCE Detail, SAP Screenshot Mock, & Approval History Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 cols): Approval History Audit Trail */}
        <div className="lg:col-span-2">
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-sm font-semibold">
                  Riwayat Persetujuan Berjenjang (Audit Log)
                </CardTitle>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {afce?.history.length || 0} Aksi Tercatat
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pejabat & Peran</TableHead>
                    <TableHead>Tindakan</TableHead>
                    <TableHead>Tanggal Otorisasi</TableHead>
                    <TableHead className="min-w-[180px]">Catatan / Justifikasi</TableHead>
                    <TableHead>Ref Dokumen SAP</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!afce || afce.history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                        Belum ada riwayat persetujuan. Klik tombol "Request AFCE Approval" untuk memulai proses persetujuan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    afce.history.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-foreground">{rec.approverName}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {rec.approverJabatan || rec.approverRole}
                            </span>
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
                        <TableCell className="font-mono text-xs">
                          <span className="font-bold text-foreground block">
                            {formatIDDate(rec.approvalDate || rec.timestamp.split(" ")[0])}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {rec.timestamp.includes(" ") ? rec.timestamp.split(" ")[1] : rec.timestamp}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-foreground italic">
                          "{rec.note}"
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
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

        {/* Right Column: SAP Screenshot Placeholder & Doc Preview */}
        <div>
          <Card className="shadow-xs p-4 space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Lampiran Dokumen SAP AFCE</span>
              <FileText className="w-4 h-4 text-emerald-600" />
            </h4>

            {/* Document Placeholder Box */}
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">File Otorisasi SAP ERP:</span>
                <span className="font-mono text-[11px] text-muted-foreground">2.4 MB</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tangkapan layar otorisasi sistem SAP ERP modul Project Systems (PS).
              </p>
              <div className="pt-1">
                <AttachmentPreview
                  filename={afce?.sapScreenshotPlaceholder || "Dokumentasi_Foto_Pintu_Air_Sei_Silau.png"}
                  fileUrl="https://drive.google.com/file/d/1Okq_fiax2-H9RY_2TDTJ_Xj47hgdB4DC/view?usp=sharing"
                  fileId="1Okq_fiax2-H9RY_2TDTJ_Xj47hgdB4DC"
                  mimeType="image/png"
                  title="Otorisasi AFCE Sistem SAP ERP Holding"
                  description="Dokumentasi persetujuan anggaran modal perkebunan tahun 2026."
                  docNumber={afce?.sapDocNumber || "AFCE-SAP-REF"}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1 text-emerald-900 dark:text-emerald-300">
              <p className="font-semibold">Otoritas Valid:</p>
              <p>
                Dokumen AFCE telah diverifikasi terhadap struktur WBS SAP ({afce?.sapDocNumber || "AFCE-SAP-REF"}).
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      {afce && (
        <AFCEActionDialog
          open={actionDialogOpen}
          onOpenChange={setActionDialogOpen}
          afce={afce}
          targetLevelItem={selectedTargetLevel}
          initialAction={dialogAction}
        />
      )}

      {/* Edit Dialog */}
      {afce && (
        <AFCEEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          afce={afce}
        />
      )}
    </div>
  );
}
