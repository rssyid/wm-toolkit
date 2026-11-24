"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Briefcase,
  Plus,
  Truck,
  Layers,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  BadgeCheck,
  Check,
  AlertTriangle,
  Archive,
  RotateCcw,
  PackageCheck,
  FileCheck,
  CheckCircle2,
  Building2,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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

import { PRRecordDialog } from "@/components/procurement/pr-record-dialog";
import { POCreateDialog } from "@/components/procurement/po-create-dialog";
import { VendorEvaluationDialog } from "@/components/procurement/vendor-evaluation-dialog";
import { GoodsHandoverDialog } from "@/components/procurement/goods-handover-dialog";
import { GRReceiptDialog } from "@/components/procurement/gr-receipt-dialog";
import { USPKCreateDialog } from "@/components/services/uspk-create-dialog";
import { TechnicalEvaluationDialog } from "@/components/services/technical-evaluation-dialog";
import { SPKCreateDialog } from "@/components/services/spk-create-dialog";

import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, calculateDaysBetween, cn } from "@/lib/utils";
import {
  PurchaseRequisition,
  PurchaseOrder,
  USPKItem,
  SPKContract,
} from "@/types";
import { toast } from "sonner";

type ArchiveTarget =
  | { kind: "pr"; id: string; label: string }
  | { kind: "po"; id: string; label: string }
  | { kind: "uspk"; id: string; label: string }
  | { kind: "spk"; id: string; label: string };

function UnifiedProcurementHubContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params?.projectId as string;

  const trackParam = searchParams?.get("track") === "jasa" ? "jasa" : "barang";
  const sectionParam = searchParams?.get("section") || "";

  const {
    projects,
    prs,
    pos,
    grs,
    goodsHandovers,
    vendorEvaluations,
    uspks,
    technicalEvaluations,
    spkContracts,
    updateSpkStatus,
    softDeletePr,
    restorePr,
    softDeletePo,
    restorePo,
    softDeleteUspk,
    restoreUspk,
    softDeleteSpk,
    restoreSpk,
    getSpkProgressSummary,
    canEditProjects,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);

  const [activeTrack, setActiveTrack] = useState<string>(trackParam);
  const [showArchived, setShowArchived] = useState(false);

  // Dialog jalur barang
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [grDialogOpen, setGrDialogOpen] = useState(false);
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);

  const [selectedPrForPo, setSelectedPrForPo] = useState<string | undefined>(undefined);
  const [selectedPrForEval, setSelectedPrForEval] = useState<PurchaseRequisition | null>(null);
  const [selectedPoForGr, setSelectedPoForGr] = useState<PurchaseOrder | null>(null);
  const [selectedPoForHandover, setSelectedPoForHandover] = useState<PurchaseOrder | null>(null);

  // Dialog jalur jasa
  const [uspkDialogOpen, setUspkDialogOpen] = useState(false);
  const [techEvalDialogOpen, setTechEvalDialogOpen] = useState(false);
  const [spkDialogOpen, setSpkDialogOpen] = useState(false);
  const [selectedUspkForEval, setSelectedUspkForEval] = useState<USPKItem | null>(null);
  const [selectedUspkForSpk, setSelectedUspkForSpk] = useState<USPKItem | null>(null);

  // Dialog konfirmasi status SPK & arsip
  const [spkStatusTarget, setSpkStatusTarget] = useState<{
    spk: SPKContract;
    nextStatus: "ACTIVE" | "CLOSED";
  } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ArchiveTarget | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Expand state
  const [expandedPrIds, setExpandedPrIds] = useState<Record<string, boolean>>({});
  const [expandedPoIds, setExpandedPoIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveTrack(trackParam);
  }, [trackParam]);

  useEffect(() => {
    if (!sectionParam) return;
    const targetId =
      sectionParam === "po"
        ? "section-po"
        : sectionParam === "gr"
        ? "section-gr"
        : sectionParam === "bast"
        ? "section-bast"
        : sectionParam === "eval"
        ? "section-tech-eval"
        : sectionParam === "spk"
        ? "section-spk"
        : "";
    if (!targetId) return;
    const timer = setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [sectionParam, activeTrack]);

  if (!project) return null;

  const isAfceApproved = project.afceStatus === "Approved";
  const canCreateProcurement = canEditProjects && isAfceApproved;

  const allProjectPrs = prs.filter((p) => p.projectId === projectId);
  const activePrs = allProjectPrs.filter((p) => !p.deletedAt);
  const archivedPrs = allProjectPrs.filter((p) => !!p.deletedAt);

  const allProjectPos = pos.filter((p) => p.projectId === projectId);
  const activePos = allProjectPos.filter((p) => !p.deletedAt);
  const archivedPos = allProjectPos.filter((p) => !!p.deletedAt);

  const projectVendorEvals = vendorEvaluations.filter((ve) =>
    activePrs.some((pr) => pr.id === ve.prId)
  );
  const projectGrs = grs.filter((g) => activePos.some((po) => po.id === g.poId));
  const projectHandovers = goodsHandovers.filter(
    (gh) => activePos.some((po) => po.id === gh.poId) || gh.projectId === projectId
  );

  const allProjectUspks = uspks.filter((u) => u.projectId === projectId);
  const activeUspks = allProjectUspks.filter((u) => !u.deletedAt);
  const archivedUspks = allProjectUspks.filter((u) => !!u.deletedAt);

  const projectTechEvals = technicalEvaluations.filter(
    (e) => e.projectId === projectId && activeUspks.some((u) => u.id === e.uspkId)
  );

  const allProjectSpks = spkContracts.filter((s) => s.projectId === projectId);
  const activeSpks = allProjectSpks.filter((s) => !s.deletedAt);
  const archivedSpks = allProjectSpks.filter((s) => !!s.deletedAt);

  const totalArchivedCount =
    archivedPrs.length + archivedPos.length + archivedUspks.length + archivedSpks.length;

  const totalPoValue = activePos.reduce((sum, p) => sum + (p.poValue || 0), 0);
  const totalSpkValue = activeSpks.reduce((sum, s) => sum + (s.value || 0), 0);

  const handleTrackChange = (nextTrack: string) => {
    setActiveTrack(nextTrack);
    router.replace(`/workspace/${projectId}/procurement?track=${nextTrack}`, {
      scroll: false,
    });
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsProcessingAction(true);
    try {
      let ok = false;
      if (archiveTarget.kind === "pr") ok = await softDeletePr(archiveTarget.id);
      if (archiveTarget.kind === "po") ok = await softDeletePo(archiveTarget.id);
      if (archiveTarget.kind === "uspk") ok = await softDeleteUspk(archiveTarget.id);
      if (archiveTarget.kind === "spk") ok = await softDeleteSpk(archiveTarget.id);
      if (ok) {
        setArchiveTarget(null);
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmSpkStatus = async () => {
    if (!spkStatusTarget) return;
    setIsProcessingAction(true);
    try {
      const ok = await updateSpkStatus(spkStatusTarget.spk.id, spkStatusTarget.nextStatus);
      if (ok) {
        toast.success(
          spkStatusTarget.nextStatus === "CLOSED"
            ? `Kontrak ${spkStatusTarget.spk.spkNumber} berhasil ditutup.`
            : `Kontrak ${spkStatusTarget.spk.spkNumber} diaktifkan kembali.`
        );
        setSpkStatusTarget(null);
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCreatePoFromPr = (prId: string) => {
    const hasRecommended = vendorEvaluations.some(
      (ve) => ve.prId === prId && ve.result === "RECOMMENDED"
    );
    if (!hasRecommended) {
      toast.error(
        "PO hanya dapat diterbitkan untuk PR yang memiliki minimal satu Evaluasi Rekanan berstatus Direkomendasikan."
      );
      return;
    }
    setSelectedPrForPo(prId);
    setPoDialogOpen(true);
  };

  const handleCreateSpkFromUspk = (uspk: USPKItem) => {
    const hasRecommendedEval = technicalEvaluations.some(
      (te) => te.uspkId === uspk.id && te.result === "RECOMMENDED"
    );
    const hasActiveSpk = activeSpks.some((s) => s.uspkId === uspk.id);
    if (hasActiveSpk) {
      toast.error("USPK ini sudah memiliki kontrak SPK aktif (relasi 1:1).");
      return;
    }
    if (!hasRecommendedEval && uspk.status !== "APPROVED") {
      toast.error(
        "SPK hanya dapat diterbitkan setelah Evaluasi Teknis menyatakan Direkomendasikan atau USPK Disetujui."
      );
      return;
    }
    setSelectedUspkForSpk(uspk);
    setSpkDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {!isAfceApproved && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3.5 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Dokumen AFCE belum berstatus Disetujui
            </p>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">
              Penerbitan PR, PO, USPK, maupun SPK baru dikunci hingga pencatatan otorisasi AFCE SAP selesai disetujui penuh.
            </p>
          </div>
        </div>
      )}

      {/* Header & Track Switcher */}
      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-foreground">
                Hub Pengadaan Barang & Kontrak Jasa
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola jalur pengadaan material (PR, Evaluasi Vendor, PO, GR, BAST) dan jalur jasa kontraktor (USPK, Evaluasi Teknis, SPK).
            </p>
          </div>

          {canEditProjects && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canCreateProcurement}
                onClick={() => setPrDialogOpen(true)}
                className="h-9 text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Catat PR (Barang)
              </Button>
              <Button
                size="sm"
                disabled={!canCreateProcurement}
                onClick={() => setUspkDialogOpen(true)}
                className="h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Buat USPK (Jasa)
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-t pt-3">
          <Tabs
            value={activeTrack}
            onValueChange={handleTrackChange}
            className="w-full lg:w-auto"
          >
            <TabsList className="h-10 w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
              <TabsTrigger value="barang" className="text-xs gap-2 data-[state=active]:font-semibold">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>
                  Jalur Barang ({activePrs.length} PR / {activePos.length} PO)
                </span>
              </TabsTrigger>
              <TabsTrigger value="jasa" className="text-xs gap-2 data-[state=active]:font-semibold">
                <Briefcase className="w-3.5 h-3.5" />
                <span>
                  Jalur Jasa ({activeUspks.length} USPK / {activeSpks.length} SPK)
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 text-xs">
            <div className="flex items-center gap-4 font-mono">
              <span>
                <span className="text-muted-foreground">Komitmen PO: </span>
                <strong className="text-foreground">{formatIDR(totalPoValue)}</strong>
              </span>
              <span>
                <span className="text-muted-foreground">Kontrak SPK: </span>
                <strong className="text-foreground">{formatIDR(totalSpkValue)}</strong>
              </span>
            </div>

            {canEditProjects && totalArchivedCount > 0 && (
              <div className="flex items-center gap-2 border-l pl-3">
                <Switch
                  id="toggle-procurement-archive"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
                <label
                  htmlFor="toggle-procurement-archive"
                  className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                >
                  Tampilkan Arsip Terhapus ({totalArchivedCount})
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRACK 1: JALUR BARANG */}
      {activeTrack === "barang" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <span className="font-semibold block">PR Diterbitkan</span>
                <span className="text-[11px] text-muted-foreground">
                  {activePrs.length} Dokumen PR
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <span className="font-semibold block">Evaluasi Vendor</span>
                <span className="text-[11px] text-muted-foreground">
                  {projectVendorEvals.length} Catatan Evaluasi
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <span className="font-semibold block">PO Diterbitkan</span>
                <span className="text-[11px] text-muted-foreground">
                  {activePos.length} Dokumen PO
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                4
              </span>
              <div>
                <span className="font-semibold block">GR & BAST</span>
                <span className="text-[11px] text-muted-foreground">
                  {projectGrs.length} GR / {projectHandovers.length} BAST
                </span>
              </div>
            </div>
          </div>

          {/* Card PR & Evaluasi */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Daftar Purchase Requisition (PR)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PO hanya dapat diterbitkan setelah PR memiliki Evaluasi Rekanan berstatus Direkomendasikan.
                </p>
              </div>
              {canCreateProcurement && (
                <Button
                  size="sm"
                  onClick={() => setPrDialogOpen(true)}
                  className="h-9 text-xs gap-1 bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> Catat PR
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {activePrs.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<ShoppingCart className="w-8 h-8 opacity-60" />}
                    title="Belum ada Purchase Requisition (PR)"
                    description="Catat PR material untuk memulai evaluasi rekanan dan penerbitan PO."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Nomor PR & SAP</TableHead>
                      <TableHead>Item Pekerjaan</TableHead>
                      <TableHead>Tgl Rilis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Evaluasi Rekanan</TableHead>
                      <TableHead>PO Terhubung</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePrs.map((pr) => {
                      const isExpanded = !!expandedPrIds[pr.id];
                      const linkedPos = activePos.filter((po) => po.relatedPrId === pr.id);
                      const prEvals = vendorEvaluations.filter((ve) => ve.prId === pr.id);
                      const recommendedEval = prEvals.find((e) => e.result === "RECOMMENDED");

                      return (
                        <React.Fragment key={pr.id}>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={
                                  isExpanded
                                    ? `Tutup detail PO untuk ${pr.prNumber}`
                                    : `Buka detail PO untuk ${pr.prNumber}`
                                }
                                onClick={() =>
                                  setExpandedPrIds((prev) => ({ ...prev, [pr.id]: !prev[pr.id] }))
                                }
                                className="h-8 w-8"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-xs text-foreground font-mono">
                                {pr.prNumber}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono">
                                SAP: {pr.sapPrNumber || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{pr.workItemName}</TableCell>
                            <TableCell className="text-xs font-mono">
                              {formatIDDate(pr.releaseDate)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={pr.status} />
                            </TableCell>
                            <TableCell className="text-xs">
                              {prEvals.length > 0 ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[11px] px-2 py-0.5 font-medium",
                                    recommendedEval
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                                  )}
                                >
                                  {recommendedEval ? (
                                    <span className="flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      <span>{recommendedEval.supplierName}</span>
                                    </span>
                                  ) : (
                                    `${prEvals.length} Evaluasi (Belum Layak)`
                                  )}
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  Belum dievaluasi
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {linkedPos.length > 0 ? (
                                <Badge variant="secondary" className="text-[11px]">
                                  {linkedPos.length} PO
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {canEditProjects && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPrForEval(pr);
                                      setEvalDialogOpen(true);
                                    }}
                                    className="h-8 text-xs px-2.5"
                                  >
                                    <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                                    Evaluasi
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={!canCreateProcurement || !recommendedEval}
                                    title={
                                      !recommendedEval
                                        ? "Lakukan Evaluasi Vendor (Direkomendasikan) sebelum menerbitkan PO"
                                        : "Terbitkan PO dari PR ini"
                                    }
                                    onClick={() => handleCreatePoFromPr(pr.id)}
                                    className="h-8 text-xs px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
                                  >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Buat PO
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Arsipkan PR ${pr.prNumber}`}
                                    disabled={linkedPos.length > 0}
                                    title={
                                      linkedPos.length > 0
                                        ? "Arsipkan PO terhubung terlebih dahulu"
                                        : "Arsipkan PR"
                                    }
                                    onClick={() =>
                                      setArchiveTarget({
                                        kind: "pr",
                                        id: pr.id,
                                        label: `PR ${pr.prNumber}`,
                                      })
                                    }
                                    className="h-8 w-8 text-muted-foreground hover:text-rose-700"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow className="bg-muted/15 border-b">
                              <TableCell colSpan={8} className="p-3 pl-10 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
                                    PO Terhubung ke {pr.prNumber}
                                  </span>
                                  {pr.attachmentName && (
                                    <AttachmentPreview
                                      filename={pr.attachmentName}
                                      title={`Lampiran PR ${pr.prNumber}`}
                                      docNumber={pr.prNumber}
                                    />
                                  )}
                                </div>
                                {linkedPos.length === 0 ? (
                                  <div className="p-3 text-center border rounded bg-background text-xs text-muted-foreground">
                                    Belum ada PO yang terhubung dengan PR ini.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {linkedPos.map((po) => {
                                      const poGrs = projectGrs.filter((g) => g.poId === po.id);
                                      const poHandover = projectHandovers.find(
                                        (h) => h.poId === po.id
                                      );
                                      return (
                                        <Card key={po.id} className="p-3 bg-card shadow-sm border space-y-2 text-xs">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <span className="font-mono font-bold text-foreground">
                                                {po.poNumber}
                                              </span>
                                              <span className="block text-[11px] text-muted-foreground">
                                                Vendor: {po.supplierName}
                                              </span>
                                            </div>
                                            <StatusBadge status={po.status} />
                                          </div>
                                          <div className="flex items-center justify-between border-t pt-2 text-[11px]">
                                            <span className="text-muted-foreground">
                                              Nilai: <strong>{formatIDR(po.poValue)}</strong>
                                            </span>
                                            <span className="text-muted-foreground">
                                              Penerimaan: <strong>{po.receiptProgressPercent}%</strong>
                                            </span>
                                          </div>
                                          {canEditProjects && (
                                            <div className="flex items-center justify-end gap-1.5 border-t pt-2">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setSelectedPoForGr(po);
                                                  setGrDialogOpen(true);
                                                }}
                                                className="h-8 text-xs px-2.5 gap-1"
                                              >
                                                <Truck className="w-3.5 h-3.5" />
                                                Catat GR ({poGrs.length})
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setSelectedPoForHandover(po);
                                                  setHandoverDialogOpen(true);
                                                }}
                                                className="h-8 text-xs px-2.5 gap-1"
                                              >
                                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                                                {poHandover ? "BAST (Ada)" : "Input BAST"}
                                              </Button>
                                            </div>
                                          )}
                                        </Card>
                                      );
                                    })}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Evaluasi Rekanan */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Riwayat Evaluasi Rekanan Barang ({projectVendorEvals.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Penilaian kualifikasi penawaran vendor sebelum PO diterbitkan.
                </p>
              </div>
              {canCreateProcurement && activePrs.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPrForEval(activePrs[0]);
                    setEvalDialogOpen(true);
                  }}
                  className="h-9 text-xs gap-1.5"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Catat Evaluasi Vendor
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {projectVendorEvals.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada catatan evaluasi rekanan untuk PR pada proyek ini.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor PR</TableHead>
                      <TableHead>Rekanan / Vendor</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Evaluator</TableHead>
                      <TableHead>Skor</TableHead>
                      <TableHead>Hasil</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectVendorEvals.map((ve) => {
                      const pr = activePrs.find((p) => p.id === ve.prId);
                      return (
                        <TableRow key={ve.id} className="text-xs">
                          <TableCell className="font-mono font-semibold">
                            {pr?.prNumber || "-"}
                          </TableCell>
                          <TableCell className="font-medium">{ve.supplierName}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {formatIDDate(ve.evaluationDate)}
                          </TableCell>
                          <TableCell>{ve.evaluatorName}</TableCell>
                          <TableCell className="font-mono font-bold">
                            {ve.score ?? "-"}/100
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px]",
                                ve.result === "RECOMMENDED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                              )}
                            >
                              {ve.result === "RECOMMENDED" ? "Direkomendasikan" : "Tidak Direkomendasikan"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {ve.notes}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tabel PO & Rincian Material */}
          <Card id="section-po" className="shadow-sm scroll-mt-20">
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Purchase Order (PO) & Item Material ({activePos.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pantau rincian material pesanan, progres penerimaan gudang (GR), dan status BAST per PO.
                </p>
              </div>
              {canCreateProcurement && (
                <Button
                  size="sm"
                  disabled={!activePrs.some((pr) =>
                    vendorEvaluations.some((ve) => ve.prId === pr.id && ve.result === "RECOMMENDED")
                  )}
                  onClick={() => {
                    const eligiblePr = activePrs.find((pr) =>
                      vendorEvaluations.some((ve) => ve.prId === pr.id && ve.result === "RECOMMENDED")
                    );
                    if (eligiblePr) handleCreatePoFromPr(eligiblePr.id);
                  }}
                  className="h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> Terbitkan PO Baru
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {activePos.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada Purchase Order yang diterbitkan untuk proyek ini.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Nomor PO</TableHead>
                      <TableHead>PR Referensi</TableHead>
                      <TableHead>Rekanan Penyedia</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Nilai PO</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Penerimaan (GR)</TableHead>
                      <TableHead>BAST</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePos.map((po) => {
                      const isExpanded = !!expandedPoIds[po.id];
                      const poHandover = projectHandovers.find((h) => h.poId === po.id);
                      const poGrs = projectGrs.filter((g) => g.poId === po.id);
                      return (
                        <React.Fragment key={po.id}>
                          <TableRow className="text-xs hover:bg-muted/30">
                            <TableCell>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={
                                  isExpanded
                                    ? `Tutup item material ${po.poNumber}`
                                    : `Lihat item material ${po.poNumber}`
                                }
                                onClick={() =>
                                  setExpandedPoIds((prev) => ({ ...prev, [po.id]: !prev[po.id] }))
                                }
                                className="h-8 w-8"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-mono font-bold">{po.poNumber}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {po.relatedPrNumber}
                            </TableCell>
                            <TableCell className="font-medium">{po.supplierName}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {formatIDDate(po.releaseDate || po.poDate)}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-right">
                              {formatIDR(po.poValue)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={po.status} />
                            </TableCell>
                            <TableCell className="min-w-[120px]">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                    {po.receiptProgressPercent}%
                                  </span>
                                  <span className="text-muted-foreground">
                                    {po.items.length} item
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-700 dark:bg-emerald-500"
                                    style={{ width: `${po.receiptProgressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {poHandover ? (
                                <Badge
                                  variant="outline"
                                  className="text-[11px] bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                >
                                  {poHandover.status === "COMPLETED" ? "BAST Selesai" : "BAST Pending"}
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Belum BAST</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {canEditProjects && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPoForGr(po);
                                      setGrDialogOpen(true);
                                    }}
                                    className="h-8 text-xs px-2.5 gap-1"
                                  >
                                    <PackageCheck className="w-3.5 h-3.5" /> + GR
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPoForHandover(po);
                                      setHandoverDialogOpen(true);
                                    }}
                                    className="h-8 text-xs px-2.5 gap-1"
                                  >
                                    <FileCheck className="w-3.5 h-3.5" /> BAST
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Arsipkan PO ${po.poNumber}`}
                                    disabled={poGrs.length > 0 || !!poHandover}
                                    title={
                                      poGrs.length > 0 || !!poHandover
                                        ? "PO yang sudah memiliki GR atau BAST tidak dapat diarsipkan"
                                        : "Arsipkan PO"
                                    }
                                    onClick={() =>
                                      setArchiveTarget({
                                        kind: "po",
                                        id: po.id,
                                        label: `PO ${po.poNumber}`,
                                      })
                                    }
                                    className="h-8 w-8 text-muted-foreground hover:text-rose-700"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-muted/15">
                              <TableCell colSpan={10} className="p-3 pl-10">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-semibold">
                                    <span>Rincian Material PO {po.poNumber}</span>
                                    {po.attachmentName && (
                                      <AttachmentPreview
                                        filename={po.attachmentName}
                                        title={`Dokumen PO ${po.poNumber}`}
                                        docNumber={po.poNumber}
                                      />
                                    )}
                                  </div>
                                  <div className="rounded border bg-card overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/50 text-[11px]">
                                          <TableHead>Kode SAP</TableHead>
                                          <TableHead>Material</TableHead>
                                          <TableHead className="text-right">Dipesan</TableHead>
                                          <TableHead>Satuan</TableHead>
                                          <TableHead className="text-right">Diterima (GR)</TableHead>
                                          <TableHead className="text-right">Sisa</TableHead>
                                          <TableHead>Status Item</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {po.items.map((it) => (
                                          <TableRow key={it.id} className="text-xs">
                                            <TableCell className="font-mono text-[11px] text-muted-foreground">
                                              {it.sapMaterialCode || "-"}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                              {it.materialName}
                                            </TableCell>
                                            <TableCell className="font-mono text-right">
                                              {it.volume.toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell>{it.unit}</TableCell>
                                            <TableCell className="font-mono font-bold text-right text-emerald-700 dark:text-emerald-400">
                                              {it.receivedVolume.toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell className="font-mono font-bold text-right text-amber-700 dark:text-amber-400">
                                              {it.remainingVolume.toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell>
                                              <StatusBadge status={it.status} />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Riwayat GR & BAST */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card id="section-gr" className="shadow-sm scroll-mt-20">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  Riwayat Goods Receipt ({projectGrs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {projectGrs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Belum ada transaksi penerimaan gudang (GR).
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. GR / PO</TableHead>
                        <TableHead>Tgl Terima</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Masuk</TableHead>
                        <TableHead>Penerima</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectGrs.map((gr) => (
                        <TableRow key={gr.id} className="text-xs">
                          <TableCell>
                            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {gr.grNumber}
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {gr.poNumber}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatIDDate(gr.receiptDate)}
                          </TableCell>
                          <TableCell className="font-medium">{gr.materialName}</TableCell>
                          <TableCell className="font-mono font-bold text-right text-emerald-700 dark:text-emerald-400">
                            +{gr.receivedVolume} {gr.unit}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{gr.recordedBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card id="section-bast" className="shadow-sm scroll-mt-20">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  Berita Acara Serah Terima ({projectHandovers.length})
                </CardTitle>
                {canEditProjects && activePos.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPoForHandover(activePos[0]);
                      setHandoverDialogOpen(true);
                    }}
                    className="h-8 text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Catat BAST
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {projectHandovers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Belum ada dokumen BAST serah terima barang.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. BAST / PO</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Penyerah / Penerima</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectHandovers.map((gh) => (
                        <TableRow key={gh.id} className="text-xs">
                          <TableCell>
                            <div className="font-mono font-bold">{gh.handoverNumber}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {gh.poNumber}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatIDDate(gh.handoverDate)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{gh.giverName}</div>
                            <div className="text-[11px] text-muted-foreground">
                              Ke: {gh.receiverName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={gh.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TRACK 2: JALUR JASA */}
      {activeTrack === "jasa" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <span className="font-semibold block">Usulan USPK</span>
                <span className="text-[11px] text-muted-foreground">
                  {activeUspks.length} Dokumen USPK
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <span className="font-semibold block">Evaluasi Teknis</span>
                <span className="text-[11px] text-muted-foreground">
                  {projectTechEvals.length} Evaluasi
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <span className="font-semibold block">Kontrak SPK Rilis</span>
                <span className="text-[11px] text-muted-foreground">
                  {activeSpks.length} Dokumen SPK
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                4
              </span>
              <div>
                <span className="font-semibold block">Pelaksanaan Lapangan</span>
                <span className="text-[11px] text-muted-foreground">
                  Progres: {project.progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Tabel USPK */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Daftar Usulan SPK (USPK)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rilis SPK bersifat 1:1 terhadap USPK dan mensyaratkan Evaluasi Teknis Direkomendasikan atau USPK Disetujui.
                </p>
              </div>
              {canCreateProcurement && (
                <Button
                  size="sm"
                  onClick={() => setUspkDialogOpen(true)}
                  className="h-9 text-xs gap-1 bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> Buat USPK Baru
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {activeUspks.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Briefcase className="w-8 h-8 opacity-60" />}
                    title="Belum ada Usulan SPK (USPK)"
                    description="Catat usulan pengadaan jasa kontraktor untuk memulai evaluasi teknis dan kontrak SPK."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor USPK</TableHead>
                      <TableHead>Rekanan Kontraktor</TableHead>
                      <TableHead>Lingkup & Volume</TableHead>
                      <TableHead>Nilai Usulan</TableHead>
                      <TableHead>Status USPK</TableHead>
                      <TableHead>Evaluasi Teknis</TableHead>
                      <TableHead>Kontrak SPK</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeUspks.map((uspk) => {
                      const evalRecord = projectTechEvals.find((e) => e.uspkId === uspk.id);
                      const spk = activeSpks.find((s) => s.uspkId === uspk.id);
                      const canReleaseSpk =
                        !spk &&
                        canCreateProcurement &&
                        (evalRecord?.result === "RECOMMENDED" || uspk.status === "APPROVED");

                      return (
                        <TableRow key={uspk.id} className="hover:bg-muted/30 text-xs">
                          <TableCell>
                            <span className="font-semibold font-mono text-foreground block">
                              {uspk.uspkNumber}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatIDDate(uspk.startDate)} s/d {formatIDDate(uspk.endDate)}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{uspk.vendorName}</TableCell>
                          <TableCell className="max-w-xs">
                            <span className="block truncate">{uspk.scope}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              Vol: {uspk.targetVolume ?? "-"} {uspk.unit || ""}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {formatIDR(uspk.value)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={uspk.status} />
                          </TableCell>
                          <TableCell>
                            {evalRecord ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[11px]",
                                  evalRecord.result === "RECOMMENDED"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                                )}
                              >
                                {evalRecord.result === "RECOMMENDED"
                                  ? `Direkomendasikan${evalRecord.score ? ` (${evalRecord.score})` : ""}`
                                  : "Tidak Disetujui"}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                Belum dievaluasi
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono">
                            {spk ? (
                              <div>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                                  {spk.spkNumber}
                                </span>
                                <StatusBadge status={spk.status} showDot={false} />
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Belum ada SPK</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canEditProjects && (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUspkForEval(uspk);
                                    setTechEvalDialogOpen(true);
                                  }}
                                  className="h-8 text-xs px-2.5"
                                >
                                  <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                                  Evaluasi
                                </Button>
                                {!spk && (
                                  <Button
                                    size="sm"
                                    disabled={!canReleaseSpk}
                                    title={
                                      !canReleaseSpk
                                        ? "Memerlukan Evaluasi Teknis Direkomendasikan atau USPK Disetujui"
                                        : "Rilis kontrak SPK"
                                    }
                                    onClick={() => handleCreateSpkFromUspk(uspk)}
                                    className="h-8 text-xs px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
                                  >
                                    <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                                    Rilis SPK
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={`Arsipkan USPK ${uspk.uspkNumber}`}
                                  disabled={!!spk}
                                  title={
                                    spk
                                      ? "Arsipkan SPK terhubung terlebih dahulu"
                                      : "Arsipkan USPK"
                                  }
                                  onClick={() =>
                                    setArchiveTarget({
                                      kind: "uspk",
                                      id: uspk.id,
                                      label: `USPK ${uspk.uspkNumber}`,
                                    })
                                  }
                                  className="h-8 w-8 text-muted-foreground hover:text-rose-700"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tabel Evaluasi Teknis */}
          <Card id="section-tech-eval" className="shadow-sm scroll-mt-20">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Riwayat Evaluasi Teknis Jasa ({projectTechEvals.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Penilaian kelayakan teknis kontraktor sebelum kontrak SPK diterbitkan.
                </p>
              </div>
              {canCreateProcurement && activeUspks.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUspkForEval(activeUspks[0]);
                    setTechEvalDialogOpen(true);
                  }}
                  className="h-9 text-xs gap-1.5"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Catat Evaluasi Teknis
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {projectTechEvals.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada catatan evaluasi teknis untuk USPK proyek ini.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor USPK</TableHead>
                      <TableHead>Kontraktor</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Evaluator</TableHead>
                      <TableHead>Skor</TableHead>
                      <TableHead>Keputusan</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectTechEvals.map((te) => {
                      const uspk = activeUspks.find((u) => u.id === te.uspkId);
                      return (
                        <TableRow key={te.id} className="text-xs">
                          <TableCell className="font-mono font-semibold">
                            {uspk?.uspkNumber || "-"}
                          </TableCell>
                          <TableCell className="font-medium">{uspk?.vendorName || "-"}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {formatIDDate(te.evaluationDate)}
                          </TableCell>
                          <TableCell>{te.evaluatorName}</TableCell>
                          <TableCell className="font-mono font-bold">
                            {te.score ?? "-"}/100
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px]",
                                te.result === "RECOMMENDED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                              )}
                            >
                              {te.result === "RECOMMENDED" ? "Direkomendasikan" : "Tidak Disetujui"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {te.notes}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tabel Kontrak SPK */}
          <Card id="section-spk" className="shadow-sm scroll-mt-20">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Surat Perintah Kerja (SPK) & Realisasi Volume ({activeSpks.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pantau nilai kontrak, durasi pelaksanaan, realisasi volume dari log harian, serta status tutup kontrak.
                </p>
              </div>
              {canCreateProcurement && (
                <Button
                  size="sm"
                  disabled={!activeUspks.some(
                    (u) =>
                      !activeSpks.some((s) => s.uspkId === u.id) &&
                      (u.status === "APPROVED" ||
                        projectTechEvals.some(
                          (te) => te.uspkId === u.id && te.result === "RECOMMENDED"
                        ))
                  )}
                  onClick={() => {
                    const eligibleUspk = activeUspks.find(
                      (u) =>
                        !activeSpks.some((s) => s.uspkId === u.id) &&
                        (u.status === "APPROVED" ||
                          projectTechEvals.some(
                            (te) => te.uspkId === u.id && te.result === "RECOMMENDED"
                          ))
                    );
                    if (eligibleUspk) handleCreateSpkFromUspk(eligibleUspk);
                  }}
                  className="h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> Rilis SPK
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {activeSpks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada kontrak SPK yang diterbitkan pada proyek ini.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. SPK</TableHead>
                      <TableHead>No. USPK</TableHead>
                      <TableHead>Kontraktor & Paket</TableHead>
                      <TableHead>Realisasi Volume</TableHead>
                      <TableHead className="text-right">Nilai Kontrak</TableHead>
                      <TableHead>Periode Pelaksanaan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSpks.map((spk) => {
                      const duration = calculateDaysBetween(spk.startDate, spk.endDate);
                      const summary = getSpkProgressSummary(spk.id);

                      return (
                        <TableRow key={spk.id} className="text-xs hover:bg-muted/30">
                          <TableCell className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {spk.spkNumber}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {spk.uspkNumber}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {spk.vendorName}
                            </div>
                            {spk.workItemName && (
                              <span className="text-[11px] text-muted-foreground block mt-0.5">
                                {spk.workItemName}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[140px]">
                            {spk.targetVolume ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between font-mono text-[11px]">
                                  <span>
                                    {summary.realizedVolume} / {spk.targetVolume} {spk.unit}
                                  </span>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                    {summary.percentComplete}%
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-emerald-700 dark:bg-emerald-500 h-1.5 rounded-full"
                                    style={{ width: `${summary.percentComplete}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {formatIDR(spk.value)}
                          </TableCell>
                          <TableCell className="font-mono text-[11px]">
                            <span className="block">
                              {formatIDDate(spk.startDate)} s/d {formatIDDate(spk.endDate)}
                            </span>
                            <span className="text-muted-foreground">{duration} Hari</span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={spk.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {canEditProjects && (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setSpkStatusTarget({
                                      spk,
                                      nextStatus: spk.status === "ACTIVE" ? "CLOSED" : "ACTIVE",
                                    })
                                  }
                                  className="h-8 text-xs px-2.5 gap-1"
                                >
                                  {spk.status === "ACTIVE" ? (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" /> Tutup SPK
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Buka Kembali
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={`Arsipkan SPK ${spk.spkNumber}`}
                                  onClick={() =>
                                    setArchiveTarget({
                                      kind: "spk",
                                      id: spk.id,
                                      label: `SPK ${spk.spkNumber}`,
                                    })
                                  }
                                  className="h-8 w-8 text-muted-foreground hover:text-rose-700"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Panel Arsip Terhapus (Soft Delete / Restore) */}
      {showArchived && totalArchivedCount > 0 && canEditProjects && (
        <Card className="border-amber-300 dark:border-amber-800 shadow-sm">
          <CardHeader className="pb-3 border-b bg-amber-50/40 dark:bg-amber-950/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Archive className="w-4 h-4" />
              Arsip Dokumen Pengadaan Terhapus ({totalArchivedCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {archivedPrs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between p-2.5 rounded border bg-card">
                <div>
                  <span className="font-mono font-bold">PR {pr.prNumber}</span>
                  <span className="text-muted-foreground ml-2">{pr.workItemName}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void restorePr(pr.id)}
                  className="h-8 text-xs gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
                </Button>
              </div>
            ))}
            {archivedPos.map((po) => (
              <div key={po.id} className="flex items-center justify-between p-2.5 rounded border bg-card">
                <div>
                  <span className="font-mono font-bold">PO {po.poNumber}</span>
                  <span className="text-muted-foreground ml-2">{po.supplierName}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void restorePo(po.id)}
                  className="h-8 text-xs gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
                </Button>
              </div>
            ))}
            {archivedUspks.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2.5 rounded border bg-card">
                <div>
                  <span className="font-mono font-bold">USPK {u.uspkNumber}</span>
                  <span className="text-muted-foreground ml-2">{u.vendorName}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void restoreUspk(u.id)}
                  className="h-8 text-xs gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
                </Button>
              </div>
            ))}
            {archivedSpks.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded border bg-card">
                <div>
                  <span className="font-mono font-bold">SPK {s.spkNumber}</span>
                  <span className="text-muted-foreground ml-2">{s.vendorName}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void restoreSpk(s.id)}
                  className="h-8 text-xs gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialogs */}
      <Dialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Arsipkan Dokumen Pengadaan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Dokumen <strong>{archiveTarget?.label}</strong> akan dipindahkan ke arsip terhapus (soft delete) dan dapat dipulihkan kapan saja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessingAction}
              onClick={() => setArchiveTarget(null)}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isProcessingAction}
              onClick={handleConfirmArchive}
              className="h-9 text-xs"
            >
              Ya, Arsipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!spkStatusTarget} onOpenChange={(o) => !o && setSpkStatusTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {spkStatusTarget?.nextStatus === "CLOSED"
                ? "Konfirmasi Tutup Kontrak SPK"
                : "Konfirmasi Aktifkan Kembali SPK"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              {spkStatusTarget?.nextStatus === "CLOSED"
                ? `Tutup kontrak ${spkStatusTarget?.spk.spkNumber} setelah seluruh pekerjaan kontraktor selesai?`
                : `Aktifkan kembali kontrak ${spkStatusTarget?.spk.spkNumber} menjadi status ACTIVE?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessingAction}
              onClick={() => setSpkStatusTarget(null)}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isProcessingAction}
              onClick={handleConfirmSpkStatus}
              className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Ya, Ubah Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Dialog Modals */}
      <PRRecordDialog open={prDialogOpen} onOpenChange={setPrDialogOpen} project={project} />
      <POCreateDialog
        open={poDialogOpen}
        onOpenChange={setPoDialogOpen}
        project={project}
        preselectedPrId={selectedPrForPo}
      />
      {selectedPrForEval && (
        <VendorEvaluationDialog
          open={evalDialogOpen}
          onOpenChange={setEvalDialogOpen}
          project={project}
          pr={selectedPrForEval}
        />
      )}
      {selectedPoForGr && (
        <GRReceiptDialog
          open={grDialogOpen}
          onOpenChange={setGrDialogOpen}
          po={selectedPoForGr}
        />
      )}
      {selectedPoForHandover && (
        <GoodsHandoverDialog
          open={handoverDialogOpen}
          onOpenChange={setHandoverDialogOpen}
          project={project}
          po={selectedPoForHandover}
        />
      )}
      <USPKCreateDialog open={uspkDialogOpen} onOpenChange={setUspkDialogOpen} project={project} />
      {selectedUspkForEval && (
        <TechnicalEvaluationDialog
          open={techEvalDialogOpen}
          onOpenChange={setTechEvalDialogOpen}
          project={project}
          uspk={selectedUspkForEval}
        />
      )}
      <SPKCreateDialog
        open={spkDialogOpen}
        onOpenChange={setSpkDialogOpen}
        project={project}
        preselectedUspk={selectedUspkForSpk}
      />
    </div>
  );
}

export default function UnifiedProcurementHub() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-xs text-muted-foreground">
          Memuat hub pengadaan proyek...
        </div>
      }
    >
      <UnifiedProcurementHubContent />
    </Suspense>
  );
}
