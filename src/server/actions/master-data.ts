"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
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
  CreateProjectCategorySchema,
  UpdateProjectCategorySchema,
  CreateProjectTypeSchema,
  UpdateProjectTypeSchema,
  CreateProcurementTypeSchema,
  UpdateProcurementTypeSchema,
} from "@/server/schemas";

// ==========================================
// 1. KEBUN (ESTATE LOCATION) ACTIONS
// ==========================================

export async function addMasterDataLocationAction(rawInput: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateEstateLocationSchema.parse(rawInput);

    const existing = await db.estateLocation.findUnique({
      where: { code: parsed.code },
    });
    if (existing) {
      return { success: false, error: `Kode kebun "${parsed.code}" sudah terdaftar. Gunakan kode lain.` };
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

    revalidatePath("/master-data/locations");
    return { success: true, location: loc };
  } catch (err: any) {
    console.error("Gagal menambah data kebun:", err);
    return { success: false, error: err.message || "Gagal menambah data kebun." };
  }
}

export async function updateMasterDataLocationAction(id: string, rawInput: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = UpdateEstateLocationSchema.parse(rawInput);

    if (parsed.code) {
      const existing = await db.estateLocation.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode kebun "${parsed.code}" sudah digunakan oleh kebun lain.` };
      }
    }

    const updated = await db.estateLocation.update({
      where: { id },
      data: {
        code: parsed.code !== undefined ? parsed.code : undefined,
        name: parsed.name !== undefined ? parsed.name : undefined,
        regionId: parsed.regionId !== undefined ? parsed.regionId : undefined,
        companyId: parsed.companyId !== undefined ? parsed.companyId : undefined,
        district: parsed.district !== undefined ? parsed.district : undefined,
        hectares: parsed.hectares !== undefined ? Number(parsed.hectares) : undefined,
        status: parsed.status !== undefined ? parsed.status : undefined,
      },
    });

    revalidatePath("/master-data/locations");
    return { success: true, location: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui data kebun:", err);
    return { success: false, error: err.message || "Gagal memperbarui data kebun." };
  }
}

export async function deleteMasterDataLocationAction(id: string) {
  try {
    await requireRole(["ADMIN"]);

    const [blockCount, projectCount] = await Promise.all([
      db.estateBlock.count({ where: { estateId: id } }),
      db.project.count({ where: { locationId: id } }),
    ]);

    if (blockCount > 0 || projectCount > 0) {
      return {
        success: false,
        error: `Kebun tidak dapat dihapus karena masih terhubung dengan ${blockCount} blok dan ${projectCount} proyek.`,
      };
    }

    await db.estateLocation.delete({ where: { id } });
    revalidatePath("/master-data/locations");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus data kebun:", err);
    return { success: false, error: err.message || "Gagal menghapus data kebun." };
  }
}

// ==========================================
// 2. PERUSAHAAN (COMPANY) ACTIONS
// ==========================================

export async function addMasterDataCompanyAction(rawInput: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateCompanySchema.parse(rawInput);

    const existing = await db.company.findUnique({
      where: { code: parsed.code },
    });
    if (existing) {
      return { success: false, error: `Kode perusahaan "${parsed.code}" sudah terdaftar. Gunakan kode lain.` };
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

    revalidatePath("/master-data/locations");
    return { success: true, company: cmp };
  } catch (err: any) {
    console.error("Gagal menambah data perusahaan:", err);
    return { success: false, error: err.message || "Gagal menambah data perusahaan." };
  }
}

export async function updateMasterDataCompanyAction(id: string, rawInput: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = UpdateCompanySchema.parse(rawInput);

    if (parsed.code) {
      const existing = await db.company.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode perusahaan "${parsed.code}" sudah digunakan oleh perusahaan lain.` };
      }
    }

    const updated = await db.company.update({
      where: { id },
      data: {
        code: parsed.code !== undefined ? parsed.code : undefined,
        name: parsed.name !== undefined ? parsed.name : undefined,
        npwp: parsed.npwp !== undefined ? parsed.npwp : undefined,
        status: parsed.status !== undefined ? parsed.status : undefined,
      },
    });

    revalidatePath("/master-data/locations");
    return { success: true, company: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui data perusahaan:", err);
    return { success: false, error: err.message || "Gagal memperbarui data perusahaan." };
  }
}

export async function deleteMasterDataCompanyAction(id: string) {
  try {
    await requireRole(["ADMIN"]);

    const estateCount = await db.estateLocation.count({ where: { companyId: id } });
    if (estateCount > 0) {
      return {
        success: false,
        error: `Perusahaan tidak dapat dihapus karena masih menaungi ${estateCount} kebun. Hapus atau pindahkan kebun terlebih dahulu.`,
      };
    }

    await db.company.delete({ where: { id } });
    revalidatePath("/master-data/locations");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus data perusahaan:", err);
    return { success: false, error: err.message || "Gagal menghapus data perusahaan." };
  }
}

// ==========================================
// 3. WILAYAH (REGION) ACTIONS
// ==========================================

export async function addMasterDataRegionAction(rawInput: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateRegionSchema.parse(rawInput);

    const existing = await db.region.findUnique({
      where: { code: parsed.code },
    });
    if (existing) {
      return { success: false, error: `Kode wilayah "${parsed.code}" sudah terdaftar. Gunakan kode lain.` };
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

    revalidatePath("/master-data/locations");
    return { success: true, region: reg };
  } catch (err: any) {
    console.error("Gagal menambah data wilayah:", err);
    return { success: false, error: err.message || "Gagal menambah data wilayah." };
  }
}

export async function updateMasterDataRegionAction(id: string, rawInput: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = UpdateRegionSchema.parse(rawInput);

    if (parsed.code) {
      const existing = await db.region.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Kode wilayah "${parsed.code}" sudah digunakan oleh wilayah lain.` };
      }
    }

    const updated = await db.region.update({
      where: { id },
      data: {
        code: parsed.code !== undefined ? parsed.code : undefined,
        name: parsed.name !== undefined ? parsed.name : undefined,
        description: parsed.description !== undefined ? parsed.description : undefined,
        status: parsed.status !== undefined ? parsed.status : undefined,
      },
    });

    revalidatePath("/master-data/locations");
    return { success: true, region: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui data wilayah:", err);
    return { success: false, error: err.message || "Gagal memperbarui data wilayah." };
  }
}

export async function deleteMasterDataRegionAction(id: string) {
  try {
    await requireRole(["ADMIN"]);

    const estateCount = await db.estateLocation.count({ where: { regionId: id } });
    if (estateCount > 0) {
      return {
        success: false,
        error: `Wilayah tidak dapat dihapus karena masih menaungi ${estateCount} kebun. Hapus atau pindahkan kebun terlebih dahulu.`,
      };
    }

    await db.region.delete({ where: { id } });
    revalidatePath("/master-data/locations");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus data wilayah:", err);
    return { success: false, error: err.message || "Gagal menghapus data wilayah." };
  }
}

// ==========================================
// 4. BLOK KEBUN (BLOCK) ACTIONS
// ==========================================

export async function addMasterDataBlockAction(rawInput: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateEstateBlockSchema.parse(rawInput);

    const existing = await db.estateBlock.findFirst({
      where: {
        estateId: parsed.estateId,
        code: parsed.code,
      },
    });
    if (existing) {
      return { success: false, error: `Kode blok "${parsed.code}" sudah terdaftar pada kebun ini. Gunakan kode lain.` };
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

    revalidatePath("/master-data/locations");
    return { success: true, block: blk };
  } catch (err: any) {
    console.error("Gagal menambah data blok:", err);
    return { success: false, error: err.message || "Gagal menambah data blok." };
  }
}

export async function updateMasterDataBlockAction(id: string, rawInput: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = UpdateEstateBlockSchema.parse(rawInput);

    if (parsed.code) {
      const current = await db.estateBlock.findUnique({ where: { id } });
      const targetEstateId = parsed.estateId || current?.estateId;
      if (targetEstateId) {
        const existing = await db.estateBlock.findFirst({
          where: {
            estateId: targetEstateId,
            code: parsed.code,
            NOT: { id },
          },
        });
        if (existing) {
          return { success: false, error: `Kode blok "${parsed.code}" sudah digunakan pada kebun ini.` };
        }
      }
    }

    const updated = await db.estateBlock.update({
      where: { id },
      data: {
        estateId: parsed.estateId !== undefined ? parsed.estateId : undefined,
        code: parsed.code !== undefined ? parsed.code : undefined,
        name: parsed.name !== undefined ? parsed.name : undefined,
        afdeling: parsed.afdeling !== undefined ? parsed.afdeling : undefined,
        cropType: parsed.cropType !== undefined ? parsed.cropType : undefined,
        plantingYear: parsed.plantingYear !== undefined ? Number(parsed.plantingYear) : undefined,
        hectares: parsed.hectares !== undefined ? Number(parsed.hectares) : undefined,
        status: parsed.status !== undefined ? parsed.status : undefined,
      },
    });

    revalidatePath("/master-data/locations");
    return { success: true, block: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui data blok:", err);
    return { success: false, error: err.message || "Gagal memperbarui data blok." };
  }
}

export async function deleteMasterDataBlockAction(id: string) {
  try {
    await requireRole(["ADMIN"]);

    const projectCount = await db.project.count({ where: { blockId: id } });
    if (projectCount > 0) {
      return {
        success: false,
        error: `Blok tidak dapat dihapus karena masih terikat dengan ${projectCount} proyek.`,
      };
    }

    await db.estateBlock.delete({ where: { id } });
    revalidatePath("/master-data/locations");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus data blok:", err);
    return { success: false, error: err.message || "Gagal menghapus data blok." };
  }
}

// ==========================================
// 5. KATALOG MATERIAL (MATERIAL) ACTIONS
// ==========================================

export async function addMasterDataMaterialAction(data: any) {
  try {
    await requireRole(["ADMIN"]);
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
    revalidatePath("/master-data/materials");
    return { success: true, material: mat };
  } catch (err: any) {
    console.error("Gagal menambah material:", err);
    return { success: false, error: err.message || "Gagal menambah material." };
  }
}

export async function updateMasterDataMaterialAction(id: string, data: any) {
  try {
    await requireRole(["ADMIN"]);
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
        sapCode: parsed.sapCode !== undefined ? parsed.sapCode : undefined,
        name: parsed.name !== undefined ? parsed.name : undefined,
        category: parsed.category !== undefined ? parsed.category : undefined,
        unit: parsed.unit !== undefined ? parsed.unit : undefined,
        standardPrice: parsed.standardPrice !== undefined ? Number(parsed.standardPrice) : undefined,
        status: parsed.status !== undefined ? parsed.status : undefined,
      },
    });

    revalidatePath("/master-data/materials");
    return { success: true, material: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui material:", err);
    return { success: false, error: err.message || "Gagal memperbarui material." };
  }
}

export async function deleteMasterDataMaterialAction(id: string) {
  try {
    await requireRole(["ADMIN"]);
    await db.materialCatalogItem.delete({ where: { id } });
    revalidatePath("/master-data/materials");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus material:", err);
    return { success: false, error: err.message || "Gagal menghapus material." };
  }
}

// ==========================================
// 6. DIREKTORI REKANAN (SUPPLIER) ACTIONS
// ==========================================

export async function addMasterDataSupplierAction(data: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateSupplierSchema.parse(data);

    const existing = await db.supplier.findUnique({
      where: { code: parsed.code },
    });
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
    revalidatePath("/master-data/suppliers");
    return { success: true, supplier: sup };
  } catch (err: any) {
    console.error("Gagal menambah rekanan:", err);
    return { success: false, error: err.message || "Gagal menambah rekanan." };
  }
}

export async function updateMasterDataSupplierAction(id: string, data: any) {
  try {
    await requireRole(["ADMIN"]);
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
        code: parsed.code !== undefined ? parsed.code : undefined,
        name: parsed.name !== undefined ? parsed.name : undefined,
        category: parsed.category !== undefined ? parsed.category : undefined,
        contactPerson: parsed.contactPerson !== undefined ? parsed.contactPerson : undefined,
        phone: parsed.phone !== undefined ? parsed.phone : undefined,
        npwp: parsed.npwp !== undefined ? parsed.npwp : undefined,
        rating: parsed.rating !== undefined ? Number(parsed.rating) : undefined,
        status: parsed.status !== undefined ? parsed.status : undefined,
      },
    });

    revalidatePath("/master-data/suppliers");
    return { success: true, supplier: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui rekanan:", err);
    return { success: false, error: err.message || "Gagal memperbarui rekanan." };
  }
}

export async function deleteMasterDataSupplierAction(id: string) {
  try {
    await requireRole(["ADMIN"]);

    const [poCount, evalCount] = await Promise.all([
      db.purchaseOrder.count({ where: { supplierId: id } }),
      db.vendorEvaluation.count({ where: { supplierId: id } }),
    ]);

    if (poCount > 0 || evalCount > 0) {
      return {
        success: false,
        error: `Rekanan tidak dapat dihapus karena masih terhubung dengan ${poCount} PO dan ${evalCount} catatan evaluasi.`,
      };
    }

    await db.supplier.delete({ where: { id } });
    revalidatePath("/master-data/suppliers");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus rekanan:", err);
    return { success: false, error: err.message || "Gagal menghapus rekanan." };
  }
}

// ==========================================
// 7. PENGGUNA SISTEM (USERS) ACTIONS
// ==========================================

export async function addMasterDataUserAction(data: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateUserSchema.parse(data);

    const existing = await db.user.findUnique({
      where: { email: parsed.email },
    });
    if (existing) {
      return { success: false, error: `Email "${parsed.email}" sudah terdaftar.` };
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(parsed.password || "wmtoolkit2026", 10);

    const targetRole = (parsed.role || parsed.systemRole || "PIC") as any;

    const user = await db.user.create({
      data: {
        id: parsed.id || undefined,
        name: parsed.name,
        email: parsed.email,
        passwordHash,
        role: targetRole,
        jabatan: parsed.jabatan || "-",
        estateName: parsed.estateName,
        isActive: parsed.status === "Active",
      },
    });
    revalidatePath("/master-data/users");
    revalidatePath("/master-data/rbac");
    return { success: true, user };
  } catch (err: any) {
    console.error("Gagal menambah pengguna:", err);
    return { success: false, error: err.message || "Gagal menambah pengguna." };
  }
}

export async function updateMasterDataUserAction(id: string, data: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = UpdateUserSchema.parse(data);

    if (parsed.email) {
      const existing = await db.user.findFirst({
        where: { email: parsed.email, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: `Email "${parsed.email}" sudah digunakan oleh pengguna lain.` };
      }
    }

    let passwordHash: string | undefined;
    if (parsed.password && parsed.password.length >= 6) {
      const bcrypt = await import("bcryptjs");
      passwordHash = await bcrypt.hash(parsed.password, 10);
    }

    const roleVal = parsed.systemRole !== undefined ? parsed.systemRole : parsed.role;

    const updated = await db.user.update({
      where: { id },
      data: {
        name: parsed.name !== undefined ? parsed.name : undefined,
        email: parsed.email !== undefined ? parsed.email : undefined,
        passwordHash: passwordHash || undefined,
        role: roleVal !== undefined ? (roleVal as any) : undefined,
        jabatan: parsed.jabatan !== undefined ? parsed.jabatan : undefined,
        estateName: parsed.estateName !== undefined ? parsed.estateName : undefined,
        isActive: parsed.status !== undefined ? parsed.status === "Active" : undefined,
      },
    });

    revalidatePath("/master-data/users");
    revalidatePath("/master-data/rbac");
    return { success: true, user: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui pengguna:", err);
    return { success: false, error: err.message || "Gagal memperbarui pengguna." };
  }
}

export async function deleteMasterDataUserAction(id: string) {
  try {
    const currentAdmin = await requireRole(["ADMIN"]);

    if (currentAdmin.id === id) {
      return { success: false, error: "Anda tidak dapat menghapus akun administrator Anda sendiri." };
    }

    const projectCount = await db.project.count({ where: { picId: id } });
    if (projectCount > 0) {
      // Nonaktifkan jika pernah menjadi PIC proyek
      await db.user.update({
        where: { id },
        data: { isActive: false },
      });
      revalidatePath("/master-data/users");
      return { success: true, deactivated: true };
    }

    await db.user.delete({ where: { id } });
    revalidatePath("/master-data/users");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus pengguna:", err);
    return { success: false, error: err.message || "Gagal menghapus pengguna." };
  }
}

// ==========================================
// 8. MATRIKS PERSETUJUAN (APPROVAL MATRIX)
// ==========================================

export async function updateApprovalMatrixAction(id: string, levels: any[]) {
  try {
    await requireRole(["ADMIN"]);
    const updated = await db.approvalMatrixRule.update({
      where: { id },
      data: { levels: levels as any },
    });
    revalidatePath("/master-data/approval-matrix");
    return { success: true, matrix: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui matriks persetujuan:", err);
    return { success: false, error: err.message || "Gagal memperbarui matriks persetujuan." };
  }
}

export async function addApprovalMatrixRuleAction(data: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateApprovalMatrixRuleSchema.parse(data);

    const rule = await db.approvalMatrixRule.create({
      data: {
        id: parsed.id || undefined,
        tierName: parsed.tierName,
        minValue: Number(parsed.minValue),
        maxValue: Number(parsed.maxValue),
        levels: (parsed.levels || Array(9).fill(null)) as any,
        active: parsed.active ?? true,
      },
    });

    revalidatePath("/master-data/approval-matrix");
    return { success: true, rule };
  } catch (err: any) {
    console.error("Gagal menambah aturan matriks persetujuan:", err);
    return { success: false, error: err.message || "Gagal menambah aturan matriks persetujuan." };
  }
}

export async function updateApprovalMatrixRuleAction(id: string, data: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = UpdateApprovalMatrixRuleSchema.parse(data);

    const updated = await db.approvalMatrixRule.update({
      where: { id },
      data: {
        tierName: parsed.tierName !== undefined ? parsed.tierName : undefined,
        minValue: parsed.minValue !== undefined ? Number(parsed.minValue) : undefined,
        maxValue: parsed.maxValue !== undefined ? Number(parsed.maxValue) : undefined,
        levels: parsed.levels !== undefined ? (parsed.levels as any) : undefined,
        active: parsed.active !== undefined ? parsed.active : undefined,
      },
    });

    revalidatePath("/master-data/approval-matrix");
    return { success: true, rule: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui aturan matriks persetujuan:", err);
    return { success: false, error: err.message || "Gagal memperbarui aturan matriks persetujuan." };
  }
}

export async function deleteApprovalMatrixRuleAction(id: string) {
  try {
    await requireRole(["ADMIN"]);
    await db.approvalMatrixRule.delete({ where: { id } });
    revalidatePath("/master-data/approval-matrix");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus aturan matriks persetujuan:", err);
    return { success: false, error: err.message || "Gagal menghapus aturan matriks persetujuan." };
  }
}

// ==========================================
// 9. KATEGORI PROYEK (PROJECT CATEGORY)
// ==========================================

export async function addMasterDataProjectCategoryAction(data: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateProjectCategorySchema.parse(data);

    const existing = await db.projectCategoryItem.findUnique({
      where: { code: parsed.code },
    });
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

    revalidatePath("/master-data/project-categories");
    return { success: true, category: item };
  } catch (err: any) {
    console.error("Gagal menambah kategori proyek:", err);
    return { success: false, error: err.message || "Gagal menambah kategori proyek." };
  }
}

export async function updateMasterDataProjectCategoryAction(id: string, data: any) {
  try {
    await requireRole(["ADMIN"]);
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
        code: parsed.code !== undefined ? parsed.code : undefined,
        name: parsed.name !== undefined ? parsed.name : undefined,
        description: parsed.description !== undefined ? parsed.description : undefined,
        status: parsed.status !== undefined ? parsed.status : undefined,
      },
    });

    revalidatePath("/master-data/project-categories");
    return { success: true, category: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui kategori proyek:", err);
    return { success: false, error: err.message || "Gagal memperbarui kategori proyek." };
  }
}

export async function deleteMasterDataProjectCategoryAction(id: string) {
  try {
    await requireRole(["ADMIN"]);

    const projectCount = await db.project.count({ where: { projectCategoryId: id } });
    if (projectCount > 0) {
      return {
        success: false,
        error: `Kategori proyek tidak dapat dihapus karena masih digunakan pada ${projectCount} proyek.`,
      };
    }

    await db.projectCategoryItem.delete({ where: { id } });
    revalidatePath("/master-data/project-categories");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus kategori proyek:", err);
    return { success: false, error: err.message || "Gagal menghapus kategori proyek." };
  }
}

// ==========================================
// 10. TIPE PROYEK (PROJECT TYPE)
// ==========================================

export async function addMasterDataProjectTypeAction(data: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateProjectTypeSchema.parse(data);

    const existing = await db.projectTypeItem.findUnique({
      where: { code: parsed.code },
    });
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

    revalidatePath("/master-data/project-types");
    return { success: true, projectType: item };
  } catch (err: any) {
    console.error("Gagal menambah tipe proyek:", err);
    return { success: false, error: err.message || "Gagal menambah tipe proyek." };
  }
}

export async function updateMasterDataProjectTypeAction(id: string, data: any) {
  try {
    await requireRole(["ADMIN"]);
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
        code: parsed.code !== undefined ? parsed.code : undefined,
        name: parsed.name !== undefined ? parsed.name : undefined,
        description: parsed.description !== undefined ? parsed.description : undefined,
        status: parsed.status !== undefined ? parsed.status : undefined,
      },
    });

    revalidatePath("/master-data/project-types");
    return { success: true, projectType: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui tipe proyek:", err);
    return { success: false, error: err.message || "Gagal memperbarui tipe proyek." };
  }
}

export async function deleteMasterDataProjectTypeAction(id: string) {
  try {
    await requireRole(["ADMIN"]);
    await db.projectTypeItem.delete({ where: { id } });
    revalidatePath("/master-data/project-types");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus tipe proyek:", err);
    return { success: false, error: err.message || "Gagal menghapus tipe proyek." };
  }
}

// ==========================================
// 11. TIPE PENGADAAN (PROCUREMENT TYPE)
// ==========================================

export async function addMasterDataProcurementTypeAction(data: any) {
  try {
    await requireRole(["ADMIN"]);
    const parsed = CreateProcurementTypeSchema.parse(data);

    const existing = await db.procurementTypeItem.findUnique({
      where: { code: parsed.code },
    });
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

    revalidatePath("/master-data/procurement-types");
    return { success: true, procurementType: item };
  } catch (err: any) {
    console.error("Gagal menambah tipe pengadaan:", err);
    return { success: false, error: err.message || "Gagal menambah tipe pengadaan." };
  }
}

export async function updateMasterDataProcurementTypeAction(id: string, data: any) {
  try {
    await requireRole(["ADMIN"]);
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
        code: parsed.code !== undefined ? parsed.code : undefined,
        name: parsed.name !== undefined ? parsed.name : undefined,
        description: parsed.description !== undefined ? parsed.description : undefined,
        status: parsed.status !== undefined ? parsed.status : undefined,
      },
    });

    revalidatePath("/master-data/procurement-types");
    return { success: true, procurementType: updated };
  } catch (err: any) {
    console.error("Gagal memperbarui tipe pengadaan:", err);
    return { success: false, error: err.message || "Gagal memperbarui tipe pengadaan." };
  }
}

export async function deleteMasterDataProcurementTypeAction(id: string) {
  try {
    await requireRole(["ADMIN"]);
    await db.procurementTypeItem.delete({ where: { id } });
    revalidatePath("/master-data/procurement-types");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus tipe pengadaan:", err);
    return { success: false, error: err.message || "Gagal menghapus tipe pengadaan." };
  }
}
