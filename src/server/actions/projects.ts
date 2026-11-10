"use server";

import { db } from "@/server/db";
import { requireAuth, requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { CreateProjectSchema, UpdateProjectSchema, ScheduleRevisionSchema } from "@/server/schemas";
import { revalidatePath } from "next/cache";
import { getOrCreateGoogleDriveFolder } from "@/server/google-drive";

function toProjectStatusEnum(status?: string): "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED" {
  switch (status) {
    case "In Progress":
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "On Hold":
    case "ON_HOLD":
      return "ON_HOLD";
    case "Completed":
    case "COMPLETED":
      return "COMPLETED";
    case "Cancelled":
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "PLANNED";
  }
}

export async function createProjectAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateProjectSchema.parse(rawInput);

  const newProject = await db.project.create({
    data: {
      projectCode: parsed.code,
      name: parsed.name,
      description: parsed.description,
      picId: parsed.picId || user.id,
      status: toProjectStatusEnum(parsed.status),
      projectType: parsed.projectType,
      procurementType: parsed.procurementType,
      locationId: parsed.locationId,
      locationName: parsed.locationName,
      regionId: parsed.regionId,
      regionName: parsed.regionName,
      companyId: parsed.companyId,
      companyName: parsed.companyName,
      blockId: parsed.blockId,
      blockCode: parsed.blockCode,
      projectCategoryId: parsed.projectCategoryId,
      projectCategoryName: parsed.projectCategoryName,
      baselineStartDate: new Date(parsed.baselineStartDate),
      baselineEndDate: new Date(parsed.baselineEndDate),
      targetEndDate: new Date(parsed.targetEndDate),
      durationDays: parsed.durationDays,
      progressPercent: parsed.progress,
      ewsStatus: parsed.ewsStatus,
      scheduleMatrix: parsed.scheduleMatrix as any,
      createdById: user.id,
      workItems: parsed.workItems
        ? {
            create: parsed.workItems.map((w: any) => ({
              name: w.name,
              type: w.type || "Physical",
              weight: Number(w.weight) || 0,
              startDate: new Date(w.startDate || parsed.baselineStartDate),
              endDate: new Date(w.endDate || parsed.baselineEndDate),
              procurementType: w.procurementType || parsed.procurementType,
              progressMode: w.progressMode || "Daily",
              progress: Number(w.progress) || 0,
              status: toProjectStatusEnum(w.status),
              phase: w.phase || "Physical Execution",
              notes: w.notes,
            })),
          }
        : undefined,
      boqItems: parsed.surveyAndBoq
        ? {
            create: parsed.surveyAndBoq.map((b: any) => ({
              itemCode: b.itemCode || "ITEM-001",
              name: b.name,
              volume: Number(b.volume) || 0,
              unit: b.unit || "Unit",
              unitPrice: Number(b.unitPrice) || 0,
              totalPrice: Number(b.totalPrice) || 0,
              weight: Number(b.weight) || 0,
              status: b.status || "Draft",
            })),
          }
        : undefined,
    },
  });

  await recordServerAuditLog({
    action: "CREATE",
    entityType: "PROJECT",
    entityId: newProject.id,
    entityTitle: newProject.name,
    projectId: newProject.id,
    projectName: newProject.name,
    afterData: newProject,
    notes: `Proyek baru berhasil dibuat oleh ${user.name}`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/workspace");
  return { success: true, project: newProject };
}

export async function updateProjectAction(projectId: string, rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = UpdateProjectSchema.parse(rawInput);

  const existing = await db.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new Error("Proyek tidak ditemukan.");
  }

  const updated = await db.project.update({
    where: { id: projectId },
    data: {
      name: parsed.name,
      description: parsed.description,
      status: parsed.status ? toProjectStatusEnum(parsed.status) : undefined,
      projectType: parsed.projectType,
      procurementType: parsed.procurementType,
      targetEndDate: parsed.targetEndDate ? new Date(parsed.targetEndDate) : undefined,
      progressPercent: parsed.progress,
      ewsStatus: parsed.ewsStatus,
      scheduleMatrix: parsed.scheduleMatrix as any,
    },
  });

  await recordServerAuditLog({
    action: "UPDATE",
    entityType: "PROJECT",
    entityId: updated.id,
    entityTitle: updated.name,
    projectId: updated.id,
    projectName: updated.name,
    beforeData: existing,
    afterData: updated,
    notes: `Pembaruan data proyek oleh ${user.name}`,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/workspace/${projectId}`);
  return { success: true, project: updated };
}

export async function deleteProjectAction(projectId: string) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const existing = await db.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new Error("Proyek tidak ditemukan.");
  }

  // Soft delete
  const updated = await db.project.update({
    where: { id: projectId },
    data: { deletedAt: new Date() },
  });

  await recordServerAuditLog({
    action: "DELETE",
    entityType: "PROJECT",
    entityId: existing.id,
    entityTitle: existing.name,
    projectId: existing.id,
    projectName: existing.name,
    beforeData: existing,
    afterData: updated,
    notes: `Proyek dipindahkan ke tempat sampah (soft delete) oleh ${user.name}`,
  });

  revalidatePath("/workspace");
  return { success: true };
}

/**
 * Helper internal untuk menghapus proyek beserta seluruh relasi kaskade (cascade cleanup)
 * secara terurut dan aman dari foreign key constraint.
 */
async function cascadeDeleteSingleProject(tx: any, projectId: string) {
  // 1. Progres Fisik
  await tx.progressLog.deleteMany({ where: { projectId } });

  // 2. Jalur Pengadaan Barang: PO & Turunannya (Handover, Receipt, Item)
  const projectPos = await tx.purchaseOrder.findMany({ where: { projectId }, select: { id: true } });
  const poIds = projectPos.map((p: any) => p.id);
  if (poIds.length > 0) {
    await tx.goodsHandover.deleteMany({ where: { poId: { in: poIds } } });
    await tx.goodsReceipt.deleteMany({ where: { poId: { in: poIds } } });
    await tx.poItem.deleteMany({ where: { poId: { in: poIds } } });
  }
  await tx.purchaseOrder.deleteMany({ where: { projectId } });

  // 3. Purchase Requisition (PR) & Evaluasi Vendor
  const projectPrs = await tx.purchaseRequisition.findMany({ where: { projectId }, select: { id: true } });
  const prIds = projectPrs.map((p: any) => p.id);
  if (prIds.length > 0) {
    await tx.vendorEvaluation.deleteMany({ where: { prId: { in: prIds } } });
  }
  await tx.purchaseRequisition.deleteMany({ where: { projectId } });

  // 4. Jalur Pengadaan Jasa: USPK, Evaluasi Teknis, & Kontrak SPK
  const projectUspks = await tx.uspk.findMany({ where: { projectId }, select: { id: true } });
  const uspkIds = projectUspks.map((u: any) => u.id);
  if (uspkIds.length > 0) {
    await tx.spk.deleteMany({ where: { uspkId: { in: uspkIds } } });
    await tx.technicalEvaluation.deleteMany({ where: { uspkId: { in: uspkIds } } });
  }
  await tx.spk.deleteMany({ where: { projectId } });
  await tx.uspk.deleteMany({ where: { projectId } });

  // 5. AFCE & Riwayat Otorisasi Berjenjang
  const projectAfces = await tx.afce.findMany({ where: { projectId }, select: { id: true } });
  const afceIds = projectAfces.map((a: any) => a.id);
  if (afceIds.length > 0) {
    await tx.afceApprovalRecord.deleteMany({ where: { afceId: { in: afceIds } } });
    await tx.afceApprovalLevel.deleteMany({ where: { afceId: { in: afceIds } } });
  }
  await tx.afce.deleteMany({ where: { projectId } });

  // 6. Revisi Jadwal, BOQ, Work Items, Lampiran, & Komentar
  await tx.scheduleRevision.deleteMany({ where: { projectId } });
  await tx.boqItem.deleteMany({ where: { projectId } });
  await tx.workItem.deleteMany({ where: { projectId } });
  await tx.projectAttachment.deleteMany({ where: { projectId } });
  await tx.projectComment.deleteMany({ where: { projectId } });

  // 7. Entitas Utama Proyek
  await tx.project.delete({ where: { id: projectId } });
}

/**
 * Hard delete: Menghapus proyek secara permanen dari database beserta seluruh entitas terkait.
 * Khusus role ADMIN atau PIC.
 */
export async function hardDeleteProjectAction(projectId: string) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const existing = await db.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new Error("Proyek tidak ditemukan.");
  }

  await db.$transaction(async (tx) => {
    await cascadeDeleteSingleProject(tx, projectId);
  });

  await recordServerAuditLog({
    action: "DELETE",
    entityType: "PROJECT",
    entityId: existing.id,
    entityTitle: existing.name,
    projectId: existing.id,
    projectName: existing.name,
    beforeData: existing,
    notes: `Proyek ${existing.projectCode} (${existing.name}) dihapus permanen beserta seluruh entitas terkait oleh ${user.name}`,
  });

  revalidatePath("/workspace");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true };
}

/**
 * Empty Recycle Bin: Menghapus permanen seluruh proyek yang ada di tempat sampah (deletedAt != null).
 * Khusus role ADMIN.
 */
export async function emptyRecycleBinAction() {
  const user = await requireRole(["ADMIN"]);
  const deletedProjects = await db.project.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, projectCode: true, name: true },
  });

  if (deletedProjects.length === 0) {
    return { success: true, count: 0, message: "Recycle Bin sudah kosong." };
  }

  await db.$transaction(async (tx) => {
    for (const proj of deletedProjects) {
      await cascadeDeleteSingleProject(tx, proj.id);
    }
  });

  await recordServerAuditLog({
    action: "DELETE",
    entityType: "PROJECT",
    entityId: "system-recycle-bin",
    entityTitle: "Pembersihan Recycle Bin",
    notes: `Admin ${user.name} mengosongkan Recycle Bin (${deletedProjects.length} proyek dihapus permanen: ${deletedProjects.map((p) => p.projectCode).join(", ")})`,
  });

  revalidatePath("/workspace");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: true, count: deletedProjects.length };
}

export async function restoreProjectAction(projectId: string) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const existing = await db.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new Error("Proyek tidak ditemukan.");
  }

  const updated = await db.project.update({
    where: { id: projectId },
    data: { deletedAt: null },
  });

  await recordServerAuditLog({
    action: "UPDATE",
    entityType: "PROJECT",
    entityId: existing.id,
    entityTitle: existing.name,
    projectId: existing.id,
    projectName: existing.name,
    beforeData: existing,
    afterData: updated,
    notes: `Proyek dipulihkan dari tempat sampah oleh ${user.name}`,
  });

  revalidatePath("/workspace");
  return { success: true };
}

export async function reviseScheduleAction(projectId: string, rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = ScheduleRevisionSchema.parse(rawInput);

  const existing = await db.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new Error("Proyek tidak ditemukan.");
  }

  const revision = await db.scheduleRevision.create({
    data: {
      projectId,
      revisionNumber: parsed.revisionNumber,
      previousEndDate: new Date(parsed.previousEndDate),
      newEndDate: new Date(parsed.newEndDate),
      extendedWeeks: parsed.extendedWeeks,
      reason: parsed.reason,
      revisedAt: new Date(parsed.revisedAt),
      approvalDate: parsed.approvalDate ? new Date(parsed.approvalDate) : null,
      approvedBy: parsed.approvedBy,
      revisedBy: parsed.revisedBy,
      approvalStatus: parsed.approvalStatus,
      attachmentName: parsed.attachmentName,
    },
  });

  // Update targetEndDate and scheduleVarianceDays in project
  const diffDays = Math.round(
    (new Date(parsed.newEndDate).getTime() - new Date(existing.baselineEndDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  await db.project.update({
    where: { id: projectId },
    data: {
      targetEndDate: new Date(parsed.newEndDate),
      scheduleVarianceDays: Math.max(0, diffDays),
    },
  });

  await recordServerAuditLog({
    action: "UPDATE",
    entityType: "SCHEDULE_REVISION",
    entityId: revision.id,
    entityTitle: `Revisi Jadwal #${revision.revisionNumber}`,
    projectId: existing.id,
    projectName: existing.name,
    afterData: revision,
    notes: `Revisi jadwal disetujui: diperpanjang ${revision.extendedWeeks} minggu karena ${revision.reason}`,
  });

  revalidatePath(`/workspace/${projectId}`);
  return { success: true, revision };
}

/**
 * Ambil atau buat folder Google Drive khusus untuk proyek tertentu
 */
export async function getProjectDriveFolderAction(projectId: string): Promise<{
  success: boolean;
  folderId?: string;
  folderName?: string;
  webViewLink?: string;
  message?: string;
}> {
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectCode: true, name: true },
    });

    if (!project) {
      return { success: false, message: "Proyek tidak ditemukan" };
    }

    const folderName = `[${project.projectCode}] ${project.name}`.trim();
    const folderInfo = await getOrCreateGoogleDriveFolder({
      folderName,
      parentFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    });

    return {
      success: true,
      folderId: folderInfo.id,
      folderName: folderInfo.name,
      webViewLink: folderInfo.webViewLink,
    };
  } catch (error: any) {
    console.error(`Gagal mendapatkan folder Drive untuk proyek ${projectId}:`, error);
    return {
      success: false,
      message: error?.message || "Gagal mengakses folder Google Drive",
    };
  }
}
