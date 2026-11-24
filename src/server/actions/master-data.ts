"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { toPlainObject } from "@/server/serialize";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";
import {
  CreateEstateLocationSchema,
  UpdateEstateLocationSchema,
  CreateCompanySchema,
  UpdateCompanySchema,
  CreateRegionSchema,
  UpdateRegionSchema,
  CreateEstateBlockSchema,
  UpdateEstateBlockSchema,
  CreateMaterialCatalogSchema,
  UpdateMaterialCatalogSchema,
  CreateSupplierSchema,
  UpdateSupplierSchema,
  CreateUserSchema,
  UpdateUserSchema,
  CreateApprovalMatrixRuleSchema,
  UpdateApprovalMatrixRuleSchema,
  UpdateApprovalMatrixLevelsSchema,
  CreateProjectCategorySchema,
  UpdateProjectCategorySchema,
  CreateProjectTypeSchema,
  UpdateProjectTypeSchema,
  CreateProcurementTypeSchema,
  UpdateProcurementTypeSchema,
} from "@/server/schemas";

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  jabatan: true,
  estateName: true,
  bio: true,
  timeZone: true,
  avatarUrl: true,
  isActive: true,
  updatedAt: true,
};

// 1. Kebun (EstateLocation)

export async function addMasterDataLocationAction(rawInput: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateEstateLocationSchema.parse(rawInput);

    const existing = await db.estateLocation.findUnique({ where: { code: parsed.code } });
    if (existing) {
      return { success: false, error: `Kode kebun "${parsed.code}" sudah terdaftar.` };
    }

    const loc = await db.estateLocation.create({
      data: {
        id: parsed.id || undefined,
        code: parsed.code,
        name: parsed.name,
        regionId: parsed.regionId,
        companyId: parsed.companyId,
        district: parsed.district,
        hectares: Number(parsed.hectares) || 0,
        status: parsed.status || "Active",
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: loc.id,
      entityTitle: `Kebun ${loc.code} - ${loc.name}`,
      afterData: { code: loc.code, name: loc.name },
      notes: `Master kebun "${loc.name}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true, location: loc };
  } catch (err: unknown) {
    console.error("Gagal menambah data kebun:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah data kebun.") };
  }
}

export async function updateMasterDataLocationAction(id: string, rawInput: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateEstateLocationSchema.parse(rawInput);

    if (parsed.code) {
      const existing = await db.estateLocation.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode kebun "${parsed.code}" sudah digunakan.` };
      }
    }

    const updated = await db.estateLocation.update({
      where: { id },
      data: {
        code: parsed.code,
        name: parsed.name,
        regionId: parsed.regionId,
        companyId: parsed.companyId,
        district: parsed.district,
        hectares: parsed.hectares !== undefined ? Number(parsed.hectares) : undefined,
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Kebun ${updated.code} - ${updated.name}`,
      afterData: { code: updated.code, name: updated.name, status: updated.status },
      notes: `Master kebun "${updated.name}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true, location: updated };
  } catch (err: unknown) {
    console.error("Gagal memperbarui data kebun:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui data kebun.") };
  }
}

export async function deleteMasterDataLocationAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const [existing, blockCount, projectCount] = await Promise.all([
      db.estateLocation.findUnique({ where: { id } }),
      db.estateBlock.count({ where: { estateId: id } }),
      db.project.count({ where: { locationId: id } }),
    ]);

    if (!existing) {
      return { success: false, error: "Data kebun tidak ditemukan." };
    }
    if (blockCount > 0 || projectCount > 0) {
      return {
        success: false,
        error: `Kebun tidak dapat dihapus karena masih terhubung dengan ${blockCount} blok dan ${projectCount} proyek.`,
      };
    }

    await db.estateLocation.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Kebun ${existing.code} - ${existing.name}`,
      notes: `Master kebun "${existing.name}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus data kebun:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus data kebun.") };
  }
}

// 2. Perusahaan (Company)

export async function addMasterDataCompanyAction(rawInput: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateCompanySchema.parse(rawInput);

    const existing = await db.company.findUnique({ where: { code: parsed.code } });
    if (existing) {
      return { success: false, error: `Kode perusahaan "${parsed.code}" sudah terdaftar.` };
    }

    const cmp = await db.company.create({
      data: {
        id: parsed.id || undefined,
        code: parsed.code,
        name: parsed.name,
        npwp: parsed.npwp || null,
        status: parsed.status || "Active",
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: cmp.id,
      entityTitle: `Perusahaan ${cmp.code} - ${cmp.name}`,
      notes: `Master perusahaan "${cmp.name}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true, company: cmp };
  } catch (err: unknown) {
    console.error("Gagal menambah data perusahaan:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah data perusahaan.") };
  }
}

export async function updateMasterDataCompanyAction(id: string, rawInput: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateCompanySchema.parse(rawInput);

    if (parsed.code) {
      const existing = await db.company.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode perusahaan "${parsed.code}" sudah digunakan.` };
      }
    }

    const updated = await db.company.update({
      where: { id },
      data: {
        code: parsed.code,
        name: parsed.name,
        npwp: parsed.npwp,
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Perusahaan ${updated.code} - ${updated.name}`,
      notes: `Master perusahaan "${updated.name}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true, company: updated };
  } catch (err: unknown) {
    console.error("Gagal memperbarui data perusahaan:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui data perusahaan.") };
  }
}

export async function deleteMasterDataCompanyAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const [existing, estateCount] = await Promise.all([
      db.company.findUnique({ where: { id } }),
      db.estateLocation.count({ where: { companyId: id } }),
    ]);

    if (!existing) {
      return { success: false, error: "Data perusahaan tidak ditemukan." };
    }
    if (estateCount > 0) {
      return {
        success: false,
        error: `Perusahaan tidak dapat dihapus karena masih menaungi ${estateCount} kebun.`,
      };
    }

    await db.company.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Perusahaan ${existing.code} - ${existing.name}`,
      notes: `Master perusahaan "${existing.name}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus data perusahaan:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus data perusahaan.") };
  }
}

// 3. Wilayah (Region)

export async function addMasterDataRegionAction(rawInput: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateRegionSchema.parse(rawInput);

    const existing = await db.region.findUnique({ where: { code: parsed.code } });
    if (existing) {
      return { success: false, error: `Kode wilayah "${parsed.code}" sudah terdaftar.` };
    }

    const reg = await db.region.create({
      data: {
        id: parsed.id || undefined,
        code: parsed.code,
        name: parsed.name,
        description: parsed.description || null,
        status: parsed.status || "Active",
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: reg.id,
      entityTitle: `Wilayah ${reg.code} - ${reg.name}`,
      notes: `Master wilayah "${reg.name}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true, region: reg };
  } catch (err: unknown) {
    console.error("Gagal menambah data wilayah:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah data wilayah.") };
  }
}

export async function updateMasterDataRegionAction(id: string, rawInput: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateRegionSchema.parse(rawInput);

    if (parsed.code) {
      const existing = await db.region.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode wilayah "${parsed.code}" sudah digunakan.` };
      }
    }

    const updated = await db.region.update({
      where: { id },
      data: {
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Wilayah ${updated.code} - ${updated.name}`,
      notes: `Master wilayah "${updated.name}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true, region: updated };
  } catch (err: unknown) {
    console.error("Gagal memperbarui data wilayah:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui data wilayah.") };
  }
}

export async function deleteMasterDataRegionAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const [existing, estateCount] = await Promise.all([
      db.region.findUnique({ where: { id } }),
      db.estateLocation.count({ where: { regionId: id } }),
    ]);

    if (!existing) {
      return { success: false, error: "Data wilayah tidak ditemukan." };
    }
    if (estateCount > 0) {
      return {
        success: false,
        error: `Wilayah tidak dapat dihapus karena masih menaungi ${estateCount} kebun.`,
      };
    }

    await db.region.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Wilayah ${existing.code} - ${existing.name}`,
      notes: `Master wilayah "${existing.name}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus data wilayah:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus data wilayah.") };
  }
}

// 4. Blok Kebun (EstateBlock)

export async function addMasterDataBlockAction(rawInput: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateEstateBlockSchema.parse(rawInput);

    const existing = await db.estateBlock.findFirst({
      where: { estateId: parsed.estateId, code: parsed.code },
    });
    if (existing) {
      return { success: false, error: `Kode blok "${parsed.code}" sudah terdaftar pada kebun ini.` };
    }

    const blk = await db.estateBlock.create({
      data: {
        id: parsed.id || undefined,
        estateId: parsed.estateId,
        code: parsed.code,
        name: parsed.name,
        afdeling: parsed.afdeling,
        cropType: parsed.cropType,
        plantingYear: Number(parsed.plantingYear) || new Date().getFullYear(),
        hectares: Number(parsed.hectares) || 0,
        status: parsed.status || "Active",
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: blk.id,
      entityTitle: `Blok ${blk.code} - ${blk.name}`,
      notes: `Master blok "${blk.code}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true, block: blk };
  } catch (err: unknown) {
    console.error("Gagal menambah data blok:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah data blok.") };
  }
}

export async function updateMasterDataBlockAction(id: string, rawInput: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateEstateBlockSchema.parse(rawInput);

    if (parsed.code) {
      const current = await db.estateBlock.findUnique({ where: { id } });
      const targetEstateId = parsed.estateId || current?.estateId;
      if (targetEstateId) {
        const existing = await db.estateBlock.findFirst({
          where: { estateId: targetEstateId, code: parsed.code, NOT: { id } },
        });
        if (existing) {
          return { success: false, error: `Kode blok "${parsed.code}" sudah digunakan pada kebun ini.` };
        }
      }
    }

    const updated = await db.estateBlock.update({
      where: { id },
      data: {
        estateId: parsed.estateId,
        code: parsed.code,
        name: parsed.name,
        afdeling: parsed.afdeling,
        cropType: parsed.cropType,
        plantingYear: parsed.plantingYear !== undefined ? Number(parsed.plantingYear) : undefined,
        hectares: parsed.hectares !== undefined ? Number(parsed.hectares) : undefined,
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Blok ${updated.code} - ${updated.name}`,
      notes: `Master blok "${updated.code}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true, block: updated };
  } catch (err: unknown) {
    console.error("Gagal memperbarui data blok:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui data blok.") };
  }
}

export async function deleteMasterDataBlockAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const [existing, projectCount] = await Promise.all([
      db.estateBlock.findUnique({ where: { id } }),
      db.project.count({ where: { blockId: id } }),
    ]);

    if (!existing) {
      return { success: false, error: "Data blok tidak ditemukan." };
    }
    if (projectCount > 0) {
      return {
        success: false,
        error: `Blok tidak dapat dihapus karena masih terikat dengan ${projectCount} proyek.`,
      };
    }

    await db.estateBlock.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Blok ${existing.code} - ${existing.name}`,
      notes: `Master blok "${existing.code}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/locations");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus data blok:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus data blok.") };
  }
}

// 5. Katalog Material

export async function addMasterDataMaterialAction(data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateMaterialCatalogSchema.parse(data);

    const existing = await db.materialCatalogItem.findUnique({
      where: { sapCode: parsed.sapCode },
    });
    if (existing) {
      return { success: false, error: `Kode material SAP "${parsed.sapCode}" sudah terdaftar.` };
    }

    const mat = await db.materialCatalogItem.create({
      data: {
        id: parsed.id || undefined,
        sapCode: parsed.sapCode,
        name: parsed.name,
        category: parsed.category,
        unit: parsed.unit,
        standardPrice: Number(parsed.standardPrice) || 0,
        status: parsed.status || "Active",
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: mat.id,
      entityTitle: `Material ${mat.sapCode} - ${mat.name}`,
      notes: `Katalog material "${mat.name}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/materials");
    return { success: true, material: toPlainObject(mat) };
  } catch (err: unknown) {
    console.error("Gagal menambah material:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah material.") };
  }
}

export async function updateMasterDataMaterialAction(id: string, data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateMaterialCatalogSchema.parse(data);

    if (parsed.sapCode) {
      const existing = await db.materialCatalogItem.findFirst({
        where: { sapCode: parsed.sapCode, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode material SAP "${parsed.sapCode}" sudah digunakan.` };
      }
    }

    const updated = await db.materialCatalogItem.update({
      where: { id },
      data: {
        sapCode: parsed.sapCode,
        name: parsed.name,
        category: parsed.category,
        unit: parsed.unit,
        standardPrice: parsed.standardPrice !== undefined ? Number(parsed.standardPrice) : undefined,
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Material ${updated.sapCode} - ${updated.name}`,
      notes: `Katalog material "${updated.name}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/materials");
    return { success: true, material: toPlainObject(updated) };
  } catch (err: unknown) {
    console.error("Gagal memperbarui material:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui material.") };
  }
}

export async function deleteMasterDataMaterialAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const existing = await db.materialCatalogItem.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Material tidak ditemukan." };
    }

    const poItemUsage = await db.poItem.count({
      where: {
        OR: [{ sapMaterialCode: existing.sapCode }, { materialName: existing.name }],
      },
    });
    if (poItemUsage > 0) {
      return {
        success: false,
        error: `Material tidak dapat dihapus karena tercatat pada ${poItemUsage} item PO.`,
      };
    }

    await db.materialCatalogItem.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Material ${existing.sapCode} - ${existing.name}`,
      notes: `Katalog material "${existing.name}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/materials");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus material:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus material.") };
  }
}

// 6. Rekanan / Supplier

export async function addMasterDataSupplierAction(data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateSupplierSchema.parse(data);

    const existing = await db.supplier.findUnique({ where: { code: parsed.code } });
    if (existing) {
      return { success: false, error: `Kode rekanan "${parsed.code}" sudah terdaftar.` };
    }

    const sup = await db.supplier.create({
      data: {
        id: parsed.id || undefined,
        code: parsed.code,
        name: parsed.name,
        category: parsed.category,
        contactPerson: parsed.contactPerson,
        phone: parsed.phone,
        npwp: parsed.npwp,
        rating: Number(parsed.rating) || 5,
        status: parsed.status || "Active",
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: sup.id,
      entityTitle: `Rekanan ${sup.code} - ${sup.name}`,
      notes: `Master rekanan "${sup.name}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/suppliers");
    return { success: true, supplier: sup };
  } catch (err: unknown) {
    console.error("Gagal menambah rekanan:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah rekanan.") };
  }
}

export async function updateMasterDataSupplierAction(id: string, data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateSupplierSchema.parse(data);

    if (parsed.code) {
      const existing = await db.supplier.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode rekanan "${parsed.code}" sudah digunakan.` };
      }
    }

    const updated = await db.supplier.update({
      where: { id },
      data: {
        code: parsed.code,
        name: parsed.name,
        category: parsed.category,
        contactPerson: parsed.contactPerson,
        phone: parsed.phone,
        npwp: parsed.npwp,
        rating: parsed.rating !== undefined ? Number(parsed.rating) : undefined,
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Rekanan ${updated.code} - ${updated.name}`,
      notes: `Master rekanan "${updated.name}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/suppliers");
    return { success: true, supplier: updated };
  } catch (err: unknown) {
    console.error("Gagal memperbarui rekanan:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui rekanan.") };
  }
}

export async function deleteMasterDataSupplierAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const [existing, poCount, evalCount] = await Promise.all([
      db.supplier.findUnique({ where: { id } }),
      db.purchaseOrder.count({ where: { supplierId: id } }),
      db.vendorEvaluation.count({ where: { supplierId: id } }),
    ]);

    if (!existing) {
      return { success: false, error: "Data rekanan tidak ditemukan." };
    }
    if (poCount > 0 || evalCount > 0) {
      return {
        success: false,
        error: `Rekanan tidak dapat dihapus karena masih terhubung dengan ${poCount} PO dan ${evalCount} catatan evaluasi.`,
      };
    }

    await db.supplier.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Rekanan ${existing.code} - ${existing.name}`,
      notes: `Master rekanan "${existing.name}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/suppliers");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus rekanan:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus rekanan.") };
  }
}

// 7. Pengguna Sistem (Users)

export async function addMasterDataUserAction(data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateUserSchema.parse(data);
    const cleanEmail = parsed.email.trim().toLowerCase();

    const existing = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return { success: false, error: `Email "${cleanEmail}" sudah terdaftar.` };
    }

    const bcrypt = await import("bcryptjs");
    const defaultPwd = process.env.DEFAULT_USER_PASSWORD || "wmtoolkit2026";
    const passwordHash = await bcrypt.hash(parsed.password || defaultPwd, 10);
    const targetRole = (parsed.role || parsed.systemRole || "PIC") as never;

    const createdUser = await db.user.create({
      data: {
        id: parsed.id || undefined,
        name: parsed.name,
        email: cleanEmail,
        passwordHash,
        role: targetRole,
        jabatan: parsed.jabatan || "-",
        estateName: parsed.estateName,
        avatarUrl: parsed.avatarUrl || undefined,
        isActive: parsed.status === "Active",
      },
      select: USER_PUBLIC_SELECT,
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "USER",
      entityId: createdUser.id,
      entityTitle: `${createdUser.name} (${createdUser.role})`,
      afterData: { name: createdUser.name, email: createdUser.email, role: createdUser.role },
      notes: `Akun pengguna "${createdUser.name}" (${createdUser.role}) dibuat oleh ${admin.name}`,
    });

    revalidatePath("/master-data/users");
    revalidatePath("/master-data/rbac");
    return { success: true, user: createdUser };
  } catch (err: unknown) {
    console.error("Gagal menambah pengguna:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah pengguna.") };
  }
}

export async function updateMasterDataUserAction(id: string, data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateUserSchema.parse(data);

    const beforeUser = await db.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
    if (!beforeUser) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    const roleVal = parsed.systemRole !== undefined ? parsed.systemRole : parsed.role;
    if (id === admin.id) {
      if (roleVal && roleVal !== "ADMIN") {
        return {
          success: false,
          error: "Anda tidak dapat menurunkan peran Administrator akun Anda sendiri.",
        };
      }
      if (parsed.status === "Inactive") {
        return {
          success: false,
          error: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
        };
      }
    }

    let cleanEmail: string | undefined;
    if (parsed.email !== undefined) {
      cleanEmail = parsed.email.trim().toLowerCase();
      const existing = await db.user.findFirst({
        where: { email: cleanEmail, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Email "${cleanEmail}" sudah digunakan oleh pengguna lain.` };
      }
    }

    let passwordHash: string | undefined;
    if (parsed.password && parsed.password.length >= 6) {
      const bcrypt = await import("bcryptjs");
      passwordHash = await bcrypt.hash(parsed.password, 10);
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        name: parsed.name,
        email: cleanEmail,
        passwordHash: passwordHash || undefined,
        role: roleVal !== undefined ? (roleVal as never) : undefined,
        jabatan: parsed.jabatan,
        estateName: parsed.estateName,
        avatarUrl: parsed.avatarUrl,
        isActive: parsed.status !== undefined ? parsed.status === "Active" : undefined,
      },
      select: USER_PUBLIC_SELECT,
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "USER",
      entityId: updated.id,
      entityTitle: `${updated.name} (${updated.role})`,
      beforeData: {
        name: beforeUser.name,
        role: beforeUser.role,
        isActive: beforeUser.isActive,
      },
      afterData: {
        name: updated.name,
        role: updated.role,
        isActive: updated.isActive,
      },
      notes: `Data pengguna "${updated.name}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/users");
    revalidatePath("/master-data/rbac");
    return { success: true, user: updated };
  } catch (err: unknown) {
    console.error("Gagal memperbarui pengguna:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui pengguna.") };
  }
}

export async function deleteMasterDataUserAction(id: string) {
  try {
    const currentAdmin = await requireRole(["ADMIN"]);
    if (currentAdmin.id === id) {
      return { success: false, error: "Anda tidak dapat menghapus akun administrator Anda sendiri." };
    }

    const existing = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!existing) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    const usageCounts = await Promise.all([
      db.project.count({ where: { OR: [{ picId: id }, { createdById: id }] } }),
      db.afce.count({ where: { createdById: id } }),
      db.afceApprovalRecord.count({ where: { recordedById: id } }),
      db.purchaseRequisition.count({ where: { createdById: id } }),
      db.vendorEvaluation.count({ where: { evaluatorId: id } }),
      db.purchaseOrder.count({ where: { createdById: id } }),
      db.goodsReceipt.count({ where: { recordedById: id } }),
      db.goodsHandover.count({ where: { createdById: id } }),
      db.uspk.count({ where: { createdById: id } }),
      db.technicalEvaluation.count({ where: { evaluatorId: id } }),
      db.spk.count({ where: { createdById: id } }),
      db.progressLog.count({ where: { createdById: id } }),
      db.projectComment.count({ where: { userId: id } }),
      db.projectAttachment.count({ where: { uploadedById: id } }),
      db.auditLog.count({ where: { userId: id } }),
    ]);

    const hasDependencies = usageCounts.some((c) => c > 0);
    if (hasDependencies) {
      await db.user.update({
        where: { id },
        data: { isActive: false },
      });

      await recordServerAuditLog({
        action: "UPDATE",
        entityType: "USER",
        entityId: existing.id,
        entityTitle: existing.name,
        beforeData: { isActive: true },
        afterData: { isActive: false },
        notes: `Pengguna "${existing.name}" dinonaktifkan karena terikat riwayat transaksi oleh ${currentAdmin.name}`,
      });

      revalidatePath("/master-data/users");
      revalidatePath("/master-data/rbac");
      return { success: true, deactivated: true };
    }

    await db.user.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "USER",
      entityId: existing.id,
      entityTitle: existing.name,
      notes: `Pengguna "${existing.name}" dihapus permanen oleh ${currentAdmin.name}`,
    });

    revalidatePath("/master-data/users");
    revalidatePath("/master-data/rbac");
    return { success: true, deactivated: false };
  } catch (err: unknown) {
    console.error("Gagal menghapus pengguna:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus pengguna.") };
  }
}

// 8. Matriks Persetujuan (Approval Matrix)

export async function updateApprovalMatrixAction(id: string, levels: unknown[]) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateApprovalMatrixLevelsSchema.parse({ id, levels });

    const updated = await db.approvalMatrixRule.update({
      where: { id: parsed.id },
      data: { levels: parsed.levels as never },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Matriks ${updated.tierName}`,
      afterData: { levels: parsed.levels },
      notes: `Level otorisasi matriks "${updated.tierName}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/approval-matrix");
    return { success: true, matrix: toPlainObject(updated) };
  } catch (err: unknown) {
    console.error("Gagal memperbarui matriks persetujuan:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui matriks persetujuan.") };
  }
}

export async function addApprovalMatrixRuleAction(data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateApprovalMatrixRuleSchema.parse(data);

    const rule = await db.approvalMatrixRule.create({
      data: {
        id: parsed.id || undefined,
        tierName: parsed.tierName,
        minValue: Number(parsed.minValue),
        maxValue: Number(parsed.maxValue),
        levels: (parsed.levels.length > 0 ? parsed.levels : Array(9).fill(null)) as never,
        active: parsed.active ?? true,
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: rule.id,
      entityTitle: `Matriks ${rule.tierName}`,
      notes: `Aturan matriks "${rule.tierName}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/approval-matrix");
    return { success: true, rule: toPlainObject(rule) };
  } catch (err: unknown) {
    console.error("Gagal menambah aturan matriks persetujuan:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah aturan matriks.") };
  }
}

export async function updateApprovalMatrixRuleAction(id: string, data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateApprovalMatrixRuleSchema.parse(data);

    const existing = await db.approvalMatrixRule.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Aturan matriks tidak ditemukan." };
    }

    const nextMin = parsed.minValue !== undefined ? Number(parsed.minValue) : Number(existing.minValue);
    const nextMax = parsed.maxValue !== undefined ? Number(parsed.maxValue) : Number(existing.maxValue);
    if (nextMax < nextMin) {
      return {
        success: false,
        error: "Batas maksimum harus lebih besar atau sama dengan batas minimum.",
      };
    }

    const updated = await db.approvalMatrixRule.update({
      where: { id },
      data: {
        tierName: parsed.tierName,
        minValue: parsed.minValue !== undefined ? Number(parsed.minValue) : undefined,
        maxValue: parsed.maxValue !== undefined ? Number(parsed.maxValue) : undefined,
        levels: parsed.levels !== undefined ? (parsed.levels as never) : undefined,
        active: parsed.active,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Matriks ${updated.tierName}`,
      notes: `Aturan matriks "${updated.tierName}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/approval-matrix");
    return { success: true, rule: toPlainObject(updated) };
  } catch (err: unknown) {
    console.error("Gagal memperbarui aturan matriks persetujuan:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui aturan matriks.") };
  }
}

export async function deleteApprovalMatrixRuleAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const existing = await db.approvalMatrixRule.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Aturan matriks tidak ditemukan." };
    }

    await db.approvalMatrixRule.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Matriks ${existing.tierName}`,
      notes: `Aturan matriks "${existing.tierName}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/approval-matrix");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus aturan matriks persetujuan:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus aturan matriks.") };
  }
}

// 9. Kategori Proyek

export async function addMasterDataProjectCategoryAction(data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateProjectCategorySchema.parse(data);

    const existing = await db.projectCategoryItem.findUnique({ where: { code: parsed.code } });
    if (existing) {
      return { success: false, error: `Kode kategori "${parsed.code}" sudah terdaftar.` };
    }

    const item = await db.projectCategoryItem.create({
      data: {
        id: parsed.id || undefined,
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        status: parsed.status || "Active",
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: item.id,
      entityTitle: `Kategori ${item.code} - ${item.name}`,
      notes: `Kategori proyek "${item.name}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/project-categories");
    return { success: true, category: item };
  } catch (err: unknown) {
    console.error("Gagal menambah kategori proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah kategori proyek.") };
  }
}

export async function updateMasterDataProjectCategoryAction(id: string, data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateProjectCategorySchema.parse(data);

    if (parsed.code) {
      const existing = await db.projectCategoryItem.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode kategori "${parsed.code}" sudah digunakan.` };
      }
    }

    const updated = await db.projectCategoryItem.update({
      where: { id },
      data: {
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Kategori ${updated.code} - ${updated.name}`,
      notes: `Kategori proyek "${updated.name}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/project-categories");
    return { success: true, category: updated };
  } catch (err: unknown) {
    console.error("Gagal memperbarui kategori proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui kategori proyek.") };
  }
}

export async function deleteMasterDataProjectCategoryAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const [existing, projectCount] = await Promise.all([
      db.projectCategoryItem.findUnique({ where: { id } }),
      db.project.count({ where: { projectCategoryId: id } }),
    ]);

    if (!existing) {
      return { success: false, error: "Kategori proyek tidak ditemukan." };
    }
    if (projectCount > 0) {
      return {
        success: false,
        error: `Kategori proyek tidak dapat dihapus karena masih digunakan pada ${projectCount} proyek.`,
      };
    }

    await db.projectCategoryItem.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Kategori ${existing.code} - ${existing.name}`,
      notes: `Kategori proyek "${existing.name}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/project-categories");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus kategori proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus kategori proyek.") };
  }
}

// 10. Tipe Proyek

export async function addMasterDataProjectTypeAction(data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateProjectTypeSchema.parse(data);

    const existing = await db.projectTypeItem.findUnique({ where: { code: parsed.code } });
    if (existing) {
      return { success: false, error: `Kode tipe proyek "${parsed.code}" sudah terdaftar.` };
    }

    const item = await db.projectTypeItem.create({
      data: {
        id: parsed.id || undefined,
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        status: parsed.status || "Active",
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: item.id,
      entityTitle: `Tipe Proyek ${item.code} - ${item.name}`,
      notes: `Tipe proyek "${item.name}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/project-types");
    return { success: true, projectType: item };
  } catch (err: unknown) {
    console.error("Gagal menambah tipe proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah tipe proyek.") };
  }
}

export async function updateMasterDataProjectTypeAction(id: string, data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateProjectTypeSchema.parse(data);

    if (parsed.code) {
      const existing = await db.projectTypeItem.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode tipe proyek "${parsed.code}" sudah digunakan.` };
      }
    }

    const updated = await db.projectTypeItem.update({
      where: { id },
      data: {
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Tipe Proyek ${updated.code} - ${updated.name}`,
      notes: `Tipe proyek "${updated.name}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/project-types");
    return { success: true, projectType: updated };
  } catch (err: unknown) {
    console.error("Gagal memperbarui tipe proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui tipe proyek.") };
  }
}

export async function deleteMasterDataProjectTypeAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const existing = await db.projectTypeItem.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Tipe proyek tidak ditemukan." };
    }

    const usageCount = await db.project.count({ where: { projectType: existing.name } });
    if (usageCount > 0) {
      return {
        success: false,
        error: `Tipe proyek tidak dapat dihapus karena masih digunakan oleh ${usageCount} proyek.`,
      };
    }

    await db.projectTypeItem.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Tipe Proyek ${existing.code} - ${existing.name}`,
      notes: `Tipe proyek "${existing.name}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/project-types");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus tipe proyek:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus tipe proyek.") };
  }
}

// 11. Tipe Pengadaan

export async function addMasterDataProcurementTypeAction(data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = CreateProcurementTypeSchema.parse(data);

    const existing = await db.procurementTypeItem.findUnique({ where: { code: parsed.code } });
    if (existing) {
      return { success: false, error: `Kode metode pengadaan "${parsed.code}" sudah terdaftar.` };
    }

    const item = await db.procurementTypeItem.create({
      data: {
        id: parsed.id || undefined,
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        status: parsed.status || "Active",
      },
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "MASTER_DATA",
      entityId: item.id,
      entityTitle: `Metode Pengadaan ${item.code} - ${item.name}`,
      notes: `Metode pengadaan "${item.name}" ditambahkan oleh ${admin.name}`,
    });

    revalidatePath("/master-data/procurement-types");
    return { success: true, procurementType: item };
  } catch (err: unknown) {
    console.error("Gagal menambah tipe pengadaan:", err);
    return { success: false, error: formatActionError(err, "Gagal menambah metode pengadaan.") };
  }
}

export async function updateMasterDataProcurementTypeAction(id: string, data: unknown) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const parsed = UpdateProcurementTypeSchema.parse(data);

    if (parsed.code) {
      const existing = await db.procurementTypeItem.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode metode pengadaan "${parsed.code}" sudah digunakan.` };
      }
    }

    const updated = await db.procurementTypeItem.update({
      where: { id },
      data: {
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        status: parsed.status,
      },
    });

    await recordServerAuditLog({
      action: "UPDATE",
      entityType: "MASTER_DATA",
      entityId: updated.id,
      entityTitle: `Metode Pengadaan ${updated.code} - ${updated.name}`,
      notes: `Metode pengadaan "${updated.name}" diperbarui oleh ${admin.name}`,
    });

    revalidatePath("/master-data/procurement-types");
    return { success: true, procurementType: updated };
  } catch (err: unknown) {
    console.error("Gagal memperbarui tipe pengadaan:", err);
    return { success: false, error: formatActionError(err, "Gagal memperbarui metode pengadaan.") };
  }
}

export async function deleteMasterDataProcurementTypeAction(id: string) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const existing = await db.procurementTypeItem.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Metode pengadaan tidak ditemukan." };
    }

    const usageCount = await db.project.count({ where: { procurementType: existing.name } });
    if (usageCount > 0) {
      return {
        success: false,
        error: `Metode pengadaan tidak dapat dihapus karena masih digunakan oleh ${usageCount} proyek.`,
      };
    }

    await db.procurementTypeItem.delete({ where: { id } });

    await recordServerAuditLog({
      action: "DELETE",
      entityType: "MASTER_DATA",
      entityId: id,
      entityTitle: `Metode Pengadaan ${existing.code} - ${existing.name}`,
      notes: `Metode pengadaan "${existing.name}" dihapus oleh ${admin.name}`,
    });

    revalidatePath("/master-data/procurement-types");
    return { success: true };
  } catch (err: unknown) {
    console.error("Gagal menghapus tipe pengadaan:", err);
    return { success: false, error: formatActionError(err, "Gagal menghapus metode pengadaan.") };
  }
}
