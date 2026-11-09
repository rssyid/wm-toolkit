"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppState } from "@/context/app-state-context";
import { MaterialCatalogItem } from "@/types";
import { formatIDR, formatIDDate } from "@/lib/utils";
import { toast } from "sonner";

export default function MasterDataMaterialsPage() {
  const { materials, addMasterDataMaterial, updateMasterDataMaterial } = useAppState();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialCatalogItem | null>(null);

  // Form states
  const [sapCode, setSapCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Bahan Bangunan");
  const [unit, setUnit] = useState("M3");
  const [standardPrice, setStandardPrice] = useState<number>(250000);

  const filteredMaterials = materials.filter((mat) => {
    const q = search.toLowerCase();
    return (
      mat.sapCode.toLowerCase().includes(q) ||
      mat.name.toLowerCase().includes(q) ||
      mat.category.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSapCode(`10023${420 + materials.length}`);
    setName("");
    setCategory("Bahan Bangunan");
    setUnit("M3");
    setStandardPrice(250000);
    setDialogOpen(true);
  };

  const handleOpenEdit = (mat: MaterialCatalogItem) => {
    setEditingItem(mat);
    setSapCode(mat.sapCode);
    setName(mat.name);
    setCategory(mat.category);
    setUnit(mat.unit);
    setStandardPrice(mat.standardPrice);
    setDialogOpen(true);
  };

  const handleToggleStatus = (mat: MaterialCatalogItem) => {
    const newStatus = mat.status === "Active" ? "Inactive" : "Active";
    updateMasterDataMaterial(mat.id, { status: newStatus });
    toast.success(`Status material ${mat.name} diubah menjadi ${newStatus}`);
  };

  const handleSave = () => {
    if (!sapCode.trim() || !name.trim()) {
      toast.error("Kode SAP dan deskripsi material wajib diisi");
      return;
    }

    if (editingItem) {
      updateMasterDataMaterial(editingItem.id, {
        sapCode,
        name,
        category,
        unit,
        standardPrice,
      });
      toast.success("Katalog material berhasil diperbarui!");
    } else {
      addMasterDataMaterial({
        sapCode,
        name,
        category,
        unit,
        standardPrice,
        status: "Active",
      });
      toast.success("Material baru berhasil ditambahkan!");
    }

    setDialogOpen(false);
  };

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
            Katalog Material Standar SAP
          </h1>
          <p className="text-xs text-muted-foreground">
            Daftar material konstruksi, precast, baja, pupuk, dan harga satuan standar referensi PO.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Material Baru
        </Button>
      </div>

      {/* Table Card */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari kode SAP atau nama material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {filteredMaterials.length} Item Material Terdaftar
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[95px]">Kode SAP</TableHead>
                <TableHead className="min-w-[150px]">Deskripsi Material</TableHead>
                <TableHead className="w-[120px]">Kategori</TableHead>
                <TableHead className="w-[65px]">Satuan</TableHead>
                <TableHead className="w-[120px] text-right whitespace-nowrap">Harga Standar</TableHead>
                <TableHead className="w-[85px] whitespace-nowrap">Status</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Diperbarui</TableHead>
                <TableHead className="w-[140px] text-right whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs p-0">
                    <EmptyState
                      title="Tidak ada material yang cocok"
                      description="Ubah kata kunci pencarian Anda."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((mat) => (
                  <TableRow key={mat.id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-mono font-bold text-foreground whitespace-nowrap">
                      {mat.sapCode}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {mat.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                        {mat.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{mat.unit}</TableCell>
                    <TableCell className="font-mono text-right font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {formatIDR(mat.standardPrice)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={mat.status} />
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {formatIDDate(mat.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(mat)}
                          className="h-7 text-xs px-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(mat)}
                          className={`h-7 text-xs px-2 ${
                            mat.status === "Active"
                              ? "text-amber-600 hover:text-amber-700"
                              : "text-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          {mat.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingItem ? "Ubah Katalog Material" : "Tambah Material Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Konfigurasi kode material SAP, satuan, dan estimasi harga standar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Kode Material SAP <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={sapCode}
                  onChange={(e) => setSapCode(e.target.value)}
                  placeholder="10023..."
                  className="font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Satuan</label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Sak / M3 / Batang"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Deskripsi / Nama Material <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Semen Portland Tipe 1 (50kg)"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">Kategori</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Bahan Bangunan / Besi"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Harga Satuan Standar (Rp)
                </label>
                <Input
                  type="number"
                  value={standardPrice}
                  onChange={(e) => setStandardPrice(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
