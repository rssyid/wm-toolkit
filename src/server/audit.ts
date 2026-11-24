import { headers } from "next/headers";
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
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

async function resolveRequestMeta(): Promise<{ ipAddress: string; userAgent?: string }> {
  try {
    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");
    const realIp = h.get("x-real-ip");
    const ip =
      (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) ||
      realIp?.trim() ||
      "tidak diketahui";
    const ua = h.get("user-agent") || undefined;
    return { ipAddress: ip, userAgent: ua };
  } catch {
    return { ipAddress: "cli-lokal" };
  }
}

export async function recordServerAuditLog(params: CreateAuditLogParams) {
  try {
    const [user, reqMeta] = await Promise.all([getCurrentUser(), resolveRequestMeta()]);
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
        beforeData: params.beforeData ? (params.beforeData as never) : undefined,
        afterData: params.afterData ? (params.afterData as never) : undefined,
        notes: params.notes,
        ipAddress: params.ipAddress || reqMeta.ipAddress,
        userAgent: params.userAgent || reqMeta.userAgent,
      },
    });
  } catch (error) {
    console.error("Gagal mencatat audit log server:", error);
  }
}
