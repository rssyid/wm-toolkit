"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  HardHat,
  Calendar,
  CloudSun,
  Camera,
  Activity,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  CalendarClock,
  ClipboardList,
  Sparkles,
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
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentPreview } from "@/components/shared/attachment-preview";

// Components
import { DailyProgressDialog } from "@/components/progress/daily-progress-dialog";
import { WeeklyProgressDialog } from "@/components/progress/weekly-progress-dialog";
import { ScheduleGanttMatrix } from "@/components/workspace/schedule-gantt-matrix";
import { ScheduleRevisionDialog } from "@/components/workspace/schedule-revision-dialog";

import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, cn } from "@/lib/utils";
import { WorkItem, BOQItem, ScheduleGanttGroup } from "@/types";
import { toast } from "sonner";

export default function UnifiedExecutionHub() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const {
    projects,
    updateProject,
    dailyProgress,
    weeklyProgress,
    spkContracts,
    addDailyProgress,
    isViewerOnly,
  } = useAppState();

  const project = projects.find((p) => p.id === projectId);

  const [activeTab, setActiveTab] = useState("scurve");
  const [dailyDialogOpen, setDailyDialogOpen] = useState(false);
  const [weeklyDialogOpen, setWeeklyDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);

  // Quick In-Page Progress Form State
  const [quickWorkItemId, setQuickWorkItemId] = useState("");
  const [quickActivity, setQuickActivity] = useState("");
  const [quickVolume, setQuickVolume] = useState<number | "">("");
  const [quickWeather, setQuickWeather] = useState<"Cerah" | "Hujan" | "Berawan">("Cerah");
  const [quickNotes, setQuickNotes] = useState("");
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split("T")[0]);

  const projectDaily = dailyProgress.filter((d) => d.projectId === projectId);
  const projectWeekly = weeklyProgress.filter((w) => w.projectId === projectId);
  const workItems = project?.workItems || [];
  const boqList = project?.surveyAndBoq || [];

  // Generate S-Curve Chart Data
  const chartData = useMemo(() => {
    if (!project) return [];
    const sortedWeekly = [...projectWeekly].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    if (sortedWeekly.length > 0) {
      return sortedWeekly.map((wp, idx) => {
        const match = wp.period.match(/Minggu\s+(\d+)/i);
        const label = match ? `M${match[1]}` : `W${idx + 1}`;
        return {
          week: label,
          plan: wp.plannedProgress,
          actual: wp.actualProgress,
          variance: wp.variance,
        };
      });
    }

    // Fallback simulation based on project duration & progress
    const totalWeeks = Math.max(4, Math.ceil((project.durationDays || 30) / 7));
    const currentWeekIdx = Math.min(
      totalWeeks,
      Math.max(1, Math.round(((project.progress || 0) / 100) * totalWeeks))
    );

    const pts = [];
    for (let w = 1; w <= totalWeeks; w++) {
      const planVal = Math.min(
        100,
        Math.round((100 / (1 + Math.exp(-0.8 * (w - totalWeeks / 2)))) * 10) / 10
      );
      let actualVal = null;
      if (w <= currentWeekIdx) {
        actualVal = Math.min(
          100,
          Math.round(((project.progress || 0) / currentWeekIdx) * w * 10) / 10
        );
      }
      pts.push({
        week: `W${w}`,
        plan: planVal,
        actual: actualVal,
        variance: actualVal !== null ? Math.round((actualVal - planVal) * 10) / 10 : null,
      });
    }
    return pts;
  }, [projectWeekly, project?.progress, project?.durationDays, project]);

  if (!project) return null;

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWorkItemId && workItems.length > 0) {
      toast.error("Pilih komponen pekerjaan");
      return;
    }
    const targetWiId = quickWorkItemId || workItems[0]?.id;
    const selectedWi = workItems.find((w) => w.id === targetWiId);

    const spk = spkContracts.find((s) => s.projectId === projectId && s.workItemId === targetWiId);

    addDailyProgress({
      projectId: project.id,
      workItemId: targetWiId,
      workItemName: selectedWi?.name || "Pekerjaan Lapangan",
      spkId: spk?.id,
      spkNumber: spk?.spkNumber,
      contractorName: spk?.vendorName || "Swakelola Kebun",
      date: quickDate,
      weather: quickWeather,
      activity: quickActivity.trim() || `Pelaksanaan harian ${selectedWi?.name}`,
      actualVolume: Number(quickVolume) || 1,
      plannedVolume: 1,
      unit: spk?.unit || "Unit",
      progressPercent: selectedWi ? Math.min(100, selectedWi.progress + 5) : 5,
      notes: quickNotes.trim(),
      photoUrl: "site_doc_progress.jpg",
      createdBy: "Pengawas Lapangan (PIC)",
    });

    toast.success("Catatan progres harian berhasil disimpan!");
    setQuickActivity("");
    setQuickVolume("");
    setQuickNotes("");
  };

  const handleUpdateSchedule = (updatedGroups: ScheduleGanttGroup[]) => {
    updateProject(projectId, {
      scheduleMatrix: updatedGroups,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Physical Progress & Variance Banner */}
      <div className="rounded-lg border bg-card p-4 shadow-xs space-y-3">
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
              Monitoring Kurva S, log harian/mingguan, item pekerjaan berbobot, dan matriks jadwal Gantt.
            </p>
          </div>

          {!isViewerOnly && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDailyDialogOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log Harian
              </Button>
              <Button
                size="sm"
                onClick={() => setWeeklyDialogOpen(true)}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Log Mingguan
              </Button>
            </div>
          )}
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Realisasi Fisik Total</span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
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
                  ? "text-rose-600"
                  : "text-emerald-600"
              )}
            >
              {project.scheduleVarianceDays > 0
                ? `+${project.scheduleVarianceDays} hr (Terlambat)`
                : "Tepat Waktu"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Total Item Pekerjaan</span>
            <span className="text-lg font-bold font-mono text-foreground">
              {workItems.length} Komponen
            </span>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="border-t pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8">
              <TabsTrigger
                value="scurve"
                className="text-xs gap-1.5 data-[state=active]:font-semibold"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Kurva S & Log Fisik ({projectDaily.length})
              </TabsTrigger>
              <TabsTrigger
                value="workitems"
                className="text-xs gap-1.5 data-[state=active]:font-semibold"
              >
                <Layers className="w-3.5 h-3.5" />
                Item Pekerjaan & Bobot ({workItems.length})
              </TabsTrigger>
              <TabsTrigger
                value="gantt"
                className="text-xs gap-1.5 data-[state=active]:font-semibold"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Matriks Jadwal & Gantt
              </TabsTrigger>
              <TabsTrigger
                value="boq"
                className="text-xs gap-1.5 data-[state=active]:font-semibold"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Survey & BOQ ({boqList.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* SUB-TAB 1: KURVA S & QUICK LOG */}
      {activeTab === "scurve" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Kurva S Chart */}
            <Card className="lg:col-span-2 shadow-xs">
              <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Kurva S Rencana vs Realisasi Aktual
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Garis hijau menunjukkan realisasi fisik kumulatif lapangan.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {chartData.length} Minggu
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis
                        unit="%"
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                      />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line
                        type="monotone"
                        dataKey="plan"
                        name="Rencana Baseline (%)"
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Realisasi Aktual (%)"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Right 1 Col: Quick In-Page Progress Form */}
            {!isViewerOnly ? (
              <Card className="shadow-xs border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                <CardHeader className="pb-2 border-b border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Quick Progress Log (15 Detik)
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Catat kemajuan harian tanpa membuka form modal panjang.
                  </p>
                </CardHeader>
                <CardContent className="p-3.5">
                  <form onSubmit={handleQuickSubmit} className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] font-medium text-foreground block mb-1">
                        Komponen Pekerjaan
                      </label>
                      <Select
                        value={quickWorkItemId || (workItems[0]?.id || "")}
                        onValueChange={setQuickWorkItemId}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Pilih work item" />
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
                        <label className="text-[11px] font-medium text-foreground block mb-1">
                          Tanggal
                        </label>
                        <Input
                          type="date"
                          value={quickDate}
                          onChange={(e) => setQuickDate(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-foreground block mb-1">
                          Cuaca
                        </label>
                        <Select
                          value={quickWeather}
                          onValueChange={(v: "Cerah" | "Hujan" | "Berawan") =>
                            setQuickWeather(v)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cerah">☀️ Cerah</SelectItem>
                            <SelectItem value="Berawan">⛅ Berawan</SelectItem>
                            <SelectItem value="Hujan">🌧️ Hujan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-foreground block mb-1">
                        Aktivitas Lapangan
                      </label>
                      <Input
                        placeholder="Contoh: Pemasangan bronjong & cerucuk"
                        value={quickActivity}
                        onChange={(e) => setQuickActivity(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-foreground block mb-1">
                          Volume Hari Ini
                        </label>
                        <Input
                          type="number"
                          placeholder="Vol"
                          value={quickVolume}
                          onChange={(e) =>
                            setQuickVolume(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-foreground block mb-1">
                          Catatan
                        </label>
                        <Input
                          placeholder="Kendala / alat"
                          value={quickNotes}
                          onChange={(e) => setQuickNotes(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 shadow-xs mt-1"
                    >
                      <Send className="w-3.5 h-3.5" /> Simpan Laporan Harian
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xs p-4 text-xs text-muted-foreground text-center flex flex-col items-center justify-center">
                <HardHat className="w-8 h-8 opacity-40 mb-2" />
                <p className="font-semibold text-foreground">Mode Pantau (Viewer)</p>
                <p className="text-[11px] mt-1">Anda memiliki izin read-only untuk progres proyek.</p>
              </Card>
            )}
          </div>

          {/* Daily Progress Feed */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Riwayat Laporan Progres Harian ({projectDaily.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daftar laporan volume dan dokumentasi fisik lapangan.
                </p>
              </div>
              {!isViewerOnly && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDailyDialogOpen(true)}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Form Lengkap
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {projectDaily.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground space-y-1">
                  <Activity className="w-7 h-7 mx-auto opacity-40" />
                  <p className="font-medium">Belum ada laporan progres tercatat</p>
                  <p className="text-[11px]">
                    Gunakan widget quick log di atas untuk mencatat kemajuan fisik hari ini.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Komponen Kerja</TableHead>
                      <TableHead>Aktivitas</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Cuaca</TableHead>
                      <TableHead>Pengawas</TableHead>
                      <TableHead>Foto/Dokumen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectDaily.slice(0, 10).map((log) => (
                      <TableRow key={log.id} className="text-xs">
                        <TableCell className="font-mono font-medium whitespace-nowrap">
                          {formatIDDate(log.date)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.workItemName}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.activity}
                        </TableCell>
                        <TableCell className="font-mono">
                          {log.actualVolume} {log.unit}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {log.weather}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.createdBy}
                        </TableCell>
                        <TableCell>
                          {log.photoUrl ? (
                            <AttachmentPreview
                              filename={log.photoUrl}
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
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUB-TAB 2: WORK ITEMS */}
      {activeTab === "workitems" && (
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Komponen Item Pekerjaan & Bobot (Work Items)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total bobot pekerjaan harus terdistribusi tepat 100%.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {workItems.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                Belum ada Work Items yang didefinisikan.
              </div>
            ) : (
              <div className="space-y-3">
                {workItems.map((wi) => (
                  <div
                    key={wi.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {wi.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {wi.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono">
                          Bobot: <strong>{wi.weight}%</strong>
                        </span>
                        <span className="font-bold font-mono text-emerald-600">
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

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>
                        Jadwal: {formatIDDate(wi.startDate)} s/d {formatIDDate(wi.endDate)}
                      </span>
                      <StatusBadge status={wi.status} showDot={false} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SUB-TAB 3: GANTT MATRIX */}
      {activeTab === "gantt" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Matriks jadwal mingguan berbasis milestone dan revisi baseline.
            </span>
            {!isViewerOnly && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRevisionDialogOpen(true)}
                className="h-7 text-xs gap-1.5"
              >
                <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                Ajukan Revisi Jadwal
              </Button>
            )}
          </div>
          <ScheduleGanttMatrix
            project={project}
            onUpdateSchedule={handleUpdateSchedule}
          />
        </div>
      )}

      {/* SUB-TAB 4: BOQ */}
      {activeTab === "boq" && (
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold">
              Rincian Bill of Quantities (BOQ) & Survey Teknis
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daftar volume spesifikasi material dan satuan harga proyek.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {boqList.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                Belum ada rincian BOQ yang terdaftar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Item</TableHead>
                    <TableHead>Uraian Spesifikasi</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Harga Satuan</TableHead>
                    <TableHead className="text-right">Total Harga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boqList.map((boq) => (
                    <TableRow key={boq.id} className="text-xs">
                      <TableCell className="font-mono font-medium">
                        {boq.itemCode}
                      </TableCell>
                      <TableCell className="font-medium">{boq.name}</TableCell>
                      <TableCell className="font-mono">{boq.volume}</TableCell>
                      <TableCell>{boq.unit}</TableCell>
                      <TableCell className="font-mono">
                        {formatIDR(boq.unitPrice)}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-right">
                        {formatIDR(boq.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <DailyProgressDialog
        open={dailyDialogOpen}
        onOpenChange={setDailyDialogOpen}
        project={project}
      />
      <WeeklyProgressDialog
        open={weeklyDialogOpen}
        onOpenChange={setWeeklyDialogOpen}
        project={project}
      />
      <ScheduleRevisionDialog
        open={revisionDialogOpen}
        onOpenChange={setRevisionDialogOpen}
        project={project}
      />
    </div>
  );
}
