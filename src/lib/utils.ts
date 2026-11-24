import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers into Indonesian Rupiah currency string.
 * Example: 120000000 -> "Rp 120.000.000"
 */
export function formatIDR(amount: number): string {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const ID_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const ID_MONTHS_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Format date into Indonesian standard display format.
 * Example: "2026-10-23" -> "23 Okt 2026"
 */
export function formatIDDate(dateInput: string | Date | undefined | null, fullMonth = false): string {
  if (!dateInput) return "-";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = d.getDate();
    const month = fullMonth ? ID_MONTHS_FULL[d.getMonth()] : ID_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Calculate difference in calendar days between two dates.
 */
export function calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
  try {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  } catch {
    return 0;
  }
}

/**
 * Calculate duration in weeks.
 */
export function calculateWeeksBetween(startDate: string | Date, endDate: string | Date): number {
  const days = calculateDaysBetween(startDate, endDate);
  return Math.ceil(days / 7);
}

/**
 * Determine whether a project should trigger delayed/critical EWS attention.
 */
export function isProjectDelayed(project: {
  scheduleVarianceDays?: number | null;
  ewsStatus?: string | null;
}): boolean {
  return (
    (project.scheduleVarianceDays ?? 0) > 7 ||
    project.ewsStatus === "Warning" ||
    project.ewsStatus === "Critical"
  );
}

/**
 * Format ISO timestamp into WIB time string ("HH:mm" or "HH:mm:ss").
 */
export function formatWibTime(
  dateInput: string | Date | undefined | null,
  withSeconds = false
): string {
  if (!dateInput) return "-";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      ...(withSeconds ? { second: "2-digit" } : {}),
      hour12: false,
    })
      .format(d)
      .replace(/\./g, ":");
  } catch {
    return "-";
  }
}

/**
 * Status colors map for semantic badges
 */
export type SemanticStatus =
  | "Planned"
  | "In Progress"
  | "On Hold"
  | "Completed"
  | "Cancelled"
  | "Rejected"
  | "Pending Approval"
  | "Draft"
  | "Approved"
  | "Released"
  | "Closed"
  | "Ordered"
  | "Partially Received"
  | "Received";

const STATUS_LABELS_ID: Record<string, string> = {
  planned: "Direncanakan",
  "in progress": "Berjalan",
  "on hold": "Ditunda",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
  "pending approval": "Menunggu Persetujuan",
  "needs revision": "Perlu Revisi",
  draft: "Draf",
  approved: "Disetujui",
  released: "Dirilis",
  closed: "Ditutup",
  ordered: "Dipesan",
  "partially received": "Diterima Sebagian",
  received: "Diterima Penuh",
  active: "Aktif",
  inactive: "Nonaktif",
  submitted: "Diajukan",
  pending: "Menunggu",
  recommended: "Direkomendasikan",
  not_recommended: "Tidak Direkomendasikan",
};

export function getStatusSemanticClass(status: string): {
  badge: string;
  dot: string;
  label: string;
} {
  const s = status.trim().toLowerCase();
  const displayLabel = STATUS_LABELS_ID[s] || status;

  if (s.includes("in progress") || s.includes("berjalan") || s.includes("released") || s === "submitted" || s === "ordered") {
    return {
      badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      dot: "bg-blue-500",
      label: displayLabel,
    };
  }
  if (
    (s.includes("completed") ||
      s.includes("selesai") ||
      s.includes("approved") ||
      s === "active" ||
      s === "recommended" ||
      (s.includes("received") && !s.includes("partially"))) &&
    !s.includes("not_recommended")
  ) {
    return {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      dot: "bg-emerald-500",
      label: displayLabel,
    };
  }
  if (s.includes("on hold") || s.includes("tertunda") || s.includes("partially received") || s.includes("needs revision")) {
    return {
      badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      dot: "bg-amber-500",
      label: displayLabel,
    };
  }
  if (s.includes("pending") || s.includes("menunggu")) {
    return {
      badge: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
      dot: "bg-yellow-500",
      label: displayLabel,
    };
  }
  if (s.includes("cancel") || s.includes("reject") || s.includes("not_recommended") || s.includes("batal") || s.includes("tolak") || s.includes("delayed") || s.includes("kritis")) {
    return {
      badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
      dot: "bg-rose-500",
      label: displayLabel,
    };
  }
  // Planned / Draft / Inactive / Default
  return {
    badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
    label: displayLabel,
  };
}
