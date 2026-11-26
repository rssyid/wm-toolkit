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
import { DailyProgressRecord, Project } from "@/types";
import { toast } from "sonner";
import {
  HardHat,
  FileSignature,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowDownRight,
  UploadCloud,
  Loader2,
  Sun,
  CloudSun,
  CloudRain,
  ChevronDown,
  ChevronUp,
  History,
  Copy,
} from "lucide-react";

interface DailyProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  preselectedWorkItemId?: string;
}

function sortByLatestDaily(a: DailyProgressRecord, b: DailyProgressRecord) {
  const dateDiff = (b.date || "").localeCompare(a.date || "");
  if (dateDiff !== 0) return dateDiff;
  return (b.recordedAt || "").localeCompare(a.recordedAt || "");
}

function formatShortDate(isoDate?: string) {
  if (!isoDate) return "-";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export function DailyProgressDialog({
  open,
  onOpenChange,
  project,
  preselectedWorkItemId,
}: DailyProgressDialogProps) {
  const { addDailyProgress, spkContracts, dailyProgress, userProfile } = useAppState();

  const projectSpks = useMemo(
    () => spkContracts.filter((s) => s.projectId === project.id && !s.deletedAt),
    [spkContracts, project.id]
  );

  const projectDailyLogs = useMemo(
    () =>
      dailyProgress
        .filter((dp) => dp.projectId === project.id && dp.periodType !== "WEEKLY")
        .sort(sortByLatestDaily),
    [dailyProgress, project.id]
  );

  const getLatestLogForWorkItem = useCallback(
    (wiId: string) => projectDailyLogs.find((dp) => dp.workItemId === wiId),
    [projectDailyLogs]
  );

  const [workItemId, setWorkItemId] = useState(
    preselectedWorkItemId || project.workItems[0]?.id || ""
  );
  const [selectedSpkId, setSelectedSpkId] = useState<string>("none");
  const [customContractor, setCustomContractor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [activity, setActivity] = useState("");
  const [actualVolume, setActualVolume] = useState<number | "">("");
  const [swakelolaPlannedVolume, setSwakelolaPlannedVolume] = useState<number | "">("");
  const [unit, setUnit] = useState("M3");
  const [weather, setWeather] = useState<"Cerah" | "Hujan" | "Berawan">("Cerah");
  const [notes, setNotes] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBy, setCreatedBy] = useState(userProfile?.fullName || "");
  const [showOptional, setShowOptional] = useState(false);

  const applyDefaultsFromWorkItem = useCallback(
    (wiId: string) => {
      const lastLog = getLatestLogForWorkItem(wiId);
      const matchingSpks = projectSpks.filter((s) => s.workItemId === wiId);

      if (lastLog?.spkId && projectSpks.some((s) => s.id === lastLog.spkId)) {
        const spk = projectSpks.find((s) => s.id === lastLog.spkId);
        setSelectedSpkId(lastLog.spkId);
        setCustomContractor("");
        setSwakelolaPlannedVolume("");
        setUnit(spk?.unit || lastLog.unit || "M3");
      } else if (matchingSpks.length > 0 && !lastLog) {
        setSelectedSpkId(matchingSpks[0].id);
        setCustomContractor("");
        setSwakelolaPlannedVolume("");
        setUnit(matchingSpks[0].unit || "M3");
      } else if (lastLog && !lastLog.spkId) {
        setSelectedSpkId("none");
        setCustomContractor(
          lastLog.contractorName && lastLog.contractorName !== "Tim Swakelola Kebun"
            ? lastLog.contractorName
            : ""
        );
        const lastTarget = lastLog.plannedVolume ?? lastLog.targetVolume;
        setSwakelolaPlannedVolume(lastTarget && lastTarget > 0 ? lastTarget : "");
        setUnit(lastLog.unit || "M3");
      } else if (matchingSpks.length > 0) {
        setSelectedSpkId(matchingSpks[0].id);
        setCustomContractor("");
        setSwakelolaPlannedVolume("");
        setUnit(matchingSpks[0].unit || "M3");
      } else {
        setSelectedSpkId("none");
        setCustomContractor("");
        setSwakelolaPlannedVolume("");
        setUnit("M3");
      }

      if (lastLog?.createdBy) {
        setCreatedBy(lastLog.createdBy);
      } else {
        setCreatedBy(userProfile?.fullName || "");
      }
    },
    [getLatestLogForWorkItem, projectSpks, userProfile?.fullName]
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
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
        throw new Error(json.error || "Gagal mengunggah foto lapangan");
      }

      setPhotoName(json.data.fileName);
      setPhotoUrl(
        json.data.webViewLink ||
          (json.data.fileId ? `/api/files/${json.data.fileId}/download` : "")
      );
      toast.success(`Foto "${json.data.fileName}" berhasil diunggah ke Google Drive.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (open) {
      const latestProjectLog = projectDailyLogs[0];
      const latestWiExists =
        latestProjectLog &&
        project.workItems.some((wi) => wi.id === latestProjectLog.workItemId);

      const initialWiId =
        preselectedWorkItemId ||
        (latestWiExists ? latestProjectLog.workItemId : project.workItems[0]?.id || "");

      setWorkItemId(initialWiId);
      setDate(new Date().toISOString().split("T")[0]);
      setActivity("");
      setActualVolume("");
      setNotes("");
      setPhotoName("");
      setPhotoUrl("");
      setShowOptional(false);
      applyDefaultsFromWorkItem(initialWiId);
    }
  }, [open, preselectedWorkItemId, project.workItems, projectDailyLogs, applyDefaultsFromWorkItem]);

  const selectedWi = project.workItems.find((w) => w.id === workItemId);
  const activeSpk = projectSpks.find((s) => s.id === selectedSpkId);
  const lastLogForItem = useMemo(
    () => getLatestLogForWorkItem(workItemId),
    [getLatestLogForWorkItem, workItemId]
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
      }
      if (targetSpk?.unit) {
        setUnit(targetSpk.unit);
      }
    } else if (lastLogForItem && !lastLogForItem.spkId) {
      const lastTarget = lastLogForItem.plannedVolume ?? lastLogForItem.targetVolume;
      if (lastTarget && lastTarget > 0) setSwakelolaPlannedVolume(lastTarget);
      if (lastLogForItem.unit) setUnit(lastLogForItem.unit);
      if (lastLogForItem.contractorName && lastLogForItem.contractorName !== "Tim Swakelola Kebun") {
        setCustomContractor(lastLogForItem.contractorName);
      }
    }
  };

  const priorRealizedVolume =
    selectedSpkId !== "none"
      ? dailyProgress
          .filter((dp) => dp.spkId === selectedSpkId && dp.projectId === project.id)
          .reduce((sum, d) => sum + (d.actualVolume || 0), 0)
      : dailyProgress
          .filter(
            (dp) =>
              dp.projectId === project.id &&
              dp.workItemId === workItemId &&
              !dp.spkId &&
              dp.periodType === "DAILY"
          )
          .reduce((sum, d) => sum + (d.actualVolume || 0), 0);

  const spkTargetVolume = activeSpk?.targetVolume || 0;
  const effectiveTarget =
    activeSpk && spkTargetVolume > 0
      ? spkTargetVolume
      : typeof swakelolaPlannedVolume === "number"
      ? swakelolaPlannedVolume
      : 0;

  const priorRemainingVolume =
    effectiveTarget > 0 ? Math.max(0, effectiveTarget - priorRealizedVolume) : 0;

  const actVolNum = typeof actualVolume === "number" ? actualVolume : 0;
  const newCumulativeVolume = priorRealizedVolume + actVolNum;
  const newRemainingVolume = Math.max(0, priorRemainingVolume - actVolNum);

  const autoCalculatedPercent =
    effectiveTarget > 0
      ? Math.min(100, Math.round((newCumulativeVolume / effectiveTarget) * 100))
      : selectedWi?.progress || 0;

  const isOverTarget = activeSpk && spkTargetVolume > 0 && actVolNum > priorRemainingVolume;

  const handleSubmit = async () => {
    if (!date) {
      toast.error("Tanggal kegiatan wajib diisi");
      return;
    }
    if (!activity.trim()) {
      toast.error("Deskripsi aktivitas fisik harian wajib diisi");
      return;
    }
    if (!workItemId) {
      toast.error("Pilih item pekerjaan");
      return;
    }
    if (typeof actualVolume !== "number" || actualVolume <= 0) {
      toast.error("Volume aktual / hasil kerja hari ini harus lebih besar dari 0");
      return;
    }

    const contractorName =
      activeSpk
        ? activeSpk.vendorName
        : customContractor.trim() || "Tim Swakelola Kebun";

    setIsSubmitting(true);
    try {
      const ok = await addDailyProgress({
        projectId: project.id,
        workItemId,
        workItemName: selectedWi?.name || "Item Pekerjaan",
        periodType: "DAILY",
        spkId: activeSpk ? activeSpk.id : undefined,
        spkNumber: activeSpk ? activeSpk.spkNumber : undefined,
        contractorName,
        date,
        activity: activity.trim(),
        targetVolume: effectiveTarget > 0 ? effectiveTarget : undefined,
        plannedVolume: effectiveTarget > 0 ? effectiveTarget : undefined,
        actualVolume: actVolNum,
        cumulativeVolume: newCumulativeVolume,
        remainingVolume: newRemainingVolume,
        unit,
        progressPercent: autoCalculatedPercent,
        weather,
        notes: notes.trim(),
        photoName: photoName.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        createdBy: createdBy.trim() || userProfile?.fullName || "",
      });

      if (!ok) return;

      toast.success(
        `Log harian berhasil disimpan. Target terpotong ${actVolNum} ${unit}, capaian otomatis menjadi ${autoCalculatedPercent}%.`
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
            <HardHat className="w-4 h-4 text-amber-600 shrink-0" />
            Input Progress Harian (Daily Site Log)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Catat hasil pengerjaan fisik harian. Volume aktual otomatis memotong target dan menghitung persentase capaian.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          {/* Baris 1: Item Pekerjaan & Kontrak SPK (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Item Pekerjaan (WBS) <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={workItemId}
                onValueChange={handleWorkItemChange}
                placeholder="Pilih item pekerjaan..."
                searchPlaceholder="Cari item pekerjaan..."
                options={project.workItems.map((wi) => ({
                  value: wi.id,
                  label: wi.name,
                  subLabel: `Progress: ${wi.progress}% | Bobot: ${wi.weight}%`,
                }))}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <FileSignature className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                Kontrak SPK Pelaksana <span className="text-rose-500">*</span>
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
                        {spk.targetVolume ? ` (Target: ${spk.targetVolume} ${spk.unit})` : ""}
                        {isMatch ? " [Terkait WBS]" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Referensi Input Terakhir (Smart Pre-Fill Helper) */}
          {lastLogForItem && (
            <div className="px-3 py-2 rounded-md border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 text-blue-900 dark:text-blue-200">
                <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">
                  Terakhir ({formatShortDate(lastLogForItem.date)}):{" "}
                  <strong className="font-mono">
                    +{lastLogForItem.actualVolume || 0} {lastLogForItem.unit || unit}
                  </strong>
                  {lastLogForItem.activity ? ` - "${lastLogForItem.activity}"` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {lastLogForItem.actualVolume && lastLogForItem.actualVolume > 0 && (
                  <button
                    type="button"
                    onClick={() => setActualVolume(lastLogForItem.actualVolume ?? "")}
                    className="px-2 py-1 rounded border border-blue-300 dark:border-blue-800 bg-background hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-[11px] font-medium text-blue-800 dark:text-blue-200 transition-colors cursor-pointer"
                  >
                    Pakai Vol. ({lastLogForItem.actualVolume})
                  </button>
                )}
                {lastLogForItem.activity && (
                  <button
                    type="button"
                    onClick={() => setActivity(lastLogForItem.activity)}
                    className="px-2 py-1 rounded border border-blue-300 dark:border-blue-800 bg-background hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-[11px] font-medium text-blue-800 dark:text-blue-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Salin Aktivitas
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Baris 2: Target SPK Ringkas atau Swakelola (1 Baris Horizontal) */}
          {activeSpk && spkTargetVolume > 0 ? (
            <div className="px-3 py-2 rounded-md border bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/80 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  SPK {activeSpk.spkNumber}
                </span>
                <div className="flex flex-wrap items-center gap-3 font-mono">
                  <span className="text-muted-foreground">
                    Target: <strong className="text-foreground">{spkTargetVolume}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Lalu: <strong className="text-blue-600 dark:text-blue-400">{priorRealizedVolume}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Sisa: <strong className="text-amber-600 dark:text-amber-400">{priorRemainingVolume} {activeSpk.unit}</strong>
                  </span>
                  {actVolNum > 0 && (
                    <span className="text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-0.5 font-semibold">
                      <ArrowDownRight className="w-3 h-3" />
                      Baru: {newRemainingVolume} {activeSpk.unit}
                    </span>
                  )}
                </div>
              </div>
              {isOverTarget && (
                <div className="px-2 py-1 rounded bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Volume hari ini melebihi sisa target kontrak ({actVolNum - priorRemainingVolume} {activeSpk.unit} di atas target).
                  </span>
                </div>
              )}
            </div>
          ) : (
            selectedSpkId === "none" && (
              <div className="p-2.5 rounded-md border bg-muted/30 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Pelaksana / Mandor
                  </label>
                  <Input
                    value={customContractor}
                    onChange={(e) => setCustomContractor(e.target.value)}
                    placeholder="Tim Swakelola Kebun"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Vol. Rencana Swakelola
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={swakelolaPlannedVolume}
                    onChange={(e) =>
                      setSwakelolaPlannedVolume(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Contoh: 100"
                    className="h-8 font-mono text-xs bg-background"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Satuan (uoM)
                  </label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="M3, M, Ha..."
                    className="h-8 font-mono text-xs uppercase bg-background"
                  />
                </div>
              </div>
            )
          )}

          {/* Baris 3: Vol. Aktual & Capaian Otomatis (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>
                  Vol. Aktual (Hasil Hari Ini) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {lastLogForItem?.actualVolume
                    ? `Terakhir: ${lastLogForItem.actualVolume} ${unit}`
                    : `Satuan: ${unit}`}
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="0.1"
                  step="any"
                  value={actualVolume}
                  onChange={(e) =>
                    setActualVolume(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder={`Hasil hari ini (${unit})`}
                  className="h-9 font-mono font-bold text-sm"
                />
                <span className="h-9 text-xs font-mono font-bold px-2.5 rounded-md bg-muted text-muted-foreground border flex items-center shrink-0">
                  {unit}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-foreground text-[11px] block">
                Total Capaian Item (Otomatis)
              </span>
              <div className="h-9 px-3 rounded-md border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Akumulasi: {newCumulativeVolume} {unit}</span>
                </div>
                <span className="font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  {autoCalculatedPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Baris 4: Tanggal & Cuaca (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Tanggal Kegiatan</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Kondisi Cuaca</label>
              <Select
                value={weather}
                onValueChange={(val: "Cerah" | "Hujan" | "Berawan") => setWeather(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cerah">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cerah Terik</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="Berawan">
                    <span className="flex items-center gap-1.5">
                      <CloudSun className="w-3.5 h-3.5 text-sky-500" />
                      <span>Berawan / Redup</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="Hujan">
                    <span className="flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                      <span>Hujan Deras</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Baris 5: Aktivitas Lapangan */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Uraian Aktivitas Lapangan <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Contoh: Pengecoran pilar kiri, pemasangan besi tulangan D16, pembersihan parit..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Baris 6: Collapsible Detail Tambahan (Catatan, Pengawas, Foto) */}
          <div className="rounded-md border bg-muted/20">
            <button
              type="button"
              onClick={() => setShowOptional((prev) => !prev)}
              aria-expanded={showOptional}
              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted/40 transition-colors rounded-md cursor-pointer"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                <span className="font-semibold text-foreground">
                  Detail Tambahan & Foto Lapangan (Opsional)
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  Pencatat: {createdBy || userProfile?.fullName || "-"}
                  {photoName ? ` | Foto: ${photoName}` : ""}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground block">
                      Catatan / Kendala Teknis
                    </label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Material pasir mencukupi, cuaca mendukung..."
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                      Pengawas / Pencatat Lapangan
                    </label>
                    <Input
                      value={createdBy}
                      onChange={(e) => setCreatedBy(e.target.value)}
                      placeholder="Nama pengawas lapangan..."
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Foto Lapangan / Dokumentasi Fisik</span>
                    {uploadingPhoto && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-normal">
                        <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah ke Drive...
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={photoName}
                      onChange={(e) => setPhotoName(e.target.value)}
                      placeholder="Nama berkas atau unggah foto ke Google Drive"
                      className="h-8 text-xs bg-background"
                    />
                    <label className="h-8 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 text-foreground transition-colors gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>Unggah Foto</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
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
            disabled={isSubmitting || uploadingPhoto}
            className="bg-amber-700 hover:bg-amber-800 text-white font-semibold gap-1.5"
          >
            <HardHat className="w-3.5 h-3.5" />
            {isSubmitting ? "Menyimpan..." : "Simpan Progress Harian"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
