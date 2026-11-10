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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { Project, POMaterialItem, PurchaseRequisition } from "@/types";
import { toast } from "sonner";
import { ShoppingCart, Plus, Trash2, UploadCloud, Check } from "lucide-react";
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

  const projectPrs = prs.filter((p) => p.projectId === project.id);
  const [poNumber, setPoNumber] = useState(`PO-2026-0${110 + pos.length}`);
  const [relatedPrId, setRelatedPrId] = useState(
    preselectedPrId || projectPrs[0]?.id || ""
  );
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "sup-1");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [attachmentName, setAttachmentName] = useState("");

  const recommendedEvalsForPr = vendorEvaluations.filter(
    (e) => e.prId === relatedPrId && e.result === "RECOMMENDED"
  );
  const recommendedSupplierIds = new Set(recommendedEvalsForPr.map((e) => e.supplierId));

  useEffect(() => {
    if (open) {
      const activePrId = preselectedPrId || projectPrs[0]?.id || "";
      setRelatedPrId(activePrId);
      setPoNumber(`PO-2026-0${110 + pos.length}`);
      setPoDate(new Date().toISOString().split("T")[0]);
      setReleaseDate(new Date().toISOString().split("T")[0]);

      // If active PR has recommended evaluations, auto-select recommended vendor
      const recEvals = vendorEvaluations.filter(
        (e) => e.prId === activePrId && e.result === "RECOMMENDED"
      );
      if (recEvals.length > 0) {
        setSupplierId(recEvals[0].supplierId);
      } else if (suppliers.length > 0) {
        setSupplierId(suppliers[0].id);
      }
    }
  }, [open, preselectedPrId]);

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

  const handleSubmit = () => {
    if (!poNumber.trim()) {
      toast.error("Nomor PO wajib diisi");
      return;
    }
    if (!relatedPrId) {
      toast.error("Pilih PR terkait");
      return;
    }

    const selectedPr = prs.find((p) => p.id === relatedPrId);
    const selectedSupplier = suppliers.find((s) => s.id === supplierId);

    createPo({
      poNumber: poNumber.trim(),
      relatedPrId,
      relatedPrNumber: selectedPr?.prNumber || "PR-MOCK",
      projectId: project.id,
      projectCode: project.code,
      workItemId: selectedPr?.workItemId || project.workItems[0]?.id || "",
      supplierId,
      supplierName: selectedSupplier?.name || "Supplier Rekanan",
      poDate,
      releaseDate,
      poValue: totalPoValue,
      status: "Released",
      items,
      attachmentName: attachmentName || `SAP_PO_${poNumber.replace(/[^0-9]/g, "")}_Signed.pdf`,
    });

    toast.success(`Purchase Order ${poNumber} berhasil diterbitkan!`);
    onOpenChange(false);
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
                Terkait Dokumen PR <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={relatedPrId}
                onValueChange={handlePrChange}
                placeholder="Pilih PR..."
                searchPlaceholder="Cari nomor PR atau deskripsi..."
                triggerClassName="h-9 text-xs"
                options={projectPrs.map((pr) => {
                  const evals = vendorEvaluations.filter((e) => e.prId === pr.id && e.result === "RECOMMENDED");
                  return {
                    value: pr.id,
                    label: `${pr.prNumber} • ${pr.description.slice(0, 30)}...`,
                    subLabel: `${pr.workItemName} • ${evals.length > 0 ? `${evals.length} Vendor Direkomendasikan` : "Belum Dievaluasi"}`,
                  };
                })}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Supplier / Rekanan <span className="text-rose-500">*</span>
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
                    subLabel: `${isRec ? "[DIREKOMENDASIKAN] " : ""}${sup.category} • NPWP: ${sup.npwp || "-"}`,
                  };
                })}
              />
              {recommendedSupplierIds.has(supplierId) && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
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
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Terbitkan Purchase Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
