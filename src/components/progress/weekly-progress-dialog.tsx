"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { useAppState } from "@/context/app-state-context";
import { Project, WeeklyProgressRecord } from "@/types";
import { toast } from "sonner";
import {
  TrendingUp,
  UploadCloud,
  FileSignature,
  UserCheck,
  Layers,
  Loader2,
  ChevronDown,
  ChevronUp,
  History,
  Copy,
} from "lucide-react";

interface WeeklyProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  preselectedWorkItemId?: string;
}

function getCurrentWeekWindow() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmtIso = (d: Date) => d.toISOString().split("T")[0];
  const fmtShort = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  const weekNum = Math.max(
    1,
    Math.ceil(
      ((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) /
        86400000 +
        1) /
        7
    )
  );

  return {
    startDate: fmtIso(monday),
    endDate: fmtIso(sunday),
    period: `Minggu ${weekNum} (${fmtShort(monday)} - ${fmtShort(sunday)} ${sunday.getFullYear()})`,
  };
}

function sortByLatestWeekly(a: WeeklyProgressRecord, b: WeeklyProgressRecord) {
  const endDiff = (b.endDate || "").localeCompare(a.endDate || "");
  if (endDiff !== 0) return endDiff;
  return (b.recordedAt || "").localeCompare(a.recordedAt || "");
}

export function WeeklyProgressDialog({
  open,
  onOpenChange,
  project,
  preselectedWorkItemId,
}: WeeklyProgressDialogProps) {
  const { addWeeklyProgress, spkContracts, dailyProgress, weeklyProgress, userProfile } =
    useAppState();

  const projectSpks = useMemo(
    () => spkContracts.filter((s) => s.projectId === project.id && !s.deletedAt),
    [spkContracts, project.id]
  );

  const projectWeeklyLogs = useMemo(
    () =>
      weeklyProgress
        .filter((wp) => wp.projectId === project.id)
        .sort(sortByLatestWeekly),
    [weeklyProgress, project.id]
  );

  const getLatestWeeklyForItem = useCallback(
    (wiId: string) => projectWeeklyLogs.find((wp) => wp.workItemId === wiId),
    [projectWeeklyLogs]
  );

  const [workItemId, setWorkItemId] = useState(
    preselectedWorkItemId || project.workItems[0]?.id || ""
  );
  const [selectedSpkId, setSelectedSpkId] = useState<string>("none");
  const [customContractor, setCustomContractor] = useState("");
  const [period, setPeriod] = useState(() => getCurrentWeekWindow().period);
  const [startDate, setStartDate] = useState(() => getCurrentWeekWindow().startDate);
  const [endDate, setEndDate] = useState(() => getCurrentWeekWindow().endDate);
  const [plannedProgress, setPlannedProgress] = useState<number>(0);
  const [actualProgress, setActualProgress] = useState<number>(
    project.workItems.find((w) => w.id === (preselectedWorkItemId || project.workItems[0]?.id))
      ?.progress ?? 0
  );
  const [notes, setNotes] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [uploadingReport, setUploadingReport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBy, setCreatedBy] = useState(userProfile?.fullName || "");
  const [showOptional, setShowOptional] = useState(false);

  const applyDefaultsFromWorkItem = useCallback(
    (wiId: string) => {
      const targetWi = project.workItems.find((w) => w.id === wiId);
      const lastWeekly = getLatestWeeklyForItem(wiId);
      const matchingSpks = projectSpks.filter((s) => s.workItemId === wiId);

      const wiProgress = targetWi?.progress ?? 0;
      const nextActual =
        lastWeekly && wiProgress === 0 ? lastWeekly.actualProgress : wiProgress;
      const nextPlanned = lastWeekly ? lastWeekly.plannedProgress : wiProgress;

      setActualProgress(nextActual);
      setPlannedProgress(nextPlanned);

      if (lastWeekly?.spkId && projectSpks.some((s) => s.id === lastWeekly.spkId)) {
        setSelectedSpkId(lastWeekly.spkId);
        setCustomContractor("");
      } else if (lastWeekly && !lastWeekly.spkId) {
        setSelectedSpkId("none");
        setCustomContractor(
          lastWeekly.contractorName && lastWeekly.contractorName !== "Tim Swakelola Kebun"
            ? lastWeekly.contractorName
            : ""
        );
      } else if (matchingSpks.length > 0) {
        setSelectedSpkId(matchingSpks[0].id);
        setCustomContractor("");
      } else {
        setSelectedSpkId("none");
        setCustomContractor("");
      }

      setCreatedBy(lastWeekly?.createdBy || userProfile?.fullName || "");
    },
    [getLatestWeeklyForItem, project.workItems, projectSpks, userProfile?.fullName]
  );

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReport(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", project.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengunggah laporan mingguan");
      }

      setReportName(json.data.fileName);
      setReportUrl(
        json.data.webViewLink ||
          (json.data.fileId ? `/api/files/${json.data.fileId}/download` : "")
      );
      toast.success(`Laporan "${json.data.fileName}" berhasil diunggah ke Google Drive.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah laporan");
    } finally {
      setUploadingReport(false);
    }
  };

  useEffect(() => {
    if (open) {
      const win = getCurrentWeekWindow();
      const latestProjectWeekly = projectWeeklyLogs[0];
      const latestWiExists =
        latestProjectWeekly &&
        project.workItems.some((wi) => wi.id === latestProjectWeekly.workItemId);

      const initialWiId =
        preselectedWorkItemId ||
        (latestWiExists ? latestProjectWeekly.workItemId : project.workItems[0]?.id || "");

      setWorkItemId(initialWiId);
      setPeriod(win.period);
      setStartDate(win.startDate);
      setEndDate(win.endDate);
      setNotes("");
      setReportName("");
      setReportUrl("");
      setShowOptional(false);
      applyDefaultsFromWorkItem(initialWiId);
    }
  }, [open, preselectedWorkItemId, project.workItems, projectWeeklyLogs, applyDefaultsFromWorkItem]);

  const selectedWi = project.workItems.find((w) => w.id === workItemId);
  const activeSpk = projectSpks.find((s) => s.id === selectedSpkId);
  const lastWeeklyForItem = useMemo(
    () => getLatestWeeklyForItem(workItemId),
    [getLatestWeeklyForItem, workItemId]
  );
  const hasDailyLogsForItem = dailyProgress.some(
    (dp) => dp.projectId === project.id && dp.workItemId === workItemId
  );

  const handleWorkItemChange = (newWiId: string) => {
    setWorkItemId(newWiId);
    applyDefaultsFromWorkItem(newWiId);
  };

  const handleSpkChange = (newSpkId: string) => {
    setSelectedSpkId(newSpkId);
    if (newSpkId !== "none") {
      const targetSpk = projectSpks.find((s) => s.id === newSpkId);
      if (targetSpk?.workItemId) {
        setWorkItemId(targetSpk.workItemId);
        const nextWi = project.workItems.find((w) => w.id === targetSpk.workItemId);
        const lastW = getLatestWeeklyForItem(targetSpk.workItemId);
        setActualProgress(nextWi?.progress ?? lastW?.actualProgress ?? 0);
        if (lastW) setPlannedProgress(lastW.plannedProgress);
      }
    }
  };

  const currentActualProgress = Number.isFinite(actualProgress) ? actualProgress : 0;
  const variance = currentActualProgress - plannedProgress;
  const achievement =
    plannedProgress > 0
      ? Math.round((currentActualProgress / plannedProgress) * 100)
      : 100;

  const handleSubmit = async () => {
    if (!workItemId) {
      toast.error("Pilih item pekerjaan");
      return;
    }
    if (!period.trim()) {
      toast.error("Nama periode laporan wajib diisi");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Tanggal mulai dan selesai periode wajib diisi");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("Tanggal selesai periode tidak boleh lebih awal dari tanggal mulai");
      return;
    }
    if (Number.isNaN(Number(plannedProgress)) || plannedProgress < 0 || plannedProgress > 100) {
      toast.error("Rencana baseline harus bernilai 0 sampai 100%");
      return;
    }
    if (Number.isNaN(Number(actualProgress)) || actualProgress < 0 || actualProgress > 100) {
      toast.error("Realisasi aktual harus bernilai 0 sampai 100%");
      return;
    }

    const contractorName =
      activeSpk
        ? activeSpk.vendorName
        : customContractor.trim() || "Tim Swakelola Kebun";

    setIsSubmitting(true);
    try {
      const ok = await addWeeklyProgress({
        projectId: project.id,
        workItemId,
        workItemName: selectedWi?.name || "Item Pekerjaan",
        periodType: "WEEKLY",
        spkId: activeSpk ? activeSpk.id : undefined,
        spkNumber: activeSpk ? activeSpk.spkNumber : undefined,
        contractorName,
        period: period.trim(),
        startDate,
        endDate,
        plannedProgress,
        actualProgress: currentActualProgress,
        variance,
        achievement,
        notes: notes.trim() || `Laporan kemajuan mingguan ${period.trim()}`,
        reportName: reportName.trim() || undefined,
        photoUrl: reportUrl.trim() || undefined,
        createdBy: createdBy.trim() || userProfile?.fullName || "",
      });

      if (!ok) return;

      toast.success(
        `Laporan mingguan berhasil disimpan. Realisasi aktual terintegrasi otomatis: ${currentActualProgress}%.`
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent scrollable className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
            Input Progress Mingguan (Weekly S-Curve Log)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Evaluasi deviasi rencana vs realisasi fisik berkala proyek {project.code}. Realisasi aktual (%) ditarik dari capaian kumulatif lapangan.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          {/* Baris 1: Item Pekerjaan & Kontrak SPK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Item Pekerjaan (WBS) <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={workItemId}
                onValueChange={handleWorkItemChange}
                placeholder="Pilih work item..."
                searchPlaceholder="Cari item pekerjaan..."
                options={project.workItems.map((wi) => ({
                  value: wi.id,
                  label: wi.name,
                  subLabel: `Bobot: ${wi.weight}% | Realisasi: ${wi.progress}%`,
                }))}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <FileSignature className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                Kontrak SPK Pelaksana
              </label>
              <Select value={selectedSpkId} onValueChange={handleSpkChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih SPK Kontraktor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa SPK (Swakelola Kebun / Internal)</SelectItem>
                  {projectSpks.map((spk) => {
                    const isMatch = spk.workItemId === workItemId;
                    return (
                      <SelectItem key={spk.id} value={spk.id}>
                        {spk.spkNumber} - {spk.vendorName}
                        {isMatch ? " [Terkait WBS]" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSpkId === "none" && (
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground block">
                Nama Pelaksana / Kontraktor Swakelola
              </label>
              <Input
                value={customContractor}
                onChange={(e) => setCustomContractor(e.target.value)}
                placeholder="Tim Swakelola Kebun"
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Referensi Laporan Mingguan Terakhir */}
          {lastWeeklyForItem && (
            <div className="px-3 py-2 rounded-md border bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 text-indigo-950 dark:text-indigo-200">
                <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">
                  Terakhir ({lastWeeklyForItem.period}): Rencana{" "}
                  <strong className="font-mono">{lastWeeklyForItem.plannedProgress}%</strong> | Realisasi{" "}
                  <strong className="font-mono">{lastWeeklyForItem.actualProgress}%</strong>
                </span>
              </div>
              {lastWeeklyForItem.notes && (
                <button
                  type="button"
                  onClick={() => {
                    setNotes(lastWeeklyForItem.notes);
                    setShowOptional(true);
                  }}
                  className="px-2 py-1 rounded border border-indigo-300 dark:border-indigo-800 bg-background hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-[11px] font-medium text-indigo-800 dark:text-indigo-200 inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  Salin Catatan
                </button>
              )}
            </div>
          )}

          {/* Baris 2: Periode & Rentang Tanggal (3 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 space-y-1">
              <label className="font-semibold text-foreground block">
                Nama Periode Laporan <span className="text-rose-500">*</span>
              </label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Contoh: Minggu 14 (26 Okt - 01 Nov 2026)"
                className="h-9 text-xs"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <label className="font-semibold text-foreground block">Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <label className="font-semibold text-foreground block">Selesai</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Baris 3: Rencana, Realisasi & Ringkasan Deviasi (3 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <label htmlFor="weekly-planned-progress" className="font-semibold text-foreground block">
                Rencana Baseline (%) <span className="text-rose-500">*</span>
              </label>
              <Input
                id="weekly-planned-progress"
                type="number"
                min="0"
                max="100"
                value={plannedProgress}
                onChange={(e) => setPlannedProgress(Number(e.target.value))}
                className="h-9 font-mono font-bold text-xs"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="weekly-actual-progress" className="font-semibold text-foreground block">
                Realisasi Aktual (%) <span className="text-rose-500">*</span>
              </label>
              <Input
                id="weekly-actual-progress"
                type="number"
                min="0"
                max="100"
                value={actualProgress}
                onChange={(e) => setActualProgress(Number(e.target.value))}
                className="h-9 font-mono font-bold text-xs border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              />
            </div>

            <div className="h-9 px-3 rounded-md bg-muted/40 border flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block leading-none">Deviasi</span>
                <span
                  className={`font-mono font-bold ${
                    variance >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {variance >= 0 ? `+${variance}%` : `${variance}%`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block leading-none">Capaian</span>
                <span className="font-mono font-bold text-foreground">{achievement}%</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {selectedWi?.progressMode === "Daily" && hasDailyLogsForItem
              ? `Nilai awal diambil dari akumulasi log harian (${selectedWi.progress}%), dan dapat disesuaikan untuk evaluasi mingguan.`
              : currentActualProgress >= 100
              ? "Capaian 100% menandai item selesai dan menampilkan tanda centang pada Gantt Chart."
              : currentActualProgress > 0
              ? "Capaian di atas 0% menampilkan simbol # pada minggu periode laporan di Gantt Chart."
              : "Isi realisasi aktual di atas 0% agar progres tercatat pada Kurva S dan Gantt Chart."}
          </p>

          {/* Baris 4: Collapsible Detail Tambahan */}
          <div className="rounded-md border bg-muted/20">
            <button
              type="button"
              onClick={() => setShowOptional((prev) => !prev)}
              aria-expanded={showOptional}
              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted/40 transition-colors rounded-md cursor-pointer"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                <span className="font-semibold text-foreground">
                  Catatan Evaluasi, Pelapor & Lampiran PDF (Opsional)
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  Pelapor: {createdBy || userProfile?.fullName || "-"}
                  {reportName ? ` | PDF: ${reportName}` : ""}
                </span>
              </div>
              {showOptional ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {showOptional && (
              <div className="px-3 pb-3 pt-2 border-t space-y-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground block">Catatan Evaluasi Kendala</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Evaluasi kendala material, alat, atau cuaca minggu ini..."
                    rows={2}
                    className="text-xs resize-none bg-background"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                      Penyusun / Pelapor
                    </label>
                    <Input
                      value={createdBy}
                      onChange={(e) => setCreatedBy(e.target.value)}
                      placeholder="Nama penyusun laporan mingguan..."
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Lampiran Laporan Resmi (PDF)</span>
                      {uploadingReport && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-normal">
                          <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah...
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        placeholder="Nama berkas atau unggah PDF"
                        className="h-8 text-xs bg-background"
                      />
                      <label className="h-8 px-2.5 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 text-foreground transition-colors gap-1">
                        <UploadCloud className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>PDF</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="application/pdf"
                          onChange={handleReportUpload}
                          disabled={uploadingReport}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingReport}
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Laporan Mingguan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
