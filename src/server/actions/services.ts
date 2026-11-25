"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { toPlainObject } from "@/server/serialize";
import {
  CreateUspkSchema,
  UpdateUspkStatusSchema,
  CreateTechnicalEvaluationSchema,
  CreateSpkSchema,
  UpdateSpkStatusSchema,
} from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";
import { syncWorkItemAndProjectProgressTx } from "@/server/work-item-progress";

export async function createUspkAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreateUspkSchema.parse(rawInput);

    const project = await db.project.findFirst({
      where: { id: parsed.projectId, deletedAt: null },
      select: { id: true },
    });
    if (!project) {
      return { success: false, error: "Proyek referensi tidak ditemukan atau sudah diarsipkan." };
    }

    const afce = parsed.afceId
      ? await db.afce.findFirst({
          where: { id: parsed.afceId, projectId: parsed.projectId, deletedAt: null },
          select: { id: true },
        })
      : await db.afce.findFirst({
          where: { projectId: parsed.projectId, deletedAt: null },
          select: { id: true },
        });

    if (parsed.afceId && !afce) {
      return { success: false, error: "Dokumen AFCE referensi tidak ditemukan atau tidak valid." };
    }

    if (parsed.workItemId) {
      const workItem = await db.workItem.findFirst({
        where: { id: parsed.workItemId, projectId: parsed.projectId },
        select: { id: true },
      });
      if (!workItem) {
        return { success: false, error: "Item pekerjaan (WBS) referensi tidak ditemukan pada proyek ini." };
      }
    }

    const uspk = await db.uspk.create({
      data: {
        afceId: afce?.id,
        projectId: parsed.projectId,
        workItemId: parsed.workItemId || undefined,
        uspkNumber: parsed.uspkNumber,
        vendorName: parsed.vendorName,
        vendorId: parsed.vendorId || undefined,
        scope: parsed.scope,
        value: parsed.value,
        targetVolume: parsed.targetVolume,
        unit: parsed.unit,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        status: parsed.status as never,
        submittedAt: parsed.submittedAt
          ? new Date(parsed.submittedAt)
          : parsed.status === "SUBMITTED"
          ? new Date()
          : undefined,
        attachmentName: parsed.attachmentName,
        createdById: user.id,
        createdBy: parsed.createdBy || user.name,
      },
      include: { project: true },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "USPK",
      entityId: uspk.id,
      entityTitle: `USPK ${uspk.uspkNumber}`,
      projectId: uspk.projectId,
      projectName: uspk.project.name,
      afterData: { uspkNumber: uspk.uspkNumber, vendorName: uspk.vendorName, value: Number(uspk.value) },
      notes: `Usulan SPK (${uspk.uspkNumber}) jasa kontraktor ${uspk.vendorName} dibuat oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${uspk.projectId}/procurement`);
    return { success: true, uspk: toPlainObject(uspk) };
  } catch (err: unknown) {
    console.error("Gagal membuat USPK:", err);
    return { success: false, error: formatActionError(err, "Gagal membuat Usulan SPK.") };
  }
}

export async function updateUspkStatusAction(uspkId: string, status: string, decidedAt?: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC", "APPROVER"]);
    const parsed = UpdateUspkStatusSchema.parse({ uspkId, status, decidedAt });

    const existing = await db.uspk.findUnique({
      where: { id: parsed.uspkId },
      include: { project: true },
    });
    if (!existing) {
      return { success: false, error: "Dokumen USPK tidak ditemukan." };
    }

    const updated = await db.uspk.update({
      where: { id: parsed.uspkId },
      data: {
        status: parsed.status as never,
        decidedAt: parsed.decidedAt ? new Date(parsed.decidedAt) : new Date(),
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "USPK",
      entityId: updated.id,
      entityTitle: `USPK ${updated.uspkNumber}`,
      projectId: updated.projectId,
      projectName: existing.project.name,
      beforeData: { status: existing.status },
      afterData: { status: updated.status },
      notes: `Status USPK diubah menjadi ${parsed.status} oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${updated.projectId}/procurement`);
    return { success: true, uspk: toPlainObject(updated) };
  } catch (err: unknown) {
    console.error("Gagal memperbarui status USPK:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui status USPK.") };
  }
}

export async function softDeleteUspkAction(uspkId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.uspk.findUnique({
      where: { id: uspkId },
      include: { project: { select: { id: true, name: true } }, spk: true },
    });
    if (!existing) {
      return { success: false, error: "Dokumen USPK tidak ditemukan." };
    }
    if (existing.spk && !existing.spk.deletedAt) {
      return {
        success: false,
        error: "USPK tidak dapat diarsipkan karena sudah memiliki kontrak SPK aktif.",
      };
    }

    await db.uspk.update({
      where: { id: uspkId },
      data: { deletedAt: new Date() },
    });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "USPK",
      entityId: existing.id,
      entityTitle: `USPK ${existing.uspkNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      notes: `USPK ${existing.uspkNumber} dipindahkan ke arsip terhapus oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/procurement`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal mengarsipkan USPK:", err);
    return { success: false, error: formatActionError(err, "Gagal mengarsipkan USPK.") };
  }
}

export async function restoreUspkAction(uspkId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.uspk.findUnique({
      where: { id: uspkId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen USPK tidak ditemukan." };
    }

    await db.uspk.update({
      where: { id: uspkId },
      data: { deletedAt: null },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "USPK",
      entityId: existing.id,
      entityTitle: `USPK ${existing.uspkNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      notes: `USPK ${existing.uspkNumber} dipulihkan dari arsip oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/procurement`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal memulihkan USPK:", err);
    return { success: false, error: formatActionError(err, "Gagal memulihkan USPK.") };
  }
}

export async function recordTechnicalEvaluationAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC", "APPROVER"]);
    const parsed = CreateTechnicalEvaluationSchema.parse(rawInput);

    const uspk = await db.uspk.findUnique({
      where: { id: parsed.uspkId },
      select: { id: true, projectId: true, uspkNumber: true },
    });
    if (!uspk) {
      return { success: false, error: "USPK referensi tidak ditemukan." };
    }

    const evalDate = new Date(parsed.evaluationDate);

    const evaluation = await db.$transaction(async (tx) => {
      const created = await tx.technicalEvaluation.create({
        data: {
          uspkId: parsed.uspkId,
          projectId: parsed.projectId || uspk.projectId,
          evaluatorId: user.id,
          evaluatorName: parsed.evaluatorName,
          evaluatorJabatan: parsed.evaluatorJabatan,
          evaluationDate: evalDate,
          result: parsed.result,
          rekomendasi: parsed.rekomendasi,
          score: parsed.score,
          notes: parsed.notes,
          attachmentName: parsed.attachmentName,
        },
      });

      await tx.uspk.update({
        where: { id: parsed.uspkId },
        data: {
          status: parsed.result === "RECOMMENDED" ? "APPROVED" : "REJECTED",
          decidedAt: evalDate,
        },
      });

      return created;
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "TECHNICAL_EVALUATION",
      entityId: evaluation.id,
      entityTitle: `Evaluasi Teknis ${uspk.uspkNumber}`,
      projectId: uspk.projectId,
      afterData: { uspkNumber: uspk.uspkNumber, result: parsed.result, score: parsed.score },
      notes: `Evaluasi teknis jasa dicatat untuk ${uspk.uspkNumber}: ${parsed.result}`,
    });

    revalidatePath(`/workspace/${uspk.projectId}/procurement`);
    return { success: true, evaluation: toPlainObject(evaluation) };
  } catch (err: unknown) {
    console.error("Gagal mencatat evaluasi teknis:", err);
    return { success: false, error: formatActionError(err, "Gagal mencatat evaluasi teknis.") };
  }
}

export async function createSpkAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreateSpkSchema.parse(rawInput);

    const uspk = await db.uspk.findUnique({
      where: { id: parsed.uspkId },
      include: { technicalEvaluations: true, spk: true },
    });
    if (!uspk || uspk.deletedAt) {
      return { success: false, error: "USPK referensi tidak ditemukan atau sudah diarsipkan." };
    }

    if (uspk.spk && !uspk.spk.deletedAt) {
      return {
        success: false,
        error: `USPK ${uspk.uspkNumber} sudah memiliki kontrak SPK (${uspk.spk.spkNumber}) karena relasi 1 USPK : 1 SPK.`,
      };
    }

    const isRecommended =
      uspk.status === "APPROVED" ||
      uspk.technicalEvaluations.some((e) => e.result === "RECOMMENDED");
    if (!isRecommended) {
      return {
        success: false,
        error:
          "SPK tidak dapat diterbitkan sebelum USPK memiliki hasil Evaluasi Teknis berstatus Direkomendasikan.",
      };
    }

    const spk = await db.spk.create({
      data: {
        uspkId: parsed.uspkId,
        projectId: parsed.projectId,
        workItemId: parsed.workItemId || undefined,
        spkNumber: parsed.spkNumber,
        vendorName: parsed.vendorName,
        vendorId: parsed.vendorId || undefined,
        targetVolume: parsed.targetVolume,
        unit: parsed.unit,
        value: parsed.value,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        status: parsed.status as never,
        releasedAt: parsed.releasedAt
          ? new Date(parsed.releasedAt)
          : parsed.status === "ACTIVE"
          ? new Date()
          : null,
        attachmentName: parsed.attachmentName,
        notes: parsed.notes,
        createdById: user.id,
        createdBy: parsed.createdBy || user.name,
      },
      include: { project: true },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "SPK",
      entityId: spk.id,
      entityTitle: `SPK ${spk.spkNumber}`,
      projectId: spk.projectId,
      projectName: spk.project.name,
      afterData: { spkNumber: spk.spkNumber, vendorName: spk.vendorName, value: Number(spk.value) },
      notes: `Surat Perintah Kerja (${spk.spkNumber}) diterbitkan kepada ${spk.vendorName} oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${spk.projectId}/procurement`);
    revalidatePath(`/workspace/${spk.projectId}/execution`);
    revalidatePath("/dashboard");
    return { success: true, spk: toPlainObject(spk) };
  } catch (err: unknown) {
    console.error("Gagal menerbitkan SPK:", err);
    return { success: false, error: formatActionError(err, "Gagal menerbitkan Surat Perintah Kerja.") };
  }
}

export async function updateSpkStatusAction(spkId: string, status: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = UpdateSpkStatusSchema.parse({ spkId, status });

    const existing = await db.spk.findUnique({
      where: { id: parsed.spkId },
      include: { project: true },
    });
    if (!existing) {
      return { success: false, error: "Dokumen SPK tidak ditemukan." };
    }

    const updated = await db.$transaction(async (tx) => {
      const spkUpdated = await tx.spk.update({
        where: { id: parsed.spkId },
        data: { status: parsed.status as never },
      });

      if (spkUpdated.workItemId) {
        const [wi, logCount] = await Promise.all([
          tx.workItem.findUnique({
            where: { id: spkUpdated.workItemId },
            select: { progress: true },
          }),
          tx.progressLog.count({ where: { workItemId: spkUpdated.workItemId } }),
        ]);
        if (wi && parsed.status === "CLOSED" && wi.progress === 0 && logCount === 0) {
          await syncWorkItemAndProjectProgressTx(
            tx,
            spkUpdated.projectId,
            spkUpdated.workItemId,
            100
          );
        }
      }

      return spkUpdated;
    });

    await recordServerAuditLog({
      action: parsed.status === "CLOSED" ? "CLOSE" : "UPDATE",
      entityType: "SPK",
      entityId: updated.id,
      entityTitle: `SPK ${updated.spkNumber}`,
      projectId: updated.projectId,
      projectName: existing.project.name,
      beforeData: { status: existing.status },
      afterData: { status: updated.status },
      notes: `Status SPK diubah menjadi ${parsed.status} oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${updated.projectId}/procurement`);
    revalidatePath(`/workspace/${updated.projectId}/execution`);
    revalidatePath("/dashboard");
    return { success: true, spk: toPlainObject(updated) };
  } catch (err: unknown) {
    console.error("Gagal memperbarui status SPK:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui status SPK.") };
  }
}

export async function softDeleteSpkAction(spkId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.spk.findUnique({
      where: { id: spkId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen SPK tidak ditemukan." };
    }

    await db.spk.update({
      where: { id: spkId },
      data: { deletedAt: new Date() },
    });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "SPK",
      entityId: existing.id,
      entityTitle: `SPK ${existing.spkNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      notes: `SPK ${existing.spkNumber} dipindahkan ke arsip terhapus oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/procurement`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal mengarsipkan SPK:", err);
    return { success: false, error: formatActionError(err, "Gagal mengarsipkan SPK.") };
  }
}

export async function restoreSpkAction(spkId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.spk.findUnique({
      where: { id: spkId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen SPK tidak ditemukan." };
    }

    await db.spk.update({
      where: { id: spkId },
      data: { deletedAt: null },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "SPK",
      entityId: existing.id,
      entityTitle: `SPK ${existing.spkNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      notes: `SPK ${existing.spkNumber} dipulihkan dari arsip oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/procurement`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal memulihkan SPK:", err);
    return { success: false, error: formatActionError(err, "Gagal memulihkan SPK.") };
  }
}
