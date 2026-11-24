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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { PurchaseOrder } from "@/types";
import { toast } from "sonner";
import { PackageCheck, UploadCloud, AlertCircle, Loader2 } from "lucide-react";

interface GRReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: PurchaseOrder;
  preselectedItemId?: string;
}

export function GRReceiptDialog({
  open,
  onOpenChange,
  po,
  preselectedItemId,
}: GRReceiptDialogProps) {
  const { recordGoodsReceipt, grs, userProfile } = useAppState();

  const [grNumber, setGrNumber] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(
    preselectedItemId || po.items[0]?.id || ""
  );
  const [receivedVolume, setReceivedVolume] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const year = new Date().getFullYear();
      const seq = String(grs.length + 1).padStart(4, "0");
      setGrNumber(`GR-${year}-${seq}`);
      setReceiptDate(new Date().toISOString().split("T")[0]);
      setSelectedItemId(preselectedItemId || po.items[0]?.id || "");
      setReceivedVolume(0);
      setNotes("");
      setAttachmentName("");
    }
  }, [open, grs.length, po.items, preselectedItemId]);

  const selectedItem = po.items.find((it) => it.id === selectedItemId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", po.projectId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Gagal mengunggah lampiran GR ke Google Drive.");
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
    if (!grNumber.trim()) {
      toast.error("Nomor GR wajib diisi");
      return;
    }
    if (!receiptDate) {
      toast.error("Tanggal terima fisik wajib diisi");
      return;
    }
    if (!selectedItem) {
      toast.error("Pilih item material yang diterima");
      return;
    }
    if (receivedVolume <= 0) {
      toast.error("Volume penerimaan harus lebih dari 0");
      return;
    }
    if (receivedVolume > selectedItem.remainingVolume) {
      toast.error(
        `Volume penerimaan (${receivedVolume}) melebihi sisa pesanan (${selectedItem.remainingVolume})`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await recordGoodsReceipt({
        grNumber: grNumber.trim(),
        poId: po.id,
        poNumber: po.poNumber,
        receiptDate,
        itemId: selectedItem.id,
        materialName: selectedItem.materialName,
        receivedVolume,
        unit: selectedItem.unit,
        notes: notes.trim() || `Penerimaan fisik material ${selectedItem.materialName} di gudang estate`,
        attachmentName: attachmentName.trim() || undefined,
        recordedBy: userProfile?.fullName || "",
      });

      if (!ok) return;

      toast.success(
        `Penerimaan ${receivedVolume} ${selectedItem.unit} material berhasil dicatat! Sisa diperbarui.`
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            Catat Penerimaan Barang (Goods Receipt)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pencatatan parsial atau penuh material PO {po.poNumber} dari {po.supplierName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nomor Dokumen GR <span className="text-rose-500">*</span>
              </label>
              <Input
                value={grNumber}
                onChange={(e) => setGrNumber(e.target.value)}
                placeholder="GR-2026-..."
                className="font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Tanggal Terima Fisik</label>
              <Input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Pilih Item Material PO <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={selectedItemId}
              onValueChange={setSelectedItemId}
              placeholder="Pilih item..."
              searchPlaceholder="Cari item material..."
              options={po.items.map((it) => ({
                value: it.id,
                label: it.materialName,
                subLabel: `Sisa: ${it.remainingVolume} ${it.unit} dari ${it.volume} ${it.unit}`,
              }))}
            />
          </div>

          {selectedItem && (
            <div className="p-3 rounded-lg bg-muted/40 border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Dipesan:</span>
                <span className="font-mono font-semibold">
                  {selectedItem.volume} {selectedItem.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sudah Diterima:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  {selectedItem.receivedVolume} {selectedItem.unit}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-foreground font-semibold">Sisa Belum Diterima:</span>
                <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">
                  {selectedItem.remainingVolume} {selectedItem.unit}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Kuantitas Diterima Saat Ini ({selectedItem?.unit || "Unit"}){" "}
              <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              max={selectedItem?.remainingVolume || 9999}
              value={receivedVolume || ""}
              onChange={(e) => setReceivedVolume(Number(e.target.value))}
              placeholder="Masukkan jumlah yang diterima..."
              className="font-mono font-bold text-sm"
            />
            {selectedItem && receivedVolume > selectedItem.remainingVolume && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Melebihi sisa pemesanan ({selectedItem.remainingVolume})
              </p>
            )}
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Catatan Kondisi Fisik / Hasil Pemeriksaan Gudang
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kondisi kemasan utuh, sertifikat mill sheet terlampir..."
              rows={2}
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Lampiran Surat Jalan / Screenshot GR SAP (Opsional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Tautan Google Drive atau nama berkas"
                className="text-xs"
              />
              <label className="h-9 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium flex items-center justify-center cursor-pointer shrink-0 gap-1.5">
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingAttachment}
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            {isSubmitting ? "Menyimpan..." : "Konfirmasi Simpan GR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
