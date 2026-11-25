"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Plus,
  RotateCcw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DailyProgressDialog } from "@/components/progress/daily-progress-dialog";
import { WeeklyProgressDialog } from "@/components/progress/weekly-progress-dialog";
import {
  ProgressLogTables,
  ProgressPeriodTab,
} from "@/components/progress/progress-log-tables";
import { useAppState } from "@/context/app-state-context";
import type { Project } from "@/types";
import { toast } from "sonner";

export function WorkspaceProgressTab() {
  const {
    isLoading,
    loadError,
    refreshFromDatabase,
    projects,
    dailyProgress,
    weeklyProgress,
    tableDensity,
    canEditProjects,
  } = useAppState();

  const [periodTab, setPeriodTab] = useState<ProgressPeriodTab>("DAILY");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [weatherFilter, setWeatherFilter] = useState("ALL");
  const [varianceFilter, setVarianceFilter] = useState("ALL");

  // State modal pilih proyek & dialog input langsung dari Workspace
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<ProgressPeriodTab>("DAILY");
  const [selectedInputProjectId, setSelectedInputProjectId] = useState("");
  const [activeDialogProject, setActiveDialogProject] = useState<Project | null>(null);
  const [dailyDialogOpen, setDailyDialogOpen] = useState(false);
  const [weeklyDialogOpen, setWeeklyDialogOpen] = useState(false);

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.deletedAt),
    [projects]
  );

  const projectById = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of activeProjects) {
      map.set(p.id, p);
    }
    return map;
  }, [activeProjects]);

  const projectOptions = useMemo(
    () => [
      { value: "ALL", label: "Semua Proyek Aktif" },
      ...activeProjects.map((p) => ({
        value: p.id,
        label: `${p.code} - ${p.name}`,
        subLabel: p.locationName || undefined,
      })),
    ],
    [activeProjects]
  );

  // Proyek aktif yang memenuhi syarat input progres (AFCE Approved dan punya minimal 1 item WBS)
  const eligibleInputProjects = useMemo(
    () =>
      activeProjects.filter(
        (p) => p.afceStatus === "Approved" && (p.workItems?.length || 0) > 0
      ),
    [activeProjects]
  );

  const filteredDailyLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dailyProgress.filter((log) => {
      const proj = projectById.get(log.projectId);
      if (!proj) return false;
      if (projectFilter !== "ALL" && log.projectId !== projectFilter) return false;
      if (dateFrom && log.date < dateFrom) return false;
      if (dateTo && log.date > dateTo) return false;
      if (weatherFilter !== "ALL" && log.weather !== weatherFilter) return false;
      if (q) {
        const haystack = [
          proj.code,
          proj.name,
          log.workItemName,
          log.activity,
          log.notes,
          log.createdBy,
          log.spkNumber,
          log.contractorName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [dailyProgress, projectById, projectFilter, dateFrom, dateTo, weatherFilter, search]);

  const filteredWeeklyLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return weeklyProgress.filter((wp) => {
      const proj = projectById.get(wp.projectId);
      if (!proj) return false;
      if (projectFilter !== "ALL" && wp.projectId !== projectFilter) return false;
      if (dateFrom && wp.endDate < dateFrom) return false;
      if (dateTo && wp.startDate > dateTo) return false;
      if (varianceFilter === "ON_TRACK" && wp.variance < 0) return false;
      if (varianceFilter === "BEHIND" && wp.variance >= 0) return false;
      if (q) {
        const haystack = [
          proj.code,
          proj.name,
          wp.workItemName,
          wp.period,
          wp.notes,
          wp.createdBy,
          wp.spkNumber,
          wp.contractorName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [weeklyProgress, projectById, projectFilter, dateFrom, dateTo, varianceFilter, search]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    projectFilter !== "ALL" ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    (periodTab === "DAILY" ? weatherFilter !== "ALL" : varianceFilter !== "ALL");

  const resetFilters = () => {
    setSearch("");
    setProjectFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setWeatherFilter("ALL");
    setVarianceFilter("ALL");
  };

  // Ringkasan metrik sesuai sub-tab & filter aktif
  const activeMetrics = useMemo(() => {
    if (periodTab === "DAILY") {
      const projectIds = new Set(filteredDailyLogs.map((l) => l.projectId));
      const avgProgress =
        filteredDailyLogs.length > 0
          ? Math.round(
              filteredDailyLogs.reduce((sum, l) => sum + (l.progressPercent || 0), 0) /
                filteredDailyLogs.length
            )
          : 0;
      return {
        totalCount: filteredDailyLogs.length,
        reportedProjectCount: projectIds.size,
        thirdLabel: "Rata-rata Progres Item",
        thirdValue: `${avgProgress}%`,
      };
    }
    const projectIds = new Set(filteredWeeklyLogs.map((l) => l.projectId));
    const avgVariance =
      filteredWeeklyLogs.length > 0
        ? Math.round(
            filteredWeeklyLogs.reduce((sum, l) => sum + (l.variance || 0), 0) /
              filteredWeeklyLogs.length
          )
        : 0;
    return {
      totalCount: filteredWeeklyLogs.length,
      reportedProjectCount: projectIds.size,
      thirdLabel: "Rata-rata Deviasi Kurva S",
      thirdValue: avgVariance > 0 ? `+${avgVariance}%` : `${avgVariance}%`,
    };
  }, [periodTab, filteredDailyLogs, filteredWeeklyLogs]);

  const handleTriggerRecord = (mode: ProgressPeriodTab) => {
    if (projectFilter !== "ALL") {
      const selectedProj = projectById.get(projectFilter);
      if (selectedProj) {
        if (selectedProj.afceStatus !== "Approved") {
          toast.error("Proyek ini belum berstatus AFCE Disetujui sehingga belum dapat mencatat progres.");
          return;
        }
        if ((selectedProj.workItems?.length || 0) === 0) {
          toast.error("Tambahkan minimal 1 item pekerjaan WBS pada proyek ini sebelum mencatat progres.");
          return;
        }
        setActiveDialogProject(selectedProj);
        if (mode === "DAILY") {
          setDailyDialogOpen(true);
        } else {
          setWeeklyDialogOpen(true);
        }
        return;
      }
    }

    setPickerMode(mode);
    setSelectedInputProjectId(eligibleInputProjects[0]?.id || "");
    setPickerOpen(true);
  };

  const handleConfirmProjectPicker = () => {
    const target = eligibleInputProjects.find((p) => p.id === selectedInputProjectId);
    if (!target) {
      toast.error("Pilih proyek aktif terlebih dahulu.");
      return;
    }
    setPickerOpen(false);
    setActiveDialogProject(target);
    if (pickerMode === "DAILY") {
      setDailyDialogOpen(true);
    } else {
      setWeeklyDialogOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ringkasan & Tombol Input Progres Langsung */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <Card className="p-3.5 shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground block">
              {periodTab === "DAILY" ? "Total Laporan Harian" : "Total Evaluasi Mingguan"}
            </span>
            <span className="text-xl font-bold font-mono text-foreground mt-0.5 block">
              {activeMetrics.totalCount}
            </span>
          </Card>

          <Card className="p-3.5 shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Proyek Aktif Terlapor
            </span>
            <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 block">
              {activeMetrics.reportedProjectCount}
            </span>
          </Card>

          <Card className="p-3.5 shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground block">
              {activeMetrics.thirdLabel}
            </span>
            <span className="text-xl font-bold font-mono text-foreground mt-0.5 block">
              {activeMetrics.thirdValue}
            </span>
          </Card>
        </div>

        {canEditProjects && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleTriggerRecord("DAILY")}
              className="h-10 sm:h-9 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Catat Progres Harian</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleTriggerRecord("WEEKLY")}
              className="h-10 sm:h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Catat Progres Mingguan</span>
            </Button>
          </div>
        )}
      </div>

      {/* Toolbar Pencarian & Filter */}
      <div className="bg-card p-3 rounded-lg border shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <label htmlFor="ws-progress-search" className="text-[11px] font-medium text-muted-foreground block mb-1">
              Pencarian
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="ws-progress-search"
                type="text"
                placeholder="Cari proyek, item WBS, aktivitas, periode, atau pencatat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 text-xs h-10 sm:h-9 bg-background"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Hapus pencarian"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[250px]">
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Proyek
            </label>
            <SearchableSelect
              value={projectFilter}
              onValueChange={setProjectFilter}
              placeholder="Semua Proyek Aktif"
              searchPlaceholder="Cari proyek..."
              triggerClassName="h-10 sm:h-9 text-xs bg-background"
              options={projectOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 w-full lg:w-auto">
            <div>
              <label htmlFor="ws-progress-from" className="text-[11px] font-medium text-muted-foreground block mb-1">
                Dari Tanggal
              </label>
              <Input
                id="ws-progress-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 sm:h-9 text-xs font-mono bg-background"
              />
            </div>

            <div>
              <label htmlFor="ws-progress-to" className="text-[11px] font-medium text-muted-foreground block mb-1">
                Sampai Tanggal
              </label>
              <Input
                id="ws-progress-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 sm:h-9 text-xs font-mono bg-background"
              />
            </div>
          </div>

          {periodTab === "DAILY" ? (
            <div className="w-full sm:w-[160px]">
              <label htmlFor="ws-progress-weather" className="text-[11px] font-medium text-muted-foreground block mb-1">
                Cuaca
              </label>
              <Select value={weatherFilter} onValueChange={setWeatherFilter}>
                <SelectTrigger id="ws-progress-weather" className="h-10 sm:h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Cuaca</SelectItem>
                  <SelectItem value="Cerah">Cerah</SelectItem>
                  <SelectItem value="Berawan">Berawan</SelectItem>
                  <SelectItem value="Hujan">Hujan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="w-full sm:w-[190px]">
              <label htmlFor="ws-progress-variance" className="text-[11px] font-medium text-muted-foreground block mb-1">
                Status Deviasi
              </label>
              <Select value={varianceFilter} onValueChange={setVarianceFilter}>
                <SelectTrigger id="ws-progress-variance" className="h-10 sm:h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Deviasi</SelectItem>
                  <SelectItem value="ON_TRACK">Sesuai / Surplus (&gt;= 0%)</SelectItem>
                  <SelectItem value="BEHIND">Terlambat (&lt; 0%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-10 sm:h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabel Hasil Input Progres Harian & Mingguan */}
      <ProgressLogTables
        dailyLogs={filteredDailyLogs}
        weeklyLogs={filteredWeeklyLogs}
        projectById={projectById}
        activePeriodTab={periodTab}
        onPeriodTabChange={setPeriodTab}
        showProjectColumn
        tableDensity={tableDensity}
        isLoading={isLoading}
        loadError={loadError}
        onRetryLoad={refreshFromDatabase}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      {/* Dialog Pilih Proyek untuk Input Progres Langsung dari Workspace */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {pickerMode === "DAILY"
                ? "Pilih Proyek untuk Progres Harian"
                : "Pilih Proyek untuk Progres Mingguan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Progres hanya dapat dicatat pada proyek aktif dengan AFCE berstatus Disetujui dan memiliki minimal 1 item pekerjaan WBS.
            </DialogDescription>
          </DialogHeader>

          {eligibleInputProjects.length === 0 ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3.5 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Belum ada proyek yang siap dicatat progresnya</span>
              </div>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                Pastikan dokumen AFCE proyek sudah disetujui dan memiliki item pekerjaan WBS.
              </p>
              {activeProjects.length > 0 && (
                <div className="pt-1">
                  <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                    <Link href={`/workspace/${activeProjects[0].id}/afce`}>
                      Buka Proyek {activeProjects[0].code}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-1">
              <div>
                <label className="text-xs font-semibold block mb-1.5">
                  Proyek Aktif <span className="text-rose-600">*</span>
                </label>
                <SearchableSelect
                  value={selectedInputProjectId}
                  onValueChange={setSelectedInputProjectId}
                  placeholder="Pilih proyek..."
                  searchPlaceholder="Cari kode atau nama proyek..."
                  options={eligibleInputProjects.map((p) => ({
                    value: p.id,
                    label: `${p.code} - ${p.name}`,
                    subLabel: `${p.workItems.length} item WBS | Progres ${p.progress}%`,
                  }))}
                />
              </div>

              {activeProjects.length > eligibleInputProjects.length && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">
                    Info
                  </Badge>
                  <span>
                    {activeProjects.length - eligibleInputProjects.length} proyek lain belum disetujui AFCE atau belum memiliki item WBS.
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(false)}>
              Batal
            </Button>
            {eligibleInputProjects.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmProjectPicker}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                Lanjutkan Input Progres
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Input Progres Harian & Mingguan */}
      {activeDialogProject && (
        <>
          <DailyProgressDialog
            open={dailyDialogOpen}
            onOpenChange={setDailyDialogOpen}
            project={activeDialogProject}
          />
          <WeeklyProgressDialog
            open={weeklyDialogOpen}
            onOpenChange={setWeeklyDialogOpen}
            project={activeDialogProject}
          />
        </>
      )}
    </div>
  );
}
