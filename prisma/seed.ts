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
import { INITIAL_NOTIFICATION_SETTINGS } from "../src/lib/mock-data/notifications";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Seeding Master Data untuk Produksi:
 * Hanya menginisialisasi pondasi operasional (Wilayah, PT, Kebun, Blok, Material, Rekanan, Akun Pengguna, Matriks Approval, Kategori/Tipe).
 * TIDAK menginjeksi proyek demo percontohan, sehingga aplikasi siap dipakai bersih (0 proyek).
 */
export async function seedDatabase() {
  console.log("🌱 Mulai seeding Master Data Neon PostgreSQL (Clean Production Mode)...");
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
  console.log("-> Seeding Estate Blocks...");
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
  console.log("-> Seeding Materials Catalog...");
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
  console.log("-> Seeding Suppliers/Vendors...");
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
  console.log("-> Seeding Project Categories, Types, & Approval Matrix...");
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
  console.log("-> Seeding Users & Roles...");
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

  // 9. Notification Settings
  console.log("-> Seeding Notification Settings...");
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

  console.log("✅ Seeding Master Data selesai 100%! Sistem siap digunakan untuk produksi (clean production-ready, 0 demo projects).");
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
