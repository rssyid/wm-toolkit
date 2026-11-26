"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatIDDate, formatIDR } from "@/lib/utils";
import type {
  PortfolioProjectRow,
  PortfolioSummary,
} from "@/lib/report-portfolio-utils";

type SortKey =
  | "code"
  | "locationName"
  | "progress"
  | "afceValue"
  | "totalCommittedValue"
  | "budgetAbsorptionPercent"
  | "scheduleVarianceDays";

interface PortfolioDetailTableProps {
  rows: PortfolioProjectRow[];
  summary: PortfolioSummary;
}

export function PortfolioDetailTable({
  rows,
  summary,
}: PortfolioDetailTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("afceValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "code" || key === "locationName" ? "asc" : "desc");
    }
    setPage(1);
  };

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv), "id");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedRows = sortedRows.slice(startIdx, startIdx + pageSize);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3 w-3 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
    );
  };

  const renderRowCells = (row: PortfolioProjectRow, indexNumber: number) => (
    <tr
      key={row.id}
      className="border-b last:border-b-0 hover:bg-muted/40 transition-colors"
    >
      <td className="px-3 py-2.5 text-center text-xs text-muted-foreground tabular-nums">
        {indexNumber}
      </td>
      <td className="px-3 py-2.5 min-w-[210px]">
        <Link
          href={`/workspace/${row.id}`}
          className="group inline-flex items-start gap-1 font-semibold text-xs text-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          <span className="leading-snug">{row.name}</span>
          <ExternalLink
            className="h-3 w-3 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
            aria-hidden="true"
          />
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="font-mono font-medium">{row.code}</span>
          <span>&bull;</span>
          <span>AFCE: {row.afceNumber}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs min-w-[140px]">
        <div className="font-medium text-foreground">{row.locationName}</div>
        <div className="text-[11px] text-muted-foreground">PIC: {row.picName}</div>
      </td>
      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={row.status} className="text-[10px] px-2 py-0" />
          {row.isDelayed && (
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
              <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
              <span>EWS: {row.ewsStatus}</span>
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs tabular-nums min-w-[100px]">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-semibold text-foreground">{row.progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-600 dark:bg-emerald-500"
            style={{ width: `${Math.min(100, Math.max(0, row.progress))}%` }}
          />
        </div>
      </td>
      <td className="px-3 py-2.5 text-right text-xs font-medium text-foreground tabular-nums whitespace-nowrap">
        {formatIDR(row.afceValue)}
      </td>
      <td className="px-3 py-2.5 text-right text-xs tabular-nums whitespace-nowrap">
        <div className="font-medium text-foreground">{formatIDR(row.poCommittedValue)}</div>
        <div className="text-[10px] text-muted-foreground">{row.poCount} PO</div>
      </td>
      <td className="px-3 py-2.5 text-right text-xs tabular-nums whitespace-nowrap">
        <div className="font-medium text-foreground">{formatIDR(row.spkCommittedValue)}</div>
        <div className="text-[10px] text-muted-foreground">{row.spkCount} SPK</div>
      </td>
      <td className="px-3 py-2.5 text-right text-xs tabular-nums whitespace-nowrap">
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 font-semibold",
            row.budgetAbsorptionPercent > 100
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              : row.budgetAbsorptionPercent >= 75
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-muted text-foreground"
          )}
        >
          {row.budgetAbsorptionPercent}%
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
        <div className="font-medium text-foreground tabular-nums">
          {formatIDDate(row.targetEndDate)}
        </div>
        <div
          className={cn(
            "text-[11px] tabular-nums",
            row.scheduleVarianceDays > 7
              ? "font-semibold text-rose-700 dark:text-rose-400"
              : row.scheduleVarianceDays > 0
              ? "text-amber-700 dark:text-amber-400"
              : "text-muted-foreground"
          )}
        >
          {row.scheduleVarianceDays > 0
            ? `+${row.scheduleVarianceDays} hari terlambat`
            : "Sesuai jadwal"}
        </div>
      </td>
      <td className="px-3 py-2.5 text-center text-xs text-muted-foreground tabular-nums">
        {row.revisionCount}x
      </td>
    </tr>
  );

  return (
    <section
      aria-label="Tabel detail portofolio proyek"
      className="rounded-lg border bg-card overflow-hidden"
    >
      <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Detail Rekap Portofolio Proyek
          </h2>
          <p className="text-xs text-muted-foreground">
            Klik judul kolom untuk mengurutkan data. Klik nama proyek untuk membuka detail workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden">
          <label htmlFor="report-page-size" className="whitespace-nowrap">
            Baris per halaman:
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger id="report-page-size" className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel Layar (Terpaginasi) */}
      <div className="overflow-x-auto print:hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b bg-muted/50 text-[11px] font-semibold text-muted-foreground">
              <th scope="col" className="px-3 py-2.5 text-center w-10">
                No
              </th>
              <th
                scope="col"
                aria-sort={sortKey === "code" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                className="px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => handleSort("code")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <span>Proyek &amp; AFCE</span>
                  {renderSortIcon("code")}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={sortKey === "locationName" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                className="px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => handleSort("locationName")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <span>Kebun &amp; PIC</span>
                  {renderSortIcon("locationName")}
                </button>
              </th>
              <th scope="col" className="px-3 py-2.5">
                Status &amp; EWS
              </th>
              <th
                scope="col"
                aria-sort={sortKey === "progress" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                className="px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => handleSort("progress")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <span>Progres</span>
                  {renderSortIcon("progress")}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={sortKey === "afceValue" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                className="px-3 py-2.5 text-right"
              >
                <button
                  type="button"
                  onClick={() => handleSort("afceValue")}
                  className="inline-flex items-center gap-1 hover:text-foreground ml-auto"
                >
                  <span>Nilai AFCE</span>
                  {renderSortIcon("afceValue")}
                </button>
              </th>
              <th scope="col" className="px-3 py-2.5 text-right">
                Komitmen PO
              </th>
              <th scope="col" className="px-3 py-2.5 text-right">
                Komitmen SPK
              </th>
              <th
                scope="col"
                aria-sort={
                  sortKey === "budgetAbsorptionPercent"
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-3 py-2.5 text-right"
              >
                <button
                  type="button"
                  onClick={() => handleSort("budgetAbsorptionPercent")}
                  className="inline-flex items-center gap-1 hover:text-foreground ml-auto"
                >
                  <span>Serapan</span>
                  {renderSortIcon("budgetAbsorptionPercent")}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={
                  sortKey === "scheduleVarianceDays"
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => handleSort("scheduleVarianceDays")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <span>Target &amp; Deviasi</span>
                  {renderSortIcon("scheduleVarianceDays")}
                </button>
              </th>
              <th scope="col" className="px-3 py-2.5 text-center">
                Revisi
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) =>
              renderRowCells(row, startIdx + idx + 1)
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-muted/60 text-xs font-bold text-foreground">
              <td colSpan={4} className="px-3 py-2.5">
                TOTAL / RATA-RATA ({summary.totalProjects} Proyek Terfilter)
              </td>
              <td className="px-3 py-2.5 tabular-nums">{summary.avgProgress}%</td>
              <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                {formatIDR(summary.totalAfceValue)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                {formatIDR(summary.totalPoValue)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                {formatIDR(summary.totalSpkValue)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {summary.overallAbsorptionPercent}%
              </td>
              <td className="px-3 py-2.5 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                {summary.delayedCount} EWS
              </td>
              <td className="px-3 py-2.5 text-center tabular-nums">
                {summary.totalRevisions}x
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Tabel Khusus Cetak PDF (Menampilkan Seluruh Baris Terfilter Tanpa Pagination) */}
      <div className="hidden print:block">
        <table className="w-full border-collapse text-left text-[10px]">
          <thead>
            <tr className="border-b bg-slate-100 font-semibold text-slate-800">
              <th className="px-2 py-1.5 text-center">No</th>
              <th className="px-2 py-1.5">Proyek &amp; AFCE</th>
              <th className="px-2 py-1.5">Kebun &amp; PIC</th>
              <th className="px-2 py-1.5">Status</th>
              <th className="px-2 py-1.5">Progres</th>
              <th className="px-2 py-1.5 text-right">Nilai AFCE</th>
              <th className="px-2 py-1.5 text-right">PO Barang</th>
              <th className="px-2 py-1.5 text-right">SPK Jasa</th>
              <th className="px-2 py-1.5 text-right">Serapan</th>
              <th className="px-2 py-1.5">Target &amp; Deviasi</th>
              <th className="px-2 py-1.5 text-center">Revisi</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, idx) => renderRowCells(row, idx + 1))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-slate-100 font-bold text-slate-900">
              <td colSpan={4} className="px-2 py-2">
                TOTAL / RATA-RATA ({summary.totalProjects} Proyek)
              </td>
              <td className="px-2 py-2 tabular-nums">{summary.avgProgress}%</td>
              <td className="px-2 py-2 text-right tabular-nums">
                {formatIDR(summary.totalAfceValue)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {formatIDR(summary.totalPoValue)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {formatIDR(summary.totalSpkValue)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {summary.overallAbsorptionPercent}%
              </td>
              <td className="px-2 py-2">{summary.delayedCount} EWS</td>
              <td className="px-2 py-2 text-center">{summary.totalRevisions}x</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Kontrol Pagination Layar */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <p className="text-xs text-muted-foreground">
            Menampilkan baris {startIdx + 1} sampai{" "}
            {Math.min(startIdx + pageSize, sortedRows.length)} dari {sortedRows.length} proyek
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-9 sm:h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sebelumnya</span>
            </Button>
            <span className="px-2 text-xs font-medium text-foreground tabular-nums">
              Hal {safePage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="h-9 sm:h-8 px-2.5 text-xs gap-1"
            >
              <span>Berikutnya</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
