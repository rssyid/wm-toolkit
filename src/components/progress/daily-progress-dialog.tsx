"use client";

import React, { useState, useEffect } from "react";
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
  HardHat,
  Camera,
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
} from "lucide-react";

interface DailyProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  preselectedWorkItemId?: string;
}

export function DailyProgressDialog({
  open,
  onOpenChange,
  project,
  preselectedWorkItemId,
}: DailyProgressDialogProps) {
  const { addDailyProgress, spkContracts, dailyProgress } = useAppState();

  const projectSpks = spkContracts.filter((s) => s.projectId === project.id);

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
  const [createdBy, setCreatedBy] = useState("Budi Santoso, S.T. (Site Supervisor)");

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
      setPhotoUrl(json.data.webViewLink);
      toast.success(`Foto "${json.data.fileName}" berhasil diunggah ke Google Drive!`);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Sync initial state when dialog opens
  useEffect(() => {
    if (open) {
      const initialWiId = preselectedWorkItemId || project.workItems[0]?.id || "";
      setWorkItemId(initialWiId);
      setDate(new Date().toISOString().split("T")[0]);
      setActivity("");
      setActualVolume("");
      setNotes("");
      setPhotoName("");

      // Find if there is an SPK chained to this Work Item
      const matchingSpks = projectSpks.filter(
        (s) => s.workItemId === initialWiId
      );
      if (matchingSpks.length > 0) {
        setSelectedSpkId(matchingSpks[0].id);
        if (matchingSpks[0].unit) setUnit(matchingSpks[0].unit);
      } else {
        setSelectedSpkId("none");
      }
    }
  }, [open, preselectedWorkItemId, project.workItems]);

  const selectedWi = project.workItems.find((w) => w.id === workItemId);
  const activeSpk = projectSpks.find((s) => s.id === selectedSpkId);

  // 1. Chaining: When Work Item changes, filter / auto-select corresponding SPK
  const handleWorkItemChange = (newWiId: string) => {
    setWorkItemId(newWiId);
    const matchingSpks = projectSpks.filter((s) => s.workItemId === newWiId);
    if (matchingSpks.length > 0) {
      setSelectedSpkId(matchingSpks[0].id);
      if (matchingSpks[0].unit) setUnit(matchingSpks[0].unit);
    } else {
      setSelectedSpkId("none");
    }
  };

  // 2. Chaining: When SPK changes, auto-select corresponding Work Item
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
    }
  };

  // 3. Burn-down & Calculation from SPK or Swakelola
  const priorRealizedVolume =
    selectedSpkId !== "none"
      ? dailyProgress
          .filter((dp) => dp.spkId === selectedSpkId && dp.projectId === project.id)
          .reduce((sum, d) => sum + (d.actualVolume || 0), 0)
      : 0;

  const spkTargetVolume = activeSpk?.targetVolume || 0;
  const effectiveTarget =
    activeSpk && spkTargetVolume > 0
      ? spkTargetVolume
      : typeof swakelolaPlannedVolume === "number"
      ? swakelolaPlannedVolume
      : 0;

  const priorRemainingVolume =
    activeSpk && spkTargetVolume > 0
      ? Math.max(0, spkTargetVolume - priorRealizedVolume)
      : effectiveTarget;

  const actVolNum = typeof actualVolume === "number" ? actualVolume : 0;
  const newCumulativeVolume = priorRealizedVolume + actVolNum;
  const newRemainingVolume = Math.max(0, priorRemainingVolume - actVolNum);

  // Auto-calculated progress percentage (NO MANUAL % INPUT)
  const autoCalculatedPercent =
    effectiveTarget > 0
      ? Math.min(100, Math.round((newCumulativeVolume / effectiveTarget) * 100))
      : selectedWi?.progress || 0;

  const isOverTarget = activeSpk && spkTargetVolume > 0 && actVolNum > priorRemainingVolume;

  const handleSubmit = () => {
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
        : customContractor.trim() || "Swakelola Kebun Afdeling";

    addDailyProgress({
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
      photoName: photoName || `Dokumentasi_Lapangan_${date}.jpg`,
      photoUrl: photoUrl || `/attachments/${photoName || `Dokumentasi_Lapangan_${date}.jpg`}`,
      createdBy: createdBy.trim() || "Site Supervisor",
    });

    toast.success(
      `Log harian berhasil disimpan! Target terpotong ${actVolNum} ${unit}, capaian otomatis menjadi ${autoCalculatedPercent}%.`
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <HardHat className="w-5 h-5 text-amber-500" />
            Input Progress Harian (Daily Site Log)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Catat hasil pengerjaan fisik harian. Volume aktual otomatis memotong target SPK dan persentase progress terhitung otomatis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs">
          {/* Row 1: Item Pekerjaan (Chained) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Item Pekerjaan (WBS) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Terkoneksi ke Kontrak SPK
              </span>
            </div>
            <SearchableSelect
              value={workItemId}
              onValueChange={handleWorkItemChange}
              placeholder="Pilih item pekerjaan..."
              searchPlaceholder="Cari item pekerjaan..."
              options={project.workItems.map((wi) => ({
                value: wi.id,
                label: wi.name,
                subLabel: `Progress saat ini: ${wi.progress}% • Bobot: ${wi.weight}%`,
              }))}
            />
          </div>

          {/* Row 2: Kontrak SPK Rekanan (Chained) */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-indigo-600" />
              Kontrak SPK Pelaksana (Jasa Rekanan) <span className="text-rose-500">*</span>
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
                      {spk.targetVolume ? ` (Target: ${spk.targetVolume} ${spk.unit})` : ""}
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
                placeholder="Nama pelaksana / mandor (contoh: Tim Swakelola Kebun)"
                className="mt-1 text-xs"
              />
            )}
          </div>

          {/* Row 3: Target SPK & Sisa Volume Burn-down Card */}
          {activeSpk && spkTargetVolume > 0 ? (
            <div className="p-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Monitoring Target SPK {activeSpk.spkNumber}
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  Total Target: {spkTargetVolume} {activeSpk.unit}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-background border">
                  <span className="text-[10px] text-muted-foreground block">Target Kontrak</span>
                  <span className="font-mono font-bold text-foreground">
                    {spkTargetVolume} {activeSpk.unit}
                  </span>
                </div>
                <div className="p-2 rounded bg-background border">
                  <span className="text-[10px] text-muted-foreground block">Realisasi Lalu</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {priorRealizedVolume} {activeSpk.unit}
                  </span>
                </div>
                <div className="p-2 rounded bg-background border">
                  <span className="text-[10px] text-muted-foreground block">Sisa Sebelum Hari Ini</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {priorRemainingVolume} {activeSpk.unit}
                  </span>
                </div>
              </div>

              {actVolNum > 0 && (
                <div className="pt-1.5 border-t border-emerald-200 dark:border-emerald-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                    Sisa Target Baru:{" "}
                    <strong className="font-mono text-foreground font-bold">
                      {newRemainingVolume} {activeSpk.unit}
                    </strong>{" "}
                    (-{actVolNum} {activeSpk.unit})
                  </span>
                  <span className="text-muted-foreground">
                    Akumulasi: <strong className="font-mono">{newCumulativeVolume}</strong> / {spkTargetVolume} {activeSpk.unit}
                  </span>
                </div>
              )}

              {isOverTarget && (
                <div className="p-2 rounded bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Volume hari ini melebihi sisa target kontrak ({actVolNum - priorRemainingVolume} {activeSpk.unit} di atas target).
                  </span>
                </div>
              )}
            </div>
          ) : (
            selectedSpkId === "none" && (
              <div className="p-2.5 rounded-lg border bg-muted/30 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">
                    Volume Rencana Swakelola
                  </span>
                  <Input
                    type="number"
                    min="1"
                    value={swakelolaPlannedVolume}
                    onChange={(e) =>
                      setSwakelolaPlannedVolume(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Contoh: 100"
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">
                    Satuan (uoM)
                  </span>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="M3, M, Ha..."
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>
            )
          )}

          {/* Row 4: Input Hasil Fisik Hari Ini & Indikator Capaian Otomatis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>
                  Vol. Aktual (Hasil Hari Ini) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Satuan: {unit}
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
                  placeholder={`Hasil hari ini (${unit})...`}
                  className="font-mono font-bold text-sm"
                />
                <span className="text-xs font-mono font-bold px-2.5 py-2 rounded bg-muted text-muted-foreground border shrink-0">
                  {unit}
                </span>
              </div>
            </div>

            {/* Read-only Auto-Calculated Progress Percentage Badge */}
            <div className="space-y-1">
              <span className="font-semibold text-foreground text-[11px] block">
                Total Capaian Item (Otomatis)
              </span>
              <div className="h-9 px-3 rounded-md border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kalkulasi Otomatis:</span>
                </div>
                <span className="font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  {autoCalculatedPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Row 5: Tanggal & Cuaca */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-foreground block mb-1">Tanggal Kegiatan</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Kondisi Cuaca</label>
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

          {/* Row 6: Aktivitas Lapangan */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Uraian Aktivitas Lapangan <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Contoh: Pengecoran pilar kiri, pemasangan besi tulangan D16, pembersihan parit..."
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Row 7: Catatan Lapangan */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Catatan / Kendala Teknis (Opsional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Material pasir mencukupi, cuaca mendukung..."
              className="text-xs"
            />
          </div>

          {/* Row 8: Pengawas Lapangan */}
          <div>
            <label className="font-semibold text-foreground block mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
              Pengawas / Pencatat Lapangan
            </label>
            <Input
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="Nama pengawas lapangan..."
              className="text-xs"
            />
          </div>

          {/* Row 9: Foto Dokumentasi */}
          <div>
            <label className="font-semibold text-foreground flex items-center justify-between mb-1">
              <span>Foto Lapangan / Dokumentasi Fisik</span>
              {uploadingPhoto && (
                <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-normal">
                  <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah ke Drive...
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                placeholder="Foto_Dokumentasi_Progress.jpg"
                className="text-xs"
              />
              <label className="h-9 px-2.5 rounded-md border border-input hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 text-foreground transition-colors gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Pilih Foto</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => {
                  setPhotoName(`SitePhoto_${project.code}_${date}.jpg`);
                  toast.info("Foto dokumentasi terlampir");
                }}
              >
                <Camera className="w-3.5 h-3.5 mr-1" /> Mock
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
          >
            <HardHat className="w-3.5 h-3.5" /> Simpan Progress Harian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
