"use client";

import React, { useState } from "react";
import { Send, Link2, UploadCloud, X, FileText, ExternalLink, Paperclip, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MentionPicker } from "./mention-picker";
import { GDriveLinkDialog } from "@/components/documents/gdrive-link-dialog";
import { GDriveUploadDialog } from "@/components/documents/gdrive-upload-dialog";
import { useAppState } from "@/context/app-state-context";
import { AppUser, ProjectAttachment } from "@/types";
import { toast } from "sonner";

interface CommentFormProps {
  projectId: string;
}

export function CommentForm({ projectId }: CommentFormProps) {
  const { users, userProfile, addComment, isViewerOnly } = useAppState();

  const [content, setContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [stagedAttachments, setStagedAttachments] = useState<ProjectAttachment[]>([]);
  const [gdriveLinkOpen, setGdriveLinkOpen] = useState(false);
  const [gdriveUploadOpen, setGdriveUploadOpen] = useState(false);

  if (isViewerOnly) {
    return (
      <Card className="shadow-xs border-dashed bg-muted/20">
        <CardContent className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Eye className="w-4 h-4 text-blue-500" />
          <span>Mode Viewer Aktif: Anda dapat membaca riwayat diskusi proyek dalam mode baca saja.</span>
        </CardContent>
      </Card>
    );
  }

  const handleSelectUser = (user: AppUser) => {
    // Append mention to content
    const mentionTag = `@${user.name} `;
    setContent((prev) => {
      // If ends with @ replace with mentionTag, else append
      if (prev.endsWith("@")) {
        return prev.slice(0, -1) + mentionTag;
      }
      return prev ? `${prev} ${mentionTag}` : mentionTag;
    });

    if (!mentionedUserIds.includes(user.id)) {
      setMentionedUserIds((prev) => [...prev, user.id]);
    }
  };

  const handleAddStagedAttachment = (attData: Omit<ProjectAttachment, "id" | "uploadedAt">) => {
    const staged: ProjectAttachment = {
      ...attData,
      id: `att-staged-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    setStagedAttachments((prev) => [...prev, staged]);
    toast.success(`Berkas "${staged.fileName}" berhasil dilampirkan.`);
  };

  const handleRemoveStagedAttachment = (attId: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && stagedAttachments.length === 0) {
      toast.error("Komentar atau lampiran tidak boleh kosong.");
      return;
    }

    // Auto detect any user names mentioned in text with @
    const detectedUserIds = [...mentionedUserIds];
    users.forEach((u) => {
      if (content.includes(`@${u.name}`) && !detectedUserIds.includes(u.id)) {
        detectedUserIds.push(u.id);
      }
    });

    addComment(projectId, content.trim(), detectedUserIds, stagedAttachments);
    toast.success("Komentar berhasil dipublikasikan!");

    // Reset
    setContent("");
    setMentionedUserIds([]);
    setStagedAttachments([]);
  };

  return (
    <>
      <Card className="shadow-xs border-border/80">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Tulis Komentar & Diskusi Proyek
            </span>
            <span className="text-[11px]">
              Masuk sebagai: <strong className="text-foreground">{userProfile.fullName}</strong> ({userProfile.role})
            </span>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis instruksi teknis, koordinasi lapangan, atau mention rekan kerja dengan @ (contoh: @Ir. Ahmad Dahlan)..."
            rows={3}
            className="text-xs resize-none focus-visible:ring-emerald-500"
          />

          {/* Staged Attachments Chips */}
          {stagedAttachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Paperclip className="w-3 h-3 text-emerald-600" />
                <span>Lampiran Google Drive ({stagedAttachments.length}):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stagedAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs bg-muted/40 font-medium"
                  >
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                    >
                      {att.source === "GOOGLE_DRIVE_LINK" ? "Drive Link" : "Drive Upload"}
                    </Badge>
                    <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate max-w-[180px] font-sans">{att.fileName}</span>
                    <span className="text-[11px] text-muted-foreground">({att.fileSize})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStagedAttachment(att.id)}
                      className="text-muted-foreground hover:text-rose-500 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <MentionPicker users={users} onSelectUser={handleSelectUser} />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGdriveLinkOpen(true)}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-emerald-700 hover:border-emerald-300"
              >
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tautkan Drive</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGdriveUploadOpen(true)}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-emerald-700 hover:border-emerald-300"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unggah File</span>
              </Button>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() && stagedAttachments.length === 0}
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Komentar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <GDriveLinkDialog
        open={gdriveLinkOpen}
        onOpenChange={setGdriveLinkOpen}
        projectId={projectId}
        onSaveAttachment={handleAddStagedAttachment}
      />

      <GDriveUploadDialog
        open={gdriveUploadOpen}
        onOpenChange={setGdriveUploadOpen}
        projectId={projectId}
        onSaveAttachment={handleAddStagedAttachment}
      />
    </>
  );
}
