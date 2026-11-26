import type { Project, PurchaseOrder, SPKContract } from "@/types";
import { formatIDDate, isProjectDelayed } from "@/lib/utils";

export interface PortfolioReportFilter {
  search: string;
  regionName: string;
  companyName: string;
  locationName: string;
  categoryName: string;
  picName: string;
  status: string;
  ewsStatus: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_PORTFOLIO_FILTER: PortfolioReportFilter = {
  search: "",
  regionName: "all",
  companyName: "all",
  locationName: "all",
  categoryName: "all",
  picName: "all",
  status: "all",
  ewsStatus: "all",
  dateFrom: "",
  dateTo: "",
};

export interface PortfolioProjectRow {
  id: string;
  code: string;
  name: string;
  afceNumber: string;
  afceStatus: string;
  locationName: string;
  regionName: string;
  companyName: string;
  categoryName: string;
  picName: string;
  status: Project["status"];
  ewsStatus: Project["ewsStatus"];
  isDelayed: boolean;
  progress: number;
  baselineStartDate: string;
  baselineEndDate: string;
  targetEndDate: string;
  scheduleVarianceDays: number;
  revisionCount: number;
  afceValue: number;
  poCommittedValue: number;
  spkCommittedValue: number;
  totalCommittedValue: number;
  remainingAfceValue: number;
  budgetAbsorptionPercent: number;
  poCount: number;
  spkCount: number;
}

export interface PortfolioSummary {
  totalProjects: number;
  plannedCount: number;
  inProgressCount: number;
  onHoldCount: number;
  completedCount: number;
  cancelledCount: number;
  ewsNormalCount: number;
  ewsWarningCount: number;
  ewsCriticalCount: number;
  delayedCount: number;
  avgProgress: number;
  totalAfceValue: number;
  totalPoValue: number;
  totalSpkValue: number;
  totalCommittedValue: number;
  totalRemainingAfceValue: number;
  overallAbsorptionPercent: number;
  totalRevisions: number;
}

export interface LocationBreakdownRow {
  locationName: string;
  projectCount: number;
  afceValue: number;
  poValue: number;
  spkValue: number;
  totalCommittedValue: number;
  absorptionPercent: number;
  avgProgress: number;
  delayedCount: number;
}

export interface PortfolioFilterOptions {
  regions: string[];
  companies: string[];
  locations: string[];
  categories: string[];
  pics: string[];
}

export function extractPortfolioFilterOptions(
  projects: Project[]
): PortfolioFilterOptions {
  const active = projects.filter((p) => !p.deletedAt);
  const uniq = (values: Array<string | undefined | null>) =>
    Array.from(
      new Set(
        values
          .map((v) => (v || "").trim())
          .filter((v) => v.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, "id"));

  return {
    regions: uniq(active.map((p) => p.regionName)),
    companies: uniq(active.map((p) => p.companyName)),
    locations: uniq(active.map((p) => p.locationName)),
    categories: uniq(active.map((p) => p.projectCategoryName)),
    pics: uniq(active.map((p) => p.picName)),
  };
}

export function buildPortfolioReportRows(
  projects: Project[],
  pos: PurchaseOrder[],
  spkContracts: SPKContract[],
  filters: PortfolioReportFilter
): PortfolioProjectRow[] {
  const poByProject = new Map<string, { total: number; count: number }>();
  for (const po of pos) {
    if (po.deletedAt || po.status === "Cancelled") continue;
    const prev = poByProject.get(po.projectId) || { total: 0, count: 0 };
    prev.total += Number(po.poValue || 0);
    prev.count += 1;
    poByProject.set(po.projectId, prev);
  }

  const spkByProject = new Map<string, { total: number; count: number }>();
  for (const spk of spkContracts) {
    if (spk.deletedAt) continue;
    const prev = spkByProject.get(spk.projectId) || { total: 0, count: 0 };
    prev.total += Number(spk.value || 0);
    prev.count += 1;
    spkByProject.set(spk.projectId, prev);
  }

  const query = filters.search.trim().toLowerCase();
  const fromTime = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
  const toTime = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).getTime() : null;

  const rows: PortfolioProjectRow[] = [];

  for (const p of projects) {
    if (p.deletedAt) continue;

    if (filters.regionName !== "all" && (p.regionName || "") !== filters.regionName) {
      continue;
    }
    if (filters.companyName !== "all" && (p.companyName || "") !== filters.companyName) {
      continue;
    }
    if (filters.locationName !== "all" && (p.locationName || "") !== filters.locationName) {
      continue;
    }
    if (
      filters.categoryName !== "all" &&
      (p.projectCategoryName || "") !== filters.categoryName
    ) {
      continue;
    }
    if (filters.picName !== "all" && (p.picName || "") !== filters.picName) {
      continue;
    }
    if (filters.status !== "all" && p.status !== filters.status) {
      continue;
    }

    const delayed = isProjectDelayed(p);
    if (filters.ewsStatus === "delayed") {
      if (!delayed) continue;
    } else if (filters.ewsStatus !== "all" && p.ewsStatus !== filters.ewsStatus) {
      continue;
    }

    if (fromTime !== null || toTime !== null) {
      const targetTime = p.targetEndDate ? new Date(p.targetEndDate).getTime() : NaN;
      if (Number.isNaN(targetTime)) continue;
      if (fromTime !== null && targetTime < fromTime) continue;
      if (toTime !== null && targetTime > toTime) continue;
    }

    if (query) {
      const haystack = [
        p.code,
        p.name,
        p.afceNumber,
        p.locationName,
        p.regionName,
        p.companyName,
        p.picName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) continue;
    }

    const poAgg = poByProject.get(p.id) || { total: 0, count: 0 };
    const spkAgg = spkByProject.get(p.id) || { total: 0, count: 0 };
    const afceValue = Number(p.afceValue || 0);
    const totalCommittedValue = poAgg.total + spkAgg.total;
    const remainingAfceValue = afceValue - totalCommittedValue;
    const budgetAbsorptionPercent =
      afceValue > 0 ? Math.round((totalCommittedValue / afceValue) * 100) : 0;

    rows.push({
      id: p.id,
      code: p.code,
      name: p.name,
      afceNumber: p.afceNumber || "-",
      afceStatus: p.afceStatus,
      locationName: p.locationName || "Belum Ditentukan",
      regionName: p.regionName || "-",
      companyName: p.companyName || "-",
      categoryName: p.projectCategoryName || "-",
      picName: p.picName || "Belum Ditentukan",
      status: p.status,
      ewsStatus: p.ewsStatus,
      isDelayed: delayed,
      progress: Number(p.progress || 0),
      baselineStartDate: p.baselineStartDate,
      baselineEndDate: p.baselineEndDate,
      targetEndDate: p.targetEndDate,
      scheduleVarianceDays: Number(p.scheduleVarianceDays || 0),
      revisionCount: Array.isArray(p.revisions) ? p.revisions.length : 0,
      afceValue,
      poCommittedValue: poAgg.total,
      spkCommittedValue: spkAgg.total,
      totalCommittedValue,
      remainingAfceValue,
      budgetAbsorptionPercent,
      poCount: poAgg.count,
      spkCount: spkAgg.count,
    });
  }

  return rows;
}

export function computePortfolioSummary(
  rows: PortfolioProjectRow[]
): PortfolioSummary {
  const totalProjects = rows.length;
  let plannedCount = 0;
  let inProgressCount = 0;
  let onHoldCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let ewsNormalCount = 0;
  let ewsWarningCount = 0;
  let ewsCriticalCount = 0;
  let delayedCount = 0;
  let progressSum = 0;
  let totalAfceValue = 0;
  let totalPoValue = 0;
  let totalSpkValue = 0;
  let totalRevisions = 0;

  for (const r of rows) {
    if (r.status === "Planned") plannedCount += 1;
    else if (r.status === "In Progress") inProgressCount += 1;
    else if (r.status === "On Hold") onHoldCount += 1;
    else if (r.status === "Completed") completedCount += 1;
    else if (r.status === "Cancelled") cancelledCount += 1;

    if (r.ewsStatus === "Critical") ewsCriticalCount += 1;
    else if (r.ewsStatus === "Warning") ewsWarningCount += 1;
    else ewsNormalCount += 1;

    if (r.isDelayed) delayedCount += 1;
    progressSum += r.progress;
    totalAfceValue += r.afceValue;
    totalPoValue += r.poCommittedValue;
    totalSpkValue += r.spkCommittedValue;
    totalRevisions += r.revisionCount;
  }

  const totalCommittedValue = totalPoValue + totalSpkValue;
  const totalRemainingAfceValue = totalAfceValue - totalCommittedValue;
  const overallAbsorptionPercent =
    totalAfceValue > 0 ? Math.round((totalCommittedValue / totalAfceValue) * 100) : 0;
  const avgProgress = totalProjects > 0 ? Math.round(progressSum / totalProjects) : 0;

  return {
    totalProjects,
    plannedCount,
    inProgressCount,
    onHoldCount,
    completedCount,
    cancelledCount,
    ewsNormalCount,
    ewsWarningCount,
    ewsCriticalCount,
    delayedCount,
    avgProgress,
    totalAfceValue,
    totalPoValue,
    totalSpkValue,
    totalCommittedValue,
    totalRemainingAfceValue,
    overallAbsorptionPercent,
    totalRevisions,
  };
}

export function computeLocationBreakdown(
  rows: PortfolioProjectRow[]
): LocationBreakdownRow[] {
  const map = new Map<
    string,
    {
      projectCount: number;
      afceValue: number;
      poValue: number;
      spkValue: number;
      progressSum: number;
      delayedCount: number;
    }
  >();

  for (const r of rows) {
    const key = r.locationName || "Belum Ditentukan";
    const acc = map.get(key) || {
      projectCount: 0,
      afceValue: 0,
      poValue: 0,
      spkValue: 0,
      progressSum: 0,
      delayedCount: 0,
    };
    acc.projectCount += 1;
    acc.afceValue += r.afceValue;
    acc.poValue += r.poCommittedValue;
    acc.spkValue += r.spkCommittedValue;
    acc.progressSum += r.progress;
    if (r.isDelayed) acc.delayedCount += 1;
    map.set(key, acc);
  }

  const result: LocationBreakdownRow[] = [];
  for (const [locationName, acc] of map.entries()) {
    const totalCommittedValue = acc.poValue + acc.spkValue;
    result.push({
      locationName,
      projectCount: acc.projectCount,
      afceValue: acc.afceValue,
      poValue: acc.poValue,
      spkValue: acc.spkValue,
      totalCommittedValue,
      absorptionPercent:
        acc.afceValue > 0 ? Math.round((totalCommittedValue / acc.afceValue) * 100) : 0,
      avgProgress:
        acc.projectCount > 0 ? Math.round(acc.progressSum / acc.projectCount) : 0,
      delayedCount: acc.delayedCount,
    });
  }

  return result.sort((a, b) => b.afceValue - a.afceValue);
}

export function countActivePortfolioFilters(
  filters: PortfolioReportFilter
): number {
  let count = 0;
  if (filters.search.trim()) count += 1;
  if (filters.regionName !== "all") count += 1;
  if (filters.companyName !== "all") count += 1;
  if (filters.locationName !== "all") count += 1;
  if (filters.categoryName !== "all") count += 1;
  if (filters.picName !== "all") count += 1;
  if (filters.status !== "all") count += 1;
  if (filters.ewsStatus !== "all") count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  return count;
}

export function describeActiveFilters(filters: PortfolioReportFilter): string[] {
  const parts: string[] = [];
  if (filters.regionName !== "all") parts.push(`Region: ${filters.regionName}`);
  if (filters.companyName !== "all") parts.push(`Perusahaan: ${filters.companyName}`);
  if (filters.locationName !== "all") parts.push(`Kebun: ${filters.locationName}`);
  if (filters.categoryName !== "all") parts.push(`Kategori: ${filters.categoryName}`);
  if (filters.picName !== "all") parts.push(`PIC: ${filters.picName}`);
  if (filters.status !== "all") parts.push(`Status: ${filters.status}`);
  if (filters.ewsStatus === "delayed") {
    parts.push("EWS: Terlambat / Peringatan");
  } else if (filters.ewsStatus !== "all") {
    parts.push(`EWS: ${filters.ewsStatus}`);
  }
  if (filters.dateFrom || filters.dateTo) {
    const startLabel = filters.dateFrom ? formatIDDate(filters.dateFrom) : "Awal";
    const endLabel = filters.dateTo ? formatIDDate(filters.dateTo) : "Sekarang";
    parts.push(`Target Selesai: ${startLabel} s.d. ${endLabel}`);
  }
  if (filters.search.trim()) parts.push(`Kata Kunci: "${filters.search.trim()}"`);
  return parts;
}

export function formatCompactIDR(amount: number): string {
  if (Number.isNaN(amount) || amount === 0) return "Rp 0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(0)} Jt`;
  }
  return `${sign}Rp ${new Intl.NumberFormat("id-ID").format(abs)}`;
}
