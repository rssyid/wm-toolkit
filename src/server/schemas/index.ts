import { z } from "zod";

// Project Schema
export const CreateProjectSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(3, "Kode proyek minimal 3 karakter"),
  name: z.string().min(5, "Nama proyek minimal 5 karakter"),
  description: z.string().optional(),
  picId: z.string().optional(),
  status: z.enum(["Planned", "In Progress", "On Hold", "Completed", "Cancelled"]).default("Planned"),
  projectType: z.string().default("Physical Work"),
  procurementType: z.string().default("Tender"),
  locationId: z.string().optional(),
  locationName: z.string().optional(),
  locationIds: z.array(z.string()).optional(),
  locationNames: z.array(z.string()).optional(),
  regionId: z.string().optional(),
  regionName: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  blockId: z.string().optional(),
  blockCode: z.string().optional(),
  blockIds: z.array(z.string()).optional(),
  blockCodes: z.array(z.string()).optional(),
  projectCategoryId: z.string().optional(),
  projectCategoryName: z.string().optional(),
  afceId: z.string().optional(),
  afceNumber: z.string().optional(),
  afceValue: z.number().optional(),
  afceStatus: z.string().optional(),
  sapDocNumber: z.string().optional(),
  baselineStartDate: z.string(),
  baselineEndDate: z.string(),
  targetEndDate: z.string(),
  durationDays: z.number().default(0),
  progress: z.number().min(0).max(100).default(0),
  ewsStatus: z.enum(["Normal", "Warning", "Critical"]).default("Normal"),
  workItems: z.array(z.any()).optional(),
  surveyAndBoq: z.array(z.any()).optional(),
  revisions: z.array(z.any()).optional(),
  scheduleMatrix: z.array(z.any()).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

// Schedule Revision Schema
export const ScheduleRevisionSchema = z.object({
  revisionNumber: z.number(),
  previousEndDate: z.string(),
  newEndDate: z.string(),
  extendedWeeks: z.number(),
  reason: z.string().min(5, "Alasan revisi jadwal wajib diisi"),
  revisedAt: z.string(),
  approvalDate: z.string().optional(),
  approvedBy: z.string().optional(),
  revisedBy: z.string(),
  approvalStatus: z.enum(["Approved", "Pending Approval"]).default("Approved"),
  attachmentName: z.string().optional(),
});

// AFCE Approval Action Schema
export const ProcessAfceActionSchema = z.object({
  afceId: z.string(),
  action: z.enum(["Approve", "Revise", "Reject", "Submit"]),
  note: z.string().default(""),
  approverName: z.string().min(2, "Nama approver wajib diisi"),
  approverRole: z.string(),
  approverJabatan: z.string().optional(),
  approvalDate: z.string().optional(),
  sapDocNumber: z.string().optional(),
  sapEvidenceUrl: z.string().optional(),
  targetLevelIndex: z.number().optional(),
});

// Purchase Requisition Schema
export const CreatePrSchema = z.object({
  prNumber: z.string().min(3, "Nomor PR wajib diisi"),
  projectId: z.string(),
  workItemId: z.string().optional(),
  releaseDate: z.string(),
  prType: z.enum(["Material", "Service"]).default("Material"),
  description: z.string(),
  status: z.enum(["Draft", "Released", "Closed", "Cancelled"]).default("Draft"),
  sapPrNumber: z.string().optional(),
  attachmentName: z.string().optional(),
});

// Vendor Evaluation Schema
export const CreateVendorEvaluationSchema = z.object({
  prId: z.string(),
  prNumber: z.string().optional(),
  projectId: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().min(2, "Nama rekanan wajib diisi"),
  evaluatorId: z.string().optional(),
  evaluatorName: z.string().min(2, "Nama evaluator wajib diisi"),
  evaluatorJabatan: z.string().optional(),
  evaluationDate: z.string(),
  result: z.enum(["RECOMMENDED", "NOT_RECOMMENDED"]),
  notes: z.string(),
  score: z.number().optional(),
  attachmentName: z.string().optional(),
});

// Purchase Order Schema
export const CreatePoSchema = z.object({
  poNumber: z.string().min(3, "Nomor PO wajib diisi"),
  relatedPrId: z.string().optional(),
  projectId: z.string(),
  workItemId: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().min(2, "Nama vendor wajib diisi"),
  poDate: z.string(),
  releaseDate: z.string().optional(),
  poValue: z.number().min(0, "Nilai PO harus positif"),
  status: z.enum(["Draft", "Released", "Closed", "Cancelled"]).default("Draft"),
  items: z.array(z.any()).default([]),
  attachmentName: z.string().optional(),
});

// Goods Receipt Schema
export const CreateGoodsReceiptSchema = z.object({
  grNumber: z.string().min(3, "Nomor GR wajib diisi"),
  poId: z.string(),
  itemId: z.string().optional(),
  materialName: z.string().min(2, "Nama material wajib diisi"),
  receiptDate: z.string(),
  receivedVolume: z.number().min(0, "Volume diterima minimal 0"),
  unit: z.string(),
  notes: z.string().optional(),
  attachmentName: z.string().optional(),
  recordedBy: z.string(),
});

// Goods Handover (BAST) Schema
export const CreateGoodsHandoverSchema = z.object({
  handoverNumber: z.string().min(3, "Nomor BAST wajib diisi"),
  poId: z.string(),
  projectId: z.string(),
  supplierId: z.string().optional(),
  supplierName: z.string(),
  handoverDate: z.string(),
  receiverName: z.string().min(2, "Pihak penerima wajib diisi"),
  receiverJabatan: z.string().optional(),
  giverName: z.string().min(2, "Pihak penyerah wajib diisi"),
  giverCompany: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED"]).default("COMPLETED"),
  attachmentName: z.string().optional(),
});

// USPK Schema
export const CreateUspkSchema = z.object({
  afceId: z.string().optional(),
  projectId: z.string(),
  workItemId: z.string().optional(),
  uspkNumber: z.string().min(3, "Nomor USPK wajib diisi"),
  vendorName: z.string().min(2, "Nama vendor wajib diisi"),
  vendorId: z.string().optional(),
  scope: z.string().min(5, "Uraian lingkup kerja wajib diisi"),
  value: z.number().min(0),
  targetVolume: z.number().optional(),
  unit: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).default("DRAFT"),
  attachmentName: z.string().optional(),
  createdBy: z.string(),
});

// Technical Evaluation Schema
export const CreateTechnicalEvaluationSchema = z.object({
  uspkId: z.string(),
  projectId: z.string().optional(),
  evaluatorId: z.string().optional(),
  evaluatorName: z.string().min(2, "Nama evaluator wajib diisi"),
  evaluatorJabatan: z.string().optional(),
  evaluationDate: z.string(),
  result: z.enum(["RECOMMENDED", "NOT_RECOMMENDED"]),
  rekomendasi: z.string().optional(),
  notes: z.string(),
  score: z.number().optional(),
  attachmentName: z.string().optional(),
});

// SPK Schema
export const CreateSpkSchema = z.object({
  uspkId: z.string(),
  projectId: z.string(),
  workItemId: z.string().optional(),
  spkNumber: z.string().min(3, "Nomor SPK wajib diisi"),
  vendorName: z.string(),
  vendorId: z.string().optional(),
  value: z.number().min(0),
  targetVolume: z.number().optional(),
  unit: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).default("DRAFT"),
  releasedAt: z.string().optional(),
  attachmentName: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

// Progress Logs Schema
export const CreateDailyProgressSchema = z.object({
  projectId: z.string(),
  workItemId: z.string(),
  spkId: z.string().optional(),
  date: z.string(),
  activity: z.string().min(3, "Uraian pekerjaan harian wajib diisi"),
  targetVolume: z.number().optional(),
  plannedVolume: z.number().optional(),
  actualVolume: z.number().optional(),
  remainingVolume: z.number().optional(),
  cumulativeVolume: z.number().optional(),
  unit: z.string().optional(),
  progressPercent: z.number().min(0).max(100),
  manpower: z.number().optional(),
  weather: z.enum(["Cerah", "Hujan", "Berawan"]).default("Cerah"),
  notes: z.string().default(""),
  photoName: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const CreateWeeklyProgressSchema = z.object({
  projectId: z.string(),
  workItemId: z.string(),
  spkId: z.string().optional(),
  period: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  plannedProgress: z.number(),
  actualProgress: z.number(),
  variance: z.number(),
  achievement: z.number(),
  notes: z.string().default(""),
  reportName: z.string().optional(),
});

// Master Data: Locations & Hierarchy Schemas
export const CreateRegionSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode wilayah minimal 2 karakter"),
  name: z.string().min(2, "Nama wilayah minimal 2 karakter"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateRegionSchema = CreateRegionSchema.partial();

export const CreateCompanySchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode perusahaan minimal 2 karakter"),
  name: z.string().min(2, "Nama perusahaan minimal 2 karakter"),
  npwp: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export const CreateEstateLocationSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode kebun minimal 2 karakter"),
  name: z.string().min(2, "Nama kebun minimal 2 karakter"),
  regionId: z.string().min(1, "Wilayah wajib dipilih"),
  companyId: z.string().min(1, "Perusahaan wajib dipilih"),
  district: z.string().min(1, "Kabupaten / distrik wajib diisi"),
  hectares: z.number().nonnegative("Luas hektar tidak boleh negatif").default(0),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateEstateLocationSchema = CreateEstateLocationSchema.partial();

export const CreateEstateBlockSchema = z.object({
  id: z.string().optional(),
  estateId: z.string().min(1, "Kebun induk wajib dipilih"),
  code: z.string().min(2, "Kode blok minimal 2 karakter"),
  name: z.string().min(2, "Nama blok minimal 2 karakter"),
  afdeling: z.string().min(1, "Afdeling wajib diisi"),
  cropType: z.string().default("Kelapa Sawit"),
  plantingYear: z.number().int().min(1900).max(2100).default(new Date().getFullYear()),
  hectares: z.number().nonnegative("Luas hektar tidak boleh negatif").default(0),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateEstateBlockSchema = CreateEstateBlockSchema.partial();

// Master Data: Material Catalog
export const CreateMaterialCatalogSchema = z.object({
  id: z.string().optional(),
  sapCode: z.string().min(2, "Kode material SAP minimal 2 karakter"),
  name: z.string().min(2, "Nama material minimal 2 karakter"),
  category: z.string().min(2, "Kategori material wajib diisi"),
  unit: z.string().min(1, "Satuan standar material wajib diisi"),
  standardPrice: z.number().nonnegative("Harga standar tidak boleh negatif").default(0),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateMaterialCatalogSchema = CreateMaterialCatalogSchema.partial();

// Master Data: Supplier / Rekanan
export const CreateSupplierSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode rekanan minimal 2 karakter"),
  name: z.string().min(2, "Nama rekanan minimal 2 karakter"),
  category: z.string().min(2, "Kategori bidang rekanan wajib diisi"),
  contactPerson: z.string().min(2, "Kontak personil wajib diisi"),
  phone: z.string().min(5, "Nomor telepon wajib diisi"),
  npwp: z.string().min(5, "NPWP rekanan wajib diisi"),
  rating: z.number().min(1).max(5).default(5),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

// Master Data: User / Pengguna
export const CreateUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama lengkap pengguna minimal 2 karakter"),
  email: z.string().email("Format alamat email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter").optional(),
  systemRole: z.enum(["ADMIN", "PIC", "APPROVER", "VIEWER"]).default("PIC"),
  role: z.enum(["ADMIN", "PIC", "APPROVER", "VIEWER"]).optional(),
  jabatan: z.string().optional().nullable().default("-"),
  estateName: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateUserSchema = CreateUserSchema.partial();

// Master Data: Approval Matrix Rule
export const CreateApprovalMatrixRuleSchema = z.object({
  id: z.string().optional(),
  tierName: z.string().min(2, "Nama tingkatan otorisasi wajib diisi"),
  minValue: z.number().nonnegative("Batas minimum tidak boleh negatif"),
  maxValue: z.number().positive("Batas maksimum harus lebih besar dari 0"),
  levels: z.array(z.any()).default([]),
  active: z.boolean().default(true),
});

export const UpdateApprovalMatrixRuleSchema = CreateApprovalMatrixRuleSchema.partial();

// Master Data: Project Category
export const CreateProjectCategorySchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode kategori minimal 2 karakter"),
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateProjectCategorySchema = CreateProjectCategorySchema.partial();

// Master Data: Project Type
export const CreateProjectTypeSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode tipe proyek minimal 2 karakter"),
  name: z.string().min(2, "Nama tipe proyek minimal 2 karakter"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateProjectTypeSchema = CreateProjectTypeSchema.partial();

// Master Data: Procurement Type
export const CreateProcurementTypeSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode metode pengadaan minimal 2 karakter"),
  name: z.string().min(2, "Nama metode pengadaan minimal 2 karakter"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateProcurementTypeSchema = CreateProcurementTypeSchema.partial();

// Notification Schema
export const CreateNotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  type: z.enum(["LATE_PROJECT", "PENDING_APPROVAL", "NEW_TASK", "DEADLINE_REMINDER", "SYSTEM"]),
  title: z.string().min(3, "Judul notifikasi wajib diisi"),
  message: z.string().min(3, "Isi pesan notifikasi wajib diisi"),
  priority: z.enum(["info", "warning", "critical"]).default("info"),
  linkUrl: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  projectCode: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
});

// User Profile Schema
export const UpdateUserProfileSchema = z.object({
  name: z.string().optional(),
  fullName: z.string().optional(),
  jabatan: z.string().optional(),
  role: z.string().optional(),
  estateName: z.string().optional().nullable(),
  selectedLocation: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  timeZone: z.string().optional(),
});


