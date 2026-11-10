"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  UploadCloud,
  Link2,
  ExternalLink,
  FolderOpen,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
  HardDrive,
  Cloud,
  Copy,
  Check,
  Download,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { GDriveLinkDialog } from "@/components/documents/gdrive-link-dialog";
import { GDriveUploadDialog } from "@/components/documents/gdrive-upload-dialog";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate } from "@/lib/utils";
import { ProjectAttachment } from "@/types";
import { getProjectDriveFolderAction } from "@/server/actions/projects";
import { toast } from "sonner";

export default function DocumentsTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, attachments, deleteAttachment, isViewerOnly } = useAppState();

  const project = projects.find((p) => p.id === projectId);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  // Google Drive Simulation Viewer Modal State
  const [selectedDriveDoc, setSelectedDriveDoc] = useState<ProjectAttachment | null>(null);
  const [driveViewerOpen, setDriveViewerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openingDriveFolder, setOpeningDriveFolder] = useState(false);

  const handleOpenDriveFolder = async () => {
    setOpeningDriveFolder(true);
    try {
      const res = await getProjectDriveFolderAction(projectId);
      if (res.success && res.webViewLink) {
        window.open(res.webViewLink, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.message || "Gagal membuka folder Google Drive");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengakses folder Google Drive");
    } finally {
      setOpeningDriveFolder(false);
    }
  };

  if (!project) return null;

  const projectAttachments = attachments.filter((a) => a.projectId === projectId);

  const filteredAttachments = projectAttachments.filter((att) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      att.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (att.category && att.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (att.docNumber && att.docNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSource =
      sourceFilter === "ALL" || att.source === sourceFilter;

    return matchesSearch && matchesSource;
  });

  const countDriveLink = projectAttachments.filter((a) => a.source === "GOOGLE_DRIVE_LINK").length;
  const countUpload = projectAttachments.filter((a) => a.source === "UPLOAD").length;

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus berkas "${name}"?`)) {
      deleteAttachment(id);
      toast.success("Dokumen berhasil dihapus dari repositori.");
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Ringkasan Dokumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Dokumen
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {projectAttachments.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Semua berkas proyek
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Tautan Google Drive
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {countDriveLink}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Berkas tersambung link
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Unggahan Cloud Drive
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {countUpload}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tersimpan di cloud storage
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Status Integrasi
              </p>
              <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Google Drive Aktif
              </h3>
              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={`[${project.code}] ${project.name}`}>
                Folder: [{project.code}] {project.name}
              </p>
              <button
                type="button"
                onClick={handleOpenDriveFolder}
                disabled={openingDriveFolder}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1 hover:underline pt-0.5"
              >
                <FolderOpen className="w-3 h-3" />
                <span>{openingDriveFolder ? "Membuka..." : "Buka Folder Drive"}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold">
                Repositori Dokumen Proyek & Integrasi Google Drive
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Arsip terpusat otorisasi AFCE SAP, SPK Kontraktor, BAST, gambar CAD/DED, survey, dan tautan berkas cloud Google Drive.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={openingDriveFolder}
              onClick={handleOpenDriveFolder}
              className="gap-1.5 text-xs border-muted-foreground/30 text-muted-foreground hover:text-foreground"
              title="Buka direktori Google Drive proyek ini di tab baru"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Folder Drive</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Button>

            {!isViewerOnly && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLinkDialogOpen(true)}
                  className="gap-1.5 text-xs border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                >
                  <Link2 className="w-3.5 h-3.5" /> + Tautkan Google Drive
                </Button>

                <Button
                  size="sm"
                  onClick={() => setUploadDialogOpen(true)}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> + Unggah Dokumen
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama berkas, nomor dokumen, atau kategori..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Filter className="w-3 h-3" /> Sumber Berkas:
            </span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Sumber ({projectAttachments.length})</option>
              <option value="GOOGLE_DRIVE_LINK">Google Drive Link ({countDriveLink})</option>
              <option value="UPLOAD">Upload Cloud ({countUpload})</option>
            </select>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">Nama File Dokumen</TableHead>
                <TableHead>Sumber / Tipe</TableHead>
                <TableHead>Kategori Dokumen</TableHead>
                <TableHead>Nomor Registrasi / SAP</TableHead>
                <TableHead>Tanggal Unggah</TableHead>
                <TableHead>Ukuran</TableHead>
                <TableHead>Pengunggah</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttachments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center">
                    <div className="space-y-1.5 text-muted-foreground">
                      <FolderOpen className="w-6 h-6 mx-auto opacity-60" />
                      <p className="text-xs font-semibold text-foreground">Tidak ada dokumen yang sesuai</p>
                      <p className="text-[11px]">
                        Gunakan tombol &quot;+ Tautkan Google Drive&quot; atau &quot;+ Unggah Dokumen&quot; di atas untuk menambahkan berkas baru.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttachments.map((att) => (
                  <TableRow key={att.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[260px]" title={att.fileName}>
                          {att.fileName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          att.source === "GOOGLE_DRIVE_LINK"
                            ? "text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200"
                            : "text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200"
                        }
                      >
                        {att.source === "GOOGLE_DRIVE_LINK" ? "Google Drive Link" : "Cloud Upload"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {att.category || "Dokumen Proyek"}
                      </span>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {att.docNumber || "-"}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatIDDate(att.uploadedAt.split("T")[0])}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {att.fileSize}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {att.uploadedBy}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 px-2.5 rounded-md text-xs gap-1 text-blue-700 border border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 font-medium transition-colors"
                          title="Buka dokumen langsung di Google Drive"
                        >
                          <Cloud className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">Drive</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>

                        <AttachmentPreview
                          filename={att.fileName}
                          fileUrl={att.fileUrl}
                          fileId={att.googleDriveFileId || undefined}
                          mimeType={att.mimeType}
                          title={att.fileName}
                          category={att.category}
                          docNumber={att.docNumber}
                          uploadedBy={att.uploadedBy}
                          uploadedAt={att.uploadedAt}
                          size={att.fileSize}
                          variant="button"
                        />

                        <a
                          href={`/api/files/${encodeURIComponent(att.googleDriveFileId || att.id)}/download?name=${encodeURIComponent(att.fileName)}`}
                          download={att.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 px-2.5 rounded-md text-xs gap-1 text-emerald-700 border border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 font-medium transition-colors"
                          title="Unduh berkas ke komputer"
                        >
                          <Download className="w-3 h-3 text-emerald-600" />
                          <span>Unduh</span>
                        </a>

                        {!isViewerOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(att.id, att.fileName)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                            title="Hapus berkas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Google Drive Link Dialog */}
      <GDriveLinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        projectId={projectId}
      />

      {/* Google Drive Upload Dialog */}
      <GDriveUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        projectId={projectId}
      />

      {/* Google Drive Simulation Viewer Modal */}
      {selectedDriveDoc && (
        <Dialog open={driveViewerOpen} onOpenChange={setDriveViewerOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                      <span>Google Drive Cloud Document</span>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                        {selectedDriveDoc.source === "GOOGLE_DRIVE_LINK" ? "Google Drive Link" : "Cloud Upload"}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Tersimpan di Cloud Storage Google Drive terintegrasi WM-Toolkit
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Document Meta Information Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-muted/40 border">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Nama Berkas</span>
                  <span className="font-semibold text-foreground truncate block" title={selectedDriveDoc.fileName}>
                    {selectedDriveDoc.fileName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Tipe / Kategori</span>
                  <span className="font-medium text-foreground block">
                    {selectedDriveDoc.category || "Dokumen"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Ukuran File</span>
                  <span className="font-mono text-foreground block">
                    {selectedDriveDoc.fileSize}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Diunggah Oleh</span>
                  <span className="font-medium text-foreground block">
                    {selectedDriveDoc.uploadedBy}
                  </span>
                </div>
              </div>

              {/* Mock Drive Link Box with Copy Action */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Drive URL Mock</span>
                  <span className="text-[10px] text-muted-foreground">Status: Shared Link (Viewer)</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={selectedDriveDoc.fileUrl}
                    readOnly
                    className="font-mono text-[11px] h-8 bg-muted/30 text-muted-foreground"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedDriveDoc.fileUrl);
                      setCopied(true);
                      toast.success("Tautan Google Drive berhasil disalin ke clipboard!");
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-8 text-xs shrink-0 gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Tersalin" : "Salin URL"}</span>
                  </Button>
                </div>
              </div>

              {/* Simulated Document Viewer Sandbox */}
              <div className="rounded-lg border bg-slate-900 text-slate-100 p-6 flex flex-col items-center justify-center min-h-[220px] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{selectedDriveDoc.fileName}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Simulasi pratinjau digital tersinkronisasi dengan Google Workspace Drive API
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400 font-mono">
                  <span>Halaman 1 dari 4</span>
                  <span>&bull;</span>
                  <span>Zoom 100%</span>
                  <span>&bull;</span>
                  <span>Read-Only Preview</span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex flex-row items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDriveViewerOpen(false)}
                className="text-xs"
              >
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(selectedDriveDoc.fileUrl, "_blank")}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <span>Buka di Tab Baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
