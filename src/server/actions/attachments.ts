"use server";

import { db } from "@/server/db";
import { requireAuth, requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { AddAttachmentSchema } from "@/server/schemas";
import { deleteFileFromGoogleDrive } from "@/server/google-drive";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

export async function addAttachmentAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC", "APPROVER"]);
    const parsed = AddAttachmentSchema.parse(rawInput);

    const project = await db.project.findUnique({
      where: { id: parsed.projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return { success: false, error: "Proyek tidak ditemukan di database." };
    }

    const attachment = await db.projectAttachment.create({
      data: {
        projectId: parsed.projectId,
        commentId: parsed.commentId,
        source: parsed.source,
        fileName: parsed.fileName,
        fileUrl: parsed.fileUrl,
        fileSize: parsed.fileSize || "",
        mimeType: parsed.mimeType,
        category: parsed.category || "Dokumen Proyek",
        docNumber: parsed.docNumber,
        googleDriveFileId: parsed.googleDriveFileId,
        uploadedById: user.id,
        uploadedBy: user.name,
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "ATTACHMENT",
      entityId: attachment.id,
      entityTitle: attachment.fileName,
      projectId: project.id,
      projectName: project.name,
      afterData: {
        fileName: attachment.fileName,
        source: attachment.source,
        category: attachment.category,
      },
      notes: `Berkas "${attachment.fileName}" ditautkan ke proyek oleh ${user.name}.`,
    });

    revalidatePath(`/workspace/${parsed.projectId}`);
    return { success: true, attachment };
  } catch (error: unknown) {
    console.error("Gagal menyimpan lampiran:", error);
    return { success: false, error: formatActionError(error, "Gagal menyimpan lampiran.") };
  }
}

export async function deleteAttachmentAction(attachmentId: string) {
  try {
    const user = await requireAuth();

    const existing = await db.projectAttachment.findUnique({
      where: { id: attachmentId },
      include: { project: { select: { id: true, name: true } } },
    });

    if (!existing) {
      return { success: false, error: "Lampiran tidak ditemukan." };
    }

    if (existing.uploadedById !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Hanya pengunggah berkas atau Administrator yang dapat menghapus lampiran ini.",
      };
    }

    await db.projectAttachment.delete({
      where: { id: attachmentId },
    });

    if (existing.source === "UPLOAD" && existing.googleDriveFileId) {
      await deleteFileFromGoogleDrive(existing.googleDriveFileId);
    }

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "ATTACHMENT",
      entityId: existing.id,
      entityTitle: existing.fileName,
      projectId: existing.projectId,
      projectName: existing.project.name,
      beforeData: {
        fileName: existing.fileName,
        source: existing.source,
      },
      notes: `Lampiran "${existing.fileName}" dihapus oleh ${user.name}.`,
    });

    revalidatePath(`/workspace/${existing.projectId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Gagal menghapus lampiran:", error);
    return { success: false, error: formatActionError(error, "Gagal menghapus lampiran.") };
  }
}
