"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusCircle,
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  X,
  FileCheck2,
  FileText,
  Activity,
  ListTodo,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, cn } from "@/lib/utils";
import { Project, WorkItem, AFCEDocument } from "@/types";

/**
 * Sub-component for an expanded row (Datatable Expansion 03 layout).
 * 100% dynamically bound to project.workItems and appState.afces.
 */
function ProjectExpandedRow({
  project,
  afceDoc,
}: {
  project: Project;
  afceDoc?: AFCEDocument;
}) {
  const [hideCompleted, setHideCompleted] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(3);

  const workItems = project.workItems || [];
  const completedCount = workItems.filter(
    (w) => w.status === "Completed" || w.progress >= 100
  ).length;
  const inProgressCount = workItems.filter(
    (w) => w.status === "In Progress" || (w.progress > 0 && w.progress < 100)
  ).length;
  const openCount = workItems.length - completedCount;
  const totalWeight = workItems.reduce((acc, curr) => acc + (curr.weight || 0), 0);

  // Filter based on hideCompleted toggle
  const filteredWorkItems = useMemo(() => {
    if (hideCompleted) {
      return workItems.filter((w) => w.status !== "Completed" && w.progress < 100);
    }
    return workItems;
  }, [workItems, hideCompleted]);

  const visibleItems = filteredWorkItems.slice(0, visibleLimit);
  const remainingCount = filteredWorkItems.length - visibleItems.length;

  // Latest approval record from AFCE history if available
  const latestApproval =
    afceDoc && afceDoc.history && afceDoc.history.length > 0
      ? afceDoc.history[afceDoc.history.length - 1]
      : null;

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30 transition-colors border-b">
      <TableCell colSpan={9} className="p-4 sm:p-6 pl-6 sm:pl-12">
        <div className="space-y-4 max-w-7xl">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                <ListTodo className="w-3.5 h-3.5" />
              </span>
              <div className="text-xs font-semibold text-foreground">
                Work Items (WI)
                <span className="ml-1.5 font-normal text-muted-foreground">
                  &bull; {completedCount} dari {workItems.length} selesai ({openCount} open) &bull; Bobot {totalWeight}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors select-none">
                <Switch
                  checked={hideCompleted}
                  onCheckedChange={setHideCompleted}
                  className="scale-90"
                />
                <span>Sembunyikan yang selesai</span>
              </label>
            </div>
          </div>

          {/* Cards Grid: 100% dynamic from project.workItems */}
          {workItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center bg-card/60 space-y-2">
              <p className="text-xs text-muted-foreground">
                Belum ada Work Item (WI) yang terdaftar untuk proyek ini.
              </p>
              <Link href={`/workspace/${project.id}/work-items`}>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  + Buat Work Item
                </Button>
              </Link>
            </div>
          ) : filteredWorkItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-center bg-card/60">
              <p className="text-xs text-muted-foreground">
                Semua Work Item telah selesai (100%). Nonaktifkan opsi &quot;Sembunyikan yang selesai&quot; untuk melihat semua.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {visibleItems.map((wi: WorkItem) => {
                  // Determine status border accent (like datatable-expansion-03)
                  const isDone = wi.status === "Completed" || wi.progress >= 100;
                  const isInProgress = wi.status === "In Progress" || (wi.progress > 0 && wi.progress < 100);
                  const isDelayed = wi.status === "On Hold" || (project.scheduleVarianceDays > 7 && isInProgress);

                  const borderClass = isDone
                    ? "border-l-emerald-600 dark:border-l-emerald-400"
                    : isDelayed
                    ? "border-l-rose-500 dark:border-l-rose-400"
                    : isInProgress
                    ? "border-l-blue-600 dark:border-l-blue-400"
                    : "border-l-slate-300 dark:border-l-slate-700";

                  return (
                    <div
                      key={wi.id}
                      className={cn(
                        "bg-card text-card-foreground rounded-lg border border-l-4 p-3.5 shadow-xs flex flex-col justify-between gap-3 transition-shadow hover:shadow-sm",
                        borderClass
                      )}
                    >
                      {/* Top: Name & Badges */}
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-foreground line-clamp-1 leading-snug" title={wi.name}>
                            {wi.name}
                          </h4>
                          <StatusBadge status={wi.status} className="text-[10px] py-0 px-2 shrink-0" />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <Badge variant="secondary" className="px-1.5 py-0 font-mono font-medium">
                            Bobot: {wi.weight}%
                          </Badge>
                          <Badge variant="outline" className="px-1.5 py-0 text-muted-foreground">
                            {wi.type === "Physical" ? "Fisik" : "Material"}
                          </Badge>
                          <Badge variant="outline" className="px-1.5 py-0 text-muted-foreground">
                            {wi.procurementType}
                          </Badge>
                          <span className="text-muted-foreground">
                            &bull; Mode {wi.progressMode === "Daily" ? "Harian" : "Mingguan"}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Progress Bar */}
                      <div className="space-y-1 bg-muted/40 p-2 rounded-md border border-border/40">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground font-medium">Realisasi Progres</span>
                          <span className="font-mono font-bold text-foreground">{wi.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              isDone ? "bg-emerald-600" : isDelayed ? "bg-rose-500" : isInProgress ? "bg-blue-600" : "bg-slate-300"
                            )}
                            style={{ width: `${Math.min(100, Math.max(0, wi.progress))}%` }}
                          />
                        </div>
                      </div>

                      {/* Notes / Quote block if present */}
                      {wi.notes && (
                        <p className="border-l-2 border-primary/40 pl-2 text-xs text-muted-foreground italic line-clamp-2">
                          &ldquo;{wi.notes}&rdquo;
                        </p>
                      )}

                      {/* Footer: Date target */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-muted-foreground/70" />
                          <span>{formatIDDate(wi.startDate)} – {formatIDDate(wi.endDate)}</span>
                        </div>
                        {wi.phase && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]" title={wi.phase}>
                            {wi.phase}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* +X More Items Button */}
              {remainingCount > 0 && (
                <div className="pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground p-0 px-2 font-normal hover:bg-transparent"
                    onClick={() => setVisibleLimit((v) => v + 3)}
                  >
                    <ChevronDown className="w-3.5 h-3.5 mr-1" />
                    +{remainingCount} item lainnya (klik untuk melihat)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Bottom Panel: AFCE & Approval Audit */}
          <div className="rounded-lg border bg-card p-3.5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-foreground">
                  Informasi Dokumen AFCE & Riwayat Persetujuan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/workspace/${project.id}/work-items`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>Kelola WI</span>
                  </Button>
                </Link>
                <Link href={`/workspace/${project.id}/afce`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Dokumen AFCE</span>
                  </Button>
                </Link>
                <Link href={`/workspace/${project.id}`}>
                  <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                    <span>Buka Proyek</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1 border-t border-border/50">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Nomor AFCE & Nilai
                </span>
                <span className="font-mono font-medium text-foreground">{project.afceNumber}</span>
                <div className="font-semibold text-foreground text-xs mt-0.5">
                  {formatIDR(project.afceValue)}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  No. Dokumen SAP
                </span>
                <span className="font-mono text-foreground">
                  {project.sapDocNumber || afceDoc?.sapDocNumber || "Belum ada (Draft)"}
                </span>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Ref ERP: {project.sapDocNumber ? "SAP S/4HANA Sync" : "Menunggu Approval Level 3"}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Status Approval
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusBadge status={project.afceStatus} className="text-[10px] py-0 px-2" />
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate" title={project.approvalStatus}>
                  {project.approvalStatus}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Catatan Persetujuan
                </span>
                {latestApproval ? (
                  <div className="text-[11px] text-foreground font-medium">
                    <span className="text-muted-foreground">{latestApproval.approverName} ({latestApproval.approverRole}):</span>{" "}
                    &ldquo;{latestApproval.note || "Disetujui"}&rdquo;
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground italic">
                    {project.approvalStatus || "Menunggu verifikasi lapangan."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    projects,
    afces,
    regions,
    companies,
    locations,
    tableDensity,
    setTableDensity,
    deleteProject,
    restoreProject,
    isViewerOnly,
  } = useAppState();

  // View mode: Active projects vs Recycle Bin
  const [viewMode, setViewMode] = useState<"ACTIVE" | "RECYCLE_BIN">("ACTIVE");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [workTypeFilter, setWorkTypeFilter] = useState("ALL");
  const [procurementFilter, setProcurementFilter] = useState("ALL");
  const [afceStatusFilter, setAfceStatusFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Multi-Expand State: Record of projectId -> boolean
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    paginatedProjects.forEach((p) => {
      next[p.id] = true;
    });
    setExpandedRows(next);
  };

  const collapseAll = () => {
    setExpandedRows({});
  };

  // Sync with URL search params from KPI cards or global search
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const afceParam = searchParams.get("afceStatus");
    const locParam = searchParams.get("location");
    const queryParam = searchParams.get("q");

    if (statusParam) {
      if (statusParam === "delayed") {
        setStatusFilter("DELAYED");
      } else {
        setStatusFilter(statusParam);
      }
    }
    if (afceParam) setAfceStatusFilter(afceParam);
    if (locParam) setLocationFilter(locParam);
    if (queryParam) setSearch(queryParam);
  }, [searchParams]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setWorkTypeFilter("ALL");
    setProcurementFilter("ALL");
    setAfceStatusFilter("ALL");
    setRegionFilter("ALL");
    setCompanyFilter("ALL");
    setLocationFilter("ALL");
    setYearFilter("ALL");
    setPage(1);
    router.replace("/workspace");
  };

  // Counts for active vs deleted and quick status pills
  const activeProjects = useMemo(() => projects.filter((p) => !p.deletedAt), [projects]);
  const deletedProjects = useMemo(() => projects.filter((p) => !!p.deletedAt), [projects]);

  const statusCounts = useMemo(() => {
    const targetPool = viewMode === "ACTIVE" ? activeProjects : deletedProjects;
    const total = targetPool.length;
    const inProgress = targetPool.filter((p) => p.status === "In Progress").length;
    const delayed = targetPool.filter(
      (p) => p.scheduleVarianceDays > 7 || p.ewsStatus === "Critical" || p.ewsStatus === "Warning"
    ).length;
    const planned = targetPool.filter((p) => p.status === "Planned").length;
    const completed = targetPool.filter((p) => p.status === "Completed").length;
    return { total, inProgress, delayed, planned, completed };
  }, [viewMode, activeProjects, deletedProjects]);

  // Count active advanced filters
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (regionFilter !== "ALL") count++;
    if (companyFilter !== "ALL") count++;
    if (locationFilter !== "ALL") count++;
    if (workTypeFilter !== "ALL") count++;
    if (procurementFilter !== "ALL") count++;
    if (afceStatusFilter !== "ALL") count++;
    if (yearFilter !== "ALL") count++;
    return count;
  }, [
    regionFilter,
    companyFilter,
    locationFilter,
    workTypeFilter,
    procurementFilter,
    afceStatusFilter,
    yearFilter,
  ]);

  // Filtered dataset
  const filteredProjects = useMemo(() => {
    const baseProjects = viewMode === "ACTIVE" ? activeProjects : deletedProjects;
    return baseProjects.filter((p) => {
      // Free text search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesCode = p.code.toLowerCase().includes(query);
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesAfce = p.afceNumber.toLowerCase().includes(query);
        const matchesLoc =
          p.locationName.toLowerCase().includes(query) ||
          (p.locationNames?.some((l) => l.toLowerCase().includes(query)) ?? false);
        const matchesComp = p.companyName?.toLowerCase().includes(query) || false;
        const matchesReg = p.regionName?.toLowerCase().includes(query) || false;
        const matchesBlock =
          p.blockCode?.toLowerCase().includes(query) ||
          (p.blockCodes?.some((b) => b.toLowerCase().includes(query)) ?? false);
        const matchesCat = p.projectCategoryName?.toLowerCase().includes(query) || false;
        if (
          !matchesCode &&
          !matchesName &&
          !matchesAfce &&
          !matchesLoc &&
          !matchesComp &&
          !matchesReg &&
          !matchesBlock &&
          !matchesCat
        ) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "ALL") {
        if (statusFilter === "DELAYED") {
          if (p.scheduleVarianceDays <= 7 && p.ewsStatus === "Normal") return false;
        } else if (p.status !== statusFilter) {
          return false;
        }
      }

      // Work Type
      if (workTypeFilter !== "ALL" && p.projectType !== workTypeFilter) {
        return false;
      }

      // Procurement
      if (procurementFilter !== "ALL" && p.procurementType !== procurementFilter) {
        return false;
      }

      // AFCE Status
      if (afceStatusFilter !== "ALL" && p.afceStatus !== afceStatusFilter) {
        return false;
      }

      // Region
      if (regionFilter !== "ALL" && p.regionId !== regionFilter) {
        return false;
      }

      // Company
      if (companyFilter !== "ALL" && p.companyId !== companyFilter) {
        return false;
      }

      // Location
      if (locationFilter !== "ALL") {
        const matchesSingle = p.locationId === locationFilter;
        const matchesMulti =
          p.locationIds &&
          Array.isArray(p.locationIds) &&
          p.locationIds.includes(locationFilter);
        if (!matchesSingle && !matchesMulti) {
          return false;
        }
      }

      // Year
      if (yearFilter !== "ALL") {
        const year = p.baselineStartDate.split("-")[0];
        if (year !== yearFilter) return false;
      }

      return true;
    });
  }, [
    viewMode,
    activeProjects,
    deletedProjects,
    search,
    statusFilter,
    workTypeFilter,
    procurementFilter,
    afceStatusFilter,
    regionFilter,
    companyFilter,
    locationFilter,
    yearFilter,
  ]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = filteredProjects.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Workspace Proyek
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar seluruh portofolio proyek teknik sipil, pemeliharaan infrastruktur, dan pengadaan kebun.
          </p>
        </div>

        {!isViewerOnly && (
          <div className="flex items-center gap-2">
            <Link href="/workspace/new">
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                <PlusCircle className="w-4 h-4" />
                <span>+ Tambah Proyek</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Top Tabs: Active Projects vs Recycle Bin */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewMode("ACTIVE");
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2",
              viewMode === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <span>Proyek Aktif</span>
            <Badge variant="secondary" className={cn("px-1.5 py-0 text-[10px]", viewMode === "ACTIVE" && "bg-white/20 text-white")}>
              {activeProjects.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode("RECYCLE_BIN");
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2",
              viewMode === "RECYCLE_BIN"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Recycle Bin</span>
            <Badge variant="secondary" className={cn("px-1.5 py-0 text-[10px]", viewMode === "RECYCLE_BIN" && "bg-white/20 text-white")}>
              {deletedProjects.length}
            </Badge>
          </button>
        </div>

        {viewMode === "RECYCLE_BIN" && (
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium hidden sm:inline">
            Proyek di Recycle Bin dapat dipulihkan sewaktu-waktu.
          </span>
        )}
      </div>

      {/* Modern Filter Toolbar */}
      <div className="space-y-2.5">
        {/* Quick Status Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/50 rounded-lg border w-fit">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ALL");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
              statusFilter === "ALL"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Semua</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {statusCounts.total}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("In Progress");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
              statusFilter === "In Progress"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>In Progress</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {statusCounts.inProgress}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("DELAYED");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
              statusFilter === "DELAYED"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Delayed / Kritis</span>
            <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
              {statusCounts.delayed}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("Planned");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
              statusFilter === "Planned"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Planned</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {statusCounts.planned}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("Completed");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
              statusFilter === "Completed"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Completed</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {statusCounts.completed}
            </Badge>
          </button>
        </div>

        {/* Toolbar: Search + Filter Lanjutan Popover + Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card p-2.5 rounded-lg border shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari kode proyek, nama proyek, nomor AFCE, atau nama kebun..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-8 text-xs h-9 bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Lanjutan Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 text-xs gap-1.5",
                    activeAdvancedFilterCount > 0 && "border-emerald-600 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter Lanjutan</span>
                  {activeAdvancedFilterCount > 0 && (
                    <Badge className="ml-1 px-1.5 py-0 text-[10px] bg-emerald-600 text-white">
                      {activeAdvancedFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[340px] sm:w-[480px] p-4 space-y-4"
                align="end"
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement;
                  if (target?.closest?.('[data-radix-popper-content-wrapper], [cmdk-root], [role="listbox"], [role="combobox"]')) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                    <span>Filter Lanjutan Proyek</span>
                  </div>
                  {activeAdvancedFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRegionFilter("ALL");
                        setCompanyFilter("ALL");
                        setLocationFilter("ALL");
                        setWorkTypeFilter("ALL");
                        setProcurementFilter("ALL");
                        setAfceStatusFilter("ALL");
                        setYearFilter("ALL");
                      }}
                      className="h-6 text-[11px] text-muted-foreground hover:text-foreground p-0 px-1"
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Region */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Wilayah
                    </label>
                    <SearchableSelect
                      value={regionFilter}
                      onValueChange={(val) => {
                        setRegionFilter(val);
                        setPage(1);
                      }}
                      placeholder="Semua Wilayah"
                      searchPlaceholder="Cari wilayah..."
                      triggerClassName="h-8 text-xs bg-background"
                      options={[
                        { value: "ALL", label: "Semua Wilayah" },
                        ...regions.map((r) => ({ value: r.id, label: r.name, subLabel: r.code })),
                      ]}
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Perusahaan (PT)
                    </label>
                    <SearchableSelect
                      value={companyFilter}
                      onValueChange={(val) => {
                        setCompanyFilter(val);
                        setPage(1);
                      }}
                      placeholder="Semua PT"
                      searchPlaceholder="Cari PT..."
                      triggerClassName="h-8 text-xs bg-background"
                      options={[
                        { value: "ALL", label: "Semua PT" },
                        ...companies.map((c) => ({ value: c.id, label: c.code, subLabel: c.name })),
                      ]}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Lokasi Kebun
                    </label>
                    <SearchableSelect
                      value={locationFilter}
                      onValueChange={(val) => {
                        setLocationFilter(val);
                        setPage(1);
                      }}
                      placeholder="Semua Kebun"
                      searchPlaceholder="Cari kebun..."
                      triggerClassName="h-8 text-xs bg-background"
                      options={[
                        { value: "ALL", label: "Semua Kebun" },
                        ...locations.map((loc) => ({ value: loc.id, label: loc.name, subLabel: loc.code })),
                      ]}
                    />
                  </div>

                  {/* AFCE Status */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Status AFCE
                    </label>
                    <SearchableSelect
                      value={afceStatusFilter}
                      onValueChange={(val) => {
                        setAfceStatusFilter(val);
                        setPage(1);
                      }}
                      placeholder="Semua AFCE"
                      searchPlaceholder="Cari status AFCE..."
                      triggerClassName="h-8 text-xs bg-background"
                      options={[
                        { value: "ALL", label: "Semua AFCE" },
                        { value: "Draft", label: "Draft" },
                        { value: "Pending Approval", label: "Pending Approval" },
                        { value: "Approved", label: "Approved" },
                        { value: "Need Revision", label: "Need Revision" },
                        { value: "Rejected", label: "Rejected" },
                      ]}
                    />
                  </div>

                  {/* Work Type */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Tipe Proyek
                    </label>
                    <SearchableSelect
                      value={workTypeFilter}
                      onValueChange={(val) => {
                        setWorkTypeFilter(val);
                        setPage(1);
                      }}
                      placeholder="Semua Tipe"
                      searchPlaceholder="Cari tipe..."
                      triggerClassName="h-8 text-xs bg-background"
                      options={[
                        { value: "ALL", label: "Semua Tipe" },
                        { value: "Physical Work", label: "Physical Work" },
                        { value: "Material Purchase", label: "Material Purchase" },
                        { value: "Combined", label: "Combined" },
                      ]}
                    />
                  </div>

                  {/* Procurement */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Metode Pengadaan
                    </label>
                    <SearchableSelect
                      value={procurementFilter}
                      onValueChange={(val) => {
                        setProcurementFilter(val);
                        setPage(1);
                      }}
                      placeholder="Semua Pengadaan"
                      searchPlaceholder="Cari pengadaan..."
                      triggerClassName="h-8 text-xs bg-background"
                      options={[
                        { value: "ALL", label: "Semua Pengadaan" },
                        { value: "Tender", label: "Tender" },
                        { value: "Swakelola", label: "Swakelola" },
                        { value: "Purchase", label: "Purchase Langsung" },
                      ]}
                    />
                  </div>

                  {/* Year */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Tahun Anggaran
                    </label>
                    <SearchableSelect
                      value={yearFilter}
                      onValueChange={(val) => {
                        setYearFilter(val);
                        setPage(1);
                      }}
                      placeholder="Semua Tahun"
                      searchPlaceholder="Cari tahun..."
                      triggerClassName="h-8 text-xs bg-background"
                      options={[
                        { value: "ALL", label: "Semua Tahun" },
                        { value: "2026", label: "2026" },
                        { value: "2027", label: "2027" },
                      ]}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Density Toggle */}
            <div className="hidden sm:flex items-center rounded-md border p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setTableDensity("comfortable")}
                className={cn(
                  "px-2 py-1 text-[11px] rounded transition-all",
                  tableDensity === "comfortable"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Tampilan Reguler"
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => setTableDensity("compact")}
                className={cn(
                  "px-2 py-1 text-[11px] rounded transition-all",
                  tableDensity === "compact"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Tampilan Padat"
              >
                Compact
              </button>
            </div>

            {/* Quick Multi-Expand Controls */}
            <div className="hidden md:flex items-center gap-1 border-l pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
                title="Buka semua baris yang tampil"
              >
                Expand Semua
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
                title="Tutup semua baris"
              >
                Tutup Semua
              </Button>
            </div>

            {/* Quick Reset Button if any filter active */}
            {(search || statusFilter !== "ALL" || activeAdvancedFilterCount > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1"
                title="Reset seluruh filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeAdvancedFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <span className="text-[11px] font-medium mr-1">Filter Aktif:</span>

            {regionFilter !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 text-[11px]">
                <span>Wilayah: {regions.find((r) => r.id === regionFilter)?.name || regionFilter}</span>
                <button type="button" onClick={() => setRegionFilter("ALL")}>
                  <X className="w-3 h-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {companyFilter !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 text-[11px]">
                <span>PT: {companies.find((c) => c.id === companyFilter)?.code || companyFilter}</span>
                <button type="button" onClick={() => setCompanyFilter("ALL")}>
                  <X className="w-3 h-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {locationFilter !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 text-[11px]">
                <span>Kebun: {locations.find((l) => l.id === locationFilter)?.name || locationFilter}</span>
                <button type="button" onClick={() => setLocationFilter("ALL")}>
                  <X className="w-3 h-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {workTypeFilter !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 text-[11px]">
                <span>Tipe: {workTypeFilter}</span>
                <button type="button" onClick={() => setWorkTypeFilter("ALL")}>
                  <X className="w-3 h-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {procurementFilter !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 text-[11px]">
                <span>Pengadaan: {procurementFilter}</span>
                <button type="button" onClick={() => setProcurementFilter("ALL")}>
                  <X className="w-3 h-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {afceStatusFilter !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 text-[11px]">
                <span>AFCE: {afceStatusFilter}</span>
                <button type="button" onClick={() => setAfceStatusFilter("ALL")}>
                  <X className="w-3 h-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            {yearFilter !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 text-[11px]">
                <span>Tahun: {yearFilter}</span>
                <button type="button" onClick={() => setYearFilter("ALL")}>
                  <X className="w-3 h-3 hover:text-foreground" />
                </button>
              </Badge>
            )}

            <button
              type="button"
              onClick={() => {
                setRegionFilter("ALL");
                setCompanyFilter("ALL");
                setLocationFilter("ALL");
                setWorkTypeFilter("ALL");
                setProcurementFilter("ALL");
                setAfceStatusFilter("ALL");
                setYearFilter("ALL");
              }}
              className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline ml-1"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>

      {/* Projects Table (Datatable Expansion 03 layout) */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[44px] text-center px-2">
                <span className="sr-only">Expand</span>
              </TableHead>
              <TableHead className="w-[130px]">Kode & Kategori</TableHead>
              <TableHead className="min-w-[240px]">Nama Proyek & Lokasi</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[160px]">Realisasi Progress</TableHead>
              <TableHead className="w-[120px]">Target Selesai</TableHead>
              <TableHead className="w-[110px]">Deviasi / EWS</TableHead>
              <TableHead className="w-[140px]">Status & Nilai AFCE</TableHead>
              <TableHead className="text-right w-[80px] pr-4">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-48 text-center p-0">
                  <EmptyState
                    title="Tidak ada proyek yang cocok dengan filter"
                    description="Cobalah mengatur ulang filter atau gunakan kata kunci pencarian yang lebih umum."
                    actionLabel="Reset Semua Filter"
                    onAction={resetFilters}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedProjects.map((p) => {
                const isExpanded = !!expandedRows[p.id];
                const isDelayed = p.scheduleVarianceDays > 7;
                const workItemsCount = p.workItems?.length || 0;
                const completedWiCount = (p.workItems || []).filter(
                  (w) => w.status === "Completed" || w.progress >= 100
                ).length;

                // Match AFCE document from state
                const afceDoc = afces.find(
                  (a) => a.afceNumber === p.afceNumber || a.projectId === p.id
                );

                return (
                  <React.Fragment key={p.id}>
                    <TableRow
                      data-state={isExpanded ? "expanded" : undefined}
                      className={cn(
                        "group transition-colors cursor-pointer",
                        isExpanded ? "bg-muted/20 hover:bg-muted/25" : "hover:bg-muted/40",
                        tableDensity === "compact" ? "h-11" : "h-14"
                      )}
                      onClick={() => toggleRow(p.id)}
                    >
                      {/* Chevron Expand Toggle */}
                      <TableCell
                        className="px-2 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(p.id);
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={isExpanded ? "Tutup rincian proyek" : "Buka rincian proyek"}
                          aria-expanded={isExpanded}
                          className="w-7 h-7 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform duration-200",
                              isExpanded && "rotate-180 text-primary"
                            )}
                          />
                        </Button>
                      </TableCell>

                      {/* Code & Category */}
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-xs text-foreground tracking-tight">
                            {p.code}
                          </span>
                          {p.projectCategoryName && (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate max-w-[120px]">
                              {p.projectCategoryName}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Project Name & Hierarchy */}
                      <TableCell className="py-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {p.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-medium text-foreground/80">{p.locationName}</span>
                            {p.companyName && (
                              <>
                                <span>&bull;</span>
                                <span className="truncate max-w-[140px]" title={p.companyName}>
                                  {p.companyName.includes("(")
                                    ? p.companyName.split("(")[0].trim()
                                    : p.companyName}
                                </span>
                              </>
                            )}
                            {p.blockCode && (
                              <>
                                <span>&bull;</span>
                                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                                  {p.blockCode}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Project Status */}
                      <TableCell className="py-2">
                        <StatusBadge status={p.status} className="text-xs" />
                      </TableCell>

                      {/* Progress Bar & WI Counters */}
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-1 pr-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-foreground">
                              {p.progress}%
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {completedWiCount}/{workItemsCount} WI
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                p.progress >= 100
                                  ? "bg-emerald-600"
                                  : isDelayed
                                  ? "bg-rose-500"
                                  : p.progress > 0
                                  ? "bg-blue-600"
                                  : "bg-slate-300"
                              )}
                              style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Target End Date */}
                      <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                        {formatIDDate(p.targetEndDate)}
                      </TableCell>

                      {/* Schedule Variance / EWS */}
                      <TableCell className="py-2">
                        {isDelayed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>+{p.scheduleVarianceDays} hr</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>On Track</span>
                          </span>
                        )}
                      </TableCell>

                      {/* AFCE Status & Amount */}
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-0.5">
                          <div>
                            <StatusBadge
                              status={p.afceStatus}
                              showDot={false}
                              className="text-[10px] py-0 px-2"
                            />
                          </div>
                          <span className="font-mono text-[11px] text-foreground font-medium">
                            {formatIDR(p.afceValue)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Action Button */}
                      <TableCell className="py-2 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {viewMode === "RECYCLE_BIN" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restoreProject(p.id)}
                              className="h-7 text-xs px-2.5 gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 font-semibold"
                              title="Pulihkan proyek dari Recycle Bin"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Pulihkan</span>
                            </Button>
                          ) : (
                            <>
                              <Link
                                href={`/workspace/${p.id}`}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2.5 gap-1 hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  <span>Buka</span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              </Link>

                              {!isViewerOnly && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setProjectToDelete(p);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                                  title="Pindahkan ke Recycle Bin"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row Content (Datatable Expansion 03) */}
                    {isExpanded && (
                      <ProjectExpandedRow project={p} afceDoc={afceDoc} />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="p-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-muted-foreground">
          <div>
            Menampilkan{" "}
            <span className="font-semibold text-foreground">
              {filteredProjects.length === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{" "}
            hingga{" "}
            <span className="font-semibold text-foreground">
              {Math.min(page * pageSize, filteredProjects.length)}
            </span>{" "}
            dari <span className="font-semibold text-foreground">{filteredProjects.length}</span> proyek
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium px-2">
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <DialogTitle className="text-base font-bold">Pindahkan Proyek ke Recycle Bin</DialogTitle>
              </div>
              <DialogDescription className="text-xs pt-1">
                Apakah Anda yakin ingin memindahkan proyek ini ke Recycle Bin?
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 text-xs space-y-1">
              <p className="font-bold text-foreground">
                {projectToDelete.code} — {projectToDelete.name}
              </p>
              <p className="text-muted-foreground">
                Lokasi: {projectToDelete.locationName} &bull; Nilai: {formatIDR(projectToDelete.afceValue)}
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Proyek ini tidak akan dihapus permanen. Anda dapat memulihkannya kapan saja melalui tab <strong>Recycle Bin</strong> di halaman Workspace.
            </p>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  deleteProject(projectToDelete.id);
                  setDeleteDialogOpen(false);
                  setProjectToDelete(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Pindahkan ke Recycle Bin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Memuat data workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
