import {
  formatIDDate,
  formatWibTime,
  getStatusSemanticClass,
} from "@/lib/utils";
import type {
  LocationBreakdownRow,
  PortfolioProjectRow,
  PortfolioSummary,
} from "@/lib/report-portfolio-utils";
import { buildXlsxBlob, triggerBlobDownload } from "@/lib/xlsx-writer";

export interface ReportExportMeta {
  generatedBy: string;
  generatedRole: string;
  generatedAt: Date;
  filterLabels: string[];
}

function formatDateStamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function exportPortfolioToExcel(
  rows: PortfolioProjectRow[],
  summary: PortfolioSummary,
  locationBreakdown: LocationBreakdownRow[],
  meta: ReportExportMeta
): string {
  const printedDate = `${formatIDDate(meta.generatedAt, true)} ${formatWibTime(meta.generatedAt)} WIB`;
  const filterText =
    meta.filterLabels.length > 0 ? meta.filterLabels.join(" | ") : "Semua Data Aktif";

  // Sheet 1: Ringkasan Eksekutif
  const summarySheetRows: Array<Array<string | number>> = [
    ["WM-TOOLKIT - LAPORAN PORTOFOLIO & STATUS PROYEK"],
    ["Dicetak pada", printedDate],
    ["Dicetak oleh", `${meta.generatedBy} (${meta.generatedRole})`],
    ["Filter Aktif", filterText],
    [],
    ["RINGKASAN EKSEKUTIF", "NILAI"],
    ["Total Proyek Terfilter", summary.totalProjects],
    ["Status: Berjalan", summary.inProgressCount],
    ["Status: Selesai", summary.completedCount],
    ["Status: Direncanakan", summary.plannedCount],
    ["Status: Ditunda", summary.onHoldCount],
    ["Status: Dibatalkan", summary.cancelledCount],
    ["Rata-rata Progres Fisik (%)", summary.avgProgress],
    ["Proyek Peringatan EWS / Terlambat", summary.delayedCount],
    ["Total Revisi Jadwal", summary.totalRevisions],
    [],
    ["RINGKASAN KOMITMEN ANGGARAN", "NOMINAL (IDR)"],
    ["Total Nilai AFCE", summary.totalAfceValue],
    ["Total Komitmen PO (Jalur Barang)", summary.totalPoValue],
    ["Total Komitmen SPK (Jalur Jasa)", summary.totalSpkValue],
    ["Total Komitmen (PO + SPK)", summary.totalCommittedValue],
    ["Sisa Plafon AFCE", summary.totalRemainingAfceValue],
    ["Rasio Serapan Anggaran (%)", summary.overallAbsorptionPercent],
  ];

  // Sheet 2: Detail Portofolio Proyek
  const detailHeaders = [
    "No",
    "Kode Proyek",
    "Nama Proyek",
    "Nomor AFCE",
    "Status AFCE",
    "Region",
    "Perusahaan",
    "Kebun / Lokasi",
    "Kategori Proyek",
    "PIC",
    "Status Proyek",
    "Status EWS",
    "Progres Fisik (%)",
    "Nilai AFCE (IDR)",
    "Komitmen PO Barang (IDR)",
    "Jumlah PO",
    "Komitmen SPK Jasa (IDR)",
    "Jumlah SPK",
    "Total Komitmen (IDR)",
    "Sisa AFCE (IDR)",
    "Serapan (%)",
    "Target Selesai",
    "Deviasi Jadwal (Hari)",
    "Jumlah Revisi Jadwal",
  ];

  const detailBody: Array<Array<string | number>> = rows.map((row, idx) => [
    idx + 1,
    row.code,
    row.name,
    row.afceNumber,
    getStatusSemanticClass(row.afceStatus).label,
    row.regionName,
    row.companyName,
    row.locationName,
    row.categoryName,
    row.picName,
    getStatusSemanticClass(row.status).label,
    row.ewsStatus,
    row.progress,
    row.afceValue,
    row.poCommittedValue,
    row.poCount,
    row.spkCommittedValue,
    row.spkCount,
    row.totalCommittedValue,
    row.remainingAfceValue,
    row.budgetAbsorptionPercent,
    formatIDDate(row.targetEndDate),
    row.scheduleVarianceDays,
    row.revisionCount,
  ]);

  const detailTotalRow: Array<string | number> = [
    "",
    "TOTAL / RATA-RATA",
    `${summary.totalProjects} Proyek`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    `${summary.delayedCount} EWS`,
    summary.avgProgress,
    summary.totalAfceValue,
    summary.totalPoValue,
    rows.reduce((sum, r) => sum + r.poCount, 0),
    summary.totalSpkValue,
    rows.reduce((sum, r) => sum + r.spkCount, 0),
    summary.totalCommittedValue,
    summary.totalRemainingAfceValue,
    summary.overallAbsorptionPercent,
    "",
    "",
    summary.totalRevisions,
  ];

  const detailAllRows = [detailHeaders, ...detailBody, detailTotalRow];

  // Sheet 3: Rekap per Kebun
  const locHeaders = [
    "No",
    "Kebun / Lokasi",
    "Jumlah Proyek",
    "Nilai AFCE (IDR)",
    "Komitmen PO (IDR)",
    "Komitmen SPK (IDR)",
    "Total Komitmen (IDR)",
    "Serapan (%)",
    "Rata-rata Progres (%)",
    "Proyek EWS / Terlambat",
  ];
  const locBody: Array<Array<string | number>> = locationBreakdown.map(
    (loc, idx) => [
      idx + 1,
      loc.locationName,
      loc.projectCount,
      loc.afceValue,
      loc.poValue,
      loc.spkValue,
      loc.totalCommittedValue,
      loc.absorptionPercent,
      loc.avgProgress,
      loc.delayedCount,
    ]
  );

  const blob = buildXlsxBlob([
    {
      name: "Ringkasan Eksekutif",
      rows: summarySheetRows,
      colWidths: [36, 44],
      boldRows: [0, 5, 16],
    },
    {
      name: "Detail Portofolio Proyek",
      rows: detailAllRows,
      colWidths: [
        5, 16, 34, 18, 18, 16, 18, 22, 20, 20, 15, 12, 14, 18, 20, 10, 20, 10,
        20, 18, 12, 15, 16, 16,
      ],
      boldRows: [0, detailAllRows.length - 1],
    },
    {
      name: "Rekap per Kebun",
      rows: [locHeaders, ...locBody],
      colWidths: [5, 26, 14, 18, 18, 18, 18, 12, 18, 18],
      boldRows: [0],
    },
  ]);

  const fileName = `Laporan-Portofolio-WM-Toolkit-${formatDateStamp(meta.generatedAt)}.xlsx`;
  triggerBlobDownload(blob, fileName);
  return fileName;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportPortfolioToCsv(
  rows: PortfolioProjectRow[],
  generatedAt: Date
): string {
  const headers = [
    "No",
    "Kode Proyek",
    "Nama Proyek",
    "Nomor AFCE",
    "Status AFCE",
    "Region",
    "Perusahaan",
    "Kebun",
    "Kategori Proyek",
    "PIC",
    "Status Proyek",
    "Status EWS",
    "Progres Fisik (%)",
    "Nilai AFCE (IDR)",
    "Komitmen PO (IDR)",
    "Komitmen SPK (IDR)",
    "Total Komitmen (IDR)",
    "Sisa AFCE (IDR)",
    "Serapan (%)",
    "Target Selesai",
    "Deviasi Jadwal (Hari)",
    "Revisi Jadwal",
  ];

  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row, idx) =>
      [
        idx + 1,
        row.code,
        row.name,
        row.afceNumber,
        getStatusSemanticClass(row.afceStatus).label,
        row.regionName,
        row.companyName,
        row.locationName,
        row.categoryName,
        row.picName,
        getStatusSemanticClass(row.status).label,
        row.ewsStatus,
        row.progress,
        row.afceValue,
        row.poCommittedValue,
        row.spkCommittedValue,
        row.totalCommittedValue,
        row.remainingAfceValue,
        row.budgetAbsorptionPercent,
        formatIDDate(row.targetEndDate),
        row.scheduleVarianceDays,
        row.revisionCount,
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ];

  const csvContent = `\uFEFF${lines.join("\r\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const fileName = `Laporan-Portofolio-WM-Toolkit-${formatDateStamp(generatedAt)}.csv`;
  triggerBlobDownload(blob, fileName);
  return fileName;
}
