"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Paperclip,
  MessageSquare,
  History,
  UploadCloud,
  Link2,
  Trash2,
  FileText,
  Clock,
  ExternalLink,
  Search,
} from "lucide-react";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentList } from "@/components/comments/comment-list";
import { GDriveLinkDialog } from "@/components/documents/gdrive-link-dialog";
import { GDriveUploadDialog } from "@/components/documents/gdrive-upload-dialog";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate } from "@/lib/utils";
import { Project } from "@/types";
import { toast } from "sonner";

interface CollaborationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  defaultTab?: "comments" | "documents" | "audit";
}

export function CollaborationDrawer({
  open,
  onOpenChange,
  project,
  defaultTab = "comments",
}: CollaborationDrawerProps) {
  const { comments, attachments, deleteAttachment, auditLogs, isViewerOnly } =
    useAppState();

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [docSearch, setDocSearch] = useState("");

  const projectComments = comments.filter((c) => c.projectId === project.id);
  const projectAttachments = attachments.filter(
    (a) => a.projectId === project.id
  );
  const projectAuditLogs = auditLogs
    .filter(
      (l) =>
        l.projectId === project.id ||
        l.entityId === project.id ||
        (l.afterData && JSON.stringify(l.afterData).includes(project.id)) ||
        (l.beforeData && JSON.stringify(l.beforeData).includes(project.id))
    )
    .slice(0, 30);

  const filteredAttachments = projectAttachments.filter((att) =>
    att.fileName.toLowerCase().includes(docSearch.toLowerCase())
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-background border-l"
        >
          {/* Header */}
          <div className="p-4 border-b bg-card space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold bg-muted px-1.5 py-0.5 rounded text-foreground">
                {project.code}
              </span>
              <SheetTitle className="text-sm font-semibold truncate">
                Kolaborasi, Berkas & Riwayat
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground truncate">
              {project.name}
            </SheetDescription>
          </div>

          {/* Tab Selection */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="px-4 pt-3 border-b bg-muted/20">
              <TabsList className="grid grid-cols-3 w-full h-8">
                <TabsTrigger
                  value="comments"
                  className="text-xs gap-1.5 data-[state=active]:font-semibold"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Diskusi ({projectComments.length})
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="text-xs gap-1.5 data-[state=active]:font-semibold"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Berkas ({projectAttachments.length})
                </TabsTrigger>
                <TabsTrigger
                  value="audit"
                  className="text-xs gap-1.5 data-[state=active]:font-semibold"
                >
                  <History className="w-3.5 h-3.5" />
                  Audit Trail
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: COMMENTS */}
            <TabsContent
              value="comments"
              className="flex-1 flex flex-col min-h-0 p-4 space-y-4 m-0 overflow-y-auto"
            >
              {!isViewerOnly && (
                <div className="border rounded-lg p-3 bg-card shadow-xs">
                  <CommentForm projectId={project.id} />
                </div>
              )}
              <div className="flex-1 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Riwayat Komentar ({projectComments.length})
                </h4>
                <CommentList projectId={project.id} />
              </div>
            </TabsContent>

            {/* TAB 2: DOCUMENTS */}
            <TabsContent
              value="documents"
              className="flex-1 flex flex-col min-h-0 p-4 space-y-3 m-0 overflow-y-auto"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari berkas..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                {!isViewerOnly && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLinkDialogOpen(true)}
                      className="h-8 text-xs gap-1"
                    >
                      <Link2 className="w-3 h-3 text-blue-600" /> Link Drive
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setUploadDialogOpen(true)}
                      className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <UploadCloud className="w-3 h-3" /> Upload
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-2">
                {filteredAttachments.length === 0 ? (
                  <div className="text-center py-10 border rounded-lg bg-muted/20 text-muted-foreground space-y-2">
                    <Paperclip className="w-7 h-7 mx-auto opacity-40" />
                    <p className="text-xs font-medium">Belum ada dokumen terlampir</p>
                    <p className="text-[11px]">
                      Tautkan berkas dari Google Drive atau upload dokumen pendukung proyek.
                    </p>
                  </div>
                ) : (
                  filteredAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-2.5 rounded-lg border bg-card hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <AttachmentPreview
                            filename={att.fileName}
                            title={att.fileName}
                          />
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 h-4"
                            >
                              {att.source === "GOOGLE_DRIVE_LINK"
                                ? "Google Drive"
                                : "Upload"}
                            </Badge>
                            <span>•</span>
                            <span>{formatIDDate((att.uploadedAt || "").split("T")[0])}</span>
                            <span>•</span>
                            <span>Oleh {att.uploadedBy}</span>
                          </div>
                        </div>
                      </div>

                      {!isViewerOnly && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            deleteAttachment(att.id);
                            toast.success(`Lampiran ${att.fileName} dihapus`);
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 3: AUDIT TRAIL */}
            <TabsContent
              value="audit"
              className="flex-1 flex flex-col min-h-0 p-4 space-y-3 m-0 overflow-y-auto"
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Aktivitas & Perubahan Terakhir
                </span>
                {projectAuditLogs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Belum ada rekaman audit log spesifik untuk proyek ini.
                  </div>
                ) : (
                  projectAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg border bg-card text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatIDDate((log.createdAt || "").split("T")[0])}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Oleh: {log.userName}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          {log.entityType}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Dialogs for Document tab */}
      <GDriveLinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        projectId={project.id}
      />
      <GDriveUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        projectId={project.id}
      />
    </>
  );
}
