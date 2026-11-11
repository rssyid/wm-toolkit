"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
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

/**
 * 1. Seed Master Data: Memastikan seluruh master data (kebun, PT, blok, material, vendor, matriks approval, pengguna) terisi di basis data.
 */
export async function seedMasterDataAction() {
  const user = await requireRole(["ADMIN"]);

  try {
    const defaultPasswordHash = bcrypt.hashSync("wmtoolkit2026", 10);

    // 1. Regions
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

    // 2. Companies
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

    // 3. Locations
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

    // 4. Blocks
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

    // 5. Materials
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

    // 6. Suppliers
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

    // 7. Users
    for (const u of INITIAL_USERS) {
      const existing = await db.user.findFirst({
        where: { OR: [{ email: u.email }, { id: u.id }] },
      });
      if (existing) {
        await db.user.update({
          where: { id: existing.id },
          data: {
            name: u.name,
            role: u.systemRole as any,
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
            role: u.systemRole as any,
            jabatan: u.jabatan,
            estateName: u.estateName,
            isActive: u.status === "Active",
          },
        });
      }
    }

    // 8. Approval Matrix
    for (const rule of INITIAL_APPROVAL_MATRIX) {
      const existing = await db.approvalMatrixRule.findUnique({ where: { id: rule.id } });
      if (existing) {
        await db.approvalMatrixRule.update({
          where: { id: rule.id },
          data: {
            tierName: rule.tierName,
            minValue: rule.minValue,
            maxValue: rule.maxValue,
            levels: rule.levels as any,
            active: rule.active,
          },
        });
      } else {
        await db.approvalMatrixRule.create({
          data: {
            id: rule.id,
            tierName: rule.tierName,
            minValue: rule.minValue,
            maxValue: rule.maxValue,
            levels: rule.levels as any,
            active: rule.active,
          },
        });
      }
    }

    // 9. Categories, Types, Procurement Types
    for (const cat of INITIAL_PROJECT_CATEGORIES) {
      const existing = await db.projectCategoryItem.findFirst({
        where: { OR: [{ code: cat.code }, { id: cat.id }] },
      });
      if (existing) {
        await db.projectCategoryItem.update({
          where: { id: existing.id },
          data: { name: cat.name, description: cat.description, status: cat.status },
        });
      } else {
        await db.projectCategoryItem.create({
          data: { id: cat.id, code: cat.code, name: cat.name, description: cat.description, status: cat.status },
        });
      }
    }

    for (const pt of INITIAL_PROJECT_TYPES) {
      const existing = await db.projectTypeItem.findFirst({
        where: { OR: [{ code: pt.code }, { id: pt.id }] },
      });
      if (existing) {
        await db.projectTypeItem.update({
          where: { id: existing.id },
          data: { name: pt.name, description: pt.description, status: pt.status },
        });
      } else {
        await db.projectTypeItem.create({
          data: { id: pt.id, code: pt.code, name: pt.name, description: pt.description, status: pt.status },
        });
      }
    }

    for (const proc of INITIAL_PROCUREMENT_TYPES) {
      const existing = await db.procurementTypeItem.findFirst({
        where: { OR: [{ code: proc.code }, { id: proc.id }] },
      });
      if (existing) {
        await db.procurementTypeItem.update({
          where: { id: existing.id },
          data: { name: proc.name, description: proc.description, status: proc.status },
        });
      } else {
        await db.procurementTypeItem.create({
          data: { id: proc.id, code: proc.code, name: proc.name, description: proc.description, status: proc.status },
        });
      }
    }

    // 10. Notification Settings
    for (const setting of INITIAL_NOTIFICATION_SETTINGS) {
      await db.notificationSetting.upsert({
        where: {
          userId_notificationType: {
            userId: setting.userId || "usr-1",
            notificationType: setting.notificationType,
          },
        },
        update: { isEnabled: setting.isEnabled },
        create: {
          id: setting.id,
          userId: setting.userId || "usr-1",
          notificationType: setting.notificationType,
          isEnabled: setting.isEnabled,
        },
      });
    }

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "PROJECT",
      entityId: "master-data-seed",
      entityTitle: "Sinkronisasi Master Data",
      notes: `Admin ${user.name} melakukan sinkronisasi Master Data standar ke basis data`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/workspace");
    revalidatePath("/settings");
    revalidatePath("/notifications");
    revalidatePath("/master-data/locations");
    return { success: true, message: "Master Data berhasil disinkronkan ke Neon PostgreSQL!" };
  } catch (error: any) {
    console.error("Gagal sinkronisasi master data:", error);
    return { success: false, message: error.message || "Gagal sinkronisasi master data." };
  }
}

/**
 * 2. Clear Demo Data: Menghapus seluruh rekod transaksi demo (proyek, AFCE, PR, PO, GR, SPK, progres)
 * namun tetap mempertahankan master data dan akun pengguna.
 */
export async function clearDemoDataAction() {
  const user = await requireRole(["ADMIN"]);

  try {
    // Delete in reverse relational order
    await db.progressLog.deleteMany();
    await db.goodsHandover.deleteMany();
    await db.goodsReceipt.deleteMany();
    await db.poItem.deleteMany();
    await db.purchaseOrder.deleteMany();
    await db.vendorEvaluation.deleteMany();
    await db.purchaseRequisition.deleteMany();
    await db.technicalEvaluation.deleteMany();
    await db.spk.deleteMany();
    await db.uspk.deleteMany();
    await db.afceApprovalRecord.deleteMany();
    await db.afceApprovalLevel.deleteMany();
    await db.afce.deleteMany();
    await db.scheduleRevision.deleteMany();
    await db.boqItem.deleteMany();
    await db.workItem.deleteMany();
    await db.projectAttachment.deleteMany();
    await db.projectComment.deleteMany();
    await db.project.deleteMany();
    await db.notification.deleteMany();
    await db.auditLog.deleteMany();

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "PROJECT",
      entityId: "system-clear",
      entityTitle: "Pembersihan Data Transaksi Demo",
      notes: `Admin ${user.name} membersihkan seluruh rekod transaksi proyek demo`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/workspace");
    revalidatePath("/settings");
    revalidatePath("/notifications");
    return { success: true, message: "Seluruh data transaksi demo berhasil dibersihkan dari database!" };
  } catch (error: any) {
    console.error("Gagal membersihkan data demo:", error);
    return { success: false, message: error.message || "Gagal membersihkan data demo." };
  }
}

/**
 * 3. Reset to Empty Production Data: Mengosongkan seluruh data proyek dan audit log,
 * hanya menyisakan master data organisasi & akun Admin aktif.
 */
export async function resetToEmptyProductionAction() {
  const user = await requireRole(["ADMIN"]);

  try {
    // Clear all transactions
    await db.progressLog.deleteMany();
    await db.goodsHandover.deleteMany();
    await db.goodsReceipt.deleteMany();
    await db.poItem.deleteMany();
    await db.purchaseOrder.deleteMany();
    await db.vendorEvaluation.deleteMany();
    await db.purchaseRequisition.deleteMany();
    await db.technicalEvaluation.deleteMany();
    await db.spk.deleteMany();
    await db.uspk.deleteMany();
    await db.afceApprovalRecord.deleteMany();
    await db.afceApprovalLevel.deleteMany();
    await db.afce.deleteMany();
    await db.scheduleRevision.deleteMany();
    await db.boqItem.deleteMany();
    await db.workItem.deleteMany();
    await db.projectAttachment.deleteMany();
    await db.projectComment.deleteMany();
    await db.project.deleteMany();
    await db.notification.deleteMany();
    await db.auditLog.deleteMany();

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "PROJECT",
      entityId: "system-prod-reset",
      entityTitle: "Reset Basis Data Kosong Produksi",
      notes: `Admin ${user.name} melakukan reset basis data ke kondisi awal produksi bersih`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/workspace");
    revalidatePath("/settings");
    revalidatePath("/notifications");
    return {
      success: true,
      message: "Basis data berhasil direset ke kondisi produksi kosong. Siap untuk penginputan proyek riil!",
    };
  } catch (error: any) {
    console.error("Gagal melakukan reset produksi:", error);
    return { success: false, message: error.message || "Gagal melakukan reset produksi." };
  }
}
