"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Layers,
  Tags,
  FolderGit2,
  Package,
  Truck,
  Users2,
  Shield,
  ShieldCheck,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  LayoutGrid,
  List,
  Lock,
  History,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useAppState } from "@/context/app-state-context";
import { cn, formatIDDate, formatIDR, formatWibTime } from "@/lib/utils";

type DomainKey = "OPERASIONAL" | "KLASIFIKASI" | "LOGISTIK" | "TATA_KELOLA";
type DomainFilter = "ALL" | DomainKey;
type ViewMode = "grid" | "table";

interface SubLinkItem {
  label: string;
  href: string;
}

interface MasterModuleItem {
  id: string;
  title: string;
  shortTitle: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  domain: DomainKey;
  domainLabel: string;
  activeCount: number;
  totalCount: number;
  activeCountLabel: string;
  metaSummary: string;
  deepLinks: SubLinkItem[];
  featured?: boolean;
}

const DOMAIN_ORDER: DomainKey[] = [
  "OPERASIONAL",
  "KLASIFIKASI",
  "LOGISTIK",
  "TATA_KELOLA",
];

const DOMAIN_LABELS: Record<DomainFilter, string> = {
  ALL: "Semua Modul",
  OPERASIONAL: "Organisasi & Wilayah",
  KLASIFIKASI: "Klasifikasi Proyek",
  LOGISTIK: "Logistik & Vendor SAP",
  TATA_KELOLA: "Tata Kelola & Akses",
};

const DOMAIN_DESCRIPTIONS: Record<DomainKey, string> = {
  OPERASIONAL: "Hierarki wilayah, perusahaan (PT), kebun, dan blok HGU sebagai referensi lokasi proyek.",
  KLASIFIKASI: "Standar kategori pekerjaan sipil, tipe proyek, dan metode pengadaan barang atau jasa.",
  LOGISTIK: "Katalog material standar SAP dan direktori rekanan kontraktor serta pemasok.",
  TATA_KELOLA: "Akun pengguna, matriks izin peran (RBAC), dan batas pagu persetujuan AFCE.",
};

function formatAuditAction(action: string): string {
  switch (action) {
    case "CREATE":
      return "Tambah";
    case "UPDATE":
      return "Ubah";
    case "DELETE":
      return "Hapus";
    case "RESTORE":
      return "Pulihkan";
    default:
      return action;
  }
}

export default function MasterDataHubPage() {
  const {
    isLoading,
    loadError,
    canManageSystem,
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
  } = useAppState();

  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const activeRegions = useMemo(
    () => regions.filter((r) => r.status === "Active").length,
    [regions]
  );
  const activeCompanies = useMemo(
    () => companies.filter((c) => c.status === "Active").length,
    [companies]
  );
  const activeLocations = useMemo(
    () => locations.filter((l) => l.status === "Active").length,
    [locations]
  );
  const activeBlocks = useMemo(
    () => blocks.filter((b) => b.status === "Active").length,
    [blocks]
  );
  const activeCategories = useMemo(
    () => (projectCategories || []).filter((p) => p.status === "Active").length,
    [projectCategories]
  );
  const activeProjectTypes = useMemo(
    () => (projectTypes || []).filter((p) => p.status === "Active").length,
    [projectTypes]
  );
  const activeProcurementTypes = useMemo(
    () => (procurementTypes || []).filter((p) => p.status === "Active").length,
    [procurementTypes]
  );
  const activeMaterials = useMemo(
    () => materials.filter((m) => m.status === "Active").length,
    [materials]
  );
  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.status === "Active").length,
    [suppliers]
  );
  const activeUsers = useMemo(
    () => users.filter((u) => u.status === "Active").length,
    [users]
  );
  const activeApprovalTiers = useMemo(
    () => approvalMatrix.filter((a) => a.active).length,
    [approvalMatrix]
  );

  const approvalCeilingSummary = useMemo(() => {
    const activeRules = approvalMatrix.filter((a) => a.active);
    if (activeRules.length === 0) {
      return "Belum ada tier aktif";
    }
    const maxVal = Math.max(...activeRules.map((a) => Number(a.maxValue) || 0));
    if (maxVal <= 0) {
      return `${activeRules.length} tier aktif`;
    }
    return `Pagu tertinggi ${formatIDR(maxVal)}`;
  }, [approvalMatrix]);

  const masterModules: MasterModuleItem[] = useMemo(
    () => [
      {
        id: "locations",
        title: "Struktur Organisasi & Lokasi Kebun",
        shortTitle: "Organisasi & Kebun",
        desc: "Hierarki Wilayah, Perusahaan (PT), Kebun (Estate), dan Blok petak tanam HGU perkebunan.",
        href: "/master-data/locations",
        icon: MapPin,
        domain: "OPERASIONAL",
        domainLabel: DOMAIN_LABELS.OPERASIONAL,
        activeCount: activeLocations + activeCompanies + activeRegions + activeBlocks,
        totalCount: locations.length + companies.length + regions.length + blocks.length,
        activeCountLabel: `${activeLocations} kebun aktif dari ${locations.length} terdaftar`,
        metaSummary: `${regions.length} wilayah, ${companies.length} PT, ${blocks.length} blok HGU`,
        deepLinks: [
          { label: `Kebun (${locations.length})`, href: "/master-data/locations?tab=estates" },
          { label: `Perusahaan PT (${companies.length})`, href: "/master-data/locations?tab=companies" },
          { label: `Wilayah (${regions.length})`, href: "/master-data/locations?tab=regions" },
          { label: `Blok HGU (${blocks.length})`, href: "/master-data/locations?tab=blocks" },
        ],
        featured: true,
      },
      {
        id: "project-categories",
        title: "Kategori Proyek Teknik Kebun",
        shortTitle: "Kategori Proyek",
        desc: "Klasifikasi standar kelompok pekerjaan teknik sipil kebun (bangunan air, tanggul, desilting, jembatan, dan jalan).",
        href: "/master-data/project-categories",
        icon: Tags,
        domain: "KLASIFIKASI",
        domainLabel: DOMAIN_LABELS.KLASIFIKASI,
        activeCount: activeCategories,
        totalCount: projectCategories?.length || 0,
        activeCountLabel: `${activeCategories} kategori aktif`,
        metaSummary: `${projectCategories?.length || 0} total kategori terdaftar`,
        deepLinks: [],
      },
      {
        id: "project-types",
        title: "Tipe Proyek & Konstruksi",
        shortTitle: "Tipe Proyek",
        desc: "Klasifikasi lingkup konstruksi fisik infrastruktur kebun, pengadaan material, atau paket gabungan.",
        href: "/master-data/project-types",
        icon: Layers,
        domain: "KLASIFIKASI",
        domainLabel: DOMAIN_LABELS.KLASIFIKASI,
        activeCount: activeProjectTypes,
        totalCount: projectTypes?.length || 0,
        activeCountLabel: `${activeProjectTypes} tipe aktif`,
        metaSummary: `${projectTypes?.length || 0} total tipe terdaftar`,
        deepLinks: [],
      },
      {
        id: "procurement-types",
        title: "Metode & Tipe Pengadaan",
        shortTitle: "Tipe Pengadaan",
        desc: "Pengaturan metode tender rekanan kontraktor, swakelola tim internal kebun, dan pembelian langsung.",
        href: "/master-data/procurement-types",
        icon: FolderGit2,
        domain: "KLASIFIKASI",
        domainLabel: DOMAIN_LABELS.KLASIFIKASI,
        activeCount: activeProcurementTypes,
        totalCount: procurementTypes?.length || 0,
        activeCountLabel: `${activeProcurementTypes} metode aktif`,
        metaSummary: `${procurementTypes?.length || 0} total metode terdaftar`,
        deepLinks: [],
      },
      {
        id: "materials",
        title: "Katalog Material Standar SAP",
        shortTitle: "Katalog Material",
        desc: "Daftar material konstruksi sipil, pipa drainase, batu kali, beton, beserta kode dan harga standar SAP.",
        href: "/master-data/materials",
        icon: Package,
        domain: "LOGISTIK",
        domainLabel: DOMAIN_LABELS.LOGISTIK,
        activeCount: activeMaterials,
        totalCount: materials.length,
        activeCountLabel: `${activeMaterials} material aktif`,
        metaSummary: `${materials.length} item dalam katalog SAP`,
        deepLinks: [],
      },
      {
        id: "suppliers",
        title: "Direktori Rekanan & Vendor",
        shortTitle: "Supplier Rekanan",
        desc: "Daftar kontraktor rekanan, pemasok material, nomor NPWP, kontak PIC, dan catatan penilaian performa.",
        href: "/master-data/suppliers",
        icon: Truck,
        domain: "LOGISTIK",
        domainLabel: DOMAIN_LABELS.LOGISTIK,
        activeCount: activeSuppliers,
        totalCount: suppliers.length,
        activeCountLabel: `${activeSuppliers} vendor aktif`,
        metaSummary: `${suppliers.length} rekanan terdaftar`,
        deepLinks: [],
      },
      {
        id: "users",
        title: "Pengguna & Penugasan Kebun",
        shortTitle: "User & Role",
        desc: "Manajemen akun Manager Kebun, Area Engineer, Direksi HO, Procurement Officer, serta penempatan lokasi.",
        href: "/master-data/users",
        icon: Users2,
        domain: "TATA_KELOLA",
        domainLabel: DOMAIN_LABELS.TATA_KELOLA,
        activeCount: activeUsers,
        totalCount: users.length,
        activeCountLabel: `${activeUsers} akun aktif`,
        metaSummary: `${users.length} total akun terdaftar`,
        deepLinks: [{ label: "Atur Matriks RBAC", href: "/master-data/rbac" }],
      },
      {
        id: "rbac",
        title: "Matriks Izin Peran (RBAC)",
        shortTitle: "Matriks RBAC",
        desc: "Pengaturan hak akses modul untuk empat peran baku sistem: Admin, PIC, Approver, dan Viewer.",
        href: "/master-data/rbac",
        icon: Shield,
        domain: "TATA_KELOLA",
        domainLabel: DOMAIN_LABELS.TATA_KELOLA,
        activeCount: 4,
        totalCount: 4,
        activeCountLabel: "4 peran baku aktif",
        metaSummary: `${activeUsers} akun terpetakan ke peran`,
        deepLinks: [],
      },
      {
        id: "approval-matrix",
        title: "Matriks Approval AFCE",
        shortTitle: "Matriks Approval",
        desc: "Pengaturan tier pagu anggaran AFCE dan hierarki persetujuan berjenjang level 1 hingga 9.",
        href: "/master-data/approval-matrix",
        icon: ShieldCheck,
        domain: "TATA_KELOLA",
        domainLabel: DOMAIN_LABELS.TATA_KELOLA,
        activeCount: activeApprovalTiers,
        totalCount: approvalMatrix.length,
        activeCountLabel: `${activeApprovalTiers} tier berlaku`,
        metaSummary: approvalCeilingSummary,
        deepLinks: [],
      },
    ],
    [
      activeLocations,
      activeCompanies,
      activeRegions,
      activeBlocks,
      locations.length,
      companies.length,
      regions.length,
      blocks.length,
      activeCategories,
      projectCategories,
      activeProjectTypes,
      projectTypes,
      activeProcurementTypes,
      procurementTypes,
      activeMaterials,
      materials.length,
      activeSuppliers,
      suppliers.length,
      activeUsers,
      users.length,
      activeApprovalTiers,
      approvalMatrix.length,
      approvalCeilingSummary,
    ]
  );

  const totalActiveEntities = useMemo(
    () =>
      activeRegions +
      activeCompanies +
      activeLocations +
      activeBlocks +
      activeCategories +
      activeProjectTypes +
      activeProcurementTypes +
      activeMaterials +
      activeSuppliers +
      activeUsers +
      activeApprovalTiers,
    [
      activeRegions,
      activeCompanies,
      activeLocations,
      activeBlocks,
      activeCategories,
      activeProjectTypes,
      activeProcurementTypes,
      activeMaterials,
      activeSuppliers,
      activeUsers,
      activeApprovalTiers,
    ]
  );

  const readyModulesCount = useMemo(
    () => masterModules.filter((m) => m.activeCount > 0).length,
    [masterModules]
  );

  const domainFilters = useMemo(
    () => [
      {
        id: "ALL" as DomainFilter,
        label: DOMAIN_LABELS.ALL,
        count: masterModules.length,
        metric: `${totalActiveEntities} entitas aktif`,
      },
      {
        id: "OPERASIONAL" as DomainFilter,
        label: DOMAIN_LABELS.OPERASIONAL,
        count: masterModules.filter((m) => m.domain === "OPERASIONAL").length,
        metric: `${activeLocations} kebun, ${activeBlocks} blok`,
      },
      {
        id: "KLASIFIKASI" as DomainFilter,
        label: DOMAIN_LABELS.KLASIFIKASI,
        count: masterModules.filter((m) => m.domain === "KLASIFIKASI").length,
        metric: `${activeCategories} kategori, ${activeProjectTypes} tipe`,
      },
      {
        id: "LOGISTIK" as DomainFilter,
        label: DOMAIN_LABELS.LOGISTIK,
        count: masterModules.filter((m) => m.domain === "LOGISTIK").length,
        metric: `${activeMaterials} material, ${activeSuppliers} vendor`,
      },
      {
        id: "TATA_KELOLA" as DomainFilter,
        label: DOMAIN_LABELS.TATA_KELOLA,
        count: masterModules.filter((m) => m.domain === "TATA_KELOLA").length,
        metric: `${activeUsers} akun, ${activeApprovalTiers} tier AFCE`,
      },
    ],
    [
      masterModules,
      totalActiveEntities,
      activeLocations,
      activeBlocks,
      activeCategories,
      activeProjectTypes,
      activeMaterials,
      activeSuppliers,
      activeUsers,
      activeApprovalTiers,
    ]
  );

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return masterModules.filter((mod) => {
      const matchesDomain = selectedDomain === "ALL" || mod.domain === selectedDomain;
      const matchesSearch =
        !query ||
        mod.title.toLowerCase().includes(query) ||
        mod.shortTitle.toLowerCase().includes(query) ||
        mod.desc.toLowerCase().includes(query) ||
        mod.domainLabel.toLowerCase().includes(query) ||
        mod.metaSummary.toLowerCase().includes(query) ||
        mod.deepLinks.some((link) => link.label.toLowerCase().includes(query));
      return matchesDomain && matchesSearch;
    });
  }, [masterModules, selectedDomain, search]);

  const groupedModules = useMemo(() => {
    return DOMAIN_ORDER.map((domain) => ({
      domain,
      label: DOMAIN_LABELS[domain],
      description: DOMAIN_DESCRIPTIONS[domain],
      items: filteredModules.filter((m) => m.domain === domain),
    })).filter((group) => group.items.length > 0);
  }, [filteredModules]);

  const recentMasterLogs = useMemo(() => {
    return (auditLogs || [])
      .filter((log) => log.entityType === "MASTER_DATA")
      .slice(0, 5);
  }, [auditLogs]);

  const isGroupedGrid =
    viewMode === "grid" && selectedDomain === "ALL" && search.trim().length === 0;

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded bg-muted animate-pulse" />
            <div className="h-4 w-96 max-w-full rounded bg-muted animate-pulse" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Memuat ringkasan master data...
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[72px] rounded-lg border bg-card p-3 space-y-2 animate-pulse"
            >
              <div className="h-3.5 w-28 rounded bg-muted" />
              <div className="h-3 w-36 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-lg border bg-card p-4 space-y-3 animate-pulse"
            >
              <div className="h-5 w-44 rounded bg-muted" />
              <div className="h-3.5 w-full rounded bg-muted" />
              <div className="h-3.5 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/40 bg-card p-6 max-w-xl mx-auto my-8 space-y-3"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-5 h-5 text-destructive shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h1 className="text-base font-bold text-foreground">
              Gagal Memuat Master Data
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {loadError}
            </p>
          </div>
        </div>
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            className="min-h-[44px] gap-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Muat Ulang Halaman</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Operasional & Ringkasan Kesiapan */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Master Data Operasional
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Referensi wilayah kebun, klasifikasi pekerjaan teknik, katalog material SAP, rekanan vendor, dan aturan wewenang AFCE.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-card text-xs">
            <Database className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="font-mono font-semibold text-foreground">
              {totalActiveEntities}
            </span>
            <span className="text-muted-foreground">entitas aktif</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-card text-xs">
            {readyModulesCount === masterModules.length ? (
              <CheckCircle2
                className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <AlertTriangle
                className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0"
                aria-hidden="true"
              />
            )}
            <span className="font-mono font-semibold text-foreground">
              {readyModulesCount}/{masterModules.length}
            </span>
            <span className="text-muted-foreground">modul terisi</span>
          </div>
        </div>
      </header>

      {/* Pemberitahuan Mode Baca untuk Non-Admin */}
      {!canManageSystem && (
        <div
          role="note"
          className="flex items-start gap-2.5 rounded-lg border bg-muted/40 px-4 py-3 text-xs text-foreground"
        >
          <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            Mode baca aktif. Perubahan data master hanya dapat dilakukan oleh pengguna dengan peran Admin.
          </p>
        </div>
      )}

      {/* 2. Domain Summary Filter Bar Interaktif (Menggabungkan Ringkasan + Filter Domain) */}
      <section aria-label="Filter domain master data">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {domainFilters.map((item) => {
            const active = selectedDomain === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedDomain(item.id)}
                className={cn(
                  "min-h-[60px] rounded-lg border px-3.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted/60 active:bg-muted"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold truncate">{item.label}</span>
                  <span
                    className={cn(
                      "text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0",
                      active
                        ? "bg-primary-foreground/15 text-primary-foreground font-semibold"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.count}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-[11px] mt-1 truncate",
                    active ? "text-primary-foreground/90" : "text-muted-foreground"
                  )}
                >
                  {item.metric}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Toolbar Pencarian & Pengalih Tampilan */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <label htmlFor="master-data-search" className="sr-only">
            Cari modul master data
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="master-data-search"
            type="text"
            placeholder="Cari modul, entitas, atau kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-9 pr-11 text-sm sm:text-xs bg-card"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Hapus pencarian"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="Mode tampilan direktori"
          className="inline-flex items-center rounded-lg border bg-muted/40 p-1 self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Tampilan kartu"
            className={cn(
              "min-h-[44px] sm:min-h-[36px] px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              viewMode === "grid"
                ? "bg-card text-foreground shadow-sm font-semibold border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            <span>Kartu</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            aria-label="Tampilan tabel"
            className={cn(
              "min-h-[44px] sm:min-h-[36px] px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              viewMode === "table"
                ? "bg-card text-foreground shadow-sm font-semibold border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" aria-hidden="true" />
            <span>Tabel</span>
          </button>
        </div>
      </div>

      {/* 4A. TAMPILAN KARTU: Dikelompokkan per Domain (Default) atau Flat saat Difilter */}
      {viewMode === "grid" && filteredModules.length > 0 && (
        isGroupedGrid ? (
          <div className="space-y-7">
            {groupedModules.map((group) => (
              <section key={group.domain} aria-labelledby={`domain-heading-${group.domain}`} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <h2
                    id={`domain-heading-${group.domain}`}
                    className="text-sm font-bold text-foreground tracking-tight"
                  >
                    {group.label}
                  </h2>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>

                <div
                  className={cn(
                    "grid gap-3.5",
                    group.items.length === 1
                      ? "grid-cols-1"
                      : group.items.length === 2
                      ? "grid-cols-1 md:grid-cols-2"
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  )}
                >
                  {group.items.map((mod) => (
                    <ModuleCard key={mod.id} mod={mod} showDomainBadge={false} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredModules.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} showDomainBadge={selectedDomain === "ALL"} />
            ))}
          </div>
        )
      )}

      {/* 4B. TAMPILAN TABEL */}
      {viewMode === "table" && filteredModules.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[240px]">Modul Master Data</TableHead>
                <TableHead className="min-w-[160px]">Domain</TableHead>
                <TableHead className="min-w-[200px]">Ringkasan Data</TableHead>
                <TableHead className="min-w-[160px]">Status</TableHead>
                <TableHead className="min-w-[110px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.map((mod) => {
                const Icon = mod.icon;
                const isEmpty = mod.activeCount === 0;
                return (
                  <TableRow key={mod.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-md border bg-muted/60 text-foreground/80 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" aria-hidden={true} />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={mod.href}
                            className="font-semibold text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                          >
                            {mod.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {mod.desc}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground font-medium">
                        {mod.domainLabel}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1.5">
                        <p className="text-xs text-foreground">{mod.metaSummary}</p>
                        {mod.deepLinks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {mod.deepLinks.map((chip) => (
                              <Link
                                key={chip.href}
                                href={chip.href}
                                className="inline-flex items-center text-[11px] font-mono px-2 py-1 rounded border border-border bg-muted/50 text-foreground hover:border-primary/50 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {chip.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <ModuleStatusText isEmpty={isEmpty} label={mod.activeCountLabel} />
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        href={mod.href}
                        className="inline-flex items-center justify-center min-h-[36px] px-3 rounded-md text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                      >
                        Buka Modul
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 5. Empty State Pencarian / Filter */}
      {filteredModules.length === 0 && (
        <div className="py-12 px-4 text-center border border-dashed rounded-lg bg-card space-y-3">
          <Database
            className="w-8 h-8 mx-auto text-muted-foreground/60"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-foreground">
              Modul Master Data Tidak Ditemukan
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Tidak ada modul pada kategori &quot;{DOMAIN_LABELS[selectedDomain]}&quot;
              {search.trim() ? ` yang cocok dengan kata kunci "${search.trim()}"` : ""}.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              setSelectedDomain("ALL");
            }}
            className="min-h-[44px] text-xs"
          >
            Reset Semua Filter
          </Button>
        </div>
      )}

      {/* 6. Ringkasan Perubahan Master Data Terakhir (Data Nyata dari auditLogs) */}
      <section
        aria-labelledby="recent-master-changes-heading"
        className="rounded-lg border bg-card p-4 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <h2
              id="recent-master-changes-heading"
              className="text-sm font-bold text-foreground"
            >
              Perubahan Master Data Terakhir
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded self-start sm:self-auto"
          >
            Lihat jejak audit di Dashboard
          </Link>
        </div>

        {recentMasterLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            Belum ada catatan perubahan master data yang terekam pada sistem.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentMasterLogs.map((log) => (
              <li
                key={log.id}
                className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <Badge variant="outline" className="text-[11px] font-medium shrink-0">
                    {formatAuditAction(log.action)}
                  </Badge>
                  <span className="font-medium text-foreground truncate">
                    {log.entityTitle || log.notes || "Perubahan entitas master data"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
                  <span>{log.userName}</span>
                  <span aria-hidden="true">/</span>
                  <span className="font-mono">
                    {formatIDDate(log.createdAt)} {formatWibTime(log.createdAt)} WIB
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ModuleStatusText({
  isEmpty,
  label,
}: {
  isEmpty: boolean;
  label: string;
}) {
  if (isEmpty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Perlu dilengkapi (0 aktif)</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <CheckCircle2
        className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0"
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

function ModuleCard({
  mod,
  showDomainBadge,
}: {
  mod: MasterModuleItem;
  showDomainBadge: boolean;
}) {
  const Icon = mod.icon;
  const isEmpty = mod.activeCount === 0;

  return (
    <article className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/60 flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-9 rounded-md border border-border bg-muted/60 text-foreground/80 group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center shrink-0 transition-colors">
              <Icon className="w-4 h-4" aria-hidden={true} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-tight text-foreground leading-snug">
                <Link
                  href={mod.href}
                  className="hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {mod.title}
                </Link>
              </h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                {mod.metaSummary}
              </p>
            </div>
          </div>

          {showDomainBadge && (
            <Badge variant="outline" className="text-[11px] font-medium shrink-0">
              {mod.domainLabel}
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {mod.desc}
        </p>

        {mod.deepLinks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {mod.deepLinks.map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="inline-flex items-center min-h-[36px] sm:min-h-[30px] px-2.5 py-1 rounded-md border border-border bg-muted/40 text-xs sm:text-[11px] font-mono text-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border/70 flex items-center justify-between gap-2">
        <ModuleStatusText isEmpty={isEmpty} label={mod.activeCountLabel} />

        <Link
          href={mod.href}
          className="inline-flex items-center min-h-[36px] px-2.5 -mr-2.5 rounded-md text-xs font-semibold text-primary hover:bg-primary/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shrink-0"
        >
          Buka Modul
        </Link>
      </div>
    </article>
  );
}
