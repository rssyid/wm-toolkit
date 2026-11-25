import { z } from "zod";

const APPROVAL_LEVEL_ENUM = z.enum([
  "WM",
  "EM",
  "GEM",
  "RH",
  "PH",
  "MCA",
  "CFO",
  "COO",
  "Chairman",
]);

export function isSafeHttpOrInternalUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith("/api/files/")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const WorkItemInputSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().optional(),
  name: z.string().min(2, "Nama item pekerjaan minimal 2 karakter"),
  type: z.enum(["Physical", "Material"]).default("Physical"),
  weight: z.number().min(0).max(100).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  procurementType: z.string().default("Tender"),
  progressMode: z.enum(["Daily", "Weekly"]).default("Daily"),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(["Planned", "In Progress", "On Hold", "Completed", "Cancelled"]).default("Planned"),
  phase: z.enum(["Tender", "Physical Execution", "Supporting Materials"]).default("Physical Execution"),
  notes: z.string().optional().nullable(),
});

export const UpdateWorkItemSchema = WorkItemInputSchema.partial();

export const BoqItemInputSchema = z.object({
  id: z.string().optional(),
  itemCode: z.string().min(1, "Kode item BOQ wajib diisi").default("ITEM-001"),
  name: z.string().min(2, "Nama item BOQ wajib diisi"),
  volume: z.number().nonnegative("Volume tidak boleh negatif"),
  unit: z.string().min(1, "Satuan wajib diisi").default("Unit"),
  unitPrice: z.number().nonnegative("Harga satuan tidak boleh negatif"),
  totalPrice: z.number().nonnegative("Total harga tidak boleh negatif"),
  weight: z.number().min(0).max(100).default(0),
  status: z.enum(["Draft", "Approved", "In Progress", "Completed"]).default("Draft"),
});

export const ScheduleMatrixCellSchema = z.object({
  type: z.enum(["plan", "revised", "extended-revised", "this-week-revised", "empty"]),
  symbol: z.enum(["#", "DONE", "\u2713"]).nullable().optional(),
  note: z.string().optional(),
  manual: z.boolean().optional(),
});

export const ScheduleMatrixTaskSchema = z.object({
  id: z.string(),
  workItemId: z.string().optional(),
  code: z.string(),
  name: z.string(),
  planStartDate: z.string(),
  planEndDate: z.string(),
  status: z.enum(["Planned", "In Progress", "On Hold", "Completed", "Cancelled"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  sourceHint: z.string().optional(),
  cells: z.record(z.string(), ScheduleMatrixCellSchema),
});

export const ScheduleMatrixGroupSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  tasks: z.array(ScheduleMatrixTaskSchema),
});

export const ScheduleRevisionSchema = z.object({
  revisionNumber: z.number(),
  previousEndDate: z.string(),
  newEndDate: z.string(),
  extendedWeeks: z.number(),
  reason: z.string().min(5, "Alasan revisi jadwal wajib diisi"),
  revisedAt: z.string(),
  approvalDate: z.string().optional(),
  approvedBy: z.string().optional(),
  revisedBy: z.string().min(2, "Nama pengaju revisi wajib diisi"),
  approvalStatus: z.enum(["Approved", "Pending Approval"]).default("Approved"),
  attachmentName: z.string().optional(),
});

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
  workItems: z.array(WorkItemInputSchema).optional(),
  surveyAndBoq: z.array(BoqItemInputSchema).optional(),
  revisions: z.array(ScheduleRevisionSchema).optional(),
  scheduleMatrix: z.array(ScheduleMatrixGroupSchema).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const ProcessAfceActionSchema = z.object({
  afceId: z.string().min(1),
  action: z.enum(["Approve", "Revise", "Reject", "Submit"]),
  note: z.string().default(""),
  approverName: z.string().min(2, "Nama penyetuju wajib diisi"),
  approverRole: z.string().min(1),
  approverJabatan: z.string().optional(),
  approvalDate: z.string().optional(),
  sapDocNumber: z.string().optional(),
  sapEvidenceUrl: z.string().optional(),
  targetLevelIndex: z.number().int().nonnegative().optional(),
});

export const SubmitAfceApprovalSchema = z.object({
  afceId: z.string().min(1),
  note: z.string().default(""),
  submissionDate: z.string().optional(),
});

export const UpdateAfceSchema = z.object({
  afceNumber: z.string().min(3, "Nomor AFCE minimal 3 karakter").optional(),
  value: z.number().positive("Nilai anggaran AFCE harus lebih dari 0").optional(),
  status: z.enum(["Draft", "Pending Approval", "Approved", "Rejected", "Need Revision"]).optional(),
  sapDocNumber: z.string().optional().nullable(),
  sapReference: z.string().optional().nullable(),
  sapScreenshotUrl: z.string().optional().nullable(),
  sapScreenshotPlaceholder: z.string().optional().nullable(),
});

export const SyncAfceMatrixSchema = z.object({
  afceId: z.string().min(1),
  matrixLevels: z
    .array(
      z.object({
        level: z.number().int().positive(),
        code: z.string().min(1),
        label: z.string().min(1),
        isRequired: z.boolean().default(true),
        status: z.enum(["Approved", "Pending", "Waiting", "Rejected", "Need Revision"]).default("Waiting"),
        approverName: z.string().optional().nullable(),
        approverJabatan: z.string().optional().nullable(),
        decidedAt: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
        sapDocNumber: z.string().optional().nullable(),
        sapEvidenceUrl: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const CreatePrSchema = z.object({
  prNumber: z.string().min(3, "Nomor PR wajib diisi"),
  projectId: z.string().min(1),
  workItemId: z.string().optional(),
  releaseDate: z.string().min(1, "Tanggal rilis wajib diisi"),
  prType: z.enum(["Material", "Service"]).default("Material"),
  description: z.string().min(3, "Uraian PR minimal 3 karakter"),
  status: z.enum(["Draft", "Released", "Closed", "Cancelled"]).default("Draft"),
  sapPrNumber: z.string().optional(),
  attachmentName: z.string().optional(),
});

export const CreateVendorEvaluationSchema = z.object({
  prId: z.string().min(1),
  prNumber: z.string().optional(),
  projectId: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().min(2, "Nama rekanan wajib diisi"),
  evaluatorId: z.string().optional(),
  evaluatorName: z.string().min(2, "Nama evaluator wajib diisi"),
  evaluatorJabatan: z.string().optional(),
  evaluationDate: z.string().min(1),
  result: z.enum(["RECOMMENDED", "NOT_RECOMMENDED"]),
  notes: z.string().min(3, "Catatan evaluasi minimal 3 karakter"),
  score: z.number().min(0).max(100).optional(),
  attachmentName: z.string().optional(),
});

export const PoItemInputSchema = z.object({
  materialName: z.string().min(1, "Nama material wajib diisi"),
  sapMaterialCode: z.string().optional(),
  volume: z.number().positive("Volume material harus lebih dari 0"),
  unit: z.string().min(1, "Satuan wajib diisi"),
  unitPrice: z.number().nonnegative("Harga satuan tidak boleh negatif"),
  totalPrice: z.number().nonnegative("Total harga tidak boleh negatif"),
  receivedVolume: z.number().nonnegative().default(0),
  remainingVolume: z.number().nonnegative().optional(),
  status: z.enum(["Ordered", "Partially Received", "Received", "Cancelled"]).default("Ordered"),
});

export const CreatePoSchema = z.object({
  poNumber: z.string().min(3, "Nomor PO wajib diisi"),
  relatedPrId: z.string().min(1, "PR referensi wajib dipilih"),
  projectId: z.string().min(1),
  workItemId: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().min(2, "Nama rekanan wajib diisi"),
  poDate: z.string().min(1),
  releaseDate: z.string().optional(),
  poValue: z.number().nonnegative("Nilai PO harus positif"),
  status: z.enum(["Draft", "Released", "Closed", "Cancelled"]).default("Draft"),
  items: z.array(PoItemInputSchema).min(1, "PO minimal memiliki 1 item material"),
  attachmentName: z.string().optional(),
});

export const CreateGoodsReceiptSchema = z.object({
  grNumber: z.string().min(3, "Nomor GR wajib diisi"),
  poId: z.string().min(1),
  itemId: z.string().optional(),
  materialName: z.string().min(2, "Nama material wajib diisi"),
  receiptDate: z.string().min(1),
  receivedVolume: z.number().positive("Volume diterima harus lebih dari 0"),
  unit: z.string().min(1),
  notes: z.string().optional(),
  attachmentName: z.string().optional(),
  recordedBy: z.string().min(2),
});

export const CreateGoodsHandoverSchema = z.object({
  handoverNumber: z.string().min(3, "Nomor BAST wajib diisi"),
  poId: z.string().min(1),
  projectId: z.string().min(1),
  supplierId: z.string().optional(),
  supplierName: z.string().min(2),
  handoverDate: z.string().min(1),
  receiverName: z.string().min(2, "Pihak penerima wajib diisi"),
  receiverJabatan: z.string().optional(),
  giverName: z.string().min(2, "Pihak penyerah wajib diisi"),
  giverCompany: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED"]).default("COMPLETED"),
  attachmentName: z.string().optional(),
});

export const CreateUspkSchema = z.object({
  afceId: z.string().optional(),
  projectId: z.string().min(1),
  workItemId: z.string().optional(),
  uspkNumber: z.string().min(3, "Nomor USPK wajib diisi"),
  vendorName: z.string().min(2, "Nama rekanan jasa wajib diisi"),
  vendorId: z.string().optional(),
  scope: z.string().min(5, "Uraian lingkup kerja wajib diisi"),
  value: z.number().nonnegative("Nilai USPK tidak boleh negatif"),
  targetVolume: z.number().positive("Target volume harus lebih dari 0").optional(),
  unit: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).default("DRAFT"),
  submittedAt: z.string().optional(),
  attachmentName: z.string().optional(),
  createdBy: z.string().optional(),
});

export const UpdateUspkStatusSchema = z.object({
  uspkId: z.string().min(1),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]),
  decidedAt: z.string().optional(),
});

export const CreateTechnicalEvaluationSchema = z.object({
  uspkId: z.string().min(1),
  projectId: z.string().optional(),
  evaluatorId: z.string().optional(),
  evaluatorName: z.string().min(2, "Nama evaluator wajib diisi"),
  evaluatorJabatan: z.string().optional(),
  evaluationDate: z.string().min(1),
  result: z.enum(["RECOMMENDED", "NOT_RECOMMENDED"]),
  rekomendasi: z.string().min(2, "Rekomendasi evaluasi wajib diisi").optional(),
  notes: z.string().min(3, "Catatan evaluasi minimal 3 karakter"),
  score: z.number().min(0).max(100).optional(),
  attachmentName: z.string().optional(),
});

export const CreateSpkSchema = z.object({
  uspkId: z.string().min(1),
  projectId: z.string().min(1),
  workItemId: z.string().optional(),
  spkNumber: z.string().min(3, "Nomor SPK wajib diisi"),
  vendorName: z.string().min(2),
  vendorId: z.string().optional(),
  value: z.number().nonnegative(),
  targetVolume: z.number().positive("Target volume harus lebih dari 0").optional(),
  unit: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).default("DRAFT"),
  releasedAt: z.string().optional(),
  attachmentName: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

export const UpdateSpkStatusSchema = z.object({
  spkId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
});

export const CreateDailyProgressSchema = z.object({
  projectId: z.string().min(1),
  workItemId: z.string().min(1),
  spkId: z.string().optional(),
  date: z.string().min(1),
  activity: z.string().min(3, "Uraian pekerjaan harian wajib diisi"),
  targetVolume: z.number().optional(),
  plannedVolume: z.number().optional(),
  actualVolume: z.number().optional(),
  remainingVolume: z.number().optional(),
  cumulativeVolume: z.number().optional(),
  unit: z.string().optional(),
  progressPercent: z.number().min(0).max(100),
  manpower: z.number().int().nonnegative().optional(),
  weather: z.enum(["Cerah", "Hujan", "Berawan"]).default("Cerah"),
  notes: z.string().default(""),
  photoName: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const CreateWeeklyProgressSchema = z.object({
  projectId: z.string().min(1),
  workItemId: z.string().min(1),
  spkId: z.string().optional(),
  period: z.string().min(2),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  plannedProgress: z.number().min(0).max(100),
  actualProgress: z.number().min(0).max(100),
  variance: z.number(),
  achievement: z.number().nonnegative(),
  notes: z.string().default(""),
  reportName: z.string().optional(),
});

export const AddAttachmentSchema = z.object({
  projectId: z.string().min(1),
  commentId: z.string().optional(),
  source: z.enum(["GOOGLE_DRIVE_LINK", "UPLOAD"]).default("UPLOAD"),
  fileName: z.string().min(1, "Nama berkas wajib diisi"),
  fileUrl: z
    .string()
    .min(1, "URL berkas wajib diisi")
    .refine(isSafeHttpOrInternalUrl, "URL berkas harus menggunakan protokol https:// yang valid."),
  fileSize: z.string().optional().default(""),
  mimeType: z.string().optional(),
  category: z.string().optional(),
  docNumber: z.string().optional(),
  googleDriveFileId: z.string().optional(),
});

export const AddCommentSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().trim().min(1, "Isi komentar tidak boleh kosong").max(5000),
  mentionedUserIds: z.array(z.string()).default([]),
  attachments: z.array(AddAttachmentSchema.omit({ projectId: true, commentId: true })).optional(),
});

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

export const CreateSupplierSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode rekanan minimal 2 karakter"),
  name: z.string().min(2, "Nama rekanan minimal 2 karakter"),
  category: z.string().min(2, "Kategori bidang rekanan wajib diisi"),
  contactPerson: z.string().min(2, "Nama narahubung wajib diisi"),
  phone: z.string().min(5, "Nomor telepon wajib diisi"),
  npwp: z.string().min(5, "NPWP rekanan wajib diisi"),
  rating: z.number().min(1).max(5).default(5),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

export const CreateUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama lengkap pengguna minimal 2 karakter"),
  email: z.string().email("Format alamat email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter").optional(),
  systemRole: z.enum(["ADMIN", "PIC", "APPROVER", "VIEWER"]).default("PIC"),
  role: z.enum(["ADMIN", "PIC", "APPROVER", "VIEWER"]).optional(),
  jabatan: z.string().optional().nullable().default("-"),
  estateName: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export const ApprovalMatrixRuleBaseSchema = z.object({
  id: z.string().optional(),
  tierName: z.string().min(2, "Nama tingkatan otorisasi wajib diisi"),
  minValue: z.number().nonnegative("Batas minimum tidak boleh negatif"),
  maxValue: z.number().positive("Batas maksimum harus lebih besar dari 0"),
  levels: z.array(APPROVAL_LEVEL_ENUM.nullable()).default([]),
  active: z.boolean().default(true),
});

export const CreateApprovalMatrixRuleSchema = ApprovalMatrixRuleBaseSchema.refine(
  (d) => d.maxValue >= d.minValue,
  {
    message: "Batas maksimum harus lebih besar atau sama dengan batas minimum",
    path: ["maxValue"],
  }
);

export const UpdateApprovalMatrixRuleSchema = ApprovalMatrixRuleBaseSchema.partial().refine(
  (d) => d.minValue === undefined || d.maxValue === undefined || d.maxValue >= d.minValue,
  {
    message: "Batas maksimum harus lebih besar atau sama dengan batas minimum",
    path: ["maxValue"],
  }
);

export const UpdateApprovalMatrixLevelsSchema = z.object({
  id: z.string().min(1),
  levels: z.array(APPROVAL_LEVEL_ENUM.nullable()),
});

export const CreateProjectCategorySchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode kategori minimal 2 karakter"),
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateProjectCategorySchema = CreateProjectCategorySchema.partial();

export const CreateProjectTypeSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode tipe proyek minimal 2 karakter"),
  name: z.string().min(2, "Nama tipe proyek minimal 2 karakter"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateProjectTypeSchema = CreateProjectTypeSchema.partial();

export const CreateProcurementTypeSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Kode metode pengadaan minimal 2 karakter"),
  name: z.string().min(2, "Nama metode pengadaan minimal 2 karakter"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const UpdateProcurementTypeSchema = CreateProcurementTypeSchema.partial();

export const CreateNotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  type: z.enum(["LATE_PROJECT", "PENDING_APPROVAL", "NEW_TASK", "DEADLINE_REMINDER", "SYSTEM"]),
  title: z.string().min(3, "Judul notifikasi wajib diisi"),
  message: z.string().min(3, "Isi pesan notifikasi wajib diisi"),
  priority: z.enum(["normal", "info", "warning", "critical"]).default("normal"),
  linkUrl: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  projectCode: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
});

export const UpdateNotificationSettingSchema = z.object({
  notificationType: z.enum(["LATE_PROJECT", "PENDING_APPROVAL", "NEW_TASK", "DEADLINE_REMINDER"]),
  isEnabled: z.boolean(),
});

export const UpdateUserProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").optional(),
  email: z.string().email("Format alamat email tidak valid").optional(),
  jabatan: z.string().optional(),
  role: z.string().optional(),
  estateName: z.string().optional().nullable(),
  selectedLocation: z.string().optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  timeZone: z.enum(["WIB", "WITA", "WIT"]).optional(),
  avatarUrl: z.string().optional().nullable(),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi kata sandi minimal 6 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok dengan kata sandi baru",
    path: ["confirmPassword"],
  });
