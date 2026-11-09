"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Building2,
  Globe2,
  Grid,
  Plus,
  Search,
  Edit2,
  ChevronLeft,
  Info,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppState } from "@/context/app-state-context";
import { Region, Company, EstateLocation, EstateBlock } from "@/types";
import { formatIDDate } from "@/lib/utils";
import { toast } from "sonner";

function MasterDataLocationsContent() {
  const {
    regions,
    companies,
    locations,
    blocks,
    addMasterDataRegion,
    updateMasterDataRegion,
    addMasterDataCompany,
    updateMasterDataCompany,
    addMasterDataLocation,
    updateMasterDataLocation,
    addMasterDataBlock,
    updateMasterDataBlock,
  } = useAppState();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<"estates" | "companies" | "regions" | "blocks">(
    tabParam === "companies" || tabParam === "regions" || tabParam === "blocks"
      ? tabParam
      : "estates"
  );

  useEffect(() => {
    if (tabParam && ["estates", "companies", "regions", "blocks"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);
  const [search, setSearch] = useState("");

  // Filters for Kebun tab
  const [estateRegionFilter, setEstateRegionFilter] = useState("ALL");
  const [estateCompanyFilter, setEstateCompanyFilter] = useState("ALL");

  // Filter for Blok tab
  const [blockEstateFilter, setBlockEstateFilter] = useState("ALL");

  // Dialog States
  const [estateDialogOpen, setEstateDialogOpen] = useState(false);
  const [editingEstate, setEditingItem] = useState<EstateLocation | null>(null);
  const [estateCode, setEstateCode] = useState("");
  const [estateName, setEstateName] = useState("");
  const [estateCompanyId, setEstateCompanyId] = useState("");
  const [estateRegionId, setEstateRegionId] = useState("");
  const [estateDistrict, setEstateDistrict] = useState("");
  const [estateHectares, setEstateHectares] = useState<number>(3000);

  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNpwp, setCompanyNpwp] = useState("");

  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [regionCode, setRegionCode] = useState("");
  const [regionName, setRegionName] = useState("");
  const [regionDesc, setRegionDesc] = useState("");

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<EstateBlock | null>(null);
  const [blockEstateId, setBlockEstateId] = useState("");
  const [blockCode, setBlockCode] = useState("");
  const [blockName, setBlockName] = useState("");
  const [blockAfdeling, setBlockAfdeling] = useState("Afdeling I");
  const [blockCropType, setBlockCropType] = useState("Kelapa Sawit");
  const [blockPlantingYear, setBlockPlantingYear] = useState<number>(2016);
  const [blockHectares, setBlockHectares] = useState<number>(40);

  // Helper maps for quick lookup
  const companyMap = useMemo(() => {
    return new Map(companies.map((c) => [c.id, c]));
  }, [companies]);

  const regionMap = useMemo(() => {
    return new Map(regions.map((r) => [r.id, r]));
  }, [regions]);

  const estateMap = useMemo(() => {
    return new Map(locations.map((l) => [l.id, l]));
  }, [locations]);

  // Statistics per Company
  const companyStats = useMemo(() => {
    const stats: Record<string, { estateCount: number; totalHa: number; regionIds: Set<string> }> = {};
    companies.forEach((c) => {
      stats[c.id] = { estateCount: 0, totalHa: 0, regionIds: new Set() };
    });
    locations.forEach((loc) => {
      if (stats[loc.companyId]) {
        stats[loc.companyId].estateCount += 1;
        stats[loc.companyId].totalHa += loc.hectares;
        if (loc.regionId) stats[loc.companyId].regionIds.add(loc.regionId);
      }
    });
    return stats;
  }, [companies, locations]);

  // Statistics per Region
  const regionStats = useMemo(() => {
    const stats: Record<string, { estateCount: number; totalHa: number; companyIds: Set<string> }> = {};
    regions.forEach((r) => {
      stats[r.id] = { estateCount: 0, totalHa: 0, companyIds: new Set() };
    });
    locations.forEach((loc) => {
      if (stats[loc.regionId]) {
        stats[loc.regionId].estateCount += 1;
        stats[loc.regionId].totalHa += loc.hectares;
        if (loc.companyId) stats[loc.regionId].companyIds.add(loc.companyId);
      }
    });
    return stats;
  }, [regions, locations]);

  // Block count per estate
  const blockCountByEstate = useMemo(() => {
    const map: Record<string, number> = {};
    blocks.forEach((b) => {
      map[b.estateId] = (map[b.estateId] || 0) + 1;
    });
    return map;
  }, [blocks]);

  // Filtered Estates
  const filteredEstates = useMemo(() => {
    return locations.filter((loc) => {
      const q = search.toLowerCase();
      const comp = companyMap.get(loc.companyId)?.name || "";
      const reg = regionMap.get(loc.regionId)?.name || loc.region || "";

      const matchSearch =
        loc.code.toLowerCase().includes(q) ||
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        comp.toLowerCase().includes(q) ||
        reg.toLowerCase().includes(q);

      const matchRegion = estateRegionFilter === "ALL" || loc.regionId === estateRegionFilter;
      const matchCompany = estateCompanyFilter === "ALL" || loc.companyId === estateCompanyFilter;

      return matchSearch && matchRegion && matchCompany;
    });
  }, [locations, search, estateRegionFilter, estateCompanyFilter, companyMap, regionMap]);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.npwp && c.npwp.toLowerCase().includes(q))
      );
    });
  }, [companies, search]);

  // Filtered Regions
  const filteredRegions = useMemo(() => {
    return regions.filter((r) => {
      const q = search.toLowerCase();
      return (
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    });
  }, [regions, search]);

  // Filtered Blocks
  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const q = search.toLowerCase();
      const est = estateMap.get(b.estateId)?.name || "";
      const matchSearch =
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.afdeling.toLowerCase().includes(q) ||
        est.toLowerCase().includes(q);

      const matchEstate = blockEstateFilter === "ALL" || b.estateId === blockEstateFilter;
      return matchSearch && matchEstate;
    });
  }, [blocks, search, blockEstateFilter, estateMap]);

  // --- Handlers Kebun (Estate) ---
  const handleOpenAddEstate = () => {
    setEditingItem(null);
    setEstateCode(`KBN-0${locations.length + 1}`);
    setEstateName("");
    setEstateCompanyId(companies[0]?.id || "");
    setEstateRegionId(regions[0]?.id || "");
    setEstateDistrict("Asahan");
    setEstateHectares(3500);
    setEstateDialogOpen(true);
  };

  const handleOpenEditEstate = (loc: EstateLocation) => {
    setEditingItem(loc);
    setEstateCode(loc.code);
    setEstateName(loc.name);
    setEstateCompanyId(loc.companyId || companies[0]?.id || "");
    setEstateRegionId(loc.regionId || regions[0]?.id || "");
    setEstateDistrict(loc.district);
    setEstateHectares(loc.hectares);
    setEstateDialogOpen(true);
  };

  const handleSaveEstate = () => {
    if (!estateCode.trim() || !estateName.trim()) {
      toast.error("Kode dan nama kebun wajib diisi");
      return;
    }

    const reg = regionMap.get(estateRegionId);

    if (editingEstate) {
      updateMasterDataLocation(editingEstate.id, {
        code: estateCode,
        name: estateName,
        companyId: estateCompanyId,
        regionId: estateRegionId,
        district: estateDistrict,
        region: reg?.name || "Sumatera Utara",
        hectares: estateHectares,
      });
      toast.success("Data kebun berhasil diperbarui!");
    } else {
      addMasterDataLocation({
        code: estateCode,
        name: estateName,
        companyId: estateCompanyId,
        regionId: estateRegionId,
        district: estateDistrict,
        region: reg?.name || "Sumatera Utara",
        hectares: estateHectares,
        status: "Active",
      });
      toast.success("Kebun baru berhasil ditambahkan!");
    }
    setEstateDialogOpen(false);
  };

  const handleToggleEstateStatus = (loc: EstateLocation) => {
    const newStatus = loc.status === "Active" ? "Inactive" : "Active";
    updateMasterDataLocation(loc.id, { status: newStatus });
    toast.success(`Status ${loc.name} diubah menjadi ${newStatus}`);
  };

  // --- Handlers Perusahaan (Company) ---
  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyCode(`CMP-0${companies.length + 1}`);
    setCompanyName("");
    setCompanyNpwp("");
    setCompanyDialogOpen(true);
  };

  const handleOpenEditCompany = (cmp: Company) => {
    setEditingCompany(cmp);
    setCompanyCode(cmp.code);
    setCompanyName(cmp.name);
    setCompanyNpwp(cmp.npwp || "");
    setCompanyDialogOpen(true);
  };

  const handleSaveCompany = () => {
    if (!companyCode.trim() || !companyName.trim()) {
      toast.error("Kode dan nama perusahaan wajib diisi");
      return;
    }
    if (editingCompany) {
      updateMasterDataCompany(editingCompany.id, {
        code: companyCode,
        name: companyName,
        npwp: companyNpwp,
      });
      toast.success("Data perusahaan berhasil diperbarui!");
    } else {
      addMasterDataCompany({
        code: companyCode,
        name: companyName,
        npwp: companyNpwp,
        status: "Active",
      });
      toast.success("Perusahaan baru berhasil ditambahkan!");
    }
    setCompanyDialogOpen(false);
  };

  const handleToggleCompanyStatus = (cmp: Company) => {
    const newStatus = cmp.status === "Active" ? "Inactive" : "Active";
    updateMasterDataCompany(cmp.id, { status: newStatus });
    toast.success(`Status ${cmp.name} diubah menjadi ${newStatus}`);
  };

  // --- Handlers Wilayah (Region) ---
  const handleOpenAddRegion = () => {
    setEditingRegion(null);
    setRegionCode(`REG-0${regions.length + 1}`);
    setRegionName("");
    setRegionDesc("");
    setRegionDialogOpen(true);
  };

  const handleOpenEditRegion = (reg: Region) => {
    setEditingRegion(reg);
    setRegionCode(reg.code);
    setRegionName(reg.name);
    setRegionDesc(reg.description || "");
    setRegionDialogOpen(true);
  };

  const handleSaveRegion = () => {
    if (!regionCode.trim() || !regionName.trim()) {
      toast.error("Kode dan nama wilayah wajib diisi");
      return;
    }
    if (editingRegion) {
      updateMasterDataRegion(editingRegion.id, {
        code: regionCode,
        name: regionName,
        description: regionDesc,
      });
      toast.success("Data wilayah berhasil diperbarui!");
    } else {
      addMasterDataRegion({
        code: regionCode,
        name: regionName,
        description: regionDesc,
        status: "Active",
      });
      toast.success("Wilayah baru berhasil ditambahkan!");
    }
    setRegionDialogOpen(false);
  };

  const handleToggleRegionStatus = (reg: Region) => {
    const newStatus = reg.status === "Active" ? "Inactive" : "Active";
    updateMasterDataRegion(reg.id, { status: newStatus });
    toast.success(`Status ${reg.name} diubah menjadi ${newStatus}`);
  };

  // --- Handlers Blok (Block) ---
  const handleOpenAddBlock = () => {
    setEditingBlock(null);
    setBlockEstateId(locations[0]?.id || "");
    setBlockCode(`BLK-${Date.now().toString().slice(-4)}`);
    setBlockName("");
    setBlockAfdeling("Afdeling I");
    setBlockCropType("Kelapa Sawit");
    setBlockPlantingYear(2018);
    setBlockHectares(35);
    setBlockDialogOpen(true);
  };

  const handleOpenEditBlock = (blk: EstateBlock) => {
    setEditingBlock(blk);
    setBlockEstateId(blk.estateId);
    setBlockCode(blk.code);
    setBlockName(blk.name);
    setBlockAfdeling(blk.afdeling);
    setBlockCropType(blk.cropType);
    setBlockPlantingYear(blk.plantingYear);
    setBlockHectares(blk.hectares);
    setBlockDialogOpen(true);
  };

  const handleSaveBlock = () => {
    if (!blockCode.trim() || !blockName.trim() || !blockEstateId) {
      toast.error("Kebun, kode blok, dan nama blok wajib diisi");
      return;
    }
    if (editingBlock) {
      updateMasterDataBlock(editingBlock.id, {
        estateId: blockEstateId,
        code: blockCode,
        name: blockName,
        afdeling: blockAfdeling,
        cropType: blockCropType,
        plantingYear: blockPlantingYear,
        hectares: blockHectares,
      });
      toast.success("Data blok berhasil diperbarui!");
    } else {
      addMasterDataBlock({
        estateId: blockEstateId,
        code: blockCode,
        name: blockName,
        afdeling: blockAfdeling,
        cropType: blockCropType,
        plantingYear: blockPlantingYear,
        hectares: blockHectares,
        status: "Active",
      });
      toast.success("Blok baru berhasil ditambahkan!");
    }
    setBlockDialogOpen(false);
  };

  const handleToggleBlockStatus = (blk: EstateBlock) => {
    const newStatus = blk.status === "Active" ? "Inactive" : "Active";
    updateMasterDataBlock(blk.id, { status: newStatus });
    toast.success(`Status ${blk.code} diubah menjadi ${newStatus}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/master-data"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Kembali ke Master Data Hub
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Struktur Organisasi & Lokasi Kebun
          </h1>
          <p className="text-xs text-muted-foreground">
            Pengelolaan hierarki Wilayah (Region) &rarr; Perusahaan (Company) &rarr; Kebun (Estate) &rarr; Blok (Block) dengan dukungan Multi-Region Company.
          </p>
        </div>

        {/* Action Button based on active tab */}
        <div>
          {activeTab === "estates" && (
            <Button
              size="sm"
              onClick={handleOpenAddEstate}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Kebun Baru
            </Button>
          )}
          {activeTab === "companies" && (
            <Button
              size="sm"
              onClick={handleOpenAddCompany}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Perusahaan Baru
            </Button>
          )}
          {activeTab === "regions" && (
            <Button
              size="sm"
              onClick={handleOpenAddRegion}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Wilayah Baru
            </Button>
          )}
          {activeTab === "blocks" && (
            <Button
              size="sm"
              onClick={handleOpenAddBlock}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Blok Kebun
            </Button>
          )}
        </div>
      </div>

      {/* Architecture Alert / Visual Diagram */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20 p-3.5 text-xs text-emerald-900 dark:text-emerald-200">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2 font-medium">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Alur Hierarki Data:
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 font-mono text-[11px] font-bold">
                Wilayah (Region)
              </span>
              <ArrowRight className="w-3 h-3 text-emerald-600" />
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 font-mono text-[11px] font-bold">
                Kebun (Estate)
              </span>
              <ArrowRight className="w-3 h-3 text-emerald-600" />
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 font-mono text-[11px] font-bold">
                Blok (Block)
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">Kepemilikan Legal:</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-mono text-[11px] font-bold">
                Perusahaan (Company / PT)
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/80">
              Setiap <strong>Kebun (Estate)</strong> mengikat ke 1 Wilayah operasional dan 1 Perusahaan pemilik aset. Desain relasional ini memungkinkan <strong>1 Perusahaan memiliki kebun di 2 atau lebih Wilayah operasional yang berbeda</strong> (seperti <span className="font-semibold underline decoration-emerald-500">PT Perkebunan Nusantara IV (PalmCo)</span> yang memiliki kebun di Region 1 Sumut dan Region 2 Riau).
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-10 w-full sm:w-auto p-1 bg-muted/60">
          <TabsTrigger value="estates" className="gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5" /> Kebun (Estates)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted-foreground/15 font-mono">
              {locations.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5" /> Perusahaan (PT)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted-foreground/15 font-mono">
              {companies.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="regions" className="gap-1.5 text-xs">
            <Globe2 className="w-3.5 h-3.5" /> Wilayah (Regions)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted-foreground/15 font-mono">
              {regions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="blocks" className="gap-1.5 text-xs">
            <Grid className="w-3.5 h-3.5" /> Blok Kebun (Blocks)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted-foreground/15 font-mono">
              {blocks.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ================= TAB 1: ESTATES (KEBUN) ================= */}
        <TabsContent value="estates" className="mt-4 space-y-4">
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Cari kode, nama kebun, PT..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>

                {/* Filter Wilayah */}
                <SearchableSelect
                  value={estateRegionFilter}
                  onValueChange={setEstateRegionFilter}
                  placeholder="Semua Wilayah"
                  searchPlaceholder="Cari wilayah..."
                  triggerClassName="h-8 text-xs w-[180px]"
                  options={[
                    { value: "ALL", label: "Semua Wilayah" },
                    ...regions.map((r) => ({ value: r.id, label: r.name, subLabel: r.code })),
                  ]}
                />

                {/* Filter Perusahaan */}
                <SearchableSelect
                  value={estateCompanyFilter}
                  onValueChange={setEstateCompanyFilter}
                  placeholder="Semua Perusahaan"
                  searchPlaceholder="Cari perusahaan..."
                  triggerClassName="h-8 text-xs w-[200px]"
                  options={[
                    { value: "ALL", label: "Semua Perusahaan" },
                    ...companies.map((c) => ({ value: c.id, label: c.name, subLabel: c.code })),
                  ]}
                />
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {filteredEstates.length} dari {locations.length} Kebun
              </span>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Kode Kebun</TableHead>
                    <TableHead className="min-w-[160px]">Nama Kebun</TableHead>
                    <TableHead className="min-w-[190px]">Perusahaan (PT)</TableHead>
                    <TableHead className="min-w-[160px]">Wilayah Operasional</TableHead>
                    <TableHead className="w-[110px]">Distrik</TableHead>
                    <TableHead className="w-[95px] text-right">Luas (Ha)</TableHead>
                    <TableHead className="w-[85px] text-center">Blok</TableHead>
                    <TableHead className="w-[85px]">Status</TableHead>
                    <TableHead className="w-[100px]">Diperbarui</TableHead>
                    <TableHead className="w-[140px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center text-xs p-0">
                        <EmptyState
                          title="Tidak ada kebun yang cocok"
                          description="Ubah kata kunci pencarian atau filter wilayah/perusahaan Anda."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEstates.map((loc) => {
                      const comp = companyMap.get(loc.companyId);
                      const reg = regionMap.get(loc.regionId);
                      const bCount = blockCountByEstate[loc.id] || 0;
                      return (
                        <TableRow key={loc.id} className="hover:bg-muted/30 text-xs">
                          <TableCell className="font-mono font-bold text-foreground whitespace-nowrap">
                            {loc.code}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground whitespace-nowrap">
                            {loc.name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="font-medium text-foreground">
                              {comp ? comp.name : "-"}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {reg ? reg.name : loc.region || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {loc.district}
                          </TableCell>
                          <TableCell className="font-mono text-right font-medium whitespace-nowrap">
                            {loc.hectares.toLocaleString("id-ID")} Ha
                          </TableCell>
                          <TableCell className="font-mono text-center text-muted-foreground whitespace-nowrap">
                            {bCount} Blok
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge status={loc.status} />
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                            {formatIDDate(loc.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditEstate(loc)}
                                className="h-7 text-xs px-2"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleEstateStatus(loc)}
                                className={`h-7 text-xs px-2 ${
                                  loc.status === "Active"
                                    ? "text-amber-600 hover:text-amber-700"
                                    : "text-emerald-600 hover:text-emerald-700"
                                }`}
                              >
                                {loc.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 2: COMPANIES (PERUSAHAAN) ================= */}
        <TabsContent value="companies" className="mt-4 space-y-4">
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari kode atau nama perusahaan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {filteredCompanies.length} Perusahaan Terdaftar
              </span>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Kode PT</TableHead>
                    <TableHead className="min-w-[220px]">Nama Perusahaan / Entitas</TableHead>
                    <TableHead className="w-[180px]">Nomor NPWP</TableHead>
                    <TableHead className="min-w-[220px]">Wilayah Operasional (Coverage)</TableHead>
                    <TableHead className="w-[110px] text-center">Jumlah Kebun</TableHead>
                    <TableHead className="w-[120px] text-right">Total Luas (Ha)</TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead className="w-[140px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-xs p-0">
                        <EmptyState
                          title="Tidak ada perusahaan yang cocok"
                          description="Ubah kata kunci pencarian Anda."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((c) => {
                      const stat = companyStats[c.id] || { estateCount: 0, totalHa: 0, regionIds: new Set() };
                      const regionIdsArr = Array.from(stat.regionIds);
                      return (
                        <TableRow key={c.id} className="hover:bg-muted/30 text-xs">
                          <TableCell className="font-mono font-bold text-foreground whitespace-nowrap">
                            {c.code}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground whitespace-nowrap">
                            {c.name}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                            {c.npwp || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1">
                              {regionIdsArr.length === 0 ? (
                                <span className="text-muted-foreground text-[11px] italic">
                                  Belum ada kebun terdaftar
                                </span>
                              ) : (
                                regionIdsArr.map((regId) => {
                                  const r = regionMap.get(regId);
                                  return (
                                    <span
                                      key={regId}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                    >
                                      {r ? r.name : regId}
                                    </span>
                                  );
                                })
                              )}
                              {regionIdsArr.length > 1 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  Multi-Region ({regionIdsArr.length})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-center font-medium whitespace-nowrap">
                            {stat.estateCount} Kebun
                          </TableCell>
                          <TableCell className="font-mono text-right font-medium whitespace-nowrap">
                            {stat.totalHa.toLocaleString("id-ID")} Ha
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditCompany(c)}
                                className="h-7 text-xs px-2"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleCompanyStatus(c)}
                                className={`h-7 text-xs px-2 ${
                                  c.status === "Active"
                                    ? "text-amber-600 hover:text-amber-700"
                                    : "text-emerald-600 hover:text-emerald-700"
                                }`}
                              >
                                {c.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 3: REGIONS (WILAYAH) ================= */}
        <TabsContent value="regions" className="mt-4 space-y-4">
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari kode atau nama wilayah..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {filteredRegions.length} Wilayah Operasional
              </span>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Kode Wilayah</TableHead>
                    <TableHead className="min-w-[200px]">Nama Wilayah (Region)</TableHead>
                    <TableHead className="min-w-[220px]">Deskripsi / Cakupan Operasional</TableHead>
                    <TableHead className="min-w-[200px]">Perusahaan Aktif</TableHead>
                    <TableHead className="w-[110px] text-center">Jumlah Kebun</TableHead>
                    <TableHead className="w-[120px] text-right">Total Luas (Ha)</TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead className="w-[140px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-xs p-0">
                        <EmptyState
                          title="Tidak ada wilayah yang cocok"
                          description="Ubah kata kunci pencarian Anda."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRegions.map((r) => {
                      const stat = regionStats[r.id] || { estateCount: 0, totalHa: 0, companyIds: new Set() };
                      const compIdsArr = Array.from(stat.companyIds);
                      return (
                        <TableRow key={r.id} className="hover:bg-muted/30 text-xs">
                          <TableCell className="font-mono font-bold text-foreground whitespace-nowrap">
                            {r.code}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground whitespace-nowrap">
                            {r.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.description || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1">
                              {compIdsArr.length === 0 ? (
                                <span className="text-muted-foreground text-[11px] italic">
                                  Belum ada PT
                                </span>
                              ) : (
                                compIdsArr.map((cid) => {
                                  const c = companyMap.get(cid);
                                  return (
                                    <span
                                      key={cid}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                    >
                                      {c ? c.code : cid}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-center font-medium whitespace-nowrap">
                            {stat.estateCount} Kebun
                          </TableCell>
                          <TableCell className="font-mono text-right font-medium whitespace-nowrap">
                            {stat.totalHa.toLocaleString("id-ID")} Ha
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditRegion(r)}
                                className="h-7 text-xs px-2"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleRegionStatus(r)}
                                className={`h-7 text-xs px-2 ${
                                  r.status === "Active"
                                    ? "text-amber-600 hover:text-amber-700"
                                    : "text-emerald-600 hover:text-emerald-700"
                                }`}
                              >
                                {r.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 4: BLOCKS (BLOK KEBUN) ================= */}
        <TabsContent value="blocks" className="mt-4 space-y-4">
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Cari kode blok, nama, afdeling..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>

                {/* Filter Kebun */}
                <SearchableSelect
                  value={blockEstateFilter}
                  onValueChange={setBlockEstateFilter}
                  placeholder="Semua Kebun Induk"
                  searchPlaceholder="Cari kebun..."
                  triggerClassName="h-8 text-xs w-[200px]"
                  options={[
                    { value: "ALL", label: "Semua Kebun Induk" },
                    ...locations.map((loc) => ({ value: loc.id, label: loc.name, subLabel: loc.code })),
                  ]}
                />
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {filteredBlocks.length} dari {blocks.length} Blok Kebun
              </span>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Kode Blok</TableHead>
                    <TableHead className="min-w-[160px]">Nama / Petak</TableHead>
                    <TableHead className="min-w-[160px]">Kebun Induk (Estate)</TableHead>
                    <TableHead className="w-[110px]">Afdeling</TableHead>
                    <TableHead className="w-[110px]">Komoditas</TableHead>
                    <TableHead className="w-[100px] text-center">Tahun Tanam</TableHead>
                    <TableHead className="w-[95px] text-right">Luas (Ha)</TableHead>
                    <TableHead className="w-[85px]">Status</TableHead>
                    <TableHead className="w-[140px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-xs p-0">
                        <EmptyState
                          title="Tidak ada blok yang cocok"
                          description="Ubah kata kunci pencarian atau filter kebun Anda."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBlocks.map((blk) => {
                      const est = estateMap.get(blk.estateId);
                      return (
                        <TableRow key={blk.id} className="hover:bg-muted/30 text-xs">
                          <TableCell className="font-mono font-bold text-foreground whitespace-nowrap">
                            {blk.code}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground whitespace-nowrap">
                            {blk.name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="font-medium text-foreground">
                              {est ? est.name : "-"}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground font-medium">
                            {blk.afdeling}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {blk.cropType}
                          </TableCell>
                          <TableCell className="font-mono text-center whitespace-nowrap">
                            {blk.plantingYear}
                          </TableCell>
                          <TableCell className="font-mono text-right font-medium whitespace-nowrap">
                            {blk.hectares.toLocaleString("id-ID")} Ha
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge status={blk.status} />
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditBlock(blk)}
                                className="h-7 text-xs px-2"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Ubah
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleBlockStatus(blk)}
                                className={`h-7 text-xs px-2 ${
                                  blk.status === "Active"
                                    ? "text-amber-600 hover:text-amber-700"
                                    : "text-emerald-600 hover:text-emerald-700"
                                }`}
                              >
                                {blk.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================= DIALOG: KEBUN (ESTATE) ================= */}
      <Dialog open={estateDialogOpen} onOpenChange={setEstateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingEstate ? "Ubah Data Kebun (Estate)" : "Tambah Kebun Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan identitas kebun, perusahaan pemilik, dan wilayah operasional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Kode Kebun <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={estateCode}
                  onChange={(e) => setEstateCode(e.target.value)}
                  placeholder="KBN-..."
                  className="font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Luas Hektar (Ha)
                </label>
                <Input
                  type="number"
                  value={estateHectares}
                  onChange={(e) => setEstateHectares(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama Kebun (Estate) <span className="text-rose-500">*</span>
              </label>
              <Input
                value={estateName}
                onChange={(e) => setEstateName(e.target.value)}
                placeholder="Contoh: Kebun Sei Silau"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Perusahaan (PT) <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  value={estateCompanyId}
                  onValueChange={setEstateCompanyId}
                  placeholder="Pilih PT..."
                  searchPlaceholder="Cari perusahaan..."
                  triggerClassName="h-9 text-xs"
                  options={companies.map((c) => ({ value: c.id, label: c.name, subLabel: c.code }))}
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Wilayah (Region) <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  value={estateRegionId}
                  onValueChange={setEstateRegionId}
                  placeholder="Pilih Region..."
                  searchPlaceholder="Cari wilayah..."
                  triggerClassName="h-9 text-xs"
                  options={regions.map((r) => ({ value: r.id, label: r.name, subLabel: r.code }))}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Kabupaten / Distrik
              </label>
              <Input
                value={estateDistrict}
                onChange={(e) => setEstateDistrict(e.target.value)}
                placeholder="Contoh: Asahan"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEstateDialogOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveEstate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Data Kebun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG: PERUSAHAAN (COMPANY) ================= */}
      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingCompany ? "Ubah Perusahaan (PT)" : "Tambah Perusahaan Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Entitas badan hukum pemilik aset kebun perkebunan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Kode Perusahaan <span className="text-rose-500">*</span>
              </label>
              <Input
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                placeholder="PTPN4 / CMP-..."
                className="font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama Perusahaan / PT <span className="text-rose-500">*</span>
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: PT Perkebunan Nusantara IV (PalmCo)"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nomor Pokok Wajib Pajak (NPWP)
              </label>
              <Input
                value={companyNpwp}
                onChange={(e) => setCompanyNpwp(e.target.value)}
                placeholder="01.001.234.5-012.000"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setCompanyDialogOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveCompany} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Perusahaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG: WILAYAH (REGION) ================= */}
      <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingRegion ? "Ubah Wilayah (Region)" : "Tambah Wilayah Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Divisi operasional wilayah geografis perkebunan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Kode Wilayah <span className="text-rose-500">*</span>
              </label>
              <Input
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
                placeholder="REG-01"
                className="font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama Wilayah (Region) <span className="text-rose-500">*</span>
              </label>
              <Input
                value={regionName}
                onChange={(e) => setRegionName(e.target.value)}
                placeholder="Contoh: Region 1 - Sumatera Utara"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Deskripsi / Cakupan Operasional
              </label>
              <Input
                value={regionDesc}
                onChange={(e) => setRegionDesc(e.target.value)}
                placeholder="Wilayah operasional perkebunan Sumatera Utara & Aceh"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setRegionDialogOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveRegion} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Wilayah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG: BLOK KEBUN (BLOCK) ================= */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingBlock ? "Ubah Blok Kebun" : "Tambah Blok Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Petak tanam unit kebun terkecil dan tahun tanam.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Kebun Induk (Estate) <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={blockEstateId}
                onValueChange={setBlockEstateId}
                placeholder="Pilih Kebun..."
                searchPlaceholder="Cari kebun..."
                triggerClassName="h-9 text-xs"
                options={locations.map((loc) => ({ value: loc.id, label: loc.name, subLabel: loc.code }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Afdeling <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={blockAfdeling}
                  onChange={(e) => setBlockAfdeling(e.target.value)}
                  placeholder="Afdeling I"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Kode Blok <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={blockCode}
                  onChange={(e) => setBlockCode(e.target.value)}
                  placeholder="BLK-SIL-A01"
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Nama / Keterangan Petak <span className="text-rose-500">*</span>
              </label>
              <Input
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="Contoh: Blok A-01 / TM-2015"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Komoditas
                </label>
                <Input
                  value={blockCropType}
                  onChange={(e) => setBlockCropType(e.target.value)}
                  placeholder="Kelapa Sawit"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Tahun Tanam
                </label>
                <Input
                  type="number"
                  value={blockPlantingYear}
                  onChange={(e) => setBlockPlantingYear(Number(e.target.value))}
                  className="font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Luas (Ha)
                </label>
                <Input
                  type="number"
                  value={blockHectares}
                  onChange={(e) => setBlockHectares(Number(e.target.value))}
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setBlockDialogOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveBlock} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Blok Kebun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MasterDataLocationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px] text-xs text-muted-foreground animate-pulse">
          Memuat data hierarki lokasi kebun...
        </div>
      }
    >
      <MasterDataLocationsContent />
    </Suspense>
  );
}
