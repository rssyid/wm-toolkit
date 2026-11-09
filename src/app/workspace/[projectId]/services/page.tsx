"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  FileCheck2,
  Plus,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  FileText,
  Building2,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
import { USPKCreateDialog } from "@/components/services/uspk-create-dialog";
import { TechnicalEvaluationDialog } from "@/components/services/technical-evaluation-dialog";
import { SPKCreateDialog } from "@/components/services/spk-create-dialog";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, calculateDaysBetween, cn } from "@/lib/utils";
import { USPKItem, SPKContract } from "@/types";
import { toast } from "sonner";

export default function ServicesAndSPKTab() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const {
    projects,
    uspks,
    technicalEvaluations,
    spkContracts,
    updateSpkStatus,
    getSpkProgressSummary,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);

  // Filter items for current project
  const projectUspks = uspks.filter((u) => u.projectId === projectId);
  const projectEvals = technicalEvaluations.filter((e) => e.projectId === projectId);
  const projectSpks = spkContracts.filter((s) => s.projectId === projectId);

  // Active sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<"uspk" | "spk">("uspk");

  // Modal dialog states
  const [uspkDialogOpen, setUspkDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [spkDialogOpen, setSpkDialogOpen] = useState(false);
  const [selectedUspkForEval, setSelectedUspkForEval] = useState<USPKItem | null>(null);
  const [selectedUspkForSpk, setSelectedUspkForSpk] = useState<USPKItem | null>(null);

  // Expandable row state for USPK table
  const [expandedUspkIds, setExpandedUspkIds] = useState<Record<string, boolean>>({
    [projectUspks[0]?.id || ""]: true,
  });

  if (!project) return null;

  const toggleExpand = (id: string) => {
    setExpandedUspkIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenEvalModal = (uspk: USPKItem) => {
    setSelectedUspkForEval(uspk);
    setEvalDialogOpen(true);
  };

  const handleOpenSpkModalFromUspk = (uspk: USPKItem) => {
    setSelectedUspkForSpk(uspk);
    setSpkDialogOpen(true);
  };

  const handleCloseSpk = (spk: SPKContract) => {
    if (confirm(`Yakin ingin menutup kontrak resmi ${spk.spkNumber} (${spk.vendorName})? Status kontrak akan diubah menjadi CLOSED.`)) {
      updateSpkStatus(spk.id, "CLOSED");
      toast.success(`Kontrak ${spk.spkNumber} berhasil ditutup.`);
    }
  };

  // Header KPI calculations
  const totalUspkCount = projectUspks.length;
  const approvedUspkCount = projectUspks.filter((u) => u.status === "APPROVED").length;
  const pendingUspkCount = projectUspks.filter((u) => u.status === "SUBMITTED" || u.status === "DRAFT").length;
  const activeSpkCount = projectSpks.filter((s) => s.status === "ACTIVE").length;
  const totalCommitmentValue = projectSpks.reduce((acc, s) => acc + s.value, 0);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* New 3 Tabs Navigation Banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Jalur Jasa kini memiliki 3 tab khusus: <strong>USPK</strong>, <strong>Evaluasi Teknis</strong>, dan <strong>SPK</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/workspace/${projectId}/uspk`}>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-blue-700 hover:bg-blue-100 border-blue-300 dark:bg-blue-900 dark:text-blue-100">
                Buka Tab USPK
              </Button>
            </Link>
            <Link href={`/workspace/${projectId}/technical-evaluation`}>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-emerald-700 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100">
                Buka Evaluasi Teknis
              </Button>
            </Link>
            <Link href={`/workspace/${projectId}/spk`}>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-indigo-700 hover:bg-indigo-100 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-100">
                Buka Tab SPK
              </Button>
            </Link>
          </div>
        </div>

        {/* Header KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total USPK */}
          <Card className="shadow-xs border-l-4 border-l-blue-500">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Total Usulan SPK (USPK)
                  </span>
                  <span className="text-xl font-bold font-mono text-foreground mt-0.5 block">
                    {totalUspkCount} Usulan
                  </span>
                </div>
                <div className="p-2 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {approvedUspkCount} Disetujui
                </span>
                <span>&bull;</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {pendingUspkCount} Menunggu
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Evaluasi Teknis */}
          <Card className="shadow-xs border-l-4 border-l-emerald-500">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Evaluasi Teknis Rekanan
                  </span>
                  <span className="text-xl font-bold font-mono text-foreground mt-0.5 block">
                    {projectEvals.length} Tercatat
                  </span>
                </div>
                <div className="p-2 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {projectEvals.filter((e) => e.result === "RECOMMENDED").length} Rekomendasi
                </span>
                <span>&bull;</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  {projectEvals.filter((e) => e.result === "NOT_RECOMMENDED").length} Tidak Lolos
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Kontrak SPK Aktif */}
          <Card className="shadow-xs border-l-4 border-l-indigo-500">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Kontrak SPK Resmi
                  </span>
                  <span className="text-xl font-bold font-mono text-foreground mt-0.5 block">
                    {projectSpks.length} Kontrak
                  </span>
                </div>
                <div className="p-2 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {activeSpkCount} Aktif Berjalan
                </span>
                <span>&bull;</span>
                <span className="text-muted-foreground">
                  {projectSpks.filter((s) => s.status === "CLOSED").length} Selesai/Tutup
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Total Komitmen Nilai Jasa */}
          <Card className="shadow-xs border-l-4 border-l-amber-500">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Komitmen Nilai Kontrak SPK
                  </span>
                  <span className="text-lg font-bold font-mono text-foreground mt-0.5 block">
                    {formatIDR(totalCommitmentValue)}
                  </span>
                </div>
                <div className="p-2 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                <span>Alokasi AFCE:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatIDR(project.afceValue)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Sub-Tabs Component */}
        <Tabs
          value={activeSubTab}
          onValueChange={(val) => setActiveSubTab(val as "uspk" | "spk")}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="uspk" className="text-xs gap-1.5 font-medium">
                <Briefcase className="w-3.5 h-3.5" />
                1. Usulan SPK (USPK) & Evaluasi Teknis
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0 text-[10px] font-mono"
                >
                  {projectUspks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="spk" className="text-xs gap-1.5 font-medium">
                <FileCheck2 className="w-3.5 h-3.5" />
                2. Kontrak SPK Resmi (1:1)
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0 text-[10px] font-mono"
                >
                  {projectSpks.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Quick Action Button dependent on active tab */}
            {activeSubTab === "uspk" ? (
              <Button
                size="sm"
                onClick={() => setUspkDialogOpen(true)}
                className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" /> + Buat USPK Baru
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedUspkForSpk(null);
                  setSpkDialogOpen(true);
                }}
                className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" /> + Terbitkan SPK Resmi
              </Button>
            )}
          </div>

          {/* ============================================================== */}
          {/* SUB-TAB 1: USPK & EVALUASI TEKNIS */}
          {/* ============================================================== */}
          <TabsContent value="uspk" className="space-y-4 mt-0">
            <Card className="shadow-xs">
              <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-sm font-semibold">
                      Daftar Usulan SPK (USPK) & Hasil Evaluasi Teknis Rekanan
                    </CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tahapan 4B.1 & 4B.2: Pengajuan rekanan jasa, penilaian kelayakan teknis peralatan & personel, serta guardrail penerbitan SPK.
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead className="w-[125px]">Nomor USPK</TableHead>
                      <TableHead className="min-w-[170px]">Rekanan Kontraktor</TableHead>
                      <TableHead className="min-w-[180px]">Lingkup Pekerjaan</TableHead>
                      <TableHead className="w-[120px] text-right">Target (uoM)</TableHead>
                      <TableHead className="w-[130px]">Pelaksanaan</TableHead>
                      <TableHead className="w-[120px] text-right">Nilai Usulan</TableHead>
                      <TableHead className="w-[140px]">Evaluasi Teknis</TableHead>
                      <TableHead className="w-[100px]">Status USPK</TableHead>
                      <TableHead className="w-[180px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectUspks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="h-32 text-center text-xs text-muted-foreground"
                        >
                          Belum ada Usulan SPK (USPK) yang dicatat untuk proyek ini.
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUspkDialogOpen(true)}
                              className="text-xs gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Buat USPK Sekarang
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      projectUspks.map((uspk) => {
                        const isExpanded = !!expandedUspkIds[uspk.id];
                        const evaluation = projectEvals.find((e) => e.uspkId === uspk.id);
                        const isRecommended = evaluation?.result === "RECOMMENDED";
                        const linkedSpk = projectSpks.find((s) => s.uspkId === uspk.id);

                        return (
                          <React.Fragment key={uspk.id}>
                            {/* USPK Parent Row */}
                            <TableRow className="hover:bg-muted/40 font-medium">
                              {/* Expand Toggle */}
                              <TableCell className="p-2 text-center">
                                <button
                                  onClick={() => toggleExpand(uspk.id)}
                                  className="p-1 hover:bg-muted rounded text-muted-foreground"
                                  title={isExpanded ? "Tutup detail evaluasi" : "Lihat detail evaluasi"}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              </TableCell>

                              {/* Nomor USPK */}
                              <TableCell className="font-mono font-bold text-xs text-foreground">
                                {uspk.uspkNumber}
                              </TableCell>

                              {/* Rekanan */}
                              <TableCell className="text-xs">
                                <span className="font-semibold text-foreground block">
                                  {uspk.vendorName}
                                </span>
                                {uspk.workItemName && (
                                  <span className="text-[10px] text-muted-foreground line-clamp-1">
                                    WBS: {uspk.workItemName}
                                  </span>
                                )}
                              </TableCell>

                              {/* Lingkup Pekerjaan */}
                              <TableCell className="text-xs text-muted-foreground">
                                <span className="line-clamp-2 leading-relaxed">
                                  {uspk.scope}
                                </span>
                              </TableCell>

                              {/* Target Kerja */}
                              <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                                {uspk.targetVolume ? (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px]">
                                    {uspk.targetVolume} {uspk.unit || ""}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>

                              {/* Periode Pelaksanaan */}
                              <TableCell className="text-[11px] font-mono">
                                <span className="text-foreground block font-medium">
                                  {formatIDDate(uspk.startDate)}
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                  s/d {formatIDDate(uspk.endDate)}
                                </span>
                              </TableCell>

                              {/* Nilai Usulan */}
                              <TableCell className="font-mono text-xs font-bold text-right text-foreground">
                                {formatIDR(uspk.value)}
                              </TableCell>

                              {/* Status Evaluasi Teknis */}
                              <TableCell>
                                {evaluation ? (
                                  evaluation.result === "RECOMMENDED" ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Rekomendasi ({evaluation.score ?? 90})
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-semibold bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 gap-1"
                                    >
                                      <XCircle className="w-3 h-3 text-rose-600" />
                                      Gugur Teknis ({evaluation.score ?? 50})
                                    </Badge>
                                  )
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 gap-1"
                                  >
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Belum Dievaluasi
                                  </Badge>
                                )}
                              </TableCell>

                              {/* Status USPK */}
                              <TableCell>
                                <StatusBadge status={uspk.status} />
                              </TableCell>

                              {/* Aksi */}
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Button 1: Catat Evaluasi Teknis */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenEvalModal(uspk)}
                                    className="h-7 text-[11px] gap-1 px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                                  >
                                    <ClipboardCheck className="w-3 h-3" />
                                    {evaluation ? "Ubah Evaluasi" : "Catat Evaluasi"}
                                  </Button>

                                  {/* Button 2: Terbitkan SPK (With Guardrail) */}
                                  {linkedSpk ? (
                                    <Badge
                                      variant="secondary"
                                      className="h-7 text-[10px] font-mono font-medium px-2 bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
                                    >
                                      SPK: {linkedSpk.spkNumber}
                                    </Badge>
                                  ) : isRecommended ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handleOpenSpkModalFromUspk(uspk)}
                                      className="h-7 text-[11px] gap-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                                    >
                                      <FileCheck2 className="w-3 h-3" /> Terbitkan SPK
                                    </Button>
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Button
                                            size="sm"
                                            disabled
                                            variant="outline"
                                            className="h-7 text-[11px] gap-1 px-2 opacity-50 cursor-not-allowed text-muted-foreground"
                                          >
                                            <FileCheck2 className="w-3 h-3" /> Terbitkan SPK
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="text-xs max-w-xs">
                                        <p>
                                          <strong>Guardrail:</strong> SPK hanya dapat diterbitkan setelah evaluasi teknis disetujui (status: <strong>RECOMMENDED</strong>).
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Expandable Sub-Row: Detail Evaluasi Teknis & Berkas */}
                            {isExpanded && (
                              <TableRow className="bg-muted/20 hover:bg-muted/30">
                                <TableCell colSpan={10} className="p-3 pl-10 pr-6">
                                  <div className="rounded-lg border bg-card p-3.5 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                                      <div className="flex items-center gap-2">
                                        <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                                        <span className="text-xs font-semibold text-foreground">
                                          Riwayat Evaluasi Teknis & Bukti Kelaikan: {uspk.uspkNumber}
                                        </span>
                                      </div>
                                      {uspk.attachmentName && (
                                        <AttachmentPreview
                                          filename={uspk.attachmentName}
                                          type="Dokumen Usulan / Proposal Teknis"
                                        />
                                      )}
                                    </div>

                                    {evaluation ? (
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                        <div className="space-y-1 md:border-r md:pr-4">
                                          <span className="text-[11px] text-muted-foreground block">
                                            Evaluator Teknis
                                          </span>
                                          <span className="font-semibold text-foreground block">
                                            {evaluation.evaluatorName}
                                          </span>
                                          <span className="text-[11px] text-muted-foreground block">
                                            {evaluation.evaluatorJabatan || "Manager Estate / Reviewer"}
                                          </span>
                                          <span className="text-[10px] font-mono text-muted-foreground block pt-1">
                                            Tanggal: {formatIDDate(evaluation.evaluationDate)}
                                          </span>
                                        </div>

                                        <div className="space-y-1 md:col-span-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-muted-foreground block">
                                              Hasil Analisis & Justifikasi Kelaikan
                                            </span>
                                            {evaluation.score !== undefined && (
                                              <span className="font-mono font-bold text-xs text-foreground">
                                                Skor Teknis: {evaluation.score}/100
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-foreground/90 leading-relaxed bg-muted/40 p-2.5 rounded border">
                                            {evaluation.notes}
                                          </p>

                                          {evaluation.attachmentName && (
                                            <div className="pt-1.5 flex items-center justify-between">
                                              <span className="text-[11px] text-muted-foreground">
                                                Berita Acara Evaluasi:
                                              </span>
                                              <AttachmentPreview
                                                filename={evaluation.attachmentName}
                                                type="Berita Acara Evaluasi Teknis"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="py-3 text-center space-y-2">
                                        <p className="text-xs text-muted-foreground">
                                          Rekanan kontraktor ini belum dievaluasi kelayakan teknis peralatannya.
                                        </p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenEvalModal(uspk)}
                                          className="text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                                        >
                                          <ClipboardCheck className="w-3.5 h-3.5" /> Catat Evaluasi Teknis Sekarang
                                        </Button>
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
          </TabsContent>

          {/* ============================================================== */}
          {/* SUB-TAB 2: KONTRAK SPK RESMI */}
          {/* ============================================================== */}
          <TabsContent value="spk" className="space-y-4 mt-0">
            <Card className="shadow-xs">
              <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    <CardTitle className="text-sm font-semibold">
                      Daftar Kontrak Surat Perintah Kerja (SPK) Resmi
                    </CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tahapan 4B.3: Kontrak kerja definitif (1 USPK : 1 SPK), masa berlaku kerja borongan, lampiran berkas, dan penutupan kontrak.
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">Nomor SPK Resmi</TableHead>
                      <TableHead className="w-[120px]">Rujukan USPK</TableHead>
                      <TableHead className="min-w-[170px]">Kontraktor Rekanan</TableHead>
                      <TableHead className="min-w-[150px]">Target & Sisa Volume</TableHead>
                      <TableHead className="w-[130px] text-right">Nilai Kontrak (Rp)</TableHead>
                      <TableHead className="w-[150px]">Masa Berlaku Kontrak</TableHead>
                      <TableHead className="w-[100px]">Status SPK</TableHead>
                      <TableHead className="min-w-[180px]">Berkas Kontrak</TableHead>
                      <TableHead className="w-[170px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectSpks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-32 text-center text-xs text-muted-foreground"
                        >
                          Belum ada kontrak SPK yang diterbitkan untuk proyek ini.
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUspkForSpk(null);
                                setSpkDialogOpen(true);
                              }}
                              className="text-xs gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Terbitkan SPK Baru
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      projectSpks.map((spk) => {
                        const durationDays = calculateDaysBetween(spk.startDate, spk.endDate);
                        const progressSummary = getSpkProgressSummary(spk.id);

                        return (
                          <TableRow key={spk.id} className="hover:bg-muted/40 font-medium">
                            {/* Nomor SPK */}
                            <TableCell className="font-mono font-bold text-xs text-foreground">
                              {spk.spkNumber}
                            </TableCell>

                            {/* Rujukan USPK */}
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {spk.uspkNumber}
                            </TableCell>

                            {/* Kontraktor */}
                            <TableCell className="text-xs font-semibold text-foreground">
                              {spk.vendorName}
                            </TableCell>

                            {/* Target & Sisa Volume */}
                            <TableCell>
                              {spk.targetVolume ? (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between font-mono text-[11px]">
                                    <span className="font-bold text-foreground">
                                      {progressSummary.realizedVolume} / {spk.targetVolume} {spk.unit}
                                    </span>
                                    <span className="font-bold text-emerald-600">
                                      {progressSummary.percentComplete}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-600 h-1.5 rounded-full"
                                      style={{ width: `${progressSummary.percentComplete}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-mono block">
                                    Sisa: {progressSummary.remainingVolume} {spk.unit}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">-</span>
                              )}
                            </TableCell>

                            {/* Nilai Kontrak */}
                            <TableCell className="font-mono text-xs font-bold text-right text-indigo-700 dark:text-indigo-400">
                              {formatIDR(spk.value)}
                            </TableCell>

                            {/* Masa Berlaku */}
                            <TableCell className="text-[11px] font-mono">
                              <span className="text-foreground block font-medium">
                                {formatIDDate(spk.startDate)} — {formatIDDate(spk.endDate)}
                              </span>
                              <span className="text-muted-foreground text-[10px]">
                                Durasi: {durationDays} Hari Kalender
                              </span>
                            </TableCell>

                            {/* Status SPK */}
                            <TableCell>
                              <StatusBadge status={spk.status} />
                            </TableCell>

                            {/* Berkas Lampiran */}
                            <TableCell>
                              {spk.attachmentName ? (
                                <AttachmentPreview
                                  filename={spk.attachmentName}
                                  type="Surat Perintah Kerja (SPK) Ditandatangani"
                                />
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">
                                  Belum diunggah
                                </span>
                              )}
                            </TableCell>

                            {/* Aksi */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/workspace/${projectId}/progress`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] gap-1 px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                                  >
                                    Progress <ArrowRight className="w-3 h-3" />
                                  </Button>
                                </Link>

                                {spk.status === "ACTIVE" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCloseSpk(spk)}
                                    className="h-7 text-[11px] px-2 text-rose-700 border-rose-300 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
                                  >
                                    Tutup Kontrak
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Attached Dialogs */}
        <USPKCreateDialog
          open={uspkDialogOpen}
          onOpenChange={setUspkDialogOpen}
          project={project}
        />

        <TechnicalEvaluationDialog
          open={evalDialogOpen}
          onOpenChange={setEvalDialogOpen}
          project={project}
          uspk={selectedUspkForEval}
        />

        <SPKCreateDialog
          open={spkDialogOpen}
          onOpenChange={setSpkDialogOpen}
          project={project}
          preselectedUspk={selectedUspkForSpk}
        />
      </div>
    </TooltipProvider>
  );
}
