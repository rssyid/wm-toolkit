"use server";

import { db } from "@/server/db";
import { requireAuth, requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { CreateProjectSchema, UpdateProjectSchema, ScheduleRevisionSchema } from "@/server/schemas";
import { revalidatePath } from "next/cache";

export async function createProjectAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateProjectSchema.parse(rawInput);

  const newProject = await db.project.create({
    data: {
      projectCode: parsed.code,
      name: parsed.name,
      description: parsed.description,
      picId: parsed.picId || user.id,
      status: parsed.status as any,
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
              status: (w.status || "Planned") as any,
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
      status: parsed.status as any,
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
