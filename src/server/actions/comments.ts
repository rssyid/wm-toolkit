"use server";

import { db } from "@/server/db";
import { requireAuth } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { AddCommentSchema } from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

export async function addCommentAction(rawInput: unknown) {
  try {
    const user = await requireAuth();
    const parsed = AddCommentSchema.parse(rawInput);

    const project = await db.project.findUnique({
      where: { id: parsed.projectId },
      select: { id: true, name: true },
    });
    if (!project) {
      return { success: false, error: "Proyek tidak ditemukan." };
    }

    const result = await db.$transaction(async (tx) => {
      const comment = await tx.projectComment.create({
        data: {
          projectId: parsed.projectId,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          content: parsed.content,
          mentionedUserIds: parsed.mentionedUserIds as never,
        },
      });

      const createdAttachments = [];
      if (parsed.attachments && parsed.attachments.length > 0) {
        if (user.role === "VIEWER") {
          throw new Error("Peran VIEWER tidak memiliki izin mengunggah lampiran pada komentar.");
        }
        for (const att of parsed.attachments) {
          const createdAtt = await tx.projectAttachment.create({
            data: {
              projectId: parsed.projectId,
              commentId: comment.id,
              source: att.source || "UPLOAD",
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSize: att.fileSize || "",
              mimeType: att.mimeType,
              category: att.category || "Lampiran Diskusi",
              docNumber: att.docNumber,
              googleDriveFileId: att.googleDriveFileId,
              uploadedById: user.id,
              uploadedBy: user.name,
            },
          });
          createdAttachments.push(createdAtt);
        }
      }

      return { comment, attachments: createdAttachments };
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "COMMENT",
      entityId: result.comment.id,
      entityTitle: `Komentar pada ${project.name}`,
      projectId: project.id,
      projectName: project.name,
      afterData: {
        content: result.comment.content,
        attachmentCount: result.attachments.length,
      },
      notes: `Komentar baru dikirim oleh ${user.name}${
        result.attachments.length > 0 ? ` dengan ${result.attachments.length} lampiran` : ""
      }.`,
    });

    revalidatePath(`/workspace/${parsed.projectId}`);
    return {
      success: true,
      comment: result.comment,
      attachments: result.attachments,
    };
  } catch (error: unknown) {
    console.error("Gagal menyimpan komentar:", error);
    return { success: false, error: formatActionError(error, "Gagal menyimpan komentar.") };
  }
}

export async function deleteCommentAction(commentId: string) {
  try {
    const user = await requireAuth();

    const comment = await db.projectComment.findUnique({
      where: { id: commentId },
      include: { project: { select: { id: true, name: true } } },
    });

    if (!comment) {
      return { success: false, error: "Komentar tidak ditemukan." };
    }

    if (comment.userId !== user.id && user.role !== "ADMIN") {
      return { success: false, error: "Anda tidak memiliki hak untuk menghapus komentar ini." };
    }

    await db.projectComment.delete({
      where: { id: commentId },
    });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "COMMENT",
      entityId: comment.id,
      entityTitle: `Komentar pada ${comment.project.name}`,
      projectId: comment.projectId,
      projectName: comment.project.name,
      beforeData: { content: comment.content, userName: comment.userName },
      notes: `Komentar dihapus oleh ${user.name}.`,
    });

    revalidatePath(`/workspace/${comment.projectId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Gagal menghapus komentar:", error);
    return { success: false, error: formatActionError(error, "Gagal menghapus komentar.") };
  }
}
