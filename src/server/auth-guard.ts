import { auth } from "@/auth";
import { db } from "@/server/db";
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
  // Support internal test scripts with explicit TEST_AUTH_USER_ID
  if (process.env.TEST_AUTH_USER_ID) {
    const testUser = await db.user.findUnique({
      where: { id: process.env.TEST_AUTH_USER_ID },
    });
    if (testUser) {
      return {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role,
        jabatan: testUser.jabatan || undefined,
        estateName: testUser.estateName || undefined,
      };
    }
  }

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
