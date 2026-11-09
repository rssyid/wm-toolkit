"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
  Building2,
  UserCheck,
  FileCheck2,
  FileText,
  Briefcase,
  History,
  ArrowRight,
  ShieldCheck,
  Award,
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
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { TechnicalEvaluationDialog } from "@/components/services/technical-evaluation-dialog";
import { SPKCreateDialog } from "@/components/services/spk-create-dialog";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, cn } from "@/lib/utils";
import { TechnicalEvaluation, USPKItem } from "@/types";

export default function TechnicalEvaluationTab() {
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

  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [spkDialogOpen, setSpkDialogOpen] = useState(false);
  const [selectedUspkForEval, setSelectedUspkForEval] = useState<USPKItem | null>(null);
  const [selectedUspkForSpk, setSelectedUspkForSpk] = useState<USPKItem | null>(null);

  if (!project) return null;

  // KPI Calculations
  const recommendedCount = projectEvals.filter((e) => e.result === "RECOMMENDED").length;
  const notRecommendedCount = projectEvals.filter((e) => e.result === "NOT_RECOMMENDED").length;
  const avgScore = projectEvals.length > 0
    ? Math.round(projectEvals.reduce((sum, e) => sum + (e.score || 0), 0) / projectEvals.length)
    : 0;

  // Unevaluated USPKs that can be evaluated
  const unevaluatedUspks = projectUspks.filter(
    (u) => !projectEvals.some((e) => e.uspkId === u.id)
  );

  const handleCreateEval = (uspk?: USPKItem) => {
    setSelectedUspkForEval(uspk || unevaluatedUspks[0] || projectUspks[0] || null);
    setEvalDialogOpen(true);
  };

  const handleCreateSpk = (uspk: USPKItem) => {
    setSelectedUspkForSpk(uspk);
    setSpkDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards Ringkasan Evaluasi Teknis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Evaluasi
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {projectEvals.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Penilaian rekanan jasa
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Direkomendasikan
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {recommendedCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Layak terbit kontrak SPK
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
                Tidak Disarankan
              </p>
              <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {notRecommendedCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Gugur kualifikasi teknis
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Rata-Rata Skor
              </p>
              <h3 className="text-xl font-bold font-mono text-foreground mt-0.5">
                {avgScore} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Indeks kelaikan teknis
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold">
                Daftar Hasil Evaluasi Teknis Rekanan Jasa
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pencatatan berita acara evaluasi teknis, nama evaluator, rekomendasi kelayakan rekanan, dan justifikasi terbit SPK.
            </p>
          </div>

          {!isViewerOnly && projectUspks.length > 0 && (
            <Button
              size="sm"
              onClick={() => handleCreateEval()}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> + Catat Evaluasi Teknis
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Rujukan USPK</TableHead>
                <TableHead className="min-w-[170px]">Rekanan Jasa</TableHead>
                <TableHead>Evaluator & Jabatan</TableHead>
                <TableHead>Tanggal Evaluasi</TableHead>
                <TableHead className="text-center">Skor Teknis</TableHead>
                <TableHead>Hasil Evaluasi</TableHead>
                <TableHead className="min-w-[170px]">Rekomendasi Formal</TableHead>
                <TableHead className="min-w-[200px]">Catatan Evaluasi</TableHead>
                <TableHead>Lampiran BA</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectEvals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-xs text-muted-foreground">
                    Belum ada Evaluasi Teknis yang dicatat untuk proyek ini.
                    {projectUspks.length > 0 ? (
                      !isViewerOnly && (
                        <span className="block mt-1">
                          Klik tombol &quot;+ Catat Evaluasi Teknis&quot; di atas untuk mengevaluasi USPK yang terdaftar.
                        </span>
                      )
                    ) : (
                      <span className="block mt-1">
                        Buat Usulan SPK (USPK) terlebih dahulu di tab USPK sebelum mencatat evaluasi teknis.
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                projectEvals.map((item) => {
                  const linkedUspk = projectUspks.find((u) => u.id === item.uspkId);
                  const isRecommended = item.result === "RECOMMENDED";

                  return (
                    <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-mono font-bold text-blue-700 dark:text-blue-400">
                        {item.uspkNumber}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            {linkedUspk?.vendorName || "Kontraktor Rekanan"}
                          </span>
                          {linkedUspk?.value && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Nilai: {formatIDR(linkedUspk.value)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-muted-foreground" />
                            {item.evaluatorName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {item.evaluatorJabatan || "Manager Estate"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-muted-foreground">
                        {formatIDDate(item.evaluationDate)}
                      </TableCell>

                      <TableCell className="text-center font-mono font-bold">
                        <span className={cn(
                          "px-2 py-0.5 rounded border text-[11px]",
                          (item.score || 0) >= 80
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                        )}>
                          {item.score || "-"}
                        </span>
                      </TableCell>

                      <TableCell>
                        {isRecommended ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-100 font-semibold text-[10px] gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> RECOMMENDED
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 hover:bg-rose-100 font-semibold text-[10px] gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" /> NOT RECOMMENDED
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        {item.rekomendasi || (isRecommended ? "Disetujui untuk Terbit SPK" : "Tidak Disetujui")}
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <p className="line-clamp-2 italic text-muted-foreground text-[11px]" title={item.notes}>
                          &quot;{item.notes}&quot;
                        </p>
                      </TableCell>

                      <TableCell>
                        <AttachmentPreview
                          filename={item.attachmentName || `BA_Evaluasi_${item.uspkNumber}.pdf`}
                          title={`Berita Acara Evaluasi Teknis ${item.uspkNumber}`}
                          description={`Evaluator: ${item.evaluatorName} • Hasil: ${item.result}`}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        {isRecommended ? (
                          !isViewerOnly ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => linkedUspk && handleCreateSpk(linkedUspk)}
                              className="h-7 text-[11px] gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 font-semibold"
                            >
                              <FileCheck2 className="w-3 h-3" /> Terbitkan SPK
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200">
                              Layak SPK
                            </Badge>
                          )
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Gugur</span>
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

      {/* Riwayat Evaluasi Teknis */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">
              Riwayat Penilaian & Evaluasi Teknis Proyek
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {projectEvals.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Belum ada riwayat evaluasi teknis.</p>
            ) : (
              projectEvals.map((e, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs border-l-2 border-emerald-400 pl-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        Evaluasi {e.uspkNumber}: {e.result === "RECOMMENDED" ? "Direkomendasikan" : "Tidak Direkomendasikan"} (Skor: {e.score || "-"})
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatIDDate(e.evaluationDate)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Evaluator: {e.evaluatorName} ({e.evaluatorJabatan || "PIC"}) &bull; Rekomendasi: {e.rekomendasi || "-"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedUspkForEval && (
        <TechnicalEvaluationDialog
          open={evalDialogOpen}
          onOpenChange={setEvalDialogOpen}
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
