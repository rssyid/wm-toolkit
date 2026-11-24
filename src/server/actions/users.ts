"use server";

import { db } from "@/server/db";
import { requireAuth } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { UpdateUserProfileSchema, ChangePasswordSchema } from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";
import bcrypt from "bcryptjs";

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  jabatan: true,
  estateName: true,
  bio: true,
  timeZone: true,
  avatarUrl: true,
  isActive: true,
  updatedAt: true,
};

export async function updateCurrentUserProfileAction(rawInput: unknown) {
  try {
    const user = await requireAuth();
    const parsed = UpdateUserProfileSchema.parse(rawInput);

    const existing = await db.user.findUnique({
      where: { id: user.id },
      select: USER_PUBLIC_SELECT,
    });
    if (!existing) {
      return { success: false, error: "Akun pengguna tidak ditemukan." };
    }

    const updatedName = parsed.fullName || parsed.name || existing.name;
    const updatedJabatan = parsed.jabatan ?? parsed.role ?? existing.jabatan;
    const updatedEstate =
      parsed.selectedLocation !== undefined
        ? parsed.selectedLocation
        : parsed.estateName !== undefined
        ? parsed.estateName
        : existing.estateName;

    let updatedEmail = existing.email;
    if (parsed.email !== undefined) {
      const cleanEmail = parsed.email.trim().toLowerCase();
      if (cleanEmail !== existing.email.toLowerCase()) {
        const dup = await db.user.findFirst({
          where: { email: cleanEmail, NOT: { id: user.id } },
          select: { id: true },
        });
        if (dup) {
          return {
            success: false,
            error: `Alamat email "${cleanEmail}" sudah digunakan oleh pengguna lain.`,
          };
        }
        updatedEmail = cleanEmail;
      }
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: updatedName,
        email: updatedEmail,
        jabatan: updatedJabatan,
        estateName: updatedEstate,
        ...(parsed.bio !== undefined ? { bio: parsed.bio } : {}),
        ...(parsed.timeZone !== undefined ? { timeZone: parsed.timeZone } : {}),
        ...(parsed.avatarUrl !== undefined ? { avatarUrl: parsed.avatarUrl } : {}),
      },
      select: USER_PUBLIC_SELECT,
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "USER",
      entityId: user.id,
      entityTitle: updatedUser.name,
      beforeData: {
        name: existing.name,
        email: existing.email,
        jabatan: existing.jabatan,
        estateName: existing.estateName,
        timeZone: existing.timeZone,
      },
      afterData: {
        name: updatedUser.name,
        email: updatedUser.email,
        jabatan: updatedUser.jabatan,
        estateName: updatedUser.estateName,
        timeZone: updatedUser.timeZone,
      },
      notes: `Profil pengguna ${updatedUser.name} diperbarui.`,
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, user: updatedUser };
  } catch (err: unknown) {
    console.error("Gagal memperbarui profil pengguna:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui profil pengguna.") };
  }
}

export async function changeCurrentUserPasswordAction(rawInput: unknown) {
  try {
    const user = await requireAuth();
    const parsed = ChangePasswordSchema.parse(rawInput);

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, passwordHash: true },
    });

    if (!dbUser) {
      return { success: false, error: "Akun pengguna tidak ditemukan di database." };
    }

    const isMatch = await bcrypt.compare(parsed.currentPassword, dbUser.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Kata sandi saat ini yang Anda masukkan salah." };
    }

    if (parsed.currentPassword === parsed.newPassword) {
      return {
        success: false,
        error: "Kata sandi baru tidak boleh sama dengan kata sandi saat ini.",
      };
    }

    const newPasswordHash = await bcrypt.hash(parsed.newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "USER",
      entityId: user.id,
      entityTitle: dbUser.name,
      notes: `Pengguna ${dbUser.name} memperbarui kata sandi akun.`,
    });

    revalidatePath("/settings");
    return { success: true, message: "Kata sandi akun Anda berhasil diperbarui." };
  } catch (err: unknown) {
    console.error("Gagal mengganti kata sandi:", err);
    return { success: false, error: formatActionError(err, "Gagal mengganti kata sandi.") };
  }
}
