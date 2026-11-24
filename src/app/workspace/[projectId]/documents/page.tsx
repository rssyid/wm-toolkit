"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  UploadCloud,
  Link2,
  ExternalLink,
  FolderOpen,
  Trash2,
  Search,
  Filter,
  Cloud,
  Download,
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
import { EmptyState } from "@/components/shared/empty-state";
import { GDriveLinkDialog } from "@/components/documents/gdrive-link-dialog";
import { GDriveUploadDialog } from "@/components/documents/gdrive-upload-dialog";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate } from "@/lib/utils";
import { getProjectDriveFolderAction } from "@/server/actions/projects";
import { toast } from "sonner";

export default function DocumentsTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, attachments, deleteAttachment, canEditProjects, userProfile } = useAppState();

  const project = projects.find((p) => p.id === projectId);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [openingDriveFolder, setOpeningDriveFolder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDriveFolder = async () => {
    setOpeningDriveFolder(true);
    try {
      const res = await getProjectDriveFolderAction(projectId);
      if (res.success && res.webViewLink) {
        window.open(res.webViewLink, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.message || "Gagal membuka folder Google Drive.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengakses folder Google Drive.");
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

    const matchesSource = sourceFilter === "ALL" || att.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const countDriveLink = projectAttachments.filter(
    (a) => a.source === "GOOGLE_DRIVE_LINK"
  ).length;
  const countUpload = projectAttachments.filter((a) => a.source === "UPLOAD").length;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const ok = await deleteAttachment(deleteTarget.id);
      if (ok) {
        toast.success("Dokumen berhasil dihapus dari repositori.");
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Ringkas Dokumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Dokumen
              </p>
              <p className="text-xl font-bold text-foreground mt-0.5">
                {projectAttachments.length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Semua berkas proyek</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Tautan Google Drive
              </p>
              <p className="text-xl font-bold text-foreground mt-0.5">{countDriveLink}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Berkas eksternal</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Unggahan Langsung
              </p>
              <p className="text-xl font-bold text-foreground mt-0.5">{countUpload}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Unggahan terkelola</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Direktori Drive Proyek
              </p>
              <p
                className="text-xs font-semibold text-foreground truncate"
                title={`[${project.code}] ${project.name}`}
              >
                [{project.code}] {project.name}
              </p>
              <button
                type="button"
                onClick={handleOpenDriveFolder}
                disabled={openingDriveFolder}
                className="text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 font-medium inline-flex items-center gap-1 hover:underline pt-0.5"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{openingDriveFolder ? "Membuka..." : "Buka Folder Drive"}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Repositori Dokumen */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <CardTitle className="text-sm font-semibold">
                Repositori Dokumen Proyek
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Arsip otorisasi AFCE SAP, SPK Kontraktor, BAST, gambar DED, survey, dan lampiran Google Drive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={openingDriveFolder}
              onClick={handleOpenDriveFolder}
              className="h-9 gap-1.5 text-xs"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Folder Drive</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Button>

            {canEditProjects && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLinkDialogOpen(true)}
                  className="h-9 gap-1.5 text-xs border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                >
                  <Link2 className="w-3.5 h-3.5" /> Tautkan Google Drive
                </Button>

                <Button
                  size="sm"
                  onClick={() => setUploadDialogOpen(true)}
                  className="h-9 gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Unggah Dokumen
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <div className="p-3 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama berkas, nomor dokumen, kategori..."
              aria-label="Cari dokumen proyek"
              className="pl-8 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="doc-source-filter"
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" /> Sumber:
            </label>
            <select
              id="doc-source-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-9 text-xs rounded-md border border-input bg-background px-2.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Semua Sumber ({projectAttachments.length})</option>
              <option value="GOOGLE_DRIVE_LINK">Tautan Google Drive ({countDriveLink})</option>
              <option value="UPLOAD">Unggahan Cloud ({countUpload})</option>
            </select>
          </div>
        </div>

        <CardContent className="p-0 overflow-x-auto">
          {filteredAttachments.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<FolderOpen className="w-8 h-8 opacity-60" />}
                title="Tidak ada dokumen yang sesuai"
                description="Tautkan URL Google Drive atau unggah berkas proyek ke Google Drive melalui tombol di atas."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dokumen</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Nomor Dokumen</TableHead>
                  <TableHead>Tgl Unggah</TableHead>
                  <TableHead>Ukuran</TableHead>
                  <TableHead>Pengunggah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttachments.map((att) => {
                  const canRemove =
                    canEditProjects || att.uploadedBy === userProfile.fullName;

                  return (
                    <TableRow key={att.id} className="hover:bg-muted/30 text-xs">
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="truncate max-w-[240px]" title={att.fileName}>
                            {att.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            att.source === "GOOGLE_DRIVE_LINK"
                              ? "text-[11px] bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200"
                              : "text-[11px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200"
                          }
                        >
                          {att.source === "GOOGLE_DRIVE_LINK" ? "Drive Link" : "Cloud Upload"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground">
                          {att.category || "Dokumen Proyek"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {att.docNumber || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {formatIDDate(att.uploadedAt.split("T")[0])}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {att.fileSize || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{att.uploadedBy}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 px-2.5 rounded-md text-xs gap-1 text-blue-800 border border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 font-medium transition-colors"
                          >
                            <Cloud className="w-3.5 h-3.5" />
                            <span>Drive</span>
                            <ExternalLink className="w-3 h-3" />
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

                          {att.googleDriveFileId && (
                            <a
                              href={`/api/files/${encodeURIComponent(
                                att.googleDriveFileId
                              )}/download?name=${encodeURIComponent(att.fileName)}`}
                              download={att.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-8 px-2.5 rounded-md text-xs gap-1 text-emerald-800 border border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 font-medium transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh</span>
                            </a>
                          )}

                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Hapus lampiran ${att.fileName}`}
                              onClick={() =>
                                setDeleteTarget({ id: att.id, name: att.fileName })
                              }
                              className="h-8 w-8 text-muted-foreground hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Konfirmasi Hapus Dokumen</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Hapus berkas <strong>{deleteTarget?.name}</strong> dari repositori proyek ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="h-9 text-xs"
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GDriveLinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        projectId={projectId}
      />

      <GDriveUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
