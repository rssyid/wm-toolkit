"use server";

import { db } from "@/server/db";
import { requireAuth } from "@/server/auth-guard";
import { CreateNotificationSchema } from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

export async function createNotificationAction(rawInput: any) {
  try {
    const user = await requireAuth();
    const parsed = CreateNotificationSchema.parse(rawInput);

    const targetUserId = parsed.userId || user.id;

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
  } catch (error: any) {
    console.error("Gagal menyimpan notifikasi ke database:", error);
    return { success: false, error: error.message };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    await requireAuth();

    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal menandai notifikasi sebagai dibaca:", error);
    return { success: false, error: error.message };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const user = await requireAuth();

    // Tandai semua notifikasi untuk user tersebut, atau semua notifikasi jika ADMIN
    if (user.role === "ADMIN") {
      await db.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else {
      await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal menandai semua notifikasi sebagai dibaca:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    await requireAuth();

    await db.notification.delete({
      where: { id: notificationId },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal menghapus notifikasi:", error);
    return { success: false, error: error.message };
  }
}

export async function clearAllNotificationsAction() {
  try {
    const user = await requireAuth();

    if (user.role === "ADMIN") {
      await db.notification.deleteMany();
    } else {
      await db.notification.deleteMany({
        where: { userId: user.id },
      });
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal membersihkan notifikasi:", error);
    return { success: false, error: error.message };
  }
}

export async function updateNotificationSettingAction(notificationType: string, isEnabled: boolean) {
  try {
    const user = await requireAuth();

    await db.notificationSetting.upsert({
      where: {
        userId_notificationType: {
          userId: user.id,
          notificationType,
        },
      },
      update: { isEnabled },
      create: {
        userId: user.id,
        notificationType,
        isEnabled,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Gagal memperbarui pengaturan notifikasi:", error);
    return { success: false, error: error.message };
  }
}
