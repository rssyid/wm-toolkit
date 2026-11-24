"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Project,
  AFCEDocument,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceipt,
  VendorEvaluation,
  GoodsHandover,
  USPKItem,
  TechnicalEvaluation,
  SPKContract,
  USPKStatus,
  SPKStatus,
  DailyProgressRecord,
  WeeklyProgressRecord,
  Region,
  Company,
  EstateLocation,
  EstateBlock,
  MaterialCatalogItem,
  Supplier,
  AppUser,
  ApprovalMatrixRule,
  ProjectCategoryItem,
  ProjectTypeItem,
  ProcurementTypeItem,
  ScheduleRevision,
  AFCEApprovalRole,
  AFCEStatus,
  AFCEApprovalLevelItem,
  ApprovalLevel,
  APPROVAL_LEVEL_LABELS,
  APPROVAL_LEVEL_ORDER,
  UserProfile,
  DEFAULT_USER_PROFILE,
  ProjectComment,
  ProjectAttachment,
  NotificationItem,
  NotificationSetting,
  NotificationType,
  AuditLog,
  SystemRole,
  WorkItem,
  BOQItem,
} from "@/types";
import {
  findMatchingApprovalTier,
  generateMatrixLevelsFromTier,
  getInitialApprovalStatus,
} from "@/lib/approval-matrix-utils";
import { getInitialAppStateAction } from "@/server/actions/initial-state";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  restoreProjectAction,
  hardDeleteProjectAction,
  emptyRecycleBinAction,
  reviseScheduleAction,
  addWorkItemAction,
  updateWorkItemAction,
  deleteWorkItemAction,
  addBoqItemAction,
  deleteBoqItemAction,
} from "@/server/actions/projects";
import {
  processAfceApprovalAction,
  submitAfceApprovalAction,
  updateAfceAction,
  syncAfceWithMatrixAction,
  softDeleteAfceAction,
  restoreAfceAction,
} from "@/server/actions/afce";
import {
  createPrAction,
  softDeletePrAction,
  restorePrAction,
  recordVendorEvaluationAction,
  createPoAction,
  softDeletePoAction,
  restorePoAction,
  recordGoodsReceiptAction,
  recordGoodsHandoverAction,
} from "@/server/actions/procurement";
import {
  createUspkAction,
  updateUspkStatusAction,
  softDeleteUspkAction,
  restoreUspkAction,
  recordTechnicalEvaluationAction,
  createSpkAction,
  updateSpkStatusAction,
  softDeleteSpkAction,
  restoreSpkAction,
} from "@/server/actions/services";
import {
  addDailyProgressAction,
  addWeeklyProgressAction,
} from "@/server/actions/progress";
import {
  addCommentAction,
  deleteCommentAction,
} from "@/server/actions/comments";
import {
  addAttachmentAction,
  deleteAttachmentAction,
} from "@/server/actions/attachments";
import {
  clearDemoDataAction,
  resetToEmptyProductionAction,
} from "@/server/actions/admin";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  clearAllNotificationsAction,
  updateNotificationSettingAction,
  createNotificationAction,
} from "@/server/actions/notifications";
import {
  addMasterDataLocationAction,
  updateMasterDataLocationAction,
  deleteMasterDataLocationAction,
  addMasterDataCompanyAction,
  updateMasterDataCompanyAction,
  deleteMasterDataCompanyAction,
  addMasterDataRegionAction,
  updateMasterDataRegionAction,
  deleteMasterDataRegionAction,
  addMasterDataBlockAction,
  updateMasterDataBlockAction,
  deleteMasterDataBlockAction,
  addMasterDataMaterialAction,
  updateMasterDataMaterialAction,
  deleteMasterDataMaterialAction,
  addMasterDataSupplierAction,
  updateMasterDataSupplierAction,
  deleteMasterDataSupplierAction,
  addMasterDataUserAction,
  updateMasterDataUserAction,
  deleteMasterDataUserAction,
  updateApprovalMatrixAction,
  addApprovalMatrixRuleAction,
  updateApprovalMatrixRuleAction,
  deleteApprovalMatrixRuleAction,
  addMasterDataProjectCategoryAction,
  updateMasterDataProjectCategoryAction,
  deleteMasterDataProjectCategoryAction,
  addMasterDataProjectTypeAction,
  updateMasterDataProjectTypeAction,
  deleteMasterDataProjectTypeAction,
  addMasterDataProcurementTypeAction,
  updateMasterDataProcurementTypeAction,
  deleteMasterDataProcurementTypeAction,
} from "@/server/actions/master-data";
import { updateCurrentUserProfileAction } from "@/server/actions/users";

export interface WorkItemInput {
  id?: string;
  name: string;
  type: "Physical" | "Material";
  weight: number;
  startDate?: string;
  endDate?: string;
  procurementType: string;
  progressMode: "Daily" | "Weekly";
  progress?: number;
  status?: WorkItem["status"];
  phase: "Tender" | "Physical Execution" | "Supporting Materials";
  notes?: string | null;
}

export interface BoqItemInput {
  id?: string;
  itemCode: string;
  name: string;
  volume: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  weight?: number;
  status?: BOQItem["status"];
}

interface AppStateContextType {
  isLoading: boolean;
  loadError: string | null;
  activeUserId: string | null;

  projects: Project[];
  afces: AFCEDocument[];
  prs: PurchaseRequisition[];
  pos: PurchaseOrder[];
  grs: GoodsReceipt[];
  vendorEvaluations: VendorEvaluation[];
  goodsHandovers: GoodsHandover[];
  uspks: USPKItem[];
  technicalEvaluations: TechnicalEvaluation[];
  spkContracts: SPKContract[];
  comments: ProjectComment[];
  attachments: ProjectAttachment[];
  notifications: NotificationItem[];
  notificationSettings: NotificationSetting[];
  unreadNotificationCount: number;
  auditLogs: AuditLog[];
  dailyProgress: DailyProgressRecord[];
  weeklyProgress: WeeklyProgressRecord[];
  regions: Region[];
  companies: Company[];
  locations: EstateLocation[];
  blocks: EstateBlock[];
  materials: MaterialCatalogItem[];
  suppliers: Supplier[];
  users: AppUser[];
  approvalMatrix: ApprovalMatrixRule[];
  projectCategories: ProjectCategoryItem[];
  projectTypes: ProjectTypeItem[];
  procurementTypes: ProcurementTypeItem[];
  tableDensity: "comfortable" | "compact";
  setTableDensity: (density: "comfortable" | "compact") => void;

  // Profil pengguna aktif
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<boolean>;

  // Peran & Hak Akses
  activeRole: SystemRole;
  isAdmin: boolean;
  isPic: boolean;
  isApprover: boolean;
  isViewer: boolean;
  canEditProjects: boolean;
  canApproveAfce: boolean;
  canManageSystem: boolean;
  isViewerOnly: boolean;

  // Proyek, WBS, BOQ & Revisi Jadwal
  addProject: (projectData: Partial<Project> & { sapDocNumber?: string }) => Promise<string | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  restoreProject: (projectId: string) => Promise<boolean>;
  hardDeleteProject: (projectId: string) => Promise<boolean>;
  emptyRecycleBin: () => Promise<boolean>;
  reviseProjectSchedule: (projectId: string, revision: Omit<ScheduleRevision, "id">) => Promise<boolean>;
  addWorkItem: (projectId: string, data: WorkItemInput) => Promise<boolean>;
  updateWorkItem: (workItemId: string, projectId: string, updates: Partial<WorkItemInput>) => Promise<boolean>;
  deleteWorkItem: (workItemId: string, projectId: string) => Promise<boolean>;
  addBoqItem: (projectId: string, data: BoqItemInput) => Promise<boolean>;
  deleteBoqItem: (boqItemId: string, projectId: string) => Promise<boolean>;

  // AFCE
  updateAfceDocument: (afceId: string, updates: Partial<AFCEDocument>) => Promise<boolean>;
  syncAfceWithMatrix: (afceId: string) => Promise<boolean>;
  submitAfceApproval: (afceId: string, note: string, submissionDate?: string) => Promise<boolean>;
  processAfceAction: (
    afceId: string,
    action: "Approve" | "Revise" | "Reject",
    note: string,
    approverName: string,
    approverRole: AFCEApprovalRole,
    approvalDate?: string,
    sapDocNumber?: string,
    sapEvidenceUrl?: string,
    targetLevelIndex?: number
  ) => Promise<boolean>;
  softDeleteAfce: (afceId: string) => Promise<boolean>;
  restoreAfce: (afceId: string) => Promise<boolean>;

  // Pengadaan Barang
  createPr: (prData: Omit<PurchaseRequisition, "id" | "createdAt">) => Promise<boolean>;
  softDeletePr: (prId: string) => Promise<boolean>;
  restorePr: (prId: string) => Promise<boolean>;
  recordVendorEvaluation: (evaluationData: Omit<VendorEvaluation, "id" | "createdAt">) => Promise<boolean>;
  createPo: (poData: Omit<PurchaseOrder, "id" | "receiptProgressPercent">) => Promise<boolean>;
  softDeletePo: (poId: string) => Promise<boolean>;
  restorePo: (poId: string) => Promise<boolean>;
  recordGoodsReceipt: (grData: Omit<GoodsReceipt, "id">) => Promise<boolean>;
  recordGoodsHandover: (handoverData: Omit<GoodsHandover, "id" | "createdAt">) => Promise<boolean>;

  // Pengadaan Jasa
  createUspk: (data: Omit<USPKItem, "id" | "createdAt">) => Promise<boolean>;
  updateUspkStatus: (id: string, status: USPKStatus, decidedAt?: string) => Promise<boolean>;
  softDeleteUspk: (uspkId: string) => Promise<boolean>;
  restoreUspk: (uspkId: string) => Promise<boolean>;
  recordTechnicalEvaluation: (data: Omit<TechnicalEvaluation, "id" | "createdAt">) => Promise<boolean>;
  createSpkContract: (data: Omit<SPKContract, "id" | "createdAt">) => Promise<boolean>;
  updateSpkStatus: (id: string, status: SPKStatus) => Promise<boolean>;
  softDeleteSpk: (spkId: string) => Promise<boolean>;
  restoreSpk: (spkId: string) => Promise<boolean>;

  // Progres
  getSpkProgressSummary: (spkId: string) => {
    spk?: SPKContract;
    targetVolume: number;
    realizedVolume: number;
    remainingVolume: number;
    percentComplete: number;
    unit: string;
  };
  addDailyProgress: (record: Omit<DailyProgressRecord, "id" | "recordedAt">) => Promise<boolean>;
  addWeeklyProgress: (record: Omit<WeeklyProgressRecord, "id" | "recordedAt">) => Promise<boolean>;

  // Diskusi & Lampiran
  addComment: (
    projectId: string,
    content: string,
    mentionedUserIds: string[],
    newAttachments?: ProjectAttachment[]
  ) => Promise<ProjectComment | null>;
  deleteComment: (commentId: string) => Promise<boolean>;
  addAttachment: (
    attachmentData: Omit<ProjectAttachment, "id" | "uploadedAt">
  ) => Promise<ProjectAttachment | null>;
  deleteAttachment: (attachmentId: string) => Promise<boolean>;

  // Notifikasi & Pengingat
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (
    item: Omit<NotificationItem, "id" | "createdAt">
  ) => Promise<NotificationItem | null>;
  updateNotificationSetting: (
    type: NotificationType,
    isEnabled: boolean
  ) => Promise<void>;
  runCronDeadlineCheck: () => Promise<{
    success: boolean;
    generatedCount: number;
    message: string;
  }>;

  // Master Data
  addMasterDataRegion: (reg: Omit<Region, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataRegion: (id: string, reg: Partial<Region>) => Promise<boolean>;
  deleteMasterDataRegion: (id: string) => Promise<boolean>;
  addMasterDataCompany: (cmp: Omit<Company, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataCompany: (id: string, cmp: Partial<Company>) => Promise<boolean>;
  deleteMasterDataCompany: (id: string) => Promise<boolean>;
  addMasterDataLocation: (loc: Omit<EstateLocation, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataLocation: (id: string, loc: Partial<EstateLocation>) => Promise<boolean>;
  deleteMasterDataLocation: (id: string) => Promise<boolean>;
  addMasterDataBlock: (blk: Omit<EstateBlock, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataBlock: (id: string, blk: Partial<EstateBlock>) => Promise<boolean>;
  deleteMasterDataBlock: (id: string) => Promise<boolean>;
  addMasterDataMaterial: (mat: Omit<MaterialCatalogItem, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataMaterial: (id: string, mat: Partial<MaterialCatalogItem>) => Promise<boolean>;
  deleteMasterDataMaterial: (id: string) => Promise<boolean>;
  addMasterDataSupplier: (sup: Omit<Supplier, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataSupplier: (id: string, sup: Partial<Supplier>) => Promise<boolean>;
  deleteMasterDataSupplier: (id: string) => Promise<boolean>;
  addMasterDataUser: (user: Omit<AppUser, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataUser: (id: string, user: Partial<AppUser>) => Promise<boolean>;
  deleteMasterDataUser: (id: string) => Promise<boolean>;
  addApprovalMatrixRule: (rule: Omit<ApprovalMatrixRule, "id" | "updatedAt">) => Promise<boolean>;
  updateApprovalMatrixRule: (id: string, rule: Partial<ApprovalMatrixRule>) => Promise<boolean>;
  deleteApprovalMatrixRule: (id: string) => Promise<boolean>;
  toggleApprovalLevel: (tierId: string, levelIndex: number) => Promise<boolean>;
  addMasterDataProjectCategory: (item: Omit<ProjectCategoryItem, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataProjectCategory: (id: string, item: Partial<ProjectCategoryItem>) => Promise<boolean>;
  deleteMasterDataProjectCategory: (id: string) => Promise<boolean>;
  addMasterDataProjectType: (item: Omit<ProjectTypeItem, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataProjectType: (id: string, item: Partial<ProjectTypeItem>) => Promise<boolean>;
  deleteMasterDataProjectType: (id: string) => Promise<boolean>;
  addMasterDataProcurementType: (item: Omit<ProcurementTypeItem, "id" | "updatedAt">) => Promise<boolean>;
  updateMasterDataProcurementType: (id: string, item: Partial<ProcurementTypeItem>) => Promise<boolean>;
  deleteMasterDataProcurementType: (id: string) => Promise<boolean>;

  // Pemeliharaan & Sinkronisasi
  refreshFromDatabase: () => Promise<void>;
  clearDemoData: () => Promise<boolean>;
  resetToEmptyProduction: (confirmationText?: string) => Promise<boolean>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

const STORAGE_KEY = "wm_toolkit_prefs_v2";

function formatErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasBootstrappedRef = useRef(false);

  const [tableDensity, setTableDensity] = useState<"comfortable" | "compact">("comfortable");

  const [projects, setProjects] = useState<Project[]>([]);
  const [afces, setAfces] = useState<AFCEDocument[]>([]);
  const [prs, setPrs] = useState<PurchaseRequisition[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [grs, setGrs] = useState<GoodsReceipt[]>([]);
  const [vendorEvaluations, setVendorEvaluations] = useState<VendorEvaluation[]>([]);
  const [goodsHandovers, setGoodsHandovers] = useState<GoodsHandover[]>([]);
  const [uspks, setUspks] = useState<USPKItem[]>([]);
  const [technicalEvaluations, setTechnicalEvaluations] = useState<TechnicalEvaluation[]>([]);
  const [spkContracts, setSpkContracts] = useState<SPKContract[]>([]);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgressRecord[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressRecord[]>([]);

  const [regions, setRegions] = useState<Region[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [locations, setLocations] = useState<EstateLocation[]>([]);
  const [blocks, setBlocks] = useState<EstateBlock[]>([]);
  const [materials, setMaterials] = useState<MaterialCatalogItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [approvalMatrix, setApprovalMatrix] = useState<ApprovalMatrixRule[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategoryItem[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeItem[]>([]);
  const [procurementTypes, setProcurementTypes] = useState<ProcurementTypeItem[]>([]);

  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  const sessionUser = session?.user as
    | {
        id?: string;
        name?: string | null;
        email?: string | null;
        role?: SystemRole;
        jabatan?: string | null;
        estateName?: string | null;
        image?: string | null;
      }
    | undefined;

  const activeUserId: string | null = sessionUser?.id ?? null;

  const clearAllClientState = useCallback(() => {
    setProjects([]);
    setAfces([]);
    setPrs([]);
    setPos([]);
    setGrs([]);
    setVendorEvaluations([]);
    setGoodsHandovers([]);
    setUspks([]);
    setTechnicalEvaluations([]);
    setSpkContracts([]);
    setComments([]);
    setAttachments([]);
    setNotifications([]);
    setNotificationSettings([]);
    setAuditLogs([]);
    setDailyProgress([]);
    setWeeklyProgress([]);
    setRegions([]);
    setCompanies([]);
    setLocations([]);
    setBlocks([]);
    setMaterials([]);
    setSuppliers([]);
    setUsers([]);
    setApprovalMatrix([]);
    setProjectCategories([]);
    setProjectTypes([]);
    setProcurementTypes([]);
    setUserProfile(DEFAULT_USER_PROFILE);
  }, []);

  const applyDbData = useCallback((d: Record<string, unknown>, activeProfile?: UserProfile) => {
    if (Array.isArray(d.projects)) setProjects(d.projects as Project[]);
    if (Array.isArray(d.afces)) setAfces(d.afces as AFCEDocument[]);
    if (Array.isArray(d.prs)) setPrs(d.prs as PurchaseRequisition[]);
    if (Array.isArray(d.pos)) setPos(d.pos as PurchaseOrder[]);
    if (Array.isArray(d.grs)) setGrs(d.grs as GoodsReceipt[]);
    if (Array.isArray(d.vendorEvaluations)) setVendorEvaluations(d.vendorEvaluations as VendorEvaluation[]);
    if (Array.isArray(d.goodsHandovers)) setGoodsHandovers(d.goodsHandovers as GoodsHandover[]);
    if (Array.isArray(d.uspks)) setUspks(d.uspks as USPKItem[]);
    if (Array.isArray(d.technicalEvaluations)) setTechnicalEvaluations(d.technicalEvaluations as TechnicalEvaluation[]);
    if (Array.isArray(d.spkContracts)) setSpkContracts(d.spkContracts as SPKContract[]);
    if (Array.isArray(d.dailyProgress)) setDailyProgress(d.dailyProgress as DailyProgressRecord[]);
    if (Array.isArray(d.weeklyProgress)) setWeeklyProgress(d.weeklyProgress as WeeklyProgressRecord[]);
    if (Array.isArray(d.comments)) setComments(d.comments as ProjectComment[]);
    if (Array.isArray(d.attachments)) setAttachments(d.attachments as ProjectAttachment[]);
    if (Array.isArray(d.regions)) setRegions(d.regions as Region[]);
    if (Array.isArray(d.companies)) setCompanies(d.companies as Company[]);
    if (Array.isArray(d.locations)) setLocations(d.locations as EstateLocation[]);
    if (Array.isArray(d.blocks)) setBlocks(d.blocks as EstateBlock[]);
    if (Array.isArray(d.materials)) setMaterials(d.materials as MaterialCatalogItem[]);
    if (Array.isArray(d.suppliers)) setSuppliers(d.suppliers as Supplier[]);
    if (Array.isArray(d.users)) setUsers(d.users as AppUser[]);
    if (Array.isArray(d.approvalMatrix)) setApprovalMatrix(d.approvalMatrix as ApprovalMatrixRule[]);
    if (Array.isArray(d.projectCategories)) setProjectCategories(d.projectCategories as ProjectCategoryItem[]);
    if (Array.isArray(d.projectTypes)) setProjectTypes(d.projectTypes as ProjectTypeItem[]);
    if (Array.isArray(d.procurementTypes)) setProcurementTypes(d.procurementTypes as ProcurementTypeItem[]);
    if (Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs as AuditLog[]);
    if (Array.isArray(d.notifications)) setNotifications(d.notifications as NotificationItem[]);
    if (Array.isArray(d.notificationSettings)) {
      setNotificationSettings(d.notificationSettings as NotificationSetting[]);
    }
    if (activeProfile) {
      setUserProfile(activeProfile);
    }
  }, []);

  const refreshFromDatabase = useCallback(async () => {
    if (sessionStatus !== "authenticated") return;
    try {
      const res = await getInitialAppStateAction();
      if (res.success && res.data) {
        applyDbData(
          res.data as unknown as Record<string, unknown>,
          res.activeUserProfile as UserProfile | undefined
        );
        setLoadError(null);
      } else if (!res.success) {
        setLoadError(res.error || "Gagal memuat data aplikasi dari server.");
      }
    } catch (err) {
      const msg = formatErrorMessage(err, "Gagal menyegarkan data dari database.");
      setLoadError(msg);
      console.warn("Gagal menyegarkan data dari database:", err);
    }
  }, [applyDbData, sessionStatus]);

  // Baca preferensi tampilan lokal dan bersihkan kunci cache usang
  useEffect(() => {
    try {
      localStorage.removeItem("wm_toolkit_state_v1");
      localStorage.removeItem("wm_toolkit_state");
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.tableDensity === "comfortable" || parsed.tableDensity === "compact") {
          setTableDensity(parsed.tableDensity);
        }
      }
    } catch {
      // Abaikan jika penyimpanan lokal tidak tersedia
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tableDensity }));
    } catch {
      // Abaikan kuota penyimpanan
    }
  }, [mounted, tableDensity]);

  // Hidrasi state dari PostgreSQL hanya setelah sesi terautentikasi
  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus === "unauthenticated") {
      hasBootstrappedRef.current = false;
      clearAllClientState();
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    if (sessionUser) {
      setUserProfile((prev) => ({
        ...prev,
        fullName: sessionUser.name || prev.fullName,
        email: sessionUser.email || prev.email,
        username: sessionUser.id || prev.username,
        role: sessionUser.jabatan || prev.role,
        systemRole: sessionUser.role || prev.systemRole,
        selectedLocation: sessionUser.estateName || prev.selectedLocation,
        avatarUrl: sessionUser.image || prev.avatarUrl,
      }));
    }

    let cancelled = false;
    const isInitialLoad = !hasBootstrappedRef.current;
    if (isInitialLoad) {
      setIsLoading(true);
    }

    getInitialAppStateAction()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          applyDbData(
            res.data as unknown as Record<string, unknown>,
            res.activeUserProfile as UserProfile | undefined
          );
          setLoadError(null);
          hasBootstrappedRef.current = true;
        } else {
          setLoadError(res.error || "Gagal memuat data awal dari server.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(formatErrorMessage(err, "Gagal terhubung ke server database."));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, sessionUser, applyDbData, clearAllClientState]);

  const activeRole: SystemRole = sessionUser?.role || userProfile.systemRole || "VIEWER";
  const isAdmin = activeRole === "ADMIN";
  const isPic = activeRole === "PIC";
  const isApprover = activeRole === "APPROVER";
  const isViewer = activeRole === "VIEWER";
  const canEditProjects = activeRole === "PIC" || activeRole === "ADMIN";
  const canApproveAfce = activeRole === "APPROVER" || activeRole === "ADMIN";
  const canManageSystem = activeRole === "ADMIN";
  const isViewerOnly = activeRole === "VIEWER";

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    const previous = userProfile;
    const next = { ...previous, ...updates };
    setUserProfile(next);

    try {
      const res = await updateCurrentUserProfileAction(updates);
      if (!res.success) {
        setUserProfile(previous);
        toast.error(res.error || "Gagal menyimpan profil pengguna.");
        return false;
      }

      await updateSession({
        name: next.fullName,
        email: next.email,
        jabatan: next.role,
        estateName: next.selectedLocation,
      });
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setUserProfile(previous);
      toast.error(formatErrorMessage(err, "Gagal menyimpan profil pengguna."));
      return false;
    }
  };

  // =========================================================================
  // Proyek, WBS, BOQ & Revisi Jadwal
  // =========================================================================

  const addProject = async (
    projectData: Partial<Project> & { sapDocNumber?: string }
  ): Promise<string | null> => {
    const today = getTodayDateString();
    const defaultEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const primaryLoc = locations[0];

    const payload = {
      code: projectData.code || `PRJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, "0")}`,
      name: projectData.name || "Proyek Baru",
      description: projectData.description || "",
      picId: projectData.picId || activeUserId || undefined,
      status: projectData.status || "Planned",
      projectType: projectData.projectType || "Physical Work",
      procurementType: projectData.procurementType || "Tender",
      locationId: projectData.locationId || primaryLoc?.id,
      locationName: projectData.locationName || primaryLoc?.name,
      locationIds: projectData.locationIds?.length
        ? projectData.locationIds
        : projectData.locationId
        ? [projectData.locationId]
        : primaryLoc?.id
        ? [primaryLoc.id]
        : [],
      locationNames: projectData.locationNames?.length
        ? projectData.locationNames
        : projectData.locationName
        ? [projectData.locationName]
        : primaryLoc?.name
        ? [primaryLoc.name]
        : [],
      regionId: projectData.regionId,
      regionName: projectData.regionName,
      companyId: projectData.companyId,
      companyName: projectData.companyName,
      blockId: projectData.blockId,
      blockCode: projectData.blockCode,
      blockIds: projectData.blockIds,
      blockCodes: projectData.blockCodes,
      projectCategoryId: projectData.projectCategoryId,
      projectCategoryName: projectData.projectCategoryName,
      afceNumber: projectData.afceNumber || `AFCE-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, "0")}`,
      afceValue: projectData.afceValue || 250000000,
      afceStatus: projectData.afceStatus || "Pending Approval",
      sapDocNumber: projectData.sapDocNumber || "",
      baselineStartDate: projectData.baselineStartDate || today,
      baselineEndDate: projectData.baselineEndDate || defaultEnd,
      targetEndDate: projectData.targetEndDate || projectData.baselineEndDate || defaultEnd,
      durationDays: projectData.durationDays || 60,
      progress: 0,
      ewsStatus: "Normal" as const,
      workItems: (projectData.workItems || []).map((w) => ({
        name: w.name,
        type: w.type || "Physical",
        weight: Number(w.weight) || 0,
        startDate: w.startDate || projectData.baselineStartDate || today,
        endDate: w.endDate || projectData.baselineEndDate || defaultEnd,
        procurementType: w.procurementType || projectData.procurementType || "Tender",
        progressMode: w.progressMode || "Daily",
        progress: Number(w.progress) || 0,
        status: w.status || "Planned",
        phase: w.phase || "Physical Execution",
        notes: w.notes ?? undefined,
      })),
      surveyAndBoq: (projectData.surveyAndBoq || []).map((b) => ({
        itemCode: b.itemCode || "ITEM-001",
        name: b.name,
        volume: Number(b.volume) || 0,
        unit: b.unit || "Unit",
        unitPrice: Number(b.unitPrice) || 0,
        totalPrice: Number(b.totalPrice) || 0,
        weight: Number(b.weight) || 0,
        status: b.status || "Draft",
      })),
      scheduleMatrix: projectData.scheduleMatrix,
    };

    try {
      const res = await createProjectAction(payload);
      if (!res.success || !res.project) {
        toast.error(res.error || "Gagal menyimpan proyek baru ke database.");
        return null;
      }

      await refreshFromDatabase();
      return res.project.id;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal menyimpan proyek baru."));
      return null;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<boolean> => {
    const previousProjects = projects;
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, lastUpdated: getTodayDateString() } : p))
    );

    try {
      const res = await updateProjectAction(id, updates);
      if (!res.success) {
        setProjects(previousProjects);
        toast.error(res.error || "Gagal memperbarui data proyek.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setProjects(previousProjects);
      toast.error(formatErrorMessage(err, "Gagal memperbarui data proyek."));
      return false;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return false;

    const previousProjects = projects;
    const nowIso = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, deletedAt: nowIso } : p))
    );

    try {
      const res = await deleteProjectAction(projectId);
      if (!res.success) {
        setProjects(previousProjects);
        toast.error(res.error || "Gagal memindahkan proyek ke Recycle Bin.");
        return false;
      }
      await refreshFromDatabase();
      toast.success(`Proyek ${project.code} berhasil dipindahkan ke Recycle Bin.`);
      return true;
    } catch (err) {
      setProjects(previousProjects);
      toast.error(formatErrorMessage(err, "Gagal menghapus proyek."));
      return false;
    }
  };

  const restoreProject = async (projectId: string): Promise<boolean> => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return false;

    const previousProjects = projects;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, deletedAt: null } : p))
    );

    try {
      const res = await restoreProjectAction(projectId);
      if (!res.success) {
        setProjects(previousProjects);
        toast.error(res.error || "Gagal memulihkan proyek dari Recycle Bin.");
        return false;
      }
      await refreshFromDatabase();
      toast.success(`Proyek ${project.code} berhasil dipulihkan dari Recycle Bin.`);
      return true;
    } catch (err) {
      setProjects(previousProjects);
      toast.error(formatErrorMessage(err, "Gagal memulihkan proyek."));
      return false;
    }
  };

  const hardDeleteProject = async (projectId: string): Promise<boolean> => {
    const project = projects.find((p) => p.id === projectId);
    const projectCode = project?.code || projectId;

    try {
      const res = await hardDeleteProjectAction(projectId);
      if (!res.success) {
        toast.error(res.error || "Gagal menghapus proyek secara permanen.");
        return false;
      }
      await refreshFromDatabase();
      toast.success(`Proyek ${projectCode} berhasil dihapus permanen dari sistem.`);
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal menghapus proyek permanen."));
      return false;
    }
  };

  const emptyRecycleBin = async (): Promise<boolean> => {
    try {
      const res = await emptyRecycleBinAction();
      if (!res.success) {
        toast.error(res.error || "Gagal mengosongkan Recycle Bin.");
        return false;
      }
      await refreshFromDatabase();
      toast.success(`Recycle Bin berhasil dikosongkan (${res.count || 0} proyek dihapus permanen).`);
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mengosongkan Recycle Bin."));
      return false;
    }
  };

  const reviseProjectSchedule = async (
    projectId: string,
    revision: Omit<ScheduleRevision, "id">
  ): Promise<boolean> => {
    const previousProjects = projects;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newRev: ScheduleRevision = {
          ...revision,
          id: `rev-temp-${Date.now()}`,
          revisionNumber: p.revisions.length + 1,
        };
        const variance = Math.max(
          0,
          Math.ceil(
            (new Date(revision.newEndDate).getTime() - new Date(p.baselineEndDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );
        return {
          ...p,
          targetEndDate: revision.newEndDate,
          scheduleVarianceDays: variance,
          ewsStatus: variance > 14 ? "Critical" : variance > 7 ? "Warning" : "Normal",
          revisions: [...p.revisions, newRev],
          lastUpdated: getTodayDateString(),
        };
      })
    );

    try {
      const res = await reviseScheduleAction(projectId, revision);
      if (!res.success) {
        setProjects(previousProjects);
        toast.error(res.error || "Gagal mencatat revisi jadwal.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setProjects(previousProjects);
      toast.error(formatErrorMessage(err, "Gagal mencatat revisi jadwal."));
      return false;
    }
  };

  const addWorkItem = async (projectId: string, data: WorkItemInput): Promise<boolean> => {
    try {
      const res = await addWorkItemAction(projectId, data);
      if (!res.success) {
        toast.error(res.error || "Gagal menambahkan item pekerjaan.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Item pekerjaan WBS berhasil ditambahkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal menambahkan item pekerjaan."));
      return false;
    }
  };

  const updateWorkItem = async (
    workItemId: string,
    _projectId: string,
    updates: Partial<WorkItemInput>
  ): Promise<boolean> => {
    try {
      const res = await updateWorkItemAction(workItemId, updates);
      if (!res.success) {
        toast.error(res.error || "Gagal memperbarui item pekerjaan.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Item pekerjaan WBS berhasil diperbarui.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal memperbarui item pekerjaan."));
      return false;
    }
  };

  const deleteWorkItem = async (workItemId: string, _projectId: string): Promise<boolean> => {
    try {
      const res = await deleteWorkItemAction(workItemId);
      if (!res.success) {
        toast.error(res.error || "Gagal menghapus item pekerjaan.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Item pekerjaan WBS berhasil dihapus.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal menghapus item pekerjaan."));
      return false;
    }
  };

  const addBoqItem = async (projectId: string, data: BoqItemInput): Promise<boolean> => {
    try {
      const res = await addBoqItemAction(projectId, data);
      if (!res.success) {
        toast.error(res.error || "Gagal menambahkan item BOQ.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Item Survey & BOQ berhasil ditambahkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal menambahkan item BOQ."));
      return false;
    }
  };

  const deleteBoqItem = async (boqItemId: string, _projectId: string): Promise<boolean> => {
    try {
      const res = await deleteBoqItemAction(boqItemId);
      if (!res.success) {
        toast.error(res.error || "Gagal menghapus item BOQ.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Item Survey & BOQ berhasil dihapus.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal menghapus item BOQ."));
      return false;
    }
  };

  // =========================================================================
  // AFCE
  // =========================================================================

  const updateAfceDocument = async (
    afceId: string,
    updates: Partial<AFCEDocument>
  ): Promise<boolean> => {
    const target = afces.find((a) => a.id === afceId);
    if (!target) return false;

    const previousAfces = afces;
    const previousProjects = projects;

    let matrixUpdates: Partial<AFCEDocument> = {};
    if (updates.value !== undefined && updates.value !== target.value) {
      const hasApprovedLevels =
        (target.approvalMatrixLevels || []).some((l) => l.status === "Approved") ||
        target.history.some((h) => h.action === "Approve");

      if (!hasApprovedLevels) {
        const matchedTier = findMatchingApprovalTier(updates.value, approvalMatrix);
        if (matchedTier) {
          const newLevels = generateMatrixLevelsFromTier(
            matchedTier,
            target.id,
            target.status === "Draft" ? "Draft" : "Pending Approval"
          );
          matrixUpdates = {
            approvalMatrixLevels: newLevels,
            requiredLevels: newLevels.length,
            currentLevel: target.status === "Draft" ? 0 : 1,
            currentApproverRole: newLevels[0]?.label || "Water Management",
          };
        }
      }
    }

    setAfces((prev) =>
      prev.map((a) => (a.id === afceId ? { ...a, ...updates, ...matrixUpdates } : a))
    );

    if (
      updates.value !== undefined ||
      updates.afceNumber !== undefined ||
      updates.status !== undefined ||
      matrixUpdates.approvalMatrixLevels !== undefined
    ) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== target.projectId) return p;
          return {
            ...p,
            ...(updates.value !== undefined ? { afceValue: updates.value } : {}),
            ...(updates.afceNumber !== undefined ? { afceNumber: updates.afceNumber } : {}),
            ...(updates.status !== undefined ? { afceStatus: updates.status } : {}),
            ...(matrixUpdates.currentApproverRole
              ? {
                  approvalStatus:
                    target.status === "Draft"
                      ? "Draft AFCE Preparation"
                      : `Waiting Level 1: ${matrixUpdates.currentApproverRole} Approval`,
                }
              : {}),
            lastUpdated: getTodayDateString(),
          };
        })
      );
    }

    try {
      const res = await updateAfceAction(afceId, {
        ...updates,
        ...(matrixUpdates.approvalMatrixLevels
          ? { approvalMatrixLevels: matrixUpdates.approvalMatrixLevels }
          : {}),
      });
      if (!res.success) {
        setAfces(previousAfces);
        setProjects(previousProjects);
        toast.error(res.error || "Gagal memperbarui dokumen AFCE.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setAfces(previousAfces);
      setProjects(previousProjects);
      toast.error(formatErrorMessage(err, "Gagal memperbarui dokumen AFCE."));
      return false;
    }
  };

  const syncAfceWithMatrix = async (afceId: string): Promise<boolean> => {
    const target = afces.find((a) => a.id === afceId);
    if (!target) return false;

    const matchedTier = findMatchingApprovalTier(target.value, approvalMatrix);
    if (!matchedTier) {
      toast.error("Tidak ditemukan tingkatan matriks SOP yang sesuai untuk nilai AFCE ini.");
      return false;
    }

    const activeCodes = matchedTier.levels.filter(Boolean) as ApprovalLevel[];
    const oldLevels = target.approvalMatrixLevels || [];

    const newLevels: AFCEApprovalLevelItem[] = activeCodes.map((code, idx) => {
      const existing = oldLevels.find((l) => l.code === code);
      const label = APPROVAL_LEVEL_LABELS[code] || code;
      if (existing && existing.status === "Approved") {
        return {
          ...existing,
          level: idx + 1,
          label,
        };
      }
      return {
        id: existing?.id || `aml-${target.id}-${idx + 1}`,
        level: idx + 1,
        code,
        label,
        isRequired: true,
        status: "Waiting" as const,
        approverJabatan: label,
      };
    });

    const firstUnapprovedIdx = newLevels.findIndex((l) => l.status !== "Approved");
    let newStatus: AFCEStatus = target.status;
    let newCurrentLevel = 1;
    let newRole = newLevels[0]?.label || "Water Management";

    if (firstUnapprovedIdx === -1) {
      newStatus = "Approved";
      newCurrentLevel = newLevels.length;
      newRole = newLevels[newLevels.length - 1]?.label || "Chairman";
    } else if (target.status !== "Draft") {
      newLevels[firstUnapprovedIdx].status = "Pending";
      newStatus = "Pending Approval";
      newCurrentLevel = firstUnapprovedIdx + 1;
      newRole = newLevels[firstUnapprovedIdx].label;
    } else {
      newStatus = "Draft";
      newCurrentLevel = 0;
      newRole = newLevels[0]?.label || "Water Management";
    }

    const previousAfces = afces;
    const previousProjects = projects;

    setAfces((prev) =>
      prev.map((a) =>
        a.id === afceId
          ? {
              ...a,
              status: newStatus,
              currentLevel: newCurrentLevel,
              requiredLevels: newLevels.length,
              currentApproverRole: newRole,
              approvalMatrixLevels: newLevels,
            }
          : a
      )
    );

    setProjects((prev) =>
      prev.map((p) =>
        p.id === target.projectId
          ? {
              ...p,
              afceStatus: newStatus,
              approvalStatus:
                newStatus === "Approved"
                  ? `Approved by ${newRole}`
                  : newStatus === "Draft"
                  ? "Draft AFCE Preparation"
                  : `Waiting Level ${newCurrentLevel}: ${newRole} Approval`,
            }
          : p
      )
    );

    try {
      const res = await syncAfceWithMatrixAction(target.id, newLevels);
      if (!res.success) {
        setAfces(previousAfces);
        setProjects(previousProjects);
        toast.error(res.error || "Gagal menyinkronkan matriks AFCE.");
        return false;
      }
      await refreshFromDatabase();
      toast.success(`Matriks dokumen ${target.afceNumber} berhasil disinkronkan dengan SOP terbaru.`);
      return true;
    } catch (err) {
      setAfces(previousAfces);
      setProjects(previousProjects);
      toast.error(formatErrorMessage(err, "Gagal menyinkronkan matriks AFCE."));
      return false;
    }
  };

  const submitAfceApproval = async (
    afceId: string,
    note: string,
    submissionDate?: string
  ): Promise<boolean> => {
    const target = afces.find((a) => a.id === afceId);
    if (!target) return false;

    const subDate = submissionDate || getTodayDateString();
    const previousAfces = afces;
    const previousProjects = projects;

    let matrixLevels: AFCEApprovalLevelItem[] = [];
    if (target.approvalMatrixLevels && target.approvalMatrixLevels.length > 0) {
      matrixLevels = target.approvalMatrixLevels.map((lvl) =>
        lvl.status === "Need Revision" || lvl.status === "Rejected"
          ? { ...lvl, status: "Pending" as const }
          : { ...lvl }
      );
      if (!matrixLevels.some((l) => l.status === "Pending")) {
        const firstWaitIdx = matrixLevels.findIndex((l) => l.status === "Waiting");
        if (firstWaitIdx !== -1) {
          matrixLevels[firstWaitIdx].status = "Pending";
        } else if (matrixLevels.length > 0 && !matrixLevels.some((l) => l.status === "Approved")) {
          matrixLevels[0].status = "Pending";
        }
      }
    } else {
      const matchedTier = findMatchingApprovalTier(target.value, approvalMatrix);
      matrixLevels = matchedTier
        ? generateMatrixLevelsFromTier(matchedTier, target.id, "Pending Approval")
        : [
            {
              id: `aml-${target.id}-1`,
              level: 1,
              code: "WM",
              label: "Water Management",
              isRequired: true,
              status: "Pending",
              approverJabatan: "Water Management",
            },
          ];
    }

    const pendingIdx = matrixLevels.findIndex((l) => l.status === "Pending");
    const activeIdx = pendingIdx !== -1 ? pendingIdx : 0;
    const targetLevel = matrixLevels[activeIdx];
    const targetRole = targetLevel?.label || "Water Management";
    const submitterName = userProfile.fullName || "PIC Proyek";

    const historyRecord = {
      id: `rec-temp-${Date.now()}`,
      afceNumber: target.afceNumber,
      matrixLevelId: targetLevel?.id,
      approverName: submitterName,
      approverRole: targetRole,
      approverJabatan: targetRole,
      action: "Submit" as const,
      approvalDate: subDate,
      timestamp: `${subDate} ${new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      note,
      previousStatus: target.status,
      newStatus: "Pending Approval" as AFCEStatus,
      sapDocNumber: target.sapDocNumber,
    };

    setAfces((prev) =>
      prev.map((a) =>
        a.id === afceId
          ? {
              ...a,
              submittedAt: a.submittedAt || subDate,
              status: "Pending Approval",
              currentLevel: activeIdx + 1,
              requiredLevels: matrixLevels.length,
              currentApproverRole: targetRole,
              approvalMatrixLevels: matrixLevels,
              history: [...a.history, historyRecord],
            }
          : a
      )
    );

    setProjects((prev) =>
      prev.map((p) =>
        p.id === target.projectId
          ? {
              ...p,
              afceStatus: "Pending Approval",
              approvalStatus: `Waiting Level ${activeIdx + 1}: ${targetRole} Approval`,
              lastUpdated: subDate,
            }
          : p
      )
    );

    try {
      const res = await submitAfceApprovalAction(afceId, note, subDate);
      if (!res.success) {
        setAfces(previousAfces);
        setProjects(previousProjects);
        toast.error(res.error || "Gagal mengajukan dokumen AFCE.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setAfces(previousAfces);
      setProjects(previousProjects);
      toast.error(formatErrorMessage(err, "Gagal mengajukan dokumen AFCE."));
      return false;
    }
  };

  const processAfceAction = async (
    afceId: string,
    action: "Approve" | "Revise" | "Reject",
    note: string,
    approverName: string,
    approverRole: AFCEApprovalRole,
    approvalDate?: string,
    sapDocNumber?: string,
    sapEvidenceUrl?: string,
    targetLevelIndex?: number
  ): Promise<boolean> => {
    const target = afces.find((a) => a.id === afceId);
    if (!target) return false;

    const actDate = approvalDate || getTodayDateString();
    const previousAfces = afces;
    const previousProjects = projects;

    let nextStatus: AFCEStatus = target.status;
    let nextLevel = target.currentLevel;
    let nextRole = target.currentApproverRole;

    const currentLevels: AFCEApprovalLevelItem[] =
      target.approvalMatrixLevels && target.approvalMatrixLevels.length > 0
        ? target.approvalMatrixLevels.map((lvl) => ({ ...lvl }))
        : [
            {
              id: `aml-${target.id}-1`,
              level: 1,
              code: "WM",
              label: approverRole,
              isRequired: true,
              status: "Pending" as const,
              approverJabatan: approverRole,
            },
          ];

    const currentIdx =
      targetLevelIndex !== undefined &&
      targetLevelIndex >= 0 &&
      targetLevelIndex < currentLevels.length
        ? targetLevelIndex
        : Math.max(0, Math.min(target.currentLevel - 1, currentLevels.length - 1));

    if (action === "Approve") {
      if (currentLevels[currentIdx]) {
        currentLevels[currentIdx] = {
          ...currentLevels[currentIdx],
          status: "Approved",
          approverName,
          approverJabatan: approverRole,
          decidedAt: actDate,
          note,
          sapDocNumber: sapDocNumber || target.sapDocNumber,
          sapEvidenceUrl: sapEvidenceUrl || currentLevels[currentIdx].sapEvidenceUrl,
        };
      }
      const remainingUnapproved = currentLevels.findIndex((l) => l.status !== "Approved");
      if (remainingUnapproved === -1 || currentIdx >= currentLevels.length - 1) {
        nextStatus = "Approved";
        nextRole = approverRole;
      } else {
        nextLevel = remainingUnapproved + 1;
        nextStatus = "Pending Approval";
        currentLevels[remainingUnapproved] = {
          ...currentLevels[remainingUnapproved],
          status: "Pending",
        };
        nextRole = currentLevels[remainingUnapproved].label;
      }
    } else if (action === "Revise") {
      nextStatus = "Need Revision";
      if (currentLevels[currentIdx]) {
        currentLevels[currentIdx] = {
          ...currentLevels[currentIdx],
          status: "Need Revision",
          approverName,
          approverJabatan: approverRole,
          decidedAt: actDate,
          note,
        };
      }
    } else {
      nextStatus = "Rejected";
      if (currentLevels[currentIdx]) {
        currentLevels[currentIdx] = {
          ...currentLevels[currentIdx],
          status: "Rejected",
          approverName,
          approverJabatan: approverRole,
          decidedAt: actDate,
          note,
        };
      }
    }

    const historyRecord = {
      id: `rec-temp-${Date.now()}`,
      afceNumber: target.afceNumber,
      matrixLevelId: currentLevels[currentIdx]?.id,
      approverName,
      approverRole,
      approverJabatan: approverRole,
      action,
      approvalDate: actDate,
      timestamp: `${actDate} ${new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      note,
      previousStatus: target.status,
      newStatus: nextStatus,
      sapDocNumber: sapDocNumber || target.sapDocNumber,
      sapEvidenceUrl,
    };

    setAfces((prev) =>
      prev.map((a) =>
        a.id === afceId
          ? {
              ...a,
              status: nextStatus,
              currentLevel: nextLevel,
              currentApproverRole: nextRole,
              approvedAt: nextStatus === "Approved" ? actDate : a.approvedAt,
              sapDocNumber: sapDocNumber || a.sapDocNumber,
              approvalMatrixLevels: currentLevels,
              history: [...a.history, historyRecord],
            }
          : a
      )
    );

    setProjects((prev) =>
      prev.map((p) =>
        p.id === target.projectId
          ? {
              ...p,
              afceStatus: nextStatus,
              approvalStatus:
                nextStatus === "Approved"
                  ? `Approved by ${approverRole}`
                  : nextStatus === "Need Revision"
                  ? `Needs Revision (${approverRole})`
                  : nextStatus === "Rejected"
                  ? `Rejected by ${approverRole}`
                  : `Waiting Level ${nextLevel}: ${nextRole} Approval`,
              lastUpdated: actDate,
            }
          : p
      )
    );

    try {
      const res = await processAfceApprovalAction({
        afceId,
        action,
        note,
        approverName,
        approverRole,
        approverJabatan: approverRole || "Approver",
        approvalDate: actDate,
        sapDocNumber,
        sapEvidenceUrl,
        targetLevelIndex,
      });
      if (!res.success) {
        setAfces(previousAfces);
        setProjects(previousProjects);
        toast.error(res.error || "Gagal memproses persetujuan AFCE.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setAfces(previousAfces);
      setProjects(previousProjects);
      toast.error(formatErrorMessage(err, "Gagal memproses persetujuan AFCE."));
      return false;
    }
  };

  const softDeleteAfce = async (afceId: string): Promise<boolean> => {
    try {
      const res = await softDeleteAfceAction(afceId);
      if (!res.success) {
        toast.error(res.error || "Gagal mengarsipkan dokumen AFCE.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Dokumen AFCE berhasil diarsipkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mengarsipkan dokumen AFCE."));
      return false;
    }
  };

  const restoreAfce = async (afceId: string): Promise<boolean> => {
    try {
      const res = await restoreAfceAction(afceId);
      if (!res.success) {
        toast.error(res.error || "Gagal memulihkan dokumen AFCE.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Dokumen AFCE berhasil dipulihkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal memulihkan dokumen AFCE."));
      return false;
    }
  };

  // =========================================================================
  // Pengadaan Barang (PR, Evaluasi Rekanan, PO, GR, BAST)
  // =========================================================================

  const createPr = async (
    prData: Omit<PurchaseRequisition, "id" | "createdAt">
  ): Promise<boolean> => {
    try {
      const res = await createPrAction(prData);
      if (!res.success) {
        toast.error(res.error || "Gagal mencatat Purchase Requisition.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mencatat Purchase Requisition."));
      return false;
    }
  };

  const softDeletePr = async (prId: string): Promise<boolean> => {
    try {
      const res = await softDeletePrAction(prId);
      if (!res.success) {
        toast.error(res.error || "Gagal mengarsipkan Purchase Requisition.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Purchase Requisition berhasil diarsipkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mengarsipkan Purchase Requisition."));
      return false;
    }
  };

  const restorePr = async (prId: string): Promise<boolean> => {
    try {
      const res = await restorePrAction(prId);
      if (!res.success) {
        toast.error(res.error || "Gagal memulihkan Purchase Requisition.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Purchase Requisition berhasil dipulihkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal memulihkan Purchase Requisition."));
      return false;
    }
  };

  const recordVendorEvaluation = async (
    evaluationData: Omit<VendorEvaluation, "id" | "createdAt">
  ): Promise<boolean> => {
    try {
      const res = await recordVendorEvaluationAction(evaluationData);
      if (!res.success) {
        toast.error(res.error || "Gagal mencatat evaluasi rekanan.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mencatat evaluasi rekanan."));
      return false;
    }
  };

  const createPo = async (
    poData: Omit<PurchaseOrder, "id" | "receiptProgressPercent">
  ): Promise<boolean> => {
    try {
      const res = await createPoAction(poData);
      if (!res.success) {
        toast.error(res.error || "Gagal menerbitkan Purchase Order.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal menerbitkan Purchase Order."));
      return false;
    }
  };

  const softDeletePo = async (poId: string): Promise<boolean> => {
    try {
      const res = await softDeletePoAction(poId);
      if (!res.success) {
        toast.error(res.error || "Gagal mengarsipkan Purchase Order.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Purchase Order berhasil diarsipkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mengarsipkan Purchase Order."));
      return false;
    }
  };

  const restorePo = async (poId: string): Promise<boolean> => {
    try {
      const res = await restorePoAction(poId);
      if (!res.success) {
        toast.error(res.error || "Gagal memulihkan Purchase Order.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Purchase Order berhasil dipulihkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal memulihkan Purchase Order."));
      return false;
    }
  };

  const recordGoodsReceipt = async (grData: Omit<GoodsReceipt, "id">): Promise<boolean> => {
    try {
      const res = await recordGoodsReceiptAction(grData);
      if (!res.success) {
        toast.error(res.error || "Gagal mencatat penerimaan barang.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mencatat penerimaan barang."));
      return false;
    }
  };

  const recordGoodsHandover = async (
    handoverData: Omit<GoodsHandover, "id" | "createdAt">
  ): Promise<boolean> => {
    try {
      const res = await recordGoodsHandoverAction(handoverData);
      if (!res.success) {
        toast.error(res.error || "Gagal mencatat serah terima barang.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mencatat serah terima barang."));
      return false;
    }
  };

  // =========================================================================
  // Pengadaan Jasa (USPK, Evaluasi Teknis, SPK)
  // =========================================================================

  const createUspk = async (data: Omit<USPKItem, "id" | "createdAt">): Promise<boolean> => {
    try {
      const res = await createUspkAction(data);
      if (!res.success) {
        toast.error(res.error || "Gagal mencatat Usulan SPK.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mencatat Usulan SPK."));
      return false;
    }
  };

  const updateUspkStatus = async (
    id: string,
    status: USPKStatus,
    decidedAt?: string
  ): Promise<boolean> => {
    const previousUspks = uspks;
    setUspks((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              status,
              decidedAt:
                decidedAt ||
                (status === "APPROVED" || status === "REJECTED"
                  ? getTodayDateString()
                  : u.decidedAt),
            }
          : u
      )
    );

    try {
      const res = await updateUspkStatusAction(id, status, decidedAt);
      if (!res.success) {
        setUspks(previousUspks);
        toast.error(res.error || "Gagal memperbarui status USPK.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setUspks(previousUspks);
      toast.error(formatErrorMessage(err, "Gagal memperbarui status USPK."));
      return false;
    }
  };

  const softDeleteUspk = async (uspkId: string): Promise<boolean> => {
    try {
      const res = await softDeleteUspkAction(uspkId);
      if (!res.success) {
        toast.error(res.error || "Gagal mengarsipkan USPK.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Usulan SPK berhasil diarsipkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mengarsipkan USPK."));
      return false;
    }
  };

  const restoreUspk = async (uspkId: string): Promise<boolean> => {
    try {
      const res = await restoreUspkAction(uspkId);
      if (!res.success) {
        toast.error(res.error || "Gagal memulihkan USPK.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Usulan SPK berhasil dipulihkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal memulihkan USPK."));
      return false;
    }
  };

  const recordTechnicalEvaluation = async (
    data: Omit<TechnicalEvaluation, "id" | "createdAt">
  ): Promise<boolean> => {
    try {
      const res = await recordTechnicalEvaluationAction(data);
      if (!res.success) {
        toast.error(res.error || "Gagal mencatat evaluasi teknis.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mencatat evaluasi teknis."));
      return false;
    }
  };

  const createSpkContract = async (
    data: Omit<SPKContract, "id" | "createdAt">
  ): Promise<boolean> => {
    try {
      const res = await createSpkAction(data);
      if (!res.success) {
        toast.error(res.error || "Gagal menerbitkan kontrak SPK.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal menerbitkan kontrak SPK."));
      return false;
    }
  };

  const updateSpkStatus = async (id: string, status: SPKStatus): Promise<boolean> => {
    const previousSpks = spkContracts;
    setSpkContracts((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));

    try {
      const res = await updateSpkStatusAction(id, status);
      if (!res.success) {
        setSpkContracts(previousSpks);
        toast.error(res.error || "Gagal memperbarui status SPK.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setSpkContracts(previousSpks);
      toast.error(formatErrorMessage(err, "Gagal memperbarui status SPK."));
      return false;
    }
  };

  const softDeleteSpk = async (spkId: string): Promise<boolean> => {
    try {
      const res = await softDeleteSpkAction(spkId);
      if (!res.success) {
        toast.error(res.error || "Gagal mengarsipkan SPK.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Surat Perintah Kerja berhasil diarsipkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mengarsipkan SPK."));
      return false;
    }
  };

  const restoreSpk = async (spkId: string): Promise<boolean> => {
    try {
      const res = await restoreSpkAction(spkId);
      if (!res.success) {
        toast.error(res.error || "Gagal memulihkan SPK.");
        return false;
      }
      await refreshFromDatabase();
      toast.success("Surat Perintah Kerja berhasil dipulihkan.");
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal memulihkan SPK."));
      return false;
    }
  };

  // =========================================================================
  // Progres Fisik
  // =========================================================================

  const getSpkProgressSummary = (spkId: string) => {
    const spk = spkContracts.find((s) => s.id === spkId);
    const logs = dailyProgress.filter((dp) => dp.spkId === spkId);
    const targetVolume = spk?.targetVolume || 0;
    const unit = spk?.unit || "Unit";
    const realizedVolume = logs.reduce((sum, log) => sum + (log.actualVolume || 0), 0);
    const remainingVolume = Math.max(0, targetVolume - realizedVolume);
    const percentComplete =
      targetVolume > 0 ? Math.min(100, Math.round((realizedVolume / targetVolume) * 100)) : 0;
    return {
      spk,
      targetVolume,
      realizedVolume,
      remainingVolume,
      percentComplete,
      unit,
    };
  };

  const addDailyProgress = async (
    record: Omit<DailyProgressRecord, "id" | "recordedAt">
  ): Promise<boolean> => {
    try {
      const res = await addDailyProgressAction(record);
      if (!res.success) {
        toast.error(res.error || "Gagal mencatat log progres harian.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mencatat log progres harian."));
      return false;
    }
  };

  const addWeeklyProgress = async (
    record: Omit<WeeklyProgressRecord, "id" | "recordedAt">
  ): Promise<boolean> => {
    try {
      const res = await addWeeklyProgressAction(record);
      if (!res.success) {
        toast.error(res.error || "Gagal mencatat evaluasi kurva-S mingguan.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mencatat evaluasi kurva-S mingguan."));
      return false;
    }
  };

  // =========================================================================
  // Diskusi & Lampiran
  // =========================================================================

  const addComment = async (
    projectId: string,
    content: string,
    mentionedUserIds: string[],
    newAttachments?: ProjectAttachment[]
  ): Promise<ProjectComment | null> => {
    try {
      const attachmentsPayload = (newAttachments || []).map((att) => ({
        source: att.source || ("UPLOAD" as const),
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize || "",
        mimeType: att.mimeType,
        category: att.category || "Lampiran Diskusi",
        docNumber: att.docNumber,
        googleDriveFileId: att.googleDriveFileId,
      }));

      const res = await addCommentAction({
        projectId,
        content,
        mentionedUserIds,
        attachments: attachmentsPayload.length > 0 ? attachmentsPayload : undefined,
      });

      if (!res.success || !res.comment) {
        toast.error(res.error || "Gagal mengirim komentar diskusi.");
        return null;
      }

      if (mentionedUserIds.length > 0) {
        const proj = projects.find((p) => p.id === projectId);
        if (isAdmin) {
          for (const uId of mentionedUserIds) {
            const targetUser = users.find((u) => u.id === uId);
            if (targetUser) {
              await createNotificationAction({
                userId: targetUser.id,
                type: "NEW_TASK",
                title: `Mention: Diskusi Proyek ${proj ? proj.code : ""}`,
                message: `${userProfile.fullName} menyebut Anda: "${content.slice(0, 75)}${
                  content.length > 75 ? "..." : ""
                }"`,
                linkUrl: `/workspace/${projectId}/comments`,
                projectId,
                projectCode: proj?.code,
                projectName: proj?.name,
                priority: "info",
              });
            }
          }
        }

        const mentionedNames = users
          .filter((u) => mentionedUserIds.includes(u.id))
          .map((u) => u.name)
          .join(", ");
        if (mentionedNames) {
          toast.info(`Mention tercatat untuk: ${mentionedNames}`);
        }
      }

      await refreshFromDatabase();
      return {
        id: res.comment.id,
        projectId: res.comment.projectId,
        userId: res.comment.userId,
        userName: res.comment.userName,
        userRole: res.comment.userRole ?? undefined,
        content: res.comment.content,
        mentionedUserIds: Array.isArray(res.comment.mentionedUserIds)
          ? (res.comment.mentionedUserIds as string[])
          : mentionedUserIds,
        attachments: newAttachments || [],
        createdAt: new Date(res.comment.createdAt).toISOString(),
      };
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal mengirim komentar diskusi."));
      return null;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    const previousComments = comments;
    const previousAttachments = attachments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setAttachments((prev) => prev.filter((a) => a.commentId !== commentId));

    try {
      const res = await deleteCommentAction(commentId);
      if (!res.success) {
        setComments(previousComments);
        setAttachments(previousAttachments);
        toast.error(res.error || "Gagal menghapus komentar.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setComments(previousComments);
      setAttachments(previousAttachments);
      toast.error(formatErrorMessage(err, "Gagal menghapus komentar."));
      return false;
    }
  };

  const addAttachment = async (
    attachmentData: Omit<ProjectAttachment, "id" | "uploadedAt">
  ): Promise<ProjectAttachment | null> => {
    try {
      const res = await addAttachmentAction({
        projectId: attachmentData.projectId,
        commentId: attachmentData.commentId || undefined,
        source: attachmentData.source || "UPLOAD",
        fileName: attachmentData.fileName,
        fileUrl: attachmentData.fileUrl,
        fileSize: attachmentData.fileSize || "",
        mimeType: attachmentData.mimeType || undefined,
        category: attachmentData.category,
        docNumber: attachmentData.docNumber,
        googleDriveFileId: attachmentData.googleDriveFileId || undefined,
      });

      if (!res.success || !res.attachment) {
        toast.error(res.error || "Gagal menyimpan lampiran.");
        return null;
      }

      await refreshFromDatabase();
      return {
        ...attachmentData,
        id: res.attachment.id,
        uploadedAt: new Date(res.attachment.uploadedAt).toISOString(),
      };
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal menyimpan lampiran."));
      return null;
    }
  };

  const deleteAttachment = async (attachmentId: string): Promise<boolean> => {
    const previousAttachments = attachments;
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));

    try {
      const res = await deleteAttachmentAction(attachmentId);
      if (!res.success) {
        setAttachments(previousAttachments);
        toast.error(res.error || "Gagal menghapus lampiran.");
        return false;
      }
      await refreshFromDatabase();
      return true;
    } catch (err) {
      setAttachments(previousAttachments);
      toast.error(formatErrorMessage(err, "Gagal menghapus lampiran."));
      return false;
    }
  };

  // =========================================================================
  // Notifikasi & Pengingat
  // =========================================================================

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationAsRead = async (id: string) => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      const res = await markNotificationAsReadAction(id);
      if (!res.success) {
        setNotifications(previous);
        toast.error(res.error || "Gagal memperbarui status notifikasi.");
      }
    } catch (err) {
      setNotifications(previous);
      toast.error(formatErrorMessage(err, "Gagal memperbarui status notifikasi."));
    }
  };

  const markAllNotificationsAsRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      const res = await markAllNotificationsAsReadAction();
      if (!res.success) {
        setNotifications(previous);
        toast.error(res.error || "Gagal menandai semua notifikasi.");
        return;
      }
      toast.success("Semua notifikasi telah ditandai sebagai dibaca.");
    } catch (err) {
      setNotifications(previous);
      toast.error(formatErrorMessage(err, "Gagal menandai semua notifikasi."));
    }
  };

  const deleteNotification = async (id: string) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await deleteNotificationAction(id);
      if (!res.success) {
        setNotifications(previous);
        toast.error(res.error || "Gagal menghapus notifikasi.");
        return;
      }
      toast.info("Notifikasi telah dihapus.");
    } catch (err) {
      setNotifications(previous);
      toast.error(formatErrorMessage(err, "Gagal menghapus notifikasi."));
    }
  };

  const clearAllNotifications = async () => {
    const previous = notifications;
    setNotifications([]);
    try {
      const res = await clearAllNotificationsAction();
      if (!res.success) {
        setNotifications(previous);
        toast.error(res.error || "Gagal membersihkan notifikasi.");
        return;
      }
      toast.info("Semua notifikasi telah dibersihkan.");
    } catch (err) {
      setNotifications(previous);
      toast.error(formatErrorMessage(err, "Gagal membersihkan notifikasi."));
    }
  };

  const addNotification = async (
    item: Omit<NotificationItem, "id" | "createdAt">
  ): Promise<NotificationItem | null> => {
    try {
      const res = await createNotificationAction(item);
      if (!res.success || !res.notification) {
        return null;
      }
      await refreshFromDatabase();
      return {
        ...item,
        id: res.notification.id,
        createdAt: new Date(res.notification.createdAt).toISOString(),
      };
    } catch {
      return null;
    }
  };

  const updateNotificationSetting = async (
    type: NotificationType,
    isEnabled: boolean
  ) => {
    const previous = notificationSettings;
    setNotificationSettings((prev) => {
      const exists = prev.some((s) => s.notificationType === type);
      if (exists) {
        return prev.map((s) =>
          s.notificationType === type ? { ...s, isEnabled } : s
        );
      }
      return [
        ...prev,
        {
          id: `ns-temp-${type}`,
          userId: activeUserId || "",
          notificationType: type,
          isEnabled,
        },
      ];
    });

    try {
      const res = await updateNotificationSettingAction(type, isEnabled);
      if (!res.success) {
        setNotificationSettings(previous);
        toast.error(res.error || "Gagal memperbarui pengaturan notifikasi.");
        return;
      }
      toast.success("Pengaturan notifikasi berhasil diperbarui.");
    } catch (err) {
      setNotificationSettings(previous);
      toast.error(formatErrorMessage(err, "Gagal memperbarui pengaturan notifikasi."));
    }
  };

  const runCronDeadlineCheck = async () => {
    try {
      const response = await fetch("/api/cron/check-deadlines", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        const errorMsg = payload?.error || "Gagal menjalankan pemeriksaan pengingat.";
        toast.error(errorMsg);
        return { success: false, generatedCount: 0, message: errorMsg };
      }

      const generatedCount = Number(payload.summary?.newNotificationsCreated || 0);
      await refreshFromDatabase();

      const msg =
        generatedCount > 0
          ? `Pemeriksaan selesai: ${generatedCount} pengingat baru dibuat.`
          : "Pemeriksaan selesai: seluruh proyek & persetujuan sudah terpantau.";
      if (generatedCount > 0) {
        toast.success(msg);
      } else {
        toast.info(msg);
      }
      return { success: true, generatedCount, message: msg };
    } catch (err) {
      const errorMsg = formatErrorMessage(err, "Gagal menghubungi layanan pengingat server.");
      toast.error(errorMsg);
      return { success: false, generatedCount: 0, message: errorMsg };
    }
  };

  // =========================================================================
  // Master Data Helper Generik (bebas side-effect di dalam setState)
  // =========================================================================

  async function runAddMasterData<T extends { id: string; updatedAt: string }, R extends { success: boolean; error?: string }>(
    listSetter: React.Dispatch<React.SetStateAction<T[]>>,
    tempPrefix: string,
    payload: Omit<T, "id" | "updatedAt">,
    actionFn: (input: T) => Promise<R>,
    extractRecord: (res: R) => { id: string; updatedAt?: string | Date } | undefined,
    errorFallback: string
  ): Promise<boolean> {
    const tempId = `${tempPrefix}-${Date.now()}`;
    const newItem = {
      ...payload,
      id: tempId,
      updatedAt: getTodayDateString(),
    } as T;

    listSetter((prev) => [...prev, newItem]);
    try {
      const res = await actionFn(newItem);
      const saved = res.success ? extractRecord(res) : undefined;
      if (res.success && saved) {
        listSetter((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  id: saved.id,
                  updatedAt: saved.updatedAt
                    ? new Date(saved.updatedAt).toISOString().split("T")[0]
                    : item.updatedAt,
                }
              : item
          )
        );
        return true;
      }
      listSetter((prev) => prev.filter((item) => item.id !== tempId));
      toast.error(res.error || errorFallback);
      return false;
    } catch (err) {
      listSetter((prev) => prev.filter((item) => item.id !== tempId));
      toast.error(formatErrorMessage(err, errorFallback));
      return false;
    }
  }

  async function runUpdateMasterData<T extends { id: string; updatedAt: string }, R extends { success: boolean; error?: string }>(
    currentList: T[],
    listSetter: React.Dispatch<React.SetStateAction<T[]>>,
    id: string,
    patch: Partial<T>,
    actionFn: (id: string, patch: Partial<T>) => Promise<R>,
    errorFallback: string
  ): Promise<boolean> {
    const original = currentList.find((item) => item.id === id);
    listSetter((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: getTodayDateString() } : item
      )
    );
    try {
      const res = await actionFn(id, patch);
      if (!res.success) {
        if (original) {
          listSetter((prev) => prev.map((item) => (item.id === id ? original : item)));
        }
        toast.error(res.error || errorFallback);
        return false;
      }
      return true;
    } catch (err) {
      if (original) {
        listSetter((prev) => prev.map((item) => (item.id === id ? original : item)));
      }
      toast.error(formatErrorMessage(err, errorFallback));
      return false;
    }
  }

  async function runDeleteMasterData<T extends { id: string }, R extends { success: boolean; error?: string }>(
    currentList: T[],
    listSetter: React.Dispatch<React.SetStateAction<T[]>>,
    id: string,
    actionFn: (id: string) => Promise<R>,
    errorFallback: string
  ): Promise<boolean> {
    const original = currentList.find((item) => item.id === id);
    listSetter((prev) => prev.filter((item) => item.id !== id));
    try {
      const res = await actionFn(id);
      if (!res.success) {
        if (original) {
          listSetter((prev) => [...prev, original]);
        }
        toast.error(res.error || errorFallback);
        return false;
      }
      return true;
    } catch (err) {
      if (original) {
        listSetter((prev) => [...prev, original]);
      }
      toast.error(formatErrorMessage(err, errorFallback));
      return false;
    }
  }

  const addMasterDataRegion = (reg: Omit<Region, "id" | "updatedAt">) =>
    runAddMasterData(
      setRegions,
      "reg",
      reg,
      addMasterDataRegionAction,
      (res) => res.region,
      "Gagal menyimpan wilayah ke server"
    );
  const updateMasterDataRegion = (id: string, reg: Partial<Region>) =>
    runUpdateMasterData(
      regions,
      setRegions,
      id,
      reg,
      updateMasterDataRegionAction,
      "Gagal memperbarui data wilayah"
    );
  const deleteMasterDataRegion = (id: string) =>
    runDeleteMasterData(
      regions,
      setRegions,
      id,
      deleteMasterDataRegionAction,
      "Gagal menghapus wilayah"
    );

  const addMasterDataCompany = (cmp: Omit<Company, "id" | "updatedAt">) =>
    runAddMasterData(
      setCompanies,
      "cmp",
      cmp,
      addMasterDataCompanyAction,
      (res) => res.company,
      "Gagal menyimpan perusahaan ke server"
    );
  const updateMasterDataCompany = (id: string, cmp: Partial<Company>) =>
    runUpdateMasterData(
      companies,
      setCompanies,
      id,
      cmp,
      updateMasterDataCompanyAction,
      "Gagal memperbarui data perusahaan"
    );
  const deleteMasterDataCompany = (id: string) =>
    runDeleteMasterData(
      companies,
      setCompanies,
      id,
      deleteMasterDataCompanyAction,
      "Gagal menghapus perusahaan"
    );

  const addMasterDataLocation = (loc: Omit<EstateLocation, "id" | "updatedAt">) =>
    runAddMasterData(
      setLocations,
      "loc",
      loc,
      addMasterDataLocationAction,
      (res) => res.location,
      "Gagal menyimpan kebun ke server"
    );
  const updateMasterDataLocation = (id: string, loc: Partial<EstateLocation>) =>
    runUpdateMasterData(
      locations,
      setLocations,
      id,
      loc,
      updateMasterDataLocationAction,
      "Gagal memperbarui data kebun"
    );
  const deleteMasterDataLocation = (id: string) =>
    runDeleteMasterData(
      locations,
      setLocations,
      id,
      deleteMasterDataLocationAction,
      "Gagal menghapus kebun"
    );

  const addMasterDataBlock = (blk: Omit<EstateBlock, "id" | "updatedAt">) =>
    runAddMasterData(
      setBlocks,
      "blk",
      blk,
      addMasterDataBlockAction,
      (res) => res.block,
      "Gagal menyimpan blok kebun ke server"
    );
  const updateMasterDataBlock = (id: string, blk: Partial<EstateBlock>) =>
    runUpdateMasterData(
      blocks,
      setBlocks,
      id,
      blk,
      updateMasterDataBlockAction,
      "Gagal memperbarui data blok kebun"
    );
  const deleteMasterDataBlock = (id: string) =>
    runDeleteMasterData(
      blocks,
      setBlocks,
      id,
      deleteMasterDataBlockAction,
      "Gagal menghapus blok kebun"
    );

  const addMasterDataMaterial = (mat: Omit<MaterialCatalogItem, "id" | "updatedAt">) =>
    runAddMasterData(
      setMaterials,
      "mat",
      mat,
      addMasterDataMaterialAction,
      (res) => res.material,
      "Gagal menyimpan katalog material ke server"
    );
  const updateMasterDataMaterial = (id: string, mat: Partial<MaterialCatalogItem>) =>
    runUpdateMasterData(
      materials,
      setMaterials,
      id,
      mat,
      updateMasterDataMaterialAction,
      "Gagal memperbarui katalog material"
    );
  const deleteMasterDataMaterial = (id: string) =>
    runDeleteMasterData(
      materials,
      setMaterials,
      id,
      deleteMasterDataMaterialAction,
      "Gagal menghapus item material"
    );

  const addMasterDataSupplier = (sup: Omit<Supplier, "id" | "updatedAt">) =>
    runAddMasterData(
      setSuppliers,
      "sup",
      sup,
      addMasterDataSupplierAction,
      (res) => res.supplier,
      "Gagal menyimpan rekanan/vendor ke server"
    );
  const updateMasterDataSupplier = (id: string, sup: Partial<Supplier>) =>
    runUpdateMasterData(
      suppliers,
      setSuppliers,
      id,
      sup,
      updateMasterDataSupplierAction,
      "Gagal memperbarui data rekanan/vendor"
    );
  const deleteMasterDataSupplier = (id: string) =>
    runDeleteMasterData(
      suppliers,
      setSuppliers,
      id,
      deleteMasterDataSupplierAction,
      "Gagal menghapus rekanan/vendor"
    );

  const addMasterDataUser = (user: Omit<AppUser, "id" | "updatedAt">) =>
    runAddMasterData(
      setUsers,
      "usr",
      user,
      addMasterDataUserAction,
      (res) => res.user,
      "Gagal menyimpan pengguna ke server"
    );
  const updateMasterDataUser = (id: string, user: Partial<AppUser>) =>
    runUpdateMasterData(
      users,
      setUsers,
      id,
      user,
      updateMasterDataUserAction,
      "Gagal memperbarui data pengguna"
    );

  const deleteMasterDataUser = async (id: string): Promise<boolean> => {
    const original = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));

    try {
      const res = await deleteMasterDataUserAction(id);
      if (!res.success) {
        if (original) {
          setUsers((prev) => [...prev, original]);
        }
        toast.error(res.error || "Gagal menghapus pengguna");
        return false;
      }

      if (res.deactivated && original) {
        setUsers((prev) => [
          ...prev,
          { ...original, status: "Inactive", updatedAt: getTodayDateString() },
        ]);
        toast.info(
          ("message" in res && typeof res.message === "string" && res.message) ||
            "Pengguna memiliki riwayat transaksi sehingga statusnya dinonaktifkan, bukan dihapus permanen."
        );
      }
      return true;
    } catch (err) {
      if (original) {
        setUsers((prev) => [...prev, original]);
      }
      toast.error(formatErrorMessage(err, "Gagal menghapus pengguna"));
      return false;
    }
  };

  const addApprovalMatrixRule = (rule: Omit<ApprovalMatrixRule, "id" | "updatedAt">) =>
    runAddMasterData(
      setApprovalMatrix,
      "rule",
      rule,
      addApprovalMatrixRuleAction,
      (res) => res.rule,
      "Gagal menyimpan tingkatan approval ke server"
    );
  const updateApprovalMatrixRule = (id: string, rule: Partial<ApprovalMatrixRule>) =>
    runUpdateMasterData(
      approvalMatrix,
      setApprovalMatrix,
      id,
      rule,
      updateApprovalMatrixRuleAction,
      "Gagal memperbarui tingkatan approval"
    );
  const deleteApprovalMatrixRule = (id: string) =>
    runDeleteMasterData(
      approvalMatrix,
      setApprovalMatrix,
      id,
      deleteApprovalMatrixRuleAction,
      "Gagal menghapus tingkatan approval"
    );

  const toggleApprovalLevel = async (tierId: string, levelIndex: number): Promise<boolean> => {
    const originalRule = approvalMatrix.find((r) => r.id === tierId);
    if (!originalRule) return false;

    const newLevels = [...originalRule.levels] as (ApprovalLevel | null)[];
    newLevels[levelIndex] =
      newLevels[levelIndex] !== null ? null : APPROVAL_LEVEL_ORDER[levelIndex];

    setApprovalMatrix((prev) =>
      prev.map((rule) =>
        rule.id === tierId
          ? { ...rule, levels: newLevels, updatedAt: getTodayDateString() }
          : rule
      )
    );

    try {
      const res = await updateApprovalMatrixAction(tierId, newLevels);
      if (!res.success) {
        setApprovalMatrix((prev) =>
          prev.map((rule) => (rule.id === tierId ? originalRule : rule))
        );
        toast.error(res.error || "Gagal memperbarui level matriks persetujuan.");
        return false;
      }
      return true;
    } catch (err) {
      setApprovalMatrix((prev) =>
        prev.map((rule) => (rule.id === tierId ? originalRule : rule))
      );
      toast.error(formatErrorMessage(err, "Gagal memperbarui level matriks persetujuan."));
      return false;
    }
  };

  const addMasterDataProjectCategory = (item: Omit<ProjectCategoryItem, "id" | "updatedAt">) =>
    runAddMasterData(
      setProjectCategories,
      "cat",
      item,
      addMasterDataProjectCategoryAction,
      (res) => res.category,
      "Gagal menyimpan kategori proyek ke server"
    );
  const updateMasterDataProjectCategory = (
    id: string,
    item: Partial<ProjectCategoryItem>
  ) =>
    runUpdateMasterData(
      projectCategories,
      setProjectCategories,
      id,
      item,
      updateMasterDataProjectCategoryAction,
      "Gagal memperbarui kategori proyek"
    );
  const deleteMasterDataProjectCategory = (id: string) =>
    runDeleteMasterData(
      projectCategories,
      setProjectCategories,
      id,
      deleteMasterDataProjectCategoryAction,
      "Gagal menghapus kategori proyek"
    );

  const addMasterDataProjectType = (item: Omit<ProjectTypeItem, "id" | "updatedAt">) =>
    runAddMasterData(
      setProjectTypes,
      "pt",
      item,
      addMasterDataProjectTypeAction,
      (res) => res.projectType,
      "Gagal menyimpan tipe proyek ke server"
    );
  const updateMasterDataProjectType = (id: string, item: Partial<ProjectTypeItem>) =>
    runUpdateMasterData(
      projectTypes,
      setProjectTypes,
      id,
      item,
      updateMasterDataProjectTypeAction,
      "Gagal memperbarui tipe proyek"
    );
  const deleteMasterDataProjectType = (id: string) =>
    runDeleteMasterData(
      projectTypes,
      setProjectTypes,
      id,
      deleteMasterDataProjectTypeAction,
      "Gagal menghapus tipe proyek"
    );

  const addMasterDataProcurementType = (item: Omit<ProcurementTypeItem, "id" | "updatedAt">) =>
    runAddMasterData(
      setProcurementTypes,
      "proc",
      item,
      addMasterDataProcurementTypeAction,
      (res) => res.procurementType,
      "Gagal menyimpan metode pengadaan ke server"
    );
  const updateMasterDataProcurementType = (
    id: string,
    item: Partial<ProcurementTypeItem>
  ) =>
    runUpdateMasterData(
      procurementTypes,
      setProcurementTypes,
      id,
      item,
      updateMasterDataProcurementTypeAction,
      "Gagal memperbarui metode pengadaan"
    );
  const deleteMasterDataProcurementType = (id: string) =>
    runDeleteMasterData(
      procurementTypes,
      setProcurementTypes,
      id,
      deleteMasterDataProcurementTypeAction,
      "Gagal menghapus metode pengadaan"
    );

  // =========================================================================
  // Pemeliharaan Sistem (Clear Demo Data & Reset Produksi)
  // =========================================================================

  const clearDemoData = async (): Promise<boolean> => {
    try {
      const res = await clearDemoDataAction();
      if (!res.success) {
        toast.error(res.message || "Gagal membersihkan data transaksi.");
        return false;
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("wm_toolkit_state_v1");
        localStorage.removeItem("wm_toolkit_state");
      } catch {
        // Abaikan error penyimpanan
      }
      await refreshFromDatabase();
      toast.success(res.message);
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal membersihkan data transaksi."));
      return false;
    }
  };

  const resetToEmptyProduction = async (confirmationText?: string): Promise<boolean> => {
    try {
      const res = await resetToEmptyProductionAction(confirmationText);
      if (!res.success) {
        toast.error(res.message || "Gagal melakukan reset produksi.");
        return false;
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("wm_toolkit_state_v1");
        localStorage.removeItem("wm_toolkit_state");
      } catch {
        // Abaikan error penyimpanan
      }
      await refreshFromDatabase();
      toast.success(res.message);
      return true;
    } catch (err) {
      toast.error(formatErrorMessage(err, "Gagal melakukan reset produksi."));
      return false;
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        isLoading,
        loadError,
        activeUserId,

        projects,
        afces,
        prs,
        pos,
        grs,
        vendorEvaluations,
        goodsHandovers,
        uspks,
        technicalEvaluations,
        spkContracts,
        comments,
        attachments,
        notifications,
        notificationSettings,
        unreadNotificationCount,
        auditLogs,
        dailyProgress,
        weeklyProgress,
        regions,
        companies,
        locations,
        blocks,
        materials,
        suppliers,
        users,
        approvalMatrix,
        projectCategories,
        projectTypes,
        procurementTypes,
        tableDensity,
        setTableDensity,

        userProfile,
        updateUserProfile,

        activeRole,
        isAdmin,
        isPic,
        isApprover,
        isViewer,
        canEditProjects,
        canApproveAfce,
        canManageSystem,
        isViewerOnly,

        addProject,
        updateProject,
        deleteProject,
        restoreProject,
        hardDeleteProject,
        emptyRecycleBin,
        reviseProjectSchedule,
        addWorkItem,
        updateWorkItem,
        deleteWorkItem,
        addBoqItem,
        deleteBoqItem,

        updateAfceDocument,
        syncAfceWithMatrix,
        submitAfceApproval,
        processAfceAction,
        softDeleteAfce,
        restoreAfce,

        createPr,
        softDeletePr,
        restorePr,
        recordVendorEvaluation,
        createPo,
        softDeletePo,
        restorePo,
        recordGoodsReceipt,
        recordGoodsHandover,

        createUspk,
        updateUspkStatus,
        softDeleteUspk,
        restoreUspk,
        recordTechnicalEvaluation,
        createSpkContract,
        updateSpkStatus,
        softDeleteSpk,
        restoreSpk,

        getSpkProgressSummary,
        addDailyProgress,
        addWeeklyProgress,

        addComment,
        deleteComment,
        addAttachment,
        deleteAttachment,

        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        updateNotificationSetting,
        runCronDeadlineCheck,

        addMasterDataRegion,
        updateMasterDataRegion,
        deleteMasterDataRegion,
        addMasterDataCompany,
        updateMasterDataCompany,
        deleteMasterDataCompany,
        addMasterDataLocation,
        updateMasterDataLocation,
        deleteMasterDataLocation,
        addMasterDataBlock,
        updateMasterDataBlock,
        deleteMasterDataBlock,
        addMasterDataMaterial,
        updateMasterDataMaterial,
        deleteMasterDataMaterial,
        addMasterDataSupplier,
        updateMasterDataSupplier,
        deleteMasterDataSupplier,
        addMasterDataUser,
        updateMasterDataUser,
        deleteMasterDataUser,
        addApprovalMatrixRule,
        updateApprovalMatrixRule,
        deleteApprovalMatrixRule,
        toggleApprovalLevel,
        addMasterDataProjectCategory,
        updateMasterDataProjectCategory,
        deleteMasterDataProjectCategory,
        addMasterDataProjectType,
        updateMasterDataProjectType,
        deleteMasterDataProjectType,
        addMasterDataProcurementType,
        updateMasterDataProcurementType,
        deleteMasterDataProcurementType,

        refreshFromDatabase,
        clearDemoData,
        resetToEmptyProduction,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState harus digunakan di dalam AppStateProvider.");
  }
  return context;
}
