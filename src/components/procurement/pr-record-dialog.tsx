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
import { Project, PRType } from "@/types";
import { toast } from "sonner";
import { FilePlus2, UploadCloud } from "lucide-react";

interface PRRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function PRRecordDialog({ open, onOpenChange, project }: PRRecordDialogProps) {
  const { createPr, prs } = useAppState();

  const [prNumber, setPrNumber] = useState(`PR-2026-00${70 + prs.length}`);
  const [sapPrNumber, setSapPrNumber] = useState(`100459${700 + prs.length}`);
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [workItemId, setWorkItemId] = useState(project.workItems[0]?.id || "");
  const [prType, setPrType] = useState<PRType>("Material");
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const handleSubmit = () => {
    if (!prNumber.trim() || !sapPrNumber.trim()) {
      toast.error("Nomor PR dan Nomor Dokumen SAP wajib diisi");
      return;
    }
    if (!workItemId) {
      toast.error("Pilih item pekerjaan terkait");
      return;
    }

    const selectedWi = project.workItems.find((w) => w.id === workItemId);

    createPr({
      prNumber: prNumber.trim(),
      sapPrNumber: sapPrNumber.trim(),
      projectId: project.id,
      projectCode: project.code,
      workItemId,
      workItemName: selectedWi?.name || "Pekerjaan Proyek",
      releaseDate,
      prType,
      description: description.trim() || `Pengadaan untuk ${selectedWi?.name}`,
      status: "Released",
      linkedPoCount: 0,
      attachmentName: attachmentName || `SAP_PR_${sapPrNumber}_Release.pdf`,
    });

    toast.success(`Purchase Requisition ${prNumber} berhasil dicatat!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FilePlus2 className="w-5 h-5 text-blue-600" />
            Catat Rilis Purchase Requisition (PR)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Dokumentasikan nomor PR dan nomor reservasi SAP untuk proyek {project.code}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nomor PR Internal <span className="text-rose-500">*</span>
              </label>
              <Input
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                placeholder="PR-2026-..."
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nomor SAP PR <span className="text-rose-500">*</span>
              </label>
              <Input
                value={sapPrNumber}
                onChange={(e) => setSapPrNumber(e.target.value)}
                placeholder="10045..."
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Tanggal Approval & Rilis PR <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Tipe PR</label>
              <SearchableSelect
                value={prType}
                onValueChange={(val) => setPrType(val as PRType)}
                options={[
                  { value: "Material", label: "Material" },
                  { value: "Service", label: "Jasa / Service" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Item Pekerjaan Terkait <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={workItemId}
              onValueChange={setWorkItemId}
              placeholder="Pilih work item..."
              searchPlaceholder="Cari item pekerjaan..."
              options={project.workItems.map((wi) => ({
                value: wi.id,
                label: wi.name,
                subLabel: `Bobot: ${wi.weight}% • ${wi.phase}`,
              }))}
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Uraian Kebutuhan PR</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi spesifikasi material atau lingkup sewa alat..."
              rows={2}
            />
          </div>

          {/* Screenshot / PDF Placeholder */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Lampiran Screenshot SAP / Dokumen Pendukung
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Contoh: Screenshot_SAP_PR_Release.png"
                className="text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => {
                  setAttachmentName(`SAP_PR_${sapPrNumber}_Release.pdf`);
                  toast.info("File placeholder terlampir");
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
          <Button size="sm" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
            Simpan Rilis PR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
