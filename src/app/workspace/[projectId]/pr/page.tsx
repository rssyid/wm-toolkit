"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { PRRecordDialog } from "@/components/procurement/pr-record-dialog";
import { POCreateDialog } from "@/components/procurement/po-create-dialog";
import { VendorEvaluationDialog } from "@/components/procurement/vendor-evaluation-dialog";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate } from "@/lib/utils";
import { PurchaseRequisition } from "@/types";
import { ArrowRight, CheckCheck, Truck, ShieldCheck } from "lucide-react";

export default function PRTrackingTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, prs, vendorEvaluations, isViewerOnly } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const projectPrs = prs.filter((p) => p.projectId === projectId);

  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [selectedPrIdForPo, setSelectedPrIdForPo] = useState<string | undefined>(undefined);
  const [selectedPrForEval, setSelectedPrForEval] = useState<PurchaseRequisition | null>(null);

  const [expandedPrIds, setExpandedPrIds] = useState<Record<string, boolean>>({
    [projectPrs[0]?.id || ""]: true,
  });

  if (!project) return null;

  const toggleExpand = (id: string) => {
    setExpandedPrIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreatePoFromPr = (prId: string) => {
    setSelectedPrIdForPo(prId);
    setPoDialogOpen(true);
  };

  const handleOpenEvalModal = (pr: PurchaseRequisition) => {
    setSelectedPrForEval(pr);
    setEvalDialogOpen(true);
  };

  const projectVendorEvals = vendorEvaluations.filter((v) => v.projectId === projectId);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Visual Workflow Pipeline Banner: Jalur Barang */}
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Alur Jalur Barang: PR &bull; Evaluasi Vendor &bull; PO &bull; BAST
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50/70 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
              <div>
                <span className="font-semibold block">1. Rilis PR SAP</span>
                <span className="text-[10px] text-muted-foreground">{projectPrs.length} PR Tercatat</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50/70 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
              <div>
                <span className="font-semibold block">2. Evaluasi Vendor</span>
                <span className="text-[10px] text-muted-foreground">{projectVendorEvals.length} Rekanan Dievaluasi</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-900/50 border">
              <span className="w-5 h-5 rounded-full bg-muted text-foreground font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
              <div>
                <span className="font-semibold block">3. Terbitkan PO</span>
                <span className="text-[10px] text-muted-foreground">Katalog & Nilai PO</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-900/50 border">
              <span className="w-5 h-5 rounded-full bg-muted text-foreground font-bold flex items-center justify-center text-[10px] shrink-0">4</span>
              <div>
                <span className="font-semibold block">4. BAST Barang</span>
                <span className="text-[10px] text-muted-foreground">Serah Terima Resmi</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-xs">
          <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold">
                  Daftar Purchase Requisition (PR) & Evaluasi Rekanan Barang
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pencatatan nomor PR SAP, penilaian kelaikan rekanan vendor penyedia barang, dan kontrol penerbitan PO.
              </p>
            </div>

            {!isViewerOnly && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setPrDialogOpen(true)}
                  className="gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Catat Rilis PR SAP
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[110px]">Nomor PR</TableHead>
                  <TableHead className="w-[100px]">SAP PR Doc</TableHead>
                  <TableHead className="min-w-[190px]">Item Pekerjaan / Uraian</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Tanggal Rilis</TableHead>
                  <TableHead>Evaluasi Rekanan</TableHead>
                  <TableHead className="text-center">PO Terkait</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lampiran</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectPrs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-xs text-muted-foreground">
                      Belum ada Purchase Requisition (PR) yang dicatat untuk proyek ini.
                      Klik tombol "Catat Rilis PR SAP" di atas untuk menambahkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  projectPrs.map((pr) => {
                    const isExpanded = !!expandedPrIds[pr.id];
                    const evaluations = vendorEvaluations.filter((e) => e.prId === pr.id);
                    const recommendedEvals = evaluations.filter((e) => e.result === "RECOMMENDED");
                    const hasRecommendedVendor = recommendedEvals.length > 0;

                    return (
                      <React.Fragment key={pr.id}>
                        <TableRow className="hover:bg-muted/30 font-medium">
                          <TableCell className="p-2 text-center">
                            <button
                              onClick={() => toggleExpand(pr.id)}
                              className="p-1 hover:bg-muted rounded text-muted-foreground"
                              title="Tampilkan / Sembunyikan Evaluasi Vendor"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-xs text-blue-700 dark:text-blue-400">
                            {pr.prNumber}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {pr.sapPrNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-semibold text-foreground">{pr.workItemName}</span>
                              <span className="text-[11px] text-muted-foreground line-clamp-1">{pr.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {pr.prType}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <span className="font-semibold text-foreground block">
                              {formatIDDate(pr.releaseDate)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">Otorisasi SAP</span>
                          </TableCell>
                          <TableCell>
                            {evaluations.length === 0 ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              >
                                Belum Dievaluasi
                              </Badge>
                            ) : hasRecommendedVendor ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1 font-semibold"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {recommendedEvals.length} Direkomendasikan
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 gap-1"
                              >
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Gugur ({evaluations.length})
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-xs">
                            {pr.linkedPoCount > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 font-semibold border border-emerald-200">
                                {pr.linkedPoCount} PO
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0 PO</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={pr.status} />
                          </TableCell>
                          <TableCell>
                            <AttachmentPreview
                              filename={pr.attachmentName || `SAP_PR_${pr.sapPrNumber}.pdf`}
                              title={`Dokumen PR SAP No. ${pr.sapPrNumber}`}
                              description={pr.description}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Action 1: Catat Evaluasi Rekanan */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEvalModal(pr)}
                                className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
                                title="Catat hasil evaluasi teknis & komersial vendor rekanan"
                              >
                                <ClipboardCheck className="w-3.5 h-3.5" /> Evaluasi Rekanan
                              </Button>

                              {/* Action 2: Workflow Guardrail on + Buat PO */}
                              {hasRecommendedVendor ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreatePoFromPr(pr.id)}
                                  className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300"
                                  title="Terbitkan PO baru dari PR ini"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" /> + Buat PO
                                </Button>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-block cursor-not-allowed">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled
                                        className="h-7 text-xs gap-1 opacity-50 cursor-not-allowed border-muted-foreground/30 text-muted-foreground"
                                      >
                                        <ShoppingCart className="w-3.5 h-3.5" /> + Buat PO
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs">
                                    <div className="flex items-start gap-1.5 text-amber-500">
                                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                      <span>
                                        <strong>Guardrail Alur:</strong> PR harus memiliki minimal 1 vendor dengan hasil evaluasi "Direkomendasikan" sebelum Purchase Order dapat diterbitkan.
                                      </span>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expandable Sub-Row: Riwayat Evaluasi Rekanan Vendor */}
                        {isExpanded && (
                          <TableRow className="bg-muted/15 border-b-2">
                            <TableCell colSpan={11} className="p-3 pl-12 pr-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                                  <div className="flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4 text-blue-600" />
                                    <span>
                                      Riwayat Evaluasi Vendor untuk PR {pr.prNumber} ({evaluations.length} Rekanan Dievaluasi):
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenEvalModal(pr)}
                                    className="h-6 text-[11px] gap-1 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                                  >
                                    <Plus className="w-3 h-3" /> Tambah Evaluasi Vendor
                                  </Button>
                                </div>

                                {evaluations.length === 0 ? (
                                  <div className="p-4 rounded border border-dashed text-center bg-card">
                                    <p className="text-xs text-muted-foreground">
                                      Belum ada rekanan vendor yang dievaluasi untuk PR ini.
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenEvalModal(pr)}
                                      className="mt-2 h-7 text-xs gap-1 border-blue-300 text-blue-700"
                                    >
                                      <ClipboardCheck className="w-3.5 h-3.5" /> Catat Evaluasi Pertama
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="rounded border bg-card overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/50 text-[11px]">
                                          <TableHead className="h-8 min-w-[170px]">Nama Vendor Rekanan</TableHead>
                                          <TableHead className="h-8">Tanggal Evaluasi</TableHead>
                                          <TableHead className="h-8">Evaluator & Jabatan</TableHead>
                                          <TableHead className="h-8 text-center">Skor</TableHead>
                                          <TableHead className="h-8">Hasil Rekomendasi</TableHead>
                                          <TableHead className="h-8 min-w-[220px]">Catatan Teknis & Komersial</TableHead>
                                          <TableHead className="h-8 text-right">Berita Acara Komparasi</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {evaluations.map((ev) => (
                                          <TableRow key={ev.id} className="text-xs">
                                            <TableCell className="font-semibold text-foreground">
                                              {ev.supplierName}
                                            </TableCell>
                                            <TableCell className="font-mono text-muted-foreground">
                                              {formatIDDate(ev.evaluationDate)}
                                            </TableCell>
                                            <TableCell>
                                              <span className="font-medium text-foreground block">{ev.evaluatorName}</span>
                                              <span className="text-[10px] text-muted-foreground">{ev.evaluatorJabatan || "-"}</span>
                                            </TableCell>
                                            <TableCell className="text-center font-mono font-bold">
                                              {ev.score !== undefined ? `${ev.score}` : "-"}
                                            </TableCell>
                                            <TableCell>
                                              {ev.result === "RECOMMENDED" ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 border-none font-semibold text-[10px] gap-1">
                                                  <CheckCircle2 className="w-3 h-3" /> RECOMMENDED
                                                </Badge>
                                              ) : (
                                                <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 border-none font-semibold text-[10px] gap-1">
                                                  <XCircle className="w-3 h-3" /> NOT RECOMMENDED
                                                </Badge>
                                              )}
                                            </TableCell>
                                            <TableCell className="italic text-muted-foreground text-[11px]">
                                              "{ev.notes}"
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <AttachmentPreview
                                                filename={ev.attachmentName || `BA_Evaluasi_${pr.prNumber}.pdf`}
                                                title={`Berita Acara Evaluasi Rekanan - ${ev.supplierName}`}
                                                description={ev.notes}
                                              />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dedicated Section: Rekapitulasi Evaluasi Vendor antara PR dan PO */}
        <Card className="shadow-xs">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <CardTitle className="text-sm font-semibold">
                  Evaluasi Rekanan Vendor (Tahap Antara PR dan PO)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daftar komparasi vendor, skor evaluasi mutu & komersial, serta status kelayakan sebelum Purchase Order (PO) diterbitkan.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {projectVendorEvals.length} Rekanan Dievaluasi
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Nomor PR</TableHead>
                  <TableHead className="min-w-[170px]">Vendor Rekanan</TableHead>
                  <TableHead>Evaluator</TableHead>
                  <TableHead>Tanggal Evaluasi</TableHead>
                  <TableHead className="text-center">Skor</TableHead>
                  <TableHead>Hasil Evaluasi</TableHead>
                  <TableHead className="min-w-[200px]">Catatan Komersial / Teknis</TableHead>
                  <TableHead className="text-right">Berita Acara</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectVendorEvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground">
                      Belum ada evaluasi rekanan vendor yang tercatat untuk PR proyek ini.
                      {!isViewerOnly && (
                        <span className="block mt-1">
                          Klik tombol &quot;Evaluasi Rekanan&quot; pada tabel PR di atas untuk mencatat komparasi vendor.
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  projectVendorEvals.map((ev) => (
                    <TableRow key={ev.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-mono font-bold text-blue-700 dark:text-blue-400">
                        {ev.prNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {ev.supplierName}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground block">{ev.evaluatorName}</span>
                        <span className="text-[10px] text-muted-foreground">{ev.evaluatorJabatan || "-"}</span>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {formatIDDate(ev.evaluationDate)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {ev.score !== undefined ? `${ev.score}` : "-"}
                      </TableCell>
                      <TableCell>
                        {ev.result === "RECOMMENDED" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none font-semibold text-[10px] gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> RECOMMENDED
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-none font-semibold text-[10px] gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" /> NOT RECOMMENDED
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="italic text-muted-foreground text-[11px]">
                        &quot;{ev.notes}&quot;
                      </TableCell>
                      <TableCell className="text-right">
                        <AttachmentPreview
                          filename={ev.attachmentName || `BA_Evaluasi_${ev.prNumber}.pdf`}
                          title={`Berita Acara Evaluasi Rekanan - ${ev.supplierName}`}
                          description={ev.notes}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <PRRecordDialog
          open={prDialogOpen}
          onOpenChange={setPrDialogOpen}
          project={project}
        />

        <POCreateDialog
          open={poDialogOpen}
          onOpenChange={setPoDialogOpen}
          project={project}
          preselectedPrId={selectedPrIdForPo}
        />

        {selectedPrForEval && (
          <VendorEvaluationDialog
            open={evalDialogOpen}
            onOpenChange={setEvalDialogOpen}
            project={project}
            pr={selectedPrForEval}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
