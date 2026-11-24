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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { Project, POMaterialItem } from "@/types";
import { toast } from "sonner";
import { ShoppingCart, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { formatIDR } from "@/lib/utils";

interface POCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  preselectedPrId?: string;
}

export function POCreateDialog({
  open,
  onOpenChange,
  project,
  preselectedPrId,
}: POCreateDialogProps) {
  const { createPo, pos, prs, suppliers, materials, vendorEvaluations } = useAppState();

  const recommendedPrs = useMemo(
    () =>
      prs.filter(
        (p) =>
          p.projectId === project.id &&
          !p.deletedAt &&
          vendorEvaluations.some((e) => e.prId === p.id && e.result === "RECOMMENDED")
      ),
    [prs, project.id, vendorEvaluations]
  );

  const [poNumber, setPoNumber] = useState("");
  const [relatedPrId, setRelatedPrId] = useState(
    preselectedPrId || recommendedPrs[0]?.id || ""
  );
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [poDate, setPoDate] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recommendedEvalsForPr = vendorEvaluations.filter(
    (e) => e.prId === relatedPrId && e.result === "RECOMMENDED"
  );
  const recommendedSupplierIds = new Set(recommendedEvalsForPr.map((e) => e.supplierId));

  useEffect(() => {
    if (open) {
      const year = new Date().getFullYear();
      const seq = String(pos.length + 1).padStart(4, "0");
      const preferredPr = recommendedPrs.find((p) => p.id === preselectedPrId);
      const activePrId = preferredPr?.id || recommendedPrs[0]?.id || "";
      setRelatedPrId(activePrId);
      setPoNumber(`PO-${year}-${seq}`);
      setPoDate(new Date().toISOString().split("T")[0]);
      setReleaseDate(new Date().toISOString().split("T")[0]);
      setAttachmentName("");

      const recEvals = vendorEvaluations.filter(
        (e) => e.prId === activePrId && e.result === "RECOMMENDED"
      );
      if (recEvals.length > 0) {
        setSupplierId(recEvals[0].supplierId);
      } else if (suppliers.length > 0) {
        setSupplierId(suppliers[0].id);
      } else {
        setSupplierId("");
      }
    }
  }, [open, preselectedPrId, recommendedPrs, pos.length, vendorEvaluations, suppliers]);

  const handlePrChange = (newPrId: string) => {
    setRelatedPrId(newPrId);
    const recEvals = vendorEvaluations.filter(
      (e) => e.prId === newPrId && e.result === "RECOMMENDED"
    );
    if (recEvals.length > 0) {
      setSupplierId(recEvals[0].supplierId);
    }
  };

  const [items, setItems] = useState<POMaterialItem[]>([
    {
      id: `poi-new-${Date.now()}`,
      poId: "",
      materialName: materials[0]?.name || "Material Konstruksi",
      sapMaterialCode: materials[0]?.sapCode || "10023401",
      volume: 100,
      unit: materials[0]?.unit || "Sak",
      unitPrice: materials[0]?.standardPrice || 78500,
      totalPrice: 7850000,
      receivedVolume: 0,
      remainingVolume: 100,
      status: "Ordered",
    },
  ]);

  const totalPoValue = items.reduce((acc, it) => acc + (it.totalPrice || 0), 0);

  const handleAddItem = () => {
    const defaultMat = materials[items.length % materials.length] || materials[0];
    const newItem: POMaterialItem = {
      id: `poi-new-${Date.now()}-${items.length}`,
      poId: "",
      materialName: defaultMat?.name || "Item Material",
      sapMaterialCode: defaultMat?.sapCode || "10023499",
      volume: 50,
      unit: defaultMat?.unit || "Unit",
      unitPrice: defaultMat?.standardPrice || 100000,
      totalPrice: 50 * (defaultMat?.standardPrice || 100000),
      receivedVolume: 0,
      remainingVolume: 50,
      status: "Ordered",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("Minimal harus memiliki 1 item material");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof POMaterialItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === "volume" || field === "unitPrice") {
          const vol = field === "volume" ? Number(value) || 0 : it.volume;
          const price = field === "unitPrice" ? Number(value) || 0 : it.unitPrice;
          updated.volume = vol;
          updated.unitPrice = price;
          updated.totalPrice = vol * price;
          updated.remainingVolume = vol - it.receivedVolume;
        }
        return updated;
      })
    );
  };

  const handleSubmit = async () => {
    if (!poNumber.trim()) {
      toast.error("Nomor PO wajib diisi");
      return;
    }
    const selectedPr = recommendedPrs.find((p) => p.id === relatedPrId);
    if (!selectedPr) {
      toast.error("Pilih PR yang telah memiliki evaluasi vendor RECOMMENDED");
      return;
    }
    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    if (!selectedSupplier) {
      toast.error("Pilih supplier rekanan yang valid");
      return;
    }
    if (!poDate || !releaseDate) {
      toast.error("Tanggal terbit dan rilis PO wajib diisi");
      return;
    }
    const invalidItem = items.find(
      (it) => !it.materialName.trim() || !it.unit.trim() || it.volume <= 0 || it.unitPrice < 0
    );
    if (invalidItem) {
      toast.error("Setiap item material wajib memiliki nama, satuan, dan volume > 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await createPo({
        poNumber: poNumber.trim(),
        relatedPrId,
        relatedPrNumber: selectedPr.prNumber,
        projectId: project.id,
        projectCode: project.code,
        workItemId: selectedPr.workItemId || project.workItems[0]?.id || "",
        supplierId,
        supplierName: selectedSupplier.name,
        poDate,
        releaseDate,
        poValue: totalPoValue,
        status: "Released",
        items,
        attachmentName: attachmentName.trim() || undefined,
      });

      if (!ok) return;

      toast.success(`Purchase Order ${poNumber.trim()} berhasil diterbitkan!`);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            Terbitkan Purchase Order (PO)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Hubungkan PO dengan PR terilis dan tentukan item material serta kuantum pengadaan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nomor PO SAP <span className="text-rose-500">*</span>
              </label>
              <Input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="PO-2026-..."
                className="font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Terkait Dokumen PR (Terverifikasi Vendor) <span className="text-rose-600">*</span>
              </label>
              <SearchableSelect
                value={relatedPrId}
                onValueChange={handlePrChange}
                placeholder={
                  recommendedPrs.length === 0
                    ? "Belum ada PR dengan evaluasi RECOMMENDED"
                    : "Pilih PR..."
                }
                searchPlaceholder="Cari nomor PR atau deskripsi..."
                triggerClassName="h-9 text-xs"
                options={recommendedPrs.map((pr) => {
                  const evals = vendorEvaluations.filter((e) => e.prId === pr.id && e.result === "RECOMMENDED");
                  return {
                    value: pr.id,
                    label: `${pr.prNumber} (${pr.description.slice(0, 30)})`,
                    subLabel: `${pr.workItemName} | ${evals.length} Vendor Direkomendasikan`,
                  };
                })}
              />
              {recommendedPrs.length === 0 && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Belum ada PR dengan status Evaluasi Vendor RECOMMENDED pada proyek ini.</span>
                </p>
              )}
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Supplier / Rekanan <span className="text-rose-600">*</span>
              </label>
              <SearchableSelect
                value={supplierId}
                onValueChange={setSupplierId}
                placeholder="Pilih Supplier..."
                searchPlaceholder="Cari nama rekanan/supplier..."
                triggerClassName="h-9 text-xs"
                options={suppliers.map((sup) => {
                  const isRec = recommendedSupplierIds.has(sup.id);
                  return {
                    value: sup.id,
                    label: isRec ? `[Rekomendasi] ${sup.name}` : sup.name,
                    subLabel: `${isRec ? "[DIREKOMENDASIKAN] " : ""}${sup.category} | NPWP: ${sup.npwp || "-"}`,
                  };
                })}
              />
              {recommendedSupplierIds.has(supplierId) && (
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Vendor terverifikasi dari Evaluasi Rekanan PR</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Tanggal Terbit Kontrak PO <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Tanggal Approval & Rilis PO <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </div>
          </div>

          {/* Material Items Sub-table */}
          <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">
                Daftar Item Material PO ({items.length} item)
              </span>
              <Button size="sm" variant="outline" onClick={handleAddItem} className="gap-1 h-7 text-xs">
                <Plus className="w-3.5 h-3.5" /> Tambah Item Material
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-center bg-card p-2 rounded border text-xs">
                  <div className="col-span-4">
                    <Input
                      value={it.materialName}
                      onChange={(e) => handleUpdateItem(it.id, "materialName", e.target.value)}
                      placeholder="Nama material..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={it.volume}
                      onChange={(e) => handleUpdateItem(it.id, "volume", e.target.value)}
                      placeholder="Volume"
                      className="h-8 text-xs font-mono font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={it.unit}
                      onChange={(e) => handleUpdateItem(it.id, "unit", e.target.value)}
                      placeholder="Satuan"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={it.unitPrice}
                      onChange={(e) => handleUpdateItem(it.id, "unitPrice", e.target.value)}
                      placeholder="Harga Satuan"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveItem(it.id)}
                      className="h-7 w-7 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Value Summary */}
            <div className="flex items-center justify-between border-t pt-2 text-xs font-medium">
              <span className="text-muted-foreground">Total Nilai Kontrak PO:</span>
              <span className="font-mono text-sm font-bold text-foreground">
                {formatIDR(totalPoValue)}
              </span>
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
            disabled={isSubmitting || recommendedPrs.length === 0}
            className="bg-indigo-700 hover:bg-indigo-800 text-white"
          >
            {isSubmitting ? "Menyimpan..." : "Terbitkan Purchase Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
