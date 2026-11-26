"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Check,
  MapPin,
  Info,
  CalendarCheck,
  Edit2,
  RotateCcw,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  DailyProgressRecord,
  GoodsHandover,
  GoodsReceipt,
  Project,
  PurchaseOrder,
  SPKContract,
  ScheduleGanttCell,
  ScheduleGanttGroup,
  ScheduleGanttTask,
  WeeklyProgressRecord,
} from "@/types";
import {
  buildMergedScheduleMatrix,
  calculateDynamicWeekColumns,
  groupWeeksByMonth,
  parseLocalDate,
} from "@/lib/gantt-matrix-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduleGanttMatrixProps {
  project: Project;
  dailyProgress?: DailyProgressRecord[];
  weeklyProgress?: WeeklyProgressRecord[];
  pos?: PurchaseOrder[];
  grs?: GoodsReceipt[];
  goodsHandovers?: GoodsHandover[];
  spkContracts?: SPKContract[];
  canEdit?: boolean;
  onGoToWorkItems?: () => void;
  onUpdateSchedule?: (updatedGroups: ScheduleGanttGroup[]) => Promise<boolean> | void;
}

export function ScheduleGanttMatrix({
  project,
  dailyProgress = [],
  weeklyProgress = [],
  pos = [],
  grs = [],
  goodsHandovers = [],
  spkContracts = [],
  canEdit = false,
  onGoToWorkItems,
  onUpdateSchedule,
}: ScheduleGanttMatrixProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [isSavingCell, setIsSavingCell] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    groupId: string;
    task: ScheduleGanttTask;
    weekKey: string;
    isManual: boolean;
  } | null>(null);

  const [cellType, setCellType] = useState<
    "plan" | "revised" | "extended-revised" | "this-week-revised" | "empty"
  >("revised");
  const [cellSymbol, setCellSymbol] = useState<"none" | "#" | "DONE">("none");
  const [cellNote, setCellNote] = useState<string>("");

  const today = useMemo(() => parseLocalDate(new Date()), []);

  const extraRealizationDates = useMemo(() => {
    const dates: (string | undefined)[] = [];
    for (const dp of dailyProgress) {
      if (dp.projectId === project.id) dates.push(dp.date);
    }
    for (const wp of weeklyProgress) {
      if (wp.projectId === project.id) {
        dates.push(wp.startDate, wp.endDate);
      }
    }
    const activeProjectPos = pos.filter(
      (p) => p.projectId === project.id && !p.deletedAt && p.status !== "Cancelled"
    );
    const activePoIds = new Set(activeProjectPos.map((p) => p.id));
    for (const po of activeProjectPos) {
      if (po.status === "Released" || po.status === "Closed" || po.receiptProgressPercent > 0) {
        dates.push(po.releaseDate || po.poDate);
      }
    }
    for (const gr of grs) {
      if (activePoIds.has(gr.poId)) dates.push(gr.receiptDate);
    }
    for (const gh of goodsHandovers) {
      if (gh.status === "COMPLETED" && (activePoIds.has(gh.poId) || gh.projectId === project.id)) {
        dates.push(gh.handoverDate);
      }
    }
    return dates;
  }, [project.id, dailyProgress, weeklyProgress, pos, grs, goodsHandovers]);

  const weeks = useMemo(
    () => calculateDynamicWeekColumns(project, today, extraRealizationDates),
    [project, today, extraRealizationDates]
  );

  const monthSpans = useMemo(() => groupWeeksByMonth(weeks), [weeks]);

  const currentWeek = useMemo(() => {
    return weeks.find((w) => w.isCurrentWeek) || weeks[0];
  }, [weeks]);

  const groups = useMemo<ScheduleGanttGroup[]>(
    () =>
      buildMergedScheduleMatrix({
        project,
        weeks,
        today,
        dailyProgress,
        weeklyProgress,
        pos,
        grs,
        goodsHandovers,
        spkContracts,
      }),
    [project, weeks, today, dailyProgress, weeklyProgress, pos, grs, goodsHandovers, spkContracts]
  );

  const filteredGroups = useMemo(() => {
    if (selectedGroupFilter === "all") return groups;
    return groups.filter((g) => g.id === selectedGroupFilter);
  }, [groups, selectedGroupFilter]);

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
    }
  };

  const handleCellClick = (
    groupId: string,
    task: ScheduleGanttTask,
    weekKey: string
  ) => {
    if (!canEdit) return;
    const existing = task.cells[weekKey];
    setEditingTask({
      groupId,
      task,
      weekKey,
      isManual: Boolean(existing?.manual),
    });

    const targetWeek = weeks.find((w) => w.key === weekKey);
    const isCurrent = targetWeek?.isCurrentWeek;

    if (!existing || existing.type === "empty") {
      setCellType(isCurrent ? "revised" : "plan");
      setCellSymbol("#");
      setCellNote("");
    } else {
      setCellType(existing.type);
      setCellSymbol(
        existing.symbol === "#" ? "#" : existing.symbol === "DONE" ? "DONE" : "none"
      );
      setCellNote(existing.note || "");
    }
  };

  const persistGroups = async (updatedGroups: ScheduleGanttGroup[], successMsg: string) => {
    if (!onUpdateSchedule) {
      setEditingTask(null);
      return;
    }
    // Hanya simpan sel yang diubah manual agar sel otomatis selalu tersinkronisasi dinamis
    const manualOnlyGroups: ScheduleGanttGroup[] = updatedGroups.map((grp) => ({
      ...grp,
      tasks: grp.tasks.map((t) => {
        const manualCells: Record<string, ScheduleGanttCell> = {};
        for (const [wk, c] of Object.entries(t.cells)) {
          if (c?.manual) {
            manualCells[wk] = c;
          }
        }
        return { ...t, cells: manualCells };
      }),
    }));

    setIsSavingCell(true);
    try {
      const result = await onUpdateSchedule(manualOnlyGroups);
      if (result !== false) {
        setEditingTask(null);
        toast.success(successMsg);
      }
    } finally {
      setIsSavingCell(false);
    }
  };

  const handleSaveCell = async () => {
    if (!editingTask) return;
    const { groupId, task, weekKey } = editingTask;

    const newCells = { ...task.cells };
    if (cellType === "empty" && cellSymbol === "none" && !cellNote.trim()) {
      newCells[weekKey] = {
        type: "empty",
        symbol: null,
        manual: true,
      };
    } else {
      newCells[weekKey] = {
        type: cellType,
        symbol: cellSymbol === "none" ? null : cellSymbol,
        note: cellNote.trim() || undefined,
        manual: true,
      };
    }

    const updatedGroups = groups.map((grp) => {
      if (grp.id !== groupId) return grp;
      return {
        ...grp,
        tasks: grp.tasks.map((t) =>
          t.id === task.id ? { ...t, cells: newCells } : t
        ),
      };
    });

    await persistGroups(
      updatedGroups,
      `Status ${task.code}. ${task.name} pada ${weekKey} berhasil diperbarui.`
    );
  };

  const handleResetCellToAuto = async () => {
    if (!editingTask) return;
    const { groupId, task, weekKey } = editingTask;

    const newCells = { ...task.cells };
    delete newCells[weekKey];

    const updatedGroups = groups.map((grp) => {
      if (grp.id !== groupId) return grp;
      return {
        ...grp,
        tasks: grp.tasks.map((t) =>
          t.id === task.id ? { ...t, cells: newCells } : t
        ),
      };
    });

    await persistGroups(
      updatedGroups,
      `Sel ${task.code}. ${task.name} pada ${weekKey} dikembalikan ke sinkronisasi otomatis.`
    );
  };

  const totalTasks = groups.reduce((acc, g) => acc + g.tasks.length, 0);

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="shadow-sm border-slate-300 dark:border-slate-800 overflow-hidden">
        {/* Toolbar Header */}
        <CardHeader className="p-3.5 border-b bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Jadwal Pekerjaan &amp; Matriks Gantt Mingguan
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-mono py-0"
                >
                  {weeks.length} Minggu ({weeks[0]?.dateLabel || "-"})
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Simbol # muncul saat progres mingguan/harian dicatat (atau GR material parsial); tanda centang muncul saat tuntas 100%.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchableSelect
              value={selectedGroupFilter}
              onValueChange={setSelectedGroupFilter}
              placeholder="Semua Kategori"
              searchPlaceholder="Cari kategori..."
              triggerClassName="h-9 text-xs w-[170px] bg-background"
              options={[
                { value: "all", label: `Semua Kategori (${groups.length})` },
                ...groups.map((g) => ({
                  value: g.id,
                  label: `${g.number}. ${g.title}`,
                })),
              ]}
            />

            <Button
              size="sm"
              variant="outline"
              onClick={handleScrollToCurrentWeek}
              className="h-9 text-xs gap-1.5 border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Fokus Minggu Ini ({currentWeek?.label || "-"})</span>
            </Button>
          </div>
        </CardHeader>

        {/* Matrix Table */}
        <div
          ref={tableContainerRef}
          className="relative overflow-x-auto max-h-[640px] border-b select-none"
        >
          <table className="w-full border-collapse text-xs text-left">
            <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-b-2 border-slate-400 dark:border-slate-700">
              {/* Row 1: Kolom Utama & Grouping Bulan */}
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <th
                  rowSpan={3}
                  className="sm:sticky sm:left-0 sm:z-40 bg-slate-100 dark:bg-slate-900 px-2 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700 w-10 min-w-10"
                >
                  No.
                </th>
                <th
                  rowSpan={3}
                  className="sm:sticky sm:left-10 sm:z-40 bg-slate-100 dark:bg-slate-900 px-3 py-2 text-left font-bold border-r border-slate-300 dark:border-slate-700 min-w-[200px] sm:min-w-[250px] max-w-[300px]"
                >
                  Job Item (WBS)
                </th>
                <th
                  rowSpan={3}
                  className="px-2 py-2 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 w-16 min-w-16"
                >
                  Progres
                </th>
                <th
                  colSpan={2}
                  className="px-2 py-1 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                >
                  Plan
                </th>
                {monthSpans.map((ms, idx) => (
                  <th
                    key={`${ms.label}-${idx}`}
                    colSpan={ms.colSpan}
                    className="px-2 py-1 text-center font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[11px] whitespace-nowrap"
                  >
                    {ms.label}
                  </th>
                ))}
              </tr>

              {/* Row 2: Jadwal Kontrak & Label Minggu (W1..WN) */}
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px]">
                <th
                  colSpan={2}
                  className="px-1 py-0.5 text-center text-[10px] text-muted-foreground border-r border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
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
                        "w-11 min-w-11 max-w-11 px-0.5 py-1 text-center font-bold border-r border-slate-200 dark:border-slate-700 transition-colors",
                        isCurrent
                          ? "bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border-r-2 border-r-rose-600"
                          : "bg-slate-50 dark:bg-slate-900"
                      )}
                    >
                      <span className="block text-xs font-mono">{w.label}</span>
                    </th>
                  );
                })}
              </tr>

              {/* Row 3: Start / End & Tanggal Minggu */}
              <tr className="text-[10px] font-mono border-b-2 border-slate-400 dark:border-slate-700">
                <th className="px-2 py-1 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 w-16 min-w-16">
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
                        "w-11 min-w-11 max-w-11 px-0.5 py-1 text-center font-medium border-r border-slate-200 dark:border-slate-700 text-[10px]",
                        isCurrent
                          ? "bg-rose-200 dark:bg-rose-900/70 text-rose-950 dark:text-rose-100 font-bold border-r-2 border-r-rose-600"
                          : "bg-slate-100/80 dark:bg-slate-800/80 text-muted-foreground"
                      )}
                    >
                      {w.dateLabel}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filteredGroups.length === 0 || totalTasks === 0 ? (
                <tr>
                  <td
                    colSpan={5 + weeks.length}
                    className="py-12 px-4 text-center text-xs text-muted-foreground space-y-2"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Layers className="w-7 h-7 text-muted-foreground/60" />
                      <p className="font-semibold text-foreground">
                        Belum ada item pekerjaan WBS untuk ditampilkan pada Gantt Chart
                      </p>
                      <p className="max-w-md text-[11px] text-muted-foreground">
                        Tambahkan komponen pekerjaan beserta tanggal mulai dan selesai pada tab Item Pekerjaan WBS agar jadwal mingguan terbentuk otomatis.
                      </p>
                      {canEdit && onGoToWorkItems && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onGoToWorkItems}
                          className="h-8 text-xs mt-1"
                        >
                          Buka Tab Item Pekerjaan WBS
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <React.Fragment key={group.id}>
                    {/* Header Kategori */}
                    <tr className="border-y border-emerald-300 dark:border-emerald-800 bg-[#e2efda] dark:bg-emerald-950/60 text-[#1f4e1f] dark:text-emerald-200">
                      <td
                        colSpan={2}
                        className="sm:sticky sm:left-0 sm:z-20 bg-[#e2efda] dark:bg-emerald-950/80 px-3 py-1.5 font-bold text-xs tracking-wide border-r border-emerald-300/70 dark:border-emerald-800"
                      >
                        {group.number}. {group.title}
                      </td>
                      <td
                        colSpan={3 + weeks.length}
                        className="bg-[#e2efda] dark:bg-emerald-950/60 px-2 py-1.5"
                      />
                    </tr>

                    {/* Baris Item Pekerjaan */}
                    {group.tasks.map((task) => {
                      const progressVal = task.progress ?? 0;
                      const isDone = task.status === "Completed" || progressVal >= 100;
                      const isRunning = !isDone && task.status === "In Progress";

                      return (
                        <tr
                          key={task.id}
                          className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="sm:sticky sm:left-0 sm:z-20 bg-white dark:bg-slate-900 px-2 py-2 text-center font-medium text-muted-foreground border-r border-slate-200 dark:border-slate-800">
                            {task.code}
                          </td>

                          <td className="sm:sticky sm:left-10 sm:z-20 bg-white dark:bg-slate-900 px-3 py-2 text-left font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 min-w-[200px] sm:min-w-[250px] max-w-[300px]">
                            <div className="truncate font-semibold" title={task.name}>
                              {task.name}
                            </div>
                            {task.sourceHint && (
                              <div
                                className="text-[10px] text-muted-foreground truncate"
                                title={task.sourceHint}
                              >
                                {task.sourceHint}
                              </div>
                            )}
                          </td>

                          {/* Kolom Ringkasan Progres */}
                          <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 font-mono font-bold text-[10px]">
                                <Check className="w-3 h-3 stroke-[2.75]" aria-hidden="true" />
                                <span>{progressVal}%</span>
                              </span>
                            ) : isRunning ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 font-mono font-bold text-[10px]">
                                <span>#</span>
                                <span>{progressVal}%</span>
                              </span>
                            ) : (
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {progressVal}%
                              </span>
                            )}
                          </td>

                          {/* Start */}
                          <td className="px-2 py-2 text-center font-mono text-[11px] text-muted-foreground border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                            {task.planStartDate}
                          </td>

                          {/* End */}
                          <td className="px-2 py-2 text-center font-mono text-[11px] text-muted-foreground border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            {task.planEndDate}
                          </td>

                          {/* Timeline Cells */}
                          {weeks.map((w) => {
                            const cell = task.cells[w.key];
                            const isCurrentWeek = w.isCurrentWeek;
                            const isDoneCell = cell?.symbol === "DONE";
                            const isProgressCell = cell?.symbol === "#";

                            let cellBg = "bg-white dark:bg-slate-900";
                            let textColor = "text-slate-900 dark:text-slate-100";

                            if (cell?.type === "plan") {
                              cellBg = isDoneCell
                                ? "bg-emerald-200 dark:bg-emerald-800"
                                : "bg-slate-300 dark:bg-slate-600";
                              textColor = isDoneCell
                                ? "text-emerald-950 dark:text-emerald-50 font-bold"
                                : "text-slate-950 dark:text-white font-bold";
                            } else if (cell?.type === "revised") {
                              cellBg = "bg-yellow-300 dark:bg-yellow-400";
                              textColor = "text-slate-950 font-bold";
                            } else if (
                              cell?.type === "extended-revised" ||
                              cell?.type === "this-week-revised"
                            ) {
                              cellBg = "bg-amber-400 dark:bg-amber-500";
                              textColor = "text-slate-950 font-extrabold";
                            } else if (isDoneCell) {
                              cellBg = "bg-emerald-100 dark:bg-emerald-900/70";
                              textColor = "text-emerald-950 dark:text-emerald-100 font-bold";
                            } else if (isProgressCell) {
                              cellBg = "bg-amber-50 dark:bg-amber-950/40";
                              textColor = "text-amber-900 dark:text-amber-200 font-bold";
                            }

                            const borderExtra = isCurrentWeek
                              ? "border-r-2 border-r-rose-600"
                              : "";

                            const cellContent = (
                              <>
                                {isProgressCell && (
                                  <span className="font-mono font-bold text-xs select-none">
                                    #
                                  </span>
                                )}
                                {isDoneCell && (
                                  <Check
                                    className="w-4 h-4 stroke-[3]"
                                    aria-hidden="true"
                                  />
                                )}
                              </>
                            );

                            return (
                              <td
                                key={w.key}
                                className={cn(
                                  "w-11 min-w-11 max-w-11 h-9 p-0 text-center border-r border-b border-slate-300 dark:border-slate-700 relative select-none transition-colors",
                                  cellBg,
                                  borderExtra
                                )}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {canEdit ? (
                                      <button
                                        type="button"
                                        onClick={() => handleCellClick(group.id, task, w.key)}
                                        aria-label={`Ubah jadwal ${task.code}. ${task.name} minggu ${w.label}`}
                                        className={cn(
                                          "w-full h-full min-h-9 flex items-center justify-center cursor-pointer transition-colors hover:brightness-95 dark:hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700",
                                          textColor
                                        )}
                                      >
                                        {cellContent}
                                      </button>
                                    ) : (
                                      <div
                                        tabIndex={0}
                                        aria-label={`Detail jadwal ${task.code}. ${task.name} minggu ${w.label}`}
                                        className={cn(
                                          "w-full h-full min-h-9 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700",
                                          textColor
                                        )}
                                      >
                                        {cellContent}
                                      </div>
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs space-y-1">
                                    <div className="font-bold text-foreground">
                                      {task.code}. {task.name}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono">
                                      <span>{w.label}</span>
                                      <span>|</span>
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
                                      <span className="font-semibold">Jadwal: </span>
                                      {cell?.type === "plan" && "Rencana Awal (Plan Baseline)"}
                                      {cell?.type === "revised" && "Target Revisi (Addendum)"}
                                      {(cell?.type === "extended-revised" ||
                                        cell?.type === "this-week-revised") &&
                                        "Revisi Lanjutan (Perpanjangan Tambahan)"}
                                      {(!cell?.type || cell.type === "empty") &&
                                        "Di luar rentang rencana"}
                                    </div>
                                    {cell?.symbol && (
                                      <div className="text-[11px]">
                                        <span className="font-semibold">Status Sel: </span>
                                        {cell.symbol === "#" && "Sedang Berjalan (In Progress)"}
                                        {cell.symbol === "DONE" && "Selesai (Completed)"}
                                        {cell.manual ? " (Edit Manual)" : " (Otomatis)"}
                                      </div>
                                    )}
                                    {task.sourceHint && (
                                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                                        Sumber: {task.sourceHint}
                                      </div>
                                    )}
                                    {cell?.note && (
                                      <div className="text-[10px] text-amber-700 dark:text-amber-300 italic pt-0.5 border-t border-border mt-1">
                                        Catatan: {cell.note}
                                      </div>
                                    )}
                                    {canEdit && (
                                      <div className="text-[10px] text-muted-foreground pt-1 border-t border-border mt-1">
                                        Klik sel untuk menyesuaikan status atau catatan mingguan
                                      </div>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Legend Bar */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-5 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none bg-slate-300 dark:bg-slate-600 border border-slate-400 dark:border-slate-500 inline-block" />
              <span className="text-foreground">Plan</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none bg-yellow-300 dark:bg-yellow-400 border border-yellow-400 dark:border-yellow-500 inline-block" />
              <span className="text-foreground">Revised Target</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none bg-amber-400 dark:bg-amber-500 border border-amber-500 dark:border-amber-600 inline-block" />
              <span className="text-foreground">Revisi Lanjutan</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none border border-slate-400 dark:border-slate-600 bg-slate-300 dark:bg-slate-600 text-slate-950 dark:text-white flex items-center justify-center font-mono font-bold text-xs">
                #
              </span>
              <span className="text-foreground">Sedang Progress</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-6 h-5 rounded-none border border-emerald-500 dark:border-emerald-700 bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-emerald-950 dark:text-emerald-50">
                <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
              </span>
              <span className="text-foreground">Selesai</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-5 bg-rose-600 rounded-none inline-block" />
              <span className="text-rose-700 dark:text-rose-400 font-semibold">
                Minggu Ini ({currentWeek?.label || "-"} : {currentWeek?.dateLabel || "-"})
              </span>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>
              {canEdit
                ? "Klik sel pada tabel untuk menyesuaikan status secara manual"
                : "Mode pantau: hanya PIC atau Admin yang dapat mengubah sel jadwal"}
            </span>
          </div>
        </div>

        {/* Dialog Edit Sel Manual */}
        {editingTask && canEdit && (
          <Dialog
            open={!!editingTask}
            onOpenChange={(open) => !open && !isSavingCell && setEditingTask(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  Sesuaikan Sel Timeline: {editingTask.weekKey}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {editingTask.task.code}. {editingTask.task.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground block">
                    Tipe Target / Warna Sel:
                  </label>
                  <SearchableSelect
                    value={cellType}
                    onValueChange={(val) =>
                      setCellType(
                        val as "plan" | "revised" | "extended-revised" | "this-week-revised" | "empty"
                      )
                    }
                    placeholder="Pilih Tipe Warna..."
                    searchPlaceholder="Cari tipe sel..."
                    triggerClassName="h-9 text-xs"
                    options={[
                      { value: "plan", label: "Plan (Abu-abu - Jadwal Baseline Awal)" },
                      { value: "revised", label: "Revised Target (Kuning - Target Addendum 1)" },
                      {
                        value: "extended-revised",
                        label: "Revisi Lanjutan (Oranye - Addendum Lanjutan)",
                      },
                      { value: "empty", label: "Kosong (Tidak Ada Jadwal)" },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground block">
                    Simbol Kemajuan (Progress):
                  </label>
                  <SearchableSelect
                    value={cellSymbol}
                    onValueChange={(val) => setCellSymbol(val as "none" | "#" | "DONE")}
                    placeholder="Pilih Simbol..."
                    searchPlaceholder="Cari simbol..."
                    triggerClassName="h-9 text-xs"
                    options={[
                      { value: "none", label: "Tanpa Simbol (Hanya Blok Warna)" },
                      { value: "#", label: "# (Sedang Berjalan / In Progress)" },
                      { value: "DONE", label: "Check Mark (Selesai / Completed)" },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground block">
                    Catatan / Keterangan Lapangan:
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Pengecoran tertunda curah hujan, dialihkan ke perakitan tulangan..."
                    value={cellNote}
                    onChange={(e) => setCellNote(e.target.value)}
                    className="text-xs resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
                {editingTask.isManual ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isSavingCell}
                    onClick={() => void handleResetCellToAuto()}
                    className="text-xs h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset ke Otomatis
                  </Button>
                ) : (
                  <span />
                )}

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSavingCell}
                    onClick={() => setEditingTask(null)}
                    className="text-xs h-9"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSavingCell}
                    onClick={() => void handleSaveCell()}
                    className="text-xs h-9 bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    {isSavingCell ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </TooltipProvider>
  );
}
