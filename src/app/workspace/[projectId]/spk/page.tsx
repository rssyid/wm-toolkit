"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileCheck2,
  Plus,
  Calendar,
  Building2,
  DollarSign,
  Clock,
  Briefcase,
  History,
  CheckCircle2,
  AlertTriangle,
  Layers,
  CheckCheck,
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
import { SPKCreateDialog } from "@/components/services/spk-create-dialog";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, calculateDaysBetween, cn } from "@/lib/utils";
import { SPKContract, SPKStatus } from "@/types";
import { toast } from "sonner";

export default function SPKTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const {
    projects,
    uspks,
    technicalEvaluations,
    spkContracts,
    updateSpkStatus,
    getSpkProgressSummary,
    canEditProjects,
    isViewerOnly,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const projectSpks = spkContracts.filter((s) => s.projectId === projectId);
  const projectUspks = uspks.filter((u) => u.projectId === projectId);

  const [spkDialogOpen, setSpkDialogOpen] = useState(false);

  if (!project) return null;

  // KPI Calculations
  const totalValue = projectSpks.reduce((sum, s) => sum + (s.value || 0), 0);
  const activeCount = projectSpks.filter((s) => s.status === "ACTIVE").length;
  const closedCount = projectSpks.filter((s) => s.status === "CLOSED").length;

  const handleToggleClose = (spk: SPKContract) => {
    if (spk.status === "ACTIVE") {
      updateSpkStatus(spk.id, "CLOSED");
      toast.success(`Kontrak ${spk.spkNumber} berhasil ditutup (CLOSED).`);
    } else {
      updateSpkStatus(spk.id, "ACTIVE");
      toast.success(`Kontrak ${spk.spkNumber} diaktifkan kembali.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards Ringkasan Kontrak SPK */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total SPK Terbit
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {projectSpks.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Surat perintah kerja resmi
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Kontrak Aktif
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {activeCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Sedang berjalan di lapangan
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
                Kontrak Selesai
              </p>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {closedCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Telah ditutup (Closed)
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0">
              <CheckCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Komitmen SPK
              </p>
              <h3 className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                {formatIDR(totalValue)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Akumulasi nilai kontrak jasa
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
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
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold">
                Daftar Surat Perintah Kerja (SPK) Rekanan Definitif
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pencatatan kontrak kerja rekanan jasa konstruksi teknis, nilai kontrak riil, tanggal berlaku, dan monitoring penutupan kontrak.
            </p>
          </div>

          {!isViewerOnly && (
            <Button
              size="sm"
              onClick={() => setSpkDialogOpen(true)}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> + Terbitkan SPK Baru
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Nomor SPK</TableHead>
                <TableHead className="w-[120px]">Rujukan USPK</TableHead>
                <TableHead className="min-w-[180px]">Kontraktor Terpilih</TableHead>
                <TableHead className="min-w-[170px]">Target & Sisa Volume</TableHead>
                <TableHead className="text-right">Nilai Kontrak</TableHead>
                <TableHead>Tanggal Terbit</TableHead>
                <TableHead>Masa Berlaku (Durasi)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lampiran Kontrak</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectSpks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-xs text-muted-foreground">
                    Belum ada Surat Perintah Kerja (SPK) yang dicatat untuk proyek ini.
                    {!isViewerOnly && (
                      <span className="block mt-1">
                        Pastikan minimal ada satu USPK yang telah direkomendasikan pada tab Evaluasi Teknis sebelum menerbitkan SPK.
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                projectSpks.map((spk) => {
                  const duration = calculateDaysBetween(spk.startDate, spk.endDate);
                  const progressSummary = getSpkProgressSummary(spk.id);

                  return (
                    <TableRow key={spk.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {spk.spkNumber}
                      </TableCell>

                      <TableCell className="font-mono text-muted-foreground">
                        <Link
                          href={`/workspace/${projectId}/uspk`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {spk.uspkNumber}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            {spk.vendorName}
                          </span>
                          {spk.workItemName && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-sans">
                              <Layers className="w-3 h-3" /> {spk.workItemName}
                            </span>
                          )}
                        </div>
                      </TableCell>

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

                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {formatIDR(spk.value)}
                      </TableCell>

                      <TableCell className="font-mono text-muted-foreground">
                        {formatIDDate(spk.releasedAt || spk.createdAt?.split("T")[0] || spk.startDate)}
                      </TableCell>

                      <TableCell className="font-mono text-[11px]">
                        <span className="block font-medium text-foreground">
                          {formatIDDate(spk.startDate)} s/d {formatIDDate(spk.endDate)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {duration} Hari Kalender
                        </span>
                      </TableCell>

                      <TableCell>
                        {spk.status === "ACTIVE" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none font-semibold text-[10px] gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE
                          </Badge>
                        ) : spk.status === "CLOSED" ? (
                          <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            CLOSED
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {spk.status}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <AttachmentPreview
                          filename={spk.attachmentName || `Dokumen_SPK_${spk.spkNumber}.pdf`}
                          title={`Kontrak SPK No. ${spk.spkNumber}`}
                          description={`Kontraktor: ${spk.vendorName} • Nilai: ${formatIDR(spk.value)}`}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        {!isViewerOnly && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleClose(spk)}
                            className="h-7 text-[11px] gap-1 hover:bg-muted"
                          >
                            {spk.status === "ACTIVE" ? "Tutup SPK" : "Buka Kembali"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Riwayat Kontrak SPK */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">
              Riwayat Penerbitan & Status SPK
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {projectSpks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Belum ada riwayat penerbitan SPK.</p>
            ) : (
              projectSpks.map((s, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs border-l-2 border-emerald-500 pl-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {s.spkNumber} terbit kepada kontraktor <strong className="text-emerald-700 dark:text-emerald-400">{s.vendorName}</strong>
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatIDDate(s.releasedAt || s.createdAt?.split("T")[0] || s.startDate)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Nilai kontrak: {formatIDR(s.value)} &bull; Rujukan: {s.uspkNumber} &bull; Dibuat oleh: {s.createdBy || "PIC Proyek"} &bull; Status: <span className="font-semibold text-foreground">{s.status}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <SPKCreateDialog
        open={spkDialogOpen}
        onOpenChange={setSpkDialogOpen}
        project={project}
      />
    </div>
  );
}
