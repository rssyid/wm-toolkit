"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  FileSpreadsheet,
  PackageCheck,
  TrendingUp,
  AlertOctagon,
  ArrowRight,
  ExternalLink,
  Hammer,
  ShieldCheck,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Boxes,
  ClipboardList,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyText } from "@/components/shared/currency-text";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate } from "@/lib/utils";
import { AuditLog, AuditLogAction } from "@/types";
import { AuditLogDetailDialog } from "@/components/dashboard/audit-log-detail-dialog";

interface DashboardWidgetsProps {
  onViewAuditLog?: () => void;
}

export function DashboardWidgets({ onViewAuditLog }: DashboardWidgetsProps = {}) {
  const {
    afces,
    prs,
    pos,
    projects,
    weeklyProgress,
    uspks,
    spkContracts,
    auditLogs,
  } = useAppState();

  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  // Filter Data
  const pendingAfces = afces.filter((a) => a.status === "Pending Approval");
  const atRiskProjects = projects.filter(
    (p) => p.scheduleVarianceDays > 5 || p.ewsStatus !== "Normal"
  );
  const releasedPrs = prs.filter((p) => p.status === "Released");
  const activePos = pos;
  const recentWeekly = weeklyProgress.slice(0, 4);
  const activeSpks = spkContracts.filter((s) => s.status === "ACTIVE");
  const pendingUspks = uspks.filter(
    (u) => u.status === "SUBMITTED" || u.status === "DRAFT"
  );
  const recentLogs = auditLogs.slice(0, 5);

  const getActionBadgeColor = (action: AuditLogAction) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "APPROVE":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
      case "RELEASE":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "UPDATE":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "REJECT":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleOpenAuditDetail = (log: AuditLog) => {
    setSelectedAuditLog(log);
    setAuditDialogOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* ─────────────────────────────────────────────────────────────
          KOLOM KIRI (7/12): Fokus Tindakan Mendesak & Progres Fisik
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-6">
        {/* Modul A: Pusat Tindakan & EWS Kritis (Priority Action Center) */}
        <Card className="shadow-xs border overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Pusat Tindakan &amp; Atensi Utama
                </CardTitle>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Item yang memerlukan keputusan atau tindak lanjut segera
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <Tabs defaultValue="afce" className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-3 bg-muted/60 p-1">
                <TabsTrigger value="afce" className="text-xs gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Antrean AFCE</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                  >
                    {pendingAfces.length}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger value="ews" className="text-xs gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Peringatan EWS Kritis</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                  >
                    {atRiskProjects.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Sub-Tab 1: AFCE Approval Queue */}
              <TabsContent value="afce" className="space-y-2 mt-0">
                {pendingAfces.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    Semua dokumen AFCE telah disetujui. Tidak ada antrean pending.
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {pendingAfces.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-md transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {a.projectName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-mono text-foreground font-medium">
                              {a.afceNumber}
                            </span>
                            <span>&bull;</span>
                            <CurrencyText value={a.value} className="font-medium text-foreground" />
                          </div>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            Menunggu Reviewer: {a.currentApproverRole}
                          </span>
                        </div>

                        <Link href={`/workspace/${a.projectId}/afce`} className="shrink-0">
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1"
                          >
                            <span>Input Approval</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Approval dicatat manual berdasarkan bukti SAP
                  </span>
                  <Link
                    href="/workspace?afceStatus=Pending+Approval"
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Buka seluruh antrean ({pendingAfces.length}) <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </TabsContent>

              {/* Sub-Tab 2: Early Warning System (EWS) */}
              <TabsContent value="ews" className="space-y-2 mt-0">
                {atRiskProjects.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    Seluruh proyek beroperasi normal. Tidak ada deviasi keterlambatan kritis.
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {atRiskProjects.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 px-2 rounded-md transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {p.code}
                            </span>
                            <span className="text-xs font-medium text-foreground truncate">
                              {p.name}
                            </span>
                            <StatusBadge status={p.status} />
                          </div>
                          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mt-0.5">
                            <span>{p.locationName}</span>
                            <span>&bull;</span>
                            <span>Target: <b className="font-mono">{formatIDDate(p.targetEndDate)}</b></span>
                            <span>&bull;</span>
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              Deviasi: +{p.scheduleVarianceDays} Hari
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link href={`/workspace/${p.id}/schedule`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                              Revisi Jadwal
                            </Button>
                          </Link>
                          <Link href={`/workspace/${p.id}`}>
                            <Button size="sm" className="h-7 text-xs px-2.5">
                              Detail
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    EWS terpicu jika deviasi &gt; 7 hari dari baseline
                  </span>
                  <Link
                    href="/workspace?status=delayed"
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Filter proyek kritis ({atRiskProjects.length}) <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modul B: Realisasi Fisik & Kurva-S Lapangan */}
        <Card className="shadow-xs border overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Realisasi Progres Fisik &amp; Kurva-S Mingguan
                </CardTitle>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                S-Curve Active
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {recentWeekly.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Belum ada rekaman progres mingguan yang dimasukkan.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentWeekly.map((w) => (
                  <div
                    key={w.id}
                    className="p-2.5 rounded-lg border bg-background/80 hover:border-emerald-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {w.workItemName}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {w.period}
                        </span>
                      </div>

                      {/* Mini Dual Progress Bar */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Rencana: <b className="font-mono text-foreground">{w.plannedProgress}%</b>
                          </span>
                          <span>
                            Realisasi:{" "}
                            <b className="font-mono text-emerald-600 dark:text-emerald-400">
                              {w.actualProgress}%
                            </b>
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                            style={{ width: `${Math.min(w.actualProgress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col items-end justify-between gap-1 shrink-0">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          w.variance >= 0
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        Deviasi: {w.variance > 0 ? `+${w.variance}%` : `${w.variance}%`}
                      </span>

                      <Link href={`/workspace/${w.projectId}/progress`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] px-2 text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          Grafik S-Curve &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Toleransi deviasi progres: &plusmn;5% dari kurva baseline
              </span>
              <Link
                href="/workspace"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                Buka seluruh progres proyek <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          KOLOM KANAN (5/12): Pelacakan Dua Jalur & Linimasa Aktivitas
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-5 space-y-6">
        {/* Modul C: Pelacakan Dua Jalur (Barang vs Jasa) */}
        <Card className="shadow-xs border overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Pelacakan Dua Jalur (Procurement)
                </CardTitle>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Barang &amp; Jasa
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <Tabs defaultValue="barang" className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-3 bg-muted/60 p-1">
                <TabsTrigger value="barang" className="text-xs gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                  <span>Jalur Barang (PR/PO)</span>
                </TabsTrigger>

                <TabsTrigger value="jasa" className="text-xs gap-1.5">
                  <Hammer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Jalur Jasa (SPK)</span>
                </TabsTrigger>
              </TabsList>

              {/* Sub-Tab 1: Jalur Barang */}
              <TabsContent value="barang" className="space-y-3 mt-0">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>PR Released Terkini</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">
                      {releasedPrs.length} Dokumen
                    </span>
                  </div>

                  {releasedPrs.slice(0, 2).map((pr) => (
                    <div
                      key={pr.id}
                      className="p-2 rounded-md border bg-muted/20 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {pr.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">
                            {pr.prNumber}
                          </span>
                          <span>&bull;</span>
                          <span>SAP: {pr.sapPrNumber}</span>
                        </div>
                      </div>
                      <Link href={`/workspace/${pr.projectId}/pr`}>
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2">
                          Lihat
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Status Kedatangan Material (PO)</span>
                    <span className="text-teal-600 dark:text-teal-400 font-mono">
                      {activePos.length} Terbit
                    </span>
                  </div>

                  {activePos.slice(0, 2).map((po) => (
                    <div
                      key={po.id}
                      className="p-2 rounded-md border bg-muted/20 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {po.supplierName}
                          </p>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {po.poNumber}
                          </span>
                        </div>
                        {/* Material Delivery Progress */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 transition-all duration-300"
                              style={{ width: `${po.receiptProgressPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-medium shrink-0">
                            {po.receiptProgressPercent}% Masuk
                          </span>
                        </div>
                      </div>
                      <Link href={`/workspace/${po.projectId}/po`} className="shrink-0 ml-1">
                        <Button size="sm" variant="outline" className="h-6 text-[11px] px-2">
                          GR
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <Link
                    href="/workspace?procurement=released_pr"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Buka modul logistik lengkap <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </TabsContent>

              {/* Sub-Tab 2: Jalur Jasa */}
              <TabsContent value="jasa" className="space-y-3 mt-0">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>SPK Kontrak Aktif</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {activeSpks.length} Rekanan
                    </span>
                  </div>

                  {activeSpks.slice(0, 2).map((spk) => (
                    <div
                      key={spk.id}
                      className="p-2 rounded-md border bg-muted/20 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {spk.spkNumber}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                          >
                            Aktif
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-foreground truncate mt-0.5">
                          {spk.vendorName}
                        </p>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Masa: {formatIDDate(spk.startDate)} s/d {formatIDDate(spk.endDate)}
                        </div>
                      </div>

                      <Link href={`/workspace/${spk.projectId}/services`}>
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                          Kontrak
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>

                {pendingUspks.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Usulan USPK (Menunggu Evaluasi Teknis)</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono">
                        {pendingUspks.length} Draft
                      </span>
                    </div>

                    {pendingUspks.slice(0, 2).map((uspk) => (
                      <div
                        key={uspk.id}
                        className="p-2 rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/20 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            {uspk.uspkNumber}
                          </span>
                          <p className="text-xs font-medium text-foreground truncate">
                            {uspk.vendorName} &bull; {uspk.scope}
                          </p>
                        </div>
                        <Link href={`/workspace/${uspk.projectId}/services`}>
                          <Button
                            size="sm"
                            className="h-6 text-[11px] px-2 bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            Review
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t flex items-center justify-between">
                  <Link
                    href="/workspace"
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Buka modul kontrak jasa lengkap <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modul D: Linimasa Aktivitas Terkini (Clean Activity Timeline) */}
        <Card className="shadow-xs border overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Aktivitas Operasional Terkini
                </CardTitle>
              </div>
              <span className="text-[10px] font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Live Audit Feed
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5">
                  <Avatar className="w-6 h-6 text-[9px] font-bold border shrink-0 mt-0.5">
                    <AvatarFallback className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {log.userName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">
                        {log.userName}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1 py-0 h-3.5 ${getActionBadgeColor(log.action)}`}
                      >
                        {log.action}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {log.entityType}
                      </span>
                    </div>

                    <p
                      className="text-[11px] text-foreground truncate mt-0.5"
                      title={log.notes || log.entityTitle}
                    >
                      {log.notes || log.entityTitle || log.entityId}
                    </p>

                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatIDDate(log.createdAt.split("T")[0])}</span>
                      <span>&bull;</span>
                      <span>
                        {log.createdAt.includes("T")
                          ? log.createdAt.split("T")[1].slice(0, 5)
                          : "10:00"}{" "}
                        WIB
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => handleOpenAuditDetail(log)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    <span>Diff</span>
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t mt-3 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Tercatat {auditLogs.length} entri audit sistem
              </span>
              {onViewAuditLog && (
                <button
                  type="button"
                  onClick={onViewAuditLog}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                >
                  Pusat Jejak Audit Lengkap <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Detail Diff Audit Log */}
      <AuditLogDetailDialog
        log={selectedAuditLog}
        open={auditDialogOpen}
        onOpenChange={setAuditDialogOpen}
      />
    </div>
  );
}
