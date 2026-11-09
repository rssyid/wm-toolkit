"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building,
  ShoppingCart,
  Briefcase,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyText } from "@/components/shared/currency-text";
import { SmartActionStepper } from "@/components/workspace/smart-action-stepper";

// Attached Dialogs
import { AFCEActionDialog } from "@/components/afce/afce-action-dialog";
import { PRRecordDialog } from "@/components/procurement/pr-record-dialog";
import { POCreateDialog } from "@/components/procurement/po-create-dialog";
import { USPKCreateDialog } from "@/components/services/uspk-create-dialog";
import { SPKCreateDialog } from "@/components/services/spk-create-dialog";
import { DailyProgressDialog } from "@/components/progress/daily-progress-dialog";

import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR } from "@/lib/utils";

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
    isViewerOnly,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const afce = afces.find((a) => a.projectId === projectId);
  const projectPrs = prs.filter((p) => p.projectId === projectId);
  const projectPos = pos.filter((p) => p.projectId === projectId);
  const projectUspks = uspks.filter((u) => u.projectId === projectId);
  const projectSpks = spkContracts.filter((s) => s.projectId === projectId);
  const projectLogs = dailyProgress
    .filter((d) => d.projectId === projectId)
    .slice(0, 5);

  // Dialog states for Quick Actions
  const [afceDialogOpen, setAfceDialogOpen] = useState(false);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [selectedPrIdForPo, setSelectedPrIdForPo] = useState<string | undefined>(undefined);
  const [uspkDialogOpen, setUspkDialogOpen] = useState(false);
  const [spkDialogOpen, setSpkDialogOpen] = useState(false);
  const [selectedUspkForSpk, setSelectedUspkForSpk] = useState<any>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  if (!project) return null;

  return (
    <div className="space-y-5">
      {/* Smart Lifecycle Action Stepper */}
      <SmartActionStepper
        project={project}
        afce={afce}
        prs={projectPrs}
        pos={projectPos}
        vendorEvaluations={vendorEvaluations}
        uspks={projectUspks}
        technicalEvaluations={technicalEvaluations}
        spkContracts={projectSpks}
        onOpenAfceAction={() => setAfceDialogOpen(true)}
        onOpenPrDialog={() => setPrDialogOpen(true)}
        onOpenPoDialog={(prId) => {
          setSelectedPrIdForPo(prId);
          setPoDialogOpen(true);
        }}
        onOpenUspkDialog={() => setUspkDialogOpen(true)}
        onOpenSpkDialog={(uspkId) => {
          const matchUspk = projectUspks.find((u) => u.id === uspkId);
          setSelectedUspkForSpk(matchUspk || null);
          setSpkDialogOpen(true);
        }}
        onOpenProgressDialog={() => setProgressDialogOpen(true)}
        isViewerOnly={isViewerOnly}
      />

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Info Card 1: AFCE Summary */}
        <Card className="p-4 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium block">
            Anggaran AFCE Disetujui
          </span>
          <span className="text-lg font-bold font-mono text-foreground mt-1 block">
            {formatIDR(project.afceValue)}
          </span>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t text-muted-foreground">
            <span>Doc: {project.afceNumber}</span>
            <StatusBadge status={project.afceStatus} />
          </div>
        </Card>

        {/* Info Card 2: Schedule Summary */}
        <Card className="p-4 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium block">
            Durasi & Target Selesai
          </span>
          <span className="text-lg font-bold font-mono text-foreground mt-1 block">
            {project.durationDays} Hari
          </span>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t text-muted-foreground">
            <span>Target: {formatIDDate(project.targetEndDate)}</span>
            {project.scheduleVarianceDays > 7 ? (
              <span className="text-rose-600 font-semibold">
                +{project.scheduleVarianceDays} hr
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">Tepat Waktu</span>
            )}
          </div>
        </Card>

        {/* Info Card 3: Procurement Summary */}
        <Card className="p-4 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium block">
            Pengadaan & Kontrak
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold font-mono text-foreground">
              {projectPrs.length} PR / {projectPos.length} PO
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t text-muted-foreground">
            <span>Jasa: {projectSpks.length} SPK Aktif</span>
            <Link
              href={`/workspace/${projectId}/procurement`}
              className="text-emerald-600 hover:underline font-medium"
            >
              Buka Hub &rarr;
            </Link>
          </div>
        </Card>

        {/* Info Card 4: Overall Progress */}
        <Card className="p-4 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium block">
            Progress Fisik Lapangan
          </span>
          <span className="text-lg font-bold font-mono text-emerald-600 mt-1 block">
            {project.progress}%
          </span>
          <div className="mt-2 pt-2 border-t">
            <Progress value={project.progress} className="h-1.5" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 cols): Work Item Progress Table & Project Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Work Item Progress Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Progress Item Pekerjaan (Work Items)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kemajuan fisik masing-masing komponen kerja berbobot.
                </p>
              </div>
              <Link href={`/workspace/${projectId}/work-items`}>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Semua Item &rarr;
                </Button>
              </Link>
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
                        ? "bg-emerald-600"
                        : wi.progress > 0
                        ? "bg-blue-600"
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
              )))
            }
            </CardContent>
          </Card>

          {/* Project Details Description */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-semibold">
                Spesifikasi & Uraian Teknis Proyek
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-3 leading-relaxed text-muted-foreground">
              <p>{project.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-3 text-foreground">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Lokasi Kebun & Blok:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {project.locationNames && project.locationNames.length > 0 ? (
                      project.locationNames.map((loc, idx) => (
                        <span key={idx} className="font-semibold text-foreground text-xs">
                          {loc}
                          {idx < project.locationNames!.length - 1 ? ", " : ""}
                        </span>
                      ))
                    ) : (
                      <span className="font-semibold">{project.locationName}</span>
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
                    Kategori Proyek:
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {project.projectCategoryName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Jenis Konstruksi:
                  </span>
                  <span className="font-semibold">{project.projectType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Sistem Pengadaan:
                  </span>
                  <span className="font-semibold">{project.procurementType}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Outstanding Approvals & Recent Site Activity */}
        <div className="space-y-5">
          {/* Outstanding Approvals Widget */}
          <Card className="shadow-xs border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10">
            <CardHeader className="pb-2 border-b border-amber-200 dark:border-amber-800/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Status Persetujuan (Approval)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-foreground block">
                    {project.approvalStatus}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Level Penyetuju: {afce?.currentApproverRole || "Manager Estate"}
                  </span>
                </div>
                <StatusBadge status={project.afceStatus} />
              </div>

              {project.afceStatus !== "Approved" ? (
                <div className="pt-2">
                  <Link href={`/workspace/${projectId}/afce`}>
                    <Button size="sm" className="w-full text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                      {project.afceStatus === "Pending Approval"
                        ? "Input Persetujuan AFCE Sekarang →"
                        : "Buka Modul Persetujuan AFCE →"}
                    </Button>
                  </Link>
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

          {/* Recent Site Activity Feed */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-sm font-semibold">
                  Aktivitas Lapangan Terkini
                </CardTitle>
              </div>
              <Link href={`/workspace/${projectId}/progress`}>
                <span className="text-xs text-emerald-600 hover:underline">Semua</span>
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
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">
                        {log.weather}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{log.activity}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Tenaga: {log.manpower} orang</span>
                      <span>Progress WI: {log.progressPercent}%</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Action Dialogs */}
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
        preselectedPrId={selectedPrIdForPo}
      />
      <USPKCreateDialog
        open={uspkDialogOpen}
        onOpenChange={setUspkDialogOpen}
        project={project}
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
