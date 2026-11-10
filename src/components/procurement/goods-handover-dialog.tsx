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
import { useAppState } from "@/context/app-state-context";
import { Project, PurchaseOrder, GoodsHandoverStatus } from "@/types";
import { toast } from "sonner";
import { FileCheck, UploadCloud, CheckCircle2, Check, Clock } from "lucide-react";
import { formatIDR } from "@/lib/utils";

interface GoodsHandoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  po: PurchaseOrder;
}

export function GoodsHandoverDialog({
  open,
  onOpenChange,
  project,
  po,
}: GoodsHandoverDialogProps) {
  const { recordGoodsHandover, goodsHandovers, userProfile, suppliers } = useAppState();

  const [handoverNumber, setHandoverNumber] = useState(
    `BAST-2026-00${20 + goodsHandovers.length}`
  );
  const [handoverDate, setHandoverDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [receiverName, setReceiverName] = useState(
    userProfile.fullName || "Dedi Setiawan, S.T."
  );
  const [receiverJabatan, setReceiverJabatan] = useState(
    userProfile.role || "Manager Estate / PIC Proyek"
  );
  const [giverName, setGiverName] = useState("");
  const [giverCompany, setGiverCompany] = useState(po.supplierName);
  const [status, setStatus] = useState<GoodsHandoverStatus>("COMPLETED");
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  useEffect(() => {
    if (open) {
      setHandoverNumber(`BAST-2026-00${20 + goodsHandovers.length}`);
      setHandoverDate(new Date().toISOString().split("T")[0]);
      setReceiverName(userProfile.fullName || "Dedi Setiawan, S.T.");
      setReceiverJabatan(userProfile.role || "Manager Estate / PIC Proyek");
      setGiverCompany(po.supplierName);

      const sup = suppliers.find((s) => s.id === po.supplierId || s.name === po.supplierName);
      setGiverName(sup?.contactPerson || "Perwakilan Resmi Supplier");
      setAttachmentName(`BAST_Resmi_${po.poNumber.replace(/[^0-9]/g, "")}_Signed.pdf`);
    }
  }, [open, goodsHandovers.length, userProfile, po, suppliers]);

  const handleSubmit = () => {
    if (!handoverNumber.trim()) {
      toast.error("Nomor BAST wajib diisi");
      return;
    }
    if (!receiverName.trim() || !giverName.trim()) {
      toast.error("Nama pihak penyerah dan penerima wajib diisi");
      return;
    }
    if (!notes.trim()) {
      toast.error("Catatan pemeriksaan kondisi dan fungsi barang wajib diisi");
      return;
    }

    recordGoodsHandover({
      handoverNumber: handoverNumber.trim(),
      poId: po.id,
      poNumber: po.poNumber,
      projectId: project.id,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      handoverDate,
      receiverName: receiverName.trim(),
      receiverJabatan: receiverJabatan.trim(),
      giverName: giverName.trim(),
      giverCompany: giverCompany.trim(),
      notes: notes.trim(),
      status,
      attachmentName: attachmentName.trim() || `BAST_Resmi_${po.poNumber}_Signed.pdf`,
    });

    toast.success(
      `Berita Acara Serah Terima ${handoverNumber} untuk PO ${po.poNumber} berhasil dicatat!`
    );
    onOpenChange(false);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            Catat Berita Acara Serah Terima (BAST Formal)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pencatatan penyerahan resmi barang pesanan antara vendor penyedia dan pihak kebun.
          </DialogDescription>
        </DialogHeader>

        {/* PO Target Info Card */}
        <div className="p-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-900 dark:text-emerald-300">
              PO: {po.poNumber} (Ref PR: {po.relatedPrNumber})
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {formatIDR(po.poValue)}
            </span>
          </div>
          <div className="font-medium text-foreground">
            Rekanan: {po.supplierName} • {po.items.length} Item Material
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Realisasi GR Gudang: {po.receiptProgressPercent}%</span>
            <span>•</span>
            <span>Status PO: {po.status}</span>
          </div>
        </div>

        <div className="space-y-4 py-1 text-xs">
          {/* Grid: Nomor BAST & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nomor Dokumen BAST <span className="text-rose-500">*</span>
              </label>
              <Input
                value={handoverNumber}
                onChange={(e) => setHandoverNumber(e.target.value)}
                className="h-8 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Tanggal Serah Terima <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Bagian Pihak Penyerah (Vendor / Ekspedisi) */}
          <div className="p-3 rounded-md border bg-muted/20 space-y-3">
            <div className="font-semibold text-xs text-foreground flex items-center justify-between">
              <span>Pihak Penyerah (Penyedia / Vendor Rekanan)</span>
              <span className="text-[11px] text-muted-foreground font-normal">Pihak Pertama</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Nama Penanggung Jawab <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={giverName}
                  onChange={(e) => setGiverName(e.target.value)}
                  placeholder="Nama perwakilan vendor"
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Perusahaan / Ekspedisi
                </label>
                <Input
                  value={giverCompany}
                  onChange={(e) => setGiverCompany(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>
          </div>

          {/* Bagian Pihak Penerima (Kebun / Estate) */}
          <div className="p-3 rounded-md border bg-muted/20 space-y-3">
            <div className="font-semibold text-xs text-foreground flex items-center justify-between">
              <span>Pihak Penerima (Gudang Central / Tim Teknis Kebun)</span>
              <span className="text-[11px] text-muted-foreground font-normal">Pihak Kedua</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Nama Penerima <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Jabatan Penerima
                </label>
                <Input
                  value={receiverJabatan}
                  onChange={(e) => setReceiverJabatan(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>
          </div>

          {/* Status Dokumen BAST */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Status Kesepakatan Serah Terima <span className="text-rose-500">*</span>
            </label>
            <Select
              value={status}
              onValueChange={(val: GoodsHandoverStatus) => setStatus(val)}
            >
              <SelectTrigger className="h-8 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLETED" className="text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>COMPLETED (Diserahterimakan Penuh & Diterima Baik)</span>
                  </span>
                </SelectItem>
                <SelectItem value="PENDING" className="text-amber-700 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>PENDING (Dalam Masa Uji Coba Lapangan / Penyesuaian)</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Catatan Pengujian & Pemeriksaan */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Catatan Kondisi Barang & Hasil Uji Fisik Lapangan <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={3}
              placeholder="Catat kondisi fisik barang (bebas cacat, kemasan utuh, sertifikasi sesuai) dan hasil pengujian lapangan bila ada..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {/* Berkas Scan Dokumen BAST */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Lampiran Dokumen BAST Bertanda Tangan (Simulasi)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder={`BAST_Resmi_${po.poNumber}_Signed.pdf`}
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAttachmentName(
                    `BAST_Resmi_${po.poNumber.replace(/[^0-9]/g, "")}_FullSigned.pdf`
                  )
                }
                className="h-8 text-xs gap-1 shrink-0"
              >
                <UploadCloud className="w-3.5 h-3.5" /> File Acak
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Simpan Berita Acara (BAST)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
