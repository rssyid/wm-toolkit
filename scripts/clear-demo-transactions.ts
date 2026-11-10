import "dotenv/config";
import { db } from "../src/server/db";

async function clearDemoTransactions() {
  console.log("🧹 Memulai pembersihan data transaksi demo dari Neon PostgreSQL...\n");

  try {
    // Hapus data transaksi dengan urutan relasional yang aman
    const deletedProgress = await db.progressLog.deleteMany();
    console.log(`- Terhapus Progress Logs: ${deletedProgress.count}`);

    const deletedHandovers = await db.goodsHandover.deleteMany();
    console.log(`- Terhapus Goods Handovers (BAST): ${deletedHandovers.count}`);

    const deletedReceipts = await db.goodsReceipt.deleteMany();
    console.log(`- Terhapus Goods Receipts (GR): ${deletedReceipts.count}`);

    const deletedPoItems = await db.poItem.deleteMany();
    console.log(`- Terhapus PO Items: ${deletedPoItems.count}`);

    const deletedPos = await db.purchaseOrder.deleteMany();
    console.log(`- Terhapus Purchase Orders (PO): ${deletedPos.count}`);

    const deletedVendorEvals = await db.vendorEvaluation.deleteMany();
    console.log(`- Terhapus Evaluasi Vendor: ${deletedVendorEvals.count}`);

    const deletedPrs = await db.purchaseRequisition.deleteMany();
    console.log(`- Terhapus Purchase Requisitions (PR): ${deletedPrs.count}`);

    const deletedTechEvals = await db.technicalEvaluation.deleteMany();
    console.log(`- Terhapus Evaluasi Teknis: ${deletedTechEvals.count}`);

    const deletedSpks = await db.spk.deleteMany();
    console.log(`- Terhapus Kontrak SPK: ${deletedSpks.count}`);

    const deletedUspks = await db.uspk.deleteMany();
    console.log(`- Terhapus Usulan SPK (USPK): ${deletedUspks.count}`);

    const deletedApprovalRecords = await db.afceApprovalRecord.deleteMany();
    console.log(`- Terhapus AFCE Approval Records: ${deletedApprovalRecords.count}`);

    const deletedApprovalLevels = await db.afceApprovalLevel.deleteMany();
    console.log(`- Terhapus AFCE Approval Levels: ${deletedApprovalLevels.count}`);

    const deletedAfces = await db.afce.deleteMany();
    console.log(`- Terhapus Dokumen AFCE: ${deletedAfces.count}`);

    const deletedRevisions = await db.scheduleRevision.deleteMany();
    console.log(`- Terhapus Schedule Revisions: ${deletedRevisions.count}`);

    const deletedBoq = await db.boqItem.deleteMany();
    console.log(`- Terhapus BOQ Items: ${deletedBoq.count}`);

    const deletedWbs = await db.workItem.deleteMany();
    console.log(`- Terhapus Work Items (WBS): ${deletedWbs.count}`);

    const deletedAttachments = await db.projectAttachment.deleteMany();
    console.log(`- Terhapus Lampiran Dummy (Attachments): ${deletedAttachments.count}`);

    const deletedComments = await db.projectComment.deleteMany();
    console.log(`- Terhapus Komentar Diskusi: ${deletedComments.count}`);

    const deletedNotifs = await db.notification.deleteMany();
    console.log(`- Terhapus Notifikasi Demo: ${deletedNotifs.count}`);

    const deletedAudit = await db.auditLog.deleteMany();
    console.log(`- Terhapus Audit Logs Demo: ${deletedAudit.count}`);

    const deletedProjects = await db.project.deleteMany();
    console.log(`- Terhapus Proyek Demo: ${deletedProjects.count}\n`);

    // Verifikasi Master Data tetap aman
    const [userCount, regionCount, companyCount, locationCount, blockCount, matCount, supCount, ruleCount] =
      await Promise.all([
        db.user.count(),
        db.region.count(),
        db.company.count(),
        db.estateLocation.count(),
        db.estateBlock.count(),
        db.materialCatalogItem.count(),
        db.supplier.count(),
        db.approvalMatrixRule.count(),
      ]);

    console.log("✅ MASTER DATA PERUSAHAAN TETAP UTUH:");
    console.log(`   - Akun Pengguna Aktif: ${userCount}`);
    console.log(`   - Wilayah (Regions): ${regionCount}`);
    console.log(`   - Perusahaan (PT): ${companyCount}`);
    console.log(`   - Unit Kebun (Locations): ${locationCount}`);
    console.log(`   - Blok Sawit: ${blockCount}`);
    console.log(`   - Katalog Material SAP: ${matCount}`);
    console.log(`   - Supplier Rekanan: ${supCount}`);
    console.log(`   - Aturan Matriks Approval: ${ruleCount}`);

    console.log("\n🎉 BASIS DATA BERSIH 100%! SIAP UNTUK PENGISIAN DATA & DOKUMEN ASLI.");
  } catch (err: any) {
    console.error("Gagal membersihkan data transaksi demo:", err.message);
  } finally {
    process.exit(0);
  }
}

clearDemoTransactions();
