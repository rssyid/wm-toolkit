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
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileSignature,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DailyProgressDialog } from "@/components/progress/daily-progress-dialog";
import { WeeklyProgressDialog } from "@/components/progress/weekly-progress-dialog";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, cn } from "@/lib/utils";

export default function ProgressTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, dailyProgress, weeklyProgress, spkContracts } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const [dailyDialogOpen, setDailyDialogOpen] = useState(false);
  const [weeklyDialogOpen, setWeeklyDialogOpen] = useState(false);

  // Filters state
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  if (!project) return null;

  const projectDaily = dailyProgress.filter((d) => d.projectId === projectId);
  const projectWeekly = weeklyProgress.filter((w) => w.projectId === projectId);
  const projectSpks = spkContracts.filter((s) => s.projectId === projectId);

  // Filtered lists
  const filteredDaily = useMemo(() => {
    return projectDaily.filter((d) => {
      const matchWi = selectedWorkItemId === "all" || d.workItemId === selectedWorkItemId;
      const matchSearch =
        !searchKeyword.trim() ||
        d.activity.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        d.workItemName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (d.contractorName && d.contractorName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (d.notes && d.notes.toLowerCase().includes(searchKeyword.toLowerCase()));
      return matchWi && matchSearch;
    });
  }, [projectDaily, selectedWorkItemId, searchKeyword]);

  const filteredWeekly = useMemo(() => {
    return projectWeekly.filter((w) => {
      const matchWi = selectedWorkItemId === "all" || w.workItemId === selectedWorkItemId;
      const matchSearch =
        !searchKeyword.trim() ||
        w.period.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        w.workItemName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (w.contractorName && w.contractorName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (w.notes && w.notes.toLowerCase().includes(searchKeyword.toLowerCase()));
      return matchWi && matchSearch;
    });
  }, [projectWeekly, selectedWorkItemId, searchKeyword]);

  // Dynamic S-Curve Generation based on project weekly logs & baseline
  const chartData = useMemo(() => {
    const sortedWeekly = [...projectWeekly].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    if (sortedWeekly.length > 0) {
      const points = sortedWeekly.map((w, idx) => {
        const match = w.period.match(/Minggu\s+(\d+)/i);
        const label = match ? `M${match[1]}` : `W${idx + 1}`;
        return {
          week: label,
          periodLabel: w.period,
          planned: w.plannedProgress,
          actual: w.actualProgress,
          variance: w.variance,
        };
      });

      const lastPoint = points[points.length - 1];
      if (lastPoint.planned < 100) {
        const nextWeekNum = parseInt(lastPoint.week.replace(/\D/g, "") || "1", 10) + 1;
        const remainingWeeks = Math.max(1, Math.ceil((100 - lastPoint.planned) / 10));
        for (let i = 0; i < Math.min(3, remainingWeeks); i++) {
          const wNum = nextWeekNum + i;
          const plannedStep = Math.min(
            100,
            lastPoint.planned +
              Math.round(((100 - lastPoint.planned) / (remainingWeeks + 1)) * (i + 1))
          );
          points.push({
            week: `M${wNum}`,
            periodLabel: `Minggu ${wNum} (Target)`,
            planned: i === remainingWeeks - 1 ? 100 : plannedStep,
            actual: null as any,
            variance: 0,
          });
        }
      }
      return points;
    }

    // Default baseline S-Curve if no weekly logs yet
    const cur = project.progress || 0;
    return [
      { week: "M1", periodLabel: "Minggu 1", planned: 10, actual: cur >= 10 ? 10 : (cur > 0 ? cur : null) },
      { week: "M2", periodLabel: "Minggu 2", planned: 25, actual: cur >= 25 ? 25 : null },
      { week: "M3", periodLabel: "Minggu 3", planned: 45, actual: cur >= 45 ? 45 : null },
      { week: "M4", periodLabel: "Minggu 4", planned: 65, actual: cur >= 65 ? 65 : null },
      { week: "M5", periodLabel: "Minggu 5", planned: 85, actual: cur >= 85 ? cur : null },
      { week: "M6", periodLabel: "Minggu 6 (Target)", planned: 100, actual: cur >= 100 ? 100 : null },
    ];
  }, [projectWeekly, project.progress]);

  // Executive KPI Metrics Calculation
  const latestWeekly = projectWeekly[0];
  const targetBaselinePercent = latestWeekly ? latestWeekly.plannedProgress : Math.min(100, project.progress + 5);
  const variancePercent = project.progress - targetBaselinePercent;

  const avgManpower =
    projectDaily.length > 0
      ? Math.round(
          projectDaily.reduce((sum, d) => sum + (d.manpower || 0), 0) / projectDaily.length
        )
      : 0;

  const avgAchievement =
    projectWeekly.length > 0
      ? Math.round(
          projectWeekly.reduce((sum, w) => sum + (w.achievement || 100), 0) / projectWeekly.length
        )
      : 100;

  const activeSpks = projectSpks.filter((s) => s.status === "ACTIVE");

  return (
    <div className="space-y-5">
      {/* 1. Header Bar & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-foreground">
              Pelaksanaan Fisik & Pemantauan Kurva-S (Tahap 4B.4)
            </h3>
            <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/40 text-emerald-600 bg-emerald-50/50">
              Jalur Jasa Aktif
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grafik komparasi rencana vs realisasi kumulatif fisik, log aktivitas lapangan, dan evaluasi mingguan rekanan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDailyDialogOpen(true)}
            className="gap-1.5 text-xs h-8 border-amber-500/30 hover:bg-amber-50/40 text-foreground"
          >
            <HardHat className="w-3.5 h-3.5 text-amber-500" /> + Log Harian Lapangan
          </Button>
          <Button
            size="sm"
            onClick={() => setWeeklyDialogOpen(true)}
            className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <TrendingUp className="w-3.5 h-3.5" /> + Laporan Mingguan Resmi
          </Button>
        </div>
      </div>

      {/* 2. Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Realisasi Fisik Kumulatif */}
        <Card className="shadow-xs border border-border/80 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="font-medium">Progress Fisik Kumulatif</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-600 tracking-tight">
                {project.progress}%
              </span>
              <span className="text-[11px] text-muted-foreground">
                / Target {targetBaselinePercent}%
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Progress value={project.progress} className="h-2 bg-muted [&>div]:bg-emerald-600" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Baseline Mulai</span>
              <span className="font-medium text-foreground">
                {project.progress >= 100 ? "Selesai 100%" : `${100 - project.progress}% Sisa`}
              </span>
            </div>
          </div>
        </Card>

        {/* KPI 2: Deviasi Jadwal & Varians */}
        <Card className="shadow-xs border border-border/80 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="font-medium">Deviasi Fisik & Jadwal</span>
              {variancePercent >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-2xl font-bold font-mono tracking-tight",
                  variancePercent >= 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {variancePercent >= 0 ? `+${variancePercent}%` : `${variancePercent}%`}
              </span>
              <Badge
                variant={variancePercent >= 0 ? "default" : "destructive"}
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 font-normal",
                  variancePercent >= 0 && "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                )}
              >
                {variancePercent >= 0 ? "Ahead of Schedule" : "Behind Schedule"}
              </Badge>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground flex items-center justify-between border-t pt-2">
            <span>Varians Kalender:</span>
            <span className="font-mono font-semibold text-foreground">
              {project.scheduleVarianceDays === 0
                ? "Tepat Waktu (0 Hari)"
                : project.scheduleVarianceDays > 0
                ? `${project.scheduleVarianceDays} Hari Terlambat`
                : `${Math.abs(project.scheduleVarianceDays)} Hari Lebih Cepat`}
            </span>
          </div>
        </Card>

        {/* KPI 3: Log Harian & Lapangan */}
        <Card className="shadow-xs border border-border/80 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="font-medium">Log Harian Lapangan</span>
              <HardHat className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
                {projectDaily.length}
              </span>
              <span className="text-xs text-muted-foreground">Catatan Harian</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground flex items-center justify-between border-t pt-2">
            <span className="flex items-center gap-1">
              <FileSignature className="w-3 h-3 text-muted-foreground" /> SPK Terlibat:
            </span>
            <span className="font-mono font-semibold text-foreground">{projectSpks.length} Kontrak</span>
          </div>
        </Card>

        {/* KPI 4: Laporan Mingguan & Rekanan SPK */}
        <Card className="shadow-xs border border-border/80 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="font-medium">Laporan Mingguan & SPK</span>
              <FileSignature className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
                {projectWeekly.length}
              </span>
              <span className="text-xs text-muted-foreground">Laporan Resmi</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground flex items-center justify-between border-t pt-2">
            <span>Rata-rata Pencapaian:</span>
            <span className="font-mono font-semibold text-emerald-600">{avgAchievement}%</span>
          </div>
        </Card>
      </div>

      {/* 3. S-Curve Dynamic Chart Card */}
      <Card className="shadow-xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Kurva S Rencana vs Realisasi Fisik Kumulatif (%)
              </h4>
              <Badge variant="outline" className="text-[10px] font-mono">
                {chartData.length} Titik Evaluasi
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Integrasi kumulatif seluruh work items: Realisasi saat ini <b>{project.progress}%</b> vs Target Baseline <b>{targetBaselinePercent}%</b>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-3 h-0.5 bg-slate-400 inline-block"></span> Rencana Baseline
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span> Realisasi Fisik Aktual
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <RechartsTooltip
                formatter={(val: any, name: any) => [
                  `${val}%`,
                  name === "planned" ? "Rencana Baseline" : "Realisasi Aktual",
                ]}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.periodLabel || `Minggu ${label}`;
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="planned"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="planned"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#059669"
                strokeWidth={3}
                name="actual"
                dot={{ r: 4, fill: "#059669" }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 4. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30 p-2.5 rounded-lg border">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Cari aktivitas, catatan, kontraktor..."
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <div className="w-48 sm:w-60">
            <Select
              value={selectedWorkItemId}
              onValueChange={(val) => setSelectedWorkItemId(val)}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Semua Item Pekerjaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Item Pekerjaan ({project.workItems.length})</SelectItem>
                {project.workItems.map((wi) => (
                  <SelectItem key={wi.id} value={wi.id}>
                    {wi.name} ({wi.progress}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground shrink-0">
          Menampilkan <b>{filteredDaily.length}</b> log harian &bull; <b>{filteredWeekly.length}</b> laporan mingguan
        </div>
      </div>

      {/* 5. Daily & Weekly Logs Switcher Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="daily" className="text-xs gap-1.5">
            <HardHat className="w-3.5 h-3.5 text-amber-500" />
            Catatan Harian Lapangan ({filteredDaily.length})
          </TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            Laporan Mingguan Resmi ({filteredWeekly.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Daily Logs Table */}
        <TabsContent value="daily" className="mt-3">
          <Card className="shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-[100px]">Tanggal</TableHead>
                    <TableHead className="w-[200px]">Item Pekerjaan & SPK</TableHead>
                    <TableHead className="min-w-[200px]">Aktivitas Fisik Lapangan</TableHead>
                    <TableHead className="text-right">Target SPK</TableHead>
                    <TableHead className="text-right">Hasil Hari Ini</TableHead>
                    <TableHead className="text-right">Sisa Target SPK</TableHead>
                    <TableHead className="text-right">Capaian % (Auto)</TableHead>
                    <TableHead>Cuaca</TableHead>
                    <TableHead>Pengawas</TableHead>
                    <TableHead className="text-right">Dokumentasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDaily.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-xs text-muted-foreground">
                        {searchKeyword || selectedWorkItemId !== "all"
                          ? "Tidak ada catatan harian yang sesuai filter."
                          : "Belum ada log progress harian yang dicatat. Klik '+ Log Harian Lapangan' untuk menambahkan."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDaily.map((d) => (
                      <TableRow key={d.id} className="text-xs hover:bg-muted/30">
                        <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                          {formatIDDate(d.date)}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{d.workItemName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {d.spkNumber ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                <FileSignature className="w-2.5 h-2.5" /> {d.spkNumber}
                              </span>
                            ) : null}
                            <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                              {d.contractorName || "Swakelola"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <p className="line-clamp-2">{d.activity}</p>
                          {d.notes && (
                            <p className="text-[11px] text-muted-foreground italic mt-0.5">
                              Catatan: {d.notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-right text-muted-foreground">
                          {d.targetVolume || d.plannedVolume ? `${d.targetVolume || d.plannedVolume} ${d.unit || ""}` : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-right font-bold text-foreground">
                          {d.actualVolume ? (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              +{d.actualVolume} {d.unit || ""}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-right font-medium text-amber-700 dark:text-amber-400">
                          {d.remainingVolume !== undefined ? `${d.remainingVolume} ${d.unit || ""}` : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-right font-bold text-emerald-600">
                          {d.progressPercent}%
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "text-[11px] px-2 py-0.5 rounded font-medium",
                              d.weather === "Cerah" && "bg-amber-100 text-amber-800",
                              d.weather === "Berawan" && "bg-slate-100 text-slate-800",
                              d.weather === "Hujan" && "bg-blue-100 text-blue-800"
                            )}
                          >
                            {d.weather === "Cerah" && "☀️ "}
                            {d.weather === "Berawan" && "⛅ "}
                            {d.weather === "Hujan" && "🌧️ "}
                            {d.weather}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[11px] whitespace-nowrap">
                          {d.createdBy || "Pengawas"}
                        </TableCell>
                        <TableCell className="text-right">
                          <AttachmentPreview
                            filename={d.photoName || `Foto_${d.date}.jpg`}
                            title={`Dokumentasi Fisik Lapangan - ${formatIDDate(d.date)}`}
                            description={d.activity}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Weekly Logs Table */}
        <TabsContent value="weekly" className="mt-3">
          <Card className="shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-[180px]">Periode Laporan</TableHead>
                    <TableHead className="w-[190px]">Item Pekerjaan & SPK</TableHead>
                    <TableHead className="text-right">Rencana (%)</TableHead>
                    <TableHead className="text-right">Realisasi (%)</TableHead>
                    <TableHead className="text-right">Deviasi</TableHead>
                    <TableHead className="text-right">Pencapaian</TableHead>
                    <TableHead className="min-w-[200px]">Evaluasi / Kendala</TableHead>
                    <TableHead>Penyusun</TableHead>
                    <TableHead className="text-right">Laporan Resmi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWeekly.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-xs text-muted-foreground">
                        {searchKeyword || selectedWorkItemId !== "all"
                          ? "Tidak ada laporan mingguan yang sesuai filter."
                          : "Belum ada laporan progress mingguan untuk proyek ini. Klik '+ Laporan Mingguan Resmi' untuk menambahkan."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWeekly.map((w) => (
                      <TableRow key={w.id} className="text-xs hover:bg-muted/30">
                        <TableCell className="font-semibold text-foreground whitespace-nowrap">
                          <div>{w.period}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {formatIDDate(w.startDate)} - {formatIDDate(w.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-foreground font-medium">{w.workItemName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {w.spkNumber ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                <FileSignature className="w-2.5 h-2.5" /> {w.spkNumber}
                              </span>
                            ) : null}
                            <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                              {w.contractorName || "Swakelola"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-right text-muted-foreground">
                          {w.plannedProgress}%
                        </TableCell>
                        <TableCell className="font-mono font-bold text-right text-emerald-600">
                          {w.actualProgress}%
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono font-bold text-right",
                            w.variance >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}
                        >
                          {w.variance >= 0 ? `+${w.variance}%` : `${w.variance}%`}
                        </TableCell>
                        <TableCell className="font-mono text-right font-medium text-foreground">
                          {w.achievement}%
                        </TableCell>
                        <TableCell className="italic text-muted-foreground">
                          "{w.notes}"
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[11px] whitespace-nowrap">
                          {w.createdBy || "Project Manager"}
                        </TableCell>
                        <TableCell className="text-right">
                          <AttachmentPreview
                            filename={w.reportName || `Laporan_${w.period.slice(0, 8)}.pdf`}
                            title={`Laporan Mingguan Resmi ${w.period}`}
                            description={w.notes}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Modals */}
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
    </div>
  );
}
