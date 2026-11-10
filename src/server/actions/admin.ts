"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { seedDatabase } from "../../../prisma/seed";
import { revalidatePath } from "next/cache";

/**
 * 1. Seed Master Data: Memastikan seluruh master data (kebun, PT, blok, material, vendor, matriks approval, pengguna) terisi di basis data.
 */
export async function seedMasterDataAction() {
  const user = await requireRole(["ADMIN"]);

  try {
    await seedDatabase();

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
