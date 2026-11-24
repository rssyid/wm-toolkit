"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { toPlainObject } from "@/server/serialize";
import { APPROVAL_LEVEL_LABELS, ApprovalLevel } from "@/types";
import {
  ProcessAfceActionSchema,
  SubmitAfceApprovalSchema,
  UpdateAfceSchema,
  SyncAfceMatrixSchema,
} from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

function toAfceDbStatus(
  status?: string
): "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "NEED_REVISION" | undefined {
  switch (status) {
    case "Draft":
    case "DRAFT":
      return "DRAFT";
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
      return undefined;
  }
}

export async function processAfceApprovalAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "APPROVER"]);
    const parsed = ProcessAfceActionSchema.parse(rawInput);

    const afce = await db.afce.findUnique({
      where: { id: parsed.afceId },
      include: {
        project: true,
        approvalMatrixLevels: { orderBy: { level: "asc" } },
      },
    });

    if (!afce) {
      return { success: false, error: "Dokumen AFCE tidak ditemukan." };
    }

    if (afce.deletedAt) {
      return { success: false, error: "Dokumen AFCE berada dalam arsip terhapus." };
    }

    const previousStatus = afce.status;
    const now = new Date();
    const actionDate = parsed.approvalDate ? new Date(parsed.approvalDate) : now;

    const txResult = await db.$transaction(async (tx) => {
      const levels = afce.approvalMatrixLevels;
      const targetIdx =
        parsed.targetLevelIndex ??
        Math.max(
          0,
          levels.findIndex((l) => l.status === "Pending") !== -1
            ? levels.findIndex((l) => l.status === "Pending")
            : afce.currentLevel - 1
        );

      const targetLevel = levels[targetIdx];
      let newStatus = afce.status;
      let nextLevelNum = afce.currentLevel;
      let nextApproverRole = afce.currentApproverRole;

      if (parsed.action === "Reject") {
        newStatus = "REJECTED";
        if (targetLevel) {
          await tx.afceApprovalLevel.update({
            where: { id: targetLevel.id },
            data: {
              status: "Rejected",
              approverName: parsed.approverName,
              approverJabatan: parsed.approverJabatan || parsed.approverRole,
              decidedAt: actionDate,
              note: parsed.note,
              sapDocNumber: parsed.sapDocNumber || undefined,
              sapEvidenceUrl: parsed.sapEvidenceUrl || undefined,
            },
          });
        }
      } else if (parsed.action === "Revise") {
        newStatus = "NEED_REVISION";
        if (targetLevel) {
          await tx.afceApprovalLevel.update({
            where: { id: targetLevel.id },
            data: {
              status: "Need Revision",
              approverName: parsed.approverName,
              approverJabatan: parsed.approverJabatan || parsed.approverRole,
              decidedAt: actionDate,
              note: parsed.note,
              sapDocNumber: parsed.sapDocNumber || undefined,
              sapEvidenceUrl: parsed.sapEvidenceUrl || undefined,
            },
          });
        }
      } else if (parsed.action === "Approve") {
        if (targetLevel) {
          await tx.afceApprovalLevel.update({
            where: { id: targetLevel.id },
            data: {
              status: "Approved",
              approverName: parsed.approverName,
              approverJabatan: parsed.approverJabatan || parsed.approverRole,
              decidedAt: actionDate,
              note: parsed.note,
              sapDocNumber: parsed.sapDocNumber || undefined,
              sapEvidenceUrl: parsed.sapEvidenceUrl || undefined,
            },
          });
        }

        const updatedLevels = await tx.afceApprovalLevel.findMany({
          where: { afceId: afce.id },
          orderBy: { level: "asc" },
        });

        const nextUnapprovedIdx = updatedLevels.findIndex(
          (l) => l.isRequired && l.status !== "Approved"
        );

        if (nextUnapprovedIdx === -1) {
          newStatus = "APPROVED";
          nextLevelNum = updatedLevels.length;
          nextApproverRole =
            updatedLevels[updatedLevels.length - 1]?.label || afce.currentApproverRole;
        } else {
          newStatus = "PENDING_APPROVAL";
          const nextLvl = updatedLevels[nextUnapprovedIdx];
          if (nextLvl.status !== "Pending") {
            await tx.afceApprovalLevel.update({
              where: { id: nextLvl.id },
              data: { status: "Pending" },
            });
          }
          nextLevelNum = nextLvl.level;
          nextApproverRole = nextLvl.label;
        }
      }

      const record = await tx.afceApprovalRecord.create({
        data: {
          afceId: afce.id,
          matrixLevelId: targetLevel?.id,
          approverName: parsed.approverName,
          approverRole: parsed.approverRole,
          approverJabatan: parsed.approverJabatan || parsed.approverRole,
          action: parsed.action,
          timestamp: now,
          approvalDate: actionDate,
          note: parsed.note,
          previousStatus,
          newStatus,
          sapDocNumber: parsed.sapDocNumber,
          sapEvidenceUrl: parsed.sapEvidenceUrl,
          recordedById: user.id,
        },
      });

      const updatedAfce = await tx.afce.update({
        where: { id: afce.id },
        data: {
          status: newStatus as never,
          currentLevel: nextLevelNum,
          currentApproverRole: nextApproverRole,
          sapDocNumber: parsed.sapDocNumber || afce.sapDocNumber,
          sapScreenshotUrl: parsed.sapEvidenceUrl || afce.sapScreenshotUrl,
          approvedAt: newStatus === "APPROVED" ? actionDate : afce.approvedAt,
        },
        include: {
          approvalMatrixLevels: { orderBy: { level: "asc" } },
          approvalRecords: { orderBy: { timestamp: "asc" } },
        },
      });

      // Sinkronkan tanggal pembaruan proyek agar tetap atomik tanpa perlu memanggil updateProjectAction dari klien
      await tx.project.update({
        where: { id: afce.projectId },
        data: { updatedAt: now },
      });

      return { updatedAfce, record };
    });

    await recordServerAuditLog({
      action:
        parsed.action === "Approve"
          ? "APPROVE"
          : parsed.action === "Reject"
          ? "REJECT"
          : "UPDATE",
      entityType: "AFCE",
      entityId: afce.id,
      entityTitle: `AFCE ${afce.afceNumber}`,
      projectId: afce.projectId,
      projectName: afce.project.name,
      beforeData: { status: previousStatus, currentLevel: afce.currentLevel },
      afterData: {
        status: txResult.updatedAfce.status,
        currentLevel: txResult.updatedAfce.currentLevel,
      },
      notes: `Otorisasi AFCE (${parsed.action}) dicatat oleh ${user.name} untuk tingkat ${parsed.approverRole}`,
    });

    revalidatePath(`/workspace/${afce.projectId}/afce`);
    revalidatePath(`/workspace/${afce.projectId}`);
    revalidatePath(`/dashboard`);
    return {
      success: true,
      afce: toPlainObject(txResult.updatedAfce),
      record: toPlainObject(txResult.record),
    };
  } catch (err: unknown) {
    console.error("Gagal memproses approval AFCE:", err);
    return { success: false, error: formatActionError(err, "Gagal memproses persetujuan AFCE.") };
  }
}

export async function submitAfceApprovalAction(
  afceId: string,
  note = "",
  submissionDate?: string
) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = SubmitAfceApprovalSchema.parse({ afceId, note, submissionDate });

    const afce = await db.afce.findUnique({
      where: { id: parsed.afceId },
      include: {
        project: true,
        approvalMatrixLevels: { orderBy: { level: "asc" } },
      },
    });

    if (!afce) {
      return { success: false, error: "Dokumen AFCE tidak ditemukan." };
    }

    if (afce.deletedAt) {
      return { success: false, error: "Dokumen AFCE berada dalam arsip terhapus." };
    }

    const subDate = parsed.submissionDate ? new Date(parsed.submissionDate) : new Date();

    const updated = await db.$transaction(async (tx) => {
      const levels = afce.approvalMatrixLevels;
      const resetFirstIdx = levels.findIndex((l) => l.status !== "Approved");
      const targetFirst = resetFirstIdx !== -1 ? levels[resetFirstIdx] : levels[0];

      for (const lvl of levels) {
        if (lvl.status !== "Approved") {
          await tx.afceApprovalLevel.update({
            where: { id: lvl.id },
            data: {
              status: targetFirst && lvl.id === targetFirst.id ? "Pending" : "Waiting",
            },
          });
        }
      }

      const nextAfce = await tx.afce.update({
        where: { id: afce.id },
        data: {
          status: "PENDING_APPROVAL",
          submittedAt: subDate,
          currentLevel: targetFirst ? targetFirst.level : 1,
          currentApproverRole: targetFirst ? targetFirst.label : afce.currentApproverRole,
        },
        include: {
          approvalMatrixLevels: { orderBy: { level: "asc" } },
          approvalRecords: { orderBy: { timestamp: "asc" } },
        },
      });

      await tx.afceApprovalRecord.create({
        data: {
          afceId: afce.id,
          matrixLevelId: targetFirst?.id,
          approverName: user.name,
          approverRole: "PIC Proyek",
          approverJabatan: user.jabatan || "PIC Proyek",
          action: "Submit",
          timestamp: new Date(),
          approvalDate: subDate,
          note: parsed.note || "AFCE diajukan untuk proses persetujuan berjenjang sesuai SAP.",
          previousStatus: afce.status,
          newStatus: "PENDING_APPROVAL",
          recordedById: user.id,
        },
      });

      return nextAfce;
    });

    await recordServerAuditLog({
      action: "SUBMIT",
      entityType: "AFCE",
      entityId: afce.id,
      entityTitle: `AFCE ${afce.afceNumber}`,
      projectId: afce.projectId,
      projectName: afce.project.name,
      beforeData: { status: afce.status },
      afterData: { status: updated.status },
      notes: `AFCE diajukan ke proses persetujuan oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${afce.projectId}/afce`);
    revalidatePath(`/workspace/${afce.projectId}`);
    return { success: true, afce: toPlainObject(updated) };
  } catch (err: unknown) {
    console.error("Gagal mengajukan persetujuan AFCE:", err);
    return { success: false, error: formatActionError(err, "Gagal mengajukan dokumen AFCE.") };
  }
}

export async function updateAfceAction(afceId: string, rawUpdates: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = UpdateAfceSchema.parse(rawUpdates);

    const existing = await db.afce.findUnique({
      where: { id: afceId },
      include: { project: true, approvalMatrixLevels: { orderBy: { level: "asc" } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen AFCE tidak ditemukan." };
    }

    const nextAmount = parsed.value !== undefined ? parsed.value : Number(existing.amount);
    const amountChanged = parsed.value !== undefined && parsed.value !== Number(existing.amount);
    const nextStatusEnum = toAfceDbStatus(parsed.status);

    const updated = await db.$transaction(async (tx) => {
      let matrixSyncData: { requiredLevels?: number; currentLevel?: number; currentApproverRole?: string } = {};

      if (amountChanged) {
        const dbRules = await tx.approvalMatrixRule.findMany({
          where: { active: true },
          orderBy: { minValue: "asc" },
        });
        const matchedTier =
          dbRules.find(
            (t) => nextAmount >= Number(t.minValue) && nextAmount <= Number(t.maxValue)
          ) || dbRules[0];

        if (matchedTier && Array.isArray(matchedTier.levels)) {
          const activeCodes = (matchedTier.levels as string[]).filter(Boolean);
          const effectiveCodes = activeCodes.length > 0 ? activeCodes : ["WM"];

          await tx.afceApprovalLevel.deleteMany({ where: { afceId } });

          const effectiveStatus = nextStatusEnum || existing.status;
          await tx.afceApprovalLevel.createMany({
            data: effectiveCodes.map((code, idx) => {
              const label = APPROVAL_LEVEL_LABELS[code as ApprovalLevel] || code;
              const prevMatch = existing.approvalMatrixLevels.find((l) => l.code === code);
              let lvlStatus = prevMatch?.status || "Waiting";
              if (effectiveStatus === "PENDING_APPROVAL" && lvlStatus === "Waiting" && idx === 0) {
                lvlStatus = "Pending";
              }
              return {
                afceId,
                level: idx + 1,
                code,
                label,
                isRequired: true,
                status: lvlStatus,
                approverName: prevMatch?.approverName,
                approverJabatan: prevMatch?.approverJabatan || label,
                decidedAt: prevMatch?.decidedAt,
                note: prevMatch?.note,
                sapDocNumber: prevMatch?.sapDocNumber,
                sapEvidenceUrl: prevMatch?.sapEvidenceUrl,
              };
            }),
          });

          const firstLabel =
            APPROVAL_LEVEL_LABELS[effectiveCodes[0] as ApprovalLevel] || effectiveCodes[0];
          matrixSyncData = {
            requiredLevels: effectiveCodes.length,
            currentLevel: Math.min(Math.max(existing.currentLevel, 1), effectiveCodes.length),
            currentApproverRole: firstLabel,
          };
        }
      }

      return tx.afce.update({
        where: { id: afceId },
        data: {
          afceNumber: parsed.afceNumber,
          amount: parsed.value !== undefined ? parsed.value : undefined,
          status: nextStatusEnum as never,
          sapDocNumber:
            parsed.sapDocNumber !== undefined ? parsed.sapDocNumber : undefined,
          sapReference:
            parsed.sapReference !== undefined ? parsed.sapReference : undefined,
          sapScreenshotUrl:
            parsed.sapScreenshotUrl !== undefined
              ? parsed.sapScreenshotUrl
              : parsed.sapScreenshotPlaceholder !== undefined
              ? parsed.sapScreenshotPlaceholder
              : undefined,
          ...matrixSyncData,
        },
        include: {
          approvalMatrixLevels: { orderBy: { level: "asc" } },
          approvalRecords: { orderBy: { timestamp: "asc" } },
        },
      });
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "AFCE",
      entityId: existing.id,
      entityTitle: `AFCE ${updated.afceNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      beforeData: {
        afceNumber: existing.afceNumber,
        amount: Number(existing.amount),
        status: existing.status,
      },
      afterData: {
        afceNumber: updated.afceNumber,
        amount: Number(updated.amount),
        status: updated.status,
      },
      notes: `Dokumen AFCE diperbarui oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${updated.projectId}/afce`);
    revalidatePath(`/workspace/${updated.projectId}`);
    revalidatePath("/dashboard");
    return { success: true, afce: toPlainObject(updated) };
  } catch (err: unknown) {
    console.error("Gagal memperbarui AFCE:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui dokumen AFCE.") };
  }
}

export async function syncAfceWithMatrixAction(afceId: string, matrixLevels?: unknown[]) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = SyncAfceMatrixSchema.parse({ afceId, matrixLevels });

    const afce = await db.afce.findUnique({
      where: { id: parsed.afceId },
      include: { approvalMatrixLevels: { orderBy: { level: "asc" } }, project: true },
    });

    if (!afce) {
      return { success: false, error: "Dokumen AFCE tidak ditemukan." };
    }

    const levelsInput = parsed.matrixLevels || [];

    const updatedAfce = await db.$transaction(async (tx) => {
      await tx.afceApprovalLevel.deleteMany({
        where: { afceId: parsed.afceId },
      });

      if (levelsInput.length > 0) {
        await tx.afceApprovalLevel.createMany({
          data: levelsInput.map((lvl, idx) => ({
            afceId: parsed.afceId,
            level: lvl.level || idx + 1,
            code: lvl.code,
            label: lvl.label,
            isRequired: lvl.isRequired ?? true,
            status: lvl.status || "Waiting",
            approverName: lvl.approverName || null,
            approverJabatan: lvl.approverJabatan || lvl.label,
            decidedAt: lvl.decidedAt ? new Date(lvl.decidedAt) : null,
            note: lvl.note || null,
            sapDocNumber: lvl.sapDocNumber || null,
            sapEvidenceUrl: lvl.sapEvidenceUrl || null,
          })),
        });
      }

      const firstUnapproved = levelsInput.findIndex((l) => l.status !== "Approved");
      const allApproved = firstUnapproved === -1 && levelsInput.length > 0;
      const newStatus = allApproved
        ? "APPROVED"
        : afce.status === "DRAFT"
        ? "DRAFT"
        : "PENDING_APPROVAL";
      const currentLevel = allApproved
        ? levelsInput.length
        : firstUnapproved !== -1
        ? firstUnapproved + 1
        : 1;
      const currentApproverRole =
        firstUnapproved !== -1
          ? levelsInput[firstUnapproved]?.label
          : levelsInput[levelsInput.length - 1]?.label || afce.currentApproverRole;

      return tx.afce.update({
        where: { id: parsed.afceId },
        data: {
          requiredLevels: levelsInput.length,
          currentLevel,
          currentApproverRole,
          status: newStatus as never,
        },
        include: {
          approvalMatrixLevels: { orderBy: { level: "asc" } },
          approvalRecords: { orderBy: { timestamp: "asc" } },
        },
      });
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "AFCE",
      entityId: afce.id,
      entityTitle: `AFCE ${afce.afceNumber}`,
      projectId: afce.projectId,
      projectName: afce.project.name,
      notes: `Matriks otorisasi AFCE disinkronkan dengan SOP terbaru oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${afce.projectId}/afce`);
    return { success: true, afce: toPlainObject(updatedAfce) };
  } catch (err: unknown) {
    console.error("Gagal menyinkronkan matriks AFCE:", err);
    return { success: false, error: formatActionError(err, "Gagal menyinkronkan matriks AFCE.") };
  }
}

export async function softDeleteAfceAction(afceId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.afce.findUnique({
      where: { id: afceId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen AFCE tidak ditemukan." };
    }

    const activeLinkedPr = await db.purchaseRequisition.count({
      where: { afceId, deletedAt: null },
    });
    const activeLinkedUspk = await db.uspk.count({
      where: { afceId, deletedAt: null },
    });
    if (activeLinkedPr > 0 || activeLinkedUspk > 0) {
      return {
        success: false,
        error: "AFCE tidak dapat diarsipkan karena masih terhubung dengan PR atau USPK aktif.",
      };
    }

    const updated = await db.afce.update({
      where: { id: afceId },
      data: { deletedAt: new Date() },
    });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "AFCE",
      entityId: existing.id,
      entityTitle: `AFCE ${existing.afceNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      beforeData: { deletedAt: existing.deletedAt },
      afterData: { deletedAt: updated.deletedAt },
      notes: `Dokumen AFCE ${existing.afceNumber} dipindahkan ke arsip terhapus oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/afce`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal mengarsipkan AFCE:", err);
    return { success: false, error: formatActionError(err, "Gagal mengarsipkan dokumen AFCE.") };
  }
}

export async function restoreAfceAction(afceId: string) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const existing = await db.afce.findUnique({
      where: { id: afceId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return { success: false, error: "Dokumen AFCE tidak ditemukan." };
    }

    await db.afce.update({
      where: { id: afceId },
      data: { deletedAt: null },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "AFCE",
      entityId: existing.id,
      entityTitle: `AFCE ${existing.afceNumber}`,
      projectId: existing.projectId,
      projectName: existing.project.name,
      beforeData: { deletedAt: existing.deletedAt },
      afterData: { deletedAt: null },
      notes: `Dokumen AFCE ${existing.afceNumber} dipulihkan oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${existing.projectId}/afce`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal memulihkan AFCE:", err);
    return { success: false, error: formatActionError(err, "Gagal memulihkan dokumen AFCE.") };
  }
}
