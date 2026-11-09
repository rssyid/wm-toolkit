"use client";

import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Briefcase,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileText,
  BadgeCheck,
  Package,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyText } from "@/components/shared/currency-text";
import { AttachmentPreview } from "@/components/shared/attachment-preview";

// Dialogs
import { PRRecordDialog } from "@/components/procurement/pr-record-dialog";
import { POCreateDialog } from "@/components/procurement/po-create-dialog";
import { VendorEvaluationDialog } from "@/components/procurement/vendor-evaluation-dialog";
import { GoodsHandoverDialog } from "@/components/procurement/goods-handover-dialog";
import { GRReceiptDialog } from "@/components/procurement/gr-receipt-dialog";
import { USPKCreateDialog } from "@/components/services/uspk-create-dialog";
import { TechnicalEvaluationDialog } from "@/components/services/technical-evaluation-dialog";
import { SPKCreateDialog } from "@/components/services/spk-create-dialog";

import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, cn } from "@/lib/utils";
import {
  PurchaseRequisition,
  PurchaseOrder,
  USPKItem,
  SPKContract,
} from "@/types";
import { toast } from "sonner";

export default function UnifiedProcurementHub() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.projectId as string;
  const initialTrack = searchParams?.get("track") || "barang";

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
    isViewerOnly,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);

  const [activeTrack, setActiveTrack] = useState<string>(initialTrack);

  // Dialog states for Jalur Barang
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [grDialogOpen, setGrDialogOpen] = useState(false);
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);

  const [selectedPrForPo, setSelectedPrForPo] = useState<string | undefined>(undefined);
  const [selectedPrForEval, setSelectedPrForEval] = useState<PurchaseRequisition | null>(null);
  const [selectedPoForGr, setSelectedPoForGr] = useState<PurchaseOrder | null>(null);
  const [selectedPoForHandover, setSelectedPoForHandover] = useState<PurchaseOrder | null>(null);

  // Dialog states for Jalur Jasa
  const [uspkDialogOpen, setUspkDialogOpen] = useState(false);
  const [techEvalDialogOpen, setTechEvalDialogOpen] = useState(false);
  const [spkDialogOpen, setSpkDialogOpen] = useState(false);
  const [selectedUspkForEval, setSelectedUspkForEval] = useState<USPKItem | null>(null);
  const [selectedUspkForSpk, setSelectedUspkForSpk] = useState<USPKItem | null>(null);

  // Expanded items
  const [expandedPrIds, setExpandedPrIds] = useState<Record<string, boolean>>({});

  if (!project) return null;

  // Filter project data
  const projectPrs = prs.filter((p) => p.projectId === projectId);
  const projectPos = pos.filter((p) => p.projectId === projectId);
  const projectGrs = grs.filter((g) =>
    projectPos.some((po) => po.id === g.poId)
  );
  const projectHandovers = goodsHandovers.filter(
    (gh) => projectPos.some((po) => po.id === gh.poId) || gh.projectId === projectId
  );

  const projectUspks = uspks.filter((u) => u.projectId === projectId);
  const projectTechEvals = technicalEvaluations.filter((e) => e.projectId === projectId);
  const projectSpks = spkContracts.filter((s) => s.projectId === projectId);

  // Totals
  const totalPoValue = projectPos.reduce((sum, p) => sum + (p.poValue || 0), 0);
  const totalSpkValue = projectSpks.reduce((sum, s) => sum + (s.value || 0), 0);

  const toggleExpandPr = (prId: string) => {
    setExpandedPrIds((prev) => ({ ...prev, [prId]: !prev[prId] }));
  };

  const handleCreatePoFromPr = (prId: string) => {
    setSelectedPrForPo(prId);
    setPoDialogOpen(true);
  };

  const handleOpenVendorEval = (pr: PurchaseRequisition) => {
    setSelectedPrForEval(pr);
    setEvalDialogOpen(true);
  };

  const handleOpenTechEval = (uspk: USPKItem) => {
    setSelectedUspkForEval(uspk);
    setTechEvalDialogOpen(true);
  };

  const handleCreateSpkFromUspk = (uspk: USPKItem) => {
    setSelectedUspkForSpk(uspk);
    setSpkDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Dual-Track Switcher & KPI Banner */}
      <div className="rounded-lg border bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-foreground">
                Hub Pengadaan & Kontrak Terpadu
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola alur paralel Jalur Pengadaan Barang dan Jalur Jasa Kontraktor dalam satu tempat.
            </p>
          </div>

          {!isViewerOnly && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPrDialogOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah PR (Barang)
              </Button>
              <Button
                size="sm"
                onClick={() => setUspkDialogOpen(true)}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Buat USPK (Jasa)
              </Button>
            </div>
          )}
        </div>

        {/* Dual-Track Tabs Header */}
        <div className="flex items-center justify-between border-t pt-3">
          <Tabs
            value={activeTrack}
            onValueChange={setActiveTrack}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-9">
              <TabsTrigger
                value="barang"
                className="text-xs gap-2 data-[state=active]:font-semibold"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Jalur Barang ({projectPrs.length} PR / {projectPos.length} PO)
              </TabsTrigger>
              <TabsTrigger
                value="jasa"
                className="text-xs gap-2 data-[state=active]:font-semibold"
              >
                <Briefcase className="w-3.5 h-3.5" />
                Jalur Jasa ({projectUspks.length} USPK / {projectSpks.length} SPK)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Komitmen PO: </span>
              <strong className="text-foreground">{formatIDR(totalPoValue)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Kontrak SPK: </span>
              <strong className="text-foreground">{formatIDR(totalSpkValue)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* TRACK 1: JALUR BARANG */}
      {activeTrack === "barang" && (
        <div className="space-y-4">
          {/* Visual Step Process Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border bg-card flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <span className="font-semibold block">PR Diterbitkan</span>
                <span className="text-[10px] text-muted-foreground">
                  {projectPrs.length} Dokumen PR
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border bg-card flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <span className="font-semibold block">Evaluasi Vendor</span>
                <span className="text-[10px] text-muted-foreground">
                  {vendorEvaluations.filter((ve) =>
                    projectPrs.some((pr) => pr.id === ve.prId)
                  ).length}{" "}
                  Vendor Terevaluasi
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border bg-card flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <span className="font-semibold block">PO Diterbitkan</span>
                <span className="text-[10px] text-muted-foreground">
                  {projectPos.length} Dokumen PO
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border bg-card flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                4
              </span>
              <div>
                <span className="font-semibold block">Serah Terima & GR</span>
                <span className="text-[10px] text-muted-foreground">
                  {projectGrs.length} GR / {projectHandovers.length} BAST
                </span>
              </div>
            </div>
          </div>

          {/* Daftar PR & PO Berkaitan */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Daftar Purchase Requisition (PR) & Rantai PO
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Klik tanda panah untuk melihat PO, status barang, dan serah terima dari masing-masing PR.
                </p>
              </div>
              {!isViewerOnly && (
                <Button
                  size="sm"
                  onClick={() => setPrDialogOpen(true)}
                  className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah PR
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {projectPrs.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground space-y-2">
                  <ShoppingCart className="w-8 h-8 mx-auto opacity-40 text-muted-foreground" />
                  <p className="font-semibold">Belum ada Purchase Requisition (PR)</p>
                  <p>Mulai catat PR barang untuk menginisiasi pengadaan material proyek ini.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
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
                    {projectPrs.map((pr) => {
                      const isExpanded = !!expandedPrIds[pr.id];
                      const linkedPos = projectPos.filter((po) => po.relatedPrId === pr.id);
                      const prEvals = vendorEvaluations.filter((ve) => ve.prId === pr.id);
                      const recommendedEval = prEvals.find((e) => e.result === "RECOMMENDED");

                      return (
                        <React.Fragment key={pr.id}>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleExpandPr(pr.id)}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-xs text-foreground font-mono">
                                {pr.prNumber}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                SAP: {pr.sapPrNumber}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {pr.workItemName}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {formatIDDate(pr.releaseDate)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={pr.status} />
                            </TableCell>
                            <TableCell className="text-xs">
                              {prEvals.length > 0 ? (
                                <div className="space-y-0.5">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-1.5 py-0 h-4 font-normal",
                                      recommendedEval
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                        : "bg-rose-50 text-rose-800 border-rose-300"
                                    )}
                                  >
                                    {recommendedEval
                                      ? `✓ ${recommendedEval.supplierName}`
                                      : `${prEvals.length} Evaluasi`}
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">
                                  Belum dievaluasi
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {linkedPos.length > 0 ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  {linkedPos.length} PO
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {!isViewerOnly && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenVendorEval(pr)}
                                      className="h-7 text-[11px] px-2"
                                    >
                                      <ClipboardCheck className="w-3 h-3 mr-1" />
                                      Evaluasi
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleCreatePoFromPr(pr.id)}
                                      className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Buat PO
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expanded PO details under this PR */}
                          {isExpanded && (
                            <TableRow className="bg-muted/15 border-b">
                              <TableCell colSpan={8} className="p-3 pl-10 space-y-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                                      Purchase Orders (PO) dari {pr.prNumber}
                                    </span>
                                    {!isViewerOnly && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCreatePoFromPr(pr.id)}
                                        className="h-6 text-[10px] gap-1"
                                      >
                                        <Plus className="w-3 h-3" /> Tambah PO untuk PR ini
                                      </Button>
                                    )}
                                  </div>

                                  {linkedPos.length === 0 ? (
                                    <div className="p-3 text-center border rounded bg-background text-xs text-muted-foreground">
                                      Belum ada PO yang dibuat untuk PR ini. Klik tombol <strong>"Buat PO"</strong> untuk menerbitkan pesanan pembelian.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {linkedPos.map((po) => {
                                        const poGrs = projectGrs.filter((g) => g.poId === po.id);
                                        const poHandover = projectHandovers.find((h) => h.poId === po.id);

                                        return (
                                          <Card
                                            key={po.id}
                                            className="p-3 bg-card shadow-xs border space-y-2 text-xs"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <span className="font-mono font-bold text-foreground">
                                                  {po.poNumber}
                                                </span>
                                                <span className="block text-[11px] text-muted-foreground font-sans">
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
                                                Rilis: {formatIDDate(po.releaseDate)}
                                              </span>
                                            </div>

                                            {/* Action Bar for this PO */}
                                            {!isViewerOnly && (
                                              <div className="flex items-center justify-end gap-1.5 border-t pt-2">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    setSelectedPoForGr(po);
                                                    setGrDialogOpen(true);
                                                  }}
                                                  className="h-6 text-[10px] px-2 gap-1"
                                                >
                                                  <Truck className="w-3 h-3" />
                                                  Catat GR ({poGrs.length})
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    setSelectedPoForHandover(po);
                                                    setHandoverDialogOpen(true);
                                                  }}
                                                  className="h-6 text-[10px] px-2 gap-1"
                                                >
                                                  <BadgeCheck className="w-3 h-3 text-emerald-600" />
                                                  BAST {poHandover ? "(Lengkap)" : "(Input)"}
                                                </Button>
                                              </div>
                                            )}
                                          </Card>
                                        );
                                      })}
                                    </div>
                                  )}
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
        </div>
      )}

      {/* TRACK 2: JALUR JASA */}
      {activeTrack === "jasa" && (
        <div className="space-y-4">
          {/* Visual Step Process Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border bg-card flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <span className="font-semibold block">Usulan USPK</span>
                <span className="text-[10px] text-muted-foreground">
                  {projectUspks.length} Dokumen USPK
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border bg-card flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <span className="font-semibold block">Evaluasi Teknis</span>
                <span className="text-[10px] text-muted-foreground">
                  {projectTechEvals.length} Dievaluasi
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border bg-card flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <span className="font-semibold block">Kontrak SPK Rilis</span>
                <span className="text-[10px] text-muted-foreground">
                  {projectSpks.length} SPK Aktif
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border bg-card flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                4
              </span>
              <div>
                <span className="font-semibold block">Pelaksanaan Lapangan</span>
                <span className="text-[10px] text-muted-foreground">
                  Progres: {project.progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Tabel USPK & Rantai Kontrak SPK */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Daftar Usulan SPK (USPK) & Kontrak Kerja
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Proses usulan penyedia jasa, penilaian evaluasi teknis, dan penerbitan kontrak kerja SPK.
                </p>
              </div>
              {!isViewerOnly && (
                <Button
                  size="sm"
                  onClick={() => setUspkDialogOpen(true)}
                  className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> Buat USPK Baru
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {projectUspks.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground space-y-2">
                  <Briefcase className="w-8 h-8 mx-auto opacity-40 text-muted-foreground" />
                  <p className="font-semibold">Belum ada Usulan SPK (USPK)</p>
                  <p>Mulai catat USPK untuk pekerjaan konstruksi, kontraktor sipil, atau pemborongan jasa.</p>
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
                    {projectUspks.map((uspk) => {
                      const evalRecord = projectTechEvals.find((e) => e.uspkId === uspk.id);
                      const spk = projectSpks.find((s) => s.uspkId === uspk.id);

                      return (
                        <TableRow key={uspk.id} className="hover:bg-muted/30">
                          <TableCell>
                            <span className="font-semibold text-xs font-mono text-foreground block">
                              {uspk.uspkNumber}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatIDDate(uspk.startDate)} s/d {formatIDDate(uspk.endDate)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {uspk.vendorName}
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate">
                            <span className="block truncate">{uspk.scope}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Vol: {uspk.targetVolume} {uspk.unit}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-mono font-semibold">
                            {formatIDR(uspk.value)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={uspk.status} />
                          </TableCell>
                          <TableCell className="text-xs">
                            {evalRecord ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0 h-4",
                                  evalRecord.result === "RECOMMENDED"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-rose-50 text-rose-800 border-rose-300"
                                )}
                              >
                                {evalRecord.result === "RECOMMENDED"
                                  ? `Direkomendasikan (${evalRecord.score || 85})`
                                  : "Tidak Disetujui"}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                Belum evaluasi
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {spk ? (
                              <div>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                                  {spk.spkNumber}
                                </span>
                                <StatusBadge status={spk.status} showDot={false} />
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                Belum ada SPK
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isViewerOnly && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenTechEval(uspk)}
                                    className="h-7 text-[11px] px-2"
                                  >
                                    <ClipboardCheck className="w-3 h-3 mr-1" />
                                    Evaluasi
                                  </Button>
                                  {!spk && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleCreateSpkFromUspk(uspk)}
                                      className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                    >
                                      <FileCheck2 className="w-3 h-3 mr-1" />
                                      Rilis SPK
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
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

      {/* Dialog Modals */}
      <PRRecordDialog
        open={prDialogOpen}
        onOpenChange={setPrDialogOpen}
        project={project}
      />
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

      <USPKCreateDialog
        open={uspkDialogOpen}
        onOpenChange={setUspkDialogOpen}
        project={project}
      />
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
