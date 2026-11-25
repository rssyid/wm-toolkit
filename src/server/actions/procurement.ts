"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { toPlainObject } from "@/server/serialize";
import {
  CreatePrSchema,
  CreateVendorEvaluationSchema,
  CreatePoSchema,
  CreateGoodsReceiptSchema,
  CreateGoodsHandoverSchema,
} from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";
import { syncMaterialWorkItemFromPosTx } from "@/server/work-item-progress";

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

export async function createPrAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreatePrSchema.parse(rawInput);

    const afce = await db.afce.findFirst({
      where: { projectId: parsed.projectId, deletedAt: null },
    });

    const pr = await db.purchaseRequisition.create({
      data: {
        afceId: afce?.id,
        projectId: parsed.projectId,
        workItemId: parsed.workItemId || undefined,
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
      afterData: { prNumber: pr.prNumber, status: pr.status },
      notes: `Pencatatan Purchase Requisition baru (${pr.prNumber}) oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${pr.projectId}/procurement`);
    return { success: true, pr: toPlainObject(pr) };
  } catch (err: unknown) {
    console.error("Gagal mencatat PR:", err);
    return { success: false, error: formatActionError(err, "Gagal mencatat Purchase Requisition.") };
  }
}

export async function softDeletePrAction(prId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.purchaseRequisition.findUnique({
      where: { id: prId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen PR tidak ditemukan." };
    }

    const activePoCount = await db.purchaseOrder.count({
      where: { prId, deletedAt: null },
    });
    if (activePoCount > 0) {
      return {
        success: false,
        error: `PR tidak dapat diarsipkan karena masih terhubung dengan ${activePoCount} PO aktif.`,
      };
    }

    await db.purchaseRequisition.update({
      where: { id: prId },
      data: { deletedAt: new Date() },
    });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "PR",
      entityId: existing.id,
      entityTitle: `PR ${existing.prNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      notes: `PR ${existing.prNumber} dipindahkan ke arsip terhapus oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/procurement`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal mengarsipkan PR:", err);
    return { success: false, error: formatActionError(err, "Gagal mengarsipkan PR.") };
  }
}

export async function restorePrAction(prId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.purchaseRequisition.findUnique({
      where: { id: prId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen PR tidak ditemukan." };
    }

    await db.purchaseRequisition.update({
      where: { id: prId },
      data: { deletedAt: null },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "PR",
      entityId: existing.id,
      entityTitle: `PR ${existing.prNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      notes: `PR ${existing.prNumber} dipulihkan dari arsip oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/procurement`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal memulihkan PR:", err);
    return { success: false, error: formatActionError(err, "Gagal memulihkan PR.") };
  }
}

export async function recordVendorEvaluationAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreateVendorEvaluationSchema.parse(rawInput);

    const pr = await db.purchaseRequisition.findUnique({
      where: { id: parsed.prId },
      select: { id: true, projectId: true, prNumber: true },
    });
    if (!pr) {
      return { success: false, error: "PR referensi tidak ditemukan." };
    }

    const evaluation = await db.vendorEvaluation.create({
      data: {
        prId: parsed.prId,
        projectId: parsed.projectId || pr.projectId,
        supplierId: parsed.supplierId || undefined,
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
      projectId: pr.projectId,
      afterData: { supplierName: parsed.supplierName, result: parsed.result },
      notes: `Evaluasi rekanan dicatat untuk ${pr.prNumber}: ${parsed.result}`,
    });

    revalidatePath(`/workspace/${pr.projectId}/procurement`);
    return { success: true, evaluation: toPlainObject(evaluation) };
  } catch (err: unknown) {
    console.error("Gagal mencatat evaluasi vendor:", err);
    return { success: false, error: formatActionError(err, "Gagal mencatat evaluasi rekanan.") };
  }
}

export async function createPoAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreatePoSchema.parse(rawInput);

    // Guardrail: PO wajib merujuk PR yang sudah memiliki minimal 1 evaluasi vendor RECOMMENDED
    const recommendedEval = await db.vendorEvaluation.findFirst({
      where: {
        prId: parsed.relatedPrId,
        result: "RECOMMENDED",
      },
    });
    if (!recommendedEval) {
      return {
        success: false,
        error:
          "PO tidak dapat diterbitkan sebelum PR terkait memiliki minimal satu Evaluasi Rekanan berstatus Direkomendasikan.",
      };
    }

    const po = await db.$transaction(async (tx) => {
      const createdPo = await tx.purchaseOrder.create({
        data: {
          poNumber: parsed.poNumber,
          prId: parsed.relatedPrId,
          projectId: parsed.projectId,
          workItemId: parsed.workItemId || undefined,
          supplierId: parsed.supplierId || undefined,
          supplierName: parsed.supplierName,
          poDate: new Date(parsed.poDate),
          releaseDate: parsed.releaseDate ? new Date(parsed.releaseDate) : null,
          poValue: parsed.poValue,
          status: toPoStatusEnum(parsed.status),
          attachmentName: parsed.attachmentName,
          createdById: user.id,
          items: {
            create: parsed.items.map((item) => ({
              materialName: item.materialName,
              sapMaterialCode: item.sapMaterialCode,
              volume: Number(item.volume),
              unit: item.unit,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
              receivedVolume: Number(item.receivedVolume) || 0,
              remainingVolume:
                item.remainingVolume !== undefined
                  ? Number(item.remainingVolume)
                  : Number(item.volume),
              status: item.status || "Ordered",
            })),
          },
        },
        include: { project: true, items: true },
      });

      if (createdPo.workItemId && createdPo.status !== "DRAFT" && createdPo.status !== "CANCELLED") {
        await syncMaterialWorkItemFromPosTx(tx, createdPo.projectId, createdPo.workItemId);
      }

      return createdPo;
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "PO",
      entityId: po.id,
      entityTitle: `PO ${po.poNumber}`,
      projectId: po.projectId,
      projectName: po.project.name,
      afterData: { poNumber: po.poNumber, poValue: Number(po.poValue), supplierName: po.supplierName },
      notes: `Purchase Order ${po.poNumber} diterbitkan kepada ${po.supplierName} oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${po.projectId}/procurement`);
    revalidatePath(`/workspace/${po.projectId}/execution`);
    return { success: true, po: toPlainObject(po) };
  } catch (err: unknown) {
    console.error("Gagal menerbitkan PO:", err);
    return { success: false, error: formatActionError(err, "Gagal menerbitkan Purchase Order.") };
  }
}

export async function softDeletePoAction(poId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen PO tidak ditemukan." };
    }

    await db.purchaseOrder.update({
      where: { id: poId },
      data: { deletedAt: new Date() },
    });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "PO",
      entityId: existing.id,
      entityTitle: `PO ${existing.poNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      notes: `PO ${existing.poNumber} dipindahkan ke arsip terhapus oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/procurement`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal mengarsipkan PO:", err);
    return { success: false, error: formatActionError(err, "Gagal mengarsipkan PO.") };
  }
}

export async function restorePoAction(poId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen PO tidak ditemukan." };
    }

    await db.purchaseOrder.update({
      where: { id: poId },
      data: { deletedAt: null },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "PO",
      entityId: existing.id,
      entityTitle: `PO ${existing.poNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      notes: `PO ${existing.poNumber} dipulihkan dari arsip oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/procurement`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal memulihkan PO:", err);
    return { success: false, error: formatActionError(err, "Gagal memulihkan PO.") };
  }
}

export async function recordGoodsReceiptAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreateGoodsReceiptSchema.parse(rawInput);

    const txResult = await db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: parsed.poId },
        include: { items: true },
      });
      if (!po) {
        throw new Error("Purchase Order tidak ditemukan.");
      }

      const gr = await tx.goodsReceipt.create({
        data: {
          grNumber: parsed.grNumber,
          poId: parsed.poId,
          itemId: parsed.itemId || undefined,
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

      if (parsed.itemId) {
        const item = await tx.poItem.findUnique({ where: { id: parsed.itemId } });
        if (item) {
          const newRec = item.receivedVolume + parsed.receivedVolume;
          const newRem = Math.max(0, item.volume - newRec);
          await tx.poItem.update({
            where: { id: parsed.itemId },
            data: {
              receivedVolume: newRec,
              remainingVolume: newRem,
              status: newRem === 0 ? "Received" : "Partially Received",
            },
          });
        }
      }

      const updatedItems = await tx.poItem.findMany({ where: { poId: parsed.poId } });
      const totalOrdered = updatedItems.reduce((sum, it) => sum + it.volume, 0);
      const totalReceived = updatedItems.reduce(
        (sum, it) => sum + Math.min(it.receivedVolume, it.volume),
        0
      );
      const receiptProgressPercent =
        totalOrdered > 0 ? Math.min(100, Math.round((totalReceived / totalOrdered) * 100)) : 0;

      await tx.purchaseOrder.update({
        where: { id: parsed.poId },
        data: { receiptProgressPercent },
      });

      if (po.workItemId) {
        await syncMaterialWorkItemFromPosTx(tx, po.projectId, po.workItemId);
      }

      return { gr, receiptProgressPercent };
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "GR",
      entityId: txResult.gr.id,
      entityTitle: `Penerimaan Barang ${txResult.gr.grNumber}`,
      projectId: txResult.gr.po.projectId,
      afterData: {
        grNumber: txResult.gr.grNumber,
        receivedVolume: txResult.gr.receivedVolume,
        receiptProgressPercent: txResult.receiptProgressPercent,
      },
      notes: `Penerimaan barang dicatat: ${txResult.gr.receivedVolume} ${txResult.gr.unit} ${txResult.gr.materialName} untuk PO ${txResult.gr.po.poNumber}`,
    });

    revalidatePath(`/workspace/${txResult.gr.po.projectId}/procurement`);
    revalidatePath(`/workspace/${txResult.gr.po.projectId}/execution`);
    revalidatePath("/dashboard");
    return {
      success: true,
      gr: toPlainObject(txResult.gr),
      receiptProgressPercent: txResult.receiptProgressPercent,
    };
  } catch (err: unknown) {
    console.error("Gagal mencatat Goods Receipt:", err);
    return { success: false, error: formatActionError(err, "Gagal mencatat penerimaan barang.") };
  }
}

export async function recordGoodsHandoverAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreateGoodsHandoverSchema.parse(rawInput);

    const handover = await db.$transaction(async (tx) => {
      const created = await tx.goodsHandover.create({
        data: {
          handoverNumber: parsed.handoverNumber,
          poId: parsed.poId,
          projectId: parsed.projectId,
          supplierId: parsed.supplierId || undefined,
          supplierName: parsed.supplierName,
          handoverDate: new Date(parsed.handoverDate),
          receiverName: parsed.receiverName,
          receiverJabatan: parsed.receiverJabatan,
          giverName: parsed.giverName,
          giverCompany: parsed.giverCompany,
          notes: parsed.notes,
          status: parsed.status as never,
          attachmentName: parsed.attachmentName,
          createdById: user.id,
        },
      });

      if (parsed.status === "COMPLETED") {
        const updatedPo = await tx.purchaseOrder.update({
          where: { id: parsed.poId },
          data: { status: "CLOSED", receiptProgressPercent: 100 },
          select: { projectId: true, workItemId: true },
        });
        if (updatedPo.workItemId) {
          await syncMaterialWorkItemFromPosTx(tx, updatedPo.projectId, updatedPo.workItemId);
        }
      }

      return created;
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "GOODS_HANDOVER",
      entityId: handover.id,
      entityTitle: `BAST ${handover.handoverNumber}`,
      projectId: handover.projectId,
      afterData: { handoverNumber: handover.handoverNumber, status: handover.status },
      notes: `Berita Acara Serah Terima Barang (BAST ${handover.handoverNumber}) dicatat oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${handover.projectId}/procurement`);
    revalidatePath(`/workspace/${handover.projectId}/execution`);
    revalidatePath("/dashboard");
    return { success: true, handover: toPlainObject(handover) };
  } catch (err: unknown) {
    console.error("Gagal mencatat BAST:", err);
    return { success: false, error: formatActionError(err, "Gagal mencatat BAST serah terima barang.") };
  }
}
