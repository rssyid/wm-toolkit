"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  Layers,
  FileCheck2,
  FileSpreadsheet,
  ShoppingCart,
  TrendingUp,
  FileText,
  History,
  Edit,
  Plus,
  Send,
  Building,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AFCEActionDialog } from "@/components/afce/afce-action-dialog";
import { PRRecordDialog } from "@/components/procurement/pr-record-dialog";
import { POCreateDialog } from "@/components/procurement/po-create-dialog";
import { DailyProgressDialog } from "@/components/progress/daily-progress-dialog";
import { CollaborationDrawer } from "@/components/workspace/collaboration-drawer";
import { MessageSquare, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const {
    projects,
    afces,
    submitAfceApproval,
    canEditProjects,
    canApproveAfce,
    canManageSystem,
    isViewerOnly,
    restoreProject,
    deleteProject,
    hardDeleteProject,
    comments,
    attachments,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const afce = afces.find((a) => a.projectId === projectId);

  // Modal dialog states
  const [afceDialogOpen, setAfceDialogOpen] = useState(false);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [collabDrawerOpen, setCollabDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [isHardDeleting, setIsHardDeleting] = useState(false);

  const projectCommentsCount = comments.filter((c) => c.projectId === projectId).length;
  const projectAttachmentsCount = attachments.filter((a) => a.projectId === projectId).length;

  if (!project) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="text-base font-semibold">Proyek tidak ditemukan</h2>
        <p className="text-xs text-muted-foreground">
          Proyek dengan ID {projectId} tidak ada dalam database lokal.
        </p>
        <Link href="/workspace">
          <Button size="sm" variant="outline">
            Kembali ke Workspace
          </Button>
        </Link>
      </div>
    );
  }

  // 4 Primary Integrated Tabs
  const primaryTabs = [
    {
      label: "Ringkasan Proyek",
      href: `/workspace/${projectId}`,
      exact: true,
      matchPrefixes: [`/workspace/${projectId}`],
    },
    {
      label: "Otorisasi AFCE",
      href: `/workspace/${projectId}/afce`,
      matchPrefixes: [`/workspace/${projectId}/afce`],
    },
    {
      label: "Pengadaan & Kontrak",
      href: `/workspace/${projectId}/procurement`,
      matchPrefixes: [
        `/workspace/${projectId}/procurement`,
        `/workspace/${projectId}/pr`,
        `/workspace/${projectId}/po`,
        `/workspace/${projectId}/uspk`,
        `/workspace/${projectId}/technical-evaluation`,
        `/workspace/${projectId}/spk`,
        `/workspace/${projectId}/services`,
      ],
    },
    {
      label: "Pelaksanaan & Progres",
      href: `/workspace/${projectId}/execution`,
      matchPrefixes: [
        `/workspace/${projectId}/execution`,
        `/workspace/${projectId}/progress`,
        `/workspace/${projectId}/work-items`,
        `/workspace/${projectId}/schedule`,
        `/workspace/${projectId}/survey-boq`,
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Soft Delete Warning Banner */}
      {project.deletedAt && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Proyek ini berada dalam <strong>Recycle Bin</strong> (dihapus pada {formatIDDate(project.deletedAt.split("T")[0])}).
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => restoreProject(project.id)}
            className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Pulihkan Proyek Ini
          </Button>
        </div>
      )}

      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Link
          href="/workspace"
          className="hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Kembali ke Workspace
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          {project.regionName && (
            <>
              <span>{project.regionName}</span>
              <span>/</span>
            </>
          )}
          {project.companyName && (
            <>
              <span className="font-semibold text-foreground">
                {project.companyName.includes("(") ? project.companyName.split("(")[0].trim() : project.companyName}
              </span>
              <span>/</span>
            </>
          )}
          <span>
            {project.locationNames && project.locationNames.length > 0
              ? project.locationNames.join(", ")
              : project.locationName}
          </span>
          {(project.blockCodes && project.blockCodes.length > 0) || project.blockCode ? (
            <>
              <span>/</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {project.blockCodes && project.blockCodes.length > 0
                  ? project.blockCodes.join(", ")
                  : project.blockCode}
              </span>
            </>
          ) : null}
          <span>/</span>
          <span className="text-foreground font-semibold">{project.code}</span>
        </div>
      </div>

      {/* Prominent Project Sticky Header */}
      {project.deletedAt && (
        <div className="rounded-lg border border-rose-300 bg-rose-50/80 dark:bg-rose-950/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-200">
            <Trash2 className="w-4 h-4 shrink-0 text-rose-600" />
            <div>
              <span className="font-bold">Proyek ini berada di dalam Recycle Bin</span>
              <span className="hidden sm:inline"> (dihapus sementara pada {formatIDDate(project.deletedAt)}).</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                restoreProject(project.id);
                toast.success("Proyek berhasil dipulihkan!");
              }}
              className="h-7 text-xs gap-1 border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 font-semibold"
            >
              <RotateCcw className="w-3 h-3" /> Pulihkan Proyek
            </Button>
            {canManageSystem && (
              <Button
                size="sm"
                onClick={() => setHardDeleteDialogOpen(true)}
                className="h-7 text-xs gap-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                <Trash2 className="w-3 h-3" /> Hapus Permanen
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded text-foreground">
                {project.code}
              </span>
              <StatusBadge status={project.status} />
              <StatusBadge status={project.afceStatus} />
              {project.companyName && (
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {project.companyName.includes("(") ? project.companyName.split("(")[0].trim() : project.companyName}
                </span>
              )}
              {project.locationNames && project.locationNames.length > 1 ? (
                project.locationNames.map((loc, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    {loc}
                  </span>
                ))
              ) : (
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {project.locationName}
                </span>
              )}
              {project.blockCodes && project.blockCodes.length > 1 ? (
                project.blockCodes.map((blk, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-muted text-foreground border"
                  >
                    {blk}
                  </span>
                ))
              ) : project.blockCode ? (
                <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-muted text-foreground border">
                  {project.blockCode}
                </span>
              ) : null}
              {project.projectCategoryName && (
                <>
                  <span className="text-xs text-muted-foreground hidden sm:inline">&bull;</span>
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {project.projectCategoryName}
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground hidden sm:inline">&bull;</span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {project.projectType}
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground leading-snug">
              {project.name}
            </h1>

            <p className="text-xs text-muted-foreground max-w-2xl line-clamp-2">
              {project.description}
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:border-l lg:pl-6 shrink-0">
            {/* Progress Counter */}
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-muted-foreground block font-medium">
                Kemajuan Fisik Total
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {project.progress}%
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Target: {formatIDDate(project.targetEndDate)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {isViewerOnly ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-muted text-muted-foreground border font-medium inline-flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-500" /> Mode Pantau (Read-Only)
                  </span>
                </div>
              ) : (
                <>
                  {canApproveAfce && project.afceStatus === "Pending Approval" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (afce) {
                          setAfceDialogOpen(true);
                        } else {
                          toast.info("Dokumen AFCE belum dikonfigurasi");
                        }
                      }}
                      className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Input Approval AFCE ({afce?.currentApproverRole || "Reviewer"})
                    </Button>
                  )}

                  {canEditProjects && project.afceStatus === "Draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (afce) {
                          submitAfceApproval(afce.id, "Pengajuan dokumen AFCE untuk persetujuan berjenjang.");
                          toast.success("Permintaan persetujuan AFCE berhasil diajukan!");
                        } else {
                          toast.info("Dokumen AFCE belum dikonfigurasi");
                        }
                      }}
                      className="h-8 text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                    >
                      <Send className="w-3.5 h-3.5" /> Ajukan Approval AFCE
                    </Button>
                  )}

                  {canApproveAfce && project.afceStatus === "Need Revision" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (afce) {
                          setAfceDialogOpen(true);
                        }
                      }}
                      className="h-8 text-xs gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50"
                    >
                      <Send className="w-3.5 h-3.5" /> Evaluasi Revisi AFCE
                    </Button>
                  )}

                  {project.afceStatus === "Approved" && (
                    <span className="h-8 px-2.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1 text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> AFCE Disetujui
                    </span>
                  )}

                  {canEditProjects && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPrDialogOpen(true)}
                        className="h-8 text-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah PR
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPoDialogOpen(true)}
                        className="h-8 text-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Buat PO
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => setProgressDialogOpen(true)}
                        className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Input Progress
                      </Button>

                      {!project.deletedAt && canEditProjects && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteDialogOpen(true)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                          title="Pindahkan proyek ke Recycle Bin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Universal Collaboration & Documents Drawer Trigger */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCollabDrawerOpen(true)}
                className="h-8 text-xs gap-1.5 border-dashed hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Berkas & Diskusi</span>
                <span className="sm:hidden">Kolaborasi</span>
                {projectCommentsCount + projectAttachmentsCount > 0 && (
                  <span className="h-4 min-w-[16px] px-1 rounded-full bg-emerald-600 text-[10px] text-white font-mono flex items-center justify-center font-bold">
                    {projectCommentsCount + projectAttachmentsCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Primary Integrated Tabs Strip */}
        <div className="flex items-center gap-1.5 border-t pt-2 overflow-x-auto no-scrollbar">
          {primaryTabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : tab.matchPrefixes
              ? tab.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5",
                  isActive
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content Rendered Here */}
      <div className="min-h-[400px]">{children}</div>

      {/* Collaboration Drawer */}
      <CollaborationDrawer
        open={collabDrawerOpen}
        onOpenChange={setCollabDrawerOpen}
        project={project}
      />

      {/* Attached Dialogs */}
      {afce && (
        <AFCEActionDialog
          open={afceDialogOpen}
          onOpenChange={setAfceDialogOpen}
          afce={afce}
        />
      )}
      <PRRecordDialog
        open={prDialogOpen}
        onOpenChange={setPrDialogOpen}
        project={project}
      />
      <POCreateDialog
        open={poDialogOpen}
        onOpenChange={setPoDialogOpen}
        project={project}
      />
      <DailyProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        project={project}
      />

      {/* Soft Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <DialogTitle className="text-base font-bold">Pindahkan Proyek ke Recycle Bin</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              Apakah Anda yakin ingin memindahkan proyek ini ke Recycle Bin?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 text-xs space-y-1">
            <p className="font-bold text-foreground">
              {project.code} - {project.name}
            </p>
            <p className="text-muted-foreground">
              Lokasi: {project.locationName} &bull; Nilai: {formatIDR(project.afceValue)}
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Proyek ini tidak akan dihapus permanen. Anda dapat memulihkannya kapan saja melalui tab <strong>Recycle Bin</strong> di halaman Workspace.
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                deleteProject(project.id);
                setDeleteDialogOpen(false);
                router.push("/workspace");
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Pindahkan ke Recycle Bin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation Dialog */}
      <Dialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
        <DialogContent className="max-w-md border-rose-300 dark:border-rose-900">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <DialogTitle className="text-base font-bold text-rose-600 dark:text-rose-400">
                Hapus Proyek Secara Permanen
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              Tindakan ini bersifat destruktif dan <strong>tidak dapat dibatalkan</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/70 dark:bg-rose-950/40 text-xs space-y-1">
            <p className="font-bold text-foreground">
              {project.code} - {project.name}
            </p>
            <p className="text-muted-foreground">
              Lokasi: {project.locationName} &bull; Nilai AFCE: {formatIDR(project.afceValue)}
            </p>
          </div>

          <div className="rounded-md bg-muted/60 p-3 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
            <p className="font-semibold text-foreground">Data yang akan dihapus permanen dari database:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Struktur Rincian Kerja (WBS) & Bobot Fisik</li>
              <li>Rencana Anggaran Biaya (BOQ) & Estimasi Item</li>
              <li>Dokumen AFCE & Riwayat Otorisasi Berjenjang</li>
              <li>Seluruh transaksi PR, PO, USPK, SPK, dan BAST</li>
              <li>Jurnal harian/mingguan dan seluruh berkas lampiran</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isHardDeleting}
              onClick={() => setHardDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isHardDeleting}
              onClick={async () => {
                setIsHardDeleting(true);
                try {
                  const success = await hardDeleteProject(project.id);
                  if (success) {
                    setHardDeleteDialogOpen(false);
                    router.push("/workspace");
                  }
                } finally {
                  setIsHardDeleting(false);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isHardDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
