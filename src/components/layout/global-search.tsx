"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppState } from "@/context/app-state-context";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Search,
  LayoutDashboard,
  Briefcase,
  FolderPlus,
  Bell,
  Settings,
  Database,
  MapPin,
  Tags,
  Layers,
  FolderGit2,
  Package,
  Truck,
  Users2,
  Shield,
  ShieldCheck,
  FileText,
  ShoppingCart,
  FileCheck2,
  FileSpreadsheet,
  ClipboardList,
  Calendar,
  Sparkles,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationMenuItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "main" | "master" | "context";
  keywords: string[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname() || "";

  const {
    projects,
    afces,
    prs,
    pos,
    uspks,
    spkContracts,
    locations,
    materials,
    suppliers,
    canManageSystem,
  } = useAppState();

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearch("");
    }
  };

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearch("");
    router.push(path);
  };

  // Deteksi jika user sedang berada di halaman proyek tertentu
  const currentProjectId = useMemo(() => {
    const match = pathname.match(/^\/workspace\/([^\/]+)/);
    return match && match[1] !== "new" ? match[1] : null;
  }, [pathname]);

  const currentProject = useMemo(() => {
    if (!currentProjectId) return null;
    return projects.find((p) => p.id === currentProjectId) || null;
  }, [currentProjectId, projects]);

  // Daftar menu navigasi utama aplikasi
  const mainNavigationItems: NavigationMenuItem[] = [
    {
      id: "menu-dashboard",
      title: "Dashboard",
      subtitle: "Ringkasan statistik eksekutif, status kebun, dan proyek berjalan",
      path: "/dashboard",
      icon: LayoutDashboard,
      category: "main",
      keywords: ["dashboard", "beranda", "statistik", "ringkasan", "kpi", "home", "utama", "monitoring"],
    },
    {
      id: "menu-workspace",
      title: "Workspace / Daftar Proyek",
      subtitle: "Daftar seluruh proyek teknis perkebunan sawit dan portfolio",
      path: "/workspace",
      icon: Briefcase,
      category: "main",
      keywords: ["workspace", "proyek", "daftar proyek", "portfolio", "estate", "pekerjaan", "projek", "semua proyek"],
    },
    {
      id: "menu-new-project",
      title: "Buat Proyek Baru",
      subtitle: "Registrasi proyek baru, inisialisasi WBS dan otorisasi belanja",
      path: "/workspace/new",
      icon: FolderPlus,
      category: "main",
      keywords: ["buat proyek", "tambah proyek", "proyek baru", "new project", "register", "registrasi", "tambah"],
    },
    {
      id: "menu-notifications",
      title: "Notifikasi & Pengingat",
      subtitle: "Pemberitahuan persetujuan AFCE, progress, dan status EWS",
      path: "/notifications",
      icon: Bell,
      category: "main",
      keywords: ["notifikasi", "pemberitahuan", "alert", "peringatan", "pesan", "inbox"],
    },
    {
      id: "menu-settings",
      title: "Pengaturan Sistem",
      subtitle: "Profil pengguna, preferensi aplikasi, backup dan pemulihan data",
      path: "/settings",
      icon: Settings,
      category: "main",
      keywords: ["pengaturan", "settings", "profil", "akun", "backup", "restore", "konfigurasi", "tema"],
    },
  ];

  // Daftar seluruh sub-menu Master Data
  const masterDataItems: NavigationMenuItem[] = [
    {
      id: "menu-master-hub",
      title: "Master Data Hub",
      subtitle: "Pusat navigasi master data referensi organisasi dan operasional",
      path: "/master-data",
      icon: Database,
      category: "master",
      keywords: ["master data", "referensi", "pusat data", "konfigurasi"],
    },
    {
      id: "menu-master-locations",
      title: "Master Data: Lokasi Kebun & Organisasi",
      subtitle: "Regional, Perusahaan (PT), Estate Kebun, dan Afdeling / Blok",
      path: "/master-data/locations",
      icon: MapPin,
      category: "master",
      keywords: ["kebun", "estate", "lokasi", "regional", "wilayah", "afdeling", "blok", "perusahaan", "pt", "organisasi"],
    },
    {
      id: "menu-master-categories",
      title: "Master Data: Kategori Proyek",
      subtitle: "Klasifikasi kategori pekerjaan (Civil, Infrastruktur, Pabrik)",
      path: "/master-data/project-categories",
      icon: Tags,
      category: "master",
      keywords: ["kategori proyek", "kategori", "civil", "infrastruktur", "klasifikasi", "tags"],
    },
    {
      id: "menu-master-types",
      title: "Master Data: Tipe Proyek",
      subtitle: "Tipe proyek estate (Investasi Baru, Replanting, Perawatan)",
      path: "/master-data/project-types",
      icon: Layers,
      category: "master",
      keywords: ["tipe proyek", "jenis proyek", "investasi", "capex", "opex", "replanting"],
    },
    {
      id: "menu-master-procurement-types",
      title: "Master Data: Tipe Pengadaan",
      subtitle: "Metode pengadaan (Barang SAP, Jasa Kontrak, Swakelola)",
      path: "/master-data/procurement-types",
      icon: FolderGit2,
      category: "master",
      keywords: ["tipe pengadaan", "pengadaan", "metode pengadaan", "barang", "jasa", "swakelola"],
    },
    {
      id: "menu-master-materials",
      title: "Master Data: Katalog Material SAP",
      subtitle: "Katalog kode material SAP, kelompok barang, dan satuan unit (UoM)",
      path: "/master-data/materials",
      icon: Package,
      category: "master",
      keywords: ["katalog material", "material sap", "kode material", "satuan", "uom", "barang", "stok", "logistik"],
    },
    {
      id: "menu-master-suppliers",
      title: "Master Data: Supplier & Rekanan Vendor",
      subtitle: "Daftar kontraktor jasa, vendor pengadaan barang, dan mitra rekanan",
      path: "/master-data/suppliers",
      icon: Truck,
      category: "master",
      keywords: ["supplier", "vendor", "rekanan", "kontraktor", "pemborong", "mitra", "penyedia"],
    },
    {
      id: "menu-master-users",
      title: "Master Data: Pengguna & Akun User",
      subtitle: "Manajemen user internal, penetapan role, dan akses penugasan kebun",
      path: "/master-data/users",
      icon: Users2,
      category: "master",
      keywords: ["pengguna", "user", "akun", "operator", "manajer", "pegawai", "karyawan"],
    },
    {
      id: "menu-master-rbac",
      title: "Master Data: Hak Akses & RBAC",
      subtitle: "Matriks wewenang dan izin modul per role pengguna",
      path: "/master-data/rbac",
      icon: Shield,
      category: "master",
      keywords: ["rbac", "hak akses", "role", "permission", "kewenangan", "otoritas", "izin"],
    },
    {
      id: "menu-master-approval-matrix",
      title: "Master Data: Matriks Persetujuan AFCE",
      subtitle: "Hierarki jenjang approval otorisasi belanja berdasarkan nilai anggaran",
      path: "/master-data/approval-matrix",
      icon: ShieldCheck,
      category: "master",
      keywords: ["matriks approval", "approval afce", "persetujuan", "tier", "limit", "wewenang", "hierarki approval"],
    },
  ];

  // Sub-menu kontekstual jika sedang berada di dalam halaman proyek tertentu
  const contextualProjectItems: NavigationMenuItem[] = useMemo(() => {
    if (!currentProject) return [];
    const pid = currentProject.id;
    return [
      {
        id: `context-overview-${pid}`,
        title: `Ringkasan: ${currentProject.code}`,
        subtitle: `Halaman ikhtisar informasi umum proyek ${currentProject.name}`,
        path: `/workspace/${pid}`,
        icon: FolderOpen,
        category: "context",
        keywords: ["ringkasan", "overview", "detail", "ikhtisar", "status proyek", currentProject.code],
      },
      {
        id: `context-afce-${pid}`,
        title: `Otorisasi AFCE: ${currentProject.code}`,
        subtitle: `Dokumen AFCE, verifikasi SAP, dan hierarki persetujuan berjenjang`,
        path: `/workspace/${pid}/afce`,
        icon: FileText,
        category: "context",
        keywords: ["afce", "otorisasi", "anggaran", "approval", "persetujuan", currentProject.code],
      },
      {
        id: `context-procurement-${pid}`,
        title: `Pengadaan Barang & Jasa: ${currentProject.code}`,
        subtitle: `Pelacakan gabungan alur pengadaan barang (PR/PO) dan kontrak jasa`,
        path: `/workspace/${pid}/procurement`,
        icon: ShoppingCart,
        category: "context",
        keywords: ["pengadaan", "procurement", "barang", "jasa", "vendor", currentProject.code],
      },
      {
        id: `context-pr-${pid}`,
        title: `Purchase Requisition (PR): ${currentProject.code}`,
        subtitle: `Daftar nomor PR material dan sinkronisasi status SAP`,
        path: `/workspace/${pid}/pr`,
        icon: FileSpreadsheet,
        category: "context",
        keywords: ["pr", "purchase requisition", "permintaan barang", "sap pr", currentProject.code],
      },
      {
        id: `context-po-${pid}`,
        title: `Purchase Order (PO): ${currentProject.code}`,
        subtitle: `Daftar PO pemesanan barang dan progres penerimaan logistik`,
        path: `/workspace/${pid}/po`,
        icon: ShoppingCart,
        category: "context",
        keywords: ["po", "purchase order", "pesanan barang", "surat pesanan", currentProject.code],
      },
      {
        id: `context-services-${pid}`,
        title: `Kontrak Jasa & SPK: ${currentProject.code}`,
        subtitle: `Alur USPK, evaluasi teknis, dan kontrak kerja pemborong`,
        path: `/workspace/${pid}/services`,
        icon: FileCheck2,
        category: "context",
        keywords: ["jasa", "services", "kontrak jasa", "pemborong", currentProject.code],
      },
      {
        id: `context-spk-${pid}`,
        title: `Surat Perintah Kerja (SPK): ${currentProject.code}`,
        subtitle: `Penerbitan kontrak SPK rekanan pelaksana jasa proyek`,
        path: `/workspace/${pid}/spk`,
        icon: FileCheck2,
        category: "context",
        keywords: ["spk", "surat perintah kerja", "kontrak spk", currentProject.code],
      },
      {
        id: `context-execution-${pid}`,
        title: `Pelaksanaan & Kurva S: ${currentProject.code}`,
        subtitle: `Monitoring progres fisik terintegrasi, jadwal, dan kurva S`,
        path: `/workspace/${pid}/execution`,
        icon: Calendar,
        category: "context",
        keywords: ["pelaksanaan", "execution", "kurva s", "progres", "jadwal", currentProject.code],
      },
      {
        id: `context-survey-boq-${pid}`,
        title: `Survey Lapangan & BOQ: ${currentProject.code}`,
        subtitle: `Bill of Quantities rincian volume dan estimasi biaya teknis`,
        path: `/workspace/${pid}/survey-boq`,
        icon: ClipboardList,
        category: "context",
        keywords: ["survey", "boq", "bill of quantities", "rincian biaya", "volume", currentProject.code],
      },
    ];
  }, [currentProject]);

  // Proyek aktif (tidak di Recycle Bin) dan proyek di Recycle Bin
  const activeProjects = useMemo(() => {
    return projects.filter((p) => !p.deletedAt);
  }, [projects]);

  // Proyek terbaru saat search kosong
  const recentProjects = useMemo(() => {
    return activeProjects.slice(0, 5);
  }, [activeProjects]);

  // Status apakah pengguna sedang mengetik kata kunci pencarian
  const isSearching = search.trim().length > 0;

  // Custom filter multi-term matching (tidak sensitif urutan kata)
  const customFilter = (value: string, searchInput: string, keywords?: string[]) => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return 1;

    const target = `${value} ${keywords?.join(" ") || ""}`.toLowerCase();
    const searchTerms = query.split(/\s+/).filter(Boolean);

    // Semua kata dalam query harus ditemukan dalam target teks/keywords
    const matchesAll = searchTerms.every((term) => target.includes(term));
    return matchesAll ? 1 : 0;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/60 hover:bg-muted border rounded-md transition-colors w-44 md:w-64 justify-between"
        title="Cari menu, proyek, transaksi (Ctrl+K)"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">Cari menu, proyek, transaksi...</span>
        </span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shrink-0">
          <span className="text-[11px]">Ctrl</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        filter={customFilter}
      >
        <CommandInput
          placeholder="Ketik nama menu, kode proyek, kebun, AFCE, PR, PO, SPK..."
          value={search}
          onValueChange={setSearch}
        />

        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center space-y-1">
              <p className="text-xs font-medium text-foreground">Tidak ditemukan hasil pencarian</p>
              <p className="text-[11px] text-muted-foreground">
                Coba gunakan kata kunci lain seperti nama kebun, kode proyek, nomor dokumen, atau nama menu.
              </p>
            </div>
          </CommandEmpty>

          {/* 1. Navigasi Kontekstual Jika Berada di Dalam Halaman Proyek */}
          {currentProject && contextualProjectItems.length > 0 && (
            <>
              <CommandGroup heading={`Navigasi Proyek: ${currentProject.code}`}>
                {contextualProjectItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.id} ${item.title} ${item.subtitle} ${item.keywords.join(" ")}`}
                      keywords={item.keywords}
                      onSelect={() => handleSelect(item.path)}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-foreground text-xs truncate">{item.title}</span>
                          <span className="text-[11px] text-muted-foreground truncate">{item.subtitle}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* 2. Menu Navigasi Utama Aplikasi */}
          <CommandGroup heading="Menu & Halaman Utama">
            {mainNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.id} ${item.title} ${item.subtitle} ${item.keywords.join(" ")}`}
                  keywords={item.keywords}
                  onSelect={() => handleSelect(item.path)}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-muted text-foreground shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-foreground text-xs truncate">{item.title}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{item.subtitle}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 shrink-0">
                    Menu
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          {/* 3. Proyek & Workspace (Semua Proyek saat mencari, atau 5 Terkini saat kosong) */}
          <CommandGroup heading={isSearching ? `Proyek & Workspace (${projects.length} Total)` : "Proyek Aktif Terbaru"}>
            {(isSearching ? projects : recentProjects).map((p) => {
              const isRecycleBin = Boolean(p.deletedAt);
              return (
                <CommandItem
                  key={p.id}
                  value={`project-${p.id} ${p.code} ${p.name} ${p.locationName || ""} ${p.locationNames?.join(" ") || ""} ${p.companyName || ""} ${p.regionName || ""} ${p.projectCategoryName || ""} ${p.projectType || ""} ${p.status} proyek workspace ${isRecycleBin ? "recycle bin terhapus" : ""}`}
                  keywords={[p.code, p.name, p.locationName || "", p.status, "proyek", "workspace"]}
                  onSelect={() => handleSelect(`/workspace/${p.id}`)}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-xs truncate">
                          {p.code} - {p.name}
                        </span>
                        {isRecycleBin && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 shrink-0">
                            [Recycle Bin]
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {p.locationName || "Tanpa Lokasi"} &bull; {p.companyName ? `${p.companyName} • ` : ""}Progres: {p.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <StatusBadge status={p.status} className="text-[10px] py-0 px-2" />
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          {/* 4. Dokumen Otorisasi AFCE */}
          <CommandGroup heading="Dokumen Otorisasi AFCE">
            {(isSearching ? afces : afces.slice(0, 3)).map((a) => (
              <CommandItem
                key={a.id}
                value={`afce-${a.id} ${a.afceNumber} ${a.projectName} ${a.status} ${a.currentApproverRole || ""} afce otorisasi belanja`}
                keywords={[a.afceNumber, a.projectName, a.status, "afce"]}
                onSelect={() => handleSelect(`/workspace/${a.projectId}/afce`)}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground text-xs truncate">
                      {a.afceNumber} &bull; {a.projectName}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      Approver: {a.currentApproverRole || "Selesai"} &bull; Status: {a.status}
                    </span>
                  </div>
                </div>
                <StatusBadge status={a.status} className="text-[10px] py-0 px-2 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* 5. Pengadaan Barang: Purchase Requisition (PR) */}
          <CommandGroup heading="Purchase Requisition (PR)">
            {(isSearching ? prs : prs.slice(0, 3)).map((pr) => (
              <CommandItem
                key={pr.id}
                value={`pr-${pr.id} ${pr.prNumber} ${pr.projectCode} ${pr.workItemName || ""} ${pr.sapPrNumber || ""} ${pr.status} pr purchase requisition pengadaan barang`}
                keywords={[pr.prNumber, pr.projectCode, pr.status, "pr"]}
                onSelect={() => handleSelect(`/workspace/${pr.projectId}/pr`)}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground text-xs truncate">
                      {pr.prNumber} &bull; {pr.projectCode}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {pr.workItemName || "Pengadaan Material"} &bull; SAP PR: {pr.sapPrNumber || "-"}
                    </span>
                  </div>
                </div>
                <StatusBadge status={pr.status} className="text-[10px] py-0 px-2 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* 6. Pengadaan Barang: Purchase Order (PO) */}
          <CommandGroup heading="Purchase Order (PO)">
            {(isSearching ? pos : pos.slice(0, 3)).map((po) => (
              <CommandItem
                key={po.id}
                value={`po-${po.id} ${po.poNumber} ${po.projectCode} ${po.supplierName || ""} ${po.relatedPrNumber || ""} ${po.status} po purchase order pesanan barang logistik`}
                keywords={[po.poNumber, po.supplierName || "", po.projectCode, po.status, "po"]}
                onSelect={() => handleSelect(`/workspace/${po.projectId}/po`)}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground text-xs truncate">
                      {po.poNumber} &bull; {po.supplierName || "Vendor"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      Proyek: {po.projectCode} &bull; Penerimaan: {po.receiptProgressPercent}% &bull; Status: {po.status}
                    </span>
                  </div>
                </div>
                <StatusBadge status={po.status} className="text-[10px] py-0 px-2 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* 7. Kontrak Jasa: Surat Perintah Kerja (SPK) & USPK */}
          <CommandGroup heading="Kontrak Jasa & Pemborong (SPK / USPK)">
            {(isSearching ? spkContracts : spkContracts.slice(0, 3)).map((spk) => (
              <CommandItem
                key={spk.id}
                value={`spk-${spk.id} ${spk.spkNumber} ${spk.projectCode} ${spk.vendorName || ""} ${spk.workItemName || ""} ${spk.status} spk surat perintah kerja kontrak jasa pemborong`}
                keywords={[spk.spkNumber, spk.vendorName || "", spk.projectCode, spk.status, "spk"]}
                onSelect={() => handleSelect(`/workspace/${spk.projectId}/spk`)}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground text-xs truncate">
                      {spk.spkNumber} &bull; {spk.vendorName || "Kontraktor"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      Proyek: {spk.projectCode} &bull; {spk.workItemName || "Pekerjaan Jasa"} &bull; Status: {spk.status}
                    </span>
                  </div>
                </div>
                <StatusBadge status={spk.status} className="text-[10px] py-0 px-2 shrink-0" />
              </CommandItem>
            ))}

            {isSearching &&
              uspks.slice(0, 5).map((u) => (
                <CommandItem
                  key={u.id}
                  value={`uspk-${u.id} ${u.uspkNumber} ${u.projectCode} ${u.vendorName || ""} ${u.scope || ""} ${u.status} uspk usulan surat perintah kerja`}
                  keywords={[u.uspkNumber, u.projectCode, u.vendorName || "", u.status, "uspk"]}
                  onSelect={() => handleSelect(`/workspace/${u.projectId}/uspk`)}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-foreground text-xs truncate">
                        {u.uspkNumber} &bull; {u.vendorName || "Vendor"}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        Proyek: {u.projectCode} &bull; Lingkup: {u.scope || "-"} &bull; Status: {u.status}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={u.status} className="text-[10px] py-0 px-2 shrink-0" />
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandSeparator />

          {/* 8. Seluruh Modul Master Data */}
          <CommandGroup heading="Master Data & Konfigurasi">
            {(isSearching ? masterDataItems : masterDataItems.slice(0, 5)).map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.id} ${item.title} ${item.subtitle} ${item.keywords.join(" ")}`}
                  keywords={item.keywords}
                  onSelect={() => handleSelect(item.path)}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-foreground text-xs truncate">{item.title}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{item.subtitle}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 shrink-0">
                    Master
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {/* 9. Entitas Master Data Spesifik (Material SAP & Rekanan Vendor saat mencari) */}
          {isSearching && (
            <>
              <CommandSeparator />

              <CommandGroup heading="Katalog Material SAP">
                {materials.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`material-${m.id} ${m.sapCode} ${m.name} ${m.category || ""} ${m.unit || ""} material sap barang katalog`}
                    keywords={[m.sapCode, m.name, m.category || "", "material", "sap"]}
                    onSelect={() => handleSelect("/master-data/materials")}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-400 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground text-xs truncate">
                          {m.sapCode} - {m.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          Kategori: {m.category || "-"} &bull; Satuan: {m.unit || "Unit"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 shrink-0">
                      Katalog
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Supplier & Rekanan Vendor">
                {suppliers.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={`supplier-${s.id} ${s.code} ${s.name} ${s.category || ""} ${s.contactPerson || ""} supplier vendor rekanan kontraktor mitra`}
                    keywords={[s.code, s.name, s.category || "", s.contactPerson || "", "supplier", "vendor"]}
                    onSelect={() => handleSelect("/master-data/suppliers")}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-400 shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground text-xs truncate">
                          {s.name} ({s.code})
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          Kategori: {s.category || "-"} &bull; Kontak: {s.contactPerson || "-"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 shrink-0">
                      Rekanan
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer petunjuk tombol pintasan */}
        <div className="flex items-center justify-between border-t px-3.5 py-2 text-[11px] text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1 py-0.2 font-mono text-[10px]">↑</kbd>
              <kbd className="rounded border bg-background px-1 py-0.2 font-mono text-[10px]">↓</kbd>
              <span>Navigasi</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1.5 py-0.2 font-mono text-[10px]">↵</kbd>
              <span>Pilih</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1.5 py-0.2 font-mono text-[10px]">Esc</kbd>
              <span>Tutup</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>WM-Toolkit Search</span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
