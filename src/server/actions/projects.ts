"use server";

import { db } from "@/server/db";
import { requireAuth, requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { toPlainObject } from "@/server/serialize";
import { APPROVAL_LEVEL_LABELS, ApprovalLevel } from "@/types";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ScheduleRevisionSchema,
  WorkItemInputSchema,
  UpdateWorkItemSchema,
  BoqItemInputSchema,
} from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";
import { getOrCreateGoogleDriveFolder } from "@/server/google-drive";

function toProjectStatusEnum(
  status?: string
): "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED" {
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

function toAfceStatusEnum(
  status?: string
): "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "NEED_REVISION" {
  switch (status) {
    case "Pending Approval":
    case "PENDING_APPROVAL":
      return "PENDING_APPROVAL";
    case "Approved":
    case "APPROVED":
      return "APPROVED";
    case "Rejected":
    case "REJECTED":
      return "REJECTED";
    case "Need Revision":
    case "NEED_REVISION":
      return "NEED_REVISION";
    default:
      return "DRAFT";
  }
}

export async function createProjectAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreateProjectSchema.parse(rawInput);

    const afceVal = parsed.afceValue || 250000000;
    const afceNum =
      parsed.afceNumber || `AFCE-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const afceStatusEnum = toAfceStatusEnum(parsed.afceStatus);
    const now = new Date();

    const dbRules = await db.approvalMatrixRule.findMany({
      where: { active: true },
      orderBy: { minValue: "asc" },
    });

    const matchedTier =
      dbRules.find((t) => afceVal >= Number(t.minValue) && afceVal <= Number(t.maxValue)) ||
      dbRules[0];

    const activeCodes: string[] =
      matchedTier && Array.isArray(matchedTier.levels)
        ? (matchedTier.levels as string[]).filter(Boolean)
        : ["WM"];

    const locIds = parsed.locationIds?.length
      ? parsed.locationIds
      : parsed.locationId
      ? [parsed.locationId]
      : [];
    const locNames = parsed.locationNames?.length
      ? parsed.locationNames
      : parsed.locationName
      ? [parsed.locationName]
      : [];
    const blkIds = parsed.blockIds?.length
      ? parsed.blockIds
      : parsed.blockId
      ? [parsed.blockId]
      : [];
    const blkCodes = parsed.blockCodes?.length
      ? parsed.blockCodes
      : parsed.blockCode
      ? [parsed.blockCode]
      : [];

    const result = await db.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          id: parsed.id || undefined,
          projectCode: parsed.code,
          name: parsed.name,
          description: parsed.description,
          picId: parsed.picId || user.id,
          status: toProjectStatusEnum(parsed.status),
          projectType: parsed.projectType,
          procurementType: parsed.procurementType,
          locationId: parsed.locationId || locIds[0],
          locationName: parsed.locationName || locNames[0],
          locationIds: locIds.length > 0 ? (locIds as never) : undefined,
          locationNames: locNames.length > 0 ? (locNames as never) : undefined,
          regionId: parsed.regionId,
          regionName: parsed.regionName,
          companyId: parsed.companyId,
          companyName: parsed.companyName,
          blockId: parsed.blockId || blkIds[0],
          blockCode: parsed.blockCode || blkCodes[0],
          blockIds: blkIds.length > 0 ? (blkIds as never) : undefined,
          blockCodes: blkCodes.length > 0 ? (blkCodes as never) : undefined,
          projectCategoryId: parsed.projectCategoryId,
          projectCategoryName: parsed.projectCategoryName,
          baselineStartDate: new Date(parsed.baselineStartDate),
          baselineEndDate: new Date(parsed.baselineEndDate),
          targetEndDate: new Date(parsed.targetEndDate),
          durationDays: parsed.durationDays,
          progressPercent: parsed.progress,
          ewsStatus: parsed.ewsStatus,
          scheduleMatrix: parsed.scheduleMatrix as never,
          createdById: user.id,
          workItems:
            parsed.workItems && parsed.workItems.length > 0
              ? {
                  create: parsed.workItems.map((w) => ({
                    id: w.id || undefined,
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
                    notes: w.notes ?? undefined,
                  })),
                }
              : undefined,
          boqItems:
            parsed.surveyAndBoq && parsed.surveyAndBoq.length > 0
              ? {
                  create: parsed.surveyAndBoq.map((b) => ({
                    id: b.id || undefined,
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
        include: {
          pic: { select: { id: true, name: true } },
          workItems: true,
          boqItems: true,
        },
      });

      const matrixLevelsData = activeCodes.map((code, idx) => {
        const label = APPROVAL_LEVEL_LABELS[code as ApprovalLevel] || code;
        let levelStatus = "Waiting";
        if (afceStatusEnum === "APPROVED") {
          levelStatus = "Approved";
        } else if (afceStatusEnum === "PENDING_APPROVAL" && idx === 0) {
          levelStatus = "Pending";
        }
        return {
          level: idx + 1,
          code,
          label,
          isRequired: true,
          status: levelStatus,
          approverJabatan: label,
          approverName: afceStatusEnum === "APPROVED" ? user.name : undefined,
          decidedAt: afceStatusEnum === "APPROVED" ? now : undefined,
        };
      });

      const currentLevel =
        afceStatusEnum === "APPROVED"
          ? activeCodes.length
          : afceStatusEnum === "PENDING_APPROVAL"
          ? 1
          : 0;
      const currentApproverRole =
        APPROVAL_LEVEL_LABELS[activeCodes[0] as ApprovalLevel] ||
        activeCodes[0] ||
        "Water Management";

      const newAfce = await tx.afce.create({
        data: {
          id: parsed.afceId || undefined,
          projectId: newProject.id,
          afceNumber: afceNum,
          amount: afceVal,
          status: afceStatusEnum,
          sapDocNumber: parsed.sapDocNumber || undefined,
          currentLevel,
          requiredLevels: activeCodes.length,
          currentApproverRole,
          submittedAt: afceStatusEnum !== "DRAFT" ? now : null,
          approvedAt: afceStatusEnum === "APPROVED" ? now : null,
          createdById: user.id,
          approvalMatrixLevels: {
            create: matrixLevelsData,
          },
          approvalRecords:
            afceStatusEnum !== "DRAFT"
              ? {
                  create:
                    afceStatusEnum === "APPROVED"
                      ? matrixLevelsData.map((lvl) => ({
                          approverName: user.name,
                          approverRole: lvl.label,
                          approverJabatan: lvl.approverJabatan,
                          action: "Approve",
                          timestamp: now,
                          approvalDate: now,
                          note: `Disetujui Level ${lvl.level}: ${lvl.label} sesuai verifikasi SAP (dicatat oleh ${user.name}).`,
                          previousStatus: "PENDING_APPROVAL",
                          newStatus: "APPROVED",
                          sapDocNumber: parsed.sapDocNumber,
                          recordedById: user.id,
                        }))
                      : [
                          {
                            approverName: user.name,
                            approverRole: "PIC Proyek",
                            approverJabatan: user.jabatan || "PIC Proyek",
                            action: "Submit",
                            timestamp: now,
                            approvalDate: now,
                            note: "Dokumen AFCE dibuat bersamaan dengan proyek baru dan diajukan sesuai matriks SOP.",
                            previousStatus: "DRAFT",
                            newStatus: "PENDING_APPROVAL",
                            sapDocNumber: parsed.sapDocNumber,
                            recordedById: user.id,
                          },
                        ],
                }
              : undefined,
        },
        include: {
          approvalMatrixLevels: { orderBy: { level: "asc" } },
          approvalRecords: { orderBy: { timestamp: "asc" } },
        },
      });

      return { project: newProject, afce: newAfce };
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "PROJECT",
      entityId: result.project.id,
      entityTitle: result.project.name,
      projectId: result.project.id,
      projectName: result.project.name,
      afterData: {
        projectCode: result.project.projectCode,
        name: result.project.name,
        afceNumber: result.afce.afceNumber,
      },
      notes: `Proyek baru dan dokumen AFCE diinisiasi oleh ${user.name}`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/workspace");
    return {
      success: true,
      project: toPlainObject(result.project),
      afce: toPlainObject(result.afce),
    };
  } catch (err: unknown) {
    console.error("Gagal membuat proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal membuat proyek baru.") };
  }
}

export async function updateProjectAction(projectId: string, rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = UpdateProjectSchema.parse(rawInput);

    const existing = await db.project.findUnique({
      where: { id: projectId },
      include: { workItems: true, boqItems: true },
    });
    if (!existing) {
      return { success: false, error: "Proyek tidak ditemukan." };
    }

    const result = await db.$transaction(async (tx) => {
      const nextBaselineStart = parsed.baselineStartDate
        ? new Date(parsed.baselineStartDate)
        : existing.baselineStartDate;
      const nextBaselineEnd = parsed.baselineEndDate
        ? new Date(parsed.baselineEndDate)
        : existing.baselineEndDate;
      const nextTargetEnd = parsed.targetEndDate
        ? new Date(parsed.targetEndDate)
        : existing.targetEndDate;

      const computedVariance = Math.max(
        0,
        Math.round((nextTargetEnd.getTime() - nextBaselineEnd.getTime()) / (1000 * 60 * 60 * 24))
      );

      const computedDuration =
        parsed.durationDays !== undefined
          ? parsed.durationDays
          : parsed.baselineStartDate || parsed.baselineEndDate
          ? Math.max(
              1,
              Math.ceil(
                (nextBaselineEnd.getTime() - nextBaselineStart.getTime()) / (1000 * 60 * 60 * 24)
              )
            )
          : undefined;

      const locIds = parsed.locationIds;
      const locNames = parsed.locationNames;
      const blkIds = parsed.blockIds;
      const blkCodes = parsed.blockCodes;

      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          projectCode: parsed.code,
          name: parsed.name,
          description: parsed.description,
          picId: parsed.picId !== undefined ? parsed.picId || null : undefined,
          status: parsed.status ? toProjectStatusEnum(parsed.status) : undefined,
          projectType: parsed.projectType,
          procurementType: parsed.procurementType,
          locationId: parsed.locationId ?? locIds?.[0],
          locationName: parsed.locationName ?? locNames?.[0],
          locationIds: locIds !== undefined ? (locIds as never) : undefined,
          locationNames: locNames !== undefined ? (locNames as never) : undefined,
          regionId: parsed.regionId,
          regionName: parsed.regionName,
          companyId: parsed.companyId,
          companyName: parsed.companyName,
          blockId: parsed.blockId ?? blkIds?.[0],
          blockCode: parsed.blockCode ?? blkCodes?.[0],
          blockIds: blkIds !== undefined ? (blkIds as never) : undefined,
          blockCodes: blkCodes !== undefined ? (blkCodes as never) : undefined,
          projectCategoryId: parsed.projectCategoryId,
          projectCategoryName: parsed.projectCategoryName,
          baselineStartDate: parsed.baselineStartDate ? nextBaselineStart : undefined,
          baselineEndDate: parsed.baselineEndDate ? nextBaselineEnd : undefined,
          targetEndDate: parsed.targetEndDate ? nextTargetEnd : undefined,
          durationDays: computedDuration,
          scheduleVarianceDays:
            parsed.baselineEndDate || parsed.targetEndDate ? computedVariance : undefined,
          progressPercent: parsed.progress,
          ewsStatus: parsed.ewsStatus,
          scheduleMatrix: parsed.scheduleMatrix as never,
        },
        include: {
          pic: { select: { id: true, name: true } },
          workItems: true,
          boqItems: true,
        },
      });

      if (parsed.workItems && Array.isArray(parsed.workItems)) {
        const incomingIds = new Set(parsed.workItems.map((w) => w.id).filter(Boolean));

        for (const wi of parsed.workItems) {
          if (wi.id && existing.workItems.some((ew) => ew.id === wi.id)) {
            await tx.workItem.update({
              where: { id: wi.id },
              data: {
                name: wi.name,
                type: wi.type || undefined,
                weight: wi.weight !== undefined ? Number(wi.weight) : undefined,
                startDate: wi.startDate ? new Date(wi.startDate) : undefined,
                endDate: wi.endDate ? new Date(wi.endDate) : undefined,
                procurementType: wi.procurementType || undefined,
                progressMode: wi.progressMode || undefined,
                progress: wi.progress !== undefined ? Number(wi.progress) : undefined,
                status: wi.status ? toProjectStatusEnum(wi.status) : undefined,
                phase: wi.phase || undefined,
                notes: wi.notes !== undefined ? wi.notes : undefined,
              },
            });
          } else {
            await tx.workItem.create({
              data: {
                id: wi.id || undefined,
                projectId,
                name: wi.name || "Item Pekerjaan Baru",
                type: wi.type || "Physical",
                weight: Number(wi.weight) || 0,
                startDate: new Date(wi.startDate || existing.baselineStartDate),
                endDate: new Date(wi.endDate || existing.targetEndDate),
                procurementType: wi.procurementType || existing.procurementType,
                progressMode: wi.progressMode || "Daily",
                progress: Number(wi.progress) || 0,
                status: toProjectStatusEnum(wi.status),
                phase: wi.phase || "Physical Execution",
                notes: wi.notes ?? undefined,
              },
            });
          }
        }

        for (const ew of existing.workItems) {
          if (!incomingIds.has(ew.id)) {
            const [hasPr, hasPo, hasSpk, hasLogs] = await Promise.all([
              tx.purchaseRequisition.count({ where: { workItemId: ew.id } }),
              tx.purchaseOrder.count({ where: { workItemId: ew.id } }),
              tx.spk.count({ where: { workItemId: ew.id } }),
              tx.progressLog.count({ where: { workItemId: ew.id } }),
            ]);
            if (hasPr === 0 && hasPo === 0 && hasSpk === 0 && hasLogs === 0) {
              await tx.workItem.delete({ where: { id: ew.id } });
            }
          }
        }
      }

      if (parsed.surveyAndBoq && Array.isArray(parsed.surveyAndBoq)) {
        const incomingBoqIds = new Set(parsed.surveyAndBoq.map((b) => b.id).filter(Boolean));

        for (const b of parsed.surveyAndBoq) {
          if (b.id && existing.boqItems.some((eb) => eb.id === b.id)) {
            await tx.boqItem.update({
              where: { id: b.id },
              data: {
                itemCode: b.itemCode || undefined,
                name: b.name || undefined,
                volume: b.volume !== undefined ? Number(b.volume) : undefined,
                unit: b.unit || undefined,
                unitPrice: b.unitPrice !== undefined ? Number(b.unitPrice) : undefined,
                totalPrice: b.totalPrice !== undefined ? Number(b.totalPrice) : undefined,
                weight: b.weight !== undefined ? Number(b.weight) : undefined,
                status: b.status || undefined,
              },
            });
          } else {
            await tx.boqItem.create({
              data: {
                id: b.id || undefined,
                projectId,
                itemCode: b.itemCode || "ITEM-001",
                name: b.name || "Item BOQ",
                volume: Number(b.volume) || 0,
                unit: b.unit || "Unit",
                unitPrice: Number(b.unitPrice) || 0,
                totalPrice: Number(b.totalPrice) || 0,
                weight: Number(b.weight) || 0,
                status: b.status || "Draft",
              },
            });
          }
        }

        for (const eb of existing.boqItems) {
          if (!incomingBoqIds.has(eb.id)) {
            await tx.boqItem.delete({ where: { id: eb.id } });
          }
        }
      }

      return updated;
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "PROJECT",
      entityId: result.id,
      entityTitle: result.name,
      projectId: result.id,
      projectName: result.name,
      beforeData: { name: existing.name, status: existing.status, targetEndDate: existing.targetEndDate },
      afterData: { name: result.name, status: result.status, targetEndDate: result.targetEndDate },
      notes: `Pembaruan data proyek oleh ${user.name}`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/workspace");
    revalidatePath(`/workspace/${projectId}`);
    return { success: true, project: toPlainObject(result) };
  } catch (err: unknown) {
    console.error("Gagal memperbarui proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui proyek.") };
  }
}

export async function addWorkItemAction(projectId: string, data: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = WorkItemInputSchema.parse(data);

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return { success: false, error: "Proyek tidak ditemukan." };
    }

    const item = await db.workItem.create({
      data: {
        id: parsed.id || undefined,
        projectId,
        name: parsed.name,
        type: parsed.type,
        weight: Number(parsed.weight) || 0,
        startDate: new Date(parsed.startDate || project.baselineStartDate),
        endDate: new Date(parsed.endDate || project.targetEndDate),
        procurementType: parsed.procurementType || project.procurementType,
        progressMode: parsed.progressMode,
        progress: Number(parsed.progress) || 0,
        status: toProjectStatusEnum(parsed.status),
        phase: parsed.phase,
        notes: parsed.notes ?? undefined,
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "WORK_ITEM",
      entityId: item.id,
      entityTitle: item.name,
      projectId: project.id,
      projectName: project.name,
      afterData: { name: item.name, weight: item.weight, phase: item.phase },
      notes: `Item WBS "${item.name}" ditambahkan oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${projectId}`);
    return { success: true, workItem: toPlainObject(item) };
  } catch (err: unknown) {
    console.error("Gagal menambah item pekerjaan:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah item pekerjaan.") };
  }
}

export async function updateWorkItemAction(workItemId: string, updates: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = UpdateWorkItemSchema.parse(updates);

    const existing = await db.workItem.findUnique({
      where: { id: workItemId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Item pekerjaan tidak ditemukan." };
    }

    const item = await db.workItem.update({
      where: { id: workItemId },
      data: {
        name: parsed.name,
        type: parsed.type,
        weight: parsed.weight !== undefined ? Number(parsed.weight) : undefined,
        startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
        endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
        procurementType: parsed.procurementType,
        progressMode: parsed.progressMode,
        progress: parsed.progress !== undefined ? Number(parsed.progress) : undefined,
        status: parsed.status ? toProjectStatusEnum(parsed.status) : undefined,
        phase: parsed.phase,
        notes: parsed.notes !== undefined ? parsed.notes : undefined,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "WORK_ITEM",
      entityId: item.id,
      entityTitle: item.name,
      projectId: item.projectId,
      projectName: existing.project.name,
      beforeData: { name: existing.name, weight: existing.weight, progress: existing.progress },
      afterData: { name: item.name, weight: item.weight, progress: item.progress },
      notes: `Item WBS "${item.name}" diperbarui oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${item.projectId}`);
    return { success: true, workItem: toPlainObject(item) };
  } catch (err: unknown) {
    console.error("Gagal memperbarui item pekerjaan:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui item pekerjaan.") };
  }
}

export async function deleteWorkItemAction(workItemId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const [existing, hasPr, hasPo, hasSpk, hasLogs] = await Promise.all([
      db.workItem.findUnique({
        where: { id: workItemId },
        include: { project: { select: { id: true, name: true } } },
      }),
      db.purchaseRequisition.count({ where: { workItemId } }),
      db.purchaseOrder.count({ where: { workItemId } }),
      db.spk.count({ where: { workItemId } }),
      db.progressLog.count({ where: { workItemId } }),
    ]);

    if (!existing) {
      return { success: false, error: "Item pekerjaan tidak ditemukan." };
    }

    if (hasPr > 0 || hasPo > 0 || hasSpk > 0 || hasLogs > 0) {
      return {
        success: false,
        error:
          "Item pekerjaan tidak dapat dihapus karena masih terhubung dengan transaksi PR, PO, SPK, atau log progres.",
      };
    }

    await db.workItem.delete({ where: { id: workItemId } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "WORK_ITEM",
      entityId: existing.id,
      entityTitle: existing.name,
      projectId: existing.projectId,
      projectName: existing.project.name,
      beforeData: { name: existing.name, weight: existing.weight },
      notes: `Item WBS "${existing.name}" dihapus oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus item pekerjaan:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus item pekerjaan.") };
  }
}

export async function addBoqItemAction(projectId: string, data: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = BoqItemInputSchema.parse(data);

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });
    if (!project) {
      return { success: false, error: "Proyek tidak ditemukan." };
    }

    const boq = await db.boqItem.create({
      data: {
        id: parsed.id || undefined,
        projectId,
        itemCode: parsed.itemCode,
        name: parsed.name,
        volume: Number(parsed.volume),
        unit: parsed.unit,
        unitPrice: Number(parsed.unitPrice),
        totalPrice: Number(parsed.totalPrice),
        weight: Number(parsed.weight),
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "BOQ_ITEM",
      entityId: boq.id,
      entityTitle: `${boq.itemCode} - ${boq.name}`,
      projectId: project.id,
      projectName: project.name,
      afterData: { itemCode: boq.itemCode, name: boq.name, totalPrice: Number(boq.totalPrice) },
      notes: `Item BOQ "${boq.name}" ditambahkan oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${projectId}`);
    return { success: true, boqItem: toPlainObject(boq) };
  } catch (err: unknown) {
    console.error("Gagal menambah item BOQ:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah item BOQ.") };
  }
}

export async function deleteBoqItemAction(boqItemId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.boqItem.findUnique({
      where: { id: boqItemId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Item BOQ tidak ditemukan." };
    }

    await db.boqItem.delete({ where: { id: boqItemId } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "BOQ_ITEM",
      entityId: existing.id,
      entityTitle: `${existing.itemCode} - ${existing.name}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      beforeData: { itemCode: existing.itemCode, name: existing.name },
      notes: `Item BOQ "${existing.name}" dihapus oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus item BOQ:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus item BOQ.") };
  }
}

export async function deleteProjectAction(projectId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      return { success: false, error: "Proyek tidak ditemukan." };
    }

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
      beforeData: { deletedAt: existing.deletedAt },
      afterData: { deletedAt: updated.deletedAt },
      notes: `Proyek dipindahkan ke arsip terhapus (soft delete) oleh ${user.name}`,
    });

    revalidatePath("/workspace");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal memindahkan proyek ke arsip.") };
  }
}

async function cascadeDeleteSingleProject(tx: any, projectId: string) {
  await tx.progressLog.deleteMany({ where: { projectId } });

  const projectPos = await tx.purchaseOrder.findMany({
    where: { projectId },
    select: { id: true },
  });
  const poIds = projectPos.map((p: { id: string }) => p.id);
  if (poIds.length > 0) {
    await tx.goodsHandover.deleteMany({ where: { poId: { in: poIds } } });
    await tx.goodsReceipt.deleteMany({ where: { poId: { in: poIds } } });
    await tx.poItem.deleteMany({ where: { poId: { in: poIds } } });
  }
  await tx.purchaseOrder.deleteMany({ where: { projectId } });

  const projectPrs = await tx.purchaseRequisition.findMany({
    where: { projectId },
    select: { id: true },
  });
  const prIds = projectPrs.map((p: { id: string }) => p.id);
  if (prIds.length > 0) {
    await tx.vendorEvaluation.deleteMany({ where: { prId: { in: prIds } } });
  }
  await tx.purchaseRequisition.deleteMany({ where: { projectId } });

  const projectUspks = await tx.uspk.findMany({
    where: { projectId },
    select: { id: true },
  });
  const uspkIds = projectUspks.map((u: { id: string }) => u.id);
  if (uspkIds.length > 0) {
    await tx.spk.deleteMany({ where: { uspkId: { in: uspkIds } } });
    await tx.technicalEvaluation.deleteMany({ where: { uspkId: { in: uspkIds } } });
  }
  await tx.spk.deleteMany({ where: { projectId } });
  await tx.uspk.deleteMany({ where: { projectId } });

  const projectAfces = await tx.afce.findMany({
    where: { projectId },
    select: { id: true },
  });
  const afceIds = projectAfces.map((a: { id: string }) => a.id);
  if (afceIds.length > 0) {
    await tx.afceApprovalRecord.deleteMany({ where: { afceId: { in: afceIds } } });
    await tx.afceApprovalLevel.deleteMany({ where: { afceId: { in: afceIds } } });
  }
  await tx.afce.deleteMany({ where: { projectId } });

  await tx.scheduleRevision.deleteMany({ where: { projectId } });
  await tx.boqItem.deleteMany({ where: { projectId } });
  await tx.workItem.deleteMany({ where: { projectId } });
  await tx.projectAttachment.deleteMany({ where: { projectId } });
  await tx.projectComment.deleteMany({ where: { projectId } });
  await tx.project.delete({ where: { id: projectId } });
}

export async function hardDeleteProjectAction(projectId: string) {
  try {
    const user = await requireRole(["ADMIN"]);
    const existing = await db.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      return { success: false, error: "Proyek tidak ditemukan." };
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
      beforeData: { projectCode: existing.projectCode, name: existing.name },
      notes: `Proyek ${existing.projectCode} (${existing.name}) dihapus permanen oleh ${user.name}`,
    });

    revalidatePath("/workspace");
    revalidatePath("/dashboard");
    revalidatePath("/notifications");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus proyek permanen:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus proyek permanen.") };
  }
}

export async function emptyRecycleBinAction() {
  try {
    const user = await requireRole(["ADMIN"]);
    const deletedProjects = await db.project.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, projectCode: true, name: true },
    });

    if (deletedProjects.length === 0) {
      return { success: true, count: 0, message: "Arsip terhapus sudah kosong." };
    }

    await db.$transaction(async (tx) => {
      for (const proj of deletedProjects) {
        await cascadeDeleteSingleProject(tx, proj.id);
      }
    });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "SYSTEM",
      entityId: "system-recycle-bin",
      entityTitle: "Pembersihan Arsip Proyek Terhapus",
      notes: `Admin ${user.name} mengosongkan arsip terhapus (${deletedProjects.length} proyek dihapus permanen: ${deletedProjects.map((p) => p.projectCode).join(", ")})`,
    });

    revalidatePath("/workspace");
    revalidatePath("/dashboard");
    revalidatePath("/notifications");
    return { success: true, count: deletedProjects.length };
  } catch (err: unknown) {
    console.error("Gagal mengosongkan arsip proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal mengosongkan arsip terhapus.") };
  }
}

export async function restoreProjectAction(projectId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      return { success: false, error: "Proyek tidak ditemukan." };
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
      beforeData: { deletedAt: existing.deletedAt },
      afterData: { deletedAt: updated.deletedAt },
      notes: `Proyek dipulihkan dari arsip terhapus oleh ${user.name}`,
    });

    revalidatePath("/workspace");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal memulihkan proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal memulihkan proyek.") };
  }
}

export async function reviseScheduleAction(projectId: string, rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = ScheduleRevisionSchema.parse(rawInput);

    const existing = await db.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      return { success: false, error: "Proyek tidak ditemukan." };
    }

    const revision = await db.$transaction(async (tx) => {
      const createdRev = await tx.scheduleRevision.create({
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

      const diffDays = Math.round(
        (new Date(parsed.newEndDate).getTime() - new Date(existing.baselineEndDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      await tx.project.update({
        where: { id: projectId },
        data: {
          targetEndDate: new Date(parsed.newEndDate),
          scheduleVarianceDays: Math.max(0, diffDays),
        },
      });

      return createdRev;
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "SCHEDULE_REVISION",
      entityId: revision.id,
      entityTitle: `Revisi Jadwal #${revision.revisionNumber}`,
      projectId: existing.id,
      projectName: existing.name,
      afterData: {
        revisionNumber: revision.revisionNumber,
        newEndDate: revision.newEndDate,
        extendedWeeks: revision.extendedWeeks,
      },
      notes: `Revisi jadwal dicatat oleh ${user.name}: diperpanjang ${revision.extendedWeeks} minggu karena ${revision.reason}`,
    });

    revalidatePath(`/workspace/${projectId}`);
    revalidatePath("/dashboard");
    return { success: true, revision: toPlainObject(revision) };
  } catch (err: unknown) {
    console.error("Gagal mencatat revisi jadwal:", err);
    return { success: false, error: formatActionError(err, "Gagal mencatat revisi jadwal.") };
  }
}

export async function getProjectDriveFolderAction(projectId: string): Promise<{
  success: boolean;
  folderId?: string;
  folderName?: string;
  webViewLink?: string;
  message?: string;
}> {
  try {
    await requireAuth();
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectCode: true, name: true },
    });

    if (!project) {
      return { success: false, message: "Proyek tidak ditemukan." };
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
  } catch (error: unknown) {
    console.error(`Gagal mendapatkan folder Drive untuk proyek ${projectId}:`, error);
    return {
      success: false,
      message: formatActionError(error, "Gagal mengakses folder Google Drive."),
    };
  }
}
