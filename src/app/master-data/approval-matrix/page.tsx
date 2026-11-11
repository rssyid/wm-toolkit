"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  Info,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppState } from "@/context/app-state-context";
import {
  ApprovalMatrixRule,
  ApprovalLevel,
  APPROVAL_LEVEL_LABELS,
  APPROVAL_LEVEL_ORDER,
} from "@/types";
import { formatIDR } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Level Toggle Cell ────────────────────────────────────────────────────────

interface LevelCellProps {
  tierId: string;
  levelIndex: number;
  isActive: boolean;
  roleName: string;
  onToggle: (tierId: string, levelIndex: number) => void;
}

function LevelCell({ tierId, levelIndex, isActive, roleName, onToggle }: LevelCellProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onToggle(tierId, levelIndex)}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 mx-auto",
              isActive
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 ring-1 ring-emerald-300 dark:ring-emerald-700"
                : "bg-muted/50 text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground"
            )}
            aria-label={`${isActive ? "Nonaktifkan" : "Aktifkan"} Level ${levelIndex + 1}: ${roleName}`}
          >
            {isActive ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Circle className="w-3.5 h-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isActive ? (
            <span>
              <strong>Level {levelIndex + 1}: {roleName}</strong> aktif - klik untuk nonaktifkan
            </span>
          ) : (
            <span>Klik untuk aktifkan <strong>Level {levelIndex + 1}: {roleName}</strong></span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MasterDataApprovalMatrixPage() {
  const {
    approvalMatrix,
    toggleApprovalLevel,
    updateApprovalMatrixRule,
    addApprovalMatrixRule,
    deleteApprovalMatrixRule,
  } = useAppState();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<ApprovalMatrixRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApprovalMatrixRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dialog form states (only name + range)
  const [tierName, setTierName] = useState("");
  const [minValue, setMinValue] = useState<number>(0);
  const [maxValue, setMaxValue] = useState<number>(100000000);

  const handleOpenAdd = () => {
    setEditingTier(null);
    setTierName(`Tier Khusus ${approvalMatrix.length + 1}`);
    setMinValue(500000000);
    setMaxValue(1000000000);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tier: ApprovalMatrixRule) => {
    setEditingTier(tier);
    setTierName(tier.tierName);
    setMinValue(tier.minValue);
    setMaxValue(tier.maxValue);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const ok = await deleteApprovalMatrixRule(deleteTarget.id);
      if (ok) {
        toast.success(`Tingkatan ${deleteTarget.tierName} berhasil dihapus.`);
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!tierName.trim()) {
      toast.error("Nama tingkatan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTier) {
        const ok = await updateApprovalMatrixRule(editingTier.id, {
          tierName: tierName.trim(),
          minValue,
          maxValue,
        });
        if (ok) {
          toast.success("Parameter tier berhasil diperbarui!");
          setDialogOpen(false);
        }
      } else {
        const ok = await addApprovalMatrixRule({
          tierName: tierName.trim(),
          minValue,
          maxValue,
          levels: Array(9).fill(null) as (ApprovalLevel | null)[],
          active: true,
        });
        if (ok) {
          toast.success("Tingkatan persetujuan baru ditambahkan! Aktifkan level via toggle di tabel.");
          setDialogOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count active tiers
  const activeTierCount = approvalMatrix.filter((t) => t.active).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/master-data"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Kembali ke Master Data
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Konfigurasi Matriks Persetujuan AFCE
          </h1>
          <p className="text-xs text-muted-foreground">
            Standar Operasional Prosedur (SOP) batasan wewenang otorisasi anggaran belanja modal
            teknik perkebunan.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Tingkatan Baru
        </Button>
      </div>

      {/* Info Card */}
      <div className="p-3.5 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Cara Penggunaan Matriks Persetujuan:</p>
          <p className="text-muted-foreground dark:text-emerald-400/80 leading-relaxed">
            Klik ikon centang atau lingkaran pada setiap kolom level untuk mengaktifkan atau menonaktifkan pejabat
            penyetuju per tier nilai. Level dapat diaktifkan secara bebas tanpa harus berurutan -
            misalnya Tier tertentu bisa mengharuskan persetujuan WM, GEM, dan CFO saja. Terdapat{" "}
            <strong>9 level hierarki</strong>:{" "}
            {"WM -> EM -> GEM -> RH -> PH -> MCA -> CFO -> COO -> Chairman."}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/40 ring-1 ring-emerald-300 dark:ring-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          </span>
          <span>Level aktif (wajib approve)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-6 h-6 rounded bg-muted/50">
            <Circle className="w-3 h-3 text-muted-foreground/50" />
          </span>
          <span>Tidak aktif (klik untuk aktifkan)</span>
        </div>
      </div>
      {/* Table Card */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Tingkatan Batasan Nilai AFCE &amp; Penugasan Wewenang Penyetuju
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            {activeTierCount} Tingkatan Aktif
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-semibold px-3 py-2.5 min-w-[180px] sticky left-0 bg-muted/30 z-10">
                  Tingkatan (Tier)
                </th>
                <th className="text-right font-semibold px-3 py-2.5 whitespace-nowrap min-w-[110px]">
                  Batas Min
                </th>
                <th className="text-right font-semibold px-3 py-2.5 whitespace-nowrap min-w-[110px]">
                  Batas Max
                </th>
                {/* Level columns */}
                {APPROVAL_LEVEL_ORDER.map((role, i) => (
                  <TooltipProvider key={role} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <th className="font-semibold px-1 py-2.5 text-center whitespace-nowrap w-12 cursor-default">
                          <span className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                            L{i + 1}
                          </span>
                          <br />
                          <span className="text-[10px] font-mono text-foreground/70">{role}</span>
                        </th>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Level {i + 1}: <strong>{APPROVAL_LEVEL_LABELS[role]}</strong>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                <th className="text-center font-semibold px-2 py-2.5 whitespace-nowrap w-[70px]">
                  Status
                </th>
                <th className="text-right font-semibold px-3 py-2.5 whitespace-nowrap w-[90px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {approvalMatrix.map((tier, tierIdx) => {
                // Ensure levels array is always length 9
                const levels: (ApprovalLevel | null)[] = Array(9)
                  .fill(null)
                  .map((_, i) => tier.levels?.[i] ?? null);

                // Count active levels for summary
                const activeCount = levels.filter(Boolean).length;

                return (
                  <tr
                    key={tier.id}
                    className={cn(
                      "border-b transition-colors",
                      tierIdx % 2 === 0 ? "bg-background" : "bg-muted/10",
                      "hover:bg-muted/20"
                    )}
                  >
                    {/* Tier name */}
                    <td className="px-3 py-2.5 sticky left-0 z-10 bg-inherit">
                      <span className="font-semibold text-foreground">{tier.tierName}</span>
                      {activeCount > 0 && (
                        <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                          {activeCount} level
                        </span>
                      )}
                    </td>

                    {/* Min */}
                    <td className="px-3 py-2.5 font-mono text-right text-muted-foreground whitespace-nowrap">
                      {formatIDR(tier.minValue)}
                    </td>

                    {/* Max */}
                    <td className="px-3 py-2.5 font-mono text-right font-medium text-foreground whitespace-nowrap">
                      {tier.maxValue > 10000000000 ? "Tak Terbatas" : formatIDR(tier.maxValue)}
                    </td>

                    {/* Level toggles */}
                    {APPROVAL_LEVEL_ORDER.map((role, levelIndex) => {
                      const isActive = levels[levelIndex] !== null;
                      return (
                        <td key={role} className="px-1 py-2">
                          <LevelCell
                            tierId={tier.id}
                            levelIndex={levelIndex}
                            isActive={isActive}
                            roleName={APPROVAL_LEVEL_LABELS[role]}
                            onToggle={toggleApprovalLevel}
                          />
                        </td>
                      );
                    })}

                    {/* Status */}
                    <td className="px-2 py-2.5 text-center whitespace-nowrap">
                      <StatusBadge status={tier.active ? "Active" : "Inactive"} />
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(tier)}
                          className="h-7 text-xs px-2 hover:text-emerald-600"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(tier)}
                          className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {approvalMatrix.length === 0 && (
                <tr>
                  <td
                    colSpan={9 + 5}
                    className="py-10 text-center text-xs text-muted-foreground"
                  >
                    Belum ada tingkatan persetujuan. Klik &quot;+ Tambah Tingkatan Baru&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Edit Tier Dialog - only name + range */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingTier ? "Ubah Parameter Tier" : "Tambah Tingkatan Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingTier
                ? "Sesuaikan nama dan batasan nilai nominal tier ini."
                : "Isi nama dan rentang nilai. Level penyetuju dapat diatur via toggle di tabel setelah tier tersimpan."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama Tingkatan (Tier) <span className="text-rose-500">*</span>
              </label>
              <Input
                value={tierName}
                onChange={(e) => setTierName(e.target.value)}
                placeholder="Contoh: Belanja Modal Skala Mega"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nilai Min (Rp)</label>
                <Input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(Number(e.target.value))}
                  className="font-mono text-xs"
                  min={0}
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Nilai Max (Rp)</label>
                <Input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(Number(e.target.value))}
                  className="font-mono text-xs"
                  min={0}
                />
              </div>
            </div>

            {minValue > 0 && maxValue > 0 && (
              <div className="rounded bg-muted/50 px-3 py-2 text-muted-foreground font-mono text-[11px]">
                {formatIDR(minValue)} - {maxValue > 10000000000 ? "Tak Terbatas" : formatIDR(maxValue)}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? "Menyimpan..." : editingTier ? "Simpan Perubahan" : "Simpan Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-rose-600">Hapus Tingkatan Persetujuan</DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus tingkatan{" "}
              <strong className="text-foreground">{deleteTarget?.tierName}</strong> dari database?
              Aturan otorisasi untuk rentang nilai ini akan dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus Tingkatan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
