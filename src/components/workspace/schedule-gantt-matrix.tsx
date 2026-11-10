"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Calendar,
  Clock,
  Layers,
  ChevronDown,
  Filter,
  Check,
  MapPin,
  Info,
  Maximize2,
  CalendarCheck,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Project, ScheduleGanttGroup, ScheduleGanttTask, ScheduleGanttCell, WorkItem } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduleGanttMatrixProps {
  project: Project;
  onUpdateSchedule?: (updatedGroups: ScheduleGanttGroup[]) => void;
}

export interface WeekColumn {
  index: number;
  key: string; // e.g. "W1", "W2"
  label: string; // "W1"
  dateLabel: string; // e.g. "01/08"
  startDate: Date;
  endDate: Date;
  isCurrentWeek: boolean;
}

/**
 * Fallback generator: Converts project.workItems into structured Gantt groups and cells
 * when project.scheduleMatrix is not explicitly configured.
 */
function generateFallbackScheduleMatrix(
  project: Project,
  weeks: WeekColumn[],
  today: Date
): ScheduleGanttGroup[] {
  if (!project.workItems || project.workItems.length === 0) return [];

  const phaseMeta: Record<string, { number: number; title: string }> = {
    Tender: { number: 1, title: "Pekerjaan Persiapan & Pengadaan" },
    "Physical Execution": { number: 2, title: "Pelaksanaan Pekerjaan Fisik" },
    "Supporting Materials": { number: 3, title: "Pengadaan Material Penunjang" },
  };

  const groupedMap = new Map<string, WorkItem[]>();

  project.workItems.forEach((wi) => {
    const phaseKey = wi.phase || "Physical Execution";
    if (!groupedMap.has(phaseKey)) {
      groupedMap.set(phaseKey, []);
    }
    groupedMap.get(phaseKey)!.push(wi);
  });

  const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
  const result: ScheduleGanttGroup[] = [];
  let groupCounter = 1;

  groupedMap.forEach((items, phaseKey) => {
    const meta = phaseMeta[phaseKey] || {
      number: groupCounter,
      title: phaseKey,
    };

    const tasks: ScheduleGanttTask[] = items.map((item, itemIdx) => {
      const code = alphabet[itemIdx % alphabet.length];
      const startD = new Date(item.startDate);
      const endD = new Date(item.endDate);

      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const formatDisplayDate = (d: Date) => {
        if (isNaN(d.getTime())) return "-";
        return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}`;
      };

      const cells: Record<string, ScheduleGanttCell> = {};

      weeks.forEach((w) => {
        // Overlap test
        const overlaps = startD <= w.endDate && endD >= w.startDate;
        if (!overlaps) return;

        const isTaskEndWeek = endD >= w.startDate && endD <= w.endDate;
        const isPastWeek = w.endDate < today;
        const isCurrentWeek = w.isCurrentWeek;

        let type: ScheduleGanttCell["type"] = "plan";
        let symbol: ScheduleGanttCell["symbol"] = null;

        const isPastBaseline = w.startDate > new Date(project.baselineEndDate);
        if (isPastBaseline) {
          type = isCurrentWeek ? "this-week-revised" : "revised";
        } else if (isCurrentWeek && item.status === "In Progress") {
          type = "this-week-revised";
        }

        if (item.status === "Completed") {
          symbol = isTaskEndWeek ? "✓" : "#";
        } else if (item.status === "In Progress") {
          if (isPastWeek || isCurrentWeek) {
            symbol = "#";
          }
        }

        cells[w.key] = {
          type,
          symbol,
          note: item.notes,
        };
      });

      return {
        id: `gen-${item.id}`,
        code,
        name: item.name,
        planStartDate: formatDisplayDate(startD),
        planEndDate: formatDisplayDate(endD),
        status: item.status,
        cells,
      };
    });

    result.push({
      id: `gen-grp-${meta.number}`,
      number: meta.number,
      title: meta.title,
      tasks,
    });

    groupCounter++;
  });

  return result.sort((a, b) => a.number - b.number);
}

export function ScheduleGanttMatrix({
  project,
  onUpdateSchedule,
}: ScheduleGanttMatrixProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [editingTask, setEditingTask] = useState<{
    groupIndex: number;
    task: ScheduleGanttTask;
    weekKey?: string;
  } | null>(null);

  // Form states for quick update dialog
  const [cellType, setCellType] = useState<"plan" | "revised" | "extended-revised" | "this-week-revised" | "empty">("revised");
  const [cellSymbol, setCellSymbol] = useState<"none" | "#" | "✓">("none");
  const [cellNote, setCellNote] = useState<string>("");

  // System current date (2026-10-26 based on workspace runtime)
  const today = useMemo(() => new Date("2026-10-26T00:00:00"), []);

  // 1. Calculate dynamic week columns starting exactly from project baselineStartDate
  const weeks = useMemo<WeekColumn[]>(() => {
    const start = new Date(project.baselineStartDate || "2026-08-01T00:00:00");
    const end = new Date(project.targetEndDate || "2026-11-20T00:00:00");

    const result: WeekColumn[] = [];
    let currentStart = new Date(start);
    let index = 1;

    // Minimum 16 weeks or until target end date
    while (currentStart <= end || index <= 16) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 6);

      const day = String(currentStart.getDate()).padStart(2, "0");
      const month = String(currentStart.getMonth() + 1).padStart(2, "0");
      const dateLabel = `${day}/${month}`;

      // Check if today falls in this week
      const isCurrentWeek = today >= currentStart && today <= currentEnd;

      result.push({
        index,
        key: `W${index}`,
        label: `W${index}`,
        dateLabel,
        startDate: new Date(currentStart),
        endDate: currentEnd,
        isCurrentWeek,
      });

      // Advance by 7 days
      currentStart.setDate(currentStart.getDate() + 7);
      index++;

      // Safety limit to avoid infinite loop
      if (index > 40) break;
    }

    return result;
  }, [project.baselineStartDate, project.targetEndDate, today]);

  // Find index of current week (W13)
  const currentWeek = useMemo(() => {
    return weeks.find((w) => w.isCurrentWeek) || weeks[12] || weeks[0];
  }, [weeks]);

  // Groups data: uses custom scheduleMatrix or auto-generated from project.workItems
  const groups = useMemo<ScheduleGanttGroup[]>(() => {
    if (project.scheduleMatrix && project.scheduleMatrix.length > 0) {
      return project.scheduleMatrix;
    }
    // Fallback: auto-generate from project.workItems
    return generateFallbackScheduleMatrix(project, weeks, today);
  }, [project, weeks, today]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (selectedGroupFilter === "all") return groups;
    return groups.filter((g) => g.id === selectedGroupFilter);
  }, [groups, selectedGroupFilter]);

  // Auto scroll to current week
  const handleScrollToCurrentWeek = () => {
    if (!tableContainerRef.current) return;
    const currentWeekEl = tableContainerRef.current.querySelector(
      `[data-week-key="${currentWeek?.key}"]`
    );
    if (currentWeekEl) {
      currentWeekEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    } else {
      // Fallback scroll proportion
      const totalWidth = tableContainerRef.current.scrollWidth;
      const targetPos = (totalWidth * 12) / weeks.length;
      tableContainerRef.current.scrollTo({
        left: targetPos,
        behavior: "smooth",
      });
    }
  };

  // Open cell update dialog
  const handleCellClick = (
    groupIndex: number,
    task: ScheduleGanttTask,
    weekKey: string
  ) => {
    const existing = task.cells[weekKey];
    setEditingTask({ groupIndex, task, weekKey });

    const targetWeek = weeks.find((w) => w.key === weekKey);
    const isCurrent = targetWeek?.isCurrentWeek;

    if (!existing || existing.type === "empty") {
      // Secara default perubahan jadwal warna Kuning (Revised Target) atau Oranye bila minggu berjalan
      setCellType(isCurrent ? "this-week-revised" : "revised");
      setCellSymbol("#");
      setCellNote("");
    } else {
      setCellType(existing.type);
      setCellSymbol(existing.symbol === "#" ? "#" : existing.symbol === "✓" ? "✓" : "none");
      setCellNote(existing.note || "");
    }
  };

  // Save cell updates
  const handleSaveCell = () => {
    if (!editingTask || !editingTask.weekKey) return;
    const { groupIndex, task, weekKey } = editingTask;

    const newCells = { ...task.cells };
    if (cellType === "empty" && cellSymbol === "none") {
      delete newCells[weekKey];
    } else {
      newCells[weekKey] = {
        type: cellType,
        symbol: cellSymbol === "none" ? null : cellSymbol,
        note: cellNote.trim() || undefined,
      };
    }

    const updatedGroups = groups.map((grp, gIdx) => {
      if (gIdx !== groupIndex) return grp;
      return {
        ...grp,
        tasks: grp.tasks.map((t) =>
          t.id === task.id ? { ...t, cells: newCells } : t
        ),
      };
    });

    if (onUpdateSchedule) {
      onUpdateSchedule(updatedGroups);
    }
    setEditingTask(null);
    toast.success(`Status ${task.code}. ${task.name} pada ${weekKey} berhasil diperbarui.`);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="shadow-xs border-slate-300 dark:border-slate-800 overflow-hidden">
        {/* Header toolbar */}
        <CardHeader className="p-3.5 border-b bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Jadwal Pekerjaan & Timeline Matrix (Gantt Chart)
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 font-mono py-0"
                >
                  Start: {weeks[0]?.dateLabel}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                W1 dihitung mulai start proyek ({project.baselineStartDate}) dengan interval 7 hari per kolom. Garis merah menandai minggu berjalan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter by Category */}
            <SearchableSelect
              value={selectedGroupFilter}
              onValueChange={setSelectedGroupFilter}
              placeholder="Semua Kategori"
              searchPlaceholder="Cari kategori..."
              triggerClassName="h-8 text-xs w-[160px] bg-background"
              options={[
                { value: "all", label: `Semua Kategori (${groups.length})` },
                ...groups.map((g) => ({
                  value: g.id,
                  label: `${g.number}. ${g.title}`,
                })),
              ]}
            />

            {/* Jump to Today Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleScrollToCurrentWeek}
              className="h-8 text-xs gap-1.5 border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>Fokus Minggu Ini ({currentWeek.label})</span>
            </Button>
          </div>
        </CardHeader>

        {/* Matrix Table Container with smooth horizontal scrolling */}
        <div
          ref={tableContainerRef}
          className="relative overflow-x-auto max-h-[640px] border-b select-none scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
        >
          <table className="w-full border-collapse text-xs text-left">
            {/* Table Header Structure: 3-tier matching reference */}
            <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-b-2 border-slate-400 dark:border-slate-700">
              {/* Row 1: Top Titles */}
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <th
                  rowSpan={3}
                  className="sticky left-0 z-40 bg-slate-100 dark:bg-slate-900 px-2 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700 w-12 min-w-12 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]"
                >
                  No.
                </th>
                <th
                  rowSpan={3}
                  className="sticky left-12 z-40 bg-slate-100 dark:bg-slate-900 px-3 py-2 text-left font-bold border-r border-slate-300 dark:border-slate-700 min-w-[280px] max-w-[340px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]"
                >
                  Job Item
                </th>
                <th
                  colSpan={2}
                  className="px-2 py-1 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                >
                  Plan
                </th>
                <th
                  colSpan={weeks.length}
                  className="px-2 py-1 text-center font-bold bg-slate-100 dark:bg-slate-800 tracking-wider uppercase text-[11px]"
                >
                  Timeline
                </th>
              </tr>

              {/* Row 2: W1, W2, ... WN */}
              <tr className="border-b border-slate-200 dark:border-slate-750 text-[11px]">
                {/* Start & End labels will be placed in Row 3, but row 2&3 are sub-headers */}
                <th
                  colSpan={2}
                  className="px-1 py-0.5 text-center text-[10px] text-muted-foreground border-r border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-850"
                >
                  Jadwal Kontrak
                </th>
                {weeks.map((w) => {
                  const isCurrent = w.isCurrentWeek;
                  return (
                    <th
                      key={w.key}
                      data-week-key={w.key}
                      className={cn(
                        "w-11 min-w-11 max-w-11 px-0.5 py-1 text-center font-bold border-r border-slate-200 dark:border-slate-750 transition-colors",
                        isCurrent
                          ? "bg-rose-100/90 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-r-2 border-r-rose-600"
                          : "bg-slate-50 dark:bg-slate-900"
                      )}
                    >
                      <span className="block text-xs font-mono">{w.label}</span>
                    </th>
                  );
                })}
              </tr>

              {/* Row 3: Dates & Sub-columns */}
              <tr className="text-[10px] font-mono border-b-2 border-slate-400 dark:border-slate-700">
                <th className="px-2 py-1 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-750 w-16 min-w-16">
                  Start
                </th>
                <th className="px-2 py-1 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700 w-16 min-w-16">
                  End
                </th>
                {weeks.map((w) => {
                  const isCurrent = w.isCurrentWeek;
                  return (
                    <th
                      key={`date-${w.key}`}
                      className={cn(
                        "w-11 min-w-11 max-w-11 px-0.5 py-1 text-center font-medium border-r border-slate-200 dark:border-slate-750 text-[10px]",
                        isCurrent
                          ? "bg-rose-200/90 dark:bg-rose-900/60 text-rose-950 dark:text-rose-100 font-bold border-r-2 border-r-rose-600"
                          : "bg-slate-100/60 dark:bg-slate-850 text-muted-foreground"
                      )}
                    >
                      {w.dateLabel}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + weeks.length}
                    className="py-12 text-center text-xs text-muted-foreground"
                  >
                    Belum ada item jadwal pekerjaan untuk proyek ini. Tambahkan Work Item terlebih dahulu di tab Work Items.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group, groupIdx) => (
                  <React.Fragment key={group.id}>
                  {/* Category Group Header Row (Light Green strip matching reference #e2efda) */}
                  <tr className="border-y border-emerald-300 dark:border-emerald-800 bg-[#e2efda] dark:bg-emerald-950/50 text-[#1f4e1f] dark:text-emerald-200">
                    <td
                      colSpan={4 + weeks.length}
                      className="sticky left-0 z-20 px-3 py-1.5 font-bold text-xs tracking-wide"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        <span>
                          {group.number}. {group.title}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Task Items under this category */}
                  {group.tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Code 'a', 'b', 'c' (Sticky Col 1) */}
                      <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 px-2 py-2 text-center font-medium text-muted-foreground border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        {task.code}
                      </td>

                      {/* Job Item Name (Sticky Col 2) */}
                      <td className="sticky left-12 z-20 bg-white dark:bg-slate-900 px-3 py-2 text-left font-medium text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 min-w-[280px] max-w-[340px] truncate shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate" title={task.name}>
                            {task.name}
                          </span>
                        </div>
                      </td>

                      {/* Plan Start Date */}
                      <td className="px-2 py-2 text-center font-mono text-[11px] text-muted-foreground border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                        {task.planStartDate}
                      </td>

                      {/* Plan End Date */}
                      <td className="px-2 py-2 text-center font-mono text-[11px] text-muted-foreground border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {task.planEndDate}
                      </td>

                      {/* Timeline Cells W1..W16 */}
                      {weeks.map((w) => {
                        const cell = task.cells[w.key];
                        const isCurrentWeek = w.isCurrentWeek;

                        // Semantic cell styling (Full-Bleed Grid)
                        let cellBg = "bg-white dark:bg-slate-900";
                        let textColor = "text-slate-900 dark:text-slate-100";
                        let borderExtra = "";

                        if (cell?.type === "plan") {
                          // Gray box (Plan Baseline)
                          cellBg = "bg-slate-300 dark:bg-slate-600";
                          textColor = "text-slate-900 dark:text-slate-100 font-bold";
                        } else if (cell?.type === "revised") {
                          // Yellow box (Revised Target)
                          cellBg = "bg-yellow-300 dark:bg-yellow-400";
                          textColor = "text-yellow-950 font-bold";
                        } else if (cell?.type === "extended-revised" || cell?.type === "this-week-revised") {
                          // Amber / Orange (Revisi Lanjutan - setelah Kuning)
                          cellBg = "bg-amber-400 dark:bg-amber-500";
                          textColor = "text-amber-950 font-extrabold";
                        }

                        // Prominent Red Line on current week boundary
                        if (isCurrentWeek) {
                          borderExtra += " border-r-2 border-r-rose-600";
                        }

                        return (
                          <td
                            key={w.key}
                            onClick={() => handleCellClick(groupIdx, task, w.key)}
                            className={cn(
                              "w-11 min-w-11 max-w-11 h-8 p-0 text-center border-r border-b border-slate-300 dark:border-slate-700 relative cursor-pointer select-none transition-colors",
                              cellBg,
                              borderExtra
                            )}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "w-full h-full min-h-8 flex items-center justify-center transition-colors hover:brightness-95 dark:hover:brightness-110",
                                    textColor
                                  )}
                                >
                                  {cell?.symbol === "#" && (
                                    <span className="font-bold text-xs select-none">#</span>
                                  )}
                                  {cell?.symbol === "✓" && (
                                    <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-950 dark:text-emerald-950" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs space-y-1">
                                <div className="font-bold text-foreground">
                                  {task.code}. {task.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono">
                                  <span>{w.label}</span>
                                  <span>•</span>
                                  <span>
                                    {w.startDate.toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                    })}{" "}
                                    -{" "}
                                    {w.endDate.toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                                <div className="text-[11px] pt-0.5">
                                  <span className="font-semibold">Status: </span>
                                  {cell?.type === "plan" && "Rencana Awal (Plan Baseline)"}
                                  {cell?.type === "revised" && "Target Revisi (Addendum)"}
                                  {cell?.type === "this-week-revised" && "Target Revisi Minggu Berjalan (This Week)"}
                                  {!cell?.type || cell.type === "empty" ? "Tidak ada jadwal" : ""}
                                </div>
                                {cell?.symbol && (
                                  <div className="text-[11px]">
                                    <span className="font-semibold">Aktivitas: </span>
                                    {cell.symbol === "#" && "Sedang Berjalan (In Progress)"}
                                    {cell.symbol === "✓" && "Selesai (Completed)"}
                                  </div>
                                )}
                                {cell?.note && (
                                  <div className="text-[10px] text-amber-700 dark:text-amber-300 italic pt-0.5 border-t border-border mt-1">
                                    Catatan: {cell.note}
                                  </div>
                                )}
                                <div className="text-[9px] text-muted-foreground pt-1 border-t border-border mt-1">
                                  Klik untuk mengubah status sel ini
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Legend Bar (Exact match to reference image) */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium">
            {/* Plan */}
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none bg-slate-300 dark:bg-slate-600 border border-slate-400 dark:border-slate-500 inline-block" />
              <span className="text-foreground">Plan</span>
            </div>

            {/* Revised Target */}
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none bg-yellow-300 dark:bg-yellow-400 border border-yellow-400 dark:border-yellow-500 inline-block" />
              <span className="text-foreground">Revised Target</span>
            </div>

            {/* Revisi Lanjutan (Orange) */}
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none bg-amber-400 dark:bg-amber-500 border border-amber-500 dark:border-amber-600 inline-block" />
              <span className="text-foreground">Revisi Lanjutan (Setelah Kuning)</span>
            </div>

            {/* # Progress */}
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                #
              </span>
              <span className="text-foreground">Progress</span>
            </div>

            {/* Completed */}
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span className="text-foreground">Completed</span>
            </div>

            {/* Red Line Marker */}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-5 bg-rose-600 rounded-none inline-block" />
              <span className="text-rose-700 dark:text-rose-400 font-semibold">
                Posisi Hari Ini ({currentWeek.label} - {currentWeek.dateLabel})
              </span>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Klik pada sel jadwal untuk mengupdate progres secara interaktif</span>
          </div>
        </div>

        {/* Quick Cell Edit Dialog */}
        {editingTask && (
          <Dialog
            open={!!editingTask}
            onOpenChange={(open) => !open && setEditingTask(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-600" />
                  Update Status Timeline: {editingTask.weekKey}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {editingTask.task.code}. {editingTask.task.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Cell Type (Color) */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Tipe Target / Warna Sel:</label>
                  <SearchableSelect
                    value={cellType}
                    onValueChange={(val: any) => setCellType(val)}
                    placeholder="Pilih Tipe Warna..."
                    searchPlaceholder="Cari tipe sel..."
                    triggerClassName="h-8 text-xs"
                    options={[
                      { value: "revised", label: "Revised Target (Kuning - Target Addendum 1)" },
                      { value: "extended-revised", label: "Revisi Lanjutan (Orange - Setelah Kuning)" },
                      { value: "plan", label: "Plan (Abu-abu - Jadwal Baseline Awal)" },
                      { value: "empty", label: "Kosong (Hapus Jadwal)" },
                    ]}
                  />
                </div>

                {/* Progress Symbol */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Simbol Kemajuan (Progress):</label>
                  <SearchableSelect
                    value={cellSymbol}
                    onValueChange={(val: any) => setCellSymbol(val)}
                    placeholder="Pilih Simbol..."
                    searchPlaceholder="Cari simbol..."
                    triggerClassName="h-8 text-xs"
                    options={[
                      { value: "none", label: "Tanpa Simbol (Hanya Blok Warna)" },
                      { value: "#", label: "# (Progress - Sedang Dikerjakan)" },
                      { value: "✓", label: "[✓] Selesai (Completed - Pekerjaan Selesai)" },
                    ]}
                  />
                </div>

                {/* Cell Note */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Catatan / Keterangan Lapangan:</label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Pengecoran tertunda curah hujan, dialihkan ke perakitan tulangan..."
                    value={cellNote}
                    onChange={(e) => setCellNote(e.target.value)}
                    className="text-xs resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingTask(null)}
                  className="text-xs h-8"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveCell}
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </TooltipProvider>
  );
}
