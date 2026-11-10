"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
import { revalidatePath } from "next/cache";

export async function addMasterDataLocationAction(data: any) {
  await requireRole(["ADMIN"]);
  const loc = await db.estateLocation.create({
    data: {
      code: data.code,
      name: data.name,
      regionId: data.regionId,
      companyId: data.companyId,
      district: data.district,
      hectares: Number(data.hectares) || 0,
      status: data.status || "Active",
    },
  });
  revalidatePath("/master-data/locations");
  return { success: true, location: loc };
}

export async function addMasterDataMaterialAction(data: any) {
  await requireRole(["ADMIN"]);
  const mat = await db.materialCatalogItem.create({
    data: {
      sapCode: data.sapCode,
      name: data.name,
      category: data.category,
      unit: data.unit,
      standardPrice: Number(data.standardPrice) || 0,
      status: data.status || "Active",
    },
  });
  revalidatePath("/master-data/materials");
  return { success: true, material: mat };
}

export async function addMasterDataSupplierAction(data: any) {
  await requireRole(["ADMIN"]);
  const sup = await db.supplier.create({
    data: {
      code: data.code,
      name: data.name,
      category: data.category,
      contactPerson: data.contactPerson,
      phone: data.phone,
      npwp: data.npwp,
      rating: Number(data.rating) || 5,
      status: data.status || "Active",
    },
  });
  revalidatePath("/master-data/suppliers");
  return { success: true, supplier: sup };
}

export async function addMasterDataUserAction(data: any) {
  const admin = await requireRole(["ADMIN"]);
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(data.password || "wmtoolkit2026", 10);

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.systemRole || "PIC",
      jabatan: data.jabatan,
      estateName: data.estateName,
      isActive: data.status === "Active",
    },
  });
  revalidatePath("/master-data/users");
  return { success: true, user };
}

export async function updateApprovalMatrixAction(id: string, levels: any[]) {
  await requireRole(["ADMIN"]);
  const updated = await db.approvalMatrixRule.update({
    where: { id },
    data: { levels: levels as any },
  });
  revalidatePath("/master-data/approval-matrix");
  return { success: true, matrix: updated };
}
