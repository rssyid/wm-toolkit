"use client";

import React, { useState, useMemo } from "react";
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
  ArrowRight,
  X,
  Building2,
  LayoutGrid,
  List,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
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
import { cn } from "@/lib/utils";

type DomainFilter = "ALL" | "OPERASIONAL" | "KLASIFIKASI" | "LOGISTIK" | "TATA_KELOLA";
type ViewMode = "grid" | "table";

export default function MasterDataHubPage() {
  const {
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
  } = useAppState();

  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // 8 Canonical Master Data Modules
  const masterModules = useMemo(
    () => [
      {
        id: "locations",
        title: "Struktur Organisasi & Lokasi Kebun",
        shortTitle: "Organisasi & Kebun",
        desc: "Hierarki Wilayah (Region), Perusahaan (Company PT), Kebun (Estate), dan Blok petak tanam HGU perkebunan.",
        href: "/master-data/locations",
        icon: MapPin,
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        domain: "OPERASIONAL" as const,
        domainLabel: "Organisasi & Wilayah",
        domainVariant: "success" as const,
        activeCountLabel: `${locations.filter((l) => l.status === "Active").length} Kebun Aktif`,
        systemTag: "HGU & Geografis",
        subChips: [
          { label: `${locations.length} Kebun`, href: "/master-data/locations?tab=estates" },
          { label: `${companies.length} PT`, href: "/master-data/locations?tab=companies" },
          { label: `${regions.length} Wilayah`, href: "/master-data/locations?tab=regions" },
          { label: `${blocks.length} Blok HGU`, href: "/master-data/locations?tab=blocks" },
        ],
        totalRecords: locations.length + companies.length + regions.length + blocks.length,
      },
      {
        id: "project-categories",
        title: "Kategori Proyek Teknik Kebun",
        shortTitle: "Kategori Proyek",
        desc: "Klasifikasi standar kelompok pekerjaan teknik sipil kebun (Bangunan Air, Tanggul, Desilting, Jembatan & Jalan).",
        href: "/master-data/project-categories",
        icon: Tags,
        iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
        domain: "KLASIFIKASI" as const,
        domainLabel: "Klasifikasi Proyek",
        domainVariant: "outline" as const,
        activeCountLabel: `${(projectCategories || []).filter((p) => p.status === "Active").length} Kategori Aktif`,
        systemTag: "Standar RKP",
        subChips: [
          { label: `${projectCategories?.length || 0} Kategori Standar`, href: "/master-data/project-categories" },
          { label: "Infrastruktur Sipil", href: "/master-data/project-categories" },
        ],
        totalRecords: projectCategories?.length || 0,
      },
      {
        id: "project-types",
        title: "Tipe Proyek & Konstruksi",
        shortTitle: "Tipe Proyek",
        desc: "Klasifikasi lingkup konstruksi fisik infrastruktur kebun, pengadaan material, atau paket turnkey terpadu.",
        href: "/master-data/project-types",
        icon: Layers,
        iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        domain: "KLASIFIKASI" as const,
        domainLabel: "Klasifikasi Proyek",
        domainVariant: "outline" as const,
        activeCountLabel: `${(projectTypes || []).filter((p) => p.status === "Active").length} Tipe Aktif`,
        systemTag: "Work Item Type",
        subChips: [
          { label: `${projectTypes?.length || 0} Tipe Proyek`, href: "/master-data/project-types" },
          { label: "Physical / Material", href: "/master-data/project-types" },
        ],
        totalRecords: projectTypes?.length || 0,
      },
      {
        id: "procurement-types",
        title: "Metode & Tipe Pengadaan",
        shortTitle: "Tipe Pengadaan",
        desc: "Konfigurasi metode tender lelang rekanan kontraktor, swakelola tim internal kebun, dan pembelian langsung.",
        href: "/master-data/procurement-types",
        icon: FolderGit2,
        iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        domain: "KLASIFIKASI" as const,
        domainLabel: "Klasifikasi Proyek",
        domainVariant: "outline" as const,
        activeCountLabel: `${(procurementTypes || []).filter((p) => p.status === "Active").length} Metode Aktif`,
        systemTag: "Kontrak & Pengadaan",
        subChips: [
          { label: `${procurementTypes?.length || 0} Metode Pengadaan`, href: "/master-data/procurement-types" },
          { label: "Tender / Swakelola", href: "/master-data/procurement-types" },
        ],
        totalRecords: procurementTypes?.length || 0,
      },
      {
        id: "materials",
        title: "Katalog Material Standar SAP",
        shortTitle: "Katalog Material",
        desc: "Daftar standar material konstruksi sipil, pipa drainase, batu kali, beton, dan standar harga resmi SAP S/4HANA.",
        href: "/master-data/materials",
        icon: Package,
        iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        domain: "LOGISTIK" as const,
        domainLabel: "Logistik & Vendor SAP",
        domainVariant: "info" as const,
        activeCountLabel: `${materials.filter((m) => m.status === "Active").length} Material Aktif`,
        systemTag: "SAP S/4HANA Ready",
        subChips: [
          { label: `${materials.length} Item Material`, href: "/master-data/materials" },
          { label: "Standar Unit & Harga", href: "/master-data/materials" },
        ],
        totalRecords: materials.length,
      },
      {
        id: "suppliers",
        title: "Direktori Rekanan & Vendor",
        shortTitle: "Supplier Rekanan",
        desc: "Direktori kontraktor rekanan, penyedia material, NPWP legalitas, kontak PIC, dan evaluasi rating performa.",
        href: "/master-data/suppliers",
        icon: Truck,
        iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        domain: "LOGISTIK" as const,
        domainLabel: "Logistik & Vendor SAP",
        domainVariant: "info" as const,
        activeCountLabel: `${suppliers.filter((s) => s.status === "Active").length} Vendor Aktif`,
        systemTag: "Vendor SAP / PO",
        subChips: [
          { label: `${suppliers.length} Vendor Terdaftar`, href: "/master-data/suppliers" },
          { label: "Mitra Terverifikasi", href: "/master-data/suppliers" },
        ],
        totalRecords: suppliers.length,
      },
      {
        id: "users",
        title: "Pengguna & Hak Akses (Users)",
        shortTitle: "User & Role",
        desc: "Manajemen personil Manager Kebun, Area Engineer, Direksi HO, Procurement Officer, dan penugasan kebun.",
        href: "/master-data/users",
        icon: Users2,
        iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        domain: "TATA_KELOLA" as const,
        domainLabel: "Tata Kelola & Akses",
        domainVariant: "warning" as const,
        activeCountLabel: `${users.filter((u) => u.status === "Active").length} Akun Aktif`,
        systemTag: "RBAC Security",
        subChips: [
          { label: `${users.length} Akun Pengguna`, href: "/master-data/users" },
          { label: "Atur RBAC", href: "/master-data/rbac" },
        ],
        totalRecords: users.length,
      },
      {
        id: "rbac",
        title: "Hak Akses & Otoritas Peran (RBAC)",
        shortTitle: "Matriks RBAC",
        desc: "Konfigurasi perizinan matriks wewenang berbasis peran (Admin, PIC, Approver, Viewer) dan penetapan wewenang sistem.",
        href: "/master-data/rbac",
        icon: Shield,
        iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        domain: "TATA_KELOLA" as const,
        domainLabel: "Tata Kelola & Akses",
        domainVariant: "warning" as const,
        activeCountLabel: "4 Peran Sistem",
        systemTag: "Role & Permission",
        subChips: [
          { label: "Matriks Izin Modul", href: "/master-data/rbac" },
          { label: "Penetapan Peran Cepat", href: "/master-data/rbac" },
        ],
        totalRecords: 4,
      },
      {
        id: "approval-matrix",
        title: "Matriks Approval AFCE",
        shortTitle: "Matriks Approval",
        desc: "Konfigurasi batasan nilai pagu anggaran AFCE multi-tier dan delegasi hierarki wewenang persetujuan level 1 - 9.",
        href: "/master-data/approval-matrix",
        icon: ShieldCheck,
        iconBg: "bg-emerald-700/10 text-emerald-700 dark:text-emerald-300 border-emerald-700/20",
        domain: "TATA_KELOLA" as const,
        domainLabel: "Tata Kelola & Akses",
        domainVariant: "warning" as const,
        activeCountLabel: `${approvalMatrix.filter((a) => a.active).length} Tier Berlaku`,
        systemTag: "Otorisasi AFCE",
        subChips: [
          { label: `${approvalMatrix.length} Tier Matriks`, href: "/master-data/approval-matrix" },
          { label: "Pagu s/d >Rp 500 Jt", href: "/master-data/approval-matrix" },
        ],
        totalRecords: approvalMatrix.length,
      },
    ],
    [
      locations,
      companies,
      regions,
      blocks,
      projectCategories,
      projectTypes,
      procurementTypes,
      materials,
      suppliers,
      users,
      approvalMatrix,
    ]
  );

  const domainTabs: { id: DomainFilter; label: string; count: number }[] = useMemo(
    () => [
      { id: "ALL", label: "Semua Modul", count: masterModules.length },
      {
        id: "OPERASIONAL",
        label: "Organisasi & Wilayah",
        count: masterModules.filter((m) => m.domain === "OPERASIONAL").length,
      },
      {
        id: "KLASIFIKASI",
        label: "Klasifikasi Proyek",
        count: masterModules.filter((m) => m.domain === "KLASIFIKASI").length,
      },
      {
        id: "LOGISTIK",
        label: "Logistik & Vendor SAP",
        count: masterModules.filter((m) => m.domain === "LOGISTIK").length,
      },
      {
        id: "TATA_KELOLA",
        label: "Tata Kelola & Akses",
        count: masterModules.filter((m) => m.domain === "TATA_KELOLA").length,
      },
    ],
    [masterModules]
  );

  const filteredModules = useMemo(() => {
    return masterModules.filter((mod) => {
      const matchesDomain = selectedDomain === "ALL" || mod.domain === selectedDomain;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        mod.title.toLowerCase().includes(query) ||
        mod.shortTitle.toLowerCase().includes(query) ||
        mod.desc.toLowerCase().includes(query) ||
        mod.domainLabel.toLowerCase().includes(query) ||
        mod.systemTag.toLowerCase().includes(query) ||
        mod.subChips.some((chip) => chip.label.toLowerCase().includes(query));
      return matchesDomain && matchesSearch;
    });
  }, [masterModules, selectedDomain, search]);

  const totalActiveEntities = useMemo(() => {
    return (
      locations.filter((l) => l.status === "Active").length +
      companies.length +
      regions.length +
      blocks.length +
      (projectCategories || []).filter((p) => p.status === "Active").length +
      (projectTypes || []).filter((p) => p.status === "Active").length +
      (procurementTypes || []).filter((p) => p.status === "Active").length +
      materials.filter((m) => m.status === "Active").length +
      suppliers.filter((s) => s.status === "Active").length +
      users.filter((u) => u.status === "Active").length +
      approvalMatrix.filter((a) => a.active).length
    );
  }, [
    locations,
    companies,
    regions,
    blocks,
    projectCategories,
    projectTypes,
    procurementTypes,
    materials,
    suppliers,
    users,
    approvalMatrix,
  ]);

  return (
    <div className="space-y-5">
      {/* 1. Top Executive Banner & System Overview Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <Database className="w-4 h-4" />
            <span>Master Data Central Hub &bull; WM-Toolkit</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Manajemen Master Data Terpadu
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl leading-relaxed">
            Pusat konfigurasi hierarki kebun, standardisasi klasifikasi proyek, katalog material SAP ERP, direktori rekanan vendor, dan matriks wewenang AFCE.
          </p>
        </div>

        {/* System Health / Status Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-xs shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-foreground">
              {totalActiveEntities} Entitas Terdaftar
            </span>
            <span className="text-muted-foreground">&bull; 8 Modul Siap Pakai</span>
          </div>
        </div>
      </div>

      {/* 2. Sleek 4-Pillar Executive Summary Strip (No redundant links) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 shadow-2xs flex items-center gap-3">
          <div className="size-8 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              Struktur Wilayah
            </p>
            <p className="text-xs font-bold text-foreground truncate mt-0.5">
              {locations.length} Kebun &bull; {companies.length} PT &bull; {blocks.length} Blok
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-2xs flex items-center gap-3">
          <div className="size-8 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
            <Tags className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              Standarisasi Proyek
            </p>
            <p className="text-xs font-bold text-foreground truncate mt-0.5">
              {projectCategories?.length || 0} Kategori &bull; {projectTypes?.length || 0} Tipe &bull; {procurementTypes?.length || 0} Metode
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-2xs flex items-center gap-3">
          <div className="size-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              Logistik & Vendor SAP
            </p>
            <p className="text-xs font-bold text-foreground truncate mt-0.5">
              {materials.length} Material &bull; {suppliers.length} Vendor Resmi
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-2xs flex items-center gap-3">
          <div className="size-8 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              Tata Kelola & Akses
            </p>
            <p className="text-xs font-bold text-foreground truncate mt-0.5">
              {users.length} Akun &bull; {approvalMatrix.length} Tier Matriks
            </p>
          </div>
        </div>
      </div>

      {/* 3. Modern Toolbar: Integrated Search + Category Tabs + View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border shadow-2xs">
        {/* Domain Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {domainTabs.map((tab) => {
            const active = selectedDomain === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDomain(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all select-none",
                  active
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                    active
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-background text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Search Input & View Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari modul data master..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-7 h-8 text-xs bg-background shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-md border p-0.5 bg-muted/40 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Tampilan Grid Bento"
              className={cn(
                "p-1.5 rounded-sm text-xs transition-colors",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Tampilan Tabel Direktori"
              className={cn(
                "p-1.5 rounded-sm text-xs transition-colors",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4A. GRID VIEW: Symmetrical 4-Column Layout (2 Rows x 4 Columns = 8 Cards, Zero Orphan Gaps!) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="group relative rounded-xl border bg-card p-4 transition-all duration-200 hover:border-emerald-500/60 hover:shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Top Row: Thematic Icon + Domain Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        "size-10 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        mod.iconBg
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={mod.domainVariant}
                        className="text-[10px] font-medium px-2 py-0 shrink-0"
                      >
                        {mod.domainLabel}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {mod.systemTag}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <Link href={mod.href} className="focus:outline-none">
                      <h2 className="text-sm font-bold tracking-tight text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {mod.title}
                      </h2>
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                      {mod.desc}
                    </p>
                  </div>

                  {/* Sub-Entity Quick Chips (Direct Link into sub-tabs) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {mod.subChips.map((chip, idx) => (
                      <Link
                        key={idx}
                        href={chip.href}
                        className="inline-flex items-center text-[10px] font-medium font-mono px-2 py-0.5 rounded bg-muted/60 text-foreground/80 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-500/30 border border-border/50 transition-colors"
                      >
                        {chip.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Active Status Dot & Action Button */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{mod.activeCountLabel}</span>
                  </div>

                  <Link
                    href={mod.href}
                    className="inline-flex items-center gap-1 font-semibold text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group-hover:translate-x-0.5"
                  >
                    <span>Kelola</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4B. TABLE VIEW: Compact Directory List */}
      {viewMode === "table" && (
        <div className="rounded-lg border bg-card shadow-2xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="text-xs">
                <TableHead className="w-[300px] font-semibold">Modul Master Data</TableHead>
                <TableHead className="w-[180px] font-semibold">Domain / Klasifikasi</TableHead>
                <TableHead className="font-semibold">Rincian Entitas Data</TableHead>
                <TableHead className="w-[160px] font-semibold">Status Operasional</TableHead>
                <TableHead className="w-[120px] text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <TableRow key={mod.id} className="text-xs hover:bg-muted/15 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "size-8 rounded-md border flex items-center justify-center shrink-0",
                            mod.iconBg
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={mod.href}
                            className="font-bold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
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
                      <Badge variant={mod.domainVariant} className="text-[10px] font-medium">
                        {mod.domainLabel}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {mod.subChips.map((chip, idx) => (
                          <Link
                            key={idx}
                            href={chip.href}
                            className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 border border-border/50 transition-colors"
                          >
                            {chip.label}
                          </Link>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        <span>{mod.activeCountLabel}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Link href={mod.href}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 gap-1 px-2.5"
                        >
                          <span>Kelola</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 5. Empty Search State */}
      {filteredModules.length === 0 && (
        <div className="py-14 text-center border rounded-xl bg-card shadow-2xs space-y-2.5">
          <Database className="w-9 h-9 mx-auto text-muted-foreground/50" />
          <p className="text-sm font-bold text-foreground">
            Modul Master Data Tidak Ditemukan
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tidak ada modul yang cocok dengan kriteria filter &quot;{selectedDomain}&quot; atau kata kunci pencarian &quot;{search}&quot;.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setSelectedDomain("ALL");
            }}
            className="mt-2 text-xs"
          >
            Reset Semua Filter
          </Button>
        </div>
      )}
    </div>
  );
}
