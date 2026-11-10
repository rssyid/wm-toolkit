"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, cn } from "@/lib/utils";
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
  const projectId = params?.projectId as string;
  const {
    projects,
    afces,
    submitAfceApproval,
    canEditProjects,
    isViewerOnly,
    restoreProject,
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
                  {project.afceStatus === "Pending Approval" && (
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

                  {project.afceStatus === "Draft" && (
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

                  {project.afceStatus === "Need Revision" && (
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
    </div>
  );
}
