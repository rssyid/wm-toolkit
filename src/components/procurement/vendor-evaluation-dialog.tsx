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
import { Project, PurchaseRequisition, VendorEvaluationResult } from "@/types";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck, UploadCloud, Check, X, Loader2 } from "lucide-react";

interface VendorEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  pr: PurchaseRequisition;
}

export function VendorEvaluationDialog({
  open,
  onOpenChange,
  project,
  pr,
}: VendorEvaluationDialogProps) {
  const { recordVendorEvaluation, suppliers, userProfile } = useAppState();

  const [supplierId, setSupplierId] = useState("");
  const [evaluationDate, setEvaluationDate] = useState("");
  const [result, setResult] = useState<VendorEvaluationResult>("RECOMMENDED");
  const [score, setScore] = useState<number>(90);
  const [evaluatorName, setEvaluatorName] = useState(userProfile?.fullName || "");
  const [evaluatorJabatan, setEvaluatorJabatan] = useState(userProfile?.role || "");
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSupplierId(suppliers[0]?.id || "");
      setEvaluationDate(new Date().toISOString().split("T")[0]);
      setResult("RECOMMENDED");
      setScore(90);
      setEvaluatorName(userProfile?.fullName || "");
      setEvaluatorJabatan(userProfile?.role || "");
      setNotes("");
      setAttachmentName("");
    }
  }, [open, suppliers, userProfile?.fullName, userProfile?.role]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
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
        toast.error(json.error || "Gagal mengunggah berkas ke Google Drive.");
        return;
      }

      setAttachmentName(
        json.data.webViewLink ||
          (json.data.fileId ? `/api/files/${json.data.fileId}/download` : json.data.fileName)
      );
      toast.success(`Berkas "${json.data.fileName}" berhasil diunggah ke Google Drive.`);
    } catch {
      toast.error("Gagal terhubung ke server saat mengunggah berkas.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSubmit = async () => {
    if (!supplierId || !selectedSupplier) {
      toast.error("Pilih rekanan vendor yang dievaluasi");
      return;
    }
    if (!evaluationDate) {
      toast.error("Tanggal evaluasi wajib diisi");
      return;
    }
    const parsedScore = Number(score);
    if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      toast.error("Skor penilaian harus bernilai antara 0 sampai 100");
      return;
    }
    if (!evaluatorName.trim()) {
      toast.error("Nama evaluator pengadaan wajib diisi");
      return;
    }
    if (!notes.trim()) {
      toast.error("Catatan evaluasi teknis & komersial wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await recordVendorEvaluation({
        prId: pr.id,
        prNumber: pr.prNumber,
        projectId: project.id,
        supplierId,
        supplierName: selectedSupplier.name,
        evaluatorName: evaluatorName.trim(),
        evaluatorJabatan: evaluatorJabatan.trim(),
        evaluationDate,
        result,
        score: parsedScore,
        notes: notes.trim(),
        attachmentName: attachmentName.trim() || undefined,
      });

      if (!ok) return;

      toast.success(
        `Evaluasi vendor ${selectedSupplier.name} untuk PR ${pr.prNumber} berhasil dicatat (${result === "RECOMMENDED" ? "Direkomendasikan" : "Tidak Direkomendasikan"})!`
      );
      onOpenChange(false);
      setNotes("");
      setAttachmentName("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            Catat Evaluasi Vendor Rekanan Barang
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pencatatan hasil penilaian kelaikan teknis, komparasi harga, dan kapasitas rekanan untuk penerbitan PO.
          </DialogDescription>
        </DialogHeader>

        {/* PR Target Summary Card */}
        <div className="p-3 rounded-lg border bg-blue-50/60 dark:bg-blue-950/20 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-900 dark:text-blue-300">
              PR: {pr.prNumber} ({pr.sapPrNumber})
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              {pr.prType}
            </span>
          </div>
          <div className="font-medium text-foreground">{pr.workItemName}</div>
          <div className="text-[11px] text-muted-foreground line-clamp-2">
            {pr.description}
          </div>
        </div>

        <div className="space-y-4 py-1 text-xs">
          {/* Supplier Selection */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Rekanan Vendor <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              options={suppliers.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.category})`,
                description: `NPWP: ${s.npwp} • Rating: ${s.rating}/5`,
              }))}
              value={supplierId}
              onValueChange={setSupplierId}
              placeholder="Cari & pilih vendor rekanan..."
            />
          </div>

          {/* Grid: Tanggal & Hasil Evaluasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Tanggal Evaluasi <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Hasil Rekomendasi <span className="text-rose-500">*</span>
              </label>
              <Select
                value={result}
                onValueChange={(val: VendorEvaluationResult) => setResult(val)}
              >
                <SelectTrigger className="h-8 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECOMMENDED" className="text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>RECOMMENDED (Direkomendasikan)</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="NOT_RECOMMENDED" className="text-rose-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      <span>NOT RECOMMENDED (Gugur / Tidak Layak)</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid: Skor & Evaluator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Skor Penilaian (1-100)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama Evaluator <span className="text-rose-500">*</span>
              </label>
              <Input
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Jabatan Evaluator
              </label>
              <Input
                value={evaluatorJabatan}
                onChange={(e) => setEvaluatorJabatan(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Catatan Evaluasi Teknis & Komersial */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Catatan Evaluasi Teknis & Komersial <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={3}
              placeholder="Jelaskan justifikasi teknis, ketersediaan workshop, uji bahan, kepatuhan spesifikasi, garansi, atau komparasi harga penawaran..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {/* Dokumen Bukti Komparasi / Berita Acara */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Lampiran Dokumen Berita Acara Komparasi / Evaluasi (Opsional)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Tautan Google Drive atau nama berkas berita acara"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <label className="h-8 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 gap-1">
                {uploadingAttachment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                )}
                <span>Unggah</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploadingAttachment}
                />
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingAttachment}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isSubmitting ? "Menyimpan..." : "Simpan Evaluasi Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
