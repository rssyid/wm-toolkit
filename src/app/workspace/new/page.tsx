"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  FileCheck2,
  Layers,
  Save,
  MapPin,
  Tags,
  FileText,
  Clock,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Construction,
  Droplets,
  Sprout,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/context/app-state-context";
import { WorkItem, ProjectType, ProcurementType, ApprovalLevel, APPROVAL_LEVEL_LABELS } from "@/types";
import { calculateDaysBetween, formatIDDate, formatIDR, cn } from "@/lib/utils";
import { findMatchingApprovalTier } from "@/lib/approval-matrix-utils";
import { toast } from "sonner";

// Circular Progress Component (Compact, without overflow)
function CircularProgressRing({ currentStep, totalSteps = 4 }: { currentStep: number; totalSteps?: number }) {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  const radius = 18;
  const circumference = 2 * Math.PI * radius; // ~113.097
  const strokeOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-11 h-11">
      <svg
        className="w-11 h-11 shrink-0 -rotate-90"
        viewBox="0 0 44 44"
        width={44}
        height={44}
      >
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-muted/30"
          fill="transparent"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-emerald-600 dark:text-emerald-400 transition-all duration-500 ease-out"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-bold font-mono text-foreground leading-none">
          {percentage}%
        </span>
        <span className="text-[8px] text-muted-foreground leading-none mt-0.5 font-medium">
          {currentStep}/{totalSteps}
        </span>
      </div>
    </div>
  );
}

export default function AddProjectWizard() {
  const router = useRouter();
  const {
    projects,
    regions,
    companies,
    locations,
    blocks,
    projectCategories,
    approvalMatrix,
    addProject,
  } = useAppState();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Basic Information & Classification
  const [code, setCode] = useState(`PRJ-2026-${String(projects.length + 1).padStart(3, "0")}`);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(projectCategories[0]?.id || "cat-1");
  const [projectType, setProjectType] = useState<ProjectType>("Physical Work");
  const [description, setDescription] = useState("");

  // Hierarchy Lokasi: Wilayah & Perusahaan
  const initialRegId = regions[0]?.id || "reg-1";
  const [regionId, setRegionId] = useState(initialRegId);

  // Initial company & location strictly within the initial region
  const initialAvailCompanies = companies.filter((c) =>
    locations.some((loc) => loc.regionId === initialRegId && loc.companyId === c.id)
  );
  const initialCompId = initialAvailCompanies[0]?.id || companies[0]?.id || "cmp-1";
  const [companyId, setCompanyId] = useState(initialCompId);

  // Initial estates strictly for initial region and initial company
  const initialAvailEstates = locations.filter(
    (loc) => loc.regionId === initialRegId && loc.companyId === initialCompId
  );
  const initialLocId = initialAvailEstates[0]?.id || locations[0]?.id || "loc-1";

  // Multi-Select Kebun (Estate) & Blok Tanam (2 atau lebih)
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([initialLocId]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>(["all"]);
  const [estatePopoverOpen, setEstatePopoverOpen] = useState(false);
  const [blockPopoverOpen, setBlockPopoverOpen] = useState(false);

  // Inisiasi Dokumen AFCE Langsung (tanpa pilihan terdaftar)
  const [newAfceNumber, setNewAfceNumber] = useState(`AFCE-2026-0${120 + projects.length}`);
  const [newAfceValue, setNewAfceValue] = useState<number>(350000000);
  const [newSapDocNumber, setNewSapDocNumber] = useState(`AFCE-SAP-9902${10 + projects.length}`);
  const [newAfceStatus, setNewAfceStatus] = useState<"Pending Approval" | "Draft">("Pending Approval");
  const [afceDate, setAfceDate] = useState(new Date().toISOString().split("T")[0]);

  // Dynamic Approval Matrix Preview based on nominal AFCE
  const matchedTier = findMatchingApprovalTier(newAfceValue, approvalMatrix);
  const activeCodes = (matchedTier?.levels.filter(Boolean) as ApprovalLevel[]) || ["WM"];

  // Step 2: Schedule & Baseline
  const [startDate, setStartDate] = useState("2026-11-01");
  const [endDate, setEndDate] = useState("2027-01-31");
  const [scheduleNotes, setScheduleNotes] = useState("");

  // Step 3: Work Items
  const [workItems, setWorkItems] = useState<WorkItem[]>([
    {
      id: "wi-new-1",
      projectId: "",
      name: "Pekerjaan Persiapan & Konstruksi Sipil",
      type: "Physical",
      weight: 60,
      startDate: "2026-11-01",
      endDate: "2026-12-31",
      procurementType: "Tender",
      progressMode: "Daily",
      progress: 0,
      status: "Planned",
      phase: "Physical Execution",
      notes: "Pondasi dan struktur utama",
    },
    {
      id: "wi-new-2",
      projectId: "",
      name: "Pengadaan Material & Komponen Mekanikal",
      type: "Material",
      weight: 40,
      startDate: "2026-11-15",
      endDate: "2027-01-31",
      procurementType: "Purchase",
      progressMode: "Weekly",
      progress: 0,
      status: "Planned",
      phase: "Supporting Materials",
      notes: "Material pendukung dari supplier",
    },
  ]);

  // Preset Template Proyek Sawit (Isi Cepat 1-Klik)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const PROJECT_TEMPLATES = [
    {
      id: "road-bridge",
      title: "Jalan & Jembatan Kebun",
      icon: Construction,
      categoryName: "Infrastruktur",
      projectType: "Physical Work" as ProjectType,
      defaultName: "Pembangunan Jalan Poros & Jembatan Plat Kebun",
      description: "Pekerjaan konstruksi perkerasan jalan poros utama, pembuatan parit kiri-kanan, dan pemasangan jembatan plat beton.",
      afceValue: 650000000,
      workItems: [
        {
          id: "wi-tmpl-1",
          projectId: "",
          name: "Pembersihan Trase & Stripping Badan Jalan",
          type: "Physical" as const,
          weight: 15,
          startDate: "2026-11-01",
          endDate: "2026-11-20",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Pembersihan semak dan perataan tanah dasar",
        },
        {
          id: "wi-tmpl-2",
          projectId: "",
          name: "Penimbunan Tanah Pilihan & Pemadatan",
          type: "Physical" as const,
          weight: 30,
          startDate: "2026-11-21",
          endDate: "2026-12-20",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Penghamparan layer per layer dan pemadatan vibro roller",
        },
        {
          id: "wi-tmpl-3",
          projectId: "",
          name: "Perkerasan Base Course & Graveling",
          type: "Physical" as const,
          weight: 30,
          startDate: "2026-12-21",
          endDate: "2027-01-15",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Batu split dan sirtu mutu tinggi",
        },
        {
          id: "wi-tmpl-4",
          projectId: "",
          name: "Konstruksi Box Culvert & Jembatan Plat",
          type: "Physical" as const,
          weight: 25,
          startDate: "2026-12-01",
          endDate: "2027-01-31",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Pemasangan gorong-gorong dan plat beton bertulang",
        },
      ],
    },
    {
      id: "water-management",
      title: "Pintu Air & Tanggul Banjir",
      icon: Droplets,
      categoryName: "Water Management",
      projectType: "Physical Work" as ProjectType,
      defaultName: "Pembangunan Pintu Klep Otomatis & Tanggul Pasang Surut",
      description: "Pekerjaan tata air kebun, pembuatan tanggul keliling, normalisasi saluran primer, dan pemasangan pintu klep otomatis.",
      afceValue: 480000000,
      workItems: [
        {
          id: "wi-tmpl-1",
          projectId: "",
          name: "Normalisasi Saluran Kolektor & Penggalian",
          type: "Physical" as const,
          weight: 25,
          startDate: "2026-11-01",
          endDate: "2026-11-30",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Ekskavator amfibi saluran primer",
        },
        {
          id: "wi-tmpl-2",
          projectId: "",
          name: "Peninggian & Pemadatan Tanggul Tanah",
          type: "Physical" as const,
          weight: 30,
          startDate: "2026-11-20",
          endDate: "2026-12-31",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Tanggul penahan luapan air pasang",
        },
        {
          id: "wi-tmpl-3",
          projectId: "",
          name: "Pemasangan Pintu Klep Flap Gate Otomatis",
          type: "Physical" as const,
          weight: 25,
          startDate: "2026-12-15",
          endDate: "2027-01-20",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Pintu air HDPE / baja tahan karat",
        },
        {
          id: "wi-tmpl-4",
          projectId: "",
          name: "Pemasangan Bronjong Batu & Cerucuk",
          type: "Physical" as const,
          weight: 20,
          startDate: "2027-01-01",
          endDate: "2027-01-31",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Proteksi tebing saluran terhadap erosi",
        },
      ],
    },
    {
      id: "replanting",
      title: "Replanting & Land Clearing",
      icon: Sprout,
      categoryName: "Agronomi",
      projectType: "Physical Work" as ProjectType,
      defaultName: "Peremajaan Sawit (Replanting) & Tanam Baru",
      description: "Pekerjaan penumbangan sawit tua (chipping), pengolahan tanah, pembuatan rorak, dan penanaman bibit kelapa sawit unggul.",
      afceValue: 850000000,
      workItems: [
        {
          id: "wi-tmpl-1",
          projectId: "",
          name: "Tumbang, Chipping & Rencek Batang Tua",
          type: "Physical" as const,
          weight: 30,
          startDate: "2026-11-01",
          endDate: "2026-12-15",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Pemberantasan sarang kumbang tanduk",
        },
        {
          id: "wi-tmpl-2",
          projectId: "",
          name: "Pembuatan Lubang Tanam, Rorak & Terasering",
          type: "Physical" as const,
          weight: 25,
          startDate: "2026-12-01",
          endDate: "2027-01-15",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Konservasi tanah dan air",
        },
        {
          id: "wi-tmpl-3",
          projectId: "",
          name: "Penanaman Kacangan Penutup Tanah (LCC)",
          type: "Physical" as const,
          weight: 20,
          startDate: "2026-12-15",
          endDate: "2027-01-31",
          procurementType: "Tender" as const,
          progressMode: "Weekly" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Supporting Materials" as const,
          notes: "Mucuna bracteata",
        },
        {
          id: "wi-tmpl-4",
          projectId: "",
          name: "Distribusi & Penanaman Bibit Sawit Utama",
          type: "Physical" as const,
          weight: 25,
          startDate: "2027-01-10",
          endDate: "2027-02-15",
          procurementType: "Tender" as const,
          progressMode: "Daily" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Physical Execution" as const,
          notes: "Bibit bersertifikat Pusat Penelitian Kelapa Sawit",
        },
      ],
    },
    {
      id: "procurement-only",
      title: "Pengadaan Material Sipil",
      icon: Wrench,
      categoryName: "Pengadaan Barang",
      projectType: "Material Purchase" as ProjectType,
      defaultName: "Pengadaan Material Konstruksi Gorong-gorong & Batu",
      description: "Pengadaan langsung material batu pecah, semen, pipa gorong-gorong baja gelombang (Armco), dan kawat bronjong pabrikan.",
      afceValue: 320000000,
      workItems: [
        {
          id: "wi-tmpl-1",
          projectId: "",
          name: "Pengadaan Semen Portland & Pasir Cor",
          type: "Material" as const,
          weight: 35,
          startDate: "2026-11-01",
          endDate: "2026-12-15",
          procurementType: "Purchase" as const,
          progressMode: "Weekly" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Supporting Materials" as const,
          notes: "Standar SNI untuk struktur beton",
        },
        {
          id: "wi-tmpl-2",
          projectId: "",
          name: "Pengadaan Pipa Baja Gelombang (Armco Culvert)",
          type: "Material" as const,
          weight: 40,
          startDate: "2026-11-15",
          endDate: "2027-01-15",
          procurementType: "Purchase" as const,
          progressMode: "Weekly" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Supporting Materials" as const,
          notes: "Gorong-gorong diameter 120cm - 150cm",
        },
        {
          id: "wi-tmpl-3",
          projectId: "",
          name: "Pengadaan Kawat Bronjong Pabrikasi Galvanis",
          type: "Material" as const,
          weight: 25,
          startDate: "2026-12-01",
          endDate: "2027-01-31",
          procurementType: "Purchase" as const,
          progressMode: "Weekly" as const,
          progress: 0,
          status: "Planned" as const,
          phase: "Supporting Materials" as const,
          notes: "Kawat anyaman mesin berlapis seng tebal",
        },
      ],
    },
  ];

  const applyTemplate = (tmpl: (typeof PROJECT_TEMPLATES)[0]) => {
    setSelectedTemplateId(tmpl.id);
    setName(tmpl.defaultName);
    setDescription(tmpl.description);
    setProjectType(tmpl.projectType);
    setNewAfceValue(tmpl.afceValue);
    setWorkItems(tmpl.workItems);
    if (projectCategories.length > 0) {
      const matchCat = projectCategories.find((c) =>
        c.name.toLowerCase().includes(tmpl.categoryName.toLowerCase())
      );
      if (matchCat) setCategoryId(matchCat.id);
    }
    toast.success(`Template "${tmpl.title}" berhasil diterapkan!`);
  };

  // Inline errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cascading filters: Strict dependencies (Zero-fallback)
  // 1. Companies operating in the selected Region
  const availableCompanies = React.useMemo(() => {
    if (!regionId) return [];
    return companies.filter((c) =>
      locations.some((loc) => loc.companyId === c.id && loc.regionId === regionId)
    );
  }, [companies, locations, regionId]);

  // 2. Estates belonging strictly to the selected Region & Company
  const availableEstates = React.useMemo(() => {
    if (!regionId || !companyId) return [];
    return locations.filter(
      (loc) => loc.regionId === regionId && loc.companyId === companyId
    );
  }, [locations, regionId, companyId]);

  // 3. Blocks belonging to ALL selected estates
  const availableBlocks = React.useMemo(() => {
    if (selectedLocationIds.length === 0) return [];
    return blocks.filter((b) => selectedLocationIds.includes(b.estateId));
  }, [blocks, selectedLocationIds]);

  // Atomic cascading handlers
  const handleRegionChange = (newRegId: string) => {
    setRegionId(newRegId);

    // Compute companies operating in new region
    const newAvailCompanies = companies.filter((c) =>
      locations.some((loc) => loc.regionId === newRegId && loc.companyId === c.id)
    );
    const nextCompanyId = newAvailCompanies.some((c) => c.id === companyId)
      ? companyId
      : (newAvailCompanies[0]?.id || "");
    setCompanyId(nextCompanyId);

    // Compute estates for new region and company
    const newAvailEstates = nextCompanyId
      ? locations.filter((loc) => loc.regionId === newRegId && loc.companyId === nextCompanyId)
      : [];
    if (newAvailEstates.length > 0) {
      setSelectedLocationIds([newAvailEstates[0].id]);
    } else {
      setSelectedLocationIds([]);
    }

    // Reset blocks to all
    setSelectedBlockIds(["all"]);
  };

  const handleCompanyChange = (newCompId: string) => {
    setCompanyId(newCompId);

    // Compute estates for current region and new company
    const newAvailEstates = locations.filter(
      (loc) => loc.regionId === regionId && loc.companyId === newCompId
    );
    if (newAvailEstates.length > 0) {
      setSelectedLocationIds([newAvailEstates[0].id]);
    } else {
      setSelectedLocationIds([]);
    }

    // Reset blocks to all
    setSelectedBlockIds(["all"]);
  };

  const handleToggleEstate = (estateId: string) => {
    const isChecked = selectedLocationIds.includes(estateId);
    let nextSelected: string[];
    if (isChecked) {
      if (selectedLocationIds.length <= 1) {
        toast.error("Minimal harus memilih 1 kebun");
        return;
      }
      nextSelected = selectedLocationIds.filter((id) => id !== estateId);
    } else {
      nextSelected = [...selectedLocationIds, estateId];
    }
    setSelectedLocationIds(nextSelected);

    // Clean up block selection if a deselected estate had selected blocks
    if (!selectedBlockIds.includes("all")) {
      const remainingValidBlocks = blocks.filter(
        (b) => nextSelected.includes(b.estateId) && selectedBlockIds.includes(b.id)
      );
      if (remainingValidBlocks.length === 0) {
        setSelectedBlockIds(["all"]);
      } else {
        setSelectedBlockIds(remainingValidBlocks.map((b) => b.id));
      }
    }
  };

  // Hierarchy derivations
  const selectedRegion = regions.find((r) => r.id === regionId);
  const selectedCompany = companies.find((c) => c.id === companyId);
  const selectedEstates = locations.filter((l) => selectedLocationIds.includes(l.id));
  const selectedBlocks = selectedBlockIds.includes("all")
    ? []
    : blocks.filter((b) => selectedBlockIds.includes(b.id));
  const selectedCategory = projectCategories.find((c) => c.id === categoryId);

  // Calculation helpers
  const calculatedDuration = calculateDaysBetween(startDate, endDate);
  const totalWeight = workItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  // Add work item
  const handleAddWorkItem = () => {
    const newItem: WorkItem = {
      id: `wi-new-${Date.now()}`,
      projectId: "",
      name: `Item Pekerjaan #${workItems.length + 1}`,
      type: "Physical",
      weight: 0,
      startDate: startDate,
      endDate: endDate,
      procurementType: "Tender",
      progressMode: "Weekly",
      progress: 0,
      status: "Planned",
      phase: "Physical Execution",
      notes: "",
    };
    setWorkItems((prev) => [...prev, newItem]);
  };

  // Remove work item
  const handleRemoveWorkItem = (id: string) => {
    if (workItems.length <= 1) {
      toast.error("Minimal harus memiliki 1 item pekerjaan");
      return;
    }
    setWorkItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update work item field
  const handleUpdateWorkItem = (id: string, field: keyof WorkItem, value: any) => {
    setWorkItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Step validations
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!code.trim()) {
      errs.code = "Kode proyek wajib diisi";
    } else {
      const isDuplicate = projects.some(
        (p) => p.code.toLowerCase() === code.trim().toLowerCase()
      );
      if (isDuplicate) {
        errs.code = "Kode proyek ini sudah digunakan. Harap gunakan kode unik.";
      }
    }

    if (!name.trim()) errs.name = "Nama proyek wajib diisi";
    if (!regionId) errs.region = "Pilih wilayah (region) proyek";
    if (!companyId) errs.company = "Pilih perusahaan (PT) proyek";
    if (selectedLocationIds.length === 0) errs.location = "Pilih minimal 1 kebun";
    if (!categoryId) errs.category = "Pilih kategori proyek";

    if (!newAfceNumber.trim()) errs.afceNumber = "Nomor AFCE wajib diisi";
    if (!newAfceValue || newAfceValue <= 0) errs.afceValue = "Nilai anggaran AFCE harus lebih dari 0";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!startDate) errs.startDate = "Tanggal mulai wajib diisi";
    if (!endDate) errs.endDate = "Tanggal selesai wajib diisi";
    if (new Date(endDate) <= new Date(startDate)) {
      errs.endDate = "Tanggal selesai harus lebih besar dari tanggal mulai";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (workItems.length === 0) {
      errs.workItems = "Minimal 1 work item wajib ditambahkan";
    }
    if (totalWeight !== 100) {
      errs.weight = `Total bobot harus tepat 100% (saat ini ${totalWeight}%)`;
    }
    workItems.forEach((wi, idx) => {
      if (!wi.name.trim()) {
        errs[`wi_name_${idx}`] = `Nama work item #${idx + 1} tidak boleh kosong`;
      }
      if (wi.weight <= 0) {
        errs[`wi_weight_${idx}`] = `Bobot work item #${idx + 1} harus lebih dari 0%`;
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    }
  };

  const handleSaveProject = () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      toast.error("Silakan periksa kembali kelengkapan formulir");
      return;
    }

    const locationNamesList = selectedEstates.map((l) => l.name);
    const primaryLocation = selectedEstates[0] || locations[0];
    const joinedLocationNames = locationNamesList.join(", ");

    const blockCodesList = selectedBlockIds.includes("all")
      ? ["Seluruh Areal Kebun"]
      : selectedBlocks.map((b) => `${b.code} (${b.name})`);
    const joinedBlockCodes = blockCodesList.join(", ");

    const newProjectId = addProject({
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      projectCategoryId: selectedCategory?.id,
      projectCategoryName: selectedCategory?.name,
      afceNumber: newAfceNumber.trim(),
      afceValue: newAfceValue,
      afceStatus: newAfceStatus,
      sapDocNumber: newSapDocNumber.trim(),
      locationId: primaryLocation.id,
      locationName: joinedLocationNames,
      locationIds: selectedLocationIds,
      locationNames: locationNamesList,
      regionId,
      regionName: selectedRegion?.name || "Region 1 - Sumatera Utara",
      companyId,
      companyName: selectedCompany?.name || "PT Perkebunan Nusantara IV (PalmCo)",
      blockId: selectedBlockIds.includes("all") ? undefined : selectedBlockIds[0],
      blockCode: joinedBlockCodes,
      blockIds: selectedBlockIds.includes("all") ? undefined : selectedBlockIds,
      blockCodes: blockCodesList,
      projectType,
      procurementType: workItems[0]?.procurementType || "Tender",
      status: "Planned",
      progress: 0,
      baselineStartDate: startDate,
      baselineEndDate: endDate,
      targetEndDate: endDate,
      durationDays: calculatedDuration,
      scheduleVarianceDays: 0,
      ewsStatus: "Normal",
      workItems: workItems.map((w) => ({ ...w, projectId: "" })),
      revisions: [],
      surveyAndBoq: [],
    });

    toast.success("Proyek dan dokumen AFCE berhasil diinisiasi!");
    router.push(`/workspace/${newProjectId}`);
  };

  const stepMeta = [
    {
      num: 1,
      shortTitle: "1. Info & AFCE",
      title: "Informasi Dasar & Klasifikasi",
      desc: "Identitas proyek, lokasi, kategori, tipe & dokumen AFCE",
      icon: FileText,
    },
    {
      num: 2,
      shortTitle: "2. Jadwal",
      title: "Jadwal Pelaksanaan & Baseline",
      desc: "Tanggal pelaksanaan dan durasi kalender proyek",
      icon: Clock,
    },
    {
      num: 3,
      shortTitle: "3. Pekerjaan",
      title: "Rincian Item Pekerjaan",
      desc: "Rincian work items dan pembobotan kumulatif 100%",
      icon: Briefcase,
    },
    {
      num: 4,
      shortTitle: "4. Review",
      title: "Konfirmasi & Simpan Proyek",
      desc: "Konfirmasi menyeluruh sebelum pendaftaran sistem",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Top Header Navigation */}
      <div>
        <Link
          href="/workspace"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Kembali ke Workspace
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Inisiasi Proyek Baru</span>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 font-mono text-[10px]">
                AFCE Wizard
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Lengkapi panduan multi-langkah untuk menetapkan jadwal baseline, rincian pekerjaan, dan anggaran AFCE proyek.
            </p>
          </div>
        </div>
      </div>

      {/* Modern Header Card without Horizontal Scrollbar */}
      <Card className="border border-border/80 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Left Side: Compact Circular Ring + Step Title */}
            <div className="flex items-center gap-3 min-w-0">
              <CircularProgressRing currentStep={currentStep} totalSteps={4} />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Langkah {currentStep} dari 4
                </div>
                <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {stepMeta[currentStep - 1]?.title}
                </h2>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {stepMeta[currentStep - 1]?.desc}
                </p>
              </div>
            </div>

            {/* Right Side: Step Indicator (Compact, no scrollbar) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 border-t md:border-t-0 pt-2.5 md:pt-0 w-full md:w-auto justify-between md:justify-end">
              {stepMeta.map((s, idx) => {
                const isCompleted = currentStep > s.num;
                const isCurrent = currentStep === s.num;

                return (
                  <React.Fragment key={s.num}>
                    <button
                      type="button"
                      disabled={currentStep < s.num}
                      onClick={() => {
                        if (currentStep > s.num) setCurrentStep(s.num);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0",
                        isCurrent && "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold shadow-2xs",
                        isCompleted && "text-foreground hover:bg-muted/70 cursor-pointer",
                        !isCurrent && !isCompleted && "text-muted-foreground/50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                          isCurrent && "bg-emerald-600 text-white",
                          isCompleted && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
                          !isCurrent && !isCompleted && "bg-muted text-muted-foreground border"
                        )}
                      >
                        {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : s.num}
                      </span>
                      <span className="whitespace-nowrap">{s.shortTitle}</span>
                    </button>
                    {idx < stepMeta.length - 1 && (
                      <div className="hidden sm:block w-2 h-0.5 bg-border/60 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form Step Card */}
      <Card className="border border-border/80 shadow-xs">
        {/* Step 1: Informasi Dasar, Klasifikasi & Inisiasi AFCE */}
        {currentStep === 1 && (
          <>
            <CardHeader className="border-b bg-muted/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Langkah 1: Informasi Dasar & Klasifikasi Proyek
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Isi detail identitas proyek, penetapan hierarki lokasi kebun (mendukung pemilihan 2 atau lebih kebun/blok), kategori, tipe, serta inisiasi dokumen AFCE baru.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-normal shrink-0 whitespace-nowrap">
                  Tahap 1 / 4
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Preset Template Proyek Sawit (Isi Cepat 1-Klik) */}
              <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Preset Template Proyek Sawit (Isi Cepat 1-Klik)
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    Pilih template untuk mengisi otomatis Work Items 100% & nilai AFCE
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PROJECT_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => applyTemplate(tmpl)}
                      className={cn(
                        "p-2.5 rounded-md border text-left text-xs transition-all flex flex-col justify-between h-20",
                        selectedTemplateId === tmpl.id
                          ? "border-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-100 font-semibold shadow-xs"
                          : "border-border/80 bg-card hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <tmpl.icon className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold text-[11px] leading-tight line-clamp-2">
                          {tmpl.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatIDR(tmpl.afceValue)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 1: Identitas Proyek */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <span className="w-1.5 h-3.5 bg-emerald-600 rounded-xs"></span>
                  Identitas Proyek
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kode Proyek */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Kode Proyek <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Contoh: PRJ-2026-009"
                      className={cn(errors.code && "border-rose-500 focus-visible:ring-rose-500", "font-mono text-xs")}
                    />
                    {errors.code && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.code}
                      </p>
                    )}
                  </div>

                  {/* Nama Proyek */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Nama Proyek <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Pembangunan Pintu Air Sekunder & Tanggul Blok G"
                      className={cn(errors.name && "border-rose-500 focus-visible:ring-rose-500", "text-xs")}
                    />
                    {errors.name && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Lokasi Proyek (Cascading with Multi-Select Kebun & Blok) */}
              <div className="rounded-lg border bg-muted/20 p-3.5 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Lokasi Proyek
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Wilayah &rarr; Perusahaan &rarr; Kebun (Multi-Select) &rarr; Blok (Multi-Select)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. Wilayah (Region) */}
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 block">
                      1. Wilayah (Region) <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={regionId}
                      onValueChange={handleRegionChange}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Pilih Wilayah..." />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.id} value={r.id} className="text-xs">
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Perusahaan (Company / PT) */}
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 block">
                      2. Perusahaan (PT) <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={companyId}
                      onValueChange={handleCompanyChange}
                      disabled={!regionId || availableCompanies.length === 0}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder={!regionId ? "Pilih Wilayah dahulu..." : "Pilih PT..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCompanies.length === 0 ? (
                          <div className="p-2 text-center text-xs text-muted-foreground">
                            Tidak ada PT di wilayah ini
                          </div>
                        ) : (
                          availableCompanies.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {c.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 3. Kebun (Estate) - Multi-Select (Bisa pilih 2 atau lebih) */}
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 flex items-center justify-between">
                      <span>3. Kebun (Estate) <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-emerald-600 font-normal">Multi-Select</span>
                    </label>

                    <Popover open={estatePopoverOpen} onOpenChange={setEstatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          disabled={!companyId || availableEstates.length === 0}
                          className={cn(
                            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-2.5 py-1 text-xs font-normal shadow-xs hover:bg-background",
                            errors.location && "border-rose-500",
                            (selectedLocationIds.length === 0 || !companyId) && "text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate">
                              {!companyId
                                ? "Pilih PT dahulu..."
                                : availableEstates.length === 0
                                ? "Tidak ada kebun"
                                : selectedLocationIds.length === 0
                                ? "Pilih Kebun..."
                                : selectedLocationIds.length === 1
                                ? selectedEstates[0]?.name
                                : `${selectedLocationIds.length} Kebun Terpilih`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {selectedLocationIds.length > 1 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {selectedLocationIds.length}
                              </span>
                            )}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0 shadow-lg" align="start">
                        <div className="p-2.5 border-b bg-muted/20 flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">
                            Pilih Kebun ({selectedLocationIds.length}/{availableEstates.length})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedLocationIds(availableEstates.map((l) => l.id))}
                              className="text-[11px] text-emerald-600 hover:underline font-medium"
                            >
                              Pilih Semua
                            </button>
                            <span className="text-muted-foreground text-[10px]">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (availableEstates.length > 0) setSelectedLocationIds([availableEstates[0].id]);
                              }}
                              className="text-[11px] text-muted-foreground hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                          {availableEstates.length === 0 ? (
                            <p className="p-3 text-center text-xs text-muted-foreground">
                              Tidak ada kebun pada PT dan wilayah ini.
                            </p>
                          ) : (
                            availableEstates.map((loc) => {
                              const isChecked = selectedLocationIds.includes(loc.id);
                              return (
                                <label
                                  key={loc.id}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors",
                                    isChecked
                                      ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium"
                                      : "hover:bg-muted"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleEstate(loc.id)}
                                      className="rounded border-input text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 shrink-0"
                                    />
                                    <div className="truncate">
                                      <span className="truncate block font-semibold">{loc.code} - {loc.name}</span>
                                      <span className="text-[10px] text-muted-foreground truncate block">
                                        {loc.district} &bull; {loc.hectares} Ha
                                      </span>
                                    </div>
                                  </div>
                                  {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                </label>
                              );
                            })
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Preview tags if 2 or more estates selected */}
                    {selectedLocationIds.length > 1 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedEstates.map((est) => (
                          <span
                            key={est.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
                          >
                            {est.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Blok Kebun (Block) - Multi-Select (Bisa pilih 2 atau lebih) */}
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 flex items-center justify-between">
                      <span>4. Blok Tanam <span className="text-muted-foreground font-normal">(Opsional)</span></span>
                      <span className="text-[10px] text-emerald-600 font-normal">Multi-Select</span>
                    </label>

                    <Popover open={blockPopoverOpen} onOpenChange={setBlockPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          disabled={selectedLocationIds.length === 0}
                          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-2.5 py-1 text-xs font-normal shadow-xs hover:bg-background"
                        >
                          <span className="truncate">
                            {selectedLocationIds.length === 0
                              ? "Pilih Kebun dahulu..."
                              : selectedBlockIds.includes("all")
                              ? "-- Seluruh Areal Kebun --"
                              : selectedBlockIds.length === 1
                              ? selectedBlocks[0]?.code
                              : `${selectedBlockIds.length} Blok Terpilih`}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {!selectedBlockIds.includes("all") && selectedBlockIds.length > 1 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-muted text-foreground">
                                {selectedBlockIds.length}
                              </span>
                            )}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0 shadow-lg" align="start">
                        <div className="p-2.5 border-b bg-muted/20 flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">Pilih Blok Tanam</span>
                          <button
                            type="button"
                            onClick={() => setSelectedBlockIds(["all"])}
                            className="text-[11px] text-emerald-600 hover:underline font-medium"
                          >
                            Seluruh Areal
                          </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                          <label
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors border-b mb-1",
                              selectedBlockIds.includes("all")
                                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold"
                                : "hover:bg-muted"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={selectedBlockIds.includes("all")}
                                onChange={() => setSelectedBlockIds(["all"])}
                                className="rounded border-input text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 shrink-0"
                              />
                              <span>-- Seluruh Areal Kebun Terpilih --</span>
                            </div>
                            {selectedBlockIds.includes("all") && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          </label>

                          {availableBlocks.length === 0 ? (
                            <p className="p-2 text-center text-[11px] text-muted-foreground">
                              Tidak ada data blok spesifik pada kebun terpilih.
                            </p>
                          ) : (
                            availableBlocks.map((blk) => {
                              const isChecked = !selectedBlockIds.includes("all") && selectedBlockIds.includes(blk.id);
                              const estateName = locations.find((l) => l.id === blk.estateId)?.name;
                              return (
                                <label
                                  key={blk.id}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors",
                                    isChecked
                                      ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium"
                                      : "hover:bg-muted"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        let next: string[];
                                        if (selectedBlockIds.includes("all")) {
                                          next = [blk.id];
                                        } else if (isChecked) {
                                          next = selectedBlockIds.filter((id) => id !== blk.id);
                                          if (next.length === 0) next = ["all"];
                                        } else {
                                          next = [...selectedBlockIds, blk.id];
                                        }
                                        setSelectedBlockIds(next);
                                      }}
                                      className="rounded border-input text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 shrink-0"
                                    />
                                    <div className="truncate">
                                      <span className="truncate block font-semibold">{blk.code} - {blk.afdeling}</span>
                                      <span className="text-[10px] text-muted-foreground truncate block">
                                        {blk.name} {estateName ? `• ${estateName}` : ""}
                                      </span>
                                    </div>
                                  </div>
                                  {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                </label>
                              );
                            })
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Preview tags if specific blocks selected */}
                    {!selectedBlockIds.includes("all") && selectedBlockIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedBlocks.map((blk) => (
                          <span
                            key={blk.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted font-mono font-medium text-foreground border"
                          >
                            {blk.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Klasifikasi Pekerjaan (Kategori Proyek SEBELUM Tipe Proyek) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kategori Proyek (Master Data - Diletakkan sebelum Tipe Proyek) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Tags className="w-3.5 h-3.5 text-emerald-600" />
                      Kategori Proyek <span className="text-rose-500">*</span>
                    </label>
                    <Link
                      href="/master-data/project-categories"
                      target="_blank"
                      className="text-[10px] text-emerald-600 hover:underline"
                    >
                      Kelola Master Data &rarr;
                    </Link>
                  </div>
                  <Select
                    value={categoryId}
                    onValueChange={(val) => setCategoryId(val)}
                  >
                    <SelectTrigger className={cn("h-9 text-xs", errors.category && "border-rose-500")}>
                      <SelectValue placeholder="Pilih Kategori Proyek..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projectCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-muted-foreground ml-1.5">({c.code})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      {selectedCategory.description}
                    </p>
                  )}
                </div>

                {/* Tipe Proyek */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Tipe Proyek <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={projectType}
                    onValueChange={(val) => setProjectType(val as ProjectType)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pilih Tipe Proyek..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Physical Work" className="text-xs">
                        Pekerjaan Fisik (Civil Infrastructure)
                      </SelectItem>
                      <SelectItem value="Material Purchase" className="text-xs">
                        Pengadaan Material & Komponen
                      </SelectItem>
                      <SelectItem value="Combined" className="text-xs">
                        Pekerjaan Terpadu (Fisik & Material)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Klasifikasi teknis kontrak pelaksanaan proyek.
                  </p>
                </div>
              </div>

              {/* Section 4: Dokumen AFCE */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      Dokumen AFCE
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Dokumen AFCE dibuat bersamaan dengan proyek ini dan didaftarkan otomatis ke matriks persetujuan SOP.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        Nomor Dokumen AFCE <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={newAfceNumber}
                        onChange={(e) => setNewAfceNumber(e.target.value)}
                        placeholder="AFCE-2026-..."
                        className={cn("font-mono text-xs", errors.afceNumber && "border-rose-500")}
                      />
                      {errors.afceNumber && (
                        <p className="text-[10px] text-rose-500 mt-0.5">{errors.afceNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        Nilai Anggaran AFCE (Rp) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min="1000000"
                        step="1000000"
                        value={newAfceValue}
                        onChange={(e) => setNewAfceValue(Number(e.target.value))}
                        className={cn("font-mono text-xs font-bold", errors.afceValue && "border-rose-500")}
                      />
                      {errors.afceValue && (
                        <p className="text-[10px] text-rose-500 mt-0.5">{errors.afceValue}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        Nomor Referensi SAP AFCE
                      </label>
                      <Input
                        value={newSapDocNumber}
                        onChange={(e) => setNewSapDocNumber(e.target.value)}
                        placeholder="AFCE-SAP-..."
                        className="font-mono text-xs text-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* SOP Approval Matrix Indicator Based on Nominal */}
                  <div className="p-3.5 rounded-lg bg-card border flex flex-col gap-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-foreground">
                          Matriks SOP:{" "}
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {matchedTier?.tierName || "Standar SOP"}
                          </span>
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
                        {activeCodes.length} Level Otorisasi Wajib
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground block">
                        Alur Jenjang Otorisasi SAP untuk Nilai Anggaran <b>{formatIDR(newAfceValue)}</b>:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {activeCodes.map((code, idx) => (
                          <React.Fragment key={code}>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-mono">
                                {idx + 1}
                              </span>
                              <span>{APPROVAL_LEVEL_LABELS[code] || code}</span>
                            </span>
                            {idx < activeCodes.length - 1 && (
                              <span className="text-muted-foreground text-xs font-bold">&rarr;</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        Status Pengajuan Persetujuan Awal
                      </label>
                      <Select
                        value={newAfceStatus}
                        onValueChange={(val: any) => setNewAfceStatus(val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending Approval" className="text-xs">
                            Langsung Ajukan untuk Approval (Pending Approval Level 1)
                          </SelectItem>
                          <SelectItem value="Draft" className="text-xs">
                            Simpan sebagai Draft AFCE Internal (Diajukan Nanti)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        Tanggal Dokumen / Pengajuan AFCE <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="date"
                        value={afceDate}
                        onChange={(e) => setAfceDate(e.target.value)}
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Deskripsi & Ruang Lingkup */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Deskripsi Ringkas & Ruang Lingkup
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Uraikan lokasi afdeling, dimensi, kapasitas teknis, atau target fungsional pekerjaan..."
                  rows={3}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Jadwal Pelaksanaan & Baseline */}
        {currentStep === 2 && (
          <>
            <CardHeader className="border-b bg-muted/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Langkah 2: Jadwal Pelaksanaan & Baseline Proyek
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tentukan tanggal mulai dan selesai yang akan dijadikan acuan baseline kurva-S dan perhitungan variansi jadwal.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-normal shrink-0 whitespace-nowrap">
                  Tahap 2 / 4
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Tanggal Rencana Mulai (Start Date) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs font-mono"
                  />
                  {errors.startDate && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.startDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Tanggal Rencana Selesai (Target Date) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs font-mono"
                  />
                  {errors.endDate && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Calculated Duration Display Card */}
              <div className="p-4 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Durasi Kalender Baseline
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Periode ini otomatis akan dikunci sebagai jadwal baseline resmi pembanding deviasi fisik.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-200">
                    {calculatedDuration} Hari
                  </span>
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    (~{Math.ceil(calculatedDuration / 7)} Minggu)
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Catatan Asumsi Jadwal / Kondisi Musim
                </label>
                <Textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="Misalnya: Pelaksanaan galian tanah diselesaikan sebelum puncak musim hujan bulan Desember..."
                  rows={3}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3: Work Items & Bobot */}
        {currentStep === 3 && (
          <>
            <CardHeader className="border-b bg-muted/10 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    Langkah 3: Rincian Item Pekerjaan (Work Items)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Rincikan paket pekerjaan utama beserta pembobotan persentase fisik yang totalnya harus tepat 100%.
                  </CardDescription>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddWorkItem}
                  className="gap-1 text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Item
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              {/* Dynamic Weight Indicator Banner */}
              <div
                className={cn(
                  "p-3 rounded-lg border flex items-center justify-between text-xs transition-colors",
                  totalWeight === 100
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span className="font-semibold">
                    Total Bobot Kumulatif:{" "}
                    <span className="font-mono text-sm font-bold">{totalWeight}%</span> / 100%
                  </span>
                </div>
                <span>
                  {totalWeight === 100 ? (
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Valid (Tepat 100%)
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-700 dark:text-rose-300">
                      Harus tepat 100% (Selisih {100 - totalWeight}%)
                    </span>
                  )}
                </span>
              </div>

              {errors.weight && (
                <p className="text-xs text-rose-500 font-medium">{errors.weight}</p>
              )}

              {/* Work Item List */}
              <div className="space-y-3">
                {workItems.map((wi, index) => (
                  <div
                    key={wi.id}
                    className="p-3.5 rounded-lg border bg-muted/20 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        Item Pekerjaan #{index + 1}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveWorkItem(wi.id)}
                        className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950"
                        title="Hapus item pekerjaan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      {/* Name */}
                      <div className="sm:col-span-6">
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Nama Item Pekerjaan
                        </label>
                        <Input
                          value={wi.name}
                          onChange={(e) => handleUpdateWorkItem(wi.id, "name", e.target.value)}
                          placeholder="Nama pekerjaan..."
                          className="text-xs"
                        />
                      </div>

                      {/* Type */}
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Tipe
                        </label>
                        <Select
                          value={wi.type}
                          onValueChange={(val) => handleUpdateWorkItem(wi.id, "type", val)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Physical" className="text-xs">Physical (Jasa/Fisik)</SelectItem>
                            <SelectItem value="Material" className="text-xs">Material (Pengadaan)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Weight % */}
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Bobot (%)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={wi.weight}
                          onChange={(e) =>
                            handleUpdateWorkItem(wi.id, "weight", Number(e.target.value))
                          }
                          className="font-mono font-bold text-xs"
                        />
                      </div>

                      {/* Procurement Type */}
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Metode Pengadaan
                        </label>
                        <Select
                          value={wi.procurementType}
                          onValueChange={(val: ProcurementType) =>
                            handleUpdateWorkItem(wi.id, "procurementType", val)
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tender" className="text-xs">Tender Rekanan</SelectItem>
                            <SelectItem value="Swakelola" className="text-xs">Swakelola Kebun</SelectItem>
                            <SelectItem value="Purchase" className="text-xs">Purchase Langsung</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Progress Mode */}
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Mode Pelaporan
                        </label>
                        <Select
                          value={wi.progressMode}
                          onValueChange={(val: "Daily" | "Weekly") =>
                            handleUpdateWorkItem(wi.id, "progressMode", val)
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Daily" className="text-xs">Harian (Daily)</SelectItem>
                            <SelectItem value="Weekly" className="text-xs">Mingguan (Weekly)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Phase */}
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Fase Gantt
                        </label>
                        <Select
                          value={wi.phase}
                          onValueChange={(val: any) => handleUpdateWorkItem(wi.id, "phase", val)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tender" className="text-xs">Tender</SelectItem>
                            <SelectItem value="Physical Execution" className="text-xs">Physical Execution</SelectItem>
                            <SelectItem value="Supporting Materials" className="text-xs">Supporting Materials</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Review & Simpan Proyek */}
        {currentStep === 4 && (
          <>
            <CardHeader className="border-b bg-muted/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Langkah 4: Konfirmasi & Simpan Proyek
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Periksa kembali ringkasan parameter proyek, lokasi kebun/blok, kategori, anggaran AFCE, jadwal baseline, dan pembobotan sebelum disimpan.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-normal shrink-0 whitespace-nowrap">
                  Tahap 4 / 4
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              <div className="rounded-lg border p-4 space-y-4 bg-muted/10 text-xs">
                {/* General Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b pb-3.5">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Kode Proyek:</span>
                    <span className="font-mono font-bold text-sm text-foreground">{code}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Perusahaan (PT):</span>
                    <span className="font-semibold text-foreground">{selectedCompany?.name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Wilayah Operasional:</span>
                    <span className="font-semibold text-foreground">
                      {selectedRegion?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Kategori & Tipe:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300 block">
                      {selectedCategory?.name || "-"}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {projectType} &bull; {calculatedDuration} Hari
                    </span>
                  </div>
                </div>

                {/* Project Name */}
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nama Proyek:</span>
                  <span className="font-semibold text-sm text-foreground">{name}</span>
                </div>

                {/* Location Estates & Blocks Summary */}
                <div className="p-3 rounded-lg bg-card border space-y-2">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Lokasi Kebun & Blok Tanam Terpilih ({selectedEstates.length} Kebun)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {selectedBlockIds.includes("all") ? "Seluruh Areal Kebun" : `${selectedBlocks.length} Blok Spesifik`}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-muted-foreground text-[11px]">Kebun:</span>
                      {selectedEstates.map((est) => (
                        <span
                          key={est.id}
                          className="px-2 py-0.5 rounded font-medium text-[11px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        >
                          {est.name} ({est.code})
                        </span>
                      ))}
                    </div>
                    {!selectedBlockIds.includes("all") && selectedBlocks.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-muted-foreground text-[11px]">Blok:</span>
                        {selectedBlocks.map((blk) => (
                          <span
                            key={blk.id}
                            className="px-2 py-0.5 rounded font-mono font-medium text-[11px] bg-muted border text-foreground"
                          >
                            {blk.code} ({blk.afdeling})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AFCE Summary Box */}
                <div className="p-3.5 rounded-lg bg-card border space-y-2">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      Inisiasi Dokumen AFCE Terkait
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {newAfceStatus}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Nomor AFCE:</span>
                      <span className="font-mono font-bold text-foreground">{newAfceNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Nilai Anggaran Modal:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatIDR(newAfceValue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Tanggal Pengajuan:</span>
                      <span className="font-mono font-semibold text-foreground">{afceDate}</span>
                    </div>
                  </div>

                  {/* Matriks SOP Hierarchy Breakdown */}
                  <div className="pt-2 border-t mt-2 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Jenjang Otorisasi Matriks ({matchedTier?.tierName || "SOP"}):
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {activeCodes.length} Level Wajib
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {activeCodes.map((code, idx) => (
                        <React.Fragment key={code}>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-muted border">
                            <span className="font-mono text-[9px] font-bold text-muted-foreground">{idx + 1}.</span>
                            <span>{APPROVAL_LEVEL_LABELS[code] || code}</span>
                          </span>
                          {idx < activeCodes.length - 1 && (
                            <span className="text-muted-foreground text-[10px]">&rarr;</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Schedule Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b pb-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Rencana Mulai:</span>
                    <span className="font-mono font-semibold text-foreground">{startDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Rencana Selesai:</span>
                    <span className="font-mono font-semibold text-foreground">{endDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Durasi Baseline:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {calculatedDuration} Hari (~{Math.ceil(calculatedDuration / 7)} Minggu)
                    </span>
                  </div>
                </div>

                {/* Work Item Weights Summary */}
                <div>
                  <span className="font-semibold text-foreground block mb-2">
                    Daftar Item Pekerjaan & Pembobotan ({workItems.length} item, Kumulatif: {totalWeight}%):
                  </span>
                  <div className="space-y-1.5">
                    {workItems.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-2 rounded bg-background border text-xs"
                      >
                        <div>
                          <span className="font-medium text-foreground">{it.name}</span>
                          <span className="text-[11px] text-muted-foreground ml-2">
                            ({it.procurementType} &bull; {it.phase})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">{it.type}</span>
                          <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                            {it.weight}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Footer Navigation (Multi Step Form 05 Style) */}
        <CardFooter className="flex items-center justify-between border-t p-3.5 sm:p-4 bg-muted/10">
          <Button
            variant="outline"
            size="sm"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((s) => s - 1)}
            className="text-xs gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
          </Button>

          {/* Stepper Dots Indicator in the center */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((stepIdx) => (
              <span
                key={stepIdx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentStep === stepIdx
                    ? "w-6 bg-emerald-600"
                    : currentStep > stepIdx
                    ? "w-2 bg-emerald-400/80"
                    : "w-2 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {currentStep < 4 ? (
            <div className="flex items-center gap-2">
              {currentStep === 1 && name.trim() && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSaveProject}
                  className="hidden sm:inline-flex gap-1.5 border-emerald-500 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Simpan Cepat (1-Klik)
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
              >
                Lanjutkan <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleSaveProject}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            >
              <Save className="w-4 h-4" /> Simpan Proyek & Ajukan AFCE
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
