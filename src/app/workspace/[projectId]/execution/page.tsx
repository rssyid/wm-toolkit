"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  HardHat,
  CloudSun,
  Sun,
  CloudRain,
  Activity,
  Layers,
  AlertTriangle,
  Plus,
  Send,
  CalendarClock,
  ClipboardList,
  Edit2,
  Trash2,
  History,
  MapPin,
  Search,
  RotateCcw,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { EmptyState } from "@/components/shared/empty-state";

import { DailyProgressDialog } from "@/components/progress/daily-progress-dialog";
import { WeeklyProgressDialog } from "@/components/progress/weekly-progress-dialog";
import {
  ProgressLogTables,
  ProgressPeriodTab,
} from "@/components/progress/progress-log-tables";
import { ScheduleGanttMatrix } from "@/components/workspace/schedule-gantt-matrix";
import { ScheduleRevisionDialog } from "@/components/workspace/schedule-revision-dialog";

import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, calculateDaysBetween, cn } from "@/lib/utils";
import { BOQItem, ProcurementType, ScheduleGanttGroup, WorkItem } from "@/types";
import { toast } from "sonner";

function normalizeExecutionTab(raw: string | null): string {
  if (raw === "work-items" || raw === "workitems") return "work-items";
  if (raw === "schedule" || raw === "gantt") return "schedule";
  if (raw === "boq" || raw === "survey-boq") return "boq";
  return "progress";
}

function UnifiedExecutionHubContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params?.projectId as string;
  const tabParam = normalizeExecutionTab(searchParams?.get("tab") ?? null);

  const {
    isLoading,
    loadError,
    refreshFromDatabase,
    projects,
    updateProject,
    dailyProgress,
    weeklyProgress,
    pos,
    goodsHandovers,
    spkContracts,
    tableDensity,
    addDailyProgress,
    addWorkItem,
    updateWorkItem,
    deleteWorkItem,
    addBoqItem,
    deleteBoqItem,
    canEditProjects,
    userProfile,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);

  const [activeTab, setActiveTab] = useState(tabParam);
  const [dailyDialogOpen, setDailyDialogOpen] = useState(false);
  const [weeklyDialogOpen, setWeeklyDialogOpen] = useState(false);
  const [dialogPreselectedWorkItemId, setDialogPreselectedWorkItemId] = useState<string | undefined>(
    undefined
  );
  const [wbsPeriodTab, setWbsPeriodTab] = useState<ProgressPeriodTab>("DAILY");
  const [wbsLogWorkItemFilter, setWbsLogWorkItemFilter] = useState<string>("ALL");
  const [wbsLogSearch, setWbsLogSearch] = useState<string>("");
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);

  // Quick Progress Form State
  const [quickWorkItemId, setQuickWorkItemId] = useState("");
  const [quickActivity, setQuickActivity] = useState("");
  const [quickVolume, setQuickVolume] = useState<number | "">("");
  const [quickProgressPercent, setQuickProgressPercent] = useState<string>("");
  const [quickWeather, setQuickWeather] = useState<"Cerah" | "Hujan" | "Berawan">("Cerah");
  const [quickNotes, setQuickNotes] = useState("");
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  // Paginasi log harian
  const [dailyPage, setDailyPage] = useState(1);
  const pageSize = 10;

  // WBS Dialog State
  const [wbsDialogOpen, setWbsDialogOpen] = useState(false);
  const [editingWorkItem, setEditingWorkItem] = useState<WorkItem | null>(null);
  const [wiName, setWiName] = useState("");
  const [wiType, setWiType] = useState<"Physical" | "Material">("Physical");
  const [wiWeight, setWiWeight] = useState<number>(20);
  const [wiStartDate, setWiStartDate] = useState("");
  const [wiEndDate, setWiEndDate] = useState("");
  const [wiProcurementType, setWiProcurementType] = useState<ProcurementType>("Tender");
  const [wiProgressMode, setWiProgressMode] = useState<"Daily" | "Weekly">("Daily");
  const [wiPhase, setWiPhase] = useState<WorkItem["phase"]>("Physical Execution");
  const [isSavingWbs, setIsSavingWbs] = useState(false);

  // BOQ Dialog State
  const [boqDialogOpen, setBoqDialogOpen] = useState(false);
  const [boqCode, setBoqCode] = useState("");
  const [boqName, setBoqName] = useState("");
  const [boqVolume, setBoqVolume] = useState<number>(1);
  const [boqUnit, setBoqUnit] = useState("M3");
  const [boqUnitPrice, setBoqUnitPrice] = useState<number>(100000);
  const [boqWeight, setBoqWeight] = useState<number>(5);
  const [isSavingBoq, setIsSavingBoq] = useState(false);

  // Konfirmasi hapus WBS / BOQ
  const [deleteTarget, setDeleteTarget] = useState<
    { kind: "workItem" | "boqItem"; id: string; label: string } | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const workItems = useMemo(() => project?.workItems || [], [project?.workItems]);
  const boqList = project?.surveyAndBoq || [];

  useEffect(() => {
    if (!quickWorkItemId && workItems.length > 0) {
      setQuickWorkItemId(workItems[0].id);
      setQuickProgressPercent(String(workItems[0].progress));
    }
  }, [quickWorkItemId, workItems]);

  const projectDaily = useMemo(
    () => dailyProgress.filter((d) => d.projectId === projectId),
    [dailyProgress, projectId]
  );
  const projectWeekly = useMemo(
    () => weeklyProgress.filter((w) => w.projectId === projectId),
    [weeklyProgress, projectId]
  );

  const projectByIdMap = useMemo(() => {
    const map = new Map<string, typeof project>();
    if (project) map.set(project.id, project);
    return map as Map<string, NonNullable<typeof project>>;
  }, [project]);

  const wbsLogCounts = useMemo(() => {
    const map = new Map<string, { daily: number; weekly: number }>();
    for (const d of projectDaily) {
      const curr = map.get(d.workItemId) || { daily: 0, weekly: 0 };
      curr.daily += 1;
      map.set(d.workItemId, curr);
    }
    for (const w of projectWeekly) {
      const curr = map.get(w.workItemId) || { daily: 0, weekly: 0 };
      curr.weekly += 1;
      map.set(w.workItemId, curr);
    }
    return map;
  }, [projectDaily, projectWeekly]);

  const filteredWbsDaily = useMemo(() => {
    const q = wbsLogSearch.trim().toLowerCase();
    return projectDaily.filter((d) => {
      if (wbsLogWorkItemFilter !== "ALL" && d.workItemId !== wbsLogWorkItemFilter) return false;
      if (q) {
        const hay = [d.workItemName, d.activity, d.notes, d.createdBy, d.spkNumber]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projectDaily, wbsLogWorkItemFilter, wbsLogSearch]);

  const filteredWbsWeekly = useMemo(() => {
    const q = wbsLogSearch.trim().toLowerCase();
    return projectWeekly.filter((w) => {
      if (wbsLogWorkItemFilter !== "ALL" && w.workItemId !== wbsLogWorkItemFilter) return false;
      if (q) {
        const hay = [w.workItemName, w.period, w.notes, w.createdBy, w.spkNumber]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projectWeekly, wbsLogWorkItemFilter, wbsLogSearch]);

  const handleOpenDailyDialog = (workItemId?: string) => {
    setDialogPreselectedWorkItemId(workItemId);
    setDailyDialogOpen(true);
  };

  const handleOpenWeeklyDialog = (workItemId?: string) => {
    setDialogPreselectedWorkItemId(workItemId);
    setWeeklyDialogOpen(true);
  };

  const chartData = useMemo(() => {
    if (projectWeekly.length === 0) return [];
    const sortedWeekly = [...projectWeekly].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    return sortedWeekly.map((wp, idx) => {
      const match = wp.period.match(/Minggu\s+(\d+)/i);
      const label = match ? `M${match[1]}` : `M${idx + 1}`;
      return {
        week: label,
        plan: wp.plannedProgress,
        actual: wp.actualProgress,
        variance: wp.variance,
      };
    });
  }, [projectWeekly]);

  if (!project) return null;

  const isAfceApproved = project.afceStatus === "Approved";
  const canRecordProgress = canEditProjects && isAfceApproved;

  const totalWeight = workItems.reduce((acc, it) => acc + (it.weight || 0), 0);
  const totalBoqValue = boqList.reduce((acc, it) => acc + it.totalPrice, 0);
  const totalBoqWeight = boqList.reduce((acc, it) => acc + it.weight, 0);

  const totalDailyPages = Math.max(1, Math.ceil(projectDaily.length / pageSize));
  const pagedDaily = projectDaily.slice((dailyPage - 1) * pageSize, dailyPage * pageSize);

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    router.replace(`/workspace/${projectId}/execution?tab=${nextTab}`, {
      scroll: false,
    });
  };

  const handleQuickWorkItemSelect = (nextId: string) => {
    setQuickWorkItemId(nextId);
    const wi = workItems.find((w) => w.id === nextId);
    if (wi) {
      setQuickProgressPercent(String(wi.progress));
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRecordProgress) {
      toast.error("Progres hanya dapat dicatat oleh PIC/Admin setelah AFCE disetujui.");
      return;
    }
    const targetWiId = quickWorkItemId || workItems[0]?.id;
    const selectedWi = workItems.find((w) => w.id === targetWiId);
    if (!selectedWi) {
      toast.error("Tambahkan minimal 1 item pekerjaan WBS sebelum mencatat progres.");
      return;
    }

    const volNum = Number(quickVolume);
    if (!volNum || volNum <= 0) {
      toast.error("Volume realisasi harian harus lebih besar dari 0.");
      return;
    }

    const spk = spkContracts.find(
      (s) => s.projectId === projectId && s.workItemId === targetWiId && !s.deletedAt
    );

    const priorLogs = projectDaily.filter((d) => d.workItemId === targetWiId);
    const priorCumulative = priorLogs.reduce((sum, log) => sum + (log.actualVolume || 0), 0);
    const cumulativeVolume = priorCumulative + volNum;
    const targetVol = spk?.targetVolume || 0;
    const remainingVolume = targetVol > 0 ? Math.max(0, targetVol - cumulativeVolume) : undefined;

    let computedPercent =
      quickProgressPercent.trim() !== ""
        ? Number(quickProgressPercent)
        : targetVol > 0
        ? Math.min(100, Math.round((cumulativeVolume / targetVol) * 100))
        : selectedWi.progress;

    if (Number.isNaN(computedPercent) || computedPercent < 0 || computedPercent > 100) {
      toast.error("Persentase progres komulatif harus berada di antara 0 dan 100%.");
      return;
    }

    setIsQuickSubmitting(true);
    try {
      const ok = await addDailyProgress({
        projectId: project.id,
        workItemId: targetWiId,
        workItemName: selectedWi.name,
        spkId: spk?.id,
        spkNumber: spk?.spkNumber,
        contractorName: spk?.vendorName || "Swakelola Kebun",
        date: quickDate,
        weather: quickWeather,
        activity: quickActivity.trim() || `Pelaksanaan harian ${selectedWi.name}`,
        targetVolume: targetVol || undefined,
        actualVolume: volNum,
        plannedVolume: volNum,
        cumulativeVolume,
        remainingVolume,
        unit: spk?.unit || "Unit",
        progressPercent: computedPercent,
        notes: quickNotes.trim(),
        createdBy: userProfile.fullName || "PIC Proyek",
      });
      if (ok) {
        toast.success("Catatan progres harian berhasil disimpan ke database.");
        setQuickActivity("");
        setQuickVolume("");
        setQuickNotes("");
        setDailyPage(1);
      }
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  const handleOpenAddWbs = () => {
    setEditingWorkItem(null);
    setWiName("");
    setWiType("Physical");
    setWiWeight(10);
    setWiStartDate(project.baselineStartDate);
    setWiEndDate(project.baselineEndDate);
    setWiProcurementType(project.procurementType || "Tender");
    setWiProgressMode("Daily");
    setWiPhase("Physical Execution");
    setWbsDialogOpen(true);
  };

  const handleOpenEditWbs = (wi: WorkItem) => {
    setEditingWorkItem(wi);
    setWiName(wi.name);
    setWiType(wi.type);
    setWiWeight(wi.weight);
    setWiStartDate(wi.startDate);
    setWiEndDate(wi.endDate);
    setWiProcurementType(wi.procurementType);
    setWiProgressMode(wi.progressMode);
    setWiPhase(wi.phase);
    setWbsDialogOpen(true);
  };

  const handleSaveWbs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wiName.trim()) {
      toast.error("Nama item pekerjaan wajib diisi.");
      return;
    }
    if (wiWeight <= 0 || wiWeight > 100) {
      toast.error("Bobot item pekerjaan harus antara 1% hingga 100%.");
      return;
    }
    if (wiStartDate && wiEndDate && wiEndDate < wiStartDate) {
      toast.error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    setIsSavingWbs(true);
    try {
      const ok = editingWorkItem
        ? await updateWorkItem(editingWorkItem.id, project.id, {
            name: wiName.trim(),
            type: wiType,
            weight: wiWeight,
            startDate: wiStartDate,
            endDate: wiEndDate,
            procurementType: wiProcurementType,
            progressMode: wiProgressMode,
            phase: wiPhase,
          })
        : await addWorkItem(project.id, {
            name: wiName.trim(),
            type: wiType,
            weight: wiWeight,
            startDate: wiStartDate,
            endDate: wiEndDate,
            procurementType: wiProcurementType,
            progressMode: wiProgressMode,
            phase: wiPhase,
            status: "Planned",
            progress: 0,
          });
      if (ok) {
        setWbsDialogOpen(false);
      }
    } finally {
      setIsSavingWbs(false);
    }
  };

  const handleSaveBoq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boqName.trim()) {
      toast.error("Nama uraian pekerjaan BOQ wajib diisi.");
      return;
    }
    if (boqVolume <= 0) {
      toast.error("Volume BOQ harus lebih besar dari 0.");
      return;
    }
    if (boqUnitPrice < 0) {
      toast.error("Harga satuan tidak boleh negatif.");
      return;
    }

    setIsSavingBoq(true);
    try {
      const ok = await addBoqItem(project.id, {
        itemCode: boqCode.trim() || `BOQ-${String(boqList.length + 1).padStart(3, "0")}`,
        name: boqName.trim(),
        volume: boqVolume,
        unit: boqUnit.trim() || "Unit",
        unitPrice: boqUnitPrice,
        totalPrice: boqVolume * boqUnitPrice,
        weight: boqWeight,
        status: "Draft",
      });
      if (ok) {
        setBoqDialogOpen(false);
      }
    } finally {
      setIsSavingBoq(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const ok =
        deleteTarget.kind === "workItem"
          ? await deleteWorkItem(deleteTarget.id, project.id)
          : await deleteBoqItem(deleteTarget.id, project.id);
      if (ok) {
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateSchedule = async (updatedGroups: ScheduleGanttGroup[]) => {
    return updateProject(projectId, {
      scheduleMatrix: updatedGroups,
    });
  };

  const baselineDays = calculateDaysBetween(project.baselineStartDate, project.baselineEndDate);
  const targetDays = calculateDaysBetween(project.baselineStartDate, project.targetEndDate);

  return (
    <div className="space-y-4">
      {!isAfceApproved && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3.5 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Dokumen AFCE belum berstatus Disetujui
            </p>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">
              Pencatatan log progres harian & mingguan dikunci hingga otorisasi AFCE SAP berstatus Disetujui.
            </p>
          </div>
        </div>
      )}

      {/* Header & Ringkasan */}
      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <HardHat className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-foreground">
                Hub Pelaksanaan & Progres Fisik
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pantau Kurva S, catat log harian/mingguan, kelola WBS berbobot, jadwal Gantt, serta BOQ teknis.
            </p>
          </div>

          {canEditProjects && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canRecordProgress}
                onClick={() => setDailyDialogOpen(true)}
                className="h-9 text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log Harian
              </Button>
              <Button
                size="sm"
                disabled={!canRecordProgress}
                onClick={() => setWeeklyDialogOpen(true)}
                className="h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Log Mingguan
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Realisasi Fisik Total</span>
            <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {project.progress}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Durasi Kontrak</span>
            <span className="text-lg font-bold font-mono text-foreground">
              {project.durationDays} Hari
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Deviasi Jadwal</span>
            <span
              className={cn(
                "text-lg font-bold font-mono",
                project.scheduleVarianceDays > 7
                  ? "text-rose-700 dark:text-rose-400"
                  : "text-emerald-700 dark:text-emerald-400"
              )}
            >
              {project.scheduleVarianceDays > 0
                ? `+${project.scheduleVarianceDays} hr (Terlambat)`
                : "Tepat Waktu"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Item Pekerjaan WBS</span>
            <span className="text-lg font-bold font-mono text-foreground">
              {workItems.length} Komponen
            </span>
          </div>
        </div>

        <div className="border-t pt-2">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-auto w-full flex flex-wrap justify-start gap-1">
              <TabsTrigger value="progress" className="text-xs gap-1.5 data-[state=active]:font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Kurva S & Log Fisik ({projectDaily.length})</span>
              </TabsTrigger>
              <TabsTrigger value="work-items" className="text-xs gap-1.5 data-[state=active]:font-semibold">
                <Layers className="w-3.5 h-3.5" />
                <span>Item Pekerjaan WBS ({workItems.length})</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs gap-1.5 data-[state=active]:font-semibold">
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Jadwal & Matriks Gantt</span>
              </TabsTrigger>
              <TabsTrigger value="boq" className="text-xs gap-1.5 data-[state=active]:font-semibold">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Survey & BOQ ({boqList.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* TAB 1: KURVA S & LOG FISIK */}
      {activeTab === "progress" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Kurva S Rencana vs Realisasi Aktual
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Berdasarkan laporan evaluasi mingguan yang tercatat pada database.
                  </p>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {chartData.length} Minggu Tercatat
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                {chartData.length === 0 ? (
                  <EmptyState
                    icon={<TrendingUp className="w-8 h-8 opacity-60" />}
                    title="Belum ada data Kurva S mingguan"
                    description="Catat minimal satu laporan evaluasi mingguan untuk menampilkan grafik Kurva S rencana terhadap realisasi aktual."
                    actionLabel={canRecordProgress ? "Catat Log Mingguan" : undefined}
                    onAction={canRecordProgress ? () => setWeeklyDialogOpen(true) : undefined}
                  />
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Line
                          type="monotone"
                          dataKey="plan"
                          name="Rencana Baseline (%)"
                          stroke="#64748b"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="actual"
                          name="Realisasi Aktual (%)"
                          stroke="#047857"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {canEditProjects ? (
              <Card className="shadow-sm border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                <CardHeader className="pb-2 border-b border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                    <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    Input Progres Harian Cepat
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Catat progres lapangan harian ke komponen WBS proyek.
                  </p>
                </CardHeader>
                <CardContent className="p-3.5">
                  <form onSubmit={handleQuickSubmit} className="space-y-2.5 text-xs">
                    <div>
                      <label htmlFor="quick-wi" className="text-[11px] font-medium text-foreground block mb-1">
                        Komponen Pekerjaan
                      </label>
                      <Select
                        value={quickWorkItemId || (workItems[0]?.id || "")}
                        onValueChange={handleQuickWorkItemSelect}
                        disabled={!canRecordProgress || workItems.length === 0}
                      >
                        <SelectTrigger id="quick-wi" className="h-9 text-xs">
                          <SelectValue placeholder="Pilih item pekerjaan" />
                        </SelectTrigger>
                        <SelectContent>
                          {workItems.map((wi) => (
                            <SelectItem key={wi.id} value={wi.id}>
                              {wi.name} ({wi.weight}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="quick-date" className="text-[11px] font-medium text-foreground block mb-1">
                          Tanggal
                        </label>
                        <Input
                          id="quick-date"
                          type="date"
                          value={quickDate}
                          onChange={(e) => setQuickDate(e.target.value)}
                          disabled={!canRecordProgress}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="quick-weather" className="text-[11px] font-medium text-foreground block mb-1">
                          Cuaca
                        </label>
                        <Select
                          value={quickWeather}
                          onValueChange={(v: "Cerah" | "Hujan" | "Berawan") => setQuickWeather(v)}
                          disabled={!canRecordProgress}
                        >
                          <SelectTrigger id="quick-weather" className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cerah">
                              <span className="flex items-center gap-1.5">
                                <Sun className="w-3.5 h-3.5 text-amber-600" />
                                <span>Cerah</span>
                              </span>
                            </SelectItem>
                            <SelectItem value="Berawan">
                              <span className="flex items-center gap-1.5">
                                <CloudSun className="w-3.5 h-3.5 text-sky-600" />
                                <span>Berawan</span>
                              </span>
                            </SelectItem>
                            <SelectItem value="Hujan">
                              <span className="flex items-center gap-1.5">
                                <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                                <span>Hujan</span>
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="quick-activity" className="text-[11px] font-medium text-foreground block mb-1">
                        Aktivitas Lapangan
                      </label>
                      <Input
                        id="quick-activity"
                        placeholder="Contoh: Pemasangan bronjong & cerucuk"
                        value={quickActivity}
                        onChange={(e) => setQuickActivity(e.target.value)}
                        disabled={!canRecordProgress}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="quick-volume" className="text-[11px] font-medium text-foreground block mb-1">
                          Volume Hari Ini
                        </label>
                        <Input
                          id="quick-volume"
                          type="number"
                          min="0.01"
                          step="any"
                          placeholder="0"
                          value={quickVolume}
                          onChange={(e) =>
                            setQuickVolume(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          disabled={!canRecordProgress}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="quick-percent" className="text-[11px] font-medium text-foreground block mb-1">
                          Progres Item (%)
                        </label>
                        <Input
                          id="quick-percent"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={quickProgressPercent}
                          onChange={(e) => setQuickProgressPercent(e.target.value)}
                          disabled={!canRecordProgress}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="quick-notes" className="text-[11px] font-medium text-foreground block mb-1">
                        Catatan Kendala / Alat
                      </label>
                      <Input
                        id="quick-notes"
                        placeholder="Opsional"
                        value={quickNotes}
                        onChange={(e) => setQuickNotes(e.target.value)}
                        disabled={!canRecordProgress}
                        className="h-9 text-xs"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={!canRecordProgress || isQuickSubmitting || workItems.length === 0}
                      className="w-full h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isQuickSubmitting ? "Menyimpan..." : "Simpan Laporan Harian"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm p-4 text-xs text-muted-foreground text-center flex flex-col items-center justify-center">
                <HardHat className="w-8 h-8 opacity-40 mb-2" />
                <p className="font-semibold text-foreground">Akses Baca Saja</p>
                <p className="text-[11px] mt-1">
                  Hanya PIC proyek atau Administrator yang dapat mencatat laporan progres harian.
                </p>
              </Card>
            )}
          </div>

          {/* Tabel Log Harian Berpaginasi */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Riwayat Laporan Progres Harian ({projectDaily.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daftar realisasi volume harian dan kondisi cuaca lapangan.
                </p>
              </div>
              {canRecordProgress && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDailyDialogOpen(true)}
                  className="h-9 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Form Harian Lengkap
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {projectDaily.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Activity className="w-8 h-8 opacity-60" />}
                    title="Belum ada laporan progres harian"
                    description="Catat laporan harian untuk memantau perkembangan volume pekerjaan di lapangan."
                  />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Komponen Kerja</TableHead>
                        <TableHead>Aktivitas</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Cuaca</TableHead>
                        <TableHead>Pencatat</TableHead>
                        <TableHead>Dokumen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedDaily.map((log) => (
                        <TableRow key={log.id} className="text-xs">
                          <TableCell className="font-mono font-medium whitespace-nowrap">
                            {formatIDDate(log.date)}
                          </TableCell>
                          <TableCell className="font-medium">{log.workItemName}</TableCell>
                          <TableCell className="max-w-xs truncate">{log.activity}</TableCell>
                          <TableCell className="font-mono">
                            {log.actualVolume} {log.unit}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">
                              {log.weather}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{log.createdBy}</TableCell>
                          <TableCell>
                            {log.photoUrl ? (
                              <AttachmentPreview
                                filename={log.photoName || log.photoUrl}
                                fileUrl={log.photoUrl.startsWith("/") || log.photoUrl.startsWith("http") ? log.photoUrl : undefined}
                                title="Dokumentasi Fisik Lapangan"
                              />
                            ) : (
                              <span className="text-muted-foreground text-[11px]">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {totalDailyPages > 1 && (
                    <div className="p-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Halaman {dailyPage} dari {totalDailyPages} ({projectDaily.length} log)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={dailyPage <= 1}
                          onClick={() => setDailyPage((p) => Math.max(1, p - 1))}
                          className="h-8 text-xs"
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={dailyPage >= totalDailyPages}
                          onClick={() => setDailyPage((p) => Math.min(totalDailyPages, p + 1))}
                          className="h-8 text-xs"
                        >
                          Berikutnya
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabel Log Mingguan */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Evaluasi Kurva S Mingguan ({projectWeekly.length})
                </CardTitle>
              </div>
              {canRecordProgress && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWeeklyDialogOpen(true)}
                  className="h-9 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Catat Log Mingguan
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {projectWeekly.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada evaluasi mingguan tercatat.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periode</TableHead>
                      <TableHead>Rentang Tanggal</TableHead>
                      <TableHead>Komponen Kerja</TableHead>
                      <TableHead className="text-right">Rencana (%)</TableHead>
                      <TableHead className="text-right">Realisasi (%)</TableHead>
                      <TableHead className="text-right">Deviasi (%)</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectWeekly.map((wp) => (
                      <TableRow key={wp.id} className="text-xs">
                        <TableCell className="font-semibold">{wp.period}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {formatIDDate(wp.startDate)} s/d {formatIDDate(wp.endDate)}
                        </TableCell>
                        <TableCell>{wp.workItemName}</TableCell>
                        <TableCell className="font-mono text-right">{wp.plannedProgress}%</TableCell>
                        <TableCell className="font-mono font-bold text-right text-emerald-700 dark:text-emerald-400">
                          {wp.actualProgress}%
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono font-semibold text-right",
                            wp.variance < 0
                              ? "text-rose-700 dark:text-rose-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          )}
                        >
                          {wp.variance > 0 ? `+${wp.variance}%` : `${wp.variance}%`}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {wp.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: ITEM PEKERJAAN (WBS CRUD) & LIST HASIL INPUT PROGRES */}
      {activeTab === "work-items" && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Daftar Item Pekerjaan (Work Breakdown Structure)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kelola tugas fisik/material, jadwal rencana, serta bobot kontribusi terhadap progres proyek (target total 100%).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-medium px-2.5 py-1.5 rounded bg-muted border">
                  Total Bobot:{" "}
                  <b
                    className={
                      totalWeight === 100
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400"
                    }
                  >
                    {totalWeight}%
                  </b>
                </span>
                {canEditProjects && (
                  <Button
                    size="sm"
                    onClick={handleOpenAddWbs}
                    className="h-9 gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Tambah Item WBS
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {workItems.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Layers className="w-8 h-8 opacity-60" />}
                    title="Belum ada item pekerjaan WBS"
                    description="Tambahkan item pekerjaan untuk mengukur progres fisik proyek secara terstruktur."
                    actionLabel={canEditProjects ? "Tambah Item WBS" : undefined}
                    onAction={canEditProjects ? handleOpenAddWbs : undefined}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Item Pekerjaan</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Pengadaan</TableHead>
                      <TableHead>Bobot</TableHead>
                      <TableHead>Jadwal Rencana</TableHead>
                      <TableHead>Progres</TableHead>
                      <TableHead>Log Tercatat</TableHead>
                      <TableHead>Status</TableHead>
                      {canEditProjects && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workItems.map((wi) => {
                      const counts = wbsLogCounts.get(wi.id) || { daily: 0, weekly: 0 };
                      const isSelectedFilter = wbsLogWorkItemFilter === wi.id;
                      return (
                        <TableRow
                          key={wi.id}
                          className={cn(
                            "text-xs hover:bg-muted/30",
                            isSelectedFilter && "bg-emerald-50/40 dark:bg-emerald-950/20"
                          )}
                        >
                          <TableCell>
                            <div className="font-semibold text-foreground">{wi.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              Fase: {wi.phase} &bull; Mode: {wi.progressMode}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">
                              {wi.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{wi.procurementType}</TableCell>
                          <TableCell className="font-mono font-bold">{wi.weight}%</TableCell>
                          <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                            {formatIDDate(wi.startDate)} s/d {formatIDDate(wi.endDate)}
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <Progress value={wi.progress} className="h-2 flex-1" />
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {wi.progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setWbsLogWorkItemFilter(isSelectedFilter ? "ALL" : wi.id);
                                  setWbsPeriodTab("DAILY");
                                }}
                                className={cn(
                                  "px-2 py-0.5 rounded border text-[11px] font-mono transition-colors",
                                  isSelectedFilter && wbsPeriodTab === "DAILY"
                                    ? "bg-emerald-700 text-white border-emerald-700"
                                    : "bg-muted/50 hover:bg-muted text-foreground border-border"
                                )}
                                title="Filter list ke progres harian item ini"
                              >
                                {counts.daily} Harian
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWbsLogWorkItemFilter(isSelectedFilter ? "ALL" : wi.id);
                                  setWbsPeriodTab("WEEKLY");
                                }}
                                className={cn(
                                  "px-2 py-0.5 rounded border text-[11px] font-mono transition-colors",
                                  isSelectedFilter && wbsPeriodTab === "WEEKLY"
                                    ? "bg-emerald-700 text-white border-emerald-700"
                                    : "bg-muted/50 hover:bg-muted text-foreground border-border"
                                )}
                                title="Filter list ke progres mingguan item ini"
                              >
                                {counts.weekly} Mingguan
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={wi.status} showDot={false} />
                          </TableCell>
                          {canEditProjects && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {canRecordProgress && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      wi.progressMode === "Weekly"
                                        ? handleOpenWeeklyDialog(wi.id)
                                        : handleOpenDailyDialog(wi.id)
                                    }
                                    className="h-8 px-2 text-[11px] gap-1"
                                    title={`Catat progres ${wi.progressMode === "Weekly" ? "mingguan" : "harian"} untuk ${wi.name}`}
                                  >
                                    <Plus className="w-3 h-3" aria-hidden="true" />
                                    <span>Input</span>
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={`Ubah item pekerjaan ${wi.name}`}
                                  onClick={() => handleOpenEditWbs(wi)}
                                  className="h-8 w-8"
                                >
                                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={`Hapus item pekerjaan ${wi.name}`}
                                  onClick={() =>
                                    setDeleteTarget({
                                      kind: "workItem",
                                      id: wi.id,
                                      label: `Item WBS "${wi.name}"`,
                                    })
                                  }
                                  className="h-8 w-8 text-muted-foreground hover:text-rose-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* List Hasil Input Progres Harian & Mingguan per Proyek / Item WBS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card p-4 rounded-lg border shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Daftar Hasil Input Progres Harian &amp; Mingguan
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pantau seluruh catatan realisasi harian dan evaluasi mingguan pada item pekerjaan proyek ini.
                </p>
              </div>

              {canRecordProgress && workItems.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleOpenDailyDialog(
                        wbsLogWorkItemFilter !== "ALL" ? wbsLogWorkItemFilter : undefined
                      )
                    }
                    className="h-9 text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Log Harian
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      handleOpenWeeklyDialog(
                        wbsLogWorkItemFilter !== "ALL" ? wbsLogWorkItemFilter : undefined
                      )
                    }
                    className="h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Log Mingguan
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 bg-card p-3 rounded-lg border shadow-sm">
              <div className="relative flex-1">
                <label htmlFor="wbs-log-search" className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Cari Catatan Progres
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="wbs-log-search"
                    type="text"
                    placeholder="Cari aktivitas, periode, catatan, atau pencatat..."
                    value={wbsLogSearch}
                    onChange={(e) => setWbsLogSearch(e.target.value)}
                    className="pl-9 pr-8 text-xs h-9 bg-background"
                  />
                  {wbsLogSearch && (
                    <button
                      type="button"
                      aria-label="Hapus pencarian log progres"
                      onClick={() => setWbsLogSearch("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-[260px]">
                <label htmlFor="wbs-log-item-filter" className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Filter Item Pekerjaan WBS
                </label>
                <Select value={wbsLogWorkItemFilter} onValueChange={setWbsLogWorkItemFilter}>
                  <SelectTrigger id="wbs-log-item-filter" className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Semua Item WBS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Item WBS ({workItems.length})</SelectItem>
                    {workItems.map((wi) => (
                      <SelectItem key={wi.id} value={wi.id}>
                        {wi.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(wbsLogWorkItemFilter !== "ALL" || Boolean(wbsLogSearch.trim())) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setWbsLogWorkItemFilter("ALL");
                    setWbsLogSearch("");
                  }}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </Button>
              )}
            </div>

            <ProgressLogTables
              dailyLogs={filteredWbsDaily}
              weeklyLogs={filteredWbsWeekly}
              projectById={projectByIdMap}
              activePeriodTab={wbsPeriodTab}
              onPeriodTabChange={setWbsPeriodTab}
              showProjectColumn={false}
              tableDensity={tableDensity}
              isLoading={isLoading}
              loadError={loadError}
              onRetryLoad={refreshFromDatabase}
              hasActiveFilters={wbsLogWorkItemFilter !== "ALL" || Boolean(wbsLogSearch.trim())}
              onResetFilters={() => {
                setWbsLogWorkItemFilter("ALL");
                setWbsLogSearch("");
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 3: JADWAL & MATRIKS GANTT */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 shadow-sm">
              <span className="text-xs text-muted-foreground font-medium block">
                Jadwal Baseline (Awal)
              </span>
              <div className="mt-1 font-mono text-sm font-bold text-foreground">
                {formatIDDate(project.baselineStartDate)} s/d {formatIDDate(project.baselineEndDate)}
              </div>
              <span className="text-[11px] text-muted-foreground block mt-1">
                Durasi Baseline: {baselineDays} Hari
              </span>
            </Card>

            <Card className="p-4 shadow-sm border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">
                Target Penyelesaian Saat Ini
              </span>
              <div className="mt-1 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                {formatIDDate(project.targetEndDate)}
              </div>
              <span className="text-[11px] text-muted-foreground block mt-1">
                Total Durasi Berjalan: {targetDays} Hari
              </span>
            </Card>

            <Card className="p-4 shadow-sm flex flex-col justify-between gap-2">
              <div>
                <span className="text-xs text-muted-foreground font-medium block">
                  Deviasi & Riwayat Addendum
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className={cn(
                      "font-mono text-sm font-bold",
                      project.scheduleVarianceDays > 0
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    {project.scheduleVarianceDays > 0
                      ? `+${project.scheduleVarianceDays} Hari Deviasi`
                      : "Sesuai Jadwal"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({(project.revisions || []).length}x Revisi)
                  </span>
                </div>
              </div>
              {canEditProjects && (
                <Button
                  size="sm"
                  onClick={() => setRevisionDialogOpen(true)}
                  className="w-full text-xs h-9 bg-amber-800 hover:bg-amber-900 text-white"
                >
                  <CalendarClock className="w-3.5 h-3.5 mr-1.5" /> Ajukan Revisi Jadwal
                </Button>
              )}
            </Card>
          </div>

          <ScheduleGanttMatrix
            project={project}
            dailyProgress={projectDaily}
            weeklyProgress={projectWeekly}
            pos={pos}
            goodsHandovers={goodsHandovers}
            spkContracts={spkContracts}
            canEdit={canEditProjects}
            onGoToWorkItems={() => handleTabChange("work-items")}
            onUpdateSchedule={handleUpdateSchedule}
          />

          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <CardTitle className="text-sm font-semibold">
                  Riwayat Perubahan Jadwal (Addendum Log)
                </CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {(project.revisions || []).length} Catatan Riwayat
              </span>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Revisi</TableHead>
                    <TableHead>Target Lama</TableHead>
                    <TableHead>Target Baru</TableHead>
                    <TableHead>Perpanjangan</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Pengaju / Penyetuju</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Lampiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(project.revisions || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground">
                        Belum pernah dilakukan revisi jadwal. Proyek masih berjalan sesuai baseline awal.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (project.revisions || []).map((rev) => (
                      <TableRow key={rev.id} className="text-xs">
                        <TableCell className="font-mono font-bold">
                          Rev #{rev.revisionNumber}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {formatIDDate(rev.previousEndDate)}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatIDDate(rev.newEndDate)}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                          +{rev.extendedWeeks} Minggu
                        </TableCell>
                        <TableCell>{rev.reason}</TableCell>
                        <TableCell>
                          <span className="font-semibold block">
                            {rev.approvedBy || rev.revisedBy}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Diajukan: {rev.revisedBy}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatIDDate(rev.approvalDate || rev.revisedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {rev.attachmentName ? (
                            <AttachmentPreview
                              filename={rev.attachmentName}
                              title={`Berita Acara Revisi Rev #${rev.revisionNumber}`}
                              description={rev.reason}
                            />
                          ) : (
                            <span className="text-muted-foreground text-[11px]">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: SURVEY & BOQ (CRUD REAL DB) */}
      {activeTab === "boq" && (
        <div className="space-y-4">
          <Card className="shadow-sm p-4 bg-muted/20 border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Informasi Lokasi & Survey Teknis Proyek</span>
                </div>
                <p className="text-foreground font-medium">
                  Lokasi Kebun: {project.locationName || "-"}
                  {project.blockCode ? ` | Blok: ${project.blockCode}` : ""}
                </p>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                Tanggal Baseline: {formatIDDate(project.baselineStartDate)} | PIC: {project.picName || "-"}
              </div>
            </div>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Bill of Quantities (BOQ) Rencana Anggaran ({boqList.length} Item)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rincian volume, satuan, harga satuan, dan nilai total pekerjaan.
                </p>
              </div>
              {canEditProjects && (
                <Button
                  size="sm"
                  onClick={() => {
                    setBoqCode(`BOQ-${String(boqList.length + 1).padStart(3, "0")}`);
                    setBoqName("");
                    setBoqVolume(1);
                    setBoqUnit("M3");
                    setBoqUnitPrice(100000);
                    setBoqWeight(5);
                    setBoqDialogOpen(true);
                  }}
                  className="h-9 gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Item BOQ
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {boqList.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<ClipboardList className="w-8 h-8 opacity-60" />}
                    title="Belum ada rincian BOQ terdaftar"
                    description="Tambahkan item BOQ untuk mencatat estimasi volume dan biaya pekerjaan secara rinci."
                  />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode Item</TableHead>
                        <TableHead>Uraian Pekerjaan / Material</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead className="text-right">Harga Satuan</TableHead>
                        <TableHead className="text-right">Total Harga</TableHead>
                        <TableHead className="text-right">Bobot (%)</TableHead>
                        <TableHead>Status</TableHead>
                        {canEditProjects && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boqList.map((boq: BOQItem) => (
                        <TableRow key={boq.id} className="text-xs">
                          <TableCell className="font-mono font-semibold">{boq.itemCode}</TableCell>
                          <TableCell className="font-medium">{boq.name}</TableCell>
                          <TableCell className="font-mono text-right">
                            {boq.volume.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>{boq.unit}</TableCell>
                          <TableCell className="font-mono text-right">
                            {formatIDR(boq.unitPrice)}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-right">
                            {formatIDR(boq.totalPrice)}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-right text-emerald-700 dark:text-emerald-400">
                            {boq.weight}%
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={boq.status} />
                          </TableCell>
                          {canEditProjects && (
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Hapus item BOQ ${boq.name}`}
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: "boqItem",
                                    id: boq.id,
                                    label: `Item BOQ "${boq.name}"`,
                                  })
                                }
                                className="h-8 w-8 text-muted-foreground hover:text-rose-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">
                      Total Nilai BOQ Terinci ({boqList.length} Item):
                    </span>
                    <div className="flex items-center gap-4 font-mono">
                      <span>
                        Total Bobot: <strong>{totalBoqWeight}%</strong>
                      </span>
                      <strong className="text-base text-emerald-700 dark:text-emerald-400">
                        {formatIDR(totalBoqValue)}
                      </strong>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog Tambah / Edit WBS */}
      <Dialog open={wbsDialogOpen} onOpenChange={setWbsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingWorkItem ? "Ubah Item Pekerjaan (WBS)" : "Tambah Item Pekerjaan (WBS)"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tentukan komponen pekerjaan dan bobot kontribusi progres terhadap proyek.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveWbs} className="space-y-3 text-xs">
            <div>
              <label htmlFor="wbs-name" className="font-semibold block mb-1">
                Nama Item Pekerjaan <span className="text-rose-600">*</span>
              </label>
              <Input
                id="wbs-name"
                value={wiName}
                onChange={(e) => setWiName(e.target.value)}
                placeholder="Contoh: Galian Saluran Utama"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="wbs-type" className="font-semibold block mb-1">
                  Tipe Pekerjaan
                </label>
                <Select value={wiType} onValueChange={(v: "Physical" | "Material") => setWiType(v)}>
                  <SelectTrigger id="wbs-type" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physical">Pekerjaan Fisik</SelectItem>
                    <SelectItem value="Material">Komponen Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="wbs-weight" className="font-semibold block mb-1">
                  Bobot (%) <span className="text-rose-600">*</span>
                </label>
                <Input
                  id="wbs-weight"
                  type="number"
                  min="1"
                  max="100"
                  value={wiWeight}
                  onChange={(e) => setWiWeight(Number(e.target.value))}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="wbs-start" className="font-semibold block mb-1">
                  Tanggal Mulai
                </label>
                <Input
                  id="wbs-start"
                  type="date"
                  value={wiStartDate}
                  onChange={(e) => setWiStartDate(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div>
                <label htmlFor="wbs-end" className="font-semibold block mb-1">
                  Tanggal Selesai
                </label>
                <Input
                  id="wbs-end"
                  type="date"
                  value={wiEndDate}
                  onChange={(e) => setWiEndDate(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="wbs-proc" className="font-semibold block mb-1">
                  Metode Pengadaan
                </label>
                <Select
                  value={wiProcurementType}
                  onValueChange={(v: ProcurementType) => setWiProcurementType(v)}
                >
                  <SelectTrigger id="wbs-proc" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tender">Tender</SelectItem>
                    <SelectItem value="Swakelola">Swakelola</SelectItem>
                    <SelectItem value="Purchase">Purchase Langsung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="wbs-mode" className="font-semibold block mb-1">
                  Mode Pelaporan
                </label>
                <Select
                  value={wiProgressMode}
                  onValueChange={(v: "Daily" | "Weekly") => setWiProgressMode(v)}
                >
                  <SelectTrigger id="wbs-mode" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Harian (Daily)</SelectItem>
                    <SelectItem value="Weekly">Mingguan (Weekly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="wbs-phase" className="font-semibold block mb-1">
                Fase Pelaksanaan
              </label>
              <Select
                value={wiPhase}
                onValueChange={(v: WorkItem["phase"]) => setWiPhase(v)}
              >
                <SelectTrigger id="wbs-phase" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tender">Persiapan & Tender</SelectItem>
                  <SelectItem value="Physical Execution">Pelaksanaan Fisik</SelectItem>
                  <SelectItem value="Supporting Materials">Material Pendukung</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWbsDialogOpen(false)}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingWbs}
                className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {isSavingWbs ? "Menyimpan..." : "Simpan Item WBS"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Tambah BOQ */}
      <Dialog open={boqDialogOpen} onOpenChange={setBoqDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Tambah Item Survey & BOQ</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tambahkan rincian item kuantitas dan harga satuan anggaran proyek.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveBoq} className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="boq-code" className="font-semibold block mb-1">
                  Kode Item
                </label>
                <Input
                  id="boq-code"
                  value={boqCode}
                  onChange={(e) => setBoqCode(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="boq-name" className="font-semibold block mb-1">
                  Uraian Pekerjaan <span className="text-rose-600">*</span>
                </label>
                <Input
                  id="boq-name"
                  value={boqName}
                  onChange={(e) => setBoqName(e.target.value)}
                  placeholder="Contoh: Beton K-225 Gorong-Gorong"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="boq-vol" className="font-semibold block mb-1">
                  Volume
                </label>
                <Input
                  id="boq-vol"
                  type="number"
                  min="0.01"
                  step="any"
                  value={boqVolume}
                  onChange={(e) => setBoqVolume(Number(e.target.value))}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div>
                <label htmlFor="boq-unit" className="font-semibold block mb-1">
                  Satuan
                </label>
                <Input
                  id="boq-unit"
                  value={boqUnit}
                  onChange={(e) => setBoqUnit(e.target.value)}
                  placeholder="M3 / M1 / Unit"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label htmlFor="boq-weight" className="font-semibold block mb-1">
                  Bobot (%)
                </label>
                <Input
                  id="boq-weight"
                  type="number"
                  min="0"
                  max="100"
                  value={boqWeight}
                  onChange={(e) => setBoqWeight(Number(e.target.value))}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="boq-price" className="font-semibold block mb-1">
                Harga Satuan (Rp)
              </label>
              <Input
                id="boq-price"
                type="number"
                min="0"
                value={boqUnitPrice}
                onChange={(e) => setBoqUnitPrice(Number(e.target.value))}
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Estimasi Total: <strong className="text-foreground">{formatIDR(boqVolume * boqUnitPrice)}</strong>
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBoqDialogOpen(false)}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingBoq}
                className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {isSavingBoq ? "Menyimpan..." : "Simpan Item BOQ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus WBS / BOQ */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Konfirmasi Hapus Data</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Hapus <strong>{deleteTarget?.label}</strong> dari proyek ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="h-9 text-xs"
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modals Progres & Revisi */}
      <DailyProgressDialog
        open={dailyDialogOpen}
        onOpenChange={(open) => {
          setDailyDialogOpen(open);
          if (!open) setDialogPreselectedWorkItemId(undefined);
        }}
        project={project}
        preselectedWorkItemId={dialogPreselectedWorkItemId}
      />
      <WeeklyProgressDialog
        open={weeklyDialogOpen}
        onOpenChange={(open) => {
          setWeeklyDialogOpen(open);
          if (!open) setDialogPreselectedWorkItemId(undefined);
        }}
        project={project}
        preselectedWorkItemId={dialogPreselectedWorkItemId}
      />
      <ScheduleRevisionDialog
        open={revisionDialogOpen}
        onOpenChange={setRevisionDialogOpen}
        project={project}
      />
    </div>
  );
}

export default function UnifiedExecutionHub() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-xs text-muted-foreground">
          Memuat hub pelaksanaan proyek...
        </div>
      }
    >
      <UnifiedExecutionHubContent />
    </Suspense>
  );
}
