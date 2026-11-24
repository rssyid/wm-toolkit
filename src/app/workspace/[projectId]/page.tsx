"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { SmartActionStepper } from "@/components/workspace/smart-action-stepper";

import { AFCEActionDialog } from "@/components/afce/afce-action-dialog";
import { PRRecordDialog } from "@/components/procurement/pr-record-dialog";
import { VendorEvaluationDialog } from "@/components/procurement/vendor-evaluation-dialog";
import { POCreateDialog } from "@/components/procurement/po-create-dialog";
import { USPKCreateDialog } from "@/components/services/uspk-create-dialog";
import { TechnicalEvaluationDialog } from "@/components/services/technical-evaluation-dialog";
import { SPKCreateDialog } from "@/components/services/spk-create-dialog";
import { DailyProgressDialog } from "@/components/progress/daily-progress-dialog";

import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR } from "@/lib/utils";
import { PurchaseRequisition, USPKItem } from "@/types";
import { toast } from "sonner";

export default function ProjectOverviewTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const {
    projects,
    afces,
    prs,
    pos,
    vendorEvaluations,
    uspks,
    technicalEvaluations,
    spkContracts,
    dailyProgress,
    submitAfceApproval,
    isViewerOnly,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const afce = afces.find((a) => a.projectId === projectId && !a.deletedAt);
  const projectPrs = prs.filter((p) => p.projectId === projectId && !p.deletedAt);
  const projectPos = pos.filter((p) => p.projectId === projectId && !p.deletedAt);
  const projectVendorEvals = vendorEvaluations.filter((ve) =>
    projectPrs.some((pr) => pr.id === ve.prId)
  );
  const projectUspks = uspks.filter((u) => u.projectId === projectId && !u.deletedAt);
  const projectTechEvals = technicalEvaluations.filter(
    (te) => te.projectId === projectId && projectUspks.some((u) => u.id === te.uspkId)
  );
  const projectSpks = spkContracts.filter((s) => s.projectId === projectId && !s.deletedAt);
  const projectLogs = dailyProgress.filter((d) => d.projectId === projectId).slice(0, 5);

  const [afceDialogOpen, setAfceDialogOpen] = useState(false);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [vendorEvalDialogOpen, setVendorEvalDialogOpen] = useState(false);
  const [selectedPrForEval, setSelectedPrForEval] = useState<PurchaseRequisition | null>(null);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [selectedPrIdForPo, setSelectedPrIdForPo] = useState<string | undefined>(undefined);
  const [uspkDialogOpen, setUspkDialogOpen] = useState(false);
  const [techEvalDialogOpen, setTechEvalDialogOpen] = useState(false);
  const [selectedUspkForEval, setSelectedUspkForEval] = useState<USPKItem | null>(null);
  const [spkDialogOpen, setSpkDialogOpen] = useState(false);
  const [selectedUspkForSpk, setSelectedUspkForSpk] = useState<USPKItem | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  if (!project) return null;

  const handleSubmitDraftAfce = async () => {
    if (!afce) return;
    const ok = await submitAfceApproval(
      afce.id,
      "Pengajuan dokumen AFCE dari ringkasan proyek."
    );
    if (ok) {
      toast.success("Permintaan persetujuan AFCE berhasil diajukan.");
    }
  };

  return (
    <div className="space-y-5">
      <SmartActionStepper
        project={project}
        afce={afce}
        prs={projectPrs}
        pos={projectPos}
        vendorEvaluations={projectVendorEvals}
        uspks={projectUspks}
        technicalEvaluations={projectTechEvals}
        spkContracts={projectSpks}
        onSubmitDraftAfce={() => void handleSubmitDraftAfce()}
        onOpenAfceAction={() => setAfceDialogOpen(true)}
        onOpenPrDialog={() => setPrDialogOpen(true)}
        onOpenVendorEvalDialog={(pr) => {
          setSelectedPrForEval(pr);
          setVendorEvalDialogOpen(true);
        }}
        onOpenPoDialog={(prId) => {
          setSelectedPrIdForPo(prId);
          setPoDialogOpen(true);
        }}
        onOpenUspkDialog={() => setUspkDialogOpen(true)}
        onOpenTechEvalDialog={(uspk) => {
          setSelectedUspkForEval(uspk);
          setTechEvalDialogOpen(true);
        }}
        onOpenSpkDialog={(uspkId) => {
          const matchUspk = projectUspks.find((u) => u.id === uspkId);
          setSelectedUspkForSpk(matchUspk || null);
          setSpkDialogOpen(true);
        }}
        onOpenProgressDialog={() => setProgressDialogOpen(true)}
        isViewerOnly={isViewerOnly}
      />

      {/* 4 Kartu Metrik Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block">
            Nilai Anggaran AFCE
          </span>
          <span className="text-lg font-bold font-mono text-foreground mt-1 block">
            {formatIDR(project.afceValue)}
          </span>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t text-muted-foreground">
            <span>Doc: {project.afceNumber}</span>
            <StatusBadge status={project.afceStatus} />
          </div>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block">
            Durasi &amp; Target Selesai
          </span>
          <span className="text-lg font-bold font-mono text-foreground mt-1 block">
            {project.durationDays} Hari
          </span>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t text-muted-foreground">
            <span>Target: {formatIDDate(project.targetEndDate)}</span>
            {project.scheduleVarianceDays > 7 ? (
              <span className="text-rose-700 dark:text-rose-400 font-semibold">
                +{project.scheduleVarianceDays} hr
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Tepat Waktu
              </span>
            )}
          </div>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block">
            Pengadaan &amp; Kontrak
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold font-mono text-foreground">
              {projectPrs.length} PR / {projectPos.length} PO
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t text-muted-foreground">
            <span>Jasa: {projectSpks.length} SPK</span>
            <Link
              href={`/workspace/${projectId}/procurement`}
              className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
            >
              Buka Hub &gt;
            </Link>
          </div>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium block">
            Progres Fisik Lapangan
          </span>
          <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
            {project.progress}%
          </span>
          <div className="mt-2 pt-2 border-t">
            <Progress value={project.progress} className="h-1.5" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Progres Item Pekerjaan (WBS)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kemajuan fisik masing-masing komponen kerja berbobot.
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href={`/workspace/${projectId}/execution?tab=work-items`}>
                  Kelola WBS &gt;
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              {(project.workItems || []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Belum ada item pekerjaan yang terdaftar.
                </p>
              ) : (
                (project.workItems || []).map((wi) => (
                  <div key={wi.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{wi.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono">
                          Bobot: {wi.weight}%
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {wi.progress}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={wi.progress}
                      className="h-2"
                      indicatorClassName={
                        wi.progress >= 100
                          ? "bg-emerald-700"
                          : wi.progress > 0
                          ? "bg-blue-700"
                          : "bg-slate-300"
                      }
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        Jadwal: {formatIDDate(wi.startDate)} s/d {formatIDDate(wi.endDate)}
                      </span>
                      <StatusBadge status={wi.status} showDot={false} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-semibold">
                Spesifikasi &amp; Uraian Teknis Proyek
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-3 leading-relaxed text-muted-foreground">
              <p>{project.description || "Belum ada deskripsi uraian teknis proyek."}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-3 text-foreground">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Lokasi Kebun &amp; Blok:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {project.locationNames && project.locationNames.length > 0 ? (
                      <span className="font-semibold text-foreground text-xs">
                        {project.locationNames.join(", ")}
                      </span>
                    ) : (
                      <span className="font-semibold">{project.locationName || "-"}</span>
                    )}
                    {project.blockCodes && project.blockCodes.length > 0 ? (
                      <span className="text-muted-foreground font-mono text-[11px]">
                        ({project.blockCodes.join(", ")})
                      </span>
                    ) : project.blockCode ? (
                      <span className="text-muted-foreground font-mono text-[11px]">
                        ({project.blockCode})
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    PIC Proyek:
                  </span>
                  <span className="font-semibold">{project.picName || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Kategori Proyek:
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {project.projectCategoryName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Jenis &amp; Pengadaan:
                  </span>
                  <span className="font-semibold">
                    {project.projectType} / {project.procurementType}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="shadow-sm border-amber-200 dark:border-amber-900/60">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-semibold">Status Otorisasi AFCE</CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-foreground block">
                    {project.approvalStatus}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Level Penyetuju: {afce?.currentApproverRole || "Water Management"}
                  </span>
                </div>
                <StatusBadge status={project.afceStatus} />
              </div>

              {project.afceStatus !== "Approved" ? (
                <div className="pt-2">
                  <Button
                    asChild
                    size="sm"
                    className="w-full text-xs h-9 bg-amber-800 hover:bg-amber-900 text-white font-semibold"
                  >
                    <Link href={`/workspace/${projectId}/afce`}>
                      {project.afceStatus === "Pending Approval"
                        ? "Buka Pencatatan Approval AFCE"
                        : "Buka Modul AFCE"}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="pt-1.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
                  <span>Tanggal Disahkan:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatIDDate(afce?.approvedAt || project.lastUpdated)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <CardTitle className="text-sm font-semibold">
                  Aktivitas Lapangan Terkini
                </CardTitle>
              </div>
              <Link
                href={`/workspace/${projectId}/execution?tab=progress`}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
              >
                Semua
              </Link>
            </CardHeader>
            <CardContent className="p-3 divide-y divide-border/60">
              {projectLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Belum ada catatan aktivitas harian.
                </p>
              ) : (
                projectLogs.map((log) => (
                  <div key={log.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-mono text-[11px]">{formatIDDate(log.date)}</span>
                      <span className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-medium">
                        {log.weather}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{log.activity}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {log.manpower !== undefined && <span>Tenaga: {log.manpower} org</span>}
                      <span>Progres WI: {log.progressPercent}%</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {afce && (
        <AFCEActionDialog
          open={afceDialogOpen}
          onOpenChange={setAfceDialogOpen}
          afce={afce}
        />
      )}
      <PRRecordDialog open={prDialogOpen} onOpenChange={setPrDialogOpen} project={project} />
      {selectedPrForEval && (
        <VendorEvaluationDialog
          open={vendorEvalDialogOpen}
          onOpenChange={setVendorEvalDialogOpen}
          project={project}
          pr={selectedPrForEval}
        />
      )}
      <POCreateDialog
        open={poDialogOpen}
        onOpenChange={setPoDialogOpen}
        project={project}
        preselectedPrId={selectedPrIdForPo}
      />
      <USPKCreateDialog open={uspkDialogOpen} onOpenChange={setUspkDialogOpen} project={project} />
      <TechnicalEvaluationDialog
        open={techEvalDialogOpen}
        onOpenChange={setTechEvalDialogOpen}
        project={project}
        uspk={selectedUspkForEval}
      />
      <SPKCreateDialog
        open={spkDialogOpen}
        onOpenChange={setSpkDialogOpen}
        project={project}
        preselectedUspk={selectedUspkForSpk}
      />
      <DailyProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        project={project}
      />
    </div>
  );
}
