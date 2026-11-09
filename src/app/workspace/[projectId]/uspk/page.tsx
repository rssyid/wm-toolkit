"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  FileCheck2,
  Calendar,
  Layers,
  Building2,
  DollarSign,
  Clock,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  FileText,
  History,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, calculateDaysBetween, cn } from "@/lib/utils";
import { USPKItem } from "@/types";

export default function USPKTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const {
    projects,
    uspks,
    technicalEvaluations,
    canEditProjects,
    isViewerOnly,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const projectUspks = uspks.filter((u) => u.projectId === projectId);
  const projectEvals = technicalEvaluations.filter((e) => e.projectId === projectId);

  const [uspkDialogOpen, setUspkDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [selectedUspkForEval, setSelectedUspkForEval] = useState<USPKItem | null>(null);

  if (!project) return null;

  // KPI Calculations
  const totalValue = projectUspks.reduce((sum, u) => sum + (u.value || 0), 0);
  const approvedCount = projectUspks.filter((u) => u.status === "APPROVED").length;
  const submittedCount = projectUspks.filter((u) => u.status === "SUBMITTED").length;

  const handleOpenEval = (uspk: USPKItem) => {
    setSelectedUspkForEval(uspk);
    setEvalDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards Ringkasan USPK */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total USPK
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {projectUspks.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Usulan penyedia jasa
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                USPK Disetujui
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {approvedCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Lolos evaluasi teknis
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Menunggu Evaluasi
              </p>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {submittedCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Siap dievaluasi teknis
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Nilai Usulan
              </p>
              <h3 className="text-lg font-bold font-mono text-foreground mt-0.5">
                {formatIDR(totalValue)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Estimasi penawaran rekanan
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-semibold">
                Daftar Usulan SPK (USPK) Proyek
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pencatatan usulan rekanan penyedia jasa borongan, lingkup pekerjaan teknis, nilai penawaran, dan jadwal pelaksanaan.
            </p>
          </div>

          {!isViewerOnly && (
            <Button
              size="sm"
              onClick={() => setUspkDialogOpen(true)}
              className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> + Buat USPK Baru
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Nomor USPK</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="min-w-[180px]">Rekanan Usulan</TableHead>
                <TableHead className="min-w-[180px]">Lingkup Pekerjaan</TableHead>
                <TableHead className="text-right">Target Kerja</TableHead>
                <TableHead className="text-right">Nilai Penawaran</TableHead>
                <TableHead>Masa Pelaksanaan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lampiran</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectUspks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-xs text-muted-foreground">
                    Belum ada Usulan SPK (USPK) yang dicatat untuk proyek ini.
                    {!isViewerOnly && (
                      <span className="block mt-1">
                        Klik tombol &quot;+ Buat USPK Baru&quot; di atas untuk mencatat usulan jasa teknis.
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                projectUspks.map((uspk) => {
                  const evalItem = projectEvals.find((e) => e.uspkId === uspk.id);
                  const duration = calculateDaysBetween(uspk.startDate, uspk.endDate);

                  return (
                    <TableRow key={uspk.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-mono font-bold text-blue-700 dark:text-blue-400">
                        {uspk.uspkNumber}
                      </TableCell>

                      <TableCell className="font-mono text-muted-foreground">
                        {formatIDDate(uspk.createdAt ? uspk.createdAt.split("T")[0] : uspk.startDate)}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            {uspk.vendorName}
                          </span>
                          {uspk.workItemName && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Layers className="w-3 h-3" /> {uspk.workItemName}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <p className="line-clamp-2 text-foreground font-medium" title={uspk.scope}>
                          {uspk.scope}
                        </p>
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {uspk.targetVolume ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {uspk.targetVolume} {uspk.unit || ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {formatIDR(uspk.value)}
                      </TableCell>

                      <TableCell className="font-mono text-[11px]">
                        <span className="block font-medium text-foreground">
                          {formatIDDate(uspk.startDate)} s/d {formatIDDate(uspk.endDate)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Durasi: {duration} Hari
                        </span>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={uspk.status} />
                      </TableCell>

                      <TableCell>
                        <AttachmentPreview
                          filename={uspk.attachmentName || `Proposal_${uspk.uspkNumber}.pdf`}
                          title={`Proposal & RAB USPK No. ${uspk.uspkNumber}`}
                          description={`Rekanan: ${uspk.vendorName} • Nilai: ${formatIDR(uspk.value)}`}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {evalItem ? (
                            <Link href={`/workspace/${projectId}/technical-evaluation`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300"
                              >
                                <ClipboardCheck className="w-3 h-3" /> Lihat Evaluasi
                              </Button>
                            </Link>
                          ) : (
                            !isViewerOnly && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEval(uspk)}
                                className="h-7 text-[11px] gap-1 text-blue-700 border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                              >
                                <ClipboardCheck className="w-3 h-3" /> + Evaluasi
                              </Button>
                            )
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

      {/* Riwayat & Alur Kerja Jalur Jasa */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">
              Riwayat Pencatatan USPK Proyek
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {projectUspks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Belum ada riwayat aktivitas usulan SPK.</p>
            ) : (
              projectUspks.map((u, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs border-l-2 border-blue-300 dark:border-blue-800 pl-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {u.uspkNumber} diajukan untuk rekanan <strong className="text-blue-600 dark:text-blue-400">{u.vendorName}</strong>
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatIDDate(u.createdAt ? u.createdAt.split("T")[0] : u.startDate)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Nilai penawaran: {formatIDR(u.value)} &bull; Dibuat oleh: {u.createdBy || "PIC Proyek"} &bull; Status: <span className="font-semibold text-foreground">{u.status}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <USPKCreateDialog
        open={uspkDialogOpen}
        onOpenChange={setUspkDialogOpen}
        project={project}
      />

      {selectedUspkForEval && (
        <TechnicalEvaluationDialog
          open={evalDialogOpen}
          onOpenChange={setEvalDialogOpen}
          project={project}
          uspk={selectedUspkForEval}
        />
      )}
    </div>
  );
}
