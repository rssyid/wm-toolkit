"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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
  SystemSettings,
  DEFAULT_USER_PROFILE,
  DEFAULT_SYSTEM_SETTINGS,
  ProjectComment,
  ProjectAttachment,
  NotificationItem,
  NotificationSetting,
  NotificationType,
  AuditLog,
  AuditLogAction,
  AuditEntityType,
  SystemRole,
} from "@/types";
import { INITIAL_NOTIFICATION_SETTINGS } from "@/lib/mock-data/notifications";
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
import {
  findMatchingApprovalTier,
  generateMatrixLevelsFromTier,
  getInitialApprovalStatus,
  isAfceLevelsOutOfSync,
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
} from "@/server/actions/projects";
import {
  processAfceApprovalAction,
  submitAfceApprovalAction,
  updateAfceAction,
} from "@/server/actions/afce";
import {
  createPrAction,
  recordVendorEvaluationAction,
  createPoAction,
  recordGoodsReceiptAction,
  recordGoodsHandoverAction,
} from "@/server/actions/procurement";
import {
  createUspkAction,
  updateUspkStatusAction,
  recordTechnicalEvaluationAction,
  createSpkAction,
  updateSpkStatusAction,
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
} from "@/server/actions/notifications";
import {
  addMasterDataLocationAction,
  addMasterDataMaterialAction,
  addMasterDataSupplierAction,
  addMasterDataUserAction,
  updateApprovalMatrixAction,
} from "@/server/actions/master-data";

interface AppStateContextType {
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

  // Settings & Profile
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  restoreBackupFromJson: (data: any) => { success: boolean; message: string; counts?: Record<string, number> };

  // Roles & Permissions
  activeRole: SystemRole;
  setActiveRole: (role: SystemRole) => void;
  switchDemoUser: (user: AppUser, systemRole?: SystemRole) => void;
  isAdmin: boolean;
  isPic: boolean;
  isApprover: boolean;
  isViewer: boolean;
  canEditProjects: boolean;
  canApproveAfce: boolean;
  canManageSystem: boolean;
  isViewerOnly: boolean;

  // Actions
  addProject: (projectData: Partial<Project>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  restoreProject: (projectId: string) => void;
  hardDeleteProject: (projectId: string) => Promise<boolean>;
  emptyRecycleBin: () => Promise<boolean>;
  reviseProjectSchedule: (projectId: string, revision: Omit<ScheduleRevision, "id">) => void;
  updateAfceDocument: (afceId: string, updates: Partial<AFCEDocument>) => void;
  syncAfceWithMatrix: (afceId: string) => void;
  submitAfceApproval: (afceId: string, note: string, submissionDate?: string) => void;
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
  ) => void;
  createPr: (prData: Omit<PurchaseRequisition, "id" | "createdAt">) => void;
  recordVendorEvaluation: (evaluationData: Omit<VendorEvaluation, "id" | "createdAt">) => void;
  createPo: (poData: Omit<PurchaseOrder, "id" | "receiptProgressPercent">) => void;
  recordGoodsReceipt: (grData: Omit<GoodsReceipt, "id">) => void;
  recordGoodsHandover: (handoverData: Omit<GoodsHandover, "id" | "createdAt">) => void;
  createUspk: (data: Omit<USPKItem, "id" | "createdAt">) => void;
  updateUspkStatus: (id: string, status: USPKStatus, decidedAt?: string) => void;
  recordTechnicalEvaluation: (data: Omit<TechnicalEvaluation, "id" | "createdAt">) => void;
  createSpkContract: (data: Omit<SPKContract, "id" | "createdAt">) => void;
  updateSpkStatus: (id: string, status: SPKStatus) => void;
  getSpkProgressSummary: (spkId: string) => {
    spk?: SPKContract;
    targetVolume: number;
    realizedVolume: number;
    remainingVolume: number;
    percentComplete: number;
    unit: string;
  };
  addDailyProgress: (record: Omit<DailyProgressRecord, "id" | "recordedAt">) => void;
  addWeeklyProgress: (record: Omit<WeeklyProgressRecord, "id" | "recordedAt">) => void;

  // Comments & Attachments (Google Drive)
  addComment: (
    projectId: string,
    content: string,
    mentionedUserIds: string[],
    newAttachments?: ProjectAttachment[]
  ) => ProjectComment;
  deleteComment: (commentId: string) => void;
  addAttachment: (
    attachmentData: Omit<ProjectAttachment, "id" | "uploadedAt">
  ) => ProjectAttachment;
  deleteAttachment: (attachmentId: string) => void;

  // Notifications & Reminders (Gap #6 / F7)
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (
    item: Omit<NotificationItem, "id" | "createdAt">
  ) => NotificationItem;
  updateNotificationSetting: (
    type: NotificationType,
    isEnabled: boolean
  ) => void;
  simulateCronReminderCheck: () => { generatedCount: number };

  // Audit Logs (Gap #7 / docs/DATA-MODEL.md & docs/PRD.md F10)
  addAuditLog: (
    log: Omit<AuditLog, "id" | "createdAt" | "userId" | "userName" | "ipAddress"> & {
      id?: string;
      createdAt?: string;
      userId?: string;
      userName?: string;
      ipAddress?: string;
    }
  ) => AuditLog;

  // Master Data
  addMasterDataRegion: (reg: Omit<Region, "id" | "updatedAt">) => void;
  updateMasterDataRegion: (id: string, reg: Partial<Region>) => void;
  addMasterDataCompany: (cmp: Omit<Company, "id" | "updatedAt">) => void;
  updateMasterDataCompany: (id: string, cmp: Partial<Company>) => void;
  addMasterDataLocation: (loc: Omit<EstateLocation, "id" | "updatedAt">) => void;
  updateMasterDataLocation: (id: string, loc: Partial<EstateLocation>) => void;
  addMasterDataBlock: (blk: Omit<EstateBlock, "id" | "updatedAt">) => void;
  updateMasterDataBlock: (id: string, blk: Partial<EstateBlock>) => void;
  addMasterDataMaterial: (mat: Omit<MaterialCatalogItem, "id" | "updatedAt">) => void;
  updateMasterDataMaterial: (id: string, mat: Partial<MaterialCatalogItem>) => void;
  addMasterDataSupplier: (sup: Omit<Supplier, "id" | "updatedAt">) => void;
  updateMasterDataSupplier: (id: string, sup: Partial<Supplier>) => void;
  addMasterDataUser: (user: Omit<AppUser, "id" | "updatedAt">) => void;
  updateMasterDataUser: (id: string, user: Partial<AppUser>) => void;
  addApprovalMatrixRule: (rule: Omit<ApprovalMatrixRule, "id" | "updatedAt">) => void;
  updateApprovalMatrixRule: (id: string, rule: Partial<ApprovalMatrixRule>) => void;
  toggleApprovalLevel: (tierId: string, levelIndex: number) => void;
  addMasterDataProjectCategory: (item: Omit<ProjectCategoryItem, "id" | "updatedAt">) => void;
  updateMasterDataProjectCategory: (id: string, item: Partial<ProjectCategoryItem>) => void;
  addMasterDataProjectType: (item: Omit<ProjectTypeItem, "id" | "updatedAt">) => void;
  updateMasterDataProjectType: (id: string, item: Partial<ProjectTypeItem>) => void;
  addMasterDataProcurementType: (item: Omit<ProcurementTypeItem, "id" | "updatedAt">) => void;
  updateMasterDataProcurementType: (id: string, item: Partial<ProcurementTypeItem>) => void;

  resetToMockData: () => void;
  refreshFromDatabase: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  resetToEmptyProduction: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

const STORAGE_KEY = "wm_toolkit_state_v1";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
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
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>(INITIAL_NOTIFICATION_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgressRecord[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressRecord[]>([]);
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [locations, setLocations] = useState<EstateLocation[]>(INITIAL_LOCATIONS);
  const [blocks, setBlocks] = useState<EstateBlock[]>(INITIAL_BLOCKS);
  const [materials, setMaterials] = useState<MaterialCatalogItem[]>(INITIAL_MATERIALS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [approvalMatrix, setApprovalMatrix] = useState<ApprovalMatrixRule[]>(INITIAL_APPROVAL_MATRIX);
  const [projectCategories, setProjectCategories] = useState<ProjectCategoryItem[]>(INITIAL_PROJECT_CATEGORIES);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeItem[]>(INITIAL_PROJECT_TYPES);
  const [procurementTypes, setProcurementTypes] = useState<ProcurementTypeItem[]>(INITIAL_PROCUREMENT_TYPES);

  // User Profile & System Settings
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  };

  const updateSystemSettings = (updates: Partial<SystemSettings>) => {
    setSystemSettings((prev) => ({ ...prev, ...updates }));
  };

  const { data: session } = useSession();

  // Synchronize profile and role with active NextAuth session
  useEffect(() => {
    if (session?.user) {
      const u = session.user as any;
      const userRole = (u.role as SystemRole) || "VIEWER";
      setUserProfile((prev) => ({
        ...prev,
        fullName: u.name || prev.fullName,
        email: u.email || prev.email,
        username: u.id || prev.username,
        role: u.jabatan || prev.role,
        systemRole: userRole,
        selectedLocation: u.estateName || prev.selectedLocation,
      }));
    }
  }, [session]);

  const activeRole: SystemRole = (session?.user as any)?.role || userProfile.systemRole || "VIEWER";

  const setActiveRole = (_role: SystemRole) => {
    // Roles are strictly governed by server session and cannot be spoofed client-side
    console.warn("Peran pengguna ditentukan oleh sesi autentikasi dan tidak dapat dimodifikasi di browser.");
  };

  const switchDemoUser = (_user: AppUser, _targetRole?: SystemRole) => {
    // Role/user switching is disabled in production mode
    console.warn("Peralihan demo dinonaktifkan. Silakan login kembali dengan kredensial akun yang bersangkutan.");
  };

  const isAdmin = activeRole === "ADMIN";
  const isPic = activeRole === "PIC";
  const isApprover = activeRole === "APPROVER";
  const isViewer = activeRole === "VIEWER";
  const canEditProjects = activeRole === "PIC" || activeRole === "ADMIN";
  const canApproveAfce = activeRole === "APPROVER" || activeRole === "ADMIN";
  const canManageSystem = activeRole === "ADMIN";
  const isViewerOnly = activeRole === "VIEWER";

  const applyDbData = (d: any) => {
    if (d.projects && Array.isArray(d.projects)) setProjects(d.projects);
    if (d.afces && Array.isArray(d.afces)) setAfces(d.afces);
    if (d.prs && Array.isArray(d.prs)) setPrs(d.prs);
    if (d.pos && Array.isArray(d.pos)) setPos(d.pos);
    if (d.grs && Array.isArray(d.grs)) setGrs(d.grs);
    if (d.vendorEvaluations && Array.isArray(d.vendorEvaluations)) setVendorEvaluations(d.vendorEvaluations);
    if (d.goodsHandovers && Array.isArray(d.goodsHandovers)) setGoodsHandovers(d.goodsHandovers);
    if (d.uspks && Array.isArray(d.uspks)) setUspks(d.uspks);
    if (d.technicalEvaluations && Array.isArray(d.technicalEvaluations)) setTechnicalEvaluations(d.technicalEvaluations);
    if (d.spkContracts && Array.isArray(d.spkContracts)) setSpkContracts(d.spkContracts);
    if (d.dailyProgress && Array.isArray(d.dailyProgress)) setDailyProgress(d.dailyProgress);
    if (d.weeklyProgress && Array.isArray(d.weeklyProgress)) setWeeklyProgress(d.weeklyProgress);
    if (d.comments && Array.isArray(d.comments)) setComments(d.comments);
    if (d.attachments && Array.isArray(d.attachments)) setAttachments(d.attachments);
    if (d.regions && Array.isArray(d.regions)) setRegions(d.regions);
    if (d.companies && Array.isArray(d.companies)) setCompanies(d.companies);
    if (d.locations && Array.isArray(d.locations)) setLocations(d.locations);
    if (d.blocks && Array.isArray(d.blocks)) setBlocks(d.blocks);
    if (d.materials && Array.isArray(d.materials)) setMaterials(d.materials);
    if (d.suppliers && Array.isArray(d.suppliers)) setSuppliers(d.suppliers);
    if (d.users && Array.isArray(d.users)) setUsers(d.users);
    if (d.approvalMatrix && Array.isArray(d.approvalMatrix)) setApprovalMatrix(d.approvalMatrix);
    if (d.projectCategories && Array.isArray(d.projectCategories)) setProjectCategories(d.projectCategories);
    if (d.projectTypes && Array.isArray(d.projectTypes)) setProjectTypes(d.projectTypes);
    if (d.procurementTypes && Array.isArray(d.procurementTypes)) setProcurementTypes(d.procurementTypes);
    if (d.auditLogs && Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs);
    if (d.notifications && Array.isArray(d.notifications)) setNotifications(d.notifications);
    if (d.notificationSettings && Array.isArray(d.notificationSettings)) setNotificationSettings(d.notificationSettings);
  };

  const refreshFromDatabase = async () => {
    try {
      const res = await getInitialAppStateAction();
      if (res.success && res.hasDbData && res.data) {
        applyDbData(res.data);
      }
    } catch (e) {
      console.warn("Gagal menyegarkan data dari database:", e);
    }
  };

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.projects && Array.isArray(parsed.projects)) {
          setProjects(parsed.projects);
        }
        if (parsed.afces) setAfces(parsed.afces);
        if (parsed.prs) setPrs(parsed.prs);
        if (parsed.pos) setPos(parsed.pos);
        if (parsed.grs) setGrs(parsed.grs);
        if (parsed.vendorEvaluations) setVendorEvaluations(parsed.vendorEvaluations);
        if (parsed.goodsHandovers) setGoodsHandovers(parsed.goodsHandovers);
        if (parsed.uspks) setUspks(parsed.uspks);
        if (parsed.technicalEvaluations) setTechnicalEvaluations(parsed.technicalEvaluations);
        if (parsed.spkContracts) setSpkContracts(parsed.spkContracts);
        if (parsed.comments) setComments(parsed.comments);
        if (parsed.attachments) setAttachments(parsed.attachments);
        if (parsed.notifications) {
          if (parsed.projects && Array.isArray(parsed.projects) && parsed.projects.length === 0) {
            setNotifications([]);
          } else {
            setNotifications(parsed.notifications);
          }
        }
        if (parsed.notificationSettings) setNotificationSettings(parsed.notificationSettings);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.dailyProgress) setDailyProgress(parsed.dailyProgress);
        if (parsed.weeklyProgress) setWeeklyProgress(parsed.weeklyProgress);
        if (parsed.regions) setRegions(parsed.regions);
        if (parsed.companies) setCompanies(parsed.companies);
        if (parsed.locations) {
          const mergedLocations = parsed.locations.map((loc: any) => {
            const initL = INITIAL_LOCATIONS.find((il) => il.id === loc.id);
            return {
              ...loc,
              regionId: loc.regionId || initL?.regionId || (loc.region?.includes("Riau") ? "reg-2" : loc.region?.includes("Kalimantan") ? "reg-3" : "reg-1"),
              companyId: loc.companyId || initL?.companyId || "cmp-1",
            };
          });
          setLocations(mergedLocations);
        }
        if (parsed.blocks) {
          const existingIds = new Set(parsed.blocks.map((b: any) => b.id));
          const missingInitialBlocks = INITIAL_BLOCKS.filter((ib) => !existingIds.has(ib.id));
          const mergedBlocks = [
            ...parsed.blocks.map((blk: any) => {
              const initB = INITIAL_BLOCKS.find((ib) => ib.id === blk.id);
              return {
                ...blk,
                estateId: blk.estateId || initB?.estateId || "loc-1",
              };
            }),
            ...missingInitialBlocks,
          ];
          setBlocks(mergedBlocks);
        }
        if (parsed.materials) setMaterials(parsed.materials);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        if (parsed.users) setUsers(parsed.users);
          if (parsed.approvalMatrix) {
            // Migrate from old format (level1Role/level2Role/level3Role) → new levels[]
            const migrated = parsed.approvalMatrix.map((r: any) => {
              if (Array.isArray(r.levels)) return r;
              const levels: (ApprovalLevel | null)[] = Array(9).fill(null);
              if (r.level1Role) levels[0] = "WM";
              if (r.level2Role && r.level2Role !== "-") levels[1] = "EM";
              if (r.level3Role && r.level3Role !== "-") levels[2] = "GEM";
              return { id: r.id, tierName: r.tierName, minValue: r.minValue, maxValue: r.maxValue, levels, active: r.active, updatedAt: r.updatedAt };
            });
            setApprovalMatrix(migrated);
          }
        if (parsed.projectCategories) setProjectCategories(parsed.projectCategories);
        if (parsed.projectTypes) setProjectTypes(parsed.projectTypes);
        if (parsed.procurementTypes) setProcurementTypes(parsed.procurementTypes);
        if (parsed.tableDensity) setTableDensity(parsed.tableDensity);
        if (parsed.userProfile) setUserProfile((prev) => ({ ...prev, ...parsed.userProfile }));
        if (parsed.systemSettings) setSystemSettings((prev) => ({ ...prev, ...parsed.systemSettings }));
      }
    } catch {
      // Fallback to initial mock data
    }
    setMounted(true);

    // Sync with Neon PostgreSQL
    getInitialAppStateAction()
      .then((res) => {
        if (res.success && res.data) {
          applyDbData(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      const stateToSave = {
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
        userProfile,
        systemSettings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage quota
    }
  }, [
    mounted,
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
    dailyProgress,
    weeklyProgress,
    locations,
    materials,
    suppliers,
    users,
    approvalMatrix,
    projectCategories,
    projectTypes,
    procurementTypes,
    tableDensity,
    userProfile,
    systemSettings,
  ]);

  const restoreBackupFromJson = (raw: any): { success: boolean; message: string; counts?: Record<string, number> } => {
    try {
      const data = raw?.data && typeof raw.data === "object" ? raw.data : raw;
      if (!data || typeof data !== "object") {
        return { success: false, message: "Format berkas cadangan JSON tidak valid." };
      }

      let restoredItemsCount = 0;
      const counts: Record<string, number> = {};

      if (Array.isArray(data.projects)) {
        setProjects(data.projects);
        counts.projects = data.projects.length;
        restoredItemsCount += data.projects.length;
      }
      if (Array.isArray(data.afces)) {
        setAfces(data.afces);
        counts.afces = data.afces.length;
        restoredItemsCount += data.afces.length;
      }
      if (Array.isArray(data.prs)) {
        setPrs(data.prs);
        counts.prs = data.prs.length;
      }
      if (Array.isArray(data.pos)) {
        setPos(data.pos);
        counts.pos = data.pos.length;
      }
      if (Array.isArray(data.grs)) {
        setGrs(data.grs);
        counts.grs = data.grs.length;
      }
      if (Array.isArray(data.vendorEvaluations)) {
        setVendorEvaluations(data.vendorEvaluations);
        counts.vendorEvaluations = data.vendorEvaluations.length;
      }
      if (Array.isArray(data.goodsHandovers)) {
        setGoodsHandovers(data.goodsHandovers);
        counts.goodsHandovers = data.goodsHandovers.length;
      }
      if (Array.isArray(data.uspks)) {
        setUspks(data.uspks);
        counts.uspks = data.uspks.length;
      }
      if (Array.isArray(data.technicalEvaluations)) {
        setTechnicalEvaluations(data.technicalEvaluations);
        counts.technicalEvaluations = data.technicalEvaluations.length;
      }
      if (Array.isArray(data.spkContracts)) {
        setSpkContracts(data.spkContracts);
        counts.spkContracts = data.spkContracts.length;
      }
      if (Array.isArray(data.dailyProgress)) setDailyProgress(data.dailyProgress);
      if (Array.isArray(data.weeklyProgress)) setWeeklyProgress(data.weeklyProgress);
      if (Array.isArray(data.regions)) setRegions(data.regions);
      if (Array.isArray(data.companies)) setCompanies(data.companies);
      if (Array.isArray(data.locations)) setLocations(data.locations);
      if (Array.isArray(data.blocks)) setBlocks(data.blocks);
      if (Array.isArray(data.materials)) setMaterials(data.materials);
      if (Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (Array.isArray(data.users)) setUsers(data.users);
      if (Array.isArray(data.approvalMatrix)) setApprovalMatrix(data.approvalMatrix);
      if (data.userProfile && typeof data.userProfile === "object") {
        setUserProfile((prev) => ({ ...prev, ...data.userProfile }));
      }
      if (data.systemSettings && typeof data.systemSettings === "object") {
        setSystemSettings((prev) => ({ ...prev, ...data.systemSettings }));
      }

      if (restoredItemsCount === 0 && !data.userProfile && !data.systemSettings) {
        return { success: false, message: "Berkas JSON tidak memiliki data proyek yang valid." };
      }

      return {
        success: true,
        message: `Cadangan berhasil dipulihkan (${counts.projects || 0} proyek, ${counts.afces || 0} AFCE).`,
        counts,
      };
    } catch (err: any) {
      return { success: false, message: `Gagal memulihkan cadangan: ${err?.message || "Format salah"}` };
    }
  };

  const resetToMockData = () => {
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
    setNotificationSettings(INITIAL_NOTIFICATION_SETTINGS);
    setAuditLogs([]);
    setDailyProgress([]);
    setWeeklyProgress([]);
    setRegions(INITIAL_REGIONS);
    setCompanies(INITIAL_COMPANIES);
    setLocations(INITIAL_LOCATIONS);
    setBlocks(INITIAL_BLOCKS);
    setMaterials(INITIAL_MATERIALS);
    setSuppliers(INITIAL_SUPPLIERS);
    setUsers(INITIAL_USERS);
    setApprovalMatrix(INITIAL_APPROVAL_MATRIX);
    setProjectCategories(INITIAL_PROJECT_CATEGORIES);
    setProjectTypes(INITIAL_PROJECT_TYPES);
    setProcurementTypes(INITIAL_PROCUREMENT_TYPES);
    setTableDensity("comfortable");
    setUserProfile(DEFAULT_USER_PROFILE);
    setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const addProject = (projectData: Partial<Project> & { sapDocNumber?: string }): string => {
    const newId = `prj-${Date.now()}`;
    const afceVal = projectData.afceValue || 250000000;
    const afceNum = projectData.afceNumber || `AFCE-2026-0${120 + projects.length}`;
    const initialAfceStatus = projectData.afceStatus || "Pending Approval";

    // 1. Dapatkan tier matriks approval yang cocok
    const matchedTier = findMatchingApprovalTier(afceVal, approvalMatrix);
    const matrixLevels: AFCEApprovalLevelItem[] = matchedTier
      ? generateMatrixLevelsFromTier(matchedTier, newId, initialAfceStatus)
      : [
          {
            id: `aml-${newId}-1`,
            level: 1,
            code: "WM",
            label: "Water Management",
            isRequired: true,
            status: (initialAfceStatus === "Approved"
              ? "Approved"
              : initialAfceStatus === "Pending Approval"
              ? "Pending"
              : "Waiting") as AFCEApprovalLevelItem["status"],
            approverJabatan: "Water Management",
          },
        ];

    const requiredLevels = matrixLevels.length;
    const currentLevel = initialAfceStatus === "Approved" ? requiredLevels : initialAfceStatus === "Pending Approval" ? 1 : 0;
    const currentApproverRole = matrixLevels[0]?.label || "Water Management";

    let initialApprovalStatus = projectData.approvalStatus;
    if (!initialApprovalStatus) {
      initialApprovalStatus = getInitialApprovalStatus(matrixLevels, initialAfceStatus);
    }

    const newProject: Project = {
      id: newId,
      code: projectData.code || `PRJ-2026-${String(projects.length + 1).padStart(3, "0")}`,
      name: projectData.name || "Proyek Baru",
      description: projectData.description || "",
      afceNumber: afceNum,
      afceValue: afceVal,
      afceStatus: initialAfceStatus,
      approvalStatus: initialApprovalStatus,
      locationId: projectData.locationId || locations[0].id,
      locationName: projectData.locationName || locations[0].name,
      locationIds: projectData.locationIds || [projectData.locationId || locations[0].id],
      locationNames: projectData.locationNames || [projectData.locationName || locations[0].name],
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
      projectType: projectData.projectType || "Physical Work",
      procurementType: projectData.procurementType || "Tender",
      status: projectData.status || "Planned",
      progress: 0,
      baselineStartDate: projectData.baselineStartDate || new Date().toISOString().split("T")[0],
      baselineEndDate: projectData.baselineEndDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      targetEndDate: projectData.targetEndDate || projectData.baselineEndDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      durationDays: projectData.durationDays || 60,
      scheduleVarianceDays: 0,
      ewsStatus: "Normal",
      lastUpdated: new Date().toISOString().split("T")[0],
      revisions: [],
      workItems: projectData.workItems || [],
      surveyAndBoq: projectData.surveyAndBoq || [],
    };

    // Automatically create the linked AFCE document together with the project
    const newAfce: AFCEDocument = {
      id: `afce-${Date.now()}`,
      afceNumber: afceNum,
      projectId: newId,
      projectCode: newProject.code,
      projectName: newProject.name,
      value: afceVal,
      status: initialAfceStatus,
      currentLevel,
      requiredLevels,
      currentApproverRole,
      submittedAt: initialAfceStatus !== "Draft" ? new Date().toISOString().split("T")[0] : undefined,
      approvedAt:
        initialAfceStatus === "Approved"
          ? new Date().toISOString().split("T")[0]
          : undefined,
      sapDocNumber:
        projectData.sapDocNumber || `AFCE-SAP-${Date.now().toString().slice(-7)}`,
      sapScreenshotPlaceholder: `SAP_AFCE_${afceNum.replace(/[^0-9]/g, "")}.png`,
      approvalMatrixLevels: matrixLevels,
      history:
        initialAfceStatus === "Pending Approval"
          ? [
              {
                id: `rec-${Date.now()}`,
                afceNumber: afceNum,
                matrixLevelId: matrixLevels[0]?.id,
                approverName: "Dedi Setiawan, S.T.",
                approverRole: currentApproverRole,
                approverJabatan: currentApproverRole,
                action: "Submit",
                approvalDate: new Date().toISOString().split("T")[0],
                timestamp: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
                note: "Dokumen AFCE dibuat bersamaan dengan proyek baru dan diajukan sesuai matriks SOP.",
                previousStatus: "Draft",
                newStatus: "Pending Approval",
                sapDocNumber: projectData.sapDocNumber || `AFCE-SAP-${Date.now().toString().slice(-7)}`,
              },
            ]
          : initialAfceStatus === "Approved"
          ? matrixLevels.map((lvl, i) => ({
              id: `rec-${Date.now()}-${i}`,
              afceNumber: afceNum,
              matrixLevelId: lvl.id,
              approverName: i === 0 ? "Dedi Setiawan, S.T." : i === 1 ? "Budi Santoso, S.T." : "Ir. Ahmad Dahlan",
              approverRole: lvl.label,
              approverJabatan: lvl.label,
              action: "Approve" as const,
              approvalDate: new Date().toISOString().split("T")[0],
              timestamp: `${new Date().toISOString().split("T")[0]} 12:00`,
              note: `Disetujui Level ${lvl.level}: ${lvl.label} sesuai verifikasi SAP.`,
              previousStatus: "Pending Approval" as AFCEStatus,
              newStatus: (i === matrixLevels.length - 1 ? "Approved" : "Pending Approval") as AFCEStatus,
            }))
          : [],
    };

    setProjects((prev) => [newProject, ...prev]);
    setAfces((prev) => [newAfce, ...prev]);

    // Persist to Neon DB in background
    createProjectAction(newProject).catch((err) => console.warn("Sync DB error (createProjectAction):", err));

    // Record Immutable Audit Log
    addAuditLog({
      action: "CREATE",
      entityType: "PROJECT",
      entityId: newId,
      entityTitle: `${newProject.code} • ${newProject.name}`,
      projectId: newId,
      projectName: newProject.name,
      beforeData: null,
      afterData: {
        code: newProject.code,
        name: newProject.name,
        afceValue: newProject.afceValue,
        targetEndDate: newProject.targetEndDate,
        status: newProject.status,
      },
      ipAddress: "10.20.4.15",
      notes: "Inisiasi proyek baru dan penetapan baseline",
    });

    return newId;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates, lastUpdated: new Date().toISOString().split("T")[0] };
        return updated;
      })
    );
    updateProjectAction(id, updates).catch((err) => console.warn("Sync DB error (updateProjectAction):", err));
  };

  const deleteProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const nowIso = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, deletedAt: nowIso } : p))
    );
    deleteProjectAction(projectId).catch((err) => console.warn("Sync DB error (deleteProjectAction):", err));
    addAuditLog({
      action: "DELETE",
      entityType: "PROJECT",
      entityId: projectId,
      entityTitle: `Proyek ${project.code}`,
      projectId: project.id,
      projectName: project.name,
      beforeData: { deletedAt: null },
      afterData: { deletedAt: nowIso },
      notes: `Proyek ${project.code} (${project.name}) dipindahkan ke Recycle Bin`,
    });
    toast.success(`Proyek ${project.code} berhasil dipindahkan ke Recycle Bin.`);
  };

  const restoreProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const prevDeletedAt = project.deletedAt;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, deletedAt: null } : p))
    );
    restoreProjectAction(projectId).catch((err) => console.warn("Sync DB error (restoreProjectAction):", err));
    addAuditLog({
      action: "UPDATE",
      entityType: "PROJECT",
      entityId: projectId,
      entityTitle: `Proyek ${project.code}`,
      projectId: project.id,
      projectName: project.name,
      beforeData: { deletedAt: prevDeletedAt },
      afterData: { deletedAt: null },
      notes: `Proyek ${project.code} (${project.name}) dipulihkan dari Recycle Bin`,
    });
    toast.success(`Proyek ${project.code} berhasil dipulihkan dari Recycle Bin.`);
  };

  const hardDeleteProject = async (projectId: string): Promise<boolean> => {
    const project = projects.find((p) => p.id === projectId);
    const projectCode = project?.code || projectId;
    const projectName = project?.name || "";

    try {
      const res = await hardDeleteProjectAction(projectId);
      if (!res.success) {
        toast.error("Gagal menghapus proyek secara permanen.");
        return false;
      }

      // Remove project from state
      setProjects((prev) => prev.filter((p) => p.id !== projectId));

      // Cascade remove dependent entities from state
      const targetPoIds = new Set(pos.filter((po) => po.projectId === projectId).map((po) => po.id));
      setAfces((prev) => prev.filter((a) => a.projectId !== projectId));
      setPrs((prev) => prev.filter((pr) => pr.projectId !== projectId));
      setPos((prev) => prev.filter((po) => po.projectId !== projectId));
      setGrs((prev) => prev.filter((gr) => !targetPoIds.has(gr.poId)));
      setGoodsHandovers((prev) => prev.filter((gh) => gh.projectId !== projectId));
      setUspks((prev) => prev.filter((u) => u.projectId !== projectId));
      setSpkContracts((prev) => prev.filter((spk) => spk.projectId !== projectId));
      setDailyProgress((prev) => prev.filter((dp) => dp.projectId !== projectId));
      setWeeklyProgress((prev) => prev.filter((wp) => wp.projectId !== projectId));
      setComments((prev) => prev.filter((c) => c.projectId !== projectId));
      setAttachments((prev) => prev.filter((a) => a.projectId !== projectId));

      addAuditLog({
        action: "DELETE",
        entityType: "PROJECT",
        entityId: projectId,
        entityTitle: `Proyek ${projectCode}`,
        projectId: projectId,
        projectName: projectName,
        beforeData: project || null,
        afterData: null,
        notes: `Proyek ${projectCode} (${projectName}) dihapus permanen dari sistem.`,
      });

      toast.success(`Proyek ${projectCode} berhasil dihapus permanen dari sistem.`);
      return true;
    } catch (err: any) {
      console.error("Error in hardDeleteProject:", err);
      toast.error(err.message || "Gagal menghapus proyek permanen.");
      return false;
    }
  };

  const emptyRecycleBin = async (): Promise<boolean> => {
    try {
      const res = await emptyRecycleBinAction();
      if (!res.success) {
        toast.error("Gagal mengosongkan Recycle Bin.");
        return false;
      }

      const deletedProjectIds = new Set(
        projects.filter((p) => !!p.deletedAt).map((p) => p.id)
      );

      // Remove all deleted projects
      setProjects((prev) => prev.filter((p) => !p.deletedAt));

      // Remove dependent records
      const deletedPoIds = new Set(pos.filter((po) => deletedProjectIds.has(po.projectId)).map((po) => po.id));
      setAfces((prev) => prev.filter((a) => !deletedProjectIds.has(a.projectId)));
      setPrs((prev) => prev.filter((pr) => !deletedProjectIds.has(pr.projectId)));
      setPos((prev) => prev.filter((po) => !deletedProjectIds.has(po.projectId)));
      setGrs((prev) => prev.filter((gr) => !deletedPoIds.has(gr.poId)));
      setGoodsHandovers((prev) => prev.filter((gh) => !deletedProjectIds.has(gh.projectId)));
      setUspks((prev) => prev.filter((u) => !deletedProjectIds.has(u.projectId)));
      setSpkContracts((prev) => prev.filter((spk) => !deletedProjectIds.has(spk.projectId)));
      setDailyProgress((prev) => prev.filter((dp) => !deletedProjectIds.has(dp.projectId)));
      setWeeklyProgress((prev) => prev.filter((wp) => !deletedProjectIds.has(wp.projectId)));
      setComments((prev) => prev.filter((c) => !deletedProjectIds.has(c.projectId)));
      setAttachments((prev) => prev.filter((a) => !deletedProjectIds.has(a.projectId)));

      toast.success(`Recycle Bin berhasil dikosongkan (${res.count || 0} proyek dihapus permanen).`);
      return true;
    } catch (err: any) {
      console.error("Error in emptyRecycleBin:", err);
      toast.error(err.message || "Gagal mengosongkan Recycle Bin.");
      return false;
    }
  };

  const reviseProjectSchedule = (
    projectId: string,
    revision: Omit<ScheduleRevision, "id">
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newRev: ScheduleRevision = {
          ...revision,
          id: `rev-${Date.now()}`,
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
          lastUpdated: new Date().toISOString().split("T")[0],
        };
      })
    );
    reviseScheduleAction(projectId, revision).catch((err) => console.warn("Sync DB error (reviseScheduleAction):", err));
  };

  const updateAfceDocument = (afceId: string, updates: Partial<AFCEDocument>) => {
    setAfces((prev) =>
      prev.map((a) => {
        if (a.id !== afceId) return a;
        let matrixUpdates: Partial<AFCEDocument> = {};

        // Jika nilai berubah dan dokumen masih Draft atau belum ada approval apapun
        if (updates.value !== undefined && updates.value !== a.value) {
          const hasApprovedLevels =
            (a.approvalMatrixLevels || []).some((l) => l.status === "Approved") ||
            a.history.some((h) => h.action === "Approve");

          if (!hasApprovedLevels) {
            const matchedTier = findMatchingApprovalTier(updates.value, approvalMatrix);
            if (matchedTier) {
              const newLevels = generateMatrixLevelsFromTier(
                matchedTier,
                a.id,
                a.status === "Draft" ? "Draft" : "Pending Approval"
              );
              matrixUpdates = {
                approvalMatrixLevels: newLevels,
                requiredLevels: newLevels.length,
                currentLevel: a.status === "Draft" ? 0 : 1,
                currentApproverRole: newLevels[0]?.label || "Water Management",
              };
            }
          }
        }

        const updated: AFCEDocument = { ...a, ...updates, ...matrixUpdates };

        if (
          updates.value !== undefined ||
          updates.afceNumber !== undefined ||
          updates.status !== undefined ||
          matrixUpdates.approvalMatrixLevels !== undefined
        ) {
          updateProject(a.projectId, {
            ...(updates.value !== undefined ? { afceValue: updates.value } : {}),
            ...(updates.afceNumber !== undefined ? { afceNumber: updates.afceNumber } : {}),
            ...(updates.status !== undefined ? { afceStatus: updates.status } : {}),
            ...(matrixUpdates.currentApproverRole
              ? {
                  approvalStatus:
                    a.status === "Draft"
                      ? "Draft AFCE Preparation"
                      : `Waiting Level 1: ${matrixUpdates.currentApproverRole} Approval`,
                }
              : {}),
          });
        }
        return updated;
      })
    );
    updateAfceAction(afceId, updates).catch((err) => console.warn("Sync DB error (updateAfceAction):", err));
  };

  const syncAfceWithMatrix = (afceId: string) => {
    setAfces((prev) =>
      prev.map((a) => {
        if (a.id !== afceId) return a;
        const matchedTier = findMatchingApprovalTier(a.value, approvalMatrix);
        if (!matchedTier) return a;

        const activeCodes = matchedTier.levels.filter(Boolean) as ApprovalLevel[];
        const oldLevels = a.approvalMatrixLevels || [];

        // Rekonsiliasi level lama dengan level baru:
        // Jika level lama dengan kode yang sama sudah "Approved", pertahankan status approval-nya!
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
            id: existing?.id || `aml-${a.id}-${idx + 1}`,
            level: idx + 1,
            code,
            label,
            isRequired: true,
            status: "Waiting" as const,
            approverJabatan: label,
          };
        });

        const firstUnapprovedIdx = newLevels.findIndex((l) => l.status !== "Approved");
        let newStatus: AFCEStatus = a.status;
        let newCurrentLevel = 1;
        let newRole = newLevels[0]?.label || "Water Management";

        if (firstUnapprovedIdx === -1) {
          newStatus = "Approved";
          newCurrentLevel = newLevels.length;
          newRole = newLevels[newLevels.length - 1]?.label || "Direksi";
        } else {
          if (a.status !== "Draft") {
            newLevels[firstUnapprovedIdx].status = "Pending";
            newStatus = "Pending Approval";
            newCurrentLevel = firstUnapprovedIdx + 1;
            newRole = newLevels[firstUnapprovedIdx].label;
          } else {
            newStatus = "Draft";
            newCurrentLevel = 0;
            newRole = newLevels[0]?.label || "Water Management";
          }
        }

        const updated: AFCEDocument = {
          ...a,
          status: newStatus,
          currentLevel: newCurrentLevel,
          requiredLevels: newLevels.length,
          currentApproverRole: newRole,
          approvalMatrixLevels: newLevels,
        };

        updateProject(a.projectId, {
          afceStatus: newStatus,
          approvalStatus:
            newStatus === "Approved"
              ? `Approved by ${newRole}`
              : newStatus === "Draft"
              ? "Draft AFCE Preparation"
              : `Waiting Level ${newCurrentLevel}: ${newRole} Approval`,
        });

        toast.success(`Matriks dokumen ${a.afceNumber} berhasil disinkronkan dengan SOP terbaru.`);
        return updated;
      })
    );
  };

  const submitAfceApproval = (afceId: string, note: string, submissionDate?: string) => {
    const subDate = submissionDate || new Date().toISOString().split("T")[0];
    setAfces((prev) =>
      prev.map((a) => {
        if (a.id !== afceId) return a;

        let matrixLevels: AFCEApprovalLevelItem[] = [];
        if (a.approvalMatrixLevels && a.approvalMatrixLevels.length > 0) {
          matrixLevels = a.approvalMatrixLevels.map((lvl) => {
            if (lvl.status === "Need Revision" || lvl.status === "Rejected") {
              return { ...lvl, status: "Pending" as const };
            }
            return { ...lvl };
          });
          if (!matrixLevels.some((l) => l.status === "Pending")) {
            const firstWaitIdx = matrixLevels.findIndex((l) => l.status === "Waiting");
            if (firstWaitIdx !== -1) {
              matrixLevels[firstWaitIdx].status = "Pending";
            } else if (matrixLevels.length > 0 && !matrixLevels.some((l) => l.status === "Approved")) {
              matrixLevels[0].status = "Pending";
            }
          }
        } else {
          const matchedTier = findMatchingApprovalTier(a.value, approvalMatrix);
          matrixLevels = matchedTier
            ? generateMatrixLevelsFromTier(matchedTier, a.id, "Pending Approval")
            : [
                {
                  id: `aml-${a.id}-1`,
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

        const historyRecord = {
          id: `rec-${Date.now()}`,
          afceNumber: a.afceNumber,
          matrixLevelId: targetLevel?.id,
          approverName: "Dedi Setiawan, S.T.",
          approverRole: targetRole,
          approverJabatan: targetRole,
          action: "Submit" as const,
          approvalDate: subDate,
          timestamp: `${subDate} ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
          note,
          previousStatus: a.status,
          newStatus: "Pending Approval" as AFCEStatus,
          sapDocNumber: a.sapDocNumber,
        };

        const updated: AFCEDocument = {
          ...a,
          submittedAt: a.submittedAt || subDate,
          status: "Pending Approval",
          currentLevel: activeIdx + 1,
          requiredLevels: matrixLevels.length,
          currentApproverRole: targetRole,
          approvalMatrixLevels: matrixLevels,
          history: [...a.history, historyRecord],
        };

        updateProject(a.projectId, {
          afceStatus: "Pending Approval",
          approvalStatus: `Waiting Level ${activeIdx + 1}: ${targetRole} Approval`,
          lastUpdated: subDate,
        });

        return updated;
      })
    );
    submitAfceApprovalAction(afceId, note).catch((err) => console.warn("Sync DB error (submitAfceApprovalAction):", err));
  };

  const processAfceAction = (
    afceId: string,
    action: "Approve" | "Revise" | "Reject",
    note: string,
    approverName: string,
    approverRole: AFCEApprovalRole,
    approvalDate?: string,
    sapDocNumber?: string,
    sapEvidenceUrl?: string,
    targetLevelIndex?: number
  ) => {
    const actDate = approvalDate || new Date().toISOString().split("T")[0];
    setAfces((prev) =>
      prev.map((a) => {
        if (a.id !== afceId) return a;

        let nextStatus: AFCEStatus = a.status;
        let nextLevel = a.currentLevel;
        let nextRole = a.currentApproverRole;

        const currentLevels: AFCEApprovalLevelItem[] = a.approvalMatrixLevels && a.approvalMatrixLevels.length > 0
          ? a.approvalMatrixLevels.map((lvl) => ({ ...lvl }))
          : [
              {
                id: `aml-${a.id}-1`,
                level: 1,
                code: "WM",
                label: approverRole,
                isRequired: true,
                status: "Pending" as const,
                approverJabatan: approverRole,
              },
            ];

        // Tentukan indeks level yang sedang diapprove
        const currentIdx =
          targetLevelIndex !== undefined && targetLevelIndex >= 0 && targetLevelIndex < currentLevels.length
            ? targetLevelIndex
            : Math.max(0, Math.min(a.currentLevel - 1, currentLevels.length - 1));

        if (action === "Approve") {
          if (currentLevels[currentIdx]) {
            currentLevels[currentIdx] = {
              ...currentLevels[currentIdx],
              status: "Approved",
              approverName,
              approverJabatan: approverRole,
              decidedAt: actDate,
              note,
              sapDocNumber: sapDocNumber || a.sapDocNumber,
              sapEvidenceUrl: sapEvidenceUrl || currentLevels[currentIdx].sapEvidenceUrl,
            };
          }

          // Cek apakah seluruh level yang diwajibkan sudah approved
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
        } else if (action === "Reject") {
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
          id: `rec-${Date.now()}`,
          afceNumber: a.afceNumber,
          matrixLevelId: currentLevels[currentIdx]?.id,
          approverName,
          approverRole,
          approverJabatan: approverRole,
          action,
          approvalDate: actDate,
          timestamp: `${actDate} ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
          note,
          previousStatus: a.status,
          newStatus: nextStatus,
          sapDocNumber: sapDocNumber || a.sapDocNumber,
          sapEvidenceUrl,
        };

        const updated: AFCEDocument = {
          ...a,
          status: nextStatus,
          currentLevel: nextLevel,
          currentApproverRole: nextRole,
          approvedAt: nextStatus === "Approved" ? actDate : a.approvedAt,
          sapDocNumber: sapDocNumber || a.sapDocNumber,
          approvalMatrixLevels: currentLevels,
          history: [...a.history, historyRecord],
        };

        updateProject(a.projectId, {
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
        });

        // Record Audit Log for approval action
        addAuditLog({
          action: action === "Approve" ? "APPROVE" : action === "Reject" ? "REJECT" : "UPDATE",
          entityType: "AFCE",
          entityId: a.id,
          entityTitle: `${a.afceNumber} • Level ${currentIdx + 1} (${approverRole})`,
          projectId: a.projectId,
          projectName: a.projectName,
          beforeData: { status: a.status, currentLevel: a.currentLevel },
          afterData: { status: nextStatus, action, approver: approverName },
          ipAddress: "10.20.4.15",
          notes: `Pencatatan keputusan otorisasi SAP ${action} oleh ${approverName} (${approverRole})`,
        });

        return updated;
      })
    );
    processAfceApprovalAction({
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
    }).catch((err) => console.warn("Sync DB error (processAfceApprovalAction):", err));
  };

  const createPr = (prData: Omit<PurchaseRequisition, "id" | "createdAt">) => {
    const newPr: PurchaseRequisition = {
      ...prData,
      id: `pr-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPrs((prev) => [newPr, ...prev]);
    createPrAction(newPr).catch((err) => console.warn("Sync DB error (createPrAction):", err));
  };

  const recordVendorEvaluation = (
    evaluationData: Omit<VendorEvaluation, "id" | "createdAt">
  ) => {
    const newEval: VendorEvaluation = {
      ...evaluationData,
      id: `ve-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setVendorEvaluations((prev) => [newEval, ...prev]);
    recordVendorEvaluationAction(newEval).catch((err) => console.warn("Sync DB error (recordVendorEvaluationAction):", err));
  };

  const createPo = (poData: Omit<PurchaseOrder, "id" | "receiptProgressPercent">) => {
    const totalItems = poData.items.reduce((acc, it) => acc + it.volume, 0);
    const totalReceived = poData.items.reduce((acc, it) => acc + it.receivedVolume, 0);
    const progress = totalItems > 0 ? Math.round((totalReceived / totalItems) * 100) : 0;

    const newPo: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`,
      receiptProgressPercent: progress,
    };

    setPos((prev) => [newPo, ...prev]);
    createPoAction(newPo).catch((err) => console.warn("Sync DB error (createPoAction):", err));

    // Update PR linkedPoCount
    setPrs((prev) =>
      prev.map((pr) =>
        pr.id === poData.relatedPrId ? { ...pr, linkedPoCount: pr.linkedPoCount + 1 } : pr
      )
    );
  };

  const recordGoodsReceipt = (grData: Omit<GoodsReceipt, "id">) => {
    const newGr: GoodsReceipt = {
      ...grData,
      id: `gr-${Date.now()}`,
    };
    setGrs((prev) => [newGr, ...prev]);
    recordGoodsReceiptAction(newGr).catch((err) => console.warn("Sync DB error (recordGoodsReceiptAction):", err));

    // Update PO item volumes and item status
    setPos((prev) =>
      prev.map((po) => {
        if (po.id !== grData.poId) return po;

        const updatedItems = po.items.map((it) => {
          if (it.id !== grData.itemId) return it;
          const newReceived = it.receivedVolume + grData.receivedVolume;
          const newRemaining = Math.max(0, it.volume - newReceived);
          const newStatus =
            newRemaining === 0 ? "Received" : newReceived > 0 ? "Partially Received" : "Ordered";
          return {
            ...it,
            receivedVolume: newReceived,
            remainingVolume: newRemaining,
            status: newStatus as any,
          };
        });

        const totalVol = updatedItems.reduce((acc, it) => acc + it.volume, 0);
        const recVol = updatedItems.reduce((acc, it) => acc + it.receivedVolume, 0);
        const progress = totalVol > 0 ? Math.round((recVol / totalVol) * 100) : 0;

        return {
          ...po,
          items: updatedItems,
          receiptProgressPercent: progress,
        };
      })
    );
  };

  const recordGoodsHandover = (
    handoverData: Omit<GoodsHandover, "id" | "createdAt">
  ) => {
    const newHandover: GoodsHandover = {
      ...handoverData,
      id: `gh-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setGoodsHandovers((prev) => [newHandover, ...prev]);
    recordGoodsHandoverAction(newHandover).catch((err) => console.warn("Sync DB error (recordGoodsHandoverAction):", err));

    // If handover is COMPLETED and PO receipt is 100%, we can optionally mark PO as CLOSED
    if (handoverData.status === "COMPLETED") {
      setPos((prev) =>
        prev.map((po) => {
          if (po.id === handoverData.poId && po.receiptProgressPercent >= 100) {
            return { ...po, status: "Closed" };
          }
          return po;
        })
      );
    }
  };

  const createUspk = (data: Omit<USPKItem, "id" | "createdAt">) => {
    const newUspk: USPKItem = {
      ...data,
      id: `uspk-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUspks((prev) => [newUspk, ...prev]);
    createUspkAction(newUspk).catch((err) => console.warn("Sync DB error (createUspkAction):", err));
  };

  const updateUspkStatus = (id: string, status: USPKStatus, decidedAt?: string) => {
    setUspks((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        return {
          ...u,
          status,
          decidedAt: decidedAt || (status === "APPROVED" || status === "REJECTED" ? new Date().toISOString().split("T")[0] : u.decidedAt),
        };
      })
    );
    updateUspkStatusAction(id, status, decidedAt).catch((err) => console.warn("Sync DB error (updateUspkStatusAction):", err));
  };

  const recordTechnicalEvaluation = (
    data: Omit<TechnicalEvaluation, "id" | "createdAt">
  ) => {
    const newEval: TechnicalEvaluation = {
      ...data,
      id: `te-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTechnicalEvaluations((prev) => [newEval, ...prev]);
    recordTechnicalEvaluationAction(newEval).catch((err) => console.warn("Sync DB error (recordTechnicalEvaluationAction):", err));

    // Automatically synchronize USPK status according to evaluation recommendation
    setUspks((prev) =>
      prev.map((u) => {
        if (u.id !== data.uspkId) return u;
        const newStatus: USPKStatus = data.result === "RECOMMENDED" ? "APPROVED" : "REJECTED";
        return {
          ...u,
          status: newStatus,
          decidedAt: data.evaluationDate || new Date().toISOString().split("T")[0],
        };
      })
    );
  };

  const createSpkContract = (data: Omit<SPKContract, "id" | "createdAt">) => {
    const newSpk: SPKContract = {
      ...data,
      id: `spk-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSpkContracts((prev) => [newSpk, ...prev]);
    createSpkAction(newSpk).catch((err) => console.warn("Sync DB error (createSpkAction):", err));
  };

  const updateSpkStatus = (id: string, status: SPKStatus) => {
    setSpkContracts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    updateSpkStatusAction(id, status).catch((err) => console.warn("Sync DB error (updateSpkStatusAction):", err));
  };

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

  const addDailyProgress = (record: Omit<DailyProgressRecord, "id" | "recordedAt">) => {
    const newRec: DailyProgressRecord = {
      ...record,
      id: `dp-${Date.now()}`,
      recordedAt: new Date().toLocaleString("id-ID"),
    };
    setDailyProgress((prev) => [newRec, ...prev]);
    addDailyProgressAction(record).catch((err) => console.warn("Sync DB error (addDailyProgressAction):", err));

    // Update work item progress & recalculate project overall progress
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== record.projectId) return p;

        const updatedWorkItems = p.workItems.map((wi) => {
          if (wi.id !== record.workItemId) return wi;
          return {
            ...wi,
            progress: record.progressPercent,
            status: (record.progressPercent >= 100
              ? "Completed"
              : record.progressPercent > 0
              ? "In Progress"
              : "Planned") as any,
          };
        });

        // Recalculate project progress: sum(progress * weight / 100)
        const newOverallProgress = Math.min(
          100,
          Math.round(
            updatedWorkItems.reduce(
              (sum, wi) => sum + (wi.progress * (wi.weight || 0)) / 100,
              0
            )
          )
        );

        return {
          ...p,
          workItems: updatedWorkItems,
          progress: newOverallProgress,
          status: newOverallProgress >= 100 ? "Completed" : "In Progress",
          lastUpdated: new Date().toISOString().split("T")[0],
        };
      })
    );
  };

  const addWeeklyProgress = (record: Omit<WeeklyProgressRecord, "id" | "recordedAt">) => {
    const newRec: WeeklyProgressRecord = {
      ...record,
      id: `wp-${Date.now()}`,
      recordedAt: new Date().toLocaleString("id-ID"),
    };
    setWeeklyProgress((prev) => [newRec, ...prev]);
    addWeeklyProgressAction(record).catch((err) => console.warn("Sync DB error (addWeeklyProgressAction):", err));

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== record.projectId) return p;

        const updatedWorkItems = p.workItems.map((wi) => {
          if (wi.id !== record.workItemId) return wi;
          return {
            ...wi,
            progress: record.actualProgress,
            status: (record.actualProgress >= 100
              ? "Completed"
              : record.actualProgress > 0
              ? "In Progress"
              : "Planned") as any,
          };
        });

        const newOverallProgress = Math.min(
          100,
          Math.round(
            updatedWorkItems.reduce(
              (sum, wi) => sum + (wi.progress * (wi.weight || 0)) / 100,
              0
            )
          )
        );

        return {
          ...p,
          workItems: updatedWorkItems,
          progress: newOverallProgress,
          status: newOverallProgress >= 100 ? "Completed" : "In Progress",
          lastUpdated: new Date().toISOString().split("T")[0],
        };
      })
    );
  };

  // Comments & Attachments Handlers
  const addComment = (
    projectId: string,
    content: string,
    mentionedUserIds: string[],
    newAttachments?: ProjectAttachment[]
  ) => {
    const commentId = `cmt-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const createdComment: ProjectComment = {
      id: commentId,
      projectId,
      userId: userProfile.username || "usr-1",
      userName: userProfile.fullName,
      userRole: userProfile.role,
      content,
      mentionedUserIds,
      attachments: newAttachments || [],
      createdAt: nowIso,
    };

    setComments((prev) => [createdComment, ...prev]);

    // If there are attachments attached to this comment, register them in attachments state
    if (newAttachments && newAttachments.length > 0) {
      setAttachments((prev) => [...newAttachments, ...prev]);
    }

    addCommentAction({
      projectId,
      content,
      mentionedUserIds,
    }).catch((err) => console.warn("Sync DB error (addCommentAction):", err));

    // Trigger toast & in-app notification if user was mentioned
    if (mentionedUserIds.length > 0) {
      const proj = projects.find((p) => p.id === projectId);
      mentionedUserIds.forEach((uId) => {
        const targetUser = users.find((u) => u.id === uId);
        if (targetUser) {
          addNotification({
            userId: targetUser.id,
            type: "NEW_TASK",
            title: `Mention: Diskusi Proyek ${proj ? proj.code : ""}`,
            message: `${userProfile.fullName} menyebut Anda: "${content.slice(0, 75)}${content.length > 75 ? "..." : ""}"`,
            isRead: false,
            linkUrl: `/workspace/${projectId}/comments`,
            projectId: projectId,
            projectCode: proj?.code,
            projectName: proj?.name,
            priority: "info",
          });
        }
      });

      const mentionedNames = users
        .filter((u) => mentionedUserIds.includes(u.id))
        .map((u) => u.name)
        .join(", ");
      if (mentionedNames) {
        toast.info(`Notifikasi mention terkirim ke: ${mentionedNames}`);
      }
    }

    return createdComment;
  };

  const deleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setAttachments((prev) => prev.filter((a) => a.commentId !== commentId));
    deleteCommentAction(commentId).catch((err) => console.warn("Sync DB error (deleteCommentAction):", err));
  };

  const addAttachment = (
    attachmentData: Omit<ProjectAttachment, "id" | "uploadedAt">
  ) => {
    const newAtt: ProjectAttachment = {
      ...attachmentData,
      id: `att-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    setAttachments((prev) => [newAtt, ...prev]);
    addAttachmentAction({
      projectId: attachmentData.projectId,
      commentId: attachmentData.commentId || undefined,
      source: attachmentData.source || "UPLOAD",
      fileName: attachmentData.fileName,
      fileUrl: attachmentData.fileUrl,
      fileSize: attachmentData.fileSize || undefined,
      mimeType: attachmentData.mimeType || undefined,
      category: attachmentData.category,
      docNumber: attachmentData.docNumber,
      googleDriveFileId: (attachmentData as any).googleDriveFileId || undefined,
    }).catch((err) => console.warn("Sync DB error (addAttachmentAction):", err));
    return newAtt;
  };

  const deleteAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    deleteAttachmentAction(attachmentId).catch((err) => console.warn("Sync DB error (deleteAttachmentAction):", err));
  };

  // Notifications & Reminders Handlers (Gap #6 / F7)
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    markNotificationAsReadAction(id).catch((err) =>
      console.warn("Sync DB error (markNotificationAsReadAction):", err)
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("Semua notifikasi telah ditandai sebagai dibaca");
    markAllNotificationsAsReadAction().catch((err) =>
      console.warn("Sync DB error (markAllNotificationsAsReadAction):", err)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.info("Notifikasi telah dihapus");
    deleteNotificationAction(id).catch((err) =>
      console.warn("Sync DB error (deleteNotificationAction):", err)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.info("Semua notifikasi telah dibersihkan");
    clearAllNotificationsAction().catch((err) =>
      console.warn("Sync DB error (clearAllNotificationsAction):", err)
    );
  };

  const addNotification = (
    item: Omit<NotificationItem, "id" | "createdAt">
  ): NotificationItem => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return newNotif;
  };

  const updateNotificationSetting = (
    type: NotificationType,
    isEnabled: boolean
  ) => {
    setNotificationSettings((prev) =>
      prev.map((s) => (s.notificationType === type ? { ...s, isEnabled } : s))
    );
    toast.success("Pengaturan notifikasi berhasil diperbarui");
    updateNotificationSettingAction(type, isEnabled).catch((err) =>
      console.warn("Sync DB error (updateNotificationSettingAction):", err)
    );
  };

  const simulateCronReminderCheck = () => {
    const newNotifs: NotificationItem[] = [];
    const nowIso = new Date().toISOString();

    // 1. Check late projects (variance > 7 days or Critical)
    const delayed = projects.filter((p) => p.scheduleVarianceDays > 7);
    delayed.forEach((p) => {
      const exists = notifications.some(
        (n) => n.type === "LATE_PROJECT" && n.projectId === p.id && !n.isRead
      );
      if (!exists) {
        newNotifs.push({
          id: `notif-${Date.now()}-${p.id}`,
          userId: "usr-1",
          type: "LATE_PROJECT",
          title: `Peringatan Keterlambatan: ${p.name}`,
          message: `Proyek mengalami deviasi +${p.scheduleVarianceDays} hari dari baseline jadwal. Segera lakukan evaluasi adendum waktu.`,
          isRead: false,
          createdAt: nowIso,
          linkUrl: `/workspace/${p.id}/schedule`,
          projectId: p.id,
          projectCode: p.code,
          projectName: p.name,
          priority: "critical",
        });
      }
    });

    // 2. Check pending AFCE approvals
    const pendingAfceList = afces.filter((a) => a.status === "Pending Approval");
    pendingAfceList.forEach((a) => {
      const exists = notifications.some(
        (n) => n.type === "PENDING_APPROVAL" && n.projectId === a.projectId && !n.isRead
      );
      if (!exists) {
        newNotifs.push({
          id: `notif-${Date.now()}-${a.id}`,
          userId: "usr-1",
          type: "PENDING_APPROVAL",
          title: `Approval AFCE Tertunda: ${a.afceNumber}`,
          message: `Dokumen AFCE untuk ${a.projectName} menunggu persetujuan pada tingkat ${a.currentApproverRole}.`,
          isRead: false,
          createdAt: nowIso,
          linkUrl: `/workspace/${a.projectId}/afce`,
          projectId: a.projectId,
          projectCode: a.afceNumber,
          projectName: a.projectName,
          priority: "warning",
        });
      }
    });

    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
      toast.success(`Simulasi Cron: Ditemukan ${newNotifs.length} reminder & peringatan baru!`);
    } else {
      toast.info("Simulasi Cron: Semua jadwal & persetujuan sudah terpantau, tidak ada reminder baru.");
    }

    return { generatedCount: newNotifs.length };
  };

  // Add immutable Audit Log entry (Gap #7 / docs/DATA-MODEL.md & docs/PRD.md F10)
  const addAuditLog = (
    logData: Omit<AuditLog, "id" | "createdAt" | "userId" | "userName" | "ipAddress"> & {
      id?: string;
      createdAt?: string;
      userId?: string;
      userName?: string;
      ipAddress?: string;
    }
  ): AuditLog => {
    const newLog: AuditLog = {
      id: logData.id || `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      userId: logData.userId || "usr-1",
      userName: logData.userName || userProfile.fullName || "Budi Santoso, S.T.",
      userRole: logData.userRole || userProfile.role || "PIC",
      userJabatan: logData.userJabatan || "Manager Estate",
      action: logData.action,
      entityType: logData.entityType,
      entityId: logData.entityId,
      entityTitle: logData.entityTitle || `${logData.entityType} ${logData.entityId}`,
      projectId: logData.projectId,
      projectName: logData.projectName,
      beforeData: logData.beforeData || null,
      afterData: logData.afterData || null,
      ipAddress: logData.ipAddress || "10.20.4.15",
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "Mozilla/5.0",
      createdAt: logData.createdAt || new Date().toISOString(),
      notes: logData.notes || "",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  // Master Data Mutators
  const addMasterDataRegion = (reg: Omit<Region, "id" | "updatedAt">) => {
    const newReg: Region = {
      ...reg,
      id: `reg-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setRegions((prev) => [...prev, newReg]);
  };

  const updateMasterDataRegion = (id: string, reg: Partial<Region>) => {
    setRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...reg, updatedAt: new Date().toISOString().split("T")[0] } : r))
    );
  };

  const addMasterDataCompany = (cmp: Omit<Company, "id" | "updatedAt">) => {
    const newCmp: Company = {
      ...cmp,
      id: `cmp-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setCompanies((prev) => [...prev, newCmp]);
  };

  const updateMasterDataCompany = (id: string, cmp: Partial<Company>) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...cmp, updatedAt: new Date().toISOString().split("T")[0] } : c))
    );
  };

  const addMasterDataLocation = (loc: Omit<EstateLocation, "id" | "updatedAt">) => {
    const newLoc: EstateLocation = {
      ...loc,
      id: `loc-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setLocations((prev) => [...prev, newLoc]);
    addMasterDataLocationAction(newLoc).catch((err) => console.warn("Sync DB error (addMasterDataLocationAction):", err));
  };

  const updateMasterDataLocation = (id: string, loc: Partial<EstateLocation>) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...loc, updatedAt: new Date().toISOString().split("T")[0] } : l))
    );
  };

  const addMasterDataBlock = (blk: Omit<EstateBlock, "id" | "updatedAt">) => {
    const newBlk: EstateBlock = {
      ...blk,
      id: `blk-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setBlocks((prev) => [...prev, newBlk]);
  };

  const updateMasterDataBlock = (id: string, blk: Partial<EstateBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...blk, updatedAt: new Date().toISOString().split("T")[0] } : b))
    );
  };

  const addMasterDataMaterial = (mat: Omit<MaterialCatalogItem, "id" | "updatedAt">) => {
    const newMat: MaterialCatalogItem = {
      ...mat,
      id: `mat-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setMaterials((prev) => [...prev, newMat]);
    addMasterDataMaterialAction(newMat).catch((err) => console.warn("Sync DB error (addMasterDataMaterialAction):", err));
  };

  const updateMasterDataMaterial = (id: string, mat: Partial<MaterialCatalogItem>) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...mat, updatedAt: new Date().toISOString().split("T")[0] } : m))
    );
  };

  const addMasterDataSupplier = (sup: Omit<Supplier, "id" | "updatedAt">) => {
    const newSup: Supplier = {
      ...sup,
      id: `sup-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setSuppliers((prev) => [...prev, newSup]);
    addMasterDataSupplierAction(newSup).catch((err) => console.warn("Sync DB error (addMasterDataSupplierAction):", err));
  };

  const updateMasterDataSupplier = (id: string, sup: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...sup, updatedAt: new Date().toISOString().split("T")[0] } : s))
    );
  };

  const addMasterDataUser = (user: Omit<AppUser, "id" | "updatedAt">) => {
    const newUser: AppUser = {
      ...user,
      id: `usr-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);
    addMasterDataUserAction(newUser).catch((err) => console.warn("Sync DB error (addMasterDataUserAction):", err));
  };

  const updateMasterDataUser = (id: string, user: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...user, updatedAt: new Date().toISOString().split("T")[0] } : u))
    );
  };

  const addApprovalMatrixRule = (rule: Omit<ApprovalMatrixRule, "id" | "updatedAt">) => {
    const newRule: ApprovalMatrixRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setApprovalMatrix((prev) => [...prev, newRule]);
  };

  const updateApprovalMatrixRule = (id: string, rule: Partial<ApprovalMatrixRule>) => {
    setApprovalMatrix((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...rule, updatedAt: new Date().toISOString().split("T")[0] } : r))
    );
  };

  const toggleApprovalLevel = (tierId: string, levelIndex: number) => {
    setApprovalMatrix((prev) =>
      prev.map((rule) => {
        if (rule.id !== tierId) return rule;
        const newLevels = [...rule.levels] as (ApprovalLevel | null)[];
        // Simple toggle — no sequential enforcement, no cascade
        if (newLevels[levelIndex] !== null) {
          newLevels[levelIndex] = null;
        } else {
          newLevels[levelIndex] = APPROVAL_LEVEL_ORDER[levelIndex];
        }
        updateApprovalMatrixAction(tierId, newLevels).catch((err) => console.warn("Sync DB error (updateApprovalMatrixAction):", err));
        return { ...rule, levels: newLevels, updatedAt: new Date().toISOString().split("T")[0] };
      })
    );
  };

  const addMasterDataProjectCategory = (item: Omit<ProjectCategoryItem, "id" | "updatedAt">) => {
    const newItem: ProjectCategoryItem = {
      ...item,
      id: `cat-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setProjectCategories((prev) => [newItem, ...prev]);
  };

  const updateMasterDataProjectCategory = (id: string, item: Partial<ProjectCategoryItem>) => {
    setProjectCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...item, updatedAt: new Date().toISOString().split("T")[0] } : c))
    );
  };

  const addMasterDataProjectType = (item: Omit<ProjectTypeItem, "id" | "updatedAt">) => {
    const newItem: ProjectTypeItem = {
      ...item,
      id: `pt-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setProjectTypes((prev) => [...prev, newItem]);
  };

  const updateMasterDataProjectType = (id: string, item: Partial<ProjectTypeItem>) => {
    setProjectTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...item, updatedAt: new Date().toISOString().split("T")[0] } : t))
    );
  };

  const addMasterDataProcurementType = (item: Omit<ProcurementTypeItem, "id" | "updatedAt">) => {
    const newItem: ProcurementTypeItem = {
      ...item,
      id: `pct-${Date.now()}`,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setProcurementTypes((prev) => [...prev, newItem]);
  };

  const updateMasterDataProcurementType = (id: string, item: Partial<ProcurementTypeItem>) => {
    setProcurementTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...item, updatedAt: new Date().toISOString().split("T")[0] } : t))
    );
  };

  const clearDemoData = async () => {
    const res = await clearDemoDataAction();
    if (res.success) {
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
      setDailyProgress([]);
      setWeeklyProgress([]);
      setComments([]);
      setAttachments([]);
      setNotifications([]);
      await refreshFromDatabase();
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const resetToEmptyProduction = async () => {
    const res = await resetToEmptyProductionAction();
    if (res.success) {
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
      setDailyProgress([]);
      setWeeklyProgress([]);
      setComments([]);
      setAttachments([]);
      setAuditLogs([]);
      setNotifications([]);
      await refreshFromDatabase();
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <AppStateContext.Provider
      value={{
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
        systemSettings,
        updateSystemSettings,
        restoreBackupFromJson,

        activeRole,
        setActiveRole,
        switchDemoUser,
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
        updateAfceDocument,
        syncAfceWithMatrix,
        submitAfceApproval,
        processAfceAction,
        createPr,
        recordVendorEvaluation,
        createPo,
        recordGoodsReceipt,
        recordGoodsHandover,
        createUspk,
        updateUspkStatus,
        recordTechnicalEvaluation,
        createSpkContract,
        updateSpkStatus,
        getSpkProgressSummary,
        addDailyProgress,
        addWeeklyProgress,

        addComment,
        deleteComment,
        addAttachment,
        deleteAttachment,

        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        updateNotificationSetting,
        simulateCronReminderCheck,
        addAuditLog,

        addMasterDataRegion,
        updateMasterDataRegion,
        addMasterDataCompany,
        updateMasterDataCompany,
        addMasterDataLocation,
        updateMasterDataLocation,
        addMasterDataBlock,
        updateMasterDataBlock,
        addMasterDataMaterial,
        updateMasterDataMaterial,
        addMasterDataSupplier,
        updateMasterDataSupplier,
        addMasterDataUser,
        updateMasterDataUser,
        addApprovalMatrixRule,
        updateApprovalMatrixRule,
        toggleApprovalLevel,
        addMasterDataProjectCategory,
        updateMasterDataProjectCategory,
        addMasterDataProjectType,
        updateMasterDataProjectType,
        addMasterDataProcurementType,
        updateMasterDataProcurementType,

        resetToMockData,
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
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
