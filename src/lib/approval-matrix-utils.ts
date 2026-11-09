import {
  ApprovalMatrixRule,
  ApprovalLevel,
  APPROVAL_LEVEL_LABELS,
  APPROVAL_LEVEL_ORDER,
  AFCEApprovalLevelItem,
  AFCEDocument,
  AFCEStatus,
} from "@/types";

/**
 * Mencari tier matriks persetujuan yang cocok berdasarkan nominal anggaran AFCE.
 */
export function findMatchingApprovalTier(
  value: number,
  matrix: ApprovalMatrixRule[]
): ApprovalMatrixRule | undefined {
  if (!matrix || matrix.length === 0) return undefined;

  // Prioritaskan tier yang aktif
  const activeTiers = matrix.filter((t) => t.active);
  const matchedActive = activeTiers.find(
    (t) => value >= t.minValue && value <= t.maxValue
  );
  if (matchedActive) return matchedActive;

  // Fallback ke seluruh tier jika tidak ada yang aktif pas
  const matchedAny = matrix.find(
    (t) => value >= t.minValue && value <= t.maxValue
  );
  if (matchedAny) return matchedAny;

  // Fallback ke tier pertama
  return matrix[0];
}

/**
 * Mengambil daftar kode level yang aktif (non-null) dari suatu tier matriks.
 */
export function getActiveLevelsFromTier(tier?: ApprovalMatrixRule): ApprovalLevel[] {
  if (!tier || !tier.levels) return ["WM"];
  const active = tier.levels.filter(Boolean) as ApprovalLevel[];
  return active.length > 0 ? active : ["WM"];
}

/**
 * Membangun array AFCEApprovalLevelItem lengkap untuk dokumen AFCE berdasarkan tier.
 */
export function generateMatrixLevelsFromTier(
  tier: ApprovalMatrixRule,
  afceId: string,
  initialStatus: AFCEStatus = "Pending Approval"
): AFCEApprovalLevelItem[] {
  const activeCodes = getActiveLevelsFromTier(tier);

  return activeCodes.map((code, idx) => {
    let levelStatus: "Approved" | "Pending" | "Waiting" = "Waiting";
    if (initialStatus === "Approved") {
      levelStatus = "Approved";
    } else if (initialStatus === "Pending Approval" && idx === 0) {
      levelStatus = "Pending";
    }

    const label = APPROVAL_LEVEL_LABELS[code] || code;

    return {
      id: `aml-${afceId}-${idx + 1}`,
      level: idx + 1,
      code,
      label,
      isRequired: true,
      status: levelStatus,
      approverJabatan: label,
    };
  });
}

/**
 * Menghasilkan teks deskripsi status persetujuan proyek (approvalStatus) awal.
 */
export function getInitialApprovalStatus(
  levels: AFCEApprovalLevelItem[],
  status: AFCEStatus
): string {
  if (status === "Approved") {
    const lastRole = levels[levels.length - 1]?.label || "Direksi";
    return `Approved by ${lastRole}`;
  }
  if (status === "Draft") {
    return "Draft AFCE Preparation";
  }
  if (levels.length > 0) {
    const firstRole = levels[0]?.label || "Water Management";
    return `Waiting Level 1: ${firstRole} Approval`;
  }
  return "Menunggu Pengajuan Persetujuan";
}

/**
 * Mengecek apakah level-level pada dokumen AFCE saat ini berbeda dengan konfigurasi
 * tier aktif di Master Data untuk nominal dokumen tersebut.
 */
export function isAfceLevelsOutOfSync(
  afce: AFCEDocument,
  matrix: ApprovalMatrixRule[]
): boolean {
  if (!afce) return false;
  const matchedTier = findMatchingApprovalTier(afce.value, matrix);
  if (!matchedTier) return false;

  const activeCodes = getActiveLevelsFromTier(matchedTier);
  const currentLevels = afce.approvalMatrixLevels || [];

  if (currentLevels.length !== activeCodes.length) {
    return true;
  }

  for (let i = 0; i < activeCodes.length; i++) {
    if (currentLevels[i]?.code !== activeCodes[i]) {
      return true;
    }
  }

  return false;
}

/**
 * Format ringkas rantai hierarki persetujuan, contoh: "WM → EM → GEM (3 Level)"
 */
export function formatApprovalChainSummary(codes: ApprovalLevel[]): string {
  if (!codes || codes.length === 0) return "-";
  const chain = codes.join(" → ");
  return `${chain} (${codes.length} Level Wajib)`;
}
