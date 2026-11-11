"use server";

import { db } from "@/server/db";
import { requireAuth } from "@/server/auth-guard";
import { UpdateUserProfileSchema } from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

export async function updateCurrentUserProfileAction(rawInput: any) {
  const user = await requireAuth();
  const parsed = UpdateUserProfileSchema.parse(rawInput);

  const updatedName = parsed.fullName || parsed.name || user.name;
  const updatedJabatan = parsed.jabatan || parsed.role || user.jabatan;
  const updatedEstate = parsed.selectedLocation !== undefined ? parsed.selectedLocation : parsed.estateName !== undefined ? parsed.estateName : user.estateName;

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      name: updatedName,
      jabatan: updatedJabatan,
      estateName: updatedEstate,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, user: updatedUser };
}
