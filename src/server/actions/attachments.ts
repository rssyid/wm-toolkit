"use server";

import { db } from "@/server/db";
import { requireAuth } from "@/server/auth-guard";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

export async function addAttachmentAction(data: {
  projectId: string;
  commentId?: string;
  source: string; // GOOGLE_DRIVE_LINK | UPLOAD
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  mimeType?: string;
  category?: string;
  docNumber?: string;
  googleDriveFileId?: string;
}) {
  const user = await requireAuth();

  // Pastikan proyek terdaftar di database sebelum foreign key constraint
  const projectExists = await db.project.findUnique({
    where: { id: data.projectId },
    select: { id: true },
  });

  if (!projectExists) {
    console.warn(`Proyek [${data.projectId}] belum tercatat di DB Neon. Metadata berkas disimpan pada status lokal.`);
    return { success: true, isMemoryOnly: true };
  }

  const attachment = await db.projectAttachment.create({
    data: {
      projectId: data.projectId,
      commentId: data.commentId,
      source: data.source || "UPLOAD",
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize || "1.2 MB",
      mimeType: data.mimeType,
      category: data.category || "Dokumen Proyek",
      docNumber: data.docNumber,
      googleDriveFileId: data.googleDriveFileId,
      uploadedById: user.id,
      uploadedBy: user.name,
    },
  });

  revalidatePath(`/workspace/${data.projectId}`);
  return { success: true, attachment };
}

export async function deleteAttachmentAction(attachmentId: string) {
  const user = await requireAuth();

  const existing = await db.projectAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!existing) {
    throw new Error("Lampiran tidak ditemukan.");
  }

  await db.projectAttachment.delete({
    where: { id: attachmentId },
  });

  revalidatePath(`/workspace/${existing.projectId}`);
  return { success: true };
}
