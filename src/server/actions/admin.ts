"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";
import bcrypt from "bcryptjs";
import {
  INITIAL_REGIONS,
  INITIAL_COMPANIES,
  INITIAL_LOCATIONS,
  INITIAL_BLOCKS,
  INITIAL_MATERIALS,
  INITIAL_SUPPLIERS,
  INITIAL_USERS,
  INITIAL_APPROVAL_MATRIX,
  INITIAL_PROJECT_CATEGORIES,
  INITIAL_PROJECT_TYPES,
  INITIAL_PROCUREMENT_TYPES,
} from "@/lib/mock-data/master-data";
import { INITIAL_NOTIFICATION_SETTINGS } from "@/lib/mock-data/notifications";

export async function seedMasterDataAction() {
  try {
    const user = await requireRole(["ADMIN"]);
    const defaultPwd = process.env.DEFAULT_USER_PASSWORD || "wmtoolkit2026";
    const defaultPasswordHash = bcrypt.hashSync(defaultPwd, 10);

    for (const r of INITIAL_REGIONS) {
      const existing = await db.region.findFirst({
        where: { OR: [{ code: r.code }, { id: r.id }] },
      });
      if (existing) {
        await db.region.update({
          where: { id: existing.id },
          data: { name: r.name, description: r.description, status: r.status },
        });
      } else {
        await db.region.create({
          data: { id: r.id, code: r.code, name: r.name, description: r.description, status: r.status },
        });
      }
    }

    for (const c of INITIAL_COMPANIES) {
      const existing = await db.company.findFirst({
        where: { OR: [{ code: c.code }, { id: c.id }] },
      });
      if (existing) {
        await db.company.update({
          where: { id: existing.id },
          data: { name: c.name, npwp: c.npwp, status: c.status },
        });
      } else {
        await db.company.create({
          data: { id: c.id, code: c.code, name: c.name, npwp: c.npwp, status: c.status },
        });
      }
    }

    for (const loc of INITIAL_LOCATIONS) {
      const existing = await db.estateLocation.findFirst({
        where: { OR: [{ code: loc.code }, { id: loc.id }] },
      });
      if (existing) {
        await db.estateLocation.update({
          where: { id: existing.id },
          data: {
            name: loc.name,
            regionId: loc.regionId,
            companyId: loc.companyId,
            district: loc.district,
            hectares: loc.hectares,
            status: loc.status,
          },
        });
      } else {
        await db.estateLocation.create({
          data: {
            id: loc.id,
            code: loc.code,
            name: loc.name,
            regionId: loc.regionId,
            companyId: loc.companyId,
            district: loc.district,
            hectares: loc.hectares,
            status: loc.status,
          },
        });
      }
    }

    for (const b of INITIAL_BLOCKS) {
      const existing = await db.estateBlock.findUnique({ where: { id: b.id } });
      if (existing) {
        await db.estateBlock.update({
          where: { id: b.id },
          data: {
            estateId: b.estateId,
            code: b.code,
            name: b.name,
            afdeling: b.afdeling,
            cropType: b.cropType,
            plantingYear: b.plantingYear,
            hectares: b.hectares,
            status: b.status,
          },
        });
      } else {
        await db.estateBlock.create({
          data: {
            id: b.id,
            estateId: b.estateId,
            code: b.code,
            name: b.name,
            afdeling: b.afdeling,
            cropType: b.cropType,
            plantingYear: b.plantingYear,
            hectares: b.hectares,
            status: b.status,
          },
        });
      }
    }

    for (const m of INITIAL_MATERIALS) {
      const existing = await db.materialCatalogItem.findFirst({
        where: { OR: [{ sapCode: m.sapCode }, { id: m.id }] },
      });
      if (existing) {
        await db.materialCatalogItem.update({
          where: { id: existing.id },
          data: {
            name: m.name,
            category: m.category,
            unit: m.unit,
            standardPrice: m.standardPrice,
            status: m.status,
          },
        });
      } else {
        await db.materialCatalogItem.create({
          data: {
            id: m.id,
            sapCode: m.sapCode,
            name: m.name,
            category: m.category,
            unit: m.unit,
            standardPrice: m.standardPrice,
            status: m.status,
          },
        });
      }
    }

    for (const s of INITIAL_SUPPLIERS) {
      const existing = await db.supplier.findFirst({
        where: { OR: [{ code: s.code }, { id: s.id }] },
      });
      if (existing) {
        await db.supplier.update({
          where: { id: existing.id },
          data: {
            name: s.name,
            category: s.category,
            contactPerson: s.contactPerson,
            phone: s.phone,
            npwp: s.npwp,
            rating: s.rating,
            status: s.status,
          },
        });
      } else {
        await db.supplier.create({
          data: {
            id: s.id,
            code: s.code,
            name: s.name,
            category: s.category,
            contactPerson: s.contactPerson,
            phone: s.phone,
            npwp: s.npwp,
            rating: s.rating,
            status: s.status,
          },
        });
      }
    }

    const extraUsers = [
      {
        id: "usr-approver",
        name: "Ir. H. Syamsul Bahri, M.M.",
        email: "approver@perkebunan.co.id",
        systemRole: "APPROVER" as const,
        jabatan: "Regional Head / Direksi Evaluator",
        estateName: "Kantor Wilayah Sumatera Utara",
        status: "Active" as const,
      },
      {
        id: "usr-viewer",
        name: "Auditor Stakeholder Eksternal",
        email: "viewer@perkebunan.co.id",
        systemRole: "VIEWER" as const,
        jabatan: "Tim Audit Kepatuhan",
        estateName: "Holding PalmCo",
        status: "Active" as const,
      },
    ];

    for (const u of [...INITIAL_USERS, ...extraUsers]) {
      const existing = await db.user.findFirst({
        where: { OR: [{ email: u.email }, { id: u.id }] },
      });
      if (existing) {
        await db.user.update({
          where: { id: existing.id },
          data: {
            name: u.name,
            role: u.systemRole as never,
            jabatan: u.jabatan,
            estateName: u.estateName,
            isActive: u.status === "Active",
          },
        });
      } else {
        await db.user.create({
          data: {
            id: u.id,
            email: u.email,
            passwordHash: defaultPasswordHash,
            name: u.name,
            role: u.systemRole as never,
            jabatan: u.jabatan,
            estateName: u.estateName,
            isActive: u.status === "Active",
          },
        });
      }
    }

    for (const rule of INITIAL_APPROVAL_MATRIX) {
      await db.approvalMatrixRule.upsert({
        where: { id: rule.id },
        update: {
          tierName: rule.tierName,
          minValue: rule.minValue,
          maxValue: rule.maxValue,
          levels: rule.levels as never,
          active: rule.active,
        },
        create: {
          id: rule.id,
          tierName: rule.tierName,
          minValue: rule.minValue,
          maxValue: rule.maxValue,
          levels: rule.levels as never,
          active: rule.active,
        },
      });
    }

    for (const cat of INITIAL_PROJECT_CATEGORIES) {
      await db.projectCategoryItem.upsert({
        where: { code: cat.code },
        update: { name: cat.name, description: cat.description, status: cat.status },
        create: { id: cat.id, code: cat.code, name: cat.name, description: cat.description, status: cat.status },
      });
    }

    for (const pt of INITIAL_PROJECT_TYPES) {
      await db.projectTypeItem.upsert({
        where: { code: pt.code },
        update: { name: pt.name, description: pt.description, status: pt.status },
        create: { id: pt.id, code: pt.code, name: pt.name, description: pt.description, status: pt.status },
      });
    }

    for (const proc of INITIAL_PROCUREMENT_TYPES) {
      await db.procurementTypeItem.upsert({
        where: { code: proc.code },
        update: { name: proc.name, description: proc.description, status: proc.status },
        create: { id: proc.id, code: proc.code, name: proc.name, description: proc.description, status: proc.status },
      });
    }

    for (const setting of INITIAL_NOTIFICATION_SETTINGS) {
      await db.notificationSetting.upsert({
        where: {
          userId_notificationType: {
            userId: setting.userId || user.id,
            notificationType: setting.notificationType,
          },
        },
        update: { isEnabled: setting.isEnabled },
        create: {
          id: setting.id,
          userId: setting.userId || user.id,
          notificationType: setting.notificationType,
          isEnabled: setting.isEnabled,
        },
      });
    }

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "SYSTEM",
      entityId: "master-data-seed",
      entityTitle: "Sinkronisasi Master Data",
      notes: `Admin ${user.name} melakukan sinkronisasi Master Data standar ke basis data.`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/workspace");
    revalidatePath("/settings");
    revalidatePath("/notifications");
    revalidatePath("/master-data/locations");
    return { success: true, message: "Master Data berhasil disinkronkan ke basis data." };
  } catch (error: unknown) {
    console.error("Gagal sinkronisasi master data:", error);
    return { success: false, message: formatActionError(error, "Gagal sinkronisasi master data.") };
  }
}

async function deleteAllTransactionTablesTx(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) {
  await tx.progressLog.deleteMany();
  await tx.goodsHandover.deleteMany();
  await tx.goodsReceipt.deleteMany();
  await tx.poItem.deleteMany();
  await tx.purchaseOrder.deleteMany();
  await tx.vendorEvaluation.deleteMany();
  await tx.purchaseRequisition.deleteMany();
  await tx.technicalEvaluation.deleteMany();
  await tx.spk.deleteMany();
  await tx.uspk.deleteMany();
  await tx.afceApprovalRecord.deleteMany();
  await tx.afceApprovalLevel.deleteMany();
  await tx.afce.deleteMany();
  await tx.scheduleRevision.deleteMany();
  await tx.boqItem.deleteMany();
  await tx.workItem.deleteMany();
  await tx.projectAttachment.deleteMany();
  await tx.projectComment.deleteMany();
  await tx.project.deleteMany();
  await tx.notification.deleteMany();
}

export async function clearDemoDataAction() {
  try {
    const user = await requireRole(["ADMIN"]);

    await db.$transaction(async (tx) => {
      await deleteAllTransactionTablesTx(tx);
    });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "SYSTEM",
      entityId: "system-clear",
      entityTitle: "Pembersihan Data Transaksi Proyek",
      notes: `Admin ${user.name} membersihkan seluruh data transaksi proyek (rekaman audit log tetap dipertahankan).`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/workspace");
    revalidatePath("/settings");
    revalidatePath("/notifications");
    return {
      success: true,
      message: "Seluruh transaksi proyek berhasil dibersihkan. Jejak audit tetap terjaga.",
    };
  } catch (error: unknown) {
    console.error("Gagal membersihkan data transaksi:", error);
    return { success: false, message: formatActionError(error, "Gagal membersihkan data transaksi.") };
  }
}

export async function resetToEmptyProductionAction(confirmationText?: string) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (confirmationText !== "PRODUKSI") {
      return {
        success: false,
        message: 'Konfirmasi gagal. Ketik kata kunci "PRODUKSI" secara tepat untuk melanjutkan.',
      };
    }

    await db.$transaction(async (tx) => {
      await deleteAllTransactionTablesTx(tx);
      await tx.auditLog.deleteMany();
    });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "SYSTEM",
      entityId: "system-prod-reset",
      entityTitle: "Reset Basis Data Produksi Bersih",
      notes: `Admin ${user.name} melakukan reset basis data ke kondisi awal produksi bersih.`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/workspace");
    revalidatePath("/settings");
    revalidatePath("/notifications");
    return {
      success: true,
      message: "Basis data berhasil direset ke kondisi produksi kosong.",
    };
  } catch (error: unknown) {
    console.error("Gagal melakukan reset produksi:", error);
    return { success: false, message: formatActionError(error, "Gagal melakukan reset produksi.") };
  }
}
