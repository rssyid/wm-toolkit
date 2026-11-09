"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
  MessageSquare,
  Users,
  Paperclip,
  Clock,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentList } from "@/components/comments/comment-list";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate } from "@/lib/utils";

export default function CommentsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, comments, attachments } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  const projectComments = comments.filter((c) => c.projectId === projectId);
  const projectAttachments = attachments.filter((a) => a.projectId === projectId);

  // Calculate unique participants
  const participantNames = Array.from(
    new Set(projectComments.map((c) => c.userName))
  );

  const totalCommentAttachments = projectComments.reduce(
    (sum, c) => sum + (c.attachments?.length || 0),
    0
  );

  const latestComment = projectComments[0];

  return (
    <div className="space-y-4">
      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Komentar
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {projectComments.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Diskusi terpusat proyek
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Anggota Terlibat
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {participantNames.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PIC, Manager & Engineer
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Berkas Google Drive
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {totalCommentAttachments}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tersinkron di repositori
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Paperclip className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Aktivitas Terakhir
              </p>
              <h3 className="text-xs font-bold text-foreground mt-1 truncate max-w-[140px]">
                {latestComment ? latestComment.userName : "Belum Ada"}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {latestComment
                  ? formatIDDate(latestComment.createdAt.split("T")[0])
                  : "Menunggu diskusi"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Discussion Area */}
      <div className="space-y-4">
        {/* Input Form */}
        <CommentForm projectId={projectId} />

        {/* List of Comments */}
        <CommentList projectId={projectId} />
      </div>
    </div>
  );
}
