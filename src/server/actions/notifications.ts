"use server";

import { db } from "@/server/db";
import { requireAuth } from "@/server/auth-guard";
import { formatActionError } from "@/server/errors";
import { CreateNotificationSchema, UpdateNotificationSettingSchema } from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

export async function createNotificationAction(rawInput: unknown) {
  try {
    const user = await requireAuth();
    const parsed = CreateNotificationSchema.parse(rawInput);

    const targetUserId = user.role === "ADMIN" && parsed.userId ? parsed.userId : user.id;

    const notif = await db.notification.create({
      data: {
        id: parsed.id || undefined,
        userId: targetUserId,
        type: parsed.type,
        title: parsed.title,
        message: parsed.message,
        priority: parsed.priority,
        linkUrl: parsed.linkUrl || undefined,
        projectId: parsed.projectId || undefined,
        projectCode: parsed.projectCode || undefined,
        projectName: parsed.projectName || undefined,
        isRead: false,
      },
    });

    revalidatePath("/notifications");
    return { success: true, notification: notif };
  } catch (error: unknown) {
    console.error("Gagal menyimpan notifikasi ke database:", error);
    return { success: false, error: formatActionError(error, "Gagal menyimpan notifikasi.") };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const user = await requireAuth();

    const updated = await db.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true },
    });

    if (updated.count === 0) {
      return { success: false, error: "Notifikasi tidak ditemukan atau bukan milik Anda." };
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Gagal menandai notifikasi sebagai dibaca:", error);
    return { success: false, error: formatActionError(error, "Gagal menandai notifikasi.") };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const user = await requireAuth();

    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Gagal menandai semua notifikasi sebagai dibaca:", error);
    return { success: false, error: formatActionError(error, "Gagal menandai semua notifikasi.") };
  }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    const user = await requireAuth();

    const deleted = await db.notification.deleteMany({
      where: { id: notificationId, userId: user.id },
    });

    if (deleted.count === 0) {
      return { success: false, error: "Notifikasi tidak ditemukan atau bukan milik Anda." };
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Gagal menghapus notifikasi:", error);
    return { success: false, error: formatActionError(error, "Gagal menghapus notifikasi.") };
  }
}

export async function clearAllNotificationsAction() {
  try {
    const user = await requireAuth();

    await db.notification.deleteMany({
      where: { userId: user.id },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Gagal membersihkan notifikasi:", error);
    return { success: false, error: formatActionError(error, "Gagal membersihkan notifikasi.") };
  }
}

export async function updateNotificationSettingAction(notificationType: string, isEnabled: boolean) {
  try {
    const user = await requireAuth();
    const parsed = UpdateNotificationSettingSchema.parse({ notificationType, isEnabled });

    await db.notificationSetting.upsert({
      where: {
        userId_notificationType: {
          userId: user.id,
          notificationType: parsed.notificationType,
        },
      },
      update: { isEnabled: parsed.isEnabled },
      create: {
        userId: user.id,
        notificationType: parsed.notificationType,
        isEnabled: parsed.isEnabled,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    console.error("Gagal memperbarui pengaturan notifikasi:", error);
    return { success: false, error: formatActionError(error, "Gagal memperbarui pengaturan notifikasi.") };
  }
}
