"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { ClipboardList, Plus, Trash2, Edit3, MapPin, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppState } from "@/context/app-state-context";
import { formatIDR, formatIDDate } from "@/lib/utils";
import { BOQItem } from "@/types";
import { toast } from "sonner";

export default function SurveyAndBoqTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, updateProject } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New BOQ item form state
  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [volume, setVolume] = useState<number>(10);
  const [unit, setUnit] = useState("M3");
  const [unitPrice, setUnitPrice] = useState<number>(250000);
  const [weight, setWeight] = useState<number>(5);

  if (!project) return null;

  const boqList = project.surveyAndBoq || [];
  const totalBoqValue = boqList.reduce((acc, it) => acc + it.totalPrice, 0);
  const totalBoqWeight = boqList.reduce((acc, it) => acc + it.weight, 0);

  const handleAddBoqItem = () => {
    if (!name.trim()) {
      toast.error("Nama pekerjaan BOQ wajib diisi");
      return;
    }

    const newItem: BOQItem = {
      id: `boq-${Date.now()}`,
      itemCode: itemCode.trim() || `CIV-0${boqList.length + 1}`,
      name: name.trim(),
      volume,
      unit,
      unitPrice,
      totalPrice: volume * unitPrice,
      weight,
      status: "Draft",
    };

    updateProject(project.id, {
      surveyAndBoq: [...boqList, newItem],
    });

    toast.success("Item Bill of Quantities (BOQ) berhasil ditambahkan!");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Survey Information Card */}
      <Card className="shadow-xs p-4 bg-muted/20 border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Hasil Survey Lapangan & Pengukuran Topografi</span>
            </div>
            <p className="text-xs text-foreground font-medium">
              Survey lokasi {project.locationName} &bull; Elevasi Muka Air Saluran: +12.40 mdpl &bull; Lebar Saluran Eksisting: 3.20 meter
            </p>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Surveyor: Tim Teknik Distrik &bull; Tanggal Survey: {formatIDDate(project.baselineStartDate)}
          </div>
        </div>
      </Card>

      {/* BOQ Table Card */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold">
                Bill of Quantities (BOQ) Rencana Anggaran Biaya
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rincian kuantum volume, analisa harga satuan, dan pembobotan item pekerjaan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setItemCode(`CIV-0${boqList.length + 1}`);
                setName("");
                setVolume(10);
                setUnitPrice(250000);
                setWeight(5);
                setDialogOpen(true);
              }}
              className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Item BOQ
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Kode Item</TableHead>
                <TableHead className="min-w-[240px]">Uraian Pekerjaan / Material</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead className="text-right">Harga Satuan (Rp)</TableHead>
                <TableHead className="text-right">Total Harga (Rp)</TableHead>
                <TableHead className="text-right">Bobot (%)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boqList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    Belum ada item BOQ yang dimasukkan untuk proyek ini. Klik tombol "Tambah Item BOQ" untuk membuat rincian.
                  </TableCell>
                </TableRow>
              ) : (
                boqList.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {it.itemCode}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {it.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right">
                      {it.volume.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {it.unit}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right">
                      {formatIDR(it.unitPrice)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-right text-foreground">
                      {formatIDR(it.totalPrice)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-right text-emerald-600">
                      {it.weight}%
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={it.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* BOQ Summary Footer */}
          {boqList.length > 0 && (
            <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground font-medium">
                Total Nilai BOQ Terinci ({boqList.length} Item Pekerjaan):
              </span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs">
                  Total Bobot: <b>{totalBoqWeight}%</b>
                </span>
                <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {formatIDR(totalBoqValue)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add BOQ Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Tambah Item Bill of Quantities</DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan analisa volume dan estimasi harga satuan rencana proyek.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">Kode Item</label>
                <Input
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  placeholder="CIV-01"
                  className="font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Satuan</label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="M3 / Unit / Sak"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Uraian Pekerjaan / Material <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Pekerjaan Cor Beton K-250 Ready Mix"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">Volume</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Harga Satuan (Rp)</label>
                <Input
                  type="number"
                  min="1000"
                  step="500"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">Bobot (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Estimasi Total</label>
                <div className="h-9 px-3 flex items-center bg-muted/60 border rounded-md font-mono font-bold text-foreground">
                  {formatIDR(volume * unitPrice)}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleAddBoqItem} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Item BOQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
