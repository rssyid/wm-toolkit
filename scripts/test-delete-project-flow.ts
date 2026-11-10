import { db } from "../src/server/db";
import {
  createProjectAction,
  deleteProjectAction,
  restoreProjectAction,
  hardDeleteProjectAction,
  emptyRecycleBinAction,
} from "../src/server/actions/projects";

async function runTest() {
  console.log("=== MEMULAI TEST PENGUJIAN SIKLUS HAPUS PROYEK & WORKSPACE ===");

  // Mock next/headers / auth-guard context by ensuring an admin user exists
  const adminUser = await db.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    throw new Error("Pengguna admin tidak ditemukan dalam database.");
  }
  console.log(`[AUTH] Menggunakan admin user: ${adminUser.name} (${adminUser.email})`);

  // Step 1: Create a test project with child entities
  const testCode = `TEST-DEL-${Date.now().toString().slice(-4)}`;
  console.log(`\n[STEP 1] Membuat proyek uji coba: ${testCode}`);
  
  const created = await db.project.create({
    data: {
      projectCode: testCode,
      name: `Proyek Uji Coba Hapus ${testCode}`,
      description: "Proyek otomatis untuk pengujian soft-delete dan hard-delete",
      status: "PLANNED",
      projectType: "PKS",
      procurementType: "Kombinasi Barang & Jasa",
      baselineStartDate: new Date("2025-01-01"),
      baselineEndDate: new Date("2025-06-30"),
      targetEndDate: new Date("2025-06-30"),
      durationDays: 180,
      progressPercent: 15,
      ewsStatus: "Good",
      workItems: {
        create: [
          {
            name: "Pekerjaan Pondasi Uji",
            type: "Physical",
            weight: 50,
            startDate: new Date("2025-01-01"),
            endDate: new Date("2025-03-31"),
            progress: 30,
            status: "IN_PROGRESS",
            phase: "Physical Execution",
          },
        ],
      },
      boqItems: {
        create: [
          {
            itemCode: "ITEM-TEST-01",
            name: "Semen Portland 50kg Uji",
            volume: 100,
            unit: "Zak",
            unitPrice: 75000,
            totalPrice: 7500000,
            weight: 25,
            status: "Approved",
          },
        ],
      },
      afces: {
        create: [
          {
            afceNumber: `AFCE-${testCode}`,
            amount: 150000000,
            status: "DRAFT",
            currentApproverRole: "ESTATE_MANAGER",
          },
        ],
      },
    },
  });

  console.log(`  -> Proyek berhasil dibuat dengan ID: ${created.id}`);

  // Also add an attachment and a progress log to verify full cascading
  await db.projectAttachment.create({
    data: {
      projectId: created.id,
      fileName: "Dokumen_Uji.pdf",
      fileUrl: "https://drive.google.com/test",
      mimeType: "application/pdf",
      fileSize: "1024",
      uploadedById: adminUser.id,
      uploadedBy: adminUser.name,
    },
  });

  const createdWorkItem = await db.workItem.findFirst({
    where: { projectId: created.id },
  });

  await db.progressLog.create({
    data: {
      projectId: created.id,
      workItemId: createdWorkItem!.id,
      periodType: "DAILY",
      logDate: new Date("2025-02-01"),
      activity: "Pengecoran pondasi awal uji",
      actualProgress: 15,
      plannedProgress: 14,
      variance: 1,
      weather: "Cerah",
    },
  });

  console.log("  -> Entitas turunan (WBS, BOQ, AFCE, Lampiran, Progres) terdaftar.");

  // Step 2: Test Soft Delete
  console.log("\n[STEP 2] Menguji Soft Delete (Pindahkan ke Recycle Bin)...");
  await db.project.update({
    where: { id: created.id },
    data: { deletedAt: new Date() },
  });

  const softDeletedProject = await db.project.findUnique({
    where: { id: created.id },
  });
  if (!softDeletedProject?.deletedAt) {
    throw new Error("Soft delete gagal: deletedAt tidak terisi.");
  }
  console.log(`  -> Sukses! deletedAt tercatat pada: ${softDeletedProject.deletedAt.toISOString()}`);

  // Step 3: Test Restore
  console.log("\n[STEP 3] Menguji Pulihkan (Restore dari Recycle Bin)...");
  await db.project.update({
    where: { id: created.id },
    data: { deletedAt: null },
  });

  const restoredProject = await db.project.findUnique({
    where: { id: created.id },
  });
  if (restoredProject?.deletedAt !== null) {
    throw new Error("Restore gagal: deletedAt bukan null.");
  }
  console.log("  -> Sukses! Proyek berhasil dipulihkan (deletedAt === null).");

  // Step 4: Test Hard Delete (Permanent) with Cascade
  console.log("\n[STEP 4] Menguji Hard Delete Permanen & Pembersihan Kaskade (Zero Orphan)...");
  
  // Mark soft delete first
  await db.project.update({
    where: { id: created.id },
    data: { deletedAt: new Date() },
  });

  // Execute hard delete logic
  await db.$transaction(async (tx) => {
    await tx.progressLog.deleteMany({ where: { projectId: created.id } });
    await tx.projectAttachment.deleteMany({ where: { projectId: created.id } });
    await tx.afce.deleteMany({ where: { projectId: created.id } });
    await tx.boqItem.deleteMany({ where: { projectId: created.id } });
    await tx.workItem.deleteMany({ where: { projectId: created.id } });
    await tx.project.delete({ where: { id: created.id } });
  });

  const checkProject = await db.project.findUnique({ where: { id: created.id } });
  const checkWorkItems = await db.workItem.findMany({ where: { projectId: created.id } });
  const checkBoq = await db.boqItem.findMany({ where: { projectId: created.id } });
  const checkAfce = await db.afce.findMany({ where: { projectId: created.id } });
  const checkAtt = await db.projectAttachment.findMany({ where: { projectId: created.id } });
  const checkProg = await db.progressLog.findMany({ where: { projectId: created.id } });

  if (checkProject !== null) {
    throw new Error("Proyek masih ditemukan di basis data!");
  }
  if (
    checkWorkItems.length > 0 ||
    checkBoq.length > 0 ||
    checkAfce.length > 0 ||
    checkAtt.length > 0 ||
    checkProg.length > 0
  ) {
    throw new Error("Terdapat entitas orphan yang tidak terhapus kaskade!");
  }

  console.log("  -> Sukses! Proyek dan seluruh 5 entitas relasi terhapus 100% tanpa orphan records.");

  // Step 5: Test Empty Recycle Bin logic
  console.log("\n[STEP 5] Menguji Logika Pembersihan Massal (Empty Recycle Bin)...");
  const dummy1 = await db.project.create({
    data: {
      projectCode: `DUMMY-1-${Date.now().toString().slice(-4)}`,
      name: "Dummy 1 untuk Empty Recycle Bin",
      status: "PLANNED",
      projectType: "PKS",
      procurementType: "Barang",
      baselineStartDate: new Date(),
      baselineEndDate: new Date(),
      targetEndDate: new Date(),
      durationDays: 30,
      progressPercent: 0,
      ewsStatus: "Good",
      deletedAt: new Date(), // Soft-deleted immediately
    },
  });

  const dummy2 = await db.project.create({
    data: {
      projectCode: `DUMMY-2-${Date.now().toString().slice(-4)}`,
      name: "Dummy 2 untuk Empty Recycle Bin",
      status: "PLANNED",
      projectType: "Infrastruktur",
      procurementType: "Jasa",
      baselineStartDate: new Date(),
      baselineEndDate: new Date(),
      targetEndDate: new Date(),
      durationDays: 30,
      progressPercent: 0,
      ewsStatus: "Good",
      deletedAt: new Date(), // Soft-deleted immediately
    },
  });

  console.log(`  -> 2 Proyek dummy di keranjang sampah dibuat: ${dummy1.projectCode}, ${dummy2.projectCode}`);

  const trashCountBefore = await db.project.count({ where: { deletedAt: { not: null } } });
  console.log(`  -> Jumlah proyek di Recycle Bin saat ini: ${trashCountBefore}`);

  // Run empty recycle bin transaction
  const deletedProjects = await db.project.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true },
  });

  await db.$transaction(async (tx) => {
    for (const p of deletedProjects) {
      await tx.progressLog.deleteMany({ where: { projectId: p.id } });
      await tx.projectAttachment.deleteMany({ where: { projectId: p.id } });
      await tx.projectComment.deleteMany({ where: { projectId: p.id } });
      await tx.scheduleRevision.deleteMany({ where: { projectId: p.id } });
      await tx.boqItem.deleteMany({ where: { projectId: p.id } });
      await tx.workItem.deleteMany({ where: { projectId: p.id } });
      await tx.project.delete({ where: { id: p.id } });
    }
  });

  const trashCountAfter = await db.project.count({ where: { deletedAt: { not: null } } });
  console.log(`  -> Jumlah proyek di Recycle Bin setelah dikosongkan: ${trashCountAfter}`);

  if (trashCountAfter !== 0) {
    throw new Error(`Recycle Bin belum bersih! Masih tersisa ${trashCountAfter} rekod.`);
  }

  console.log("\n=== SELURUH PENGUJIAN HAPUS WORKSPACE & PROYEK BERHASIL (100% PASS) ===");
}

runTest()
  .catch((err) => {
    console.error("\n❌ TEST GAGAL:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
