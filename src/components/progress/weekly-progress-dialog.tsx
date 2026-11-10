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
  TrendingUp,
  UploadCloud,
  FileSignature,
  UserCheck,
  CheckCircle2,
  Layers,
  Loader2,
} from "lucide-react";

interface WeeklyProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  preselectedWorkItemId?: string;
}

export function WeeklyProgressDialog({
  open,
  onOpenChange,
  project,
  preselectedWorkItemId,
}: WeeklyProgressDialogProps) {
  const { addWeeklyProgress, spkContracts } = useAppState();

  const projectSpks = spkContracts.filter((s) => s.projectId === project.id);

  const [workItemId, setWorkItemId] = useState(
    preselectedWorkItemId || project.workItems[0]?.id || ""
  );
  const [selectedSpkId, setSelectedSpkId] = useState<string>("none");
  const [customContractor, setCustomContractor] = useState("");
  const [period, setPeriod] = useState("Minggu 14 (26 Okt - 01 Nov 2026)");
  const [startDate, setStartDate] = useState("2026-10-26");
  const [endDate, setEndDate] = useState("2026-11-01");
  const [plannedProgress, setPlannedProgress] = useState<number>(85);
  const [notes, setNotes] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [uploadingReport, setUploadingReport] = useState(false);
  const [createdBy, setCreatedBy] = useState("Ahmad Fauzi (Project Manager)");

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
      setReportUrl(json.data.webViewLink);
      toast.success(`Laporan "${json.data.fileName}" berhasil diunggah ke Google Drive!`);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah laporan");
    } finally {
      setUploadingReport(false);
    }
  };

  // Initial chaining sync when dialog opens
  useEffect(() => {
    if (open) {
      const initialWiId = preselectedWorkItemId || project.workItems[0]?.id || "";
      setWorkItemId(initialWiId);
      const matchingSpks = projectSpks.filter((s) => s.workItemId === initialWiId);
      if (matchingSpks.length > 0) {
        setSelectedSpkId(matchingSpks[0].id);
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
    }
  };

  // Auto-calculated actual progress from current cumulative physical work (NO MANUAL INPUT)
  const currentActualProgress = selectedWi?.progress || 0;
  const variance = currentActualProgress - plannedProgress;
  const achievement =
    plannedProgress > 0
      ? Math.round((currentActualProgress / plannedProgress) * 100)
      : 100;

  const handleSubmit = () => {
    if (!workItemId) {
      toast.error("Pilih item pekerjaan");
      return;
    }

    const contractorName =
      activeSpk
        ? activeSpk.vendorName
        : customContractor.trim() || "Swakelola Kebun Afdeling";

    addWeeklyProgress({
      projectId: project.id,
      workItemId,
      workItemName: selectedWi?.name || "Item Pekerjaan",
      periodType: "WEEKLY",
      spkId: activeSpk ? activeSpk.id : undefined,
      spkNumber: activeSpk ? activeSpk.spkNumber : undefined,
      contractorName,
      period,
      startDate,
      endDate,
      plannedProgress,
      actualProgress: currentActualProgress,
      variance,
      achievement,
      notes: notes.trim() || `Laporan kemajuan mingguan ${period}`,
      reportName: reportName || `Laporan_Mingguan_${project.code}_${period.slice(0, 9)}.pdf`,
      photoUrl: reportUrl || `/reports/${reportName || `Laporan_Mingguan_${project.code}_${period.slice(0, 9)}.pdf`}`,
      createdBy: createdBy.trim() || "Project Manager",
    });

    toast.success(
      `Laporan mingguan berhasil disimpan! Realisasi aktual terintegrasi otomatis: ${currentActualProgress}%.`
    );
    onOpenChange(false);
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

          {/* Progress Comparation: Plan Input & Auto Realized Badge */}
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Rencana Baseline (%) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={plannedProgress}
                onChange={(e) => setPlannedProgress(Number(e.target.value))}
                className="font-mono font-bold text-xs"
              />
            </div>

            {/* Read-only Auto-Calculated Actual Progress Badge */}
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Realisasi Aktual Kumulatif
              </label>
              <div className="h-9 px-3 rounded-md border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Otomatis:</span>
                </div>
                <span className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  {currentActualProgress}%
                </span>
              </div>
            </div>
          </div>

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
              <span>Lampiran Laporan Mingguan Resmi (PDF)</span>
              {uploadingReport && (
                <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-normal">
                  <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah ke Drive...
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Laporan_Mingguan_M14.pdf"
                className="text-xs"
              />
              <label className="h-9 px-2.5 rounded-md border border-input hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 text-foreground transition-colors gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Pilih PDF</span>
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleReportUpload}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => {
                  setReportName(`Laporan_Mingguan_${project.code}_${period.slice(0, 9)}.pdf`);
                  toast.info("Laporan mingguan terlampir");
                }}
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1" /> Mock
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
            Simpan Laporan Mingguan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
