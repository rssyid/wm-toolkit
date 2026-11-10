"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FolderGit2,
  Activity,
  AlertTriangle,
  PlusCircle,
  Building2,
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { UnifiedGantt } from "@/components/dashboard/unified-gantt";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { AuditLogViewer } from "@/components/dashboard/audit-log-viewer";
import {
  DashboardFilterBar,
  DashboardFilterState,
} from "@/components/dashboard/dashboard-filter-bar";
import { PipelineStatusBar } from "@/components/dashboard/pipeline-status-bar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/context/app-state-context";
import { formatIDR } from "@/lib/utils";

function formatCompactIDR(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Rp 0";
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(0)} Jt`;
  }
  return formatIDR(amount);
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "audit-log" ? "audit-log" : "overview"
  );

  const [filters, setFilters] = useState<DashboardFilterState>({
    locationName: "all",
    focusFilter: "all",
  });

  const {
    projects,
    afces,
    prs,
    pos,
    grs,
    spkContracts,
    uspks,
    technicalEvaluations,
    locations,
    auditLogs,
  } = useAppState();

  useEffect(() => {
    if (tabParam === "audit-log") {
      setActiveTab("audit-log");
    } else if (tabParam === "overview") {
      setActiveTab("overview");
    }
  }, [tabParam]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", val);
    router.replace(`/dashboard?${params.toString()}`);
  };

  // Filtered projects based on Location and Focus
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (
        filters.locationName !== "all" &&
        p.locationName !== filters.locationName
      ) {
        return false;
      }
      if (filters.focusFilter === "critical") {
        return (
          p.scheduleVarianceDays > 7 ||
          p.ewsStatus === "Warning" ||
          p.ewsStatus === "Critical"
        );
      }
      if (filters.focusFilter === "in_progress") {
        return p.status === "In Progress";
      }
      if (filters.focusFilter === "pending_afce") {
        return p.afceStatus === "Pending Approval";
      }
      return true;
    });
  }, [projects, filters]);

  // Executive Tier-1 Metrics
  const totalProjects = filteredProjects.length;
  const runningProjects = filteredProjects.filter((p) => p.status === "In Progress").length;
  const completedProjects = filteredProjects.filter((p) => p.status === "Completed").length;
  const totalAfceValue = filteredProjects.reduce(
    (sum, p) => sum + (p.afceValue || 0),
    0
  );
  const avgProgress =
    totalProjects > 0
      ? Math.round(
          filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) /
            totalProjects
        )
      : 0;

  const delayedProjects = filteredProjects.filter(
    (p) =>
      p.scheduleVarianceDays > 7 ||
      p.ewsStatus === "Warning" ||
      p.ewsStatus === "Critical"
  ).length;

  // Operational Pipeline Metrics
  const afceApprovedCount = afces.filter((a) => a.status === "Approved").length;
  const prReleased = prs.filter((p) => p.status === "Released").length;
  const poReleased = pos.filter((p) => p.status === "Released").length;
  const materialsReceived = grs.length;
  const activeSpks = spkContracts.filter((s) => s.status === "ACTIVE").length;
  const uspkCount = uspks.length;
  const techEvalCompletedCount = technicalEvaluations.filter(
    (t) => t.result === "RECOMMENDED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <Building2 className="w-4 h-4" />
            <span>Project Monitoring Dashboard &bull; Estate Technical Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Dashboard Operasional &amp; Pemantauan Proyek
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitoring siklus proyek estate dari persetujuan AFCE, pengadaan barang &amp; jasa, progres kurva-S, hingga jejak audit sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/workspace/new">
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
              <PlusCircle className="w-4 h-4" />
              <span>+ Tambah Proyek Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/70 p-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs font-medium">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Ringkasan Operasional</span>
          </TabsTrigger>

          <TabsTrigger value="audit-log" className="gap-1.5 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Pusat Jejak Audit</span>
            <Badge
              variant="secondary"
              className="ml-1 text-[10px] px-1.5 py-0 h-4 font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            >
              {auditLogs.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview Operasional */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Quick Filter Bar */}
          <DashboardFilterBar
            filters={filters}
            onFilterChange={setFilters}
            locations={locations}
            filteredCount={filteredProjects.length}
            totalCount={projects.length}
          />

          {/* Tier 1: 4 Executive KPI Hero Cards (Spacious, Clear & High Hierarchy) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Proyek Terpantau"
              value={totalProjects}
              icon={FolderGit2}
              trendText={`${runningProjects} Konstruksi Fisik \u2022 ${completedProjects} Selesai`}
              trendType="neutral"
              href="/workspace"
              accentColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
            />

            <KPICard
              title="Total Nilai Komitmen AFCE"
              value={formatCompactIDR(totalAfceValue)}
              icon={Building2}
              trendText={`${afceApprovedCount} AFCE Disetujui SAP`}
              trendType="positive"
              href="/workspace"
              accentColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
            />

            <KPICard
              title="Peringatan EWS (Kritis)"
              value={delayedProjects}
              icon={AlertTriangle}
              trendText="Deviasi Jadwal > 7 Hari"
              trendType={delayedProjects > 0 ? "negative" : "positive"}
              href="/workspace?status=delayed"
              accentColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40"
            />

            <KPICard
              title="Rata-rata Progres Fisik"
              value={`${avgProgress}%`}
              icon={Activity}
              trendText="Kurva-S Pelaksanaan Lapangan"
              trendType="positive"
              href="/workspace"
              accentColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
            />
          </div>

          {/* Tier 2: Dual Pipeline Status Bar (Pengadaan Barang vs Pekerjaan Jasa) */}
          <PipelineStatusBar
            afceApprovedCount={afceApprovedCount}
            prReleasedCount={prReleased}
            poReleasedCount={poReleased}
            grReceivedCount={materialsReceived}
            uspkCount={uspkCount}
            techEvalCompletedCount={techEvalCompletedCount}
            spkActiveCount={activeSpks}
            inProgressProjectsCount={runningProjects}
          />

          {/* Unified Multi-Project Gantt (Preserved Intact) */}
          <div className="rounded-xl border bg-card p-1 shadow-xs">
            <UnifiedGantt projects={filteredProjects} />
          </div>

          {/* Reorganized Operational Workstation (Balanced 2-Column Grid) */}
          <DashboardWidgets onViewAuditLog={() => handleTabChange("audit-log")} />
        </TabsContent>

        {/* Tab 2: System Audit Log Center (Preserved Intact) */}
        <TabsContent value="audit-log" className="space-y-6 mt-0">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted-foreground">
          Memuat dashboard operasional &amp; jejak audit...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
