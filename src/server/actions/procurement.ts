"use server";

import { db } from "@/server/db";
import { requireAuth, requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import {
  CreatePrSchema,
  CreateVendorEvaluationSchema,
  CreatePoSchema,
  CreateGoodsReceiptSchema,
  CreateGoodsHandoverSchema,
} from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

function toPrStatusEnum(status?: string): "DRAFT" | "RELEASED" | "CLOSED" | "CANCELLED" {
  switch (status?.toUpperCase()) {
    case "RELEASED":
    case "APPROVED":
      return "RELEASED";
    case "CLOSED":
      return "CLOSED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "DRAFT";
  }
}

function toPoStatusEnum(status?: string): "DRAFT" | "RELEASED" | "CLOSED" | "CANCELLED" {
  switch (status?.toUpperCase()) {
    case "RELEASED":
    case "ISSUED":
    case "ORDERED":
      return "RELEASED";
    case "CLOSED":
      return "CLOSED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "DRAFT";
  }
}

export async function createPrAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreatePrSchema.parse(rawInput);

  const pr = await db.purchaseRequisition.create({
    data: {
      projectId: parsed.projectId,
      workItemId: parsed.workItemId,
      prNumber: parsed.prNumber,
      sapPrNumber: parsed.sapPrNumber,
      prType: parsed.prType,
      description: parsed.description,
      status: toPrStatusEnum(parsed.status),
      releaseDate: new Date(parsed.releaseDate),
      attachmentName: parsed.attachmentName,
      createdById: user.id,
    },
    include: { project: true },
  });

  await recordServerAuditLog({
    action: "CREATE",
    entityType: "PR",
    entityId: pr.id,
    entityTitle: `PR ${pr.prNumber}`,
    projectId: pr.projectId,
    projectName: pr.project.name,
    afterData: pr,
    notes: `Pencatatan Purchase Requisition baru (${pr.prNumber}) oleh ${user.name}`,
  });

  revalidatePath(`/workspace/${pr.projectId}/procurement`);
  revalidatePath(`/workspace/${pr.projectId}/pr`);
  return { success: true, pr };
}

export async function recordVendorEvaluationAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateVendorEvaluationSchema.parse(rawInput);

  const evaluation = await db.vendorEvaluation.create({
    data: {
      prId: parsed.prId,
      projectId: parsed.projectId,
      supplierId: parsed.supplierId,
      supplierName: parsed.supplierName,
      evaluatorId: user.id,
      evaluatorName: parsed.evaluatorName,
      evaluatorJabatan: parsed.evaluatorJabatan,
      evaluationDate: new Date(parsed.evaluationDate),
      result: parsed.result,
      score: parsed.score,
      notes: parsed.notes,
      attachmentName: parsed.attachmentName,
    },
  });

  await recordServerAuditLog({
    action: "CREATE",
    entityType: "VENDOR_EVALUATION",
    entityId: evaluation.id,
    entityTitle: `Evaluasi Rekanan ${parsed.supplierName}`,
    projectId: parsed.projectId,
    afterData: evaluation,
    notes: `Evaluasi rekanan dicatat: ${parsed.result} untuk PR terkait`,
  });

  if (parsed.projectId) {
    revalidatePath(`/workspace/${parsed.projectId}/procurement`);
  }
  return { success: true, evaluation };
}

export async function createPoAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreatePoSchema.parse(rawInput);

  const po = await db.purchaseOrder.create({
    data: {
      poNumber: parsed.poNumber,
      prId: parsed.relatedPrId,
      projectId: parsed.projectId,
      workItemId: parsed.workItemId,
      supplierId: parsed.supplierId,
      supplierName: parsed.supplierName,
      poDate: new Date(parsed.poDate),
      releaseDate: parsed.releaseDate ? new Date(parsed.releaseDate) : null,
      poValue: parsed.poValue,
      status: toPoStatusEnum(parsed.status),
      attachmentName: parsed.attachmentName,
      createdById: user.id,
      items: {
        create: (parsed.items || []).map((item: any) => ({
          materialName: item.materialName || "Material",
          sapMaterialCode: item.sapMaterialCode,
          volume: Number(item.volume) || 0,
          unit: item.unit || "Unit",
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0,
          receivedVolume: Number(item.receivedVolume) || 0,
          remainingVolume: Number(item.remainingVolume) || Number(item.volume) || 0,
          status: item.status || "Ordered",
        })),
      },
    },
    include: { project: true, items: true },
  });

  await recordServerAuditLog({
    action: "CREATE",
    entityType: "PO",
    entityId: po.id,
    entityTitle: `PO ${po.poNumber}`,
    projectId: po.projectId,
    projectName: po.project.name,
    afterData: po,
    notes: `Purchase Order ${po.poNumber} senilai Rp ${po.poValue} diterbitkan kepada ${po.supplierName}`,
  });

  revalidatePath(`/workspace/${po.projectId}/procurement`);
  revalidatePath(`/workspace/${po.projectId}/po`);
  return { success: true, po };
}

export async function recordGoodsReceiptAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateGoodsReceiptSchema.parse(rawInput);

  const gr = await db.goodsReceipt.create({
    data: {
      grNumber: parsed.grNumber,
      poId: parsed.poId,
      itemId: parsed.itemId,
      materialName: parsed.materialName,
      receiptDate: new Date(parsed.receiptDate),
      receivedVolume: parsed.receivedVolume,
      unit: parsed.unit,
      notes: parsed.notes,
      attachmentName: parsed.attachmentName,
      recordedById: user.id,
      recordedByName: parsed.recordedBy || user.name,
    },
    include: { po: true },
  });

  // Update receivedVolume in PoItem if itemId is provided
  if (parsed.itemId) {
    const item = await db.poItem.findUnique({ where: { id: parsed.itemId } });
    if (item) {
      const newRec = item.receivedVolume + parsed.receivedVolume;
      const newRem = Math.max(0, item.volume - newRec);
      await db.poItem.update({
        where: { id: parsed.itemId },
        data: {
          receivedVolume: newRec,
          remainingVolume: newRem,
          status: newRem === 0 ? "Received" : "Partially Received",
        },
      });
    }
  }

  await recordServerAuditLog({
    action: "CREATE",
    entityType: "GR",
    entityId: gr.id,
    entityTitle: `Penerimaan Barang ${gr.grNumber}`,
    projectId: gr.po.projectId,
    afterData: gr,
    notes: `Penerimaan barang dicatat: ${gr.receivedVolume} ${gr.unit} ${gr.materialName} untuk PO ${gr.po.poNumber}`,
  });

  revalidatePath(`/workspace/${gr.po.projectId}/procurement`);
  revalidatePath(`/workspace/${gr.po.projectId}/po`);
  return { success: true, gr };
}

export async function recordGoodsHandoverAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateGoodsHandoverSchema.parse(rawInput);

  const handover = await db.goodsHandover.create({
    data: {
      handoverNumber: parsed.handoverNumber,
      poId: parsed.poId,
      projectId: parsed.projectId,
      supplierId: parsed.supplierId,
      supplierName: parsed.supplierName,
      handoverDate: new Date(parsed.handoverDate),
      receiverName: parsed.receiverName,
      receiverJabatan: parsed.receiverJabatan,
      giverName: parsed.giverName,
      giverCompany: parsed.giverCompany,
      notes: parsed.notes,
      status: parsed.status as any,
      attachmentName: parsed.attachmentName,
      createdById: user.id,
    },
  });

  await recordServerAuditLog({
    action: "CREATE",
    entityType: "GOODS_HANDOVER",
    entityId: handover.id,
    entityTitle: `BAST ${handover.handoverNumber}`,
    projectId: handover.projectId,
    afterData: handover,
    notes: `Berita Acara Serah Terima Barang (BAST) diterbitkan untuk PO terkait`,
  });

  revalidatePath(`/workspace/${handover.projectId}/procurement`);
  return { success: true, handover };
}
