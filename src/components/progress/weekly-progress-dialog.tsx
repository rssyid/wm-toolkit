"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { Project } from "@/types";
import { toast } from "sonner";
import {
  TrendingUp,
  UploadCloud,
  FileSignature,
  UserCheck,
  Layers,
  Loader2,
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

export function WeeklyProgressDialog({
  open,
  onOpenChange,
  project,
  preselectedWorkItemId,
}: WeeklyProgressDialogProps) {
  const { addWeeklyProgress, spkContracts, dailyProgress, userProfile } = useAppState();

  const projectSpks = useMemo(
    () => spkContracts.filter((s) => s.projectId === project.id && !s.deletedAt),
    [spkContracts, project.id]
  );

  const [workItemId, setWorkItemId] = useState(
    preselectedWorkItemId || project.workItems[0]?.id || ""
  );
  const [selectedSpkId, setSelectedSpkId] = useState<string>("none");
  const [customContractor, setCustomContractor] = useState("");
  const [period, setPeriod] = useState(() => getCurrentWeekWindow().period);
  const [startDate, setStartDate] = useState(() => getCurrentWeekWindow().startDate);
  const [endDate, setEndDate] = useState(() => getCurrentWeekWindow().endDate);
  const [plannedProgress, setPlannedProgress] = useState<number>(85);
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
      toast.success(`Laporan "${json.data.fileName}" berhasil diunggah ke Google Drive!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah laporan");
    } finally {
      setUploadingReport(false);
    }
  };

  useEffect(() => {
    if (open) {
      const win = getCurrentWeekWindow();
      const initialWiId = preselectedWorkItemId || project.workItems[0]?.id || "";
      const initialWi = project.workItems.find((w) => w.id === initialWiId);
      setWorkItemId(initialWiId);
      setActualProgress(initialWi?.progress ?? 0);
      setPeriod(win.period);
      setStartDate(win.startDate);
      setEndDate(win.endDate);
      setCustomContractor("");
      setNotes("");
      setReportName("");
      setReportUrl("");
      setCreatedBy(userProfile?.fullName || "");

      const matchingSpks = projectSpks.filter((s) => s.workItemId === initialWiId);
      if (matchingSpks.length > 0) {
        setSelectedSpkId(matchingSpks[0].id);
      } else {
        setSelectedSpkId("none");
      }
    }
  }, [open, preselectedWorkItemId, project.workItems, projectSpks, userProfile?.fullName]);

  const selectedWi = project.workItems.find((w) => w.id === workItemId);
  const activeSpk = projectSpks.find((s) => s.id === selectedSpkId);
  const hasDailyLogsForItem = dailyProgress.some(
    (dp) => dp.projectId === project.id && dp.workItemId === workItemId
  );

  const handleWorkItemChange = (newWiId: string) => {
    setWorkItemId(newWiId);
    const nextWi = project.workItems.find((w) => w.id === newWiId);
    setActualProgress(nextWi?.progress ?? 0);
    const matchingSpks = projectSpks.filter((s) => s.workItemId === newWiId);
    if (matchingSpks.length > 0) {
      setSelectedSpkId(matchingSpks[0].id);
    } else {
      setSelectedSpkId("none");
    }
  };

  const handleSpkChange = (newSpkId: string) => {
    setSelectedSpkId(newSpkId);
    if (newSpkId !== "none") {
      const targetSpk = projectSpks.find((s) => s.id === newSpkId);
      if (targetSpk?.workItemId) {
        setWorkItemId(targetSpk.workItemId);
        const nextWi = project.workItems.find((w) => w.id === targetSpk.workItemId);
        setActualProgress(nextWi?.progress ?? 0);
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
        `Laporan mingguan berhasil disimpan! Realisasi aktual terintegrasi otomatis: ${currentActualProgress}%.`
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Input Progress Mingguan (Weekly S-Curve Log)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Evaluasi deviasi rencana vs realisasi fisik berkala untuk proyek {project.code}. Realisasi aktual (%) ditarik otomatis dari progress kumulatif lapangan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 text-xs">
          {/* Item Pekerjaan (Chained) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Item Pekerjaan (WBS) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Terkoneksi ke SPK
              </span>
            </div>
            <SearchableSelect
              value={workItemId}
              onValueChange={handleWorkItemChange}
              placeholder="Pilih work item..."
              searchPlaceholder="Cari item pekerjaan..."
              options={project.workItems.map((wi) => ({
                value: wi.id,
                label: wi.name,
                subLabel: `Bobot: ${wi.weight}% • Realisasi saat ini: ${wi.progress}%`,
              }))}
            />
          </div>

          {/* SPK Rekanan Selection (Chained) */}
          <div>
            <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-indigo-500" />
              Kontrak SPK Pelaksana (Jasa Rekanan)
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
                      {spk.spkNumber} &bull; {spk.vendorName}
                      {isMatch ? " [Terkait WBS]" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedSpkId === "none" && (
              <Input
                value={customContractor}
                onChange={(e) => setCustomContractor(e.target.value)}
                placeholder="Nama pelaksana / kontraktor (contoh: Tim Swakelola Kebun)"
                className="mt-1.5 text-xs"
              />
            )}
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Nama Periode Laporan <span className="text-rose-500">*</span>
            </label>
            <Input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Contoh: Minggu 14 (26 Okt - 01 Nov 2026)"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-foreground block mb-1">Tanggal Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Tanggal Selesai</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Progress Comparation: Plan Input & Actual Input */}
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label htmlFor="weekly-planned-progress" className="font-semibold text-foreground block mb-1">
                Rencana Baseline (%) <span className="text-rose-500">*</span>
              </label>
              <Input
                id="weekly-planned-progress"
                type="number"
                min="0"
                max="100"
                value={plannedProgress}
                onChange={(e) => setPlannedProgress(Number(e.target.value))}
                className="font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label htmlFor="weekly-actual-progress" className="font-semibold text-foreground block mb-1">
                Realisasi Aktual (%) <span className="text-rose-500">*</span>
              </label>
              <Input
                id="weekly-actual-progress"
                type="number"
                min="0"
                max="100"
                value={actualProgress}
                onChange={(e) => setActualProgress(Number(e.target.value))}
                className="font-mono font-bold text-xs border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {selectedWi?.progressMode === "Daily" && hasDailyLogsForItem
              ? `Nilai awal diambil dari akumulasi log harian (${selectedWi.progress}%), dan dapat disesuaikan untuk evaluasi mingguan.`
              : currentActualProgress >= 100
              ? "Capaian 100% akan menandai item selesai dan menampilkan tanda centang pada Gantt Chart."
              : currentActualProgress > 0
              ? "Capaian di atas 0% akan menampilkan simbol # pada minggu periode laporan di Gantt Chart."
              : "Isi realisasi aktual di atas 0% agar progres tercatat pada Kurva S dan Gantt Chart."}
          </p>

          {/* Auto calculated Variance & Achievement Indicator */}
          <div className="p-2.5 rounded-lg bg-muted/40 border grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">Deviasi (Actual - Plan):</span>
              <span
                className={`font-mono text-xs font-bold ${
                  variance >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {variance >= 0 ? `+${variance}% (Lebih Cepat)` : `${variance}% (Terlambat)`}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px]">Tingkat Pencapaian:</span>
              <span className="font-mono text-xs font-bold text-foreground">
                {achievement}%
              </span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
              Penyusun / Pelapor
            </label>
            <Input
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="Nama penyusun laporan mingguan..."
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Catatan Evaluasi Kendala</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Evaluasi kendala material, alat, atau cuaca minggu ini..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground flex items-center justify-between mb-1">
              <span>Lampiran Laporan Mingguan Resmi (PDF, Opsional)</span>
              {uploadingReport && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-normal">
                  <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah ke Drive...
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Nama berkas atau unggah PDF ke Google Drive"
                className="text-xs"
              />
              <label className="h-9 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 text-foreground transition-colors gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Unggah PDF</span>
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

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
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
