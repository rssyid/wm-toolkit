"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Project } from "@/types";
import { formatIDDate, cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Tipe Data ──────────────────────────────────────────────────────────────

interface UnifiedGanttProps {
  projects: Project[];
}

type GanttFilter = "All" | "Running" | "Delayed" | "Pending Approval";
type GanttZoom = "Weekly" | "Monthly" | "Quarterly";

interface WeekColumn {
  index: number;
  key: string;         // "W1", "W2", ...
  dateLabel: string;   // "01/08", "08/08", ...
  monthKey: string;    // "2026-08" (untuk grouping)
  monthLabel: string;  // "Agu 2026"
  startDate: Date;
}

interface MonthGroup {
  label: string;
  colSpan: number;
}

interface QuarterGroup {
  label: string;
  colSpan: number;
}

// ─── Helper: Format Nama Bulan Indonesia ────────────────────────────────────

const BULAN_INDO = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatMonthLabel(date: Date): string {
  return `${BULAN_INDO[date.getMonth()]} ${date.getFullYear()}`;
}

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateLabel(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getQuarterLabel(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month < 3) return `Q1 ${year}`;
  if (month < 6) return `Q2 ${year}`;
  if (month < 9) return `Q3 ${year}`;
  return `Q4 ${year}`;
}

// ─── Konstanta ──────────────────────────────────────────────────────────────

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const LABEL_COL_WIDTH = 280;
const COL_MIN_WIDTH_WEEKLY = 52;
const COL_MIN_WIDTH_MONTHLY = 80;
const COL_MIN_WIDTH_QUARTERLY = 100;

// ─── Komponen Utama ─────────────────────────────────────────────────────────

export function UnifiedGantt({ projects }: UnifiedGanttProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [filter, setFilter] = useState<GanttFilter>("All");
  const [zoom, setZoom] = useState<GanttZoom>("Weekly");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ─── Filter Proyek ──────────────────────────────────────────────────────

  const filteredProjects = projects.filter((p) => {
    if (filter === "Running") return p.status === "In Progress";
    if (filter === "Delayed") return p.scheduleVarianceDays > 7;
    if (filter === "Pending Approval") return p.afceStatus === "Pending Approval";
    return true;
  });

  // ─── Kalkulasi Timeline Dinamis ─────────────────────────────────────────

  const { weekColumns, monthGroups, quarterGroups, timelineStartMs, timelineEndMs } = useMemo(() => {
    // Cari range tanggal dari semua proyek
    let earliest = Infinity;
    let latest = -Infinity;

    projects.forEach((p) => {
      const start = new Date(p.baselineStartDate).getTime();
      const baseEnd = new Date(p.baselineEndDate).getTime();
      const targetEnd = new Date(p.targetEndDate).getTime();
      const end = Math.max(baseEnd, targetEnd);

      // Juga cek work items
      p.workItems.forEach((wi) => {
        const wiStart = new Date(wi.startDate).getTime();
        const wiEnd = new Date(wi.endDate).getTime();
        if (wiStart < earliest) earliest = wiStart;
        if (wiEnd > latest) latest = wiEnd;
      });

      if (start < earliest) earliest = start;
      if (end > latest) latest = end;
    });

    // Fallback jika tidak ada proyek
    if (!isFinite(earliest) || !isFinite(latest)) {
      earliest = new Date().getTime();
      latest = earliest + 24 * WEEK_MS;
    }

    // Padding 2 minggu di kedua sisi
    const paddedStart = new Date(earliest - 2 * WEEK_MS);
    // Snap ke awal minggu (Senin)
    paddedStart.setDate(paddedStart.getDate() - paddedStart.getDay() + 1);
    const paddedEnd = new Date(latest + 2 * WEEK_MS);

    // Generate kolom mingguan
    const cols: WeekColumn[] = [];
    let current = new Date(paddedStart);
    let weekIndex = 0;
    while (current <= paddedEnd) {
      cols.push({
        index: weekIndex,
        key: `W${weekIndex + 1}`,
        dateLabel: formatDateLabel(current),
        monthKey: formatMonthKey(current),
        monthLabel: formatMonthLabel(current),
        startDate: new Date(current),
      });
      current = new Date(current.getTime() + WEEK_MS);
      weekIndex++;
    }

    // Group berdasarkan bulan
    const monthMap = new Map<string, { label: string; count: number }>();
    cols.forEach((col) => {
      const existing = monthMap.get(col.monthKey);
      if (existing) {
        existing.count++;
      } else {
        monthMap.set(col.monthKey, { label: col.monthLabel, count: 1 });
      }
    });
    const mGroups: MonthGroup[] = Array.from(monthMap.values()).map((m) => ({
      label: m.label,
      colSpan: m.count,
    }));

    // Group berdasarkan kuartal
    const quarterMap = new Map<string, { label: string; count: number }>();
    cols.forEach((col) => {
      const qLabel = getQuarterLabel(col.startDate);
      const existing = quarterMap.get(qLabel);
      if (existing) {
        existing.count++;
      } else {
        quarterMap.set(qLabel, { label: qLabel, count: 1 });
      }
    });
    const qGroups: QuarterGroup[] = Array.from(quarterMap.values()).map((q) => ({
      label: q.label,
      colSpan: q.count,
    }));

    return {
      weekColumns: cols,
      monthGroups: mGroups,
      quarterGroups: qGroups,
      timelineStartMs: paddedStart.getTime(),
      timelineEndMs: paddedEnd.getTime(),
    };
  }, [projects]);

  // ─── Display Columns per Zoom ───────────────────────────────────────────

  const displayColCount = useMemo(() => {
    if (zoom === "Monthly") return monthGroups.length;
    if (zoom === "Quarterly") return quarterGroups.length;
    return weekColumns.length;
  }, [zoom, weekColumns, monthGroups, quarterGroups]);

  const colMinWidth = zoom === "Quarterly" ? COL_MIN_WIDTH_QUARTERLY : zoom === "Monthly" ? COL_MIN_WIDTH_MONTHLY : COL_MIN_WIDTH_WEEKLY;

  // ─── Today Indicator ───────────────────────────────────────────────────

  const todayPosition = useMemo(() => {
    if (!isMounted) return null;
    const now = new Date().getTime();
    const totalRange = timelineEndMs - timelineStartMs;
    if (totalRange <= 0) return null;
    const pos = ((now - timelineStartMs) / totalRange) * 100;
    if (pos < 0 || pos > 100) return null;
    return Number(pos.toFixed(4));
  }, [isMounted, timelineStartMs, timelineEndMs]);

  // ─── Auto-Scroll ke Hari Ini ────────────────────────────────────────────

  useEffect(() => {
    if (scrollContainerRef.current && todayPosition !== null) {
      const container = scrollContainerRef.current;
      // Tunggu render selesai
      requestAnimationFrame(() => {
        const targetScroll =
          (todayPosition / 100) * container.scrollWidth - container.clientWidth / 2;
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: "smooth",
        });
      });
    }
  }, [todayPosition]);

  // ─── Helper: Hitung Posisi Bar ──────────────────────────────────────────

  const getBarPosition = (startDateStr: string, endDateStr: string) => {
    try {
      const start = new Date(startDateStr).getTime();
      const end = new Date(endDateStr).getTime();
      const totalRange = timelineEndMs - timelineStartMs;
      if (totalRange <= 0) return { left: 0, width: 5 };
      return {
        left: Math.max(0, ((start - timelineStartMs) / totalRange) * 100),
        width: Math.max(1.5, Math.min(100, ((end - start) / totalRange) * 100)),
      };
    } catch {
      return { left: 0, width: 5 };
    }
  };

  // ─── Grid Template ─────────────────────────────────────────────────────

  const gridTemplate = `${LABEL_COL_WIDTH}px repeat(${weekColumns.length}, minmax(${colMinWidth}px, 1fr))`;
  const containerMinWidth = LABEL_COL_WIDTH + weekColumns.length * colMinWidth;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-foreground">
            Unified Multi-Project Gantt Timeline
          </h3>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            ({filteredProjects.length} Proyek ditampilkan)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs">
            {(["All", "Running", "Delayed", "Pending Approval"] as GanttFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                  filter === f
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Zoom Level */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs">
            {(["Weekly", "Monthly", "Quarterly"] as GanttZoom[]).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                  zoom === z
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b bg-muted/10 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3 rounded bg-slate-300 dark:bg-slate-700 inline-block border"></span>
          <span>Jadwal Baseline (Awal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3 rounded bg-amber-400 dark:bg-amber-500 inline-block"></span>
          <span>Minggu Tambahan Revisi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3 rounded bg-emerald-600 inline-flex items-center justify-center text-[9px] text-white font-mono font-bold">
            #
          </span>
          <span>Progress Fisik</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Work Item Tuntas 100%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 bg-rose-500 inline-block"></span>
          <span>Hari Ini</span>
        </div>
      </div>

      {/* Gantt Matrix Grid */}
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <div style={{ minWidth: `${containerMinWidth}px` }}>

          {/* ═══ Header Tier 1: Bulan / Kuartal ═══ */}
          <div
            className="grid border-b bg-muted/50 text-[11px] font-semibold text-muted-foreground"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="p-2 pl-4 border-r flex items-center uppercase tracking-wider text-[10px]">
              Proyek / Item Pekerjaan
            </div>
            {zoom === "Quarterly"
              ? quarterGroups.map((qg, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 text-center border-r bg-muted/60 flex items-center justify-center"
                    style={{ gridColumn: `span ${qg.colSpan}` }}
                  >
                    {qg.label}
                  </div>
                ))
              : monthGroups.map((mg, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 text-center border-r bg-muted/60 flex items-center justify-center"
                    style={{ gridColumn: `span ${mg.colSpan}` }}
                  >
                    {mg.label}
                  </div>
                ))}
          </div>

          {/* ═══ Header Tier 2: Minggu + Tanggal (hanya Weekly & Monthly) ═══ */}
          {zoom !== "Quarterly" && (
            <div
              className="grid border-b bg-muted/30 text-[10px] text-muted-foreground"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <div className="border-r" />
              {weekColumns.map((col) => {
                // Cek apakah minggu ini adalah minggu aktif (hanya setelah mounted di client)
                const isCurrentWeek =
                  isMounted &&
                  Date.now() >= col.startDate.getTime() &&
                  Date.now() < col.startDate.getTime() + WEEK_MS;

                return (
                  <div
                    key={col.key}
                    className={cn(
                      "py-1.5 px-0.5 text-center border-r",
                      isCurrentWeek && "bg-rose-50 dark:bg-rose-950/30 font-semibold text-rose-600 dark:text-rose-400"
                    )}
                  >
                    <div className="font-semibold leading-tight">{col.key}</div>
                    <div className="text-muted-foreground leading-tight">{col.dateLabel}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ Timeline Rows ═══ */}
          <div className="divide-y divide-border/60 relative">
            {/* Today Indicator Line */}
            {todayPosition !== null && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{
                  left: `calc(${LABEL_COL_WIDTH}px + ${todayPosition}% * (100% - ${LABEL_COL_WIDTH}px) / 100)`,
                }}
              >
                {/* Kita pakai approach berbeda: hitung left dari area timeline */}
              </div>
            )}

            {filteredProjects.map((project) => {
              const isExpanded = !!expandedProjects[project.id];
              const hasRevision = project.revisions.length > 0;
              const revisionExtensionWeeks = hasRevision
                ? project.revisions.reduce((acc, r) => acc + r.extendedWeeks, 0)
                : 0;

              // Hitung posisi bar baseline
              const baseBar = getBarPosition(project.baselineStartDate, project.baselineEndDate);

              // Hitung posisi bar termasuk revisi (extend end date)
              const revisionEndDate = hasRevision
                ? new Date(
                    new Date(project.baselineEndDate).getTime() +
                      revisionExtensionWeeks * WEEK_MS
                  ).toISOString()
                : project.baselineEndDate;
              const fullBar = getBarPosition(project.baselineStartDate, revisionEndDate);

              // Proporsi baseline vs revisi dalam full bar
              const baselineRatio = baseBar.width / (fullBar.width || 1);

              return (
                <React.Fragment key={project.id}>
                  {/* ── Project Row ── */}
                  <div
                    className="grid items-center hover:bg-muted/30 transition-colors bg-background font-medium"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    {/* Label kolom */}
                    <div className="pl-3 pr-2 py-2.5 flex items-center gap-1.5 border-r truncate">
                      <button
                        onClick={() => toggleExpand(project.id)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Link
                        href={`/workspace/${project.id}`}
                        className="truncate text-xs font-semibold text-foreground hover:text-emerald-600 transition-colors"
                        title={project.name}
                      >
                        {project.code}: {project.name}
                      </Link>
                    </div>

                    {/* Timeline bar area — spans seluruh kolom minggu */}
                    <div
                      className="relative h-8 flex items-center"
                      style={{ gridColumn: `2 / -1` }}
                    >
                      {/* Background grid lines */}
                      <div className="absolute inset-0 flex">
                        {weekColumns.map((col) => {
                          const isCurrentWeek =
                            isMounted &&
                            Date.now() >= col.startDate.getTime() &&
                            Date.now() < col.startDate.getTime() + WEEK_MS;
                          return (
                            <div
                              key={col.key}
                              className={cn(
                                "flex-1 border-r border-border/30",
                                isCurrentWeek && "bg-rose-50/50 dark:bg-rose-950/20"
                              )}
                            />
                          );
                        })}
                      </div>

                      {/* Today indicator line */}
                      {todayPosition !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none"
                          style={{ left: `${todayPosition}%` }}
                        />
                      )}

                      {/* Gantt Bar */}
                      <TooltipProvider>
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute h-6 rounded-md flex items-center shadow-sm cursor-pointer overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 hover:shadow-md transition-shadow"
                              style={{
                                left: `${fullBar.left}%`,
                                width: `${fullBar.width}%`,
                              }}
                            >
                              {/* Progress fill (hijau) */}
                              <div
                                className="h-full bg-emerald-600 text-[10px] text-white flex items-center justify-start pl-1.5 font-mono font-bold truncate transition-all duration-300"
                                style={{
                                  width: `${Math.min(project.progress, 100) * baselineRatio}%`,
                                }}
                              >
                                {project.progress > 12
                                  ? `${project.progress}%`
                                  : project.progress > 0
                                  ? "#"
                                  : ""}
                              </div>

                              {/* Bagian baseline yang belum progress (abu-abu) — sudah jadi background bar */}

                              {/* Revision segment (kuning/amber) */}
                              {hasRevision && (
                                <div
                                  className="h-full bg-amber-400 dark:bg-amber-500 text-[9px] text-amber-950 font-bold flex items-center justify-center shrink-0 border-l border-amber-300 ml-auto"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (1 - baselineRatio) * 100
                                    )}%`,
                                  }}
                                  title={`Revisi +${revisionExtensionWeeks} minggu`}
                                >
                                  {(1 - baselineRatio) * fullBar.width > 3
                                    ? `+${revisionExtensionWeeks}W`
                                    : ""}
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="p-2.5 max-w-xs text-xs space-y-1">
                            <p className="font-semibold text-foreground">{project.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Lokasi: {project.locationName} &bull; Tipe: {project.projectType}
                            </p>
                            <div className="flex justify-between border-t pt-1 text-[11px]">
                              <span>Baseline:</span>
                              <span className="font-mono">
                                {formatIDDate(project.baselineStartDate)} -{" "}
                                {formatIDDate(project.baselineEndDate)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span>Target Akhir:</span>
                              <span className="font-mono font-semibold text-emerald-600">
                                {formatIDDate(project.targetEndDate)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span>Progress:</span>
                              <span className="font-mono font-bold">{project.progress}%</span>
                            </div>
                            {hasRevision && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1 rounded mt-1">
                                Revisi Terakhir: {project.revisions[0].reason}
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Label progress di luar bar jika bar terlalu kecil */}
                      {project.progress > 0 && fullBar.width < 6 && (
                        <span
                          className="absolute text-[10px] font-mono font-bold text-muted-foreground whitespace-nowrap"
                          style={{ left: `${fullBar.left + fullBar.width + 0.5}%` }}
                        >
                          {project.progress}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Work Items Sub-rows ── */}
                  {isExpanded &&
                    project.workItems.map((wi) => {
                      const wiBar = getBarPosition(wi.startDate, wi.endDate);
                      const isComplete = wi.progress >= 100;

                      return (
                        <div
                          key={wi.id}
                          className="grid items-center bg-muted/10 hover:bg-muted/30 transition-colors text-xs text-muted-foreground"
                          style={{ gridTemplateColumns: gridTemplate }}
                        >
                          <div className="pl-8 pr-2 py-1.5 flex items-center justify-between border-r truncate">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 shrink-0" />
                              <span className="truncate" title={wi.name}>
                                {wi.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <span className="text-[10px] px-1 py-0.5 rounded bg-muted font-mono">
                                {wi.weight}%
                              </span>
                              {isComplete && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                            </div>
                          </div>

                          <div
                            className="relative h-6 flex items-center"
                            style={{ gridColumn: `2 / -1` }}
                          >
                            {/* Background grid lines */}
                            <div className="absolute inset-0 flex">
                              {weekColumns.map((col) => (
                                <div
                                  key={col.key}
                                  className="flex-1 border-r border-border/20"
                                />
                              ))}
                            </div>

                            {/* Today indicator line */}
                            {todayPosition !== null && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-rose-500/50 z-10 pointer-events-none"
                                style={{ left: `${todayPosition}%` }}
                              />
                            )}

                            {/* Work Item Bar */}
                            <TooltipProvider>
                              <Tooltip delayDuration={150}>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute h-4 rounded flex items-center overflow-hidden bg-slate-300 dark:bg-slate-700 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                    style={{
                                      left: `${wiBar.left}%`,
                                      width: `${wiBar.width}%`,
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        "h-full text-[8px] text-white flex items-center font-mono pl-1 transition-all duration-300",
                                        isComplete
                                          ? "bg-emerald-600"
                                          : "bg-emerald-500"
                                      )}
                                      style={{ width: `${wi.progress}%` }}
                                    >
                                      {wi.progress > 20
                                        ? isComplete
                                          ? "✓"
                                          : `${wi.progress}%`
                                        : ""}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs p-2">
                                  <p className="font-semibold">{wi.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    Fase: {wi.phase} &bull; Bobot: {wi.weight}% &bull; Progress:{" "}
                                    {wi.progress}%
                                  </p>
                                  <p className="text-[11px] font-mono mt-1">
                                    {formatIDDate(wi.startDate)} s/d {formatIDDate(wi.endDate)}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
