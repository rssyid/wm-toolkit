"use server";

import { db } from "@/server/db";

export async function getInitialAppStateAction() {
  try {
    const [
      dbProjects,
      dbAfces,
      dbPrs,
      dbPos,
      dbGrs,
      dbVendorEvals,
      dbGoodsHandovers,
      dbUspks,
      dbTechEvals,
      dbSpks,
      dbDailyLogs,
      dbWeeklyLogs,
      dbComments,
      dbAttachments,
      dbRegions,
      dbCompanies,
      dbLocations,
      dbBlocks,
      dbMaterials,
      dbSuppliers,
      dbUsers,
      dbMatrixRules,
      dbCategories,
      dbProjectTypes,
      dbProcurementTypes,
      dbAuditLogs,
    ] = await Promise.all([
      db.project.findMany({
        include: {
          workItems: true,
          boqItems: true,
          revisions: true,
        },
        orderBy: { projectCode: "asc" },
      }),
      db.afce.findMany({
        include: {
          approvalMatrixLevels: { orderBy: { level: "asc" } },
          approvalRecords: { orderBy: { timestamp: "asc" } },
        },
        orderBy: { afceNumber: "asc" },
      }),
      db.purchaseRequisition.findMany({ orderBy: { prNumber: "asc" } }),
      db.purchaseOrder.findMany({
        include: { items: true },
        orderBy: { poNumber: "asc" },
      }),
      db.goodsReceipt.findMany({ orderBy: { receiptDate: "desc" } }),
      db.vendorEvaluation.findMany({ orderBy: { evaluationDate: "desc" } }),
      db.goodsHandover.findMany({ orderBy: { handoverDate: "desc" } }),
      db.uspk.findMany({ orderBy: { uspkNumber: "asc" } }),
      db.technicalEvaluation.findMany({ orderBy: { evaluationDate: "desc" } }),
      db.spk.findMany({ orderBy: { spkNumber: "asc" } }),
      db.progressLog.findMany({
        where: { periodType: "DAILY" },
        include: { workItem: true },
        orderBy: { logDate: "desc" },
      }),
      db.progressLog.findMany({
        where: { periodType: "WEEKLY" },
        include: { workItem: true },
        orderBy: { logDate: "desc" },
      }),
      db.projectComment.findMany({ orderBy: { createdAt: "desc" } }),
      db.projectAttachment.findMany({ orderBy: { uploadedAt: "desc" } }),
      db.region.findMany({ orderBy: { code: "asc" } }),
      db.company.findMany({ orderBy: { code: "asc" } }),
      db.estateLocation.findMany({ orderBy: { code: "asc" } }),
      db.estateBlock.findMany({ orderBy: { code: "asc" } }),
      db.materialCatalogItem.findMany({ orderBy: { sapCode: "asc" } }),
      db.supplier.findMany({ orderBy: { code: "asc" } }),
      db.user.findMany({ orderBy: { name: "asc" } }),
      db.approvalMatrixRule.findMany({ orderBy: { minValue: "asc" } }),
      db.projectCategoryItem.findMany({ orderBy: { code: "asc" } }),
      db.projectTypeItem.findMany({ orderBy: { code: "asc" } }),
      db.procurementTypeItem.findMany({ orderBy: { code: "asc" } }),
      db.auditLog.findMany({ take: 100, orderBy: { createdAt: "desc" } }),
    ]);

    // Map projects to UI format
    const projects = dbProjects.map((p) => {
      const statusMap: Record<string, any> = {
        PLANNED: "Planned",
        IN_PROGRESS: "In Progress",
        ON_HOLD: "On Hold",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
      };

      return {
        id: p.id,
        code: p.projectCode,
        name: p.name,
        description: p.description || "",
        afceNumber: "",
        afceValue: 0,
        afceStatus: "Draft" as any,
        approvalStatus: "",
        locationId: p.locationId || "",
        locationName: p.locationName || "",
        companyId: p.companyId || "",
        companyName: p.companyName || "",
        regionId: p.regionId || "",
        regionName: p.regionName || "",
        blockId: p.blockId || "",
        blockCode: p.blockCode || "",
        projectCategoryId: p.projectCategoryId || "",
        projectCategoryName: p.projectCategoryName || "",
        projectType: p.projectType as any,
        procurementType: p.procurementType as any,
        status: statusMap[p.status] || "Planned",
        progress: p.progressPercent,
        baselineStartDate: p.baselineStartDate.toISOString().slice(0, 10),
        baselineEndDate: p.baselineEndDate.toISOString().slice(0, 10),
        targetEndDate: p.targetEndDate.toISOString().slice(0, 10),
        durationDays: p.durationDays,
        scheduleVarianceDays: p.scheduleVarianceDays,
        ewsStatus: (p.ewsStatus || "Normal") as any,
        lastUpdated: p.updatedAt.toISOString().slice(0, 10),
        scheduleMatrix: (p.scheduleMatrix as any) || undefined,
        deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
        workItems: p.workItems.map((wi) => ({
          id: wi.id,
          projectId: wi.projectId,
          name: wi.name,
          type: wi.type as any,
          weight: wi.weight,
          startDate: wi.startDate.toISOString().slice(0, 10),
          endDate: wi.endDate.toISOString().slice(0, 10),
          procurementType: wi.procurementType as any,
          progressMode: wi.progressMode as any,
          progress: wi.progress,
          status: statusMap[wi.status] || "Planned",
          phase: wi.phase as any,
          notes: wi.notes || undefined,
        })),
        surveyAndBoq: p.boqItems.map((b) => ({
          id: b.id,
          itemCode: b.itemCode,
          name: b.name,
          volume: b.volume,
          unit: b.unit,
          unitPrice: Number(b.unitPrice),
          totalPrice: Number(b.totalPrice),
          weight: b.weight,
          status: b.status as any,
        })),
        revisions: p.revisions.map((rev) => ({
          id: rev.id,
          revisionNumber: rev.revisionNumber,
          previousEndDate: rev.previousEndDate.toISOString().slice(0, 10),
          newEndDate: rev.newEndDate.toISOString().slice(0, 10),
          extendedWeeks: rev.extendedWeeks,
          reason: rev.reason,
          revisedAt: rev.revisedAt.toISOString().slice(0, 10),
          approvalDate: rev.approvalDate ? rev.approvalDate.toISOString().slice(0, 10) : undefined,
          approvedBy: rev.approvedBy || undefined,
          revisedBy: rev.revisedBy,
          approvalStatus: rev.approvalStatus as any,
          attachmentName: rev.attachmentName || undefined,
        })),
      };
    });

    // Map AFCEs to UI format
    const afces = dbAfces.map((a) => {
      const statusMap: Record<string, any> = {
        DRAFT: "Draft",
        PENDING_APPROVAL: "Pending Approval",
        APPROVED: "Approved",
        REJECTED: "Rejected",
        NEED_REVISION: "Need Revision",
      };

      const project = projects.find((p) => p.id === a.projectId);

      return {
        id: a.id,
        afceNumber: a.afceNumber,
        projectId: a.projectId,
        projectCode: project?.code || "",
        projectName: project?.name || "",
        value: Number(a.amount),
        status: statusMap[a.status] || "Draft",
        currentLevel: a.currentLevel,
        requiredLevels: a.requiredLevels,
        currentApproverRole: a.currentApproverRole || "Manager Estate",
        submittedAt: a.submittedAt ? a.submittedAt.toISOString().slice(0, 10) : undefined,
        approvedAt: a.approvedAt ? a.approvedAt.toISOString().slice(0, 10) : undefined,
        sapDocNumber: a.sapDocNumber || "",
        sapScreenshotPlaceholder: a.sapScreenshotUrl || undefined,
        approvalMatrixLevels: a.approvalMatrixLevels.map((lvl) => ({
          id: lvl.id,
          level: lvl.level,
          code: lvl.code,
          label: lvl.label,
          isRequired: lvl.isRequired,
          status: lvl.status as any,
          approverName: lvl.approverName || undefined,
          approverJabatan: lvl.approverJabatan || undefined,
          decidedAt: lvl.decidedAt ? lvl.decidedAt.toISOString().slice(0, 10) : undefined,
          note: lvl.note || undefined,
          sapDocNumber: lvl.sapDocNumber || undefined,
          sapEvidenceUrl: lvl.sapEvidenceUrl || undefined,
        })),
        history: a.approvalRecords.map((h) => ({
          id: h.id,
          afceNumber: a.afceNumber,
          matrixLevelId: h.matrixLevelId || undefined,
          approverName: h.approverName,
          approverRole: h.approverRole as any,
          approverJabatan: h.approverJabatan || undefined,
          action: h.action as any,
          timestamp: h.timestamp.toISOString(),
          approvalDate: h.approvalDate ? h.approvalDate.toISOString().slice(0, 10) : undefined,
          note: h.note || "",
          previousStatus: h.previousStatus as any,
          newStatus: h.newStatus as any,
          sapDocNumber: h.sapDocNumber || undefined,
          sapEvidenceUrl: h.sapEvidenceUrl || undefined,
        })),
        deletedAt: a.deletedAt ? a.deletedAt.toISOString() : null,
      };
    });

    // Populate AFCE summaries back into projects
    for (const p of projects) {
      const projectAfce = afces.find((a) => a.projectId === p.id);
      if (projectAfce) {
        p.afceNumber = projectAfce.afceNumber;
        p.afceValue = projectAfce.value;
        p.afceStatus = projectAfce.status;
        p.approvalStatus = projectAfce.status === "Approved" ? "Approved by Direksi" : "Waiting Approval";
      }
    }

    // Map PRs
    const prs = dbPrs.map((pr) => {
      const prStatusMap: Record<string, any> = {
        DRAFT: "Draft",
        RELEASED: "Released",
        CLOSED: "Closed",
        CANCELLED: "Cancelled",
      };
      const project = projects.find((p) => p.id === pr.projectId);
      const workItem = project?.workItems?.find((w) => w.id === pr.workItemId);

      return {
        id: pr.id,
        prNumber: pr.prNumber,
        projectId: pr.projectId,
        projectCode: project?.code || "",
        workItemId: pr.workItemId || "",
        workItemName: workItem?.name || "",
        releaseDate: pr.releaseDate ? pr.releaseDate.toISOString().slice(0, 10) : "",
        prType: (pr.prType || "Material") as any,
        description: pr.description,
        status: prStatusMap[pr.status] || "Draft",
        linkedPoCount: 0,
        sapPrNumber: pr.sapPrNumber || "",
        attachmentName: pr.attachmentName || undefined,
        createdAt: pr.createdAt.toISOString().slice(0, 10),
      };
    });

    // Map POs
    const pos = dbPos.map((po) => {
      const poStatusMap: Record<string, any> = {
        DRAFT: "Draft",
        RELEASED: "Released",
        CLOSED: "Closed",
        CANCELLED: "Cancelled",
      };
      const project = projects.find((p) => p.id === po.projectId);
      const pr = prs.find((item) => item.id === po.prId);

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
        poDate: po.poDate.toISOString().slice(0, 10),
        releaseDate: po.releaseDate ? po.releaseDate.toISOString().slice(0, 10) : "",
        poValue: Number(po.poValue),
        status: poStatusMap[po.status] || "Draft",
        receiptProgressPercent: po.receiptProgressPercent,
        attachmentName: po.attachmentName || undefined,
        items: po.items.map((it) => ({
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
          status: it.status as any,
        })),
      };
    });

    // Map GRs
    const grs = dbGrs.map((g) => {
      const po = pos.find((p) => p.id === g.poId);
      return {
        id: g.id,
        grNumber: g.grNumber,
        poId: g.poId,
        poNumber: po?.poNumber || "",
        receiptDate: g.receiptDate.toISOString().slice(0, 10),
        itemId: g.itemId || "",
        materialName: g.materialName,
        receivedVolume: g.receivedVolume,
        unit: g.unit,
        notes: g.notes || "",
        attachmentName: g.attachmentName || undefined,
        recordedBy: g.recordedByName,
      };
    });

    // Map Goods Handovers
    const goodsHandovers = dbGoodsHandovers.map((gh) => {
      const po = pos.find((p) => p.id === gh.poId);
      return {
        id: gh.id,
        handoverNumber: gh.handoverNumber,
        poId: gh.poId,
        poNumber: po?.poNumber || "",
        projectId: gh.projectId,
        supplierId: gh.supplierId || undefined,
        supplierName: gh.supplierName,
        handoverDate: gh.handoverDate.toISOString().slice(0, 10),
        receiverName: gh.receiverName,
        receiverJabatan: gh.receiverJabatan || undefined,
        giverName: gh.giverName,
        giverCompany: gh.giverCompany || undefined,
        notes: gh.notes || undefined,
        status: gh.status as any,
        attachmentName: gh.attachmentName || undefined,
        createdAt: gh.createdAt.toISOString().slice(0, 10),
      };
    });

    // Map USPKs
    const uspks = dbUspks.map((u) => {
      const project = projects.find((p) => p.id === u.projectId);
      const workItem = project?.workItems?.find((w) => w.id === u.workItemId);
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
        targetVolume: u.targetVolume || undefined,
        unit: u.unit || undefined,
        startDate: u.startDate.toISOString().slice(0, 10),
        endDate: u.endDate.toISOString().slice(0, 10),
        status: u.status as any,
        submittedAt: u.submittedAt ? u.submittedAt.toISOString().slice(0, 10) : undefined,
        decidedAt: u.decidedAt ? u.decidedAt.toISOString().slice(0, 10) : undefined,
        createdBy: u.createdBy,
        attachmentName: u.attachmentName || undefined,
        createdAt: u.createdAt.toISOString().slice(0, 10),
      };
    });

    // Map SPKs
    const spkContracts = dbSpks.map((spk) => {
      const uspk = uspks.find((u) => u.id === spk.uspkId);
      const project = projects.find((p) => p.id === spk.projectId);
      const workItem = project?.workItems?.find((w) => w.id === spk.workItemId);
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
        targetVolume: spk.targetVolume || undefined,
        unit: spk.unit || undefined,
        startDate: spk.startDate.toISOString().slice(0, 10),
        endDate: spk.endDate.toISOString().slice(0, 10),
        status: spk.status as any,
        releasedAt: spk.releasedAt ? spk.releasedAt.toISOString().slice(0, 10) : undefined,
        attachmentName: spk.attachmentName || undefined,
        notes: spk.notes || undefined,
        createdBy: spk.createdBy,
        createdAt: spk.createdAt.toISOString().slice(0, 10),
      };
    });

    // Map Daily Progress
    const dailyProgress = dbDailyLogs.map((dp) => ({
      id: dp.id,
      projectId: dp.projectId,
      workItemId: dp.workItemId,
      workItemName: dp.workItem?.name || "",
      spkId: dp.spkId || undefined,
      date: dp.logDate.toISOString().slice(0, 10),
      activity: dp.activity || "",
      targetVolume: dp.targetVolume || undefined,
      plannedVolume: dp.plannedVolume || undefined,
      actualVolume: dp.actualVolume || undefined,
      remainingVolume: dp.remainingVolume || undefined,
      cumulativeVolume: dp.cumulativeVolume || undefined,
      unit: dp.unit || undefined,
      progressPercent: dp.progressPercent,
      manpower: dp.manpower || undefined,
      weather: (dp.weather || "Cerah") as any,
      notes: dp.notes || "",
      photoName: dp.photoName || undefined,
      photoUrl: dp.photoUrl || undefined,
      recordedAt: dp.recordedAt.toISOString(),
    }));

    // Map Weekly Progress
    const weeklyProgress = dbWeeklyLogs.map((wp) => ({
      id: wp.id,
      projectId: wp.projectId,
      workItemId: wp.workItemId,
      workItemName: wp.workItem?.name || "",
      spkId: wp.spkId || undefined,
      period: wp.period || "",
      startDate: wp.startDate ? wp.startDate.toISOString().slice(0, 10) : "",
      endDate: wp.endDate ? wp.endDate.toISOString().slice(0, 10) : wp.logDate.toISOString().slice(0, 10),
      plannedProgress: wp.plannedProgress || 0,
      actualProgress: wp.actualProgress || 0,
      variance: wp.variance || 0,
      achievement: wp.achievement || 0,
      notes: wp.notes || "",
      reportName: wp.reportName || undefined,
      recordedAt: wp.recordedAt.toISOString(),
    }));

    // Map Master Data
    const regions = dbRegions.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description || undefined,
      status: r.status as any,
      updatedAt: r.updatedAt.toISOString().slice(0, 10),
    }));

    const companies = dbCompanies.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      npwp: c.npwp || undefined,
      status: c.status as any,
      updatedAt: c.updatedAt.toISOString().slice(0, 10),
    }));

    const locations = dbLocations.map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      regionId: l.regionId,
      companyId: l.companyId,
      district: l.district,
      hectares: l.hectares,
      status: l.status as any,
      updatedAt: l.updatedAt.toISOString().slice(0, 10),
    }));

    const blocks = dbBlocks.map((b) => ({
      id: b.id,
      estateId: b.estateId,
      code: b.code,
      name: b.name,
      afdeling: b.afdeling,
      cropType: b.cropType,
      plantingYear: b.plantingYear,
      hectares: b.hectares,
      status: b.status as any,
      updatedAt: b.updatedAt.toISOString().slice(0, 10),
    }));

    const materials = dbMaterials.map((m) => ({
      id: m.id,
      sapCode: m.sapCode,
      name: m.name,
      category: m.category,
      unit: m.unit,
      standardPrice: Number(m.standardPrice),
      status: m.status as any,
      updatedAt: m.updatedAt.toISOString().slice(0, 10),
    }));

    const suppliers = dbSuppliers.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category,
      contactPerson: s.contactPerson,
      phone: s.phone,
      npwp: s.npwp,
      rating: s.rating,
      status: s.status as any,
      updatedAt: s.updatedAt.toISOString().slice(0, 10),
    }));

    const users = dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as any,
      systemRole: u.role as any,
      jabatan: u.jabatan || undefined,
      estateName: u.estateName || undefined,
      status: (u.isActive ? "Active" : "Inactive") as any,
      updatedAt: u.updatedAt.toISOString().slice(0, 10),
    }));

    const approvalMatrix = dbMatrixRules.map((m) => ({
      id: m.id,
      tierName: m.tierName,
      minValue: Number(m.minValue),
      maxValue: Number(m.maxValue),
      levels: (m.levels as any) || [],
      active: m.active,
      updatedAt: m.updatedAt.toISOString().slice(0, 10),
    }));

    const projectCategories = dbCategories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description || "",
      status: c.status as any,
      updatedAt: c.updatedAt.toISOString().slice(0, 10),
    }));

    const projectTypes = dbProjectTypes.map((pt) => ({
      id: pt.id,
      code: pt.code,
      name: pt.name,
      description: pt.description || "",
      status: pt.status as any,
      updatedAt: pt.updatedAt.toISOString().slice(0, 10),
    }));

    const procurementTypes = dbProcurementTypes.map((pct) => ({
      id: pct.id,
      code: pct.code,
      name: pct.name,
      description: pct.description || "",
      status: pct.status as any,
      updatedAt: pct.updatedAt.toISOString().slice(0, 10),
    }));

    const comments = dbComments.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      userId: c.userId,
      userName: c.userName,
      userRole: c.userRole || undefined,
      userAvatar: c.userAvatar || undefined,
      content: c.content,
      mentionedUserIds: (c.mentionedUserIds as any) || [],
      createdAt: c.createdAt.toISOString(),
    }));

    const attachments = dbAttachments.map((att) => ({
      id: att.id,
      projectId: att.projectId,
      commentId: att.commentId || undefined,
      source: att.source as any,
      fileName: att.fileName,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize || "1.2 MB",
      mimeType: att.mimeType || undefined,
      category: att.category || undefined,
      docNumber: att.docNumber || undefined,
      googleDriveFileId: att.googleDriveFileId || undefined,
      uploadedBy: att.uploadedBy,
      uploadedAt: att.uploadedAt.toISOString(),
    }));

    const auditLogs = dbAuditLogs.map((al) => ({
      id: al.id,
      userId: al.userId || "usr-1",
      userName: al.userName,
      userRole: al.userRole || undefined,
      userJabatan: al.userJabatan || undefined,
      action: al.action as any,
      entityType: al.entityType as any,
      entityId: al.entityId,
      entityTitle: al.entityTitle || undefined,
      projectId: al.projectId || undefined,
      projectName: al.projectName || undefined,
      beforeData: (al.beforeData as any) || null,
      afterData: (al.afterData as any) || null,
      ipAddress: al.ipAddress,
      userAgent: al.userAgent || undefined,
      createdAt: al.createdAt.toISOString(),
      notes: al.notes || undefined,
    }));

    return {
      success: true,
      hasDbData: true,
      data: {
        projects,
        afces,
        prs,
        pos,
        grs,
        vendorEvaluations: dbVendorEvals.map((v) => ({
          id: v.id,
          prId: v.prId,
          prNumber: "",
          projectId: v.projectId || "",
          supplierId: v.supplierId || "",
          supplierName: v.supplierName,
          evaluatorId: v.evaluatorId || undefined,
          evaluatorName: v.evaluatorName,
          evaluatorJabatan: v.evaluatorJabatan || undefined,
          evaluationDate: v.evaluationDate.toISOString().slice(0, 10),
          result: v.result as any,
          notes: v.notes,
          score: v.score || undefined,
          attachmentName: v.attachmentName || undefined,
          createdAt: v.createdAt.toISOString().slice(0, 10),
        })),
        goodsHandovers,
        uspks,
        technicalEvaluations: dbTechEvals.map((te) => ({
          id: te.id,
          uspkId: te.uspkId,
          uspkNumber: "",
          projectId: te.projectId || "",
          evaluatorId: te.evaluatorId || undefined,
          evaluatorName: te.evaluatorName,
          evaluatorJabatan: te.evaluatorJabatan || undefined,
          evaluationDate: te.evaluationDate.toISOString().slice(0, 10),
          result: te.result as any,
          rekomendasi: te.rekomendasi || undefined,
          notes: te.notes,
          score: te.score || undefined,
          attachmentName: te.attachmentName || undefined,
          createdAt: te.createdAt.toISOString().slice(0, 10),
        })),
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
      },
    };
  } catch (error: any) {
    console.error("Gagal mengambil initial app state dari database:", error);
    return {
      success: false,
      hasDbData: false,
      error: error.message,
    };
  }
}
