"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  CloudSun,
  ExternalLink,
  Sun,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatIDDate } from "@/lib/utils";
import type { DailyProgressRecord, Project, WeeklyProgressRecord } from "@/types";

export type ProgressPeriodTab = "DAILY" | "WEEKLY";

interface ProgressLogTablesProps {
  dailyLogs: DailyProgressRecord[];
  weeklyLogs: WeeklyProgressRecord[];
  projectById: Map<string, Project>;
  activePeriodTab: ProgressPeriodTab;
  onPeriodTabChange: (tab: ProgressPeriodTab) => void;
  showProjectColumn?: boolean;
  tableDensity?: "comfortable" | "compact";
  isLoading?: boolean;
  loadError?: string | null;
  onRetryLoad?: () => void;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  pageSize?: number;
}

type DailySortField = "date" | "project" | "workItem" | "progressPercent";
type WeeklySortField = "endDate" | "project" | "workItem" | "actualProgress" | "variance";

function WeatherBadge({ weather }: { weather: DailyProgressRecord["weather"] }) {
  if (weather === "Hujan") {
    return (
      <Badge
        variant="outline"
        className="text-[11px] gap-1 border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
      >
        <CloudRain className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span>Hujan</span>
      </Badge>
    );
  }
  if (weather === "Berawan") {
    return (
      <Badge
        variant="outline"
        className="text-[11px] gap-1 border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        <CloudSun className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span>Berawan</span>
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[11px] gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    >
      <Sun className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>Cerah</span>
    </Badge>
  );
}

export function ProgressLogTables({
  dailyLogs,
  weeklyLogs,
  projectById,
  activePeriodTab,
  onPeriodTabChange,
  showProjectColumn = true,
  tableDensity = "comfortable",
  isLoading = false,
  loadError = null,
  onRetryLoad,
  hasActiveFilters = false,
  onResetFilters,
  pageSize = 10,
}: ProgressLogTablesProps) {
  const [dailySortField, setDailySortField] = useState<DailySortField>("date");
  const [dailySortDir, setDailySortDir] = useState<"asc" | "desc">("desc");
  const [weeklySortField, setWeeklySortField] = useState<WeeklySortField>("endDate");
  const [weeklySortDir, setWeeklySortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activePeriodTab, dailyLogs.length, weeklyLogs.length]);

  const sortedDailyLogs = useMemo(() => {
    const copy = [...dailyLogs];
    const factor = dailySortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      switch (dailySortField) {
        case "date":
          return (a.date || "").localeCompare(b.date || "") * factor;
        case "project": {
          const pa = projectById.get(a.projectId)?.code || "";
          const pb = projectById.get(b.projectId)?.code || "";
          return pa.localeCompare(pb) * factor;
        }
        case "workItem":
          return (a.workItemName || "").localeCompare(b.workItemName || "") * factor;
        case "progressPercent":
          return ((a.progressPercent || 0) - (b.progressPercent || 0)) * factor;
        default:
          return 0;
      }
    });
    return copy;
  }, [dailyLogs, dailySortField, dailySortDir, projectById]);

  const sortedWeeklyLogs = useMemo(() => {
    const copy = [...weeklyLogs];
    const factor = weeklySortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      switch (weeklySortField) {
        case "endDate":
          return (a.endDate || "").localeCompare(b.endDate || "") * factor;
        case "project": {
          const pa = projectById.get(a.projectId)?.code || "";
          const pb = projectById.get(b.projectId)?.code || "";
          return pa.localeCompare(pb) * factor;
        }
        case "workItem":
          return (a.workItemName || "").localeCompare(b.workItemName || "") * factor;
        case "actualProgress":
          return ((a.actualProgress || 0) - (b.actualProgress || 0)) * factor;
        case "variance":
          return ((a.variance || 0) - (b.variance || 0)) * factor;
        default:
          return 0;
      }
    });
    return copy;
  }, [weeklyLogs, weeklySortField, weeklySortDir, projectById]);

  const activeTotal = activePeriodTab === "DAILY" ? sortedDailyLogs.length : sortedWeeklyLogs.length;
  const totalPages = Math.max(1, Math.ceil(activeTotal / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedDaily = sortedDailyLogs.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pagedWeekly = sortedWeeklyLogs.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleDailySort = (field: DailySortField) => {
    if (dailySortField === field) {
      setDailySortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setDailySortField(field);
      setDailySortDir(field === "date" ? "desc" : "asc");
    }
    setPage(1);
  };

  const toggleWeeklySort = (field: WeeklySortField) => {
    if (weeklySortField === field) {
      setWeeklySortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setWeeklySortField(field);
      setWeeklySortDir(field === "endDate" ? "desc" : "asc");
    }
    setPage(1);
  };

  const rowHeightClass = tableDensity === "compact" ? "h-11" : "h-14";

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      {/* Sub-tab switch Harian vs Mingguan */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b bg-muted/30">
        <div
          role="tablist"
          aria-label="Jenis laporan progres"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-muted/70 rounded-lg border"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activePeriodTab === "DAILY"}
            onClick={() => onPeriodTabChange("DAILY")}
            className={cn(
              "min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1.5",
              activePeriodTab === "DAILY"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <span>Progres Harian</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {dailyLogs.length}
            </Badge>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activePeriodTab === "WEEKLY"}
            onClick={() => onPeriodTabChange("WEEKLY")}
            className={cn(
              "min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1.5",
              activePeriodTab === "WEEKLY"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarRange className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
            <span>Progres Mingguan</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {weeklyLogs.length}
            </Badge>
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground font-mono">
          {activePeriodTab === "DAILY"
            ? `${dailyLogs.length} catatan harian`
            : `${weeklyLogs.length} evaluasi mingguan`}
        </span>
      </div>

      {/* Loading / Error / Empty / Table States (R-27) */}
      {isLoading ? (
        <div className="p-6 space-y-3" aria-busy="true" aria-label="Memuat data progres">
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded bg-muted animate-pulse" />
        </div>
      ) : loadError ? (
        <div className="p-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
          {onRetryLoad && (
            <div>
              <Button type="button" variant="outline" size="sm" onClick={onRetryLoad} className="h-9 text-xs">
                Muat Ulang Data
              </Button>
            </div>
          )}
        </div>
      ) : activeTotal === 0 ? (
        <div className="p-6 sm:p-8">
          <EmptyState
            icon={
              activePeriodTab === "DAILY" ? (
                <Activity className="w-8 h-8 opacity-60" />
              ) : (
                <TrendingUp className="w-8 h-8 opacity-60" />
              )
            }
            title={
              hasActiveFilters
                ? "Tidak ada catatan progres yang cocok dengan filter"
                : activePeriodTab === "DAILY"
                ? "Belum ada hasil input progres harian"
                : "Belum ada hasil input progres mingguan"
            }
            description={
              hasActiveFilters
                ? "Ubah kata kunci pencarian atau atur ulang filter untuk melihat catatan progres lainnya."
                : "Catatan progres yang diinput oleh PIC atau Admin akan langsung tampil di tabel ini."
            }
            actionLabel={hasActiveFilters && onResetFilters ? "Reset Filter" : undefined}
            onAction={hasActiveFilters ? onResetFilters : undefined}
          />
        </div>
      ) : activePeriodTab === "DAILY" ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[120px]">
                  <button
                    type="button"
                    onClick={() => toggleDailySort("date")}
                    className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </TableHead>
                {showProjectColumn && (
                  <TableHead className="min-w-[190px]">
                    <button
                      type="button"
                      onClick={() => toggleDailySort("project")}
                      className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                    >
                      <span>Proyek</span>
                      <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </TableHead>
                )}
                <TableHead className="min-w-[170px]">
                  <button
                    type="button"
                    onClick={() => toggleDailySort("workItem")}
                    className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    <span>Item Pekerjaan WBS</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="min-w-[200px]">Aktivitas &amp; Catatan</TableHead>
                <TableHead className="w-[140px]">Volume</TableHead>
                <TableHead className="w-[130px]">
                  <button
                    type="button"
                    onClick={() => toggleDailySort("progressPercent")}
                    className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    <span>Progres Item</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="w-[110px]">Cuaca</TableHead>
                <TableHead className="w-[130px]">Pencatat</TableHead>
                <TableHead className="w-[120px]">Dokumentasi</TableHead>
                {showProjectColumn && <TableHead className="text-right w-[90px] pr-4">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedDaily.map((log) => {
                const proj = projectById.get(log.projectId);
                return (
                  <TableRow key={log.id} className={cn("text-xs hover:bg-muted/30", rowHeightClass)}>
                    <TableCell className="font-mono font-medium whitespace-nowrap">
                      {formatIDDate(log.date)}
                    </TableCell>

                    {showProjectColumn && (
                      <TableCell>
                        <div className="flex flex-col">
                          <Link
                            href={`/workspace/${log.projectId}/execution?tab=progress`}
                            className="font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            {proj?.code || "-"}
                          </Link>
                          <span className="text-[11px] text-foreground line-clamp-1">
                            {proj?.name || "Proyek"}
                          </span>
                        </div>
                      </TableCell>
                    )}

                    <TableCell>
                      <div className="font-medium text-foreground">{log.workItemName || "-"}</div>
                      {(log.spkNumber || log.contractorName) && (
                        <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                          {log.spkNumber ? `${log.spkNumber} - ` : ""}
                          {log.contractorName || ""}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="max-w-[260px]">
                      <div className="text-foreground line-clamp-2">{log.activity || "-"}</div>
                      {log.notes && (
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          Catatan: {log.notes}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="font-mono whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {log.actualVolume !== undefined ? `${log.actualVolume} ${log.unit || ""}` : "-"}
                      </div>
                      {log.cumulativeVolume !== undefined && (
                        <div className="text-[10px] text-muted-foreground">
                          Kum: {log.cumulativeVolume}
                          {log.targetVolume ? ` / ${log.targetVolume}` : ""} {log.unit || ""}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[96px]">
                        <Progress value={log.progressPercent} className="h-2 flex-1" />
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {log.progressPercent}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <WeatherBadge weather={log.weather} />
                        {log.manpower ? (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {log.manpower} TK
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {log.createdBy || "-"}
                    </TableCell>

                    <TableCell>
                      {log.photoUrl || log.photoName ? (
                        <AttachmentPreview
                          filename={log.photoName || log.photoUrl}
                          fileUrl={
                            log.photoUrl &&
                            (log.photoUrl.startsWith("/") || log.photoUrl.startsWith("http"))
                              ? log.photoUrl
                              : undefined
                          }
                          title="Dokumentasi Progres Harian"
                        />
                      ) : (
                        <span className="text-muted-foreground text-[11px]">-</span>
                      )}
                    </TableCell>

                    {showProjectColumn && (
                      <TableCell className="text-right pr-4">
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs px-2.5 gap-1">
                          <Link href={`/workspace/${log.projectId}/execution?tab=progress`}>
                            <span>Buka</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                          </Link>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[190px]">
                  <button
                    type="button"
                    onClick={() => toggleWeeklySort("endDate")}
                    className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    <span>Periode &amp; Rentang</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </TableHead>
                {showProjectColumn && (
                  <TableHead className="min-w-[190px]">
                    <button
                      type="button"
                      onClick={() => toggleWeeklySort("project")}
                      className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                    >
                      <span>Proyek</span>
                      <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </TableHead>
                )}
                <TableHead className="min-w-[170px]">
                  <button
                    type="button"
                    onClick={() => toggleWeeklySort("workItem")}
                    className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    <span>Item Pekerjaan WBS</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="text-right w-[100px]">Rencana (%)</TableHead>
                <TableHead className="text-right w-[115px]">
                  <button
                    type="button"
                    onClick={() => toggleWeeklySort("actualProgress")}
                    className="inline-flex items-center justify-end gap-1 hover:text-foreground font-semibold ml-auto"
                  >
                    <span>Realisasi (%)</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="text-right w-[125px]">
                  <button
                    type="button"
                    onClick={() => toggleWeeklySort("variance")}
                    className="inline-flex items-center justify-end gap-1 hover:text-foreground font-semibold ml-auto"
                  >
                    <span>Deviasi</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="text-right w-[95px]">Capaian</TableHead>
                <TableHead className="min-w-[180px]">Pencatat &amp; Catatan</TableHead>
                <TableHead className="w-[120px]">Laporan</TableHead>
                {showProjectColumn && <TableHead className="text-right w-[90px] pr-4">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedWeekly.map((wp) => {
                const proj = projectById.get(wp.projectId);
                const isBehind = wp.variance < 0;
                return (
                  <TableRow key={wp.id} className={cn("text-xs hover:bg-muted/30", rowHeightClass)}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{wp.period}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {formatIDDate(wp.startDate)} s/d {formatIDDate(wp.endDate)}
                      </div>
                    </TableCell>

                    {showProjectColumn && (
                      <TableCell>
                        <div className="flex flex-col">
                          <Link
                            href={`/workspace/${wp.projectId}/execution?tab=progress`}
                            className="font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            {proj?.code || "-"}
                          </Link>
                          <span className="text-[11px] text-foreground line-clamp-1">
                            {proj?.name || "Proyek"}
                          </span>
                        </div>
                      </TableCell>
                    )}

                    <TableCell>
                      <div className="font-medium text-foreground">{wp.workItemName || "-"}</div>
                      {(wp.spkNumber || wp.contractorName) && (
                        <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                          {wp.spkNumber ? `${wp.spkNumber} - ` : ""}
                          {wp.contractorName || ""}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-right">{wp.plannedProgress}%</TableCell>

                    <TableCell className="font-mono font-bold text-right text-emerald-700 dark:text-emerald-400">
                      {wp.actualProgress}%
                    </TableCell>

                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-mono font-semibold text-[11px] px-2 py-0.5 rounded border",
                          isBehind
                            ? "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800"
                            : "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800"
                        )}
                      >
                        {isBehind ? (
                          <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                        )}
                        <span>{wp.variance > 0 ? `+${wp.variance}%` : `${wp.variance}%`}</span>
                      </span>
                    </TableCell>

                    <TableCell className="font-mono text-right text-muted-foreground">
                      {wp.achievement}%
                    </TableCell>

                    <TableCell className="max-w-[240px]">
                      <div className="font-medium text-foreground">{wp.createdBy || "-"}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {wp.notes || "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      {wp.reportName || wp.photoUrl ? (
                        <AttachmentPreview
                          filename={wp.reportName || wp.photoUrl}
                          fileUrl={
                            wp.photoUrl &&
                            (wp.photoUrl.startsWith("/") || wp.photoUrl.startsWith("http"))
                              ? wp.photoUrl
                              : undefined
                          }
                          title="Laporan Evaluasi Mingguan"
                        />
                      ) : (
                        <span className="text-muted-foreground text-[11px]">-</span>
                      )}
                    </TableCell>

                    {showProjectColumn && (
                      <TableCell className="text-right pr-4">
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs px-2.5 gap-1">
                          <Link href={`/workspace/${wp.projectId}/execution?tab=progress`}>
                            <span>Buka</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                          </Link>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Bar */}
      {!isLoading && !loadError && activeTotal > 0 && (
        <div className="p-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-muted-foreground">
          <div>
            Menampilkan{" "}
            <span className="font-semibold text-foreground">
              {(safePage - 1) * pageSize + 1}
            </span>{" "}
            hingga{" "}
            <span className="font-semibold text-foreground">
              {Math.min(safePage * pageSize, activeTotal)}
            </span>{" "}
            dari <span className="font-semibold text-foreground">{activeTotal}</span>{" "}
            {activePeriodTab === "DAILY" ? "laporan harian" : "laporan mingguan"}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Halaman sebelumnya"
              className="h-9 w-9 sm:h-8 sm:w-8"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <span className="text-xs font-medium px-2">
              Halaman {safePage} dari {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Halaman berikutnya"
              className="h-9 w-9 sm:h-8 sm:w-8"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
