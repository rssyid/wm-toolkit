"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Edit2, Layers, CheckCircle2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate } from "@/lib/utils";
import { WorkItem, ProcurementType } from "@/types";
import { toast } from "sonner";

export default function WorkItemsTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, updateProject } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"Physical" | "Material">("Physical");
  const [weight, setWeight] = useState<number>(20);
  const [startDate, setStartDate] = useState("2026-11-01");
  const [endDate, setEndDate] = useState("2026-12-15");
  const [procurementType, setProcurementType] = useState<ProcurementType>("Tender");
  const [progressMode, setProgressMode] = useState<"Daily" | "Weekly">("Daily");
  const [phase, setPhase] = useState<any>("Physical Execution");

  if (!project) return null;

  const currentWorkItems = project.workItems || [];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName("");
    setType("Physical");
    setWeight(10);
    setStartDate(project.baselineStartDate);
    setEndDate(project.baselineEndDate);
    setProcurementType("Tender");
    setProgressMode("Daily");
    setPhase("Physical Execution");
    setDialogOpen(true);
  };

  const handleOpenEdit = (wi: WorkItem) => {
    setEditingItem(wi);
    setName(wi.name);
    setType(wi.type);
    setWeight(wi.weight);
    setStartDate(wi.startDate);
    setEndDate(wi.endDate);
    setProcurementType(wi.procurementType);
    setProgressMode(wi.progressMode);
    setPhase(wi.phase);
    setDialogOpen(true);
  };

  const handleSaveWorkItem = () => {
    if (!name.trim()) {
      toast.error("Nama work item wajib diisi");
      return;
    }
    if (weight <= 0) {
      toast.error("Bobot harus lebih besar dari 0%");
      return;
    }

    if (editingItem) {
      // Edit existing
      const updated = currentWorkItems.map((w) =>
        w.id === editingItem.id
          ? {
              ...w,
              name,
              type,
              weight,
              startDate,
              endDate,
              procurementType,
              progressMode,
              phase,
            }
          : w
      );
      updateProject(project.id, { workItems: updated });
      toast.success("Item pekerjaan berhasil diperbarui");
    } else {
      // Add new
      const newItem: WorkItem = {
        id: `wi-${Date.now()}`,
        projectId: project.id,
        name,
        type,
        weight,
        startDate,
        endDate,
        procurementType,
        progressMode,
        progress: 0,
        status: "Planned",
        phase,
      };
      updateProject(project.id, { workItems: [...currentWorkItems, newItem] });
      toast.success("Item pekerjaan baru ditambahkan");
    }

    setDialogOpen(false);
  };

  const totalWeight = currentWorkItems.reduce((acc, it) => acc + (it.weight || 0), 0);

  return (
    <div className="space-y-4">
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold">
                Daftar Item Pekerjaan (Work Breakdown Structure)
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rincian tugas fisik dan pengadaan, tanggal rencana, dan bobot kontribusi ke progress keseluruhan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-muted border">
              Total Bobot: <b className={totalWeight === 100 ? "text-emerald-600" : "text-amber-600"}>{totalWeight}%</b>
            </span>
            <Button size="sm" onClick={handleOpenAdd} className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-3.5 h-3.5" /> Tambah Item
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Nama Item Pekerjaan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Pengadaan</TableHead>
                <TableHead>Bobot (%)</TableHead>
                <TableHead>Rencana Jadwal</TableHead>
                <TableHead>Progress Fisik</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentWorkItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                    Belum ada item pekerjaan. Klik "Tambah Item" untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                currentWorkItems.map((wi) => (
                <TableRow key={wi.id} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-xs text-foreground">
                    <div className="flex flex-col">
                      <span>{wi.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Fase: {wi.phase} &bull; Mode: {wi.progressMode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {wi.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{wi.procurementType}</TableCell>
                  <TableCell className="font-mono font-bold text-xs">
                    {wi.weight}%
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatIDDate(wi.startDate)} - {formatIDDate(wi.endDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-emerald-600"
                          style={{ width: `${wi.progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold">{wi.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={wi.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(wi)}
                      className="h-7 text-xs px-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                    </Button>
                  </TableCell>
                </TableRow>
              )))
            }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingItem ? "Ubah Item Pekerjaan" : "Tambah Item Pekerjaan"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Konfigurasi nama item, tipe, bobot, dan jadwal pelaksanaan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama Item Pekerjaan <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Pekerjaan Pengecoran Pondasi Sayap"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">Tipe</label>
                <Select
                  value={type}
                  onValueChange={(val: "Physical" | "Material") => setType(val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physical">Physical Work</SelectItem>
                    <SelectItem value="Material">Material Component</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Bobot (%) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">Tanggal Mulai</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Tanggal Selesai</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">Pengadaan</label>
                <Select
                  value={procurementType}
                  onValueChange={(val: ProcurementType) => setProcurementType(val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tender">Tender</SelectItem>
                    <SelectItem value="Swakelola">Swakelola</SelectItem>
                    <SelectItem value="Purchase">Purchase Langsung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Mode Pelaporan</label>
                <Select
                  value={progressMode}
                  onValueChange={(val: "Daily" | "Weekly") => setProgressMode(val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Harian (Daily)</SelectItem>
                    <SelectItem value="Weekly">Mingguan (Weekly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveWorkItem} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Item Pekerjaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
