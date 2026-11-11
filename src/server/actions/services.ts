"use server";

import { db } from "@/server/db";
import { requireAuth, requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import {
  CreateUspkSchema,
  CreateTechnicalEvaluationSchema,
  CreateSpkSchema,
} from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

export async function createUspkAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateUspkSchema.parse(rawInput);

  const uspk = await db.uspk.create({
    data: {
      afceId: parsed.afceId,
      projectId: parsed.projectId,
      workItemId: parsed.workItemId,
      uspkNumber: parsed.uspkNumber,
      vendorName: parsed.vendorName,
      vendorId: parsed.vendorId,
      scope: parsed.scope,
      value: parsed.value,
      targetVolume: parsed.targetVolume,
      unit: parsed.unit,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      status: (parsed.status?.toUpperCase() || "DRAFT") as any,
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
    afterData: uspk,
    notes: `Usulan SPK (${uspk.uspkNumber}) jasa kontraktor ${uspk.vendorName} dibuat oleh ${user.name}`,
  });

  revalidatePath(`/workspace/${uspk.projectId}/procurement`);
  revalidatePath(`/workspace/${uspk.projectId}/services`);
  return { success: true, uspk };
}

export async function updateUspkStatusAction(uspkId: string, status: string, decidedAt?: string) {
  const user = await requireRole(["ADMIN", "PIC", "APPROVER"]);

  const existing = await db.uspk.findUnique({
    where: { id: uspkId },
    include: { project: true },
  });
  if (!existing) {
    throw new Error("Dokumen USPK tidak ditemukan.");
  }

  const updated = await db.uspk.update({
    where: { id: uspkId },
    data: {
      status: status as any,
      decidedAt: decidedAt ? new Date(decidedAt) : new Date(),
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
    notes: `Status USPK diubah menjadi ${status} oleh ${user.name}`,
  });

  revalidatePath(`/workspace/${updated.projectId}/procurement`);
  return { success: true, uspk: updated };
}

export async function recordTechnicalEvaluationAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateTechnicalEvaluationSchema.parse(rawInput);

  const evaluation = await db.technicalEvaluation.create({
    data: {
      uspkId: parsed.uspkId,
      projectId: parsed.projectId,
      evaluatorId: user.id,
      evaluatorName: parsed.evaluatorName,
      evaluatorJabatan: parsed.evaluatorJabatan,
      evaluationDate: new Date(parsed.evaluationDate),
      result: parsed.result,
      rekomendasi: parsed.rekomendasi,
      score: parsed.score,
      notes: parsed.notes,
      attachmentName: parsed.attachmentName,
    },
  });

  await recordServerAuditLog({
    action: "CREATE",
    entityType: "TECHNICAL_EVALUATION",
    entityId: evaluation.id,
    entityTitle: `Evaluasi Teknis USPK`,
    projectId: parsed.projectId,
    afterData: evaluation,
    notes: `Evaluasi teknis jasa dicatat: ${parsed.result}`,
  });

  if (parsed.projectId) {
    revalidatePath(`/workspace/${parsed.projectId}/procurement`);
  }
  return { success: true, evaluation };
}

export async function createSpkAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateSpkSchema.parse(rawInput);

  const spk = await db.spk.create({
    data: {
      uspkId: parsed.uspkId,
      projectId: parsed.projectId,
      workItemId: parsed.workItemId,
      spkNumber: parsed.spkNumber,
      vendorName: parsed.vendorName,
      vendorId: parsed.vendorId,
      targetVolume: parsed.targetVolume,
      unit: parsed.unit,
      value: parsed.value,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      status: (parsed.status?.toUpperCase() || "DRAFT") as any,
      releasedAt: parsed.releasedAt ? new Date(parsed.releasedAt) : null,
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
    afterData: spk,
    notes: `Surat Perintah Kerja (${spk.spkNumber}) resmi diterbitkan kepada ${spk.vendorName}`,
  });

  revalidatePath(`/workspace/${spk.projectId}/procurement`);
  revalidatePath(`/workspace/${spk.projectId}/services`);
  return { success: true, spk };
}

export async function updateSpkStatusAction(spkId: string, status: string) {
  const user = await requireRole(["ADMIN", "PIC"]);

  const existing = await db.spk.findUnique({
    where: { id: spkId },
    include: { project: true },
  });
  if (!existing) {
    throw new Error("Dokumen SPK tidak ditemukan.");
  }

  const updated = await db.spk.update({
    where: { id: spkId },
    data: { status: status as any },
  });

  await recordServerAuditLog({
    action: "UPDATE",
    entityType: "SPK",
    entityId: updated.id,
    entityTitle: `SPK ${updated.spkNumber}`,
    projectId: updated.projectId,
    projectName: existing.project.name,
    beforeData: { status: existing.status },
    afterData: { status: updated.status },
    notes: `Status SPK diubah menjadi ${status} oleh ${user.name}`,
  });

  revalidatePath(`/workspace/${updated.projectId}/procurement`);
  return { success: true, spk: updated };
}
