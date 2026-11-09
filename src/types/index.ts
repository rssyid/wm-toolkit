export type ProjectStatus =
  | "Planned"
  | "In Progress"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export type ProjectType =
  | "Physical Work"
  | "Material Purchase"
  | "Combined";

export type ProcurementType =
  | "Tender"
  | "Swakelola"
  | "Purchase";

export type AFCEStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Need Revision";

export interface BOQItem {
  id: string;
  itemCode: string;
  name: string;
  volume: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  weight: number; // percentage
  status: "Draft" | "Approved" | "In Progress" | "Completed";
}

export interface WorkItem {
  id: string;
  projectId: string;
  name: string;
  type: "Physical" | "Material";
  weight: number; // percentage, sum = 100
  startDate: string;
  endDate: string;
  procurementType: ProcurementType;
  progressMode: "Daily" | "Weekly";
  progress: number; // 0 to 100
  status: ProjectStatus;
  notes?: string;
  phase: "Tender" | "Physical Execution" | "Supporting Materials";
}

export interface ScheduleRevision {
  id: string;
  revisionNumber: number;
  previousEndDate: string;
  newEndDate: string;
  extendedWeeks: number;
  reason: string;
  revisedAt: string;
  approvalDate?: string;
  approvedBy?: string;
  revisedBy: string;
  approvalStatus: "Approved" | "Pending Approval";
  attachmentName?: string;
}

export interface ScheduleGanttCell {
  type: "plan" | "revised" | "extended-revised" | "this-week-revised" | "empty";
  symbol?: "#" | "✓" | null;
  note?: string;
}

export interface ScheduleGanttTask {
  id: string;
  code: string; // e.g. "a", "b", "c"
  name: string;
  planStartDate: string; // "2026-08-01" or display formatted
  planEndDate: string; // "2026-08-07"
  status?: ProjectStatus;
  cells: Record<string, ScheduleGanttCell>; // key is week identifier e.g. "W1", "W2", or week index
}

export interface ScheduleGanttGroup {
  id: string;
  number: number; // 1, 2, 3
  title: string;
  tasks: ScheduleGanttTask[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  afceNumber: string;
  afceValue: number;
  afceStatus: AFCEStatus;
  sapDocNumber?: string;
  approvalStatus: string;
  locationId: string;
  locationName: string;
  locationIds?: string[];
  locationNames?: string[];
  regionId?: string;
  regionName?: string;
  companyId?: string;
  companyName?: string;
  blockId?: string;
  blockCode?: string;
  blockIds?: string[];
  blockCodes?: string[];
  projectCategoryId?: string;
  projectCategoryName?: string;
  projectType: ProjectType;
  procurementType: ProcurementType;
  status: ProjectStatus;
  progress: number; // overall calculated: sum(work item progress * weight / 100)
  baselineStartDate: string;
  baselineEndDate: string;
  targetEndDate: string;
  durationDays: number;
  scheduleVarianceDays: number; // positive = delayed
  ewsStatus: "Normal" | "Warning" | "Critical";
  lastUpdated: string;
  workItems: WorkItem[];
  revisions: ScheduleRevision[];
  surveyAndBoq: BOQItem[];
  scheduleMatrix?: ScheduleGanttGroup[];
  deletedAt?: string | null;
}

export type AFCEApprovalRole =
  | "Manager Estate"
  | "Manager Area"
  | "Head Office"
  | "Water Management"
  | "Estate Manager"
  | "General Estate Manager"
  | "Regional Head"
  | "Plantation Head"
  | "MCA"
  | "CFO"
  | "COO"
  | "Chairman"
  | string;

export interface AFCEApprovalLevelItem {
  id: string;
  level: number;
  code: string;
  label: string;
  isRequired: boolean;
  status: "Approved" | "Pending" | "Waiting" | "Rejected" | "Need Revision";
  approverName?: string;
  approverJabatan?: string;
  decidedAt?: string;
  note?: string;
  sapEvidenceUrl?: string;
  sapDocNumber?: string;
}

export interface AFCEApprovalRecord {
  id: string;
  afceNumber: string;
  matrixLevelId?: string;
  approverName: string;
  approverRole: AFCEApprovalRole;
  approverJabatan?: string;
  action: "Submit" | "Approve" | "Revise" | "Reject";
  timestamp: string;
  approvalDate?: string;
  note: string;
  previousStatus: AFCEStatus;
  newStatus: AFCEStatus;
  sapEvidenceUrl?: string;
  sapDocNumber?: string;
}

export interface AFCEDocument {
  id: string;
  afceNumber: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  value: number;
  status: AFCEStatus;
  currentLevel: number;
  requiredLevels: number;
  currentApproverRole: AFCEApprovalRole;
  submittedAt?: string;
  approvedAt?: string;
  sapDocNumber: string;
  sapScreenshotPlaceholder?: string;
  history: AFCEApprovalRecord[];
  approvalMatrixLevels?: AFCEApprovalLevelItem[];
  createdBy?: string;
  deletedAt?: string | null;
}

export type PRStatus = "Draft" | "Released" | "Closed" | "Cancelled";
export type PRType = "Material" | "Service";

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  projectId: string;
  projectCode: string;
  workItemId: string;
  workItemName: string;
  releaseDate: string;
  prType: PRType;
  description: string;
  status: PRStatus;
  linkedPoCount: number;
  sapPrNumber: string;
  attachmentName?: string;
  createdAt: string;
}

export type POStatus = "Draft" | "Released" | "Closed" | "Cancelled";
export type POItemStatus = "Ordered" | "Partially Received" | "Received" | "Cancelled";

export interface POMaterialItem {
  id: string;
  poId: string;
  materialName: string;
  sapMaterialCode: string;
  volume: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  receivedVolume: number;
  remainingVolume: number;
  status: POItemStatus;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  relatedPrId: string;
  relatedPrNumber: string;
  projectId: string;
  projectCode: string;
  workItemId: string;
  supplierId: string;
  supplierName: string;
  poDate: string;
  releaseDate: string;
  poValue: number;
  status: POStatus;
  items: POMaterialItem[];
  receiptProgressPercent: number; // calculated from items received vs total vol
  attachmentName?: string;
}

export interface GoodsReceipt {
  id: string;
  grNumber: string;
  poId: string;
  poNumber: string;
  receiptDate: string;
  itemId: string;
  materialName: string;
  receivedVolume: number;
  unit: string;
  notes: string;
  attachmentName?: string;
  recordedBy: string;
}

export type VendorEvaluationResult = "RECOMMENDED" | "NOT_RECOMMENDED";

export interface VendorEvaluation {
  id: string;
  prId: string;
  prNumber: string;
  projectId: string;
  supplierId: string;
  supplierName: string;
  evaluatorId?: string;
  evaluatorName: string;
  evaluatorJabatan?: string;
  evaluationDate: string;
  result: VendorEvaluationResult;
  notes: string;
  score?: number; // 0 - 100
  attachmentName?: string;
  createdAt: string;
}

export type GoodsHandoverStatus = "PENDING" | "COMPLETED";

export interface GoodsHandover {
  id: string;
  handoverNumber: string; // e.g. "BAST-2026-0015"
  poId: string;
  poNumber: string;
  projectId: string;
  supplierId?: string;
  supplierName: string;
  handoverDate: string;
  receiverName: string; // Pihak Penerima (Gudang Kebun / Estate PIC)
  receiverJabatan?: string;
  giverName: string;    // Pihak Penyerah (Supplier / Ekspedisi)
  giverCompany?: string;
  notes?: string;
  status: GoodsHandoverStatus;
  attachmentName?: string;
  createdAt: string;
}

// --- Jalur Pengadaan Jasa (USPK -> Evaluasi Teknis -> SPK) ---
export type USPKStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface USPKItem {
  id: string;
  afceId?: string;
  projectId: string;
  projectCode: string;
  workItemId?: string;
  workItemName?: string;
  uspkNumber: string;
  vendorName: string;
  vendorId?: string;
  scope: string;
  value: number;
  targetVolume?: number;
  unit?: string;
  startDate: string;
  endDate: string;
  status: USPKStatus;
  submittedAt?: string;
  decidedAt?: string;
  createdBy: string;
  attachmentName?: string;
  deletedAt?: string | null;
  createdAt: string;
}

export type TechnicalEvaluationResult = "RECOMMENDED" | "NOT_RECOMMENDED";

export interface TechnicalEvaluation {
  id: string;
  uspkId: string;
  uspkNumber: string;
  projectId: string;
  evaluatorId?: string;
  evaluatorName: string;
  evaluatorJabatan?: string;
  evaluationDate: string;
  result: TechnicalEvaluationResult;
  rekomendasi?: string;
  notes: string;
  score?: number; // 0 - 100
  attachmentName?: string;
  createdAt: string;
}

export type SPKStatus = "DRAFT" | "ACTIVE" | "CLOSED";

export interface SPKContract {
  id: string;
  uspkId: string;
  uspkNumber: string;
  projectId: string;
  projectCode: string;
  workItemId?: string;
  workItemName?: string;
  spkNumber: string;
  vendorName: string;
  vendorId?: string;
  value: number;
  targetVolume?: number;
  unit?: string;
  startDate: string;
  endDate: string;
  status: SPKStatus;
  releasedAt?: string;
  attachmentName?: string;
  notes?: string;
  createdBy: string;
  deletedAt?: string | null;
  createdAt: string;
}

export interface DailyProgressRecord {
  id: string;
  projectId: string;
  workItemId: string;
  workItemName: string;
  periodType?: "DAILY" | "WEEKLY";
  spkId?: string;
  spkNumber?: string;
  contractorName?: string;
  date: string;
  activity: string;
  targetVolume?: number;
  plannedVolume?: number;
  actualVolume?: number;
  remainingVolume?: number;
  cumulativeVolume?: number;
  unit?: string;
  progressPercent: number;
  manpower?: number;
  weather: "Cerah" | "Hujan" | "Berawan";
  notes: string;
  photoName?: string;
  photoUrl?: string;
  createdBy?: string;
  recordedAt: string;
}

export interface WeeklyProgressRecord {
  id: string;
  projectId: string;
  workItemId: string;
  workItemName: string;
  periodType?: "DAILY" | "WEEKLY";
  spkId?: string;
  spkNumber?: string;
  contractorName?: string;
  period: string; // e.g. "Minggu 4 (20 - 26 Okt 2026)"
  startDate: string;
  endDate: string;
  plannedProgress: number; // %
  actualProgress: number; // %
  variance: number; // actual - planned
  achievement: number; // (actual / planned) * 100
  notes: string;
  reportName?: string;
  photoUrl?: string;
  createdBy?: string;
  recordedAt: string;
}

// Master Data - Organization & Locations
export interface Region {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  updatedAt: string;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  npwp?: string;
  status: "Active" | "Inactive";
  updatedAt: string;
}

export interface EstateLocation {
  id: string;
  code: string;
  name: string;
  regionId: string;
  companyId: string;
  district: string;
  region?: string; // backward compat string
  hectares: number;
  status: "Active" | "Inactive";
  updatedAt: string;
}

export interface EstateBlock {
  id: string;
  estateId: string;
  code: string;
  name: string;
  afdeling: string;
  cropType: string;
  plantingYear: number;
  hectares: number;
  status: "Active" | "Inactive";
  updatedAt: string;
}

export interface MaterialCatalogItem {
  id: string;
  sapCode: string;
  name: string;
  category: string;
  unit: string;
  standardPrice: number;
  status: "Active" | "Inactive";
  updatedAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  npwp: string;
  rating: number; // 1-5
  status: "Active" | "Inactive";
  updatedAt: string;
}

export type SystemRole = "ADMIN" | "PIC" | "VIEWER";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: AFCEApprovalRole | "Estate Engineer" | "Procurement Officer";
  systemRole?: SystemRole;
  jabatan?: string;
  estateName?: string;
  status: "Active" | "Inactive";
  updatedAt: string;
}

// --- Approval Matrix Level types (separate from AFCEApprovalRole workflow) ---
export type ApprovalLevel =
  | "WM"       // Water Management
  | "EM"       // Estate Manager
  | "GEM"      // General Estate Manager
  | "RH"       // Regional Head
  | "PH"       // Plantation Head
  | "MCA"
  | "CFO"
  | "COO"
  | "Chairman";

export const APPROVAL_LEVEL_LABELS: Record<ApprovalLevel, string> = {
  WM: "Water Management",
  EM: "Estate Manager",
  GEM: "General Estate Manager",
  RH: "Regional Head",
  PH: "Plantation Head",
  MCA: "MCA",
  CFO: "CFO",
  COO: "COO",
  Chairman: "Chairman",
};

export const APPROVAL_LEVEL_ORDER: ApprovalLevel[] = [
  "WM", "EM", "GEM", "RH", "PH", "MCA", "CFO", "COO", "Chairman",
];

export interface ApprovalMatrixRule {
  id: string;
  tierName: string;
  minValue: number;
  maxValue: number;
  /** Array of 9 slots (index 0 = Level 1 WM … index 8 = Level 9 Chairman).
   *  null means that level is not required for this tier. */
  levels: (ApprovalLevel | null)[];
  active: boolean;
  updatedAt: string;
}

export interface ProjectCategoryItem {
  id: string;
  code: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  updatedAt: string;
}

export interface ProjectTypeItem {
  id: string;
  code: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  updatedAt: string;
}

export interface ProcurementTypeItem {
  id: string;
  code: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  updatedAt: string;
}

export type AttachmentSource = "GOOGLE_DRIVE_LINK" | "UPLOAD";

export interface ProjectAttachment {
  id: string;
  projectId: string;
  commentId?: string | null;
  source: AttachmentSource;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType?: string;
  category?: string;
  docNumber?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole?: string;
  userAvatar?: string;
  content: string;
  mentionedUserIds: string[];
  attachments?: ProjectAttachment[];
  createdAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: "AFCE SAP" | "PR SAP" | "PO SAP" | "Goods Receipt" | "SPK" | "BAST" | "Site Photo" | "Weekly Report";
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
  docNumber?: string;
}

// --- User Profile & System Configuration Settings ---
export interface UserProfile {
  fullName: string;
  email: string;
  username: string;
  role: AFCEApprovalRole | "Procurement Officer" | "Estate Engineer";
  systemRole: SystemRole;
  timeZone: "WIB" | "WITA" | "WIT";
  selectedLocation: string;
  bio: string;
}

export interface SystemSettings {
  // Tampilan & Format
  dateFormat: "id-formal" | "id-short" | "iso";
  currencyFormat: "compact" | "full";
  // Parameter Proyek
  workingDays: "5" | "6" | "7";
  defaultDurationUnit: "Hari" | "Minggu" | "Bulan";
  budgetAlertThreshold: number; // e.g. 90, 95, 100 (%)
  // Notifikasi & EWS
  notifAfce: boolean;
  notifPr: boolean;
  notifPo: boolean;
  notifGr: boolean;
  notifDelayed: boolean;
  deviationThreshold: string; // "3" | "7" | "14"
  emailDigest: "daily" | "weekly" | "critical-only" | "off";
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  fullName: "Budi Santoso, S.T.",
  email: "budi.santoso@perkebunan.co.id",
  username: "budisantoso",
  role: "Manager Estate",
  systemRole: "PIC",
  timeZone: "WIB",
  selectedLocation: "Kebun Sei Silau",
  bio: "Penanggung jawab operasional sipil, infrastruktur jalan kebun, tata air, dan sarana pemeliharaan aset di lingkungan Estate Sei Silau.",
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  dateFormat: "id-formal",
  currencyFormat: "compact",
  workingDays: "6",
  defaultDurationUnit: "Hari",
  budgetAlertThreshold: 95,
  notifAfce: true,
  notifPr: true,
  notifPo: true,
  notifGr: true,
  notifDelayed: true,
  deviationThreshold: "7",
  emailDigest: "weekly",
};

// Notification Types sesuai docs/DATA-MODEL.md & docs/PRD.md (F7)
export type NotificationType =
  | "LATE_PROJECT"
  | "PENDING_APPROVAL"
  | "NEW_TASK"
  | "DEADLINE_REMINDER";

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  priority?: "critical" | "warning" | "info" | "normal";
}

export interface NotificationSetting {
  id: string;
  userId: string;
  notificationType: NotificationType;
  isEnabled: boolean;
}

// ==========================================
// AUDIT LOG TYPES (docs/DATA-MODEL.md & docs/PRD.md F10)
// ==========================================
export type AuditLogAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "RELEASE"
  | "SUBMIT"
  | "CLOSE";

export type AuditEntityType =
  | "PROJECT"
  | "AFCE"
  | "PR"
  | "PO"
  | "GR"
  | "GOODS_HANDOVER"
  | "VENDOR_EVALUATION"
  | "USPK"
  | "TECHNICAL_EVALUATION"
  | "SPK"
  | "PROGRESS_LOG"
  | "SCHEDULE_REVISION";

export interface AuditLog {
  id: string; // UUID PK
  userId: string; // FK users
  userName: string;
  userRole?: string;
  userJabatan?: string;
  action: AuditLogAction;
  entityType: AuditEntityType;
  entityId: string;
  entityTitle?: string;
  projectId?: string;
  projectName?: string;
  beforeData: Record<string, any> | null;
  afterData: Record<string, any> | null;
  ipAddress: string;
  userAgent?: string;
  createdAt: string; // ISO 8601
  notes?: string;
}


