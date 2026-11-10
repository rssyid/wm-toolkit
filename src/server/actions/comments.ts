"use server";

import { db } from "@/server/db";
import { requireAuth } from "@/server/auth-guard";
import { revalidatePath } from "next/cache";

export async function addCommentAction({
  projectId,
  content,
  mentionedUserIds = [],
}: {
  projectId: string;
  content: string;
  mentionedUserIds?: string[];
}) {
  const user = await requireAuth();

  const comment = await db.projectComment.create({
    data: {
      projectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      content,
      mentionedUserIds: mentionedUserIds as any,
    },
  });

  revalidatePath(`/workspace/${projectId}`);
  return { success: true, comment };
}

export async function deleteCommentAction(commentId: string) {
  const user = await requireAuth();

  const comment = await db.projectComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("Komentar tidak ditemukan.");
  }

  // Only creator or admin can delete
  if (comment.userId !== user.id && user.role !== "ADMIN") {
    throw new Error("Anda tidak memiliki hak untuk menghapus komentar ini.");
  }

  await db.projectComment.delete({
    where: { id: commentId },
  });

  revalidatePath(`/workspace/${comment.projectId}`);
  return { success: true };
}
