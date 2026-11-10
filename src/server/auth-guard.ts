import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  jabatan?: string;
  estateName?: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return {
    id: session.user.id,
    name: session.user.name || "Pengguna",
    email: session.user.email || "",
    role: (session.user as any).role || "PIC",
    jabatan: (session.user as any).jabatan,
    estateName: (session.user as any).estateName,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Sesi Anda telah berakhir. Silakan login kembali.");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `FORBIDDEN: Peran ${user.role} tidak memiliki hak akses untuk melakukan aksi ini. Diperlukan: ${allowedRoles.join(", ")}`
    );
  }
  return user;
}
