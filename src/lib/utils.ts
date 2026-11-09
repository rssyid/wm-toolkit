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

export function getStatusSemanticClass(status: string): {
  badge: string;
  dot: string;
  label: string;
} {
  const s = status.toLowerCase();
  if (s.includes("in progress") || s.includes("berjalan") || s.includes("released")) {
    return {
      badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      dot: "bg-blue-500",
      label: status,
    };
  }
  if (s.includes("completed") || s.includes("selesai") || s.includes("approved") || s.includes("received") && !s.includes("partially")) {
    return {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      dot: "bg-emerald-500",
      label: status,
    };
  }
  if (s.includes("on hold") || s.includes("tertunda") || s.includes("partially received")) {
    return {
      badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      dot: "bg-amber-500",
      label: status,
    };
  }
  if (s.includes("pending") || s.includes("menunggu")) {
    return {
      badge: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
      dot: "bg-yellow-500",
      label: status,
    };
  }
  if (s.includes("cancel") || s.includes("reject") || s.includes("batal") || s.includes("tolak") || s.includes("delayed") || s.includes("kritis")) {
    return {
      badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
      dot: "bg-rose-500",
      label: status,
    };
  }
  // Planned / Draft / Default
  return {
    badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
    label: status,
  };
}
