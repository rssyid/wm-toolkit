"use server";

import { db } from "@/server/db";
import { requireAuth } from "@/server/auth-guard";
import { revalidatePath } from "next/cache";

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
