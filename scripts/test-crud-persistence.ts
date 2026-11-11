import "dotenv/config";
import { db } from "../src/server/db";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  restoreProjectAction,
  hardDeleteProjectAction,
  addWorkItemAction,
  updateWorkItemAction,
  deleteWorkItemAction,
  addBoqItemAction,
  deleteBoqItemAction,
} from "../src/server/actions/projects";
import {
  submitAfceApprovalAction,
  processAfceApprovalAction,
  syncAfceWithMatrixAction,
} from "../src/server/actions/afce";
import {
  createPrAction,
  recordVendorEvaluationAction,
  createPoAction,
  recordGoodsReceiptAction,
  recordGoodsHandoverAction,
} from "../src/server/actions/procurement";
import {
  createUspkAction,
  recordTechnicalEvaluationAction,
  createSpkAction,
} from "../src/server/actions/services";
import {
  addDailyProgressAction,
  addWeeklyProgressAction,
} from "../src/server/actions/progress";
import {
  addCommentAction,
  deleteCommentAction,
} from "../src/server/actions/comments";
import {
  addAttachmentAction,
  deleteAttachmentAction,
} from "../src/server/actions/attachments";
import {
  createNotificationAction,
  markNotificationAsReadAction,
} from "../src/server/actions/notifications";
import {
  addMasterDataMaterialAction,
  updateMasterDataMaterialAction,
  deleteMasterDataMaterialAction,
  addMasterDataSupplierAction,
  updateMasterDataSupplierAction,
  deleteMasterDataSupplierAction,
  addMasterDataProjectCategoryAction,
  updateMasterDataProjectCategoryAction,
  deleteMasterDataProjectCategoryAction,
  addMasterDataProjectTypeAction,
  updateMasterDataProjectTypeAction,
  deleteMasterDataProjectTypeAction,
  addMasterDataProcurementTypeAction,
  updateMasterDataProcurementTypeAction,
  deleteMasterDataProcurementTypeAction,
  addApprovalMatrixRuleAction,
  updateApprovalMatrixRuleAction,
  deleteApprovalMatrixRuleAction,
} from "../src/server/actions/master-data";

async function runTestSuite() {
  console.log("==================================================================");
  console.log("PENGUJIAN VALIDASI PERSISTENSI CRUD KE BASIS DATA POSTGRESQL (NEON)");
  console.log("==================================================================");

  // 1. Identifikasi Akun Admin
  const adminUser = await db.user.findFirst({
    where: { role: "ADMIN", isActive: true },
  });

  if (!adminUser) {
    throw new Error("Pengguna admin tidak ditemukan dalam database.");
  }

  process.env.TEST_AUTH_USER_ID = adminUser.id;
  console.log(`[AUTH] Terhubung sebagai: ${adminUser.name} (${adminUser.email})`);

  // Ambil lokasi kebun referensi
  let location = await db.estateLocation.findFirst();
  if (!location) {
    location = await db.estateLocation.create({
      data: {
        code: "LOC-TEST-01",
        name: "Kebun Percobaan Sei Silau",
        regionId: "REG-01",
        companyId: "CMP-01",
        district: "Asahan",
        hectares: 5000,
        status: "Active",
      },
    });
  }
  console.log(`[REF] Menggunakan kebun: ${location.name} (${location.code})`);

  // ==============================================================================
  // TAHAP 1: UJI MASTER DATA CRUD
  // ==============================================================================
  console.log("\n--- TAHAP 1: UJI MASTER DATA CRUD ---");

  // 1.1 Material Catalog
  const testMatCode = `SAP-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`[1.1] Membuat Material Catalog: ${testMatCode}`);
  const createdMat = await addMasterDataMaterialAction({
    sapCode: testMatCode,
    name: "Material Semen Portland Uji Persistensi",
    category: "Semen & Agregat",
    unit: "Zak",
    standardPrice: 85000,
    status: "Active",
  });
  const matId = createdMat.material.id;
  const dbMat = await db.materialCatalogItem.findUnique({ where: { id: matId } });
  if (!dbMat || dbMat.sapCode !== testMatCode) throw new Error("Gagal verifikasi Material di DB.");
  console.log(`[OK] Material tersimpan di DB: ID=${dbMat.id}, Harga=${dbMat.standardPrice}`);

  await updateMasterDataMaterialAction(matId, { standardPrice: 90000 });
  const dbMatUpdated = await db.materialCatalogItem.findUnique({ where: { id: matId } });
  if (Number(dbMatUpdated?.standardPrice) !== 90000) throw new Error("Gagal update Material di DB.");
  console.log(`[OK] Update Material terverifikasi: Harga Baru=${dbMatUpdated?.standardPrice}`);

  await deleteMasterDataMaterialAction(matId);
  const dbMatDeleted = await db.materialCatalogItem.findUnique({ where: { id: matId } });
  if (dbMatDeleted) throw new Error("Gagal hapus Material dari DB.");
  console.log("[OK] Material berhasil dihapus dari DB.");

  // 1.2 Rekanan / Supplier
  const testSupCode = `VND-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`\n[1.2] Membuat Rekanan: ${testSupCode}`);
  const createdSup = await addMasterDataSupplierAction({
    code: testSupCode,
    name: "PT Konstruksi Sawit Pratama Uji",
    category: "Kontraktor Sipil & Tata Air",
    contactPerson: "Ir. Hendra Gunawan",
    phone: "081234567890",
    npwp: "01.234.567.8-123.000",
    rating: 4.8,
    status: "Active",
  });
  const supId = createdSup.supplier.id;
  const dbSup = await db.supplier.findUnique({ where: { id: supId } });
  if (!dbSup || dbSup.code !== testSupCode) throw new Error("Gagal verifikasi Supplier di DB.");
  console.log(`[OK] Supplier tersimpan di DB: ID=${dbSup.id}, Nama=${dbSup.name}`);

  await updateMasterDataSupplierAction(supId, { rating: 5.0 });
  await deleteMasterDataSupplierAction(supId);
  const dbSupDeleted = await db.supplier.findUnique({ where: { id: supId } });
  if (dbSupDeleted) throw new Error("Gagal hapus Supplier dari DB.");
  console.log("[OK] Supplier berhasil diperbarui dan dihapus dari DB.");

  // 1.3 Kategori Proyek
  const testCatCode = `CAT-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`\n[1.3] Membuat Kategori Proyek: ${testCatCode}`);
  const createdCat = await addMasterDataProjectCategoryAction({
    code: testCatCode,
    name: "Kategori Pengujian Jembatan",
    description: "Kategori otomatis untuk pengujian CRUD",
    status: "Active",
  });
  const catId = createdCat.category.id;
  const dbCat = await db.projectCategoryItem.findUnique({ where: { id: catId } });
  if (!dbCat) throw new Error("Gagal verifikasi Kategori di DB.");
  console.log(`[OK] Kategori tersimpan di DB: ID=${dbCat.id}`);

  await deleteMasterDataProjectCategoryAction(catId);
  console.log("[OK] Kategori berhasil dihapus dari DB.");

  // 1.4 Tipe Proyek
  const testTypeCode = `PT-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`\n[1.4] Membuat Tipe Proyek: ${testTypeCode}`);
  const createdType = await addMasterDataProjectTypeAction({
    code: testTypeCode,
    name: "Pekerjaan Tata Kelola Air & Sipil",
    description: "Tipe proyek uji",
    status: "Active",
  });
  const typeId = createdType.projectType.id;
  const dbType = await db.projectTypeItem.findUnique({ where: { id: typeId } });
  if (!dbType) throw new Error("Gagal verifikasi Tipe Proyek di DB.");
  console.log(`[OK] Tipe Proyek tersimpan di DB: ID=${dbType.id}`);

  await deleteMasterDataProjectTypeAction(typeId);
  console.log("[OK] Tipe Proyek berhasil dihapus dari DB.");

  // 1.5 Tipe Pengadaan
  const testProcCode = `PROC-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`\n[1.5] Membuat Tipe Pengadaan: ${testProcCode}`);
  const createdProc = await addMasterDataProcurementTypeAction({
    code: testProcCode,
    name: "Pengadaan Tender Terpadu Uji",
    description: "Metode tender untuk pengujian persistensi",
    status: "Active",
  });
  const procId = createdProc.procurementType.id;
  const dbProc = await db.procurementTypeItem.findUnique({ where: { id: procId } });
  if (!dbProc) throw new Error("Gagal verifikasi Tipe Pengadaan di DB.");
  console.log(`[OK] Tipe Pengadaan tersimpan di DB: ID=${dbProc.id}`);

  await deleteMasterDataProcurementTypeAction(procId);
  console.log("[OK] Tipe Pengadaan berhasil dihapus dari DB.");

  // 1.6 Matriks Persetujuan SOP (Approval Matrix Rule)
  console.log("\n[1.6] Membuat Aturan Matriks Persetujuan Uji");
  const createdRule = await addApprovalMatrixRuleAction({
    tierName: "Tier Pengujian Batas Khusus",
    minValue: 100000000,
    maxValue: 250000000,
    levels: ["WM", "EM", null, null, null, null, null, null, null],
    active: true,
  });
  const ruleId = createdRule.rule.id;
  const dbRule = await db.approvalMatrixRule.findUnique({ where: { id: ruleId } });
  if (!dbRule) throw new Error("Gagal verifikasi Aturan Matriks di DB.");
  console.log(`[OK] Matriks Approval tersimpan di DB: ID=${dbRule.id}, Nama=${dbRule.tierName}`);

  await deleteApprovalMatrixRuleAction(ruleId);
  console.log("[OK] Aturan Matriks berhasil dihapus dari DB.");

  // ==============================================================================
  // TAHAP 2: UJI INISIASI PROYEK TRANSAKSIONAL LENGKAP
  // ==============================================================================
  console.log("\n--- TAHAP 2: UJI INISIASI PROYEK TRANSAKSIONAL ---");
  const testPrjCode = `PRJ-CRUD-${Date.now().toString().slice(-4)}`;
  const testPrjId = `prj-test-${Date.now()}`;
  const testAfceId = `afce-test-${Date.now()}`;
  const testAfceNum = `AFCE-2026-${Date.now().toString().slice(-4)}`;
  const testWorkItemId = `wbs-test-${Date.now()}`;

  let activeTestProjectId: string | null = null;
  try {
    activeTestProjectId = testPrjId;
    console.log(`Membuat Proyek Baru: ${testPrjCode} (ID: ${testPrjId})`);
    const projectResult = await createProjectAction({
      id: testPrjId,
      code: testPrjCode,
      name: `Proyek Uji Persistensi CRUD ${testPrjCode}`,
      description: "Pengujian end-to-end seluruh alur transaksi sistem perkebunan",
    locationId: location.id,
    locationName: location.name,
    projectType: "Physical Work",
    procurementType: "Kombinasi Barang & Jasa",
    afceId: testAfceId,
    afceNumber: testAfceNum,
    afceValue: 450000000,
    afceStatus: "Pending Approval",
    sapDocNumber: `SAP-DOC-${Date.now().toString().slice(-6)}`,
    baselineStartDate: "2026-03-01",
    baselineEndDate: "2026-06-30",
    targetEndDate: "2026-06-30",
    durationDays: 121,
    status: "Planned",
    workItems: [
      {
        id: testWorkItemId,
        name: "Pekerjaan Galian Saluran Primer",
        type: "Physical",
        weight: 60,
        startDate: "2026-03-01",
        endDate: "2026-04-30",
        progress: 0,
        status: "Planned",
        phase: "Mobilisasi",
      },
    ],
    surveyAndBoq: [
      {
        itemCode: "MAT-GLN-01",
        name: "Semen Portland 50kg",
        volume: 200,
        unit: "Zak",
        unitPrice: 85000,
        totalPrice: 17000000,
        weight: 20,
        status: "Approved",
      },
    ],
  });

  console.log(`[OK] Proyek berhasil diinisiasi via Server Action: ID=${projectResult.project.id}`);

  // Verifikasi di DB
  const dbProject = await db.project.findUnique({
    where: { id: testPrjId },
    include: {
      afces: {
        include: {
          approvalMatrixLevels: true,
          approvalRecords: true,
        },
      },
      workItems: true,
      boqItems: true,
    },
  });

  if (!dbProject) throw new Error("Proyek tidak ditemukan di PostgreSQL Neon!");
  if (dbProject.afces.length === 0) throw new Error("Dokumen AFCE gagal dibuat di PostgreSQL!");
  if (dbProject.workItems.length === 0) throw new Error("WorkItem (WBS) gagal dibuat di PostgreSQL!");
  if (dbProject.boqItems.length === 0) throw new Error("BoqItem gagal dibuat di PostgreSQL!");

  const activeAfce = dbProject.afces[0];
  console.log(`[OK] Verifikasi DB: AFCE=${activeAfce.afceNumber}, Nilai=Rp ${activeAfce.amount}`);
  console.log(`[OK] Verifikasi DB: Level Otorisasi=${activeAfce.approvalMatrixLevels.length} tier terdaftar`);
  console.log(`[OK] Verifikasi DB: Riwayat Histori Approval=${activeAfce.approvalRecords.length} record`);

  // ==============================================================================
  // TAHAP 3: UJI UPDATE PROYEK & WBS/BOQ
  // ==============================================================================
  console.log("\n--- TAHAP 3: UJI UPDATE PROYEK & WBS/BOQ ---");

  // Tambah WorkItem tambahan via Server Action
  const extraWorkItemRes = await addWorkItemAction(testPrjId, {
    name: "Pemasangan Pintu Klep Otomatis",
    type: "Physical",
    weight: 40,
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    progress: 0,
    status: "Planned",
    phase: "Konstruksi Sipil",
  });
  const extraWorkItemId = extraWorkItemRes.workItem.id;
  console.log(`[OK] WorkItem baru ditambahkan ke DB: ID=${extraWorkItemId}`);

  // Update WorkItem
  await updateWorkItemAction(extraWorkItemId, { progress: 25, status: "In Progress" });
  const dbUpdatedWorkItem = await db.workItem.findUnique({ where: { id: extraWorkItemId } });
  if (Number(dbUpdatedWorkItem?.progress) !== 25) throw new Error("Gagal update WorkItem di DB.");
  console.log(`[OK] WorkItem diperbarui: Progress=${dbUpdatedWorkItem?.progress}%`);

  // Tambah BOQ item
  const extraBoqRes = await addBoqItemAction(testPrjId, {
    itemCode: "PRECAST-BOX-01",
    name: "Precast Box Culvert 100x100",
    volume: 15,
    unit: "Unit",
    unitPrice: 3500000,
    totalPrice: 52500000,
    weight: 15,
    status: "Approved",
  });
  const extraBoqId = extraBoqRes.boqItem.id;
  console.log(`[OK] BOQ Item baru ditambahkan ke DB: ID=${extraBoqId}`);

  // ==============================================================================
  // TAHAP 4: UJI PROSES OTORISASI AFCE
  // ==============================================================================
  console.log("\n--- TAHAP 4: UJI SIKLUS PERSETUJUAN AFCE ---");
  const firstLevel = activeAfce.approvalMatrixLevels[0];

  // Submit Approval
  await submitAfceApprovalAction(activeAfce.id, "Pengajuan berkas otorisasi anggaran teknis kebun.");
  console.log(`[OK] AFCE diajukan (Submit Approval)`);

  // Approve Level 1
  await processAfceApprovalAction({
    afceId: activeAfce.id,
    action: "Approve",
    note: "Dokumen anggaran dan gambar teknis telah diverifikasi lengkap.",
    approverName: adminUser.name,
    approverRole: firstLevel ? (firstLevel.label || firstLevel.code) : "Water Management",
    sapDocNumber: "SAP-AFCE-APP-001",
    targetLevelIndex: 0,
  });

  const dbAfceAfterApprove = await db.afce.findUnique({
    where: { id: activeAfce.id },
    include: { approvalRecords: true, approvalMatrixLevels: true },
  });
  console.log(`[OK] AFCE disetujui: Record Histori=${dbAfceAfterApprove?.approvalRecords.length}`);

  // ==============================================================================
  // TAHAP 5: UJI PENGADAAN BARANG (PR -> EVALUASI VENDOR -> PO -> GR -> BAST)
  // ==============================================================================
  console.log("\n--- TAHAP 5: UJI JALUR PENGADAAN BARANG (PROCUREMENT) ---");

  // 5.1 Purchase Requisition (PR)
  const testPrNum = `PR-2026-${Date.now().toString().slice(-4)}`;
  console.log(`[5.1] Membuat Purchase Requisition: ${testPrNum}`);
  const createdPr = await createPrAction({
    prNumber: testPrNum,
    projectId: testPrjId,
    workItemId: testWorkItemId,
    releaseDate: "2026-03-05",
    prType: "Material",
    description: "Pengadaan material besi tulangan dan semen proyek tata air",
    status: "Released",
    sapPrNumber: `SAP-PR-${Date.now().toString().slice(-4)}`,
  });
  const dbPr = await db.purchaseRequisition.findUnique({ where: { id: createdPr.pr.id } });
  if (!dbPr) throw new Error("Gagal verifikasi PR di database!");
  console.log(`[OK] PR tersimpan di DB: ID=${dbPr.id}, Nomor=${dbPr.prNumber}`);

  // 5.2 Evaluasi Rekanan (Vendor Evaluation)
  console.log(`\n[5.2] Membuat Evaluasi Rekanan untuk PR: ${testPrNum}`);
  const createdVe = await recordVendorEvaluationAction({
    prId: dbPr.id,
    prNumber: testPrNum,
    projectId: testPrjId,
    supplierName: "PT Sumber Baja Semesta",
    evaluatorName: adminUser.name,
    evaluationDate: "2026-03-10",
    result: "RECOMMENDED",
    notes: "Pemenang tender penawaran terendah dan kualifikasi teknis lengkap",
    score: 93,
  });
  const dbVe = await db.vendorEvaluation.findUnique({ where: { id: createdVe.evaluation.id } });
  if (!dbVe) throw new Error("Gagal verifikasi Evaluasi Vendor di database!");
  console.log(`[OK] Evaluasi Vendor tersimpan di DB: ID=${dbVe.id}, Rekanan=${dbVe.supplierName}`);

  // 5.3 Purchase Order (PO)
  const testPoNum = `PO-2026-${Date.now().toString().slice(-4)}`;
  console.log(`\n[5.3] Membuat Purchase Order: ${testPoNum}`);
  const createdPo = await createPoAction({
    poNumber: testPoNum,
    relatedPrId: dbPr.id,
    projectId: testPrjId,
    workItemId: testWorkItemId,
    supplierName: "PT Sumber Baja Semesta",
    poDate: "2026-03-12",
    releaseDate: "2026-03-15",
    poValue: 72000000,
    status: "Released",
    items: [
      {
        materialName: "Besi Beton Polos 12mm",
        volume: 300,
        unit: "Batang",
        unitPrice: 110000,
        totalPrice: 33000000,
      },
    ],
  });
  const dbPo = await db.purchaseOrder.findUnique({ where: { id: createdPo.po.id } });
  if (!dbPo) throw new Error("Gagal verifikasi PO di database!");
  console.log(`[OK] PO tersimpan di DB: ID=${dbPo.id}, Nilai=Rp ${dbPo.poValue}`);

  // 5.4 Penerimaan Barang (Goods Receipt / GR)
  const testGrNum = `GR-2026-${Date.now().toString().slice(-4)}`;
  console.log(`\n[5.4] Mencatat Penerimaan Barang (GR) PO: ${testPoNum}`);
  const createdGr = await recordGoodsReceiptAction({
    grNumber: testGrNum,
    poId: dbPo.id,
    materialName: "Besi Beton Polos 12mm",
    receivedVolume: 300,
    unit: "Batang",
    receiptDate: "2026-03-26",
    notes: "Barang diterima lengkap dan sesuai spesifikasi teknis",
    recordedBy: adminUser.name,
  });
  const dbGr = await db.goodsReceipt.findUnique({ where: { id: createdGr.gr.id } });
  if (!dbGr) throw new Error("Gagal verifikasi Goods Receipt di database!");
  console.log(`[OK] GR tersimpan di DB: ID=${dbGr.id}, Volume Diterima=${dbGr.receivedVolume}`);

  // 5.5 Berita Acara Serah Terima Barang (Goods Handover / BAST)
  const testGhNum = `BAST-MAT-2026-${Date.now().toString().slice(-4)}`;
  console.log(`\n[5.5] Mencatat Berita Acara Serah Terima Barang: ${testGhNum}`);
  const createdGh = await recordGoodsHandoverAction({
    handoverNumber: testGhNum,
    poId: dbPo.id,
    projectId: testPrjId,
    supplierName: "PT Sumber Baja Semesta",
    handoverDate: "2026-03-27",
    receiverName: adminUser.name,
    receiverJabatan: "Estate Engineer",
    giverName: "Hendra Gunawan",
    giverCompany: "PT Sumber Baja Semesta",
    status: "COMPLETED",
    notes: "Serah terima material selesai 100% tanpa kerusakan",
  });
  const dbGh = await db.goodsHandover.findUnique({ where: { id: createdGh.handover.id } });
  if (!dbGh) throw new Error("Gagal verifikasi BAST Barang di database!");
  console.log(`[OK] BAST Barang tersimpan di DB: ID=${dbGh.id}, Nomor=${dbGh.handoverNumber}`);

  // ==============================================================================
  // TAHAP 6: UJI JALUR PENGADAAN JASA (USPK -> EVALUASI TEKNIS -> SPK KONTRAK)
  // ==============================================================================
  console.log("\n--- TAHAP 6: UJI JALUR PENGADAAN JASA (SERVICES) ---");

  // 6.1 Usulan Surat Perintah Kerja (USPK)
  const testUspkNum = `USPK-2026-${Date.now().toString().slice(-4)}`;
  console.log(`[6.1] Membuat USPK Jasa: ${testUspkNum}`);
  const createdUspk = await createUspkAction({
    projectId: testPrjId,
    workItemId: testWorkItemId,
    uspkNumber: testUspkNum,
    vendorName: "CV Rekayasa Bangun Sawit",
    scope: "Pekerjaan konstruksi pintu air dan perkuatan tebing sungai",
    value: 185000000,
    startDate: "2026-04-01",
    endDate: "2026-05-31",
    status: "APPROVED",
    createdBy: adminUser.name,
  });
  const dbUspk = await db.uspk.findUnique({ where: { id: createdUspk.uspk.id } });
  if (!dbUspk) throw new Error("Gagal verifikasi USPK di database!");
  console.log(`[OK] USPK tersimpan di DB: ID=${dbUspk.id}, Estimasi=Rp ${dbUspk.value}`);

  // 6.2 Evaluasi Teknis Vendor Jasa
  console.log(`\n[6.2] Membuat Evaluasi Teknis USPK: ${testUspkNum}`);
  const createdTe = await recordTechnicalEvaluationAction({
    uspkId: dbUspk.id,
    projectId: testPrjId,
    evaluatorName: adminUser.name,
    evaluatorJabatan: "Estate Engineer",
    evaluationDate: "2026-03-15",
    result: "RECOMMENDED",
    notes: "Kualifikasi alat berat excavator amfibi dan tenaga kerja berpengalaman",
    score: 92,
  });
  const dbTe = await db.technicalEvaluation.findUnique({ where: { id: createdTe.evaluation.id } });
  if (!dbTe) throw new Error("Gagal verifikasi Evaluasi Teknis di database!");
  console.log(`[OK] Evaluasi Teknis tersimpan di DB: ID=${dbTe.id}, Rekomendasi=${dbTe.result}`);

  // 6.3 SPK Kontrak Jasa (Surat Perintah Kerja)
  const testSpkNum = `SPK-2026-${Date.now().toString().slice(-4)}`;
  console.log(`\n[6.3] Menerbitkan SPK Kontrak Jasa: ${testSpkNum}`);
  const createdSpk = await createSpkAction({
    uspkId: dbUspk.id,
    projectId: testPrjId,
    workItemId: testWorkItemId,
    spkNumber: testSpkNum,
    vendorName: "CV Rekayasa Bangun Sawit",
    value: 180000000,
    startDate: "2026-04-01",
    endDate: "2026-05-31",
    status: "ACTIVE",
    notes: "Termin 1: 30%, Termin 2: 40%, Termin 3: 30% setelah BAST",
    createdBy: adminUser.name,
  });
  const dbSpk = await db.spk.findUnique({ where: { id: createdSpk.spk.id } });
  if (!dbSpk) throw new Error("Gagal verifikasi SPK di database!");
  console.log(`[OK] SPK Kontrak tersimpan di DB: ID=${dbSpk.id}, Nilai Kontrak=Rp ${dbSpk.value}`);

  // ==============================================================================
  // TAHAP 7: UJI LOG PROGRES FISIK (HARIAN & MINGGUAN)
  // ==============================================================================
  console.log("\n--- TAHAP 7: UJI PENCATATAN PROGRES FISIK (KURVA S & MONITORING) ---");

  // 7.1 Laporan Progres Harian
  console.log(`[7.1] Mencatat Laporan Progres Harian Proyek: ${testPrjCode}`);
  const createdDp = await addDailyProgressAction({
    projectId: testPrjId,
    workItemId: testWorkItemId,
    spkId: dbSpk.id,
    date: "2026-04-05",
    activity: "Galian tanah saluran primer sta 0+000 s/d 0+150 menggunakan excavator PC200",
    progressPercent: 5.5,
    manpower: 8,
    weather: "Cerah",
    notes: "Produktivitas harian tercapai melampaui target",
  });
  const dbDp = await db.progressLog.findUnique({ where: { id: createdDp.log.id } });
  if (!dbDp) throw new Error("Gagal verifikasi Progress Log Harian di database!");
  console.log(`[OK] Laporan Harian tersimpan di DB: ID=${dbDp.id}, Progres=${dbDp.actualProgress}%`);

  // 7.2 Laporan Progres Mingguan
  console.log(`\n[7.2] Mencatat Laporan Progres Mingguan Proyek: ${testPrjCode}`);
  const createdWp = await addWeeklyProgressAction({
    projectId: testPrjId,
    workItemId: testWorkItemId,
    spkId: dbSpk.id,
    period: "Minggu 1 (01 Apr - 07 Apr 2026)",
    startDate: "2026-04-01",
    endDate: "2026-04-07",
    plannedProgress: 8.0,
    actualProgress: 9.5,
    variance: 1.5,
    achievement: 118.75,
    notes: "Selesai mobilisasi alat berat dan penggalian 300 meter saluran primer",
  });
  const dbWp = await db.progressLog.findUnique({ where: { id: createdWp.log.id } });
  if (!dbWp) throw new Error("Gagal verifikasi Progress Log Mingguan di database!");
  console.log(`[OK] Laporan Mingguan tersimpan di DB: ID=${dbWp.id}, Deviasi=+${dbWp.variance}%`);

  // ==============================================================================
  // TAHAP 8: UJI KOMENTAR & LAMPIRAN DOKUMEN PROYEK
  // ==============================================================================
  console.log("\n--- TAHAP 8: UJI KOMENTAR & LAMPIRAN DOKUMEN PROYEK ---");

  // 8.1 Komentar Proyek
  console.log(`[8.1] Menambah Komentar Proyek: ${testPrjCode}`);
  const createdComm = await addCommentAction({
    projectId: testPrjId,
    content: "Material precast telah tiba di lokasi dan siap dipasang esok hari.",
  });
  const dbComm = await db.projectComment.findUnique({ where: { id: createdComm.comment.id } });
  if (!dbComm) throw new Error("Gagal verifikasi Komentar di database!");
  console.log(`[OK] Komentar tersimpan di DB: ID=${dbComm.id}`);

  await deleteCommentAction(createdComm.comment.id);
  const dbCommDeleted = await db.projectComment.findUnique({ where: { id: createdComm.comment.id } });
  if (dbCommDeleted) throw new Error("Gagal hapus komentar di database!");
  console.log("[OK] Komentar berhasil dihapus dari DB.");

  // 8.2 Lampiran Dokumen Proyek
  console.log(`\n[8.2] Menambah Lampiran Dokumen Proyek: ${testPrjCode}`);
  const createdAtt = await addAttachmentAction({
    projectId: testPrjId,
    source: "UPLOAD",
    fileName: "Gambar_Rencana_Pintu_Klep.dwg",
    fileUrl: "https://drive.google.com/file/d/test-sample-drawing",
    mimeType: "application/acad",
    fileSize: "4.0 MB",
    category: "Drawing / Gambar Kerja",
  });
  const dbAtt = await db.projectAttachment.findUnique({ where: { id: createdAtt.attachment!.id } });
  if (!dbAtt) throw new Error("Gagal verifikasi Lampiran Dokumen di database!");
  console.log(`[OK] Lampiran tersimpan di DB: ID=${dbAtt.id}, File=${dbAtt.fileName}`);

  await deleteAttachmentAction(createdAtt.attachment!.id);
  const dbAttDeleted = await db.projectAttachment.findUnique({ where: { id: createdAtt.attachment!.id } });
  if (dbAttDeleted) throw new Error("Gagal hapus lampiran di database!");
  console.log("[OK] Lampiran berhasil dihapus dari DB.");

  // ==============================================================================
  // TAHAP 9: UJI NOTIFIKASI SISTEM
  // ==============================================================================
  console.log("\n--- TAHAP 9: UJI NOTIFIKASI SISTEM ---");
  const testNotifId = `notif-test-${Date.now()}`;
  console.log(`[9.1] Membuat Notifikasi Pengujian`);
  const createdNotif = await createNotificationAction({
    id: testNotifId,
    title: "Otorisasi AFCE Diperlukan",
    message: `Dokumen AFCE ${testAfceNum} menunggu tanda tangan Anda di SAP.`,
    type: "PENDING_APPROVAL",
    priority: "info",
    projectId: testPrjId,
  });
  if (!createdNotif.notification) throw new Error("Gagal membuat notifikasi");
  const notifId = createdNotif.notification.id;
  const dbNotif = await db.notification.findUnique({ where: { id: notifId } });
  if (!dbNotif) throw new Error("Gagal verifikasi Notifikasi di database!");
  console.log(`[OK] Notifikasi tersimpan di DB: ID=${dbNotif.id}, Judul=${dbNotif.title}`);

  await markNotificationAsReadAction(notifId);
  const dbNotifRead = await db.notification.findUnique({ where: { id: notifId } });
  if (!dbNotifRead?.isRead) throw new Error("Gagal tandai notifikasi dibaca di DB!");
  console.log("[OK] Notifikasi berhasil diperbarui menjadi dibaca (isRead = true).");

  // Hapus notifikasi uji
  await db.notification.delete({ where: { id: notifId } });

  // ==============================================================================
  // TAHAP 10: UJI SOFT DELETE, RESTORE & HARD DELETE PEMBERSIHAN TOTAL
  // ==============================================================================
  console.log("\n--- TAHAP 10: UJI SOFT DELETE, RESTORE & HARD DELETE PROYEK ---");

  // 10.1 Soft Delete (Pindah ke Recycle Bin)
  console.log(`[10.1] Soft Delete Proyek: ${testPrjCode}`);
  await deleteProjectAction(testPrjId);
  const dbPrjSoft = await db.project.findUnique({ where: { id: testPrjId } });
  if (!dbPrjSoft?.deletedAt) throw new Error("Soft delete gagal: deletedAt tidak terisi.");
  console.log(`[OK] deletedAt berhasil tercatat pada: ${dbPrjSoft.deletedAt.toISOString()}`);

  // 10.2 Restore (Pulihkan dari Recycle Bin)
  console.log(`\n[10.2] Pulihkan Proyek (Restore): ${testPrjCode}`);
  await restoreProjectAction(testPrjId);
  const dbPrjRestored = await db.project.findUnique({ where: { id: testPrjId } });
  if (dbPrjRestored?.deletedAt !== null) throw new Error("Restore gagal: deletedAt tidak null.");
  console.log("[OK] Proyek berhasil dipulihkan (deletedAt === null).");

  // 10.3 Pembersihan Kaskade (Pembersihan Data Uji via Hard Delete Action)
  console.log(`\n[10.3] Membersihkan Data Uji via Hard Delete Permanen & Kaskade...`);
  const hardDelRes = await hardDeleteProjectAction(testPrjId);
  if (!hardDelRes.success) throw new Error("Hard delete proyek uji gagal.");

  const dbPrjCheck = await db.project.findUnique({ where: { id: testPrjId } });
  if (dbPrjCheck) throw new Error("Proyek uji masih tersisa di database!");
  console.log("[OK] Proyek uji dan seluruh relasi kaskade berhasil dibersihkan dari database!");

  console.log("\n==================================================================");
  console.log("SEMUA PENGUJIAN PERSISTENSI CRUD KE BASIS DATA BERHASIL 100%!");
  console.log("==================================================================");
  } finally {
    // Fail-safe cleanup: jika terjadi error di tahap tengah, bersihkan proyek uji
    if (activeTestProjectId) {
      const remainingProject = await db.project.findUnique({ where: { id: activeTestProjectId } });
      if (remainingProject) {
        console.log(`\n[FAIL-SAFE CLEANUP] Membersihkan residu proyek uji: ${activeTestProjectId}`);
        try {
          await hardDeleteProjectAction(activeTestProjectId);
        } catch {
          await db.$transaction(async (tx) => {
            await tx.progressLog.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.purchaseOrder.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.purchaseRequisition.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.spk.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.uspk.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.afce.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.projectAttachment.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.projectComment.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.workItem.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.boqItem.deleteMany({ where: { projectId: activeTestProjectId } });
            await tx.project.delete({ where: { id: activeTestProjectId } });
          });
        }
      }
      // Bersihkan juga audit log uji coba yang tercatat
      await db.auditLog.deleteMany({
        where: {
          OR: [
            { projectId: activeTestProjectId },
            { entityTitle: { contains: "PRJ-CRUD" } },
            { entityTitle: { contains: "Uji Persistensi" } },
            { notes: { contains: "PRJ-CRUD" } },
            { entityTitle: { contains: testAfceNum } },
            { notes: { contains: testAfceNum } },
          ],
        },
      });
    }
  }
}

runTestSuite()
  .catch((err) => {
    console.error("\nPENGUJIAN GAGAL DENGAN KESALAHAN:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
