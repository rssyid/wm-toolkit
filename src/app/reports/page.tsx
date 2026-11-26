"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FolderGit2,
  Printer,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatWibTime } from "@/lib/utils";
import {
  buildPortfolioReportRows,
  computeLocationBreakdown,
  computePortfolioSummary,
  DEFAULT_PORTFOLIO_FILTER,
  describeActiveFilters,
  extractPortfolioFilterOptions,
  type PortfolioReportFilter,
} from "@/lib/report-portfolio-utils";
import {
  exportPortfolioToCsv,
  exportPortfolioToExcel,
} from "@/lib/report-export-utils";
import { PortfolioFilterBar } from "@/components/reports/portfolio-filter-bar";
import { PortfolioExecutiveSummary } from "@/components/reports/portfolio-executive-summary";
import { PortfolioCharts } from "@/components/reports/portfolio-charts";
import { PortfolioDetailTable } from "@/components/reports/portfolio-detail-table";

function ReportsPageContent() {
  const {
    isLoading,
    loadError,
    projects,
    pos,
    spkContracts,
    userProfile,
    activeRole,
  } = useAppState();

  const [filters, setFilters] = useState<PortfolioReportFilter>(
    DEFAULT_PORTFOLIO_FILTER
  );
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const activeProjectsCount = useMemo(
    () => projects.filter((p) => !p.deletedAt).length,
    [projects]
  );

  const filterOptions = useMemo(
    () => extractPortfolioFilterOptions(projects),
    [projects]
  );

  const reportRows = useMemo(
    () => buildPortfolioReportRows(projects, pos, spkContracts, filters),
    [projects, pos, spkContracts, filters]
  );

  const summary = useMemo(
    () => computePortfolioSummary(reportRows),
    [reportRows]
  );

  const locationBreakdown = useMemo(
    () => computeLocationBreakdown(reportRows),
    [reportRows]
  );

  const activeFilterLabels = useMemo(
    () => describeActiveFilters(filters),
    [filters]
  );

  const now = new Date();
  const generatedByName = userProfile?.fullName || "Pengguna WM-Toolkit";

  const handleExportExcel = () => {
    if (reportRows.length === 0) {
      toast.error("Tidak ada data proyek untuk diekspor ke Excel.");
      return;
    }
    try {
      setIsExportingExcel(true);
      const fileName = exportPortfolioToExcel(
        reportRows,
        summary,
        locationBreakdown,
        {
          generatedBy: generatedByName,
          generatedRole: activeRole,
          generatedAt: new Date(),
          filterLabels: activeFilterLabels,
        }
      );
      toast.success(`Berhasil mengunduh ${fileName}`);
    } catch (err) {
      console.error("Gagal ekspor Excel:", err);
      toast.error("Gagal membuat file Excel. Silakan coba lagi.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportCsv = () => {
    if (reportRows.length === 0) {
      toast.error("Tidak ada data proyek untuk diekspor ke CSV.");
      return;
    }
    try {
      const fileName = exportPortfolioToCsv(reportRows, new Date());
      toast.success(`Berhasil mengunduh ${fileName}`);
    } catch (err) {
      console.error("Gagal ekspor CSV:", err);
      toast.error("Gagal membuat file CSV. Silakan coba lagi.");
    }
  };

  const handlePrintPdf = () => {
    if (reportRows.length === 0) {
      toast.error("Tidak ada data proyek untuk dicetak.");
      return;
    }
    window.print();
  };

  const handleToggleDelayedFilter = () => {
    setFilters((prev) => ({
      ...prev,
      ewsStatus: prev.ewsStatus === "delayed" ? "all" : "delayed",
    }));
  };

  if (isLoading) {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-live="polite"
        aria-label="Memuat data laporan portofolio"
      >
        <div className="h-8 w-72 rounded bg-muted animate-pulse" />
        <div className="h-24 w-full rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 h-44 rounded-lg bg-muted animate-pulse" />
          <div className="lg:col-span-5 h-44 rounded-lg bg-muted animate-pulse" />
        </div>
        <p className="text-xs text-muted-foreground">
          Memuat data laporan portofolio proyek...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-rose-300 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/30 p-6 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="h-5 w-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Gagal Memuat Data Laporan
            </h1>
            <p className="text-xs text-muted-foreground mt-1">{loadError}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Muat Ulang Halaman</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Formal Khusus Cetak / PDF */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-3 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              WM-Toolkit: Estate Technical &amp; Civil Monitoring
            </p>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Laporan Rekap Portofolio &amp; Status Proyek
            </h1>
          </div>
          <div className="text-right text-[11px] text-slate-700">
            <p>
              Tanggal Cetak: {formatIDDate(now, true)} {formatWibTime(now)} WIB
            </p>
            <p>
              Dicetak oleh: {generatedByName} ({activeRole})
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-700">
          <strong>Cakupan Filter:</strong>{" "}
          {activeFilterLabels.length > 0
            ? activeFilterLabels.join(" | ")
            : "Seluruh Proyek Aktif"}
        </p>
      </div>

      {/* Header Layar + Aksi Ekspor */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Laporan Portofolio &amp; Status Proyek
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Rekap progres fisik, peringatan jadwal (EWS), dan serapan komitmen AFCE terhadap PO Barang serta SPK Jasa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleExportExcel}
            disabled={reportRows.length === 0 || isExportingExcel}
            className="h-10 sm:h-9 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>{isExportingExcel ? "Menyiapkan..." : "Ekspor Excel (.xlsx)"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={reportRows.length === 0}
            className="h-10 sm:h-9 gap-1.5 text-xs"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Ekspor CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            disabled={reportRows.length === 0}
            className="h-10 sm:h-9 gap-1.5 text-xs"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>Cetak / PDF</span>
          </Button>
        </div>
      </header>

      {/* State Kosong 1: Belum ada proyek sama sekali di sistem */}
      {activeProjectsCount === 0 ? (
        <section className="rounded-lg border border-dashed bg-card p-8 text-center space-y-3">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <FolderGit2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-sm font-semibold text-foreground">
              Belum Ada Data Proyek untuk Dilaporkan
            </h2>
            <p className="text-xs text-muted-foreground">
              Laporan portofolio akan otomatis terisi setelah minimal satu proyek teknis dicatat di Workspace.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
          >
            <Link href="/workspace/new">Buat Proyek Pertama</Link>
          </Button>
        </section>
      ) : (
        <>
          {/* Panel Filter Multi-Dimensi */}
          <PortfolioFilterBar
            filters={filters}
            options={filterOptions}
            onChange={setFilters}
            filteredCount={reportRows.length}
            totalCount={activeProjectsCount}
          />

          {/* State Kosong 2: Filter tidak menghasilkan proyek */}
          {reportRows.length === 0 ? (
            <section className="rounded-lg border border-dashed bg-card p-8 text-center space-y-3">
              <div className="space-y-1 max-w-md mx-auto">
                <h2 className="text-sm font-semibold text-foreground">
                  Tidak Ada Proyek yang Cocok dengan Filter
                </h2>
                <p className="text-xs text-muted-foreground">
                  Kombinasi filter yang dipilih menghasilkan 0 proyek. Ubah kriteria atau reset filter untuk melihat seluruh portofolio aktif.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilters(DEFAULT_PORTFOLIO_FILTER)}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Semua Filter</span>
              </Button>
            </section>
          ) : (
            <>
              {/* Ringkasan Eksekutif */}
              <PortfolioExecutiveSummary
                summary={summary}
                isDelayedFilterActive={filters.ewsStatus === "delayed"}
                onToggleDelayedFilter={handleToggleDelayedFilter}
              />

              {/* Visualisasi Analitik */}
              <PortfolioCharts
                locationBreakdown={locationBreakdown}
                summary={summary}
              />

              {/* Tabel Detail Portofolio */}
              <PortfolioDetailTable rows={reportRows} summary={summary} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-xs text-muted-foreground">
          Memuat halaman laporan portofolio...
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
