"use server";

import { db } from "@/server/db";
import { requireAuth, requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { CreateProjectSchema, UpdateProjectSchema, ScheduleRevisionSchema } from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";
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

function toAfceStatusEnum(status?: string): "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "NEED_REVISION" {
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

export async function createProjectAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateProjectSchema.parse(rawInput);

  const afceVal = parsed.afceValue || 250000000;
  const afceNum = parsed.afceNumber || `AFCE-2026-0${Date.now().toString().slice(-4)}`;
  const afceStatusEnum = toAfceStatusEnum(parsed.afceStatus);
  const now = new Date();

  // Ambil konfigurasi matriks persetujuan SOP aktif dari basis data
  const dbRules = await db.approvalMatrixRule.findMany({
    where: { active: true },
    orderBy: { minValue: "asc" },
  });

  const matchedTier = dbRules.find(
    (t) => afceVal >= Number(t.minValue) && afceVal <= Number(t.maxValue)
  ) || dbRules[0];

  const activeCodes: string[] = matchedTier && Array.isArray(matchedTier.levels)
    ? (matchedTier.levels as string[]).filter(Boolean)
    : ["WM"];

  const roleLabels: Record<string, string> = {
    WM: "Water Management",
    EM: "Estate Manager",
    GEM: "General Estate Manager",
    VPA: "VP Agronomi",
    VPT: "VP Teknik",
    DIR_OPS: "Direktur Operasional",
    DIR_KEU: "Direktur Keuangan",
    DIR_UT: "Direktur Utama",
    KOMISARIS: "Dewan Komisaris",
  };

  const result = await db.$transaction(async (tx) => {
    // 1. Simpan Proyek beserta Work Items dan BOQ Items
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
        workItems: parsed.workItems && parsed.workItems.length > 0
          ? {
              create: parsed.workItems.map((w: any) => ({
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
                notes: w.notes,
              })),
            }
          : undefined,
        boqItems: parsed.surveyAndBoq && parsed.surveyAndBoq.length > 0
          ? {
              create: parsed.surveyAndBoq.map((b: any) => ({
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
        workItems: true,
        boqItems: true,
      },
    });

    // 2. Buat Dokumen AFCE Terkait beserta jenjang matriks otorisasi
    const matrixLevelsData = activeCodes.map((code, idx) => {
      const label = roleLabels[code] || code;
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
        approverName: afceStatusEnum === "APPROVED" ? (idx === 0 ? "Dedi Setiawan, S.T." : idx === 1 ? "Budi Santoso, S.T." : "Ir. Ahmad Dahlan") : undefined,
        decidedAt: afceStatusEnum === "APPROVED" ? now : undefined,
      };
    });

    const currentLevel = afceStatusEnum === "APPROVED" ? activeCodes.length : afceStatusEnum === "PENDING_APPROVAL" ? 1 : 0;
    const currentApproverRole = roleLabels[activeCodes[0]] || "Water Management";

    const newAfce = await tx.afce.create({
      data: {
        id: parsed.afceId || undefined,
        projectId: newProject.id,
        afceNumber: afceNum,
        amount: afceVal,
        status: afceStatusEnum,
        sapDocNumber: parsed.sapDocNumber || `AFCE-SAP-${Date.now().toString().slice(-7)}`,
        sapScreenshotUrl: `SAP_AFCE_${afceNum.replace(/[^0-9]/g, "")}.png`,
        currentLevel,
        requiredLevels: activeCodes.length,
        currentApproverRole,
        submittedAt: afceStatusEnum !== "DRAFT" ? now : null,
        approvedAt: afceStatusEnum === "APPROVED" ? now : null,
        createdById: user.id,
        approvalMatrixLevels: {
          create: matrixLevelsData,
        },
        approvalRecords: afceStatusEnum !== "DRAFT" ? {
          create: afceStatusEnum === "APPROVED"
            ? matrixLevelsData.map((lvl) => ({
                approverName: lvl.approverName || "Approver",
                approverRole: lvl.label,
                approverJabatan: lvl.approverJabatan,
                action: "Approve",
                timestamp: now,
                approvalDate: now,
                note: `Disetujui Level ${lvl.level}: ${lvl.label} sesuai verifikasi SAP.`,
                previousStatus: "PENDING_APPROVAL",
                newStatus: "APPROVED",
                recordedById: user.id,
              }))
            : [{
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
              }],
        } : undefined,
      },
      include: {
        approvalMatrixLevels: true,
        approvalRecords: true,
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
    afterData: result.project,
    notes: `Proyek baru dan dokumen AFCE berhasil diinisiasi oleh ${user.name}`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/workspace");
  return { success: true, project: result.project, afce: result.afce };
}

export async function updateProjectAction(projectId: string, rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = UpdateProjectSchema.parse(rawInput);

  const existing = await db.project.findUnique({
    where: { id: projectId },
    include: { workItems: true, boqItems: true },
  });
  if (!existing) {
    throw new Error("Proyek tidak ditemukan.");
  }

  const result = await db.$transaction(async (tx) => {
    // 1. Update field utama proyek
    const updated = await tx.project.update({
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

    // 2. Sinkronisasi daftar Item Pekerjaan (WBS) jika dikirimkan
    if (parsed.workItems && Array.isArray(parsed.workItems)) {
      const incomingIds = new Set(parsed.workItems.map((w: any) => w.id).filter(Boolean));

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
              notes: wi.notes,
            },
          });
        }
      }

      // Hapus work item yang dihapus dari UI hanya jika tidak memiliki keterikatan transaksional
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

    // 3. Sinkronisasi BOQ Items jika dikirimkan
    if (parsed.surveyAndBoq && Array.isArray(parsed.surveyAndBoq)) {
      const incomingBoqIds = new Set(parsed.surveyAndBoq.map((b: any) => b.id).filter(Boolean));

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
    beforeData: existing,
    afterData: result,
    notes: `Pembaruan data proyek oleh ${user.name}`,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/workspace/${projectId}`);
  return { success: true, project: result };
}

export async function addWorkItemAction(projectId: string, data: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Proyek tidak ditemukan.");

  const item = await db.workItem.create({
    data: {
      id: data.id || undefined,
      projectId,
      name: data.name,
      type: data.type || "Physical",
      weight: Number(data.weight) || 0,
      startDate: new Date(data.startDate || project.baselineStartDate),
      endDate: new Date(data.endDate || project.targetEndDate),
      procurementType: data.procurementType || project.procurementType,
      progressMode: data.progressMode || "Daily",
      progress: Number(data.progress) || 0,
      status: toProjectStatusEnum(data.status),
      phase: data.phase || "Physical Execution",
      notes: data.notes,
    },
  });

  revalidatePath(`/workspace/${projectId}`);
  return { success: true, workItem: item };
}

export async function updateWorkItemAction(workItemId: string, updates: any) {
  await requireRole(["ADMIN", "PIC"]);
  const item = await db.workItem.update({
    where: { id: workItemId },
    data: {
      name: updates.name !== undefined ? updates.name : undefined,
      type: updates.type !== undefined ? updates.type : undefined,
      weight: updates.weight !== undefined ? Number(updates.weight) : undefined,
      startDate: updates.startDate ? new Date(updates.startDate) : undefined,
      endDate: updates.endDate ? new Date(updates.endDate) : undefined,
      procurementType: updates.procurementType !== undefined ? updates.procurementType : undefined,
      progressMode: updates.progressMode !== undefined ? updates.progressMode : undefined,
      progress: updates.progress !== undefined ? Number(updates.progress) : undefined,
      status: updates.status ? toProjectStatusEnum(updates.status) : undefined,
      phase: updates.phase !== undefined ? updates.phase : undefined,
      notes: updates.notes !== undefined ? updates.notes : undefined,
    },
  });

  revalidatePath(`/workspace/${item.projectId}`);
  return { success: true, workItem: item };
}

export async function deleteWorkItemAction(workItemId: string) {
  await requireRole(["ADMIN", "PIC"]);
  const [hasPr, hasPo, hasSpk, hasLogs] = await Promise.all([
    db.purchaseRequisition.count({ where: { workItemId } }),
    db.purchaseOrder.count({ where: { workItemId } }),
    db.spk.count({ where: { workItemId } }),
    db.progressLog.count({ where: { workItemId } }),
  ]);

  if (hasPr > 0 || hasPo > 0 || hasSpk > 0 || hasLogs > 0) {
    throw new Error(
      "Item pekerjaan tidak dapat dihapus karena sudah memiliki keterikatan transaksi PR, PO, SPK, atau log progres."
    );
  }

  const deleted = await db.workItem.delete({ where: { id: workItemId } });
  revalidatePath(`/workspace/${deleted.projectId}`);
  return { success: true };
}

export async function addBoqItemAction(projectId: string, data: any) {
  await requireRole(["ADMIN", "PIC"]);
  const boq = await db.boqItem.create({
    data: {
      id: data.id || undefined,
      projectId,
      itemCode: data.itemCode || "ITEM-001",
      name: data.name,
      volume: Number(data.volume) || 0,
      unit: data.unit || "Unit",
      unitPrice: Number(data.unitPrice) || 0,
      totalPrice: Number(data.totalPrice) || 0,
      weight: Number(data.weight) || 0,
      status: data.status || "Draft",
    },
  });

  revalidatePath(`/workspace/${projectId}`);
  return { success: true, boqItem: boq };
}

export async function deleteBoqItemAction(boqItemId: string) {
  await requireRole(["ADMIN", "PIC"]);
  const deleted = await db.boqItem.delete({ where: { id: boqItemId } });
  revalidatePath(`/workspace/${deleted.projectId}`);
  return { success: true };
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
