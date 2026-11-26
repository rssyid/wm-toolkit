"use client";

import React, { useState } from "react";
import { Filter, RotateCcw, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  countActivePortfolioFilters,
  DEFAULT_PORTFOLIO_FILTER,
  type PortfolioFilterOptions,
  type PortfolioReportFilter,
} from "@/lib/report-portfolio-utils";

interface PortfolioFilterBarProps {
  filters: PortfolioReportFilter;
  options: PortfolioFilterOptions;
  onChange: (next: PortfolioReportFilter) => void;
  filteredCount: number;
  totalCount: number;
}

export function PortfolioFilterBar({
  filters,
  options,
  onChange,
  filteredCount,
  totalCount,
}: PortfolioFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeFilterCount = countActivePortfolioFilters(filters);

  const updateField = <K extends keyof PortfolioReportFilter>(
    key: K,
    value: PortfolioReportFilter[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onChange(DEFAULT_PORTFOLIO_FILTER);
  };

  return (
    <section
      aria-label="Filter laporan portofolio"
      className="rounded-lg border bg-card p-3.5 sm:p-4 space-y-3 print:hidden"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        {/* Pencarian Cepat */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <label
            htmlFor="report-search"
            className="text-xs font-medium text-foreground block"
          >
            Cari Proyek atau Nomor AFCE
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="report-search"
              type="search"
              value={filters.search}
              onChange={(e) => updateField("search", e.target.value)}
              placeholder="Kode proyek, nama proyek, nomor AFCE, atau PIC..."
              className="h-10 pl-9 text-xs sm:h-9"
            />
          </div>
        </div>

        {/* Filter Utama: Kebun, Status, EWS */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:w-auto lg:flex lg:items-end">
          <div className="space-y-1.5 lg:w-44">
            <label
              htmlFor="filter-location"
              className="text-xs font-medium text-foreground block"
            >
              Kebun / Lokasi
            </label>
            <Select
              value={filters.locationName}
              onValueChange={(val) => updateField("locationName", val)}
            >
              <SelectTrigger id="filter-location" className="h-10 text-xs sm:h-9">
                <SelectValue placeholder="Semua Kebun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kebun</SelectItem>
                {options.locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 lg:w-40">
            <label
              htmlFor="filter-status"
              className="text-xs font-medium text-foreground block"
            >
              Status Proyek
            </label>
            <Select
              value={filters.status}
              onValueChange={(val) => updateField("status", val)}
            >
              <SelectTrigger id="filter-status" className="h-10 text-xs sm:h-9">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Planned">Direncanakan</SelectItem>
                <SelectItem value="In Progress">Berjalan</SelectItem>
                <SelectItem value="On Hold">Ditunda</SelectItem>
                <SelectItem value="Completed">Selesai</SelectItem>
                <SelectItem value="Cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 lg:w-44">
            <label
              htmlFor="filter-ews"
              className="text-xs font-medium text-foreground block"
            >
              Status EWS / Jadwal
            </label>
            <Select
              value={filters.ewsStatus}
              onValueChange={(val) => updateField("ewsStatus", val)}
            >
              <SelectTrigger id="filter-ews" className="h-10 text-xs sm:h-9">
                <SelectValue placeholder="Semua Kondisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kondisi</SelectItem>
                <SelectItem value="delayed">Perlu Perhatian (EWS / Terlambat)</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Warning">Peringatan (Warning)</SelectItem>
                <SelectItem value="Critical">Kritis (Critical)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tombol Filter Lanjutan & Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced((prev) => !prev)}
            aria-expanded={showAdvanced}
            className="h-10 sm:h-9 gap-1.5 text-xs flex-1 sm:flex-none"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Filter Lanjutan</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-150",
                showAdvanced && "rotate-180"
              )}
              aria-hidden="true"
            />
          </Button>

          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-10 sm:h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset ({activeFilterCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Baris Filter Lanjutan */}
      {showAdvanced && (
        <div className="grid grid-cols-1 gap-2.5 border-t pt-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5">
            <label
              htmlFor="filter-region"
              className="text-xs font-medium text-foreground block"
            >
              Region
            </label>
            <Select
              value={filters.regionName}
              onValueChange={(val) => updateField("regionName", val)}
            >
              <SelectTrigger id="filter-region" className="h-10 text-xs sm:h-9">
                <SelectValue placeholder="Semua Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Region</SelectItem>
                {options.regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="filter-company"
              className="text-xs font-medium text-foreground block"
            >
              Perusahaan
            </label>
            <Select
              value={filters.companyName}
              onValueChange={(val) => updateField("companyName", val)}
            >
              <SelectTrigger id="filter-company" className="h-10 text-xs sm:h-9">
                <SelectValue placeholder="Semua Perusahaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Perusahaan</SelectItem>
                {options.companies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="filter-category"
              className="text-xs font-medium text-foreground block"
            >
              Kategori Proyek
            </label>
            <Select
              value={filters.categoryName}
              onValueChange={(val) => updateField("categoryName", val)}
            >
              <SelectTrigger id="filter-category" className="h-10 text-xs sm:h-9">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {options.categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="filter-pic"
              className="text-xs font-medium text-foreground block"
            >
              PIC Proyek
            </label>
            <Select
              value={filters.picName}
              onValueChange={(val) => updateField("picName", val)}
            >
              <SelectTrigger id="filter-pic" className="h-10 text-xs sm:h-9">
                <SelectValue placeholder="Semua PIC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua PIC</SelectItem>
                {options.pics.map((pic) => (
                  <SelectItem key={pic} value={pic}>
                    {pic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="filter-date-from"
              className="text-xs font-medium text-foreground block"
            >
              Target Selesai (Dari)
            </label>
            <Input
              id="filter-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateField("dateFrom", e.target.value)}
              className="h-10 text-xs sm:h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="filter-date-to"
              className="text-xs font-medium text-foreground block"
            >
              Target Selesai (Sampai)
            </label>
            <Input
              id="filter-date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateField("dateTo", e.target.value)}
              className="h-10 text-xs sm:h-9"
            />
          </div>
        </div>
      )}

      {/* Status Cakupan Data */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Menampilkan <strong className="text-foreground">{filteredCount}</strong> dari{" "}
            <strong className="text-foreground">{totalCount}</strong> proyek aktif
          </span>
        </div>
        {activeFilterCount > 0 && (
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            {activeFilterCount} kriteria filter aktif (diterapkan ke grafik, tabel, dan ekspor)
          </span>
        )}
      </div>
    </section>
  );
}
