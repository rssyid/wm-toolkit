"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Send,
  ShieldCheck,
  RotateCcw,
  Eye,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, calculateDaysBetween, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AFCEActionDialog } from "@/components/afce/afce-action-dialog";
import { PRRecordDialog } from "@/components/procurement/pr-record-dialog";
import { POCreateDialog } from "@/components/procurement/po-create-dialog";
import { DailyProgressDialog } from "@/components/progress/daily-progress-dialog";
import { CollaborationDrawer } from "@/components/workspace/collaboration-drawer";
import { ProjectStatus } from "@/types";
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
    isLoading,
    projects,
    afces,
    prs,
    vendorEvaluations,
    locations,
    users,
    submitAfceApproval,
    updateProject,
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
  const afce = afces.find((a) => a.projectId === projectId && !a.deletedAt);

  // Dialog states
  const [afceDialogOpen, setAfceDialogOpen] = useState(false);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [collabDrawerOpen, setCollabDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [isHardDeleting, setIsHardDeleting] = useState(false);

  // Modal Edit Proyek (F1)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPicId, setEditPicId] = useState("");
  const [editStatus, setEditStatus] = useState<ProjectStatus>("Planned");
  const [editLocationIds, setEditLocationIds] = useState<string[]>([]);
  const [editBaselineStart, setEditBaselineStart] = useState("");
  const [editBaselineEnd, setEditBaselineEnd] = useState("");
  const [editTargetEnd, setEditTargetEnd] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const projectCommentsCount = comments.filter((c) => c.projectId === projectId).length;
  const projectAttachmentsCount = attachments.filter((a) => a.projectId === projectId).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-6 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
        <div className="rounded-lg border bg-card p-6 h-48" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center space-y-3">
        <h1 className="text-lg font-semibold">Proyek tidak ditemukan</h1>
        <p className="text-xs text-muted-foreground">
          Proyek dengan ID {projectId} tidak tersedia pada basis data atau sudah dihapus permanen.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/workspace">Kembali ke Workspace</Link>
        </Button>
      </div>
    );
  }

  const isAfceApproved = project.afceStatus === "Approved";
  const hasRecommendedPr = prs.some(
    (pr) =>
      pr.projectId === project.id &&
      !pr.deletedAt &&
      vendorEvaluations.some((ve) => ve.prId === pr.id && ve.result === "RECOMMENDED")
  );

  const picCandidates = users.filter(
    (u) => u.status === "Active" && (u.role === "PIC" || u.role === "ADMIN")
  );

  const handleOpenEditProject = () => {
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditPicId(project.picId || "");
    setEditStatus(project.status);
    setEditLocationIds(
      project.locationIds && project.locationIds.length > 0
        ? project.locationIds
        : project.locationId
        ? [project.locationId]
        : []
    );
    setEditBaselineStart(project.baselineStartDate);
    setEditBaselineEnd(project.baselineEndDate);
    setEditTargetEnd(project.targetEndDate);
    setEditDialogOpen(true);
  };

  const handleToggleEditLocation = (locId: string) => {
    setEditLocationIds((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  };

  const handleSaveEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editName.trim().length < 5) {
      toast.error("Nama proyek minimal 5 karakter.");
      return;
    }
    if (editLocationIds.length === 0) {
      toast.error("Pilih minimal 1 lokasi kebun proyek.");
      return;
    }
    if (editBaselineStart && editBaselineEnd && editBaselineEnd < editBaselineStart) {
      toast.error("Tanggal akhir baseline tidak boleh lebih awal dari tanggal mulai.");
      return;
    }
    if (editBaselineStart && editTargetEnd && editTargetEnd < editBaselineStart) {
      toast.error("Target selesai tidak boleh lebih awal dari tanggal mulai baseline.");
      return;
    }

    const selectedLocs = locations.filter((l) => editLocationIds.includes(l.id));
    const locationNamesList = selectedLocs.map((l) => l.name);
    const primaryLoc = selectedLocs[0];
    const durationDays = calculateDaysBetween(editBaselineStart, editBaselineEnd);

    setIsSavingEdit(true);
    try {
      const ok = await updateProject(project.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        picId: editPicId || undefined,
        status: editStatus,
        locationId: primaryLoc?.id || project.locationId,
        locationName: locationNamesList.join(", ") || project.locationName,
        locationIds: editLocationIds,
        locationNames: locationNamesList,
        baselineStartDate: editBaselineStart,
        baselineEndDate: editBaselineEnd,
        targetEndDate: editTargetEnd,
        durationDays: durationDays > 0 ? durationDays : project.durationDays,
      });
      if (ok) {
        toast.success("Informasi proyek berhasil diperbarui.");
        setEditDialogOpen(false);
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

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
    {
      label: "Riwayat Audit",
      href: `/workspace/${projectId}/history`,
      matchPrefixes: [`/workspace/${projectId}/history`],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Banner Recycle Bin Tunggal */}
      {project.deletedAt && (
        <div className="rounded-lg border border-rose-300 bg-rose-50/90 dark:bg-rose-950/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
            <Trash2 className="w-4 h-4 shrink-0 text-rose-700 dark:text-rose-400" />
            <div>
              <span className="font-bold">Proyek berada di dalam Recycle Bin</span>
              <span className="hidden sm:inline">
                {" "}
                (dihapus pada {formatIDDate(project.deletedAt.split("T")[0])}).
              </span>
            </div>
          </div>
          {canEditProjects && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void restoreProject(project.id)}
                className="h-9 text-xs gap-1.5 border-emerald-500 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Pulihkan Proyek
              </Button>
              {canManageSystem && (
                <Button
                  size="sm"
                  onClick={() => setHardDeleteDialogOpen(true)}
                  className="h-9 text-xs gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Permanen
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Breadcrumb Navigasi */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
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
                {project.companyName.includes("(")
                  ? project.companyName.split("(")[0].trim()
                  : project.companyName}
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

      {/* Header Proyek Utama */}
      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded text-foreground">
                {project.code}
              </span>
              <StatusBadge status={project.status} />
              <StatusBadge status={project.afceStatus} />
              {project.picName && (
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-muted text-foreground border">
                  PIC: {project.picName}
                </span>
              )}
              {project.projectCategoryName && (
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {project.projectCategoryName}
                </span>
              )}
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {project.projectType}
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground leading-snug">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-xs text-muted-foreground max-w-2xl line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right sm:border-l sm:pl-5 shrink-0">
            <span className="text-[11px] text-muted-foreground block font-medium">
              Kemajuan Fisik Total
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {project.progress}%
            </span>
            <span className="text-[11px] text-muted-foreground block font-mono">
              Target: {formatIDDate(project.targetEndDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
          {isViewerOnly ? (
            <span className="text-xs px-2.5 py-1.5 rounded bg-muted text-muted-foreground border font-medium inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" /> Mode Pantau
            </span>
          ) : (
            <>
              {canApproveAfce && project.afceStatus === "Pending Approval" && (
                <Button
                  size="sm"
                  onClick={() => {
                    if (afce) setAfceDialogOpen(true);
                    else toast.info("Dokumen AFCE belum dikonfigurasi.");
                  }}
                  className="h-9 text-xs gap-1.5 bg-amber-800 hover:bg-amber-900 text-white font-semibold shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Approval AFCE
                </Button>
              )}

              {canEditProjects && project.afceStatus === "Draft" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (afce) {
                      void submitAfceApproval(
                        afce.id,
                        "Pengajuan dokumen AFCE untuk persetujuan berjenjang."
                      );
                    } else {
                      toast.info("Dokumen AFCE belum dikonfigurasi.");
                    }
                  }}
                  className="h-9 text-xs gap-1.5 border-blue-300 text-blue-800 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                >
                  <Send className="w-3.5 h-3.5" /> Ajukan AFCE
                </Button>
              )}

              {isAfceApproved && (
                <span className="h-9 px-2.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />{" "}
                  AFCE Disetujui
                </span>
              )}

              {canEditProjects && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenEditProject}
                    className="h-9 text-xs gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Proyek
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!isAfceApproved}
                    title={
                      !isAfceApproved
                        ? "Menunggu AFCE disetujui sebelum mencatat PR"
                        : "Tambah PR Barang"
                    }
                    onClick={() => setPrDialogOpen(true)}
                    className="h-9 text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah PR
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!isAfceApproved || !hasRecommendedPr}
                    title={
                      !isAfceApproved
                        ? "Menunggu AFCE disetujui"
                        : !hasRecommendedPr
                        ? "Memerlukan PR dengan Evaluasi Rekanan Direkomendasikan"
                        : "Buat Purchase Order"
                    }
                    onClick={() => setPoDialogOpen(true)}
                    className="h-9 text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Buat PO
                  </Button>

                  <Button
                    size="sm"
                    disabled={!isAfceApproved}
                    title={
                      !isAfceApproved
                        ? "Menunggu AFCE disetujui sebelum mencatat progres"
                        : "Input Progres Lapangan"
                    }
                    onClick={() => setProgressDialogOpen(true)}
                    className="h-9 text-xs gap-1 bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Input Progres
                  </Button>

                  {!project.deletedAt && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Pindahkan proyek ke Recycle Bin"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="h-9 w-9 text-muted-foreground hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                      title="Pindahkan proyek ke Recycle Bin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCollabDrawerOpen(true)}
            className="h-9 text-xs gap-1.5 border-dashed hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span className="hidden sm:inline">Berkas &amp; Diskusi</span>
            <span className="sm:hidden">Diskusi</span>
            {projectCommentsCount + projectAttachmentsCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-emerald-700 text-[10px] text-white font-mono flex items-center justify-center font-bold">
                {projectCommentsCount + projectAttachmentsCount}
              </span>
            )}
          </Button>
        </div>

        {/* Strip Navigasi Tab */}
        <div className="flex items-center gap-1.5 border-t pt-2 overflow-x-auto no-scrollbar">
          {primaryTabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : tab.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5",
                  isActive
                    ? "bg-emerald-700 text-white font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="min-h-[400px]">{children}</div>

      {/* Modal Edit Proyek (F1) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent scrollable className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Informasi Proyek</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Perbarui nama, deskripsi, PIC, status operasional, lokasi kebun, dan jadwal proyek{" "}
              <strong className="font-mono">{project.code}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditProject} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="space-y-3 text-xs">
            <div>
              <label htmlFor="edit-proj-name" className="font-semibold block mb-1">
                Nama Proyek <span className="text-rose-600">*</span>
              </label>
              <Input
                id="edit-proj-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label htmlFor="edit-proj-desc" className="font-semibold block mb-1">
                Uraian Teknis Proyek
              </label>
              <Textarea
                id="edit-proj-desc"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-proj-pic" className="font-semibold block mb-1">
                  PIC Proyek
                </label>
                <Select value={editPicId} onValueChange={setEditPicId}>
                  <SelectTrigger id="edit-proj-pic" className="h-9 text-xs">
                    <SelectValue placeholder="Pilih PIC Proyek" />
                  </SelectTrigger>
                  <SelectContent>
                    {picCandidates.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.jabatan})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="edit-proj-status" className="font-semibold block mb-1">
                  Status Operasional
                </label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v as ProjectStatus)}
                >
                  <SelectTrigger id="edit-proj-status" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Direncanakan (Planned)</SelectItem>
                    <SelectItem value="In Progress">Sedang Berjalan (In Progress)</SelectItem>
                    <SelectItem value="On Hold">Ditunda (On Hold)</SelectItem>
                    <SelectItem value="Completed">Selesai (Completed)</SelectItem>
                    <SelectItem value="Cancelled">Dibatalkan (Cancelled)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <span className="font-semibold block mb-1.5">
                Lokasi Kebun Proyek ({editLocationIds.length} dipilih)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-md border bg-muted/20">
                {locations.map((loc) => {
                  const checked = editLocationIds.includes(loc.id);
                  const checkboxId = `edit-loc-${loc.id}`;
                  return (
                    <label
                      key={loc.id}
                      htmlFor={checkboxId}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer text-xs"
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleEditLocation(loc.id)}
                        className="rounded border-input"
                      />
                      <span className="truncate">{loc.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="edit-base-start" className="font-semibold block mb-1">
                  Mulai Baseline
                </label>
                <Input
                  id="edit-base-start"
                  type="date"
                  value={editBaselineStart}
                  onChange={(e) => setEditBaselineStart(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div>
                <label htmlFor="edit-base-end" className="font-semibold block mb-1">
                  Selesai Baseline
                </label>
                <Input
                  id="edit-base-end"
                  type="date"
                  value={editBaselineEnd}
                  onChange={(e) => setEditBaselineEnd(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div>
                <label htmlFor="edit-target-end" className="font-semibold block mb-1">
                  Target Selesai Saat Ini
                </label>
                <Input
                  id="edit-target-end"
                  type="date"
                  value={editTargetEnd}
                  onChange={(e) => setEditTargetEnd(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSavingEdit}
                onClick={() => setEditDialogOpen(false)}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingEdit}
                className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CollaborationDrawer
        open={collabDrawerOpen}
        onOpenChange={setCollabDrawerOpen}
        project={project}
      />

      {afce && (
        <AFCEActionDialog
          open={afceDialogOpen}
          onOpenChange={setAfceDialogOpen}
          afce={afce}
        />
      )}
      <PRRecordDialog open={prDialogOpen} onOpenChange={setPrDialogOpen} project={project} />
      <POCreateDialog open={poDialogOpen} onOpenChange={setPoDialogOpen} project={project} />
      <DailyProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        project={project}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
              <DialogTitle className="text-base font-bold">
                Pindahkan Proyek ke Recycle Bin
              </DialogTitle>
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
            Proyek dapat dipulihkan kembali melalui tab <strong>Recycle Bin</strong> di halaman Workspace.
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                const ok = await deleteProject(project.id);
                if (ok) {
                  setDeleteDialogOpen(false);
                  router.push("/workspace");
                }
              }}
              className="h-9 text-xs bg-rose-700 hover:bg-rose-800 text-white font-semibold"
            >
              Pindahkan ke Recycle Bin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
        <DialogContent className="max-w-md border-rose-300 dark:border-rose-900">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle className="text-base font-bold">
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

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isHardDeleting}
              onClick={() => setHardDeleteDialogOpen(false)}
              className="h-9 text-xs"
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
              className="h-9 text-xs bg-rose-700 hover:bg-rose-800 text-white font-semibold gap-1.5"
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
