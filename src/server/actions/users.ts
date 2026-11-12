"use server";

import { db } from "@/server/db";
import { requireAuth } from "@/server/auth-guard";
import { UpdateUserProfileSchema, ChangePasswordSchema } from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";
import bcrypt from "bcryptjs";

export async function updateCurrentUserProfileAction(rawInput: any) {
  try {
    const user = await requireAuth();
    const parsed = UpdateUserProfileSchema.parse(rawInput);

    const updatedName = parsed.fullName || parsed.name || user.name;
    const updatedJabatan = parsed.jabatan || parsed.role || user.jabatan;
    const updatedEstate =
      parsed.selectedLocation !== undefined
        ? parsed.selectedLocation
        : parsed.estateName !== undefined
        ? parsed.estateName
        : user.estateName;

    const dataToUpdate: any = {
      name: updatedName,
      jabatan: updatedJabatan,
      estateName: updatedEstate,
    };

    if (parsed.avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = parsed.avatarUrl;
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, user: updatedUser };
  } catch (err: any) {
    console.error("Gagal memperbarui profil pengguna:", err);
    return { success: false, error: err.message || "Gagal memperbarui profil pengguna." };
  }
}

export async function changeCurrentUserPasswordAction(rawInput: any) {
  try {
    const user = await requireAuth();
    const parsed = ChangePasswordSchema.parse(rawInput);

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
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

    revalidatePath("/settings");
    return { success: true, message: "Kata sandi akun Anda berhasil diperbarui." };
  } catch (err: any) {
    console.error("Gagal mengganti kata sandi:", err);
    return { success: false, error: err.message || "Gagal mengganti kata sandi." };
  }
}
