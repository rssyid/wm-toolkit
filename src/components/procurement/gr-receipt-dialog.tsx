"use client";

import React, { useState } from "react";
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
import { PurchaseOrder, POMaterialItem } from "@/types";
import { toast } from "sonner";
import { PackageCheck, UploadCloud, AlertCircle } from "lucide-react";

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
  const { recordGoodsReceipt, grs } = useAppState();

  const [grNumber, setGrNumber] = useState(`GR-2026-00${70 + grs.length}`);
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedItemId, setSelectedItemId] = useState(
    preselectedItemId || po.items[0]?.id || ""
  );
  const [receivedVolume, setReceivedVolume] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const selectedItem = po.items.find((it) => it.id === selectedItemId);

  const handleSubmit = () => {
    if (!grNumber.trim()) {
      toast.error("Nomor GR wajib diisi");
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

    recordGoodsReceipt({
      grNumber: grNumber.trim(),
      poId: po.id,
      poNumber: po.poNumber,
      receiptDate,
      itemId: selectedItem.id,
      materialName: selectedItem.materialName,
      receivedVolume,
      unit: selectedItem.unit,
      notes: notes.trim() || `Penerimaan fisik material ${selectedItem.materialName} di gudang estate`,
      attachmentName: attachmentName || `SAP_GR_Doc_${grNumber.replace(/[^0-9]/g, "")}.pdf`,
      recordedBy: "Budi Santoso, S.T.",
    });

    toast.success(
      `Penerimaan ${receivedVolume} ${selectedItem.unit} material berhasil dicatat! Sisa diperbarui.`
    );
    onOpenChange(false);
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
                <span className="font-mono text-emerald-600 font-semibold">
                  {selectedItem.receivedVolume} {selectedItem.unit}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-foreground font-semibold">Sisa Belum Diterima:</span>
                <span className="font-mono text-amber-600 font-bold">
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
              Lampiran Surat Jalan / Screenshot GR SAP
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Contoh: SuratJalan_Supplier_5001.png"
                className="text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => {
                  setAttachmentName(`SuratJalan_SJ_${po.poNumber}_GR.pdf`);
                  toast.info("Dokumen surat jalan terlampir");
                }}
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1" /> Mock Lampiran
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Konfirmasi Simpan GR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
