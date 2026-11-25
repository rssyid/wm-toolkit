import { db } from "@/server/db";
import { formatActionError } from "@/server/errors";
import type {
  AFCEDocument,
  AppUser,
  ApprovalMatrixRule,
  AuditLog,
  Company,
  DailyProgressRecord,
  EstateBlock,
  EstateLocation,
  GoodsHandover,
  GoodsReceipt,
  MaterialCatalogItem,
  NotificationItem,
  NotificationSetting,
  ProcurementTypeItem,
  Project,
  ProjectAttachment,
  ProjectCategoryItem,
  ProjectComment,
  ProjectTypeItem,
  PurchaseOrder,
  PurchaseRequisition,
  Region,
  SPKContract,
  Supplier,
  TechnicalEvaluation,
  UserProfile,
  USPKItem,
  VendorEvaluation,
  WeeklyProgressRecord,
} from "@/types";

export interface InitialAppStateData {
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
  dailyProgress: DailyProgressRecord[];
  weeklyProgress: WeeklyProgressRecord[];
  comments: ProjectComment[];
  attachments: ProjectAttachment[];
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
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  notificationSettings: NotificationSetting[];
}

export type InitialAppStateResult =
  | {
      success: true;
      hasDbData: true;
      activeUserProfile: UserProfile | undefined;
      data: InitialAppStateData;
    }
  | {
      success: false;
      hasDbData: false;
      error: string;
    };

type RawRow = Record<string, any>;

interface CorePayload {
  activeUser: RawRow | null;
  projects: RawRow[];
  workItems: RawRow[];
  revisions: RawRow[];
  afces: RawRow[];
  afceLevels: RawRow[];
  afceRecords: RawRow[];
  prs: RawRow[];
  pos: RawRow[];
  poItems: RawRow[];
  grs: RawRow[];
  vendorEvals: RawRow[];
  goodsHandovers: RawRow[];
  uspks: RawRow[];
  techEvals: RawRow[];
  spks: RawRow[];
  users: RawRow[];
  locations: RawRow[];
  notifications: RawRow[];
  notificationSettings: RawRow[];
}

interface SecondaryPayload {
  boqItems: RawRow[];
  progressLogs: RawRow[];
  comments: RawRow[];
  attachments: RawRow[];
  regions: RawRow[];
  companies: RawRow[];
  blocks: RawRow[];
  materials: RawRow[];
  suppliers: RawRow[];
  matrixRules: RawRow[];
  categories: RawRow[];
  projectTypes: RawRow[];
  procurementTypes: RawRow[];
  auditLogs: RawRow[];
}

function toDateStr(val: string | Date | null | undefined): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function toIsoUtc(val: string | Date | null | undefined): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString();
  const s = String(val);
  if (s.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(s)) return s;
  return `${s}Z`;
}

function groupBy<T>(items: T[], getKey: (item: T) => string | null | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    const list = map.get(key);
    if (list) {
      list.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

const STATUS_MAP: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const AFCE_STATUS_MAP: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEED_REVISION: "Need Revision",
};

const PR_PO_STATUS_MAP: Record<string, string> = {
  DRAFT: "Draft",
  RELEASED: "Released",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

function mapAttachment(att: RawRow): ProjectAttachment {
  return {
    id: att.id,
    projectId: att.projectId,
    commentId: att.commentId || undefined,
    source: att.source,
    fileName: att.fileName,
    fileUrl: att.fileUrl,
    fileSize: att.fileSize || "",
    mimeType: att.mimeType || undefined,
    category: att.category || undefined,
    docNumber: att.docNumber || undefined,
    googleDriveFileId: att.googleDriveFileId || undefined,
    uploadedBy: att.uploadedBy,
    uploadedAt: toIsoUtc(att.uploadedAt),
  };
}

export async function loadInitialAppStateForUser(userId: string): Promise<InitialAppStateResult> {
  try {
    if (!userId) {
      return {
        success: false,
        hasDbData: false,
        error: "UNAUTHORIZED: Sesi Anda telah berakhir. Silakan login kembali.",
      };
    }

    // Gabungkan 28+ tabel menjadi 2 query SQL paralel untuk meminimalkan RTT ke Neon PostgreSQL
    const [coreRows, secondaryRows] = await Promise.all([
      db.$queryRaw<Array<{ payload: CorePayload }>>`
        SELECT json_build_object(
          'activeUser', (
            SELECT row_to_json(au) FROM (
              SELECT id, name, email, role, jabatan, "estateName", bio, "timeZone", "avatarUrl", "isActive", "updatedAt"
              FROM users WHERE id = ${userId}
            ) au
          ),
          'projects', coalesce((SELECT json_agg(p ORDER BY p."projectCode" ASC) FROM projects p), '[]'::json),
          'workItems', coalesce((SELECT json_agg(w) FROM work_items w), '[]'::json),
          'revisions', coalesce((SELECT json_agg(r ORDER BY r."revisionNumber" ASC) FROM schedule_revisions r), '[]'::json),
          'afces', coalesce((SELECT json_agg(a ORDER BY a."afceNumber" ASC) FROM afce a), '[]'::json),
          'afceLevels', coalesce((SELECT json_agg(l ORDER BY l.level ASC) FROM afce_approval_levels l), '[]'::json),
          'afceRecords', coalesce((SELECT json_agg(ar ORDER BY ar.timestamp ASC) FROM afce_approval_records ar), '[]'::json),
          'prs', coalesce((SELECT json_agg(pr ORDER BY pr."prNumber" ASC) FROM purchase_requisitions pr), '[]'::json),
          'pos', coalesce((SELECT json_agg(po ORDER BY po."poNumber" ASC) FROM purchase_orders po), '[]'::json),
          'poItems', coalesce((SELECT json_agg(pi) FROM po_items pi), '[]'::json),
          'grs', coalesce((SELECT json_agg(gr ORDER BY gr."receiptDate" DESC) FROM goods_receipts gr), '[]'::json),
          'vendorEvals', coalesce((SELECT json_agg(ve ORDER BY ve."evaluationDate" DESC) FROM vendor_evaluations ve), '[]'::json),
          'goodsHandovers', coalesce((SELECT json_agg(gh ORDER BY gh."handoverDate" DESC) FROM goods_handovers gh), '[]'::json),
          'uspks', coalesce((SELECT json_agg(u ORDER BY u."uspkNumber" ASC) FROM uspk u), '[]'::json),
          'techEvals', coalesce((SELECT json_agg(te ORDER BY te."evaluationDate" DESC) FROM technical_evaluations te), '[]'::json),
          'spks', coalesce((SELECT json_agg(s ORDER BY s."spkNumber" ASC) FROM spk s), '[]'::json),
          'users', coalesce((
            SELECT json_agg(us ORDER BY us.name ASC) FROM (
              SELECT id, name, email, role, jabatan, "estateName", bio, "timeZone", "avatarUrl", "isActive", "updatedAt"
              FROM users
            ) us
          ), '[]'::json),
          'locations', coalesce((SELECT json_agg(lc ORDER BY lc.code ASC) FROM locations lc), '[]'::json),
          'notifications', coalesce((SELECT json_agg(nt ORDER BY nt."createdAt" DESC) FROM notifications nt WHERE nt."userId" = ${userId}), '[]'::json),
          'notificationSettings', coalesce((SELECT json_agg(ns) FROM notification_settings ns WHERE ns."userId" = ${userId}), '[]'::json)
        ) AS payload
      `,
      db.$queryRaw<Array<{ payload: SecondaryPayload }>>`
        SELECT json_build_object(
          'boqItems', coalesce((SELECT json_agg(b) FROM boq_items b), '[]'::json),
          'progressLogs', coalesce((SELECT json_agg(pl ORDER BY pl."logDate" DESC) FROM progress_logs pl), '[]'::json),
          'comments', coalesce((SELECT json_agg(c ORDER BY c."createdAt" DESC) FROM comments c), '[]'::json),
          'attachments', coalesce((SELECT json_agg(att ORDER BY att."uploadedAt" DESC) FROM attachments att), '[]'::json),
          'regions', coalesce((SELECT json_agg(rg ORDER BY rg.code ASC) FROM regions rg), '[]'::json),
          'companies', coalesce((SELECT json_agg(cp ORDER BY cp.code ASC) FROM companies cp), '[]'::json),
          'blocks', coalesce((SELECT json_agg(bk ORDER BY bk.code ASC) FROM blocks bk), '[]'::json),
          'materials', coalesce((SELECT json_agg(mt ORDER BY mt."sapCode" ASC) FROM materials mt), '[]'::json),
          'suppliers', coalesce((SELECT json_agg(sp ORDER BY sp.code ASC) FROM suppliers sp), '[]'::json),
          'matrixRules', coalesce((SELECT json_agg(mr ORDER BY mr."minValue" ASC) FROM approval_matrix_rules mr), '[]'::json),
          'categories', coalesce((SELECT json_agg(ct ORDER BY ct.code ASC) FROM project_categories ct), '[]'::json),
          'projectTypes', coalesce((SELECT json_agg(pt ORDER BY pt.code ASC) FROM project_types pt), '[]'::json),
          'procurementTypes', coalesce((SELECT json_agg(pct ORDER BY pct.code ASC) FROM procurement_types pct), '[]'::json),
          'auditLogs', coalesce((
            SELECT json_agg(al ORDER BY al."createdAt" DESC) FROM (
              SELECT * FROM audit_logs ORDER BY "createdAt" DESC LIMIT 200
            ) al
          ), '[]'::json)
        ) AS payload
      `,
    ]);

    const core = coreRows[0]?.payload;
    const secondary = secondaryRows[0]?.payload;

    if (!core || !secondary || !core.activeUser || !core.activeUser.isActive) {
      return {
        success: false,
        hasDbData: false,
        error: "UNAUTHORIZED: Sesi Anda telah berakhir. Silakan login kembali.",
      };
    }

    const userNameById = new Map<string, string>();
    for (const u of core.users) {
      userNameById.set(u.id, u.name);
    }

    const workItemById = new Map<string, RawRow>();
    for (const wi of core.workItems) {
      workItemById.set(wi.id, wi);
    }

    const workItemsByProject = groupBy(core.workItems, (w) => w.projectId);
    const boqItemsByProject = groupBy(secondary.boqItems, (b) => b.projectId);
    const revisionsByProject = groupBy(core.revisions, (r) => r.projectId);
    const afceLevelsByAfce = groupBy(core.afceLevels, (l) => l.afceId);
    const afceRecordsByAfce = groupBy(core.afceRecords, (ar) => ar.afceId);
    const poItemsByPo = groupBy(core.poItems, (pi) => pi.poId);
    const attachmentsByComment = groupBy(secondary.attachments, (att) => att.commentId);

    const projects: Project[] = core.projects.map((p) => {
      const locIds = Array.isArray(p.locationIds)
        ? (p.locationIds as string[])
        : p.locationId
        ? [p.locationId]
        : [];
      const locNames = Array.isArray(p.locationNames)
        ? (p.locationNames as string[])
        : p.locationName
        ? [p.locationName]
        : [];
      const blkIds = Array.isArray(p.blockIds)
        ? (p.blockIds as string[])
        : p.blockId
        ? [p.blockId]
        : [];
      const blkCodes = Array.isArray(p.blockCodes)
        ? (p.blockCodes as string[])
        : p.blockCode
        ? [p.blockCode]
        : [];

      const pWorkItems = workItemsByProject.get(p.id) || [];
      const pBoqItems = boqItemsByProject.get(p.id) || [];
      const pRevisions = revisionsByProject.get(p.id) || [];

      return {
        id: p.id,
        code: p.projectCode,
        name: p.name,
        description: p.description || "",
        picId: p.picId || undefined,
        picName: p.picId ? userNameById.get(p.picId) : undefined,
        afceNumber: "",
        afceValue: 0,
        afceStatus: "Draft",
        approvalStatus: "",
        locationId: p.locationId || locIds[0] || "",
        locationName: p.locationName || locNames[0] || "",
        locationIds: locIds,
        locationNames: locNames,
        companyId: p.companyId || "",
        companyName: p.companyName || "",
        regionId: p.regionId || "",
        regionName: p.regionName || "",
        blockId: p.blockId || blkIds[0] || "",
        blockCode: p.blockCode || blkCodes[0] || "",
        blockIds: blkIds,
        blockCodes: blkCodes,
        projectCategoryId: p.projectCategoryId || "",
        projectCategoryName: p.projectCategoryName || "",
        projectType: p.projectType,
        procurementType: p.procurementType,
        status: (STATUS_MAP[p.status] || "Planned") as Project["status"],
        progress: p.progressPercent,
        baselineStartDate: toDateStr(p.baselineStartDate),
        baselineEndDate: toDateStr(p.baselineEndDate),
        targetEndDate: toDateStr(p.targetEndDate),
        durationDays: p.durationDays,
        scheduleVarianceDays: p.scheduleVarianceDays,
        ewsStatus: (p.ewsStatus || "Normal") as Project["ewsStatus"],
        lastUpdated: toDateStr(p.updatedAt),
        scheduleMatrix: p.scheduleMatrix || undefined,
        deletedAt: p.deletedAt ? toIsoUtc(p.deletedAt) : null,
        workItems: pWorkItems.map((wi) => ({
          id: wi.id,
          projectId: wi.projectId,
          name: wi.name,
          type: wi.type,
          weight: wi.weight,
          startDate: toDateStr(wi.startDate),
          endDate: toDateStr(wi.endDate),
          procurementType: wi.procurementType,
          progressMode: wi.progressMode,
          progress: wi.progress,
          status: (STATUS_MAP[wi.status] || "Planned") as Project["status"],
          phase: wi.phase,
          notes: wi.notes || undefined,
        })),
        surveyAndBoq: pBoqItems.map((b) => ({
          id: b.id,
          itemCode: b.itemCode,
          name: b.name,
          volume: b.volume,
          unit: b.unit,
          unitPrice: Number(b.unitPrice),
          totalPrice: Number(b.totalPrice),
          weight: b.weight,
          status: b.status,
        })),
        revisions: pRevisions.map((rev) => ({
          id: rev.id,
          revisionNumber: rev.revisionNumber,
          previousEndDate: toDateStr(rev.previousEndDate),
          newEndDate: toDateStr(rev.newEndDate),
          extendedWeeks: rev.extendedWeeks,
          reason: rev.reason,
          revisedAt: toDateStr(rev.revisedAt),
          approvalDate: rev.approvalDate ? toDateStr(rev.approvalDate) : undefined,
          approvedBy: rev.approvedBy || undefined,
          revisedBy: rev.revisedBy,
          approvalStatus: rev.approvalStatus,
          attachmentName: rev.attachmentName || undefined,
        })),
      };
    });

    const projectById = new Map<string, Project>();
    for (const p of projects) {
      projectById.set(p.id, p);
    }

    const afces: AFCEDocument[] = core.afces.map((a) => {
      const project = projectById.get(a.projectId);
      const levels = afceLevelsByAfce.get(a.id) || [];
      const records = afceRecordsByAfce.get(a.id) || [];
      return {
        id: a.id,
        afceNumber: a.afceNumber,
        projectId: a.projectId,
        projectCode: project?.code || "",
        projectName: project?.name || "",
        value: Number(a.amount),
        status: (AFCE_STATUS_MAP[a.status] || "Draft") as AFCEDocument["status"],
        currentLevel: a.currentLevel,
        requiredLevels: a.requiredLevels,
        currentApproverRole: a.currentApproverRole || "Water Management",
        submittedAt: a.submittedAt ? toDateStr(a.submittedAt) : undefined,
        approvedAt: a.approvedAt ? toDateStr(a.approvedAt) : undefined,
        sapDocNumber: a.sapDocNumber || "",
        sapScreenshotPlaceholder: a.sapScreenshotUrl || undefined,
        approvalMatrixLevels: levels.map((lvl) => ({
          id: lvl.id,
          level: lvl.level,
          code: lvl.code,
          label: lvl.label,
          isRequired: lvl.isRequired,
          status: lvl.status,
          approverName: lvl.approverName || undefined,
          approverJabatan: lvl.approverJabatan || undefined,
          decidedAt: lvl.decidedAt ? toDateStr(lvl.decidedAt) : undefined,
          note: lvl.note || undefined,
          sapDocNumber: lvl.sapDocNumber || undefined,
          sapEvidenceUrl: lvl.sapEvidenceUrl || undefined,
        })),
        history: records.map((h) => ({
          id: h.id,
          afceNumber: a.afceNumber,
          matrixLevelId: h.matrixLevelId || undefined,
          approverName: h.approverName,
          approverRole: h.approverRole,
          approverJabatan: h.approverJabatan || undefined,
          action: h.action,
          timestamp: toIsoUtc(h.timestamp),
          approvalDate: h.approvalDate ? toDateStr(h.approvalDate) : undefined,
          note: h.note || "",
          previousStatus: (AFCE_STATUS_MAP[h.previousStatus] || h.previousStatus) as AFCEDocument["status"],
          newStatus: (AFCE_STATUS_MAP[h.newStatus] || h.newStatus) as AFCEDocument["status"],
          sapDocNumber: h.sapDocNumber || undefined,
          sapEvidenceUrl: h.sapEvidenceUrl || undefined,
        })),
        deletedAt: a.deletedAt ? toIsoUtc(a.deletedAt) : null,
      };
    });

    const activeAfceByProject = new Map<string, AFCEDocument>();
    const fallbackAfceByProject = new Map<string, AFCEDocument>();
    for (const a of afces) {
      if (!fallbackAfceByProject.has(a.projectId)) {
        fallbackAfceByProject.set(a.projectId, a);
      }
      if (!a.deletedAt && !activeAfceByProject.has(a.projectId)) {
        activeAfceByProject.set(a.projectId, a);
      }
    }

    for (const p of projects) {
      const projectAfce = activeAfceByProject.get(p.id) || fallbackAfceByProject.get(p.id);
      if (projectAfce) {
        p.afceNumber = projectAfce.afceNumber;
        p.afceValue = projectAfce.value;
        p.afceStatus = projectAfce.status;
        p.approvalStatus =
          projectAfce.status === "Approved"
            ? "Disetujui Direksi"
            : projectAfce.status === "Rejected"
            ? "Ditolak"
            : projectAfce.status === "Need Revision"
            ? "Perlu Revisi"
            : projectAfce.status === "Draft"
            ? "Penyusunan Draf"
            : "Menunggu Persetujuan";
      }
    }

    const poCountByPr = new Map<string, number>();
    for (const po of core.pos) {
      if (po.prId && !po.deletedAt) {
        poCountByPr.set(po.prId, (poCountByPr.get(po.prId) || 0) + 1);
      }
    }

    const prs: PurchaseRequisition[] = core.prs.map((pr) => {
      const project = projectById.get(pr.projectId);
      const workItem = pr.workItemId ? workItemById.get(pr.workItemId) : undefined;
      return {
        id: pr.id,
        prNumber: pr.prNumber,
        projectId: pr.projectId,
        projectCode: project?.code || "",
        workItemId: pr.workItemId || "",
        workItemName: workItem?.name || "",
        releaseDate: pr.releaseDate ? toDateStr(pr.releaseDate) : "",
        prType: pr.prType || "Material",
        description: pr.description,
        status: (PR_PO_STATUS_MAP[pr.status] || "Draft") as PurchaseRequisition["status"],
        linkedPoCount: poCountByPr.get(pr.id) || 0,
        sapPrNumber: pr.sapPrNumber || "",
        attachmentName: pr.attachmentName || undefined,
        deletedAt: pr.deletedAt ? toIsoUtc(pr.deletedAt) : null,
        createdAt: toDateStr(pr.createdAt),
      };
    });

    const prById = new Map<string, PurchaseRequisition>();
    for (const pr of prs) {
      prById.set(pr.id, pr);
    }

    const pos: PurchaseOrder[] = core.pos.map((po) => {
      const project = projectById.get(po.projectId);
      const pr = po.prId ? prById.get(po.prId) : undefined;
      const items = poItemsByPo.get(po.id) || [];
      return {
        id: po.id,
        poNumber: po.poNumber,
        relatedPrId: po.prId || "",
        relatedPrNumber: pr?.prNumber || "",
        projectId: po.projectId,
        projectCode: project?.code || "",
        workItemId: po.workItemId || "",
        supplierId: po.supplierId || "",
        supplierName: po.supplierName,
        poDate: toDateStr(po.poDate),
        releaseDate: po.releaseDate ? toDateStr(po.releaseDate) : "",
        poValue: Number(po.poValue),
        status: (PR_PO_STATUS_MAP[po.status] || "Draft") as PurchaseOrder["status"],
        receiptProgressPercent: po.receiptProgressPercent,
        attachmentName: po.attachmentName || undefined,
        deletedAt: po.deletedAt ? toIsoUtc(po.deletedAt) : null,
        items: items.map((it) => ({
          id: it.id,
          poId: it.poId,
          materialName: it.materialName,
          sapMaterialCode: it.sapMaterialCode || "",
          volume: it.volume,
          unit: it.unit,
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.totalPrice),
          receivedVolume: it.receivedVolume,
          remainingVolume: it.remainingVolume,
          status: it.status,
        })),
      };
    });

    const poById = new Map<string, PurchaseOrder>();
    for (const po of pos) {
      poById.set(po.id, po);
    }

    const grs: GoodsReceipt[] = core.grs.map((g) => {
      const po = poById.get(g.poId);
      return {
        id: g.id,
        grNumber: g.grNumber,
        poId: g.poId,
        poNumber: po?.poNumber || "",
        receiptDate: toDateStr(g.receiptDate),
        itemId: g.itemId || "",
        materialName: g.materialName,
        receivedVolume: g.receivedVolume,
        unit: g.unit,
        notes: g.notes || "",
        attachmentName: g.attachmentName || undefined,
        recordedBy: g.recordedByName,
      };
    });

    const goodsHandovers: GoodsHandover[] = core.goodsHandovers.map((gh) => {
      const po = poById.get(gh.poId);
      return {
        id: gh.id,
        handoverNumber: gh.handoverNumber,
        poId: gh.poId,
        poNumber: po?.poNumber || "",
        projectId: gh.projectId,
        supplierId: gh.supplierId || undefined,
        supplierName: gh.supplierName,
        handoverDate: toDateStr(gh.handoverDate),
        receiverName: gh.receiverName,
        receiverJabatan: gh.receiverJabatan || undefined,
        giverName: gh.giverName,
        giverCompany: gh.giverCompany || undefined,
        notes: gh.notes || undefined,
        status: gh.status,
        attachmentName: gh.attachmentName || undefined,
        createdAt: toDateStr(gh.createdAt),
      };
    });

    const uspks: USPKItem[] = core.uspks.map((u) => {
      const project = projectById.get(u.projectId);
      const workItem = u.workItemId ? workItemById.get(u.workItemId) : undefined;
      return {
        id: u.id,
        afceId: u.afceId || undefined,
        projectId: u.projectId,
        projectCode: project?.code || "",
        workItemId: u.workItemId || undefined,
        workItemName: workItem?.name || undefined,
        uspkNumber: u.uspkNumber,
        vendorName: u.vendorName,
        vendorId: u.vendorId || undefined,
        scope: u.scope,
        value: Number(u.value),
        targetVolume: u.targetVolume ?? undefined,
        unit: u.unit || undefined,
        startDate: toDateStr(u.startDate),
        endDate: toDateStr(u.endDate),
        status: u.status,
        submittedAt: u.submittedAt ? toDateStr(u.submittedAt) : undefined,
        decidedAt: u.decidedAt ? toDateStr(u.decidedAt) : undefined,
        createdBy: u.createdBy,
        attachmentName: u.attachmentName || undefined,
        deletedAt: u.deletedAt ? toIsoUtc(u.deletedAt) : null,
        createdAt: toDateStr(u.createdAt),
      };
    });

    const uspkById = new Map<string, USPKItem>();
    for (const u of uspks) {
      uspkById.set(u.id, u);
    }

    const spkContracts: SPKContract[] = core.spks.map((spk) => {
      const uspk = uspkById.get(spk.uspkId);
      const project = projectById.get(spk.projectId);
      const workItem = spk.workItemId ? workItemById.get(spk.workItemId) : undefined;
      return {
        id: spk.id,
        uspkId: spk.uspkId,
        uspkNumber: uspk?.uspkNumber || "",
        projectId: spk.projectId,
        projectCode: project?.code || "",
        workItemId: spk.workItemId || undefined,
        workItemName: workItem?.name || undefined,
        spkNumber: spk.spkNumber,
        vendorName: spk.vendorName,
        vendorId: spk.vendorId || undefined,
        value: Number(spk.value),
        targetVolume: spk.targetVolume ?? undefined,
        unit: spk.unit || undefined,
        startDate: toDateStr(spk.startDate),
        endDate: toDateStr(spk.endDate),
        status: spk.status,
        releasedAt: spk.releasedAt ? toDateStr(spk.releasedAt) : undefined,
        attachmentName: spk.attachmentName || undefined,
        notes: spk.notes || undefined,
        createdBy: spk.createdBy,
        deletedAt: spk.deletedAt ? toIsoUtc(spk.deletedAt) : null,
        createdAt: toDateStr(spk.createdAt),
      };
    });

    const spkById = new Map<string, SPKContract>();
    for (const spk of spkContracts) {
      spkById.set(spk.id, spk);
    }

    const dailyProgress: DailyProgressRecord[] = [];
    const weeklyProgress: WeeklyProgressRecord[] = [];
    for (const log of secondary.progressLogs) {
      const wiName = workItemById.get(log.workItemId)?.name || "";
      const spk = log.spkId ? spkById.get(log.spkId) : undefined;
      const recorderName = log.createdById ? userNameById.get(log.createdById) : undefined;
      if (log.periodType === "DAILY") {
        dailyProgress.push({
          id: log.id,
          projectId: log.projectId,
          workItemId: log.workItemId,
          workItemName: wiName,
          periodType: "DAILY",
          spkId: log.spkId || undefined,
          spkNumber: spk?.spkNumber || undefined,
          contractorName: spk?.vendorName || undefined,
          date: toDateStr(log.logDate),
          activity: log.activity || "",
          targetVolume: log.targetVolume ?? undefined,
          plannedVolume: log.plannedVolume ?? undefined,
          actualVolume: log.actualVolume ?? undefined,
          remainingVolume: log.remainingVolume ?? undefined,
          cumulativeVolume: log.cumulativeVolume ?? undefined,
          unit: log.unit || undefined,
          progressPercent: log.progressPercent,
          manpower: log.manpower ?? undefined,
          weather: log.weather || "Cerah",
          notes: log.notes || "",
          photoName: log.photoName || undefined,
          photoUrl: log.photoUrl || undefined,
          createdBy: recorderName || undefined,
          recordedAt: toIsoUtc(log.recordedAt),
        });
      } else if (log.periodType === "WEEKLY") {
        weeklyProgress.push({
          id: log.id,
          projectId: log.projectId,
          workItemId: log.workItemId,
          workItemName: wiName,
          periodType: "WEEKLY",
          spkId: log.spkId || undefined,
          spkNumber: spk?.spkNumber || undefined,
          contractorName: spk?.vendorName || undefined,
          period: log.period || "",
          startDate: log.startDate ? toDateStr(log.startDate) : "",
          endDate: log.endDate ? toDateStr(log.endDate) : toDateStr(log.logDate),
          plannedProgress: log.plannedProgress || 0,
          actualProgress: log.actualProgress || 0,
          variance: log.variance || 0,
          achievement: log.achievement || 0,
          notes: log.notes || "",
          reportName: log.reportName || undefined,
          photoUrl: log.photoUrl || undefined,
          createdBy: recorderName || undefined,
          recordedAt: toIsoUtc(log.recordedAt),
        });
      }
    }

    const regions: Region[] = secondary.regions.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description || undefined,
      status: r.status,
      updatedAt: toDateStr(r.updatedAt),
    }));

    const companies: Company[] = secondary.companies.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      npwp: c.npwp || undefined,
      status: c.status,
      updatedAt: toDateStr(c.updatedAt),
    }));

    const locations: EstateLocation[] = core.locations.map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      regionId: l.regionId,
      companyId: l.companyId,
      district: l.district,
      hectares: l.hectares,
      status: l.status,
      updatedAt: toDateStr(l.updatedAt),
    }));

    const blocks: EstateBlock[] = secondary.blocks.map((b) => ({
      id: b.id,
      estateId: b.estateId,
      code: b.code,
      name: b.name,
      afdeling: b.afdeling,
      cropType: b.cropType,
      plantingYear: b.plantingYear,
      hectares: b.hectares,
      status: b.status,
      updatedAt: toDateStr(b.updatedAt),
    }));

    const materials: MaterialCatalogItem[] = secondary.materials.map((m) => ({
      id: m.id,
      sapCode: m.sapCode,
      name: m.name,
      category: m.category,
      unit: m.unit,
      standardPrice: Number(m.standardPrice),
      status: m.status,
      updatedAt: toDateStr(m.updatedAt),
    }));

    const suppliers: Supplier[] = secondary.suppliers.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category,
      contactPerson: s.contactPerson,
      phone: s.phone,
      npwp: s.npwp,
      rating: s.rating,
      status: s.status,
      updatedAt: toDateStr(s.updatedAt),
    }));

    const users: AppUser[] = core.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      systemRole: u.role,
      jabatan: u.jabatan || undefined,
      estateName: u.estateName || undefined,
      bio: u.bio || undefined,
      timeZone: (u.timeZone as "WIB" | "WITA" | "WIT") || "WIB",
      avatarUrl: u.avatarUrl || undefined,
      status: u.isActive ? "Active" : "Inactive",
      updatedAt: toDateStr(u.updatedAt),
    }));

    const activeUserRecord = core.activeUser;
    const activeUserProfile: UserProfile | undefined = activeUserRecord
      ? {
          fullName: activeUserRecord.name,
          email: activeUserRecord.email,
          username: activeUserRecord.id,
          role: activeUserRecord.jabatan || "",
          systemRole: activeUserRecord.role,
          timeZone: (activeUserRecord.timeZone as "WIB" | "WITA" | "WIT") || "WIB",
          selectedLocation: activeUserRecord.estateName || "",
          bio: activeUserRecord.bio || "",
          avatarUrl: activeUserRecord.avatarUrl || undefined,
        }
      : undefined;

    const approvalMatrix: ApprovalMatrixRule[] = secondary.matrixRules.map((m) => ({
      id: m.id,
      tierName: m.tierName,
      minValue: Number(m.minValue),
      maxValue: Number(m.maxValue),
      levels: m.levels || [],
      active: m.active,
      updatedAt: toDateStr(m.updatedAt),
    }));

    const projectCategories: ProjectCategoryItem[] = secondary.categories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description || "",
      status: c.status,
      updatedAt: toDateStr(c.updatedAt),
    }));

    const projectTypes: ProjectTypeItem[] = secondary.projectTypes.map((pt) => ({
      id: pt.id,
      code: pt.code,
      name: pt.name,
      description: pt.description || "",
      status: pt.status,
      updatedAt: toDateStr(pt.updatedAt),
    }));

    const procurementTypes: ProcurementTypeItem[] = secondary.procurementTypes.map((pct) => ({
      id: pct.id,
      code: pct.code,
      name: pct.name,
      description: pct.description || "",
      status: pct.status,
      updatedAt: toDateStr(pct.updatedAt),
    }));

    const comments: ProjectComment[] = secondary.comments.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      userId: c.userId,
      userName: c.userName,
      userRole: c.userRole || undefined,
      userAvatar: c.userAvatar || undefined,
      content: c.content,
      mentionedUserIds: c.mentionedUserIds || [],
      attachments: (attachmentsByComment.get(c.id) || []).map(mapAttachment),
      createdAt: toIsoUtc(c.createdAt),
    }));

    const attachments: ProjectAttachment[] = secondary.attachments.map(mapAttachment);

    const auditLogs: AuditLog[] = secondary.auditLogs.map((al) => ({
      id: al.id,
      userId: al.userId || "",
      userName: al.userName,
      userRole: al.userRole || undefined,
      userJabatan: al.userJabatan || undefined,
      action: al.action,
      entityType: al.entityType,
      entityId: al.entityId,
      entityTitle: al.entityTitle || undefined,
      projectId: al.projectId || undefined,
      projectName: al.projectName || undefined,
      beforeData: al.beforeData || null,
      afterData: al.afterData || null,
      ipAddress: al.ipAddress,
      userAgent: al.userAgent || undefined,
      createdAt: toIsoUtc(al.createdAt),
      notes: al.notes || undefined,
    }));

    const notifications: NotificationItem[] = core.notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: toIsoUtc(n.createdAt),
      linkUrl: n.linkUrl || undefined,
      projectId: n.projectId || undefined,
      projectCode: n.projectCode || undefined,
      projectName: n.projectName || undefined,
      priority: n.priority || "normal",
    }));

    const notificationSettings: NotificationSetting[] = core.notificationSettings.map((ns) => ({
      id: ns.id,
      userId: ns.userId,
      notificationType: ns.notificationType,
      isEnabled: ns.isEnabled,
    }));

    const vendorEvaluations: VendorEvaluation[] = core.vendorEvals.map((v) => {
      const pr = prById.get(v.prId);
      return {
        id: v.id,
        prId: v.prId,
        prNumber: pr?.prNumber || "",
        projectId: v.projectId || pr?.projectId || "",
        supplierId: v.supplierId || "",
        supplierName: v.supplierName,
        evaluatorId: v.evaluatorId || undefined,
        evaluatorName: v.evaluatorName,
        evaluatorJabatan: v.evaluatorJabatan || undefined,
        evaluationDate: toDateStr(v.evaluationDate),
        result: v.result,
        notes: v.notes,
        score: v.score ?? undefined,
        attachmentName: v.attachmentName || undefined,
        createdAt: toDateStr(v.createdAt),
      };
    });

    const technicalEvaluations: TechnicalEvaluation[] = core.techEvals.map((te) => {
      const uspk = uspkById.get(te.uspkId);
      return {
        id: te.id,
        uspkId: te.uspkId,
        uspkNumber: uspk?.uspkNumber || "",
        projectId: te.projectId || uspk?.projectId || "",
        evaluatorId: te.evaluatorId || undefined,
        evaluatorName: te.evaluatorName,
        evaluatorJabatan: te.evaluatorJabatan || undefined,
        evaluationDate: toDateStr(te.evaluationDate),
        result: te.result,
        rekomendasi: te.rekomendasi || undefined,
        notes: te.notes,
        score: te.score ?? undefined,
        attachmentName: te.attachmentName || undefined,
        createdAt: toDateStr(te.createdAt),
      };
    });

    return {
      success: true,
      hasDbData: true,
      activeUserProfile,
      data: {
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
        dailyProgress,
        weeklyProgress,
        comments,
        attachments,
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
        auditLogs,
        notifications,
        notificationSettings,
      },
    };
  } catch (error: unknown) {
    console.error("Gagal mengambil initial app state dari database:", error);
    return {
      success: false,
      hasDbData: false,
      error: formatActionError(error, "Gagal memuat data awal dari server."),
    };
  }
}
