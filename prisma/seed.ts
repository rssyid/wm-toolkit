import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

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
} from "../src/lib/mock-data/master-data";
import { INITIAL_PROJECTS } from "../src/lib/mock-data/projects";
import { INITIAL_AFCES } from "../src/lib/mock-data/afce";
import {
  INITIAL_PRS,
  INITIAL_POS,
  INITIAL_GRS,
  INITIAL_VENDOR_EVALUATIONS,
  INITIAL_GOODS_HANDOVERS,
} from "../src/lib/mock-data/procurement";
import {
  INITIAL_USPKS,
  INITIAL_TECHNICAL_EVALUATIONS,
  INITIAL_SPK_CONTRACTS,
} from "../src/lib/mock-data/services";
import { INITIAL_COMMENTS, INITIAL_ATTACHMENTS } from "../src/lib/mock-data/comments";
import { INITIAL_NOTIFICATIONS, INITIAL_NOTIFICATION_SETTINGS } from "../src/lib/mock-data/notifications";
import { INITIAL_AUDIT_LOGS } from "../src/lib/mock-data/audit-logs";
import { INITIAL_DAILY_PROGRESS, INITIAL_WEEKLY_PROGRESS } from "../src/lib/mock-data/progress";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseDate(d?: string | null): Date {
  if (!d) return new Date();
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function mapProjectStatus(s?: string): "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED" {
  switch (s) {
    case "In Progress": return "IN_PROGRESS";
    case "On Hold": return "ON_HOLD";
    case "Completed": return "COMPLETED";
    case "Cancelled": return "CANCELLED";
    default: return "PLANNED";
  }
}

function mapAfceStatus(s?: string): "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "NEED_REVISION" {
  switch (s) {
    case "Pending Approval": return "PENDING_APPROVAL";
    case "Approved": return "APPROVED";
    case "Rejected": return "REJECTED";
    case "Need Revision": return "NEED_REVISION";
    default: return "DRAFT";
  }
}

function mapPrStatus(s?: string): "DRAFT" | "RELEASED" | "CLOSED" | "CANCELLED" {
  switch (s) {
    case "Released": return "RELEASED";
    case "Closed": return "CLOSED";
    case "Cancelled": return "CANCELLED";
    default: return "DRAFT";
  }
}

function mapPoStatus(s?: string): "DRAFT" | "RELEASED" | "CLOSED" | "CANCELLED" {
  switch (s) {
    case "Released": return "RELEASED";
    case "Closed": return "CLOSED";
    case "Cancelled": return "CANCELLED";
    default: return "DRAFT";
  }
}

function mapUspkStatus(s?: string): "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" {
  switch (s) {
    case "SUBMITTED": return "SUBMITTED";
    case "APPROVED": return "APPROVED";
    case "REJECTED": return "REJECTED";
    default: return "DRAFT";
  }
}

function mapSpkStatus(s?: string): "DRAFT" | "ACTIVE" | "CLOSED" {
  switch (s) {
    case "ACTIVE": return "ACTIVE";
    case "CLOSED": return "CLOSED";
    default: return "DRAFT";
  }
}

export async function seedDatabase() {
  console.log("🌱 Mulai seeding database Neon PostgreSQL...");
  const defaultPasswordHash = bcrypt.hashSync("wmtoolkit2026", 10);

  // 1. Master Data: Regions
  console.log("-> Seeding Regions...");
  for (const r of INITIAL_REGIONS) {
    await prisma.region.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, status: r.status },
      create: { id: r.id, code: r.code, name: r.name, description: r.description, status: r.status },
    });
  }

  // 2. Master Data: Companies
  console.log("-> Seeding Companies...");
  for (const c of INITIAL_COMPANIES) {
    await prisma.company.upsert({
      where: { code: c.code },
      update: { name: c.name, npwp: c.npwp, status: c.status },
      create: { id: c.id, code: c.code, name: c.name, npwp: c.npwp, status: c.status },
    });
  }

  // 3. Master Data: Locations
  console.log("-> Seeding Locations...");
  for (const loc of INITIAL_LOCATIONS) {
    await prisma.estateLocation.upsert({
      where: { code: loc.code },
      update: {
        name: loc.name,
        regionId: loc.regionId,
        companyId: loc.companyId,
        district: loc.district,
        hectares: loc.hectares,
        status: loc.status,
      },
      create: {
        id: loc.id,
        code: loc.code,
        name: loc.name,
        regionId: loc.regionId,
        companyId: loc.companyId,
        district: loc.district,
        hectares: loc.hectares,
        status: loc.status,
      },
    });
  }

  // 4. Master Data: Blocks
  console.log("-> Seeding Blocks...");
  for (const b of INITIAL_BLOCKS) {
    await prisma.estateBlock.upsert({
      where: { id: b.id },
      update: {
        estateId: b.estateId,
        code: b.code,
        name: b.name,
        afdeling: b.afdeling,
        cropType: b.cropType,
        plantingYear: b.plantingYear,
        hectares: b.hectares,
        status: b.status,
      },
      create: {
        id: b.id,
        estateId: b.estateId,
        code: b.code,
        name: b.name,
        afdeling: b.afdeling,
        cropType: b.cropType,
        plantingYear: b.plantingYear,
        hectares: b.hectares,
        status: b.status,
      },
    });
  }

  // 5. Master Data: Materials
  console.log("-> Seeding Materials...");
  for (const m of INITIAL_MATERIALS) {
    await prisma.materialCatalogItem.upsert({
      where: { sapCode: m.sapCode },
      update: {
        name: m.name,
        category: m.category,
        unit: m.unit,
        standardPrice: m.standardPrice,
        status: m.status,
      },
      create: {
        id: m.id,
        sapCode: m.sapCode,
        name: m.name,
        category: m.category,
        unit: m.unit,
        standardPrice: m.standardPrice,
        status: m.status,
      },
    });
  }

  // 6. Master Data: Suppliers
  console.log("-> Seeding Suppliers...");
  for (const s of INITIAL_SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        category: s.category,
        contactPerson: s.contactPerson,
        phone: s.phone,
        npwp: s.npwp,
        rating: s.rating,
        status: s.status,
      },
      create: {
        id: s.id,
        code: s.code,
        name: s.name,
        category: s.category,
        contactPerson: s.contactPerson,
        phone: s.phone,
        npwp: s.npwp,
        rating: s.rating,
        status: s.status,
      },
    });
  }

  // 7. Master Data: Categories, Project Types, Procurement Types, Approval Matrix
  console.log("-> Seeding Project Categories & Types...");
  for (const cat of INITIAL_PROJECT_CATEGORIES) {
    await prisma.projectCategoryItem.upsert({
      where: { code: cat.code },
      update: { name: cat.name, description: cat.description, status: cat.status },
      create: { id: cat.id, code: cat.code, name: cat.name, description: cat.description, status: cat.status },
    });
  }

  for (const pt of INITIAL_PROJECT_TYPES) {
    await prisma.projectTypeItem.upsert({
      where: { code: pt.code },
      update: { name: pt.name, description: pt.description, status: pt.status },
      create: { id: pt.id, code: pt.code, name: pt.name, description: pt.description, status: pt.status },
    });
  }

  for (const pct of INITIAL_PROCUREMENT_TYPES) {
    await prisma.procurementTypeItem.upsert({
      where: { code: pct.code },
      update: { name: pct.name, description: pct.description, status: pct.status },
      create: { id: pct.id, code: pct.code, name: pct.name, description: pct.description, status: pct.status },
    });
  }

  for (const matrix of INITIAL_APPROVAL_MATRIX) {
    await prisma.approvalMatrixRule.upsert({
      where: { id: matrix.id },
      update: {
        tierName: matrix.tierName,
        minValue: matrix.minValue,
        maxValue: matrix.maxValue,
        levels: matrix.levels as any,
        active: matrix.active,
      },
      create: {
        id: matrix.id,
        tierName: matrix.tierName,
        minValue: matrix.minValue,
        maxValue: matrix.maxValue,
        levels: matrix.levels as any,
        active: matrix.active,
      },
    });
  }

  // 8. Users
  console.log("-> Seeding Users...");
  const userList = [
    ...INITIAL_USERS,
    {
      id: "usr-admin",
      name: "Administrator WM-Toolkit",
      email: "admin@perkebunan.co.id",
      role: "Head Office",
      systemRole: "ADMIN" as const,
      jabatan: "Administrator Sistem Holding",
      estateName: "Direktorat HO Jakarta",
      status: "Active" as const,
      updatedAt: "2026-10-01",
    },
    {
      id: "usr-approver",
      name: "Ir. H. Syamsul Bahri, M.M.",
      email: "approver@perkebunan.co.id",
      role: "Regional Head",
      systemRole: "APPROVER" as const,
      jabatan: "Regional Head / Direksi Evaluator",
      estateName: "Kantor Wilayah Sumatera Utara",
      status: "Active" as const,
      updatedAt: "2026-10-01",
    },
    {
      id: "usr-viewer",
      name: "Auditor Stakeholder Eksternal",
      email: "viewer@perkebunan.co.id",
      role: "Head Office",
      systemRole: "VIEWER" as const,
      jabatan: "Tim Audit Kepatuhan & ESG",
      estateName: "Holding PalmCo",
      status: "Active" as const,
      updatedAt: "2026-10-01",
    },
  ];

  for (const u of userList) {
    const role = (u.systemRole as "ADMIN" | "PIC" | "APPROVER" | "VIEWER") || "PIC";
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role,
        jabatan: u.jabatan,
        estateName: u.estateName,
        isActive: u.status === "Active",
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        role,
        jabatan: u.jabatan,
        estateName: u.estateName,
        isActive: u.status === "Active",
      },
    });
  }

  // 9. Projects & Sub-items
  console.log("-> Seeding Projects, WorkItems, BOQ, & Revisions...");
  for (const p of INITIAL_PROJECTS) {
    const createdProject = await prisma.project.upsert({
      where: { projectCode: p.code },
      update: {
        name: p.name,
        description: p.description,
        status: mapProjectStatus(p.status),
        projectType: p.projectType,
        procurementType: p.procurementType,
        locationId: p.locationId,
        locationName: p.locationName,
        regionId: p.regionId,
        regionName: p.regionName,
        companyId: p.companyId,
        companyName: p.companyName,
        blockId: p.blockId,
        blockCode: p.blockCode,
        projectCategoryId: p.projectCategoryId,
        projectCategoryName: p.projectCategoryName,
        baselineStartDate: parseDate(p.baselineStartDate),
        baselineEndDate: parseDate(p.baselineEndDate),
        targetEndDate: parseDate(p.targetEndDate),
        durationDays: p.durationDays || 0,
        scheduleVarianceDays: p.scheduleVarianceDays || 0,
        progressPercent: p.progress || 0,
        ewsStatus: p.ewsStatus || "Normal",
        scheduleMatrix: p.scheduleMatrix ? (p.scheduleMatrix as any) : undefined,
      },
      create: {
        id: p.id,
        projectCode: p.code,
        name: p.name,
        description: p.description,
        status: mapProjectStatus(p.status),
        projectType: p.projectType,
        procurementType: p.procurementType,
        locationId: p.locationId,
        locationName: p.locationName,
        regionId: p.regionId,
        regionName: p.regionName,
        companyId: p.companyId,
        companyName: p.companyName,
        blockId: p.blockId,
        blockCode: p.blockCode,
        projectCategoryId: p.projectCategoryId,
        projectCategoryName: p.projectCategoryName,
        baselineStartDate: parseDate(p.baselineStartDate),
        baselineEndDate: parseDate(p.baselineEndDate),
        targetEndDate: parseDate(p.targetEndDate),
        durationDays: p.durationDays || 0,
        scheduleVarianceDays: p.scheduleVarianceDays || 0,
        progressPercent: p.progress || 0,
        ewsStatus: p.ewsStatus || "Normal",
        scheduleMatrix: p.scheduleMatrix ? (p.scheduleMatrix as any) : undefined,
      },
    });

    // Work Items
    if (p.workItems && p.workItems.length > 0) {
      for (const wi of p.workItems) {
        await prisma.workItem.upsert({
          where: { id: wi.id },
          update: {
            name: wi.name,
            type: wi.type,
            weight: wi.weight,
            startDate: parseDate(wi.startDate),
            endDate: parseDate(wi.endDate),
            procurementType: wi.procurementType,
            progressMode: wi.progressMode,
            progress: wi.progress,
            status: mapProjectStatus(wi.status),
            phase: wi.phase,
            notes: wi.notes,
          },
          create: {
            id: wi.id,
            projectId: createdProject.id,
            name: wi.name,
            type: wi.type,
            weight: wi.weight,
            startDate: parseDate(wi.startDate),
            endDate: parseDate(wi.endDate),
            procurementType: wi.procurementType,
            progressMode: wi.progressMode,
            progress: wi.progress,
            status: mapProjectStatus(wi.status),
            phase: wi.phase,
            notes: wi.notes,
          },
        });
      }
    }

    // BOQ Items
    if (p.surveyAndBoq && p.surveyAndBoq.length > 0) {
      for (const b of p.surveyAndBoq) {
        await prisma.boqItem.upsert({
          where: { id: b.id },
          update: {
            itemCode: b.itemCode,
            name: b.name,
            volume: b.volume,
            unit: b.unit,
            unitPrice: b.unitPrice,
            totalPrice: b.totalPrice,
            weight: b.weight,
            status: b.status,
          },
          create: {
            id: b.id,
            projectId: createdProject.id,
            itemCode: b.itemCode,
            name: b.name,
            volume: b.volume,
            unit: b.unit,
            unitPrice: b.unitPrice,
            totalPrice: b.totalPrice,
            weight: b.weight,
            status: b.status,
          },
        });
      }
    }

    // Schedule Revisions
    if (p.revisions && p.revisions.length > 0) {
      for (const rev of p.revisions) {
        await prisma.scheduleRevision.upsert({
          where: { id: rev.id },
          update: {
            revisionNumber: rev.revisionNumber,
            previousEndDate: parseDate(rev.previousEndDate),
            newEndDate: parseDate(rev.newEndDate),
            extendedWeeks: rev.extendedWeeks,
            reason: rev.reason,
            revisedAt: parseDate(rev.revisedAt),
            approvalDate: rev.approvalDate ? parseDate(rev.approvalDate) : null,
            approvedBy: rev.approvedBy,
            revisedBy: rev.revisedBy,
            approvalStatus: rev.approvalStatus,
            attachmentName: rev.attachmentName,
          },
          create: {
            id: rev.id,
            projectId: createdProject.id,
            revisionNumber: rev.revisionNumber,
            previousEndDate: parseDate(rev.previousEndDate),
            newEndDate: parseDate(rev.newEndDate),
            extendedWeeks: rev.extendedWeeks,
            reason: rev.reason,
            revisedAt: parseDate(rev.revisedAt),
            approvalDate: rev.approvalDate ? parseDate(rev.approvalDate) : null,
            approvedBy: rev.approvedBy,
            revisedBy: rev.revisedBy,
            approvalStatus: rev.approvalStatus,
            attachmentName: rev.attachmentName,
          },
        });
      }
    }
  }

  // 10. AFCE Documents & Approval Records
  console.log("-> Seeding AFCE Documents & Approval History...");
  for (const a of INITIAL_AFCES) {
    const createdAfce = await prisma.afce.upsert({
      where: { afceNumber: a.afceNumber },
      update: {
        projectId: a.projectId,
        amount: a.value,
        status: mapAfceStatus(a.status),
        sapDocNumber: a.sapDocNumber,
        sapScreenshotUrl: a.sapScreenshotPlaceholder,
        currentLevel: a.currentLevel,
        requiredLevels: a.requiredLevels,
        currentApproverRole: a.currentApproverRole,
        submittedAt: a.submittedAt ? parseDate(a.submittedAt) : null,
        approvedAt: a.approvedAt ? parseDate(a.approvedAt) : null,
      },
      create: {
        id: a.id,
        projectId: a.projectId,
        afceNumber: a.afceNumber,
        amount: a.value,
        status: mapAfceStatus(a.status),
        sapDocNumber: a.sapDocNumber,
        sapScreenshotUrl: a.sapScreenshotPlaceholder,
        currentLevel: a.currentLevel,
        requiredLevels: a.requiredLevels,
        currentApproverRole: a.currentApproverRole,
        submittedAt: a.submittedAt ? parseDate(a.submittedAt) : null,
        approvedAt: a.approvedAt ? parseDate(a.approvedAt) : null,
      },
    });

    if (a.approvalMatrixLevels) {
      for (const lvl of a.approvalMatrixLevels) {
        await prisma.afceApprovalLevel.upsert({
          where: { id: lvl.id },
          update: {
            level: lvl.level,
            code: lvl.code,
            label: lvl.label,
            isRequired: lvl.isRequired,
            status: lvl.status,
            approverName: lvl.approverName,
            approverJabatan: lvl.approverJabatan,
            decidedAt: lvl.decidedAt ? parseDate(lvl.decidedAt) : null,
            note: lvl.note,
            sapDocNumber: lvl.sapDocNumber,
          },
          create: {
            id: lvl.id,
            afceId: createdAfce.id,
            level: lvl.level,
            code: lvl.code,
            label: lvl.label,
            isRequired: lvl.isRequired,
            status: lvl.status,
            approverName: lvl.approverName,
            approverJabatan: lvl.approverJabatan,
            decidedAt: lvl.decidedAt ? parseDate(lvl.decidedAt) : null,
            note: lvl.note,
            sapDocNumber: lvl.sapDocNumber,
          },
        });
      }
    }

    if (a.history) {
      for (const h of a.history) {
        await prisma.afceApprovalRecord.upsert({
          where: { id: h.id },
          update: {
            matrixLevelId: h.matrixLevelId,
            approverName: h.approverName,
            approverRole: h.approverRole,
            approverJabatan: h.approverJabatan,
            action: h.action,
            timestamp: parseDate(h.timestamp),
            approvalDate: h.approvalDate ? parseDate(h.approvalDate) : null,
            note: h.note,
            previousStatus: h.previousStatus,
            newStatus: h.newStatus,
            sapDocNumber: h.sapDocNumber,
          },
          create: {
            id: h.id,
            afceId: createdAfce.id,
            matrixLevelId: h.matrixLevelId,
            approverName: h.approverName,
            approverRole: h.approverRole,
            approverJabatan: h.approverJabatan,
            action: h.action,
            timestamp: parseDate(h.timestamp),
            approvalDate: h.approvalDate ? parseDate(h.approvalDate) : null,
            note: h.note,
            previousStatus: h.previousStatus,
            newStatus: h.newStatus,
            sapDocNumber: h.sapDocNumber,
          },
        });
      }
    }
  }

  // 11. Jalur Barang: PR & Vendor Evaluations
  console.log("-> Seeding Purchase Requisitions & Vendor Evaluations...");
  for (const pr of INITIAL_PRS) {
    await prisma.purchaseRequisition.upsert({
      where: { prNumber: pr.prNumber },
      update: {
        projectId: pr.projectId,
        workItemId: pr.workItemId,
        sapPrNumber: pr.sapPrNumber,
        prType: pr.prType,
        description: pr.description,
        status: mapPrStatus(pr.status),
        releaseDate: parseDate(pr.releaseDate),
        attachmentName: pr.attachmentName,
      },
      create: {
        id: pr.id,
        projectId: pr.projectId,
        workItemId: pr.workItemId,
        prNumber: pr.prNumber,
        sapPrNumber: pr.sapPrNumber,
        prType: pr.prType,
        description: pr.description,
        status: mapPrStatus(pr.status),
        releaseDate: parseDate(pr.releaseDate),
        attachmentName: pr.attachmentName,
      },
    });
  }

  for (const ve of INITIAL_VENDOR_EVALUATIONS) {
    await prisma.vendorEvaluation.upsert({
      where: { id: ve.id },
      update: {
        prId: ve.prId,
        projectId: ve.projectId,
        supplierId: ve.supplierId,
        supplierName: ve.supplierName,
        evaluatorName: ve.evaluatorName,
        evaluatorJabatan: ve.evaluatorJabatan,
        evaluationDate: parseDate(ve.evaluationDate),
        result: ve.result,
        score: ve.score,
        notes: ve.notes,
        attachmentName: ve.attachmentName,
      },
      create: {
        id: ve.id,
        prId: ve.prId,
        projectId: ve.projectId,
        supplierId: ve.supplierId,
        supplierName: ve.supplierName,
        evaluatorName: ve.evaluatorName,
        evaluatorJabatan: ve.evaluatorJabatan,
        evaluationDate: parseDate(ve.evaluationDate),
        result: ve.result,
        score: ve.score,
        notes: ve.notes,
        attachmentName: ve.attachmentName,
      },
    });
  }

  // 12. Jalur Barang: PO, PoItems, GR, GoodsHandover
  console.log("-> Seeding Purchase Orders, Items, GR, & Handovers...");
  for (const po of INITIAL_POS) {
    const createdPo = await prisma.purchaseOrder.upsert({
      where: { poNumber: po.poNumber },
      update: {
        prId: po.relatedPrId,
        projectId: po.projectId,
        workItemId: po.workItemId,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        poDate: parseDate(po.poDate),
        releaseDate: po.releaseDate ? parseDate(po.releaseDate) : null,
        poValue: po.poValue,
        status: mapPoStatus(po.status),
        receiptProgressPercent: po.receiptProgressPercent || 0,
        attachmentName: po.attachmentName,
      },
      create: {
        id: po.id,
        prId: po.relatedPrId,
        projectId: po.projectId,
        workItemId: po.workItemId,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        poDate: parseDate(po.poDate),
        releaseDate: po.releaseDate ? parseDate(po.releaseDate) : null,
        poValue: po.poValue,
        status: mapPoStatus(po.status),
        receiptProgressPercent: po.receiptProgressPercent || 0,
        attachmentName: po.attachmentName,
      },
    });

    if (po.items) {
      for (const it of po.items) {
        await prisma.poItem.upsert({
          where: { id: it.id },
          update: {
            materialName: it.materialName,
            sapMaterialCode: it.sapMaterialCode,
            volume: it.volume,
            unit: it.unit,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
            receivedVolume: it.receivedVolume || 0,
            remainingVolume: it.remainingVolume || 0,
            status: it.status,
          },
          create: {
            id: it.id,
            poId: createdPo.id,
            materialName: it.materialName,
            sapMaterialCode: it.sapMaterialCode,
            volume: it.volume,
            unit: it.unit,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
            receivedVolume: it.receivedVolume || 0,
            remainingVolume: it.remainingVolume || 0,
            status: it.status,
          },
        });
      }
    }
  }

  for (const gr of INITIAL_GRS) {
    await prisma.goodsReceipt.upsert({
      where: { grNumber: gr.grNumber },
      update: {
        poId: gr.poId,
        itemId: gr.itemId,
        materialName: gr.materialName,
        receiptDate: parseDate(gr.receiptDate),
        receivedVolume: gr.receivedVolume,
        unit: gr.unit,
        notes: gr.notes,
        attachmentName: gr.attachmentName,
        recordedByName: gr.recordedBy,
      },
      create: {
        id: gr.id,
        grNumber: gr.grNumber,
        poId: gr.poId,
        itemId: gr.itemId,
        materialName: gr.materialName,
        receiptDate: parseDate(gr.receiptDate),
        receivedVolume: gr.receivedVolume,
        unit: gr.unit,
        notes: gr.notes,
        attachmentName: gr.attachmentName,
        recordedByName: gr.recordedBy,
      },
    });
  }

  for (const gh of INITIAL_GOODS_HANDOVERS) {
    await prisma.goodsHandover.upsert({
      where: { handoverNumber: gh.handoverNumber },
      update: {
        poId: gh.poId,
        projectId: gh.projectId,
        supplierId: gh.supplierId,
        supplierName: gh.supplierName,
        handoverDate: parseDate(gh.handoverDate),
        receiverName: gh.receiverName,
        receiverJabatan: gh.receiverJabatan,
        giverName: gh.giverName,
        giverCompany: gh.giverCompany,
        notes: gh.notes,
        status: gh.status === "COMPLETED" ? "COMPLETED" : "PENDING",
        attachmentName: gh.attachmentName,
      },
      create: {
        id: gh.id,
        handoverNumber: gh.handoverNumber,
        poId: gh.poId,
        projectId: gh.projectId,
        supplierId: gh.supplierId,
        supplierName: gh.supplierName,
        handoverDate: parseDate(gh.handoverDate),
        receiverName: gh.receiverName,
        receiverJabatan: gh.receiverJabatan,
        giverName: gh.giverName,
        giverCompany: gh.giverCompany,
        notes: gh.notes,
        status: gh.status === "COMPLETED" ? "COMPLETED" : "PENDING",
        attachmentName: gh.attachmentName,
      },
    });
  }

  // 13. Jalur Jasa: USPK, Tech Eval, SPK
  console.log("-> Seeding USPK, Technical Evaluations, & SPK Contracts...");
  for (const u of INITIAL_USPKS) {
    await prisma.uspk.upsert({
      where: { uspkNumber: u.uspkNumber },
      update: {
        projectId: u.projectId,
        workItemId: u.workItemId,
        vendorName: u.vendorName,
        vendorId: u.vendorId,
        scope: u.scope,
        targetVolume: u.targetVolume,
        unit: u.unit,
        value: u.value,
        startDate: parseDate(u.startDate),
        endDate: parseDate(u.endDate),
        status: mapUspkStatus(u.status),
        submittedAt: u.submittedAt ? parseDate(u.submittedAt) : null,
        decidedAt: u.decidedAt ? parseDate(u.decidedAt) : null,
        attachmentName: u.attachmentName,
        createdBy: u.createdBy,
      },
      create: {
        id: u.id,
        projectId: u.projectId,
        workItemId: u.workItemId,
        uspkNumber: u.uspkNumber,
        vendorName: u.vendorName,
        vendorId: u.vendorId,
        scope: u.scope,
        targetVolume: u.targetVolume,
        unit: u.unit,
        value: u.value,
        startDate: parseDate(u.startDate),
        endDate: parseDate(u.endDate),
        status: mapUspkStatus(u.status),
        submittedAt: u.submittedAt ? parseDate(u.submittedAt) : null,
        decidedAt: u.decidedAt ? parseDate(u.decidedAt) : null,
        attachmentName: u.attachmentName,
        createdBy: u.createdBy,
      },
    });
  }

  for (const te of INITIAL_TECHNICAL_EVALUATIONS) {
    await prisma.technicalEvaluation.upsert({
      where: { id: te.id },
      update: {
        uspkId: te.uspkId,
        projectId: te.projectId,
        evaluatorName: te.evaluatorName,
        evaluatorJabatan: te.evaluatorJabatan,
        evaluationDate: parseDate(te.evaluationDate),
        result: te.result,
        score: te.score,
        rekomendasi: te.rekomendasi,
        notes: te.notes,
        attachmentName: te.attachmentName,
      },
      create: {
        id: te.id,
        uspkId: te.uspkId,
        projectId: te.projectId,
        evaluatorName: te.evaluatorName,
        evaluatorJabatan: te.evaluatorJabatan,
        evaluationDate: parseDate(te.evaluationDate),
        result: te.result,
        score: te.score,
        rekomendasi: te.rekomendasi,
        notes: te.notes,
        attachmentName: te.attachmentName,
      },
    });
  }

  for (const spk of INITIAL_SPK_CONTRACTS) {
    await prisma.spk.upsert({
      where: { spkNumber: spk.spkNumber },
      update: {
        uspkId: spk.uspkId,
        projectId: spk.projectId,
        workItemId: spk.workItemId,
        vendorName: spk.vendorName,
        vendorId: spk.vendorId,
        targetVolume: spk.targetVolume,
        unit: spk.unit,
        value: spk.value,
        startDate: parseDate(spk.startDate),
        endDate: parseDate(spk.endDate),
        status: mapSpkStatus(spk.status),
        releasedAt: spk.releasedAt ? parseDate(spk.releasedAt) : null,
        attachmentName: spk.attachmentName,
        notes: spk.notes,
        createdBy: spk.createdBy,
      },
      create: {
        id: spk.id,
        uspkId: spk.uspkId,
        projectId: spk.projectId,
        workItemId: spk.workItemId,
        spkNumber: spk.spkNumber,
        vendorName: spk.vendorName,
        vendorId: spk.vendorId,
        targetVolume: spk.targetVolume,
        unit: spk.unit,
        value: spk.value,
        startDate: parseDate(spk.startDate),
        endDate: parseDate(spk.endDate),
        status: mapSpkStatus(spk.status),
        releasedAt: spk.releasedAt ? parseDate(spk.releasedAt) : null,
        attachmentName: spk.attachmentName,
        notes: spk.notes,
        createdBy: spk.createdBy,
      },
    });
  }

  // 14. Progress Logs
  console.log("-> Seeding Progress Logs...");
  for (const dp of INITIAL_DAILY_PROGRESS) {
    await prisma.progressLog.upsert({
      where: { id: dp.id },
      update: {
        projectId: dp.projectId,
        workItemId: dp.workItemId,
        spkId: dp.spkId,
        periodType: "DAILY",
        logDate: parseDate(dp.date),
        activity: dp.activity,
        targetVolume: dp.targetVolume,
        plannedVolume: dp.plannedVolume,
        actualVolume: dp.actualVolume,
        remainingVolume: dp.remainingVolume,
        cumulativeVolume: dp.cumulativeVolume,
        unit: dp.unit,
        progressPercent: dp.progressPercent,
        manpower: dp.manpower,
        weather: dp.weather,
        notes: dp.notes,
        photoName: dp.photoName,
        photoUrl: dp.photoUrl,
      },
      create: {
        id: dp.id,
        projectId: dp.projectId,
        workItemId: dp.workItemId,
        spkId: dp.spkId,
        periodType: "DAILY",
        logDate: parseDate(dp.date),
        activity: dp.activity,
        targetVolume: dp.targetVolume,
        plannedVolume: dp.plannedVolume,
        actualVolume: dp.actualVolume,
        remainingVolume: dp.remainingVolume,
        cumulativeVolume: dp.cumulativeVolume,
        unit: dp.unit,
        progressPercent: dp.progressPercent,
        manpower: dp.manpower,
        weather: dp.weather,
        notes: dp.notes,
        photoName: dp.photoName,
        photoUrl: dp.photoUrl,
      },
    });
  }

  for (const wp of INITIAL_WEEKLY_PROGRESS) {
    await prisma.progressLog.upsert({
      where: { id: wp.id },
      update: {
        projectId: wp.projectId,
        workItemId: wp.workItemId,
        spkId: wp.spkId,
        periodType: "WEEKLY",
        logDate: parseDate(wp.endDate),
        period: wp.period,
        startDate: parseDate(wp.startDate),
        endDate: parseDate(wp.endDate),
        plannedProgress: wp.plannedProgress,
        actualProgress: wp.actualProgress,
        variance: wp.variance,
        achievement: wp.achievement,
        notes: wp.notes,
        reportName: wp.reportName,
      },
      create: {
        id: wp.id,
        projectId: wp.projectId,
        workItemId: wp.workItemId,
        spkId: wp.spkId,
        periodType: "WEEKLY",
        logDate: parseDate(wp.endDate),
        period: wp.period,
        startDate: parseDate(wp.startDate),
        endDate: parseDate(wp.endDate),
        plannedProgress: wp.plannedProgress,
        actualProgress: wp.actualProgress,
        variance: wp.variance,
        achievement: wp.achievement,
        notes: wp.notes,
        reportName: wp.reportName,
      },
    });
  }

  // 15. Comments & Attachments
  console.log("-> Seeding Comments & Attachments...");
  for (const com of INITIAL_COMMENTS) {
    await prisma.projectComment.upsert({
      where: { id: com.id },
      update: {
        projectId: com.projectId,
        userId: com.userId || "usr-1",
        userName: com.userName,
        userRole: com.userRole,
        userAvatar: com.userAvatar,
        content: com.content,
        mentionedUserIds: com.mentionedUserIds as any,
      },
      create: {
        id: com.id,
        projectId: com.projectId,
        userId: com.userId || "usr-1",
        userName: com.userName,
        userRole: com.userRole,
        userAvatar: com.userAvatar,
        content: com.content,
        mentionedUserIds: com.mentionedUserIds as any,
      },
    });
  }

  for (const att of INITIAL_ATTACHMENTS) {
    await prisma.projectAttachment.upsert({
      where: { id: att.id },
      update: {
        projectId: att.projectId,
        commentId: att.commentId,
        source: att.source,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        category: att.category,
        docNumber: att.docNumber,
        googleDriveFileId: (att as any).googleDriveFileId,
        uploadedBy: att.uploadedBy,
      },
      create: {
        id: att.id,
        projectId: att.projectId,
        commentId: att.commentId,
        source: att.source,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        category: att.category,
        docNumber: att.docNumber,
        googleDriveFileId: (att as any).googleDriveFileId,
        uploadedBy: att.uploadedBy,
      },
    });
  }

  // 16. Audit Logs
  console.log("-> Seeding Audit Logs...");
  for (const al of INITIAL_AUDIT_LOGS) {
    await prisma.auditLog.upsert({
      where: { id: al.id },
      update: {
        userId: al.userId || "usr-1",
        userName: al.userName,
        userRole: al.userRole,
        userJabatan: al.userJabatan,
        action: al.action as any,
        entityType: al.entityType as any,
        entityId: al.entityId,
        entityTitle: al.entityTitle,
        projectId: al.projectId,
        projectName: al.projectName,
        beforeData: al.beforeData as any,
        afterData: al.afterData as any,
        ipAddress: al.ipAddress || "127.0.0.1",
        notes: al.notes,
      },
      create: {
        id: al.id,
        userId: al.userId || "usr-1",
        userName: al.userName,
        userRole: al.userRole,
        userJabatan: al.userJabatan,
        action: al.action as any,
        entityType: al.entityType as any,
        entityId: al.entityId,
        entityTitle: al.entityTitle,
        projectId: al.projectId,
        projectName: al.projectName,
        beforeData: al.beforeData as any,
        afterData: al.afterData as any,
        ipAddress: al.ipAddress || "127.0.0.1",
        notes: al.notes,
      },
    });
  }

  // 17. Notifications & Notification Settings
  console.log("-> Seeding Notifications & Settings...");
  for (const notif of INITIAL_NOTIFICATIONS) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: {
        userId: notif.userId || "usr-1",
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead,
        createdAt: new Date(notif.createdAt),
        linkUrl: notif.linkUrl,
        projectId: notif.projectId,
        projectCode: notif.projectCode,
        projectName: notif.projectName,
        priority: notif.priority || "normal",
      },
      create: {
        id: notif.id,
        userId: notif.userId || "usr-1",
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead,
        createdAt: new Date(notif.createdAt),
        linkUrl: notif.linkUrl,
        projectId: notif.projectId,
        projectCode: notif.projectCode,
        projectName: notif.projectName,
        priority: notif.priority || "normal",
      },
    });
  }

  for (const setting of INITIAL_NOTIFICATION_SETTINGS) {
    await prisma.notificationSetting.upsert({
      where: {
        userId_notificationType: {
          userId: setting.userId || "usr-1",
          notificationType: setting.notificationType,
        },
      },
      update: {
        isEnabled: setting.isEnabled,
      },
      create: {
        id: setting.id,
        userId: setting.userId || "usr-1",
        notificationType: setting.notificationType,
        isEnabled: setting.isEnabled,
      },
    });
  }

  console.log("✅ Seeding database selesai 100%! Seluruh data demo berhasil disimpan di Neon PostgreSQL.");
}

seedDatabase()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
