import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth-guard";
import { AuditLogAction, AuditEntityType } from "@/generated/prisma/enums";

export interface CreateAuditLogParams {
  action: AuditLogAction;
  entityType: AuditEntityType;
  entityId: string;
  entityTitle?: string;
  projectId?: string;
  projectName?: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  notes?: string;
  ipAddress?: string;
}

export async function recordServerAuditLog(params: CreateAuditLogParams) {
  try {
    const user = await getCurrentUser();
    await db.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.name || "Sistem Otomatis",
        userRole: user?.role,
        userJabatan: user?.jabatan,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityTitle: params.entityTitle,
        projectId: params.projectId,
        projectName: params.projectName,
        beforeData: params.beforeData ? (params.beforeData as any) : undefined,
        afterData: params.afterData ? (params.afterData as any) : undefined,
        notes: params.notes,
        ipAddress: params.ipAddress || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("Gagal mencatat audit log server:", error);
    // Audit log failure should not block the primary transaction
  }
}
