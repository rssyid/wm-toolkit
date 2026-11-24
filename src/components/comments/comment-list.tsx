"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Search,
  Trash2,
  ExternalLink,
  Paperclip,
  Calendar,
  User,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { useAppState } from "@/context/app-state-context";
import { ProjectAttachment } from "@/types";
import { formatIDDate } from "@/lib/utils";
import { toast } from "sonner";

interface CommentListProps {
  projectId: string;
}

export function CommentList({ projectId }: CommentListProps) {
  const {
    comments,
    attachments,
    deleteComment,
    users,
    userProfile,
    activeUserId,
    isAdmin,
    isViewerOnly,
  } = useAppState();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter comments for this project
  const projectComments = comments.filter((c) => c.projectId === projectId);

  const filteredComments = projectComments.filter((c) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUser =
      selectedUserFilter === "ALL" ||
      c.userId === selectedUserFilter ||
      c.mentionedUserIds?.includes(selectedUserFilter);

    return matchesSearch && matchesUser;
  });

  const getInitials = (name: string) => {
    return name
      .replace(/^(Ir\.|Dr\.|Drs\.|Dra\.)\s*/i, "")
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const datePart = formatIDDate(isoString.split("T")[0]);
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      return `${datePart}, ${hours}:${minutes} WIB`;
    } catch {
      return isoString;
    }
  };

  const renderFormattedContent = (content: string) => {
    const escapedNames = users
      .map((u) => u.name)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map((name) => `@${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

    const pattern =
      escapedNames.length > 0
        ? new RegExp(`(${escapedNames.join("|")}|@[^\\s]+)`, "g")
        : /(@[^\s]+)/g;

    const tokens = content.split(pattern);

    return (
      <span className="leading-relaxed">
        {tokens.map((token, idx) => {
          if (token.startsWith("@") && token.length > 1) {
            const cleanMentionName = token.slice(1).trim();
            const matchedUser = users.find(
              (u) => u.name.toLowerCase() === cleanMentionName.toLowerCase()
            );

            return (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded font-medium text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40"
              >
                @{matchedUser ? matchedUser.name : cleanMentionName}
              </span>
            );
          }
          return <React.Fragment key={idx}>{token}</React.Fragment>;
        })}
      </span>
    );
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    try {
      const ok = await deleteComment(confirmDeleteId);
      if (ok) {
        toast.success("Komentar telah dihapus.");
        setConfirmDeleteId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari komentar atau nama pengirim..."
            className="pl-8 text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter Anggota:
          </span>
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            aria-label="Filter komentar berdasarkan anggota tim"
            className="h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">Semua Anggota Tim</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feed List */}
      {filteredComments.length === 0 ? (
        <Card className="shadow-sm border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs font-semibold text-foreground">Belum ada diskusi atau komentar</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Gunakan formulir di atas untuk berkoordinasi, mencatat instruksi manajerial, atau menautkan berkas Google Drive proyek.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-6 border-l-2 border-emerald-500/30 dark:border-emerald-500/20 space-y-4 ml-2 sm:ml-4">
          {filteredComments.map((comment) => {
            // Find all attachments associated with this comment (either embedded or by commentId)
            const commentAttachments: ProjectAttachment[] = [
              ...(comment.attachments || []),
              ...attachments.filter(
                (a) =>
                  a.commentId === comment.id &&
                  !(comment.attachments || []).some((ca) => ca.id === a.id)
              ),
            ];

            const isAuthor =
              (Boolean(activeUserId) && comment.userId === activeUserId) ||
              comment.userName === userProfile.fullName ||
              comment.userId === userProfile.username;
            const canDelete = !isViewerOnly && (isAdmin || isAuthor);

            return (
              <div key={comment.id} className="relative">
                {/* Timeline Node Dot */}
                <span className="absolute -left-[31px] top-4 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-background" />

                <Card className="shadow-sm hover:border-border transition-colors border-border/80">
                  <CardContent className="p-4 space-y-3">
                    {/* Author Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
                        </Avatar>

                        <div className="leading-tight">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
                              {comment.userName}
                            </span>
                            {comment.userRole && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 font-normal bg-muted text-muted-foreground"
                              >
                                {comment.userRole}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-muted-foreground/70" />
                            <span>{formatTimestamp(comment.createdAt)}</span>
                          </span>
                        </div>
                      </div>

                      {canDelete && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDeleteId(comment.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Hapus komentar"
                            aria-label="Hapus komentar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                  {/* Comment Body */}
                  <div className="text-xs text-foreground/90 leading-relaxed pl-10">
                    {renderFormattedContent(comment.content)}
                  </div>

                  {/* Attached Files List */}
                  {commentAttachments.length > 0 && (
                    <div className="pl-10 pt-1 space-y-1.5">
                      <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-emerald-600" />
                        <span>Lampiran Google Drive ({commentAttachments.length}):</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {commentAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/40"
                              >
                                {att.source === "GOOGLE_DRIVE_LINK" ? "Drive Link" : "Drive Upload"}
                              </Badge>
                              <div className="truncate">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {att.fileName}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {att.fileSize} {att.docNumber ? `• ${att.docNumber}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <AttachmentPreview
                                filename={att.fileName}
                                fileUrl={att.fileUrl}
                                fileId={att.googleDriveFileId || undefined}
                                mimeType={att.mimeType}
                                title={att.fileName}
                                description={`Sumber: Google Drive • ${att.category || "Dokumen Proyek"}`}
                                size={att.fileSize}
                                category={att.category}
                                docNumber={att.docNumber}
                                uploadedBy={att.uploadedBy}
                              />

                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-emerald-600"
                                title="Buka tautan Google Drive"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      )}

      <Dialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isDeleting) setConfirmDeleteId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Hapus Komentar</DialogTitle>
            <DialogDescription className="text-xs">
              Komentar ini akan dihapus secara permanen dari riwayat diskusi proyek.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteId(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus Komentar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
