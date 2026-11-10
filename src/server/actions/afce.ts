"use server";

import { db } from "@/server/db";
import { requireAuth, requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { ProcessAfceActionSchema } from "@/server/schemas";
import { revalidatePath } from "next/cache";

export async function processAfceApprovalAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC", "APPROVER"]);
  const parsed = ProcessAfceActionSchema.parse(rawInput);

  const afce = await db.afce.findUnique({
    where: { id: parsed.afceId },
    include: {
      project: true,
      approvalMatrixLevels: { orderBy: { level: "asc" } },
      approvalRecords: true,
    },
  });

  if (!afce) {
    throw new Error("Dokumen AFCE tidak ditemukan.");
  }

  const previousStatus = afce.status;
  const now = new Date();

  // Determine new status based on action
  let newStatus = afce.status;
  if (parsed.action === "Reject") {
    newStatus = "REJECTED";
  } else if (parsed.action === "Revise") {
    newStatus = "NEED_REVISION";
  } else if (parsed.action === "Approve") {
    // Check if all required levels will be approved
    const levels = afce.approvalMatrixLevels;
    const targetIdx = parsed.targetLevelIndex ?? (afce.currentLevel - 1);
    
    // Update target level in DB
    if (levels[targetIdx]) {
      await db.afceApprovalLevel.update({
        where: { id: levels[targetIdx].id },
        data: {
          status: "Approved",
          approverName: parsed.approverName,
          approverJabatan: parsed.approverJabatan || parsed.approverRole,
          decidedAt: parsed.approvalDate ? new Date(parsed.approvalDate) : now,
          note: parsed.note,
          sapDocNumber: parsed.sapDocNumber,
          sapEvidenceUrl: parsed.sapEvidenceUrl,
        },
      });
    }

    // Check how many levels are now approved
    const updatedLevels = await db.afceApprovalLevel.findMany({
      where: { afceId: afce.id },
      orderBy: { level: "asc" },
    });

    const allApproved = updatedLevels.every((l) => !l.isRequired || l.status === "Approved");
    if (allApproved) {
      newStatus = "APPROVED";
    } else {
      newStatus = "PENDING_APPROVAL";
    }
  }

  // Create approval record
  const record = await db.afceApprovalRecord.create({
    data: {
      afceId: afce.id,
      approverName: parsed.approverName,
      approverRole: parsed.approverRole,
      approverJabatan: parsed.approverJabatan,
      action: parsed.action,
      timestamp: now,
      approvalDate: parsed.approvalDate ? new Date(parsed.approvalDate) : now,
      note: parsed.note,
      previousStatus: previousStatus,
      newStatus: newStatus,
      sapDocNumber: parsed.sapDocNumber,
      sapEvidenceUrl: parsed.sapEvidenceUrl,
      recordedById: user.id,
    },
  });

  // Update AFCE header
  const updatedAfce = await db.afce.update({
    where: { id: afce.id },
    data: {
      status: newStatus as any,
      sapDocNumber: parsed.sapDocNumber || afce.sapDocNumber,
      approvedAt: newStatus === "APPROVED" ? now : afce.approvedAt,
    },
  });

  await recordServerAuditLog({
    action: parsed.action === "Approve" ? "APPROVE" : parsed.action === "Reject" ? "REJECT" : "UPDATE",
    entityType: "AFCE",
    entityId: afce.id,
    entityTitle: `AFCE ${afce.afceNumber}`,
    projectId: afce.projectId,
    projectName: afce.project.name,
    beforeData: { status: previousStatus },
    afterData: { status: newStatus, record },
    notes: `Otorisasi AFCE (${parsed.action}) dicatat oleh ${user.name} untuk tingkat ${parsed.approverRole}`,
  });

  revalidatePath(`/workspace/${afce.projectId}/afce`);
  revalidatePath(`/dashboard`);
  return { success: true, afce: updatedAfce, record };
}

export async function submitAfceApprovalAction(afceId: string, note: string) {
  const user = await requireRole(["ADMIN", "PIC"]);

  const afce = await db.afce.findUnique({
    where: { id: afceId },
    include: { project: true },
  });

  if (!afce) {
    throw new Error("Dokumen AFCE tidak ditemukan.");
  }

  const updated = await db.afce.update({
    where: { id: afceId },
    data: {
      status: "PENDING_APPROVAL",
      submittedAt: new Date(),
    },
  });

  await db.afceApprovalRecord.create({
    data: {
      afceId: afce.id,
      approverName: user.name,
      approverRole: "PIC Proyek",
      action: "Submit",
      note: note || "AFCE diajukan untuk proses approval berjenjang sesuai SAP.",
      previousStatus: afce.status,
      newStatus: "PENDING_APPROVAL",
      recordedById: user.id,
    },
  });

  await recordServerAuditLog({
    action: "SUBMIT",
    entityType: "AFCE",
    entityId: afce.id,
    entityTitle: `AFCE ${afce.afceNumber}`,
    projectId: afce.projectId,
    projectName: afce.project.name,
    notes: `AFCE diajukan ke proses persetujuan oleh ${user.name}`,
  });

  revalidatePath(`/workspace/${afce.projectId}/afce`);
  return { success: true, afce: updated };
}

export async function updateAfceAction(afceId: string, updates: any) {
  const user = await requireRole(["ADMIN", "PIC"]);

  const updated = await db.afce.update({
    where: { id: afceId },
    data: {
      amount: updates.value ? Number(updates.value) : undefined,
      sapDocNumber: updates.sapDocNumber,
      sapReference: updates.sapReference,
      sapScreenshotUrl: updates.sapScreenshotPlaceholder || updates.sapScreenshotUrl,
    },
  });

  revalidatePath(`/workspace/${updated.projectId}/afce`);
  return { success: true, afce: updated };
}
