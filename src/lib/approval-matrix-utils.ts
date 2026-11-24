import {
  ApprovalMatrixRule,
  ApprovalLevel,
  APPROVAL_LEVEL_LABELS,
  AFCEApprovalLevelItem,
  AFCEDocument,
  AFCEStatus,
} from "@/types";

export function findMatchingApprovalTier(
  value: number,
  matrix: ApprovalMatrixRule[]
): ApprovalMatrixRule | undefined {
  if (!matrix || matrix.length === 0) return undefined;

  const activeTiers = matrix.filter((t) => t.active);
  const matchedActive = activeTiers.find(
    (t) => value >= t.minValue && value <= t.maxValue
  );
  if (matchedActive) return matchedActive;

  const matchedAny = matrix.find(
    (t) => value >= t.minValue && value <= t.maxValue
  );
  if (matchedAny) return matchedAny;

  return matrix[0];
}

export function getActiveLevelsFromTier(tier?: ApprovalMatrixRule): ApprovalLevel[] {
  if (!tier || !tier.levels) return ["WM"];
  const active = tier.levels.filter(Boolean) as ApprovalLevel[];
  return active.length > 0 ? active : ["WM"];
}

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

export function getInitialApprovalStatus(
  levels: AFCEApprovalLevelItem[],
  status: AFCEStatus
): string {
  if (status === "Approved") {
    const lastRole = levels[levels.length - 1]?.label || "Direksi";
    return `Disetujui oleh ${lastRole}`;
  }
  if (status === "Draft") {
    return "Penyusunan Draf AFCE";
  }
  if (levels.length > 0) {
    const firstRole = levels[0]?.label || "Water Management";
    return `Menunggu Persetujuan Level 1: ${firstRole}`;
  }
  return "Menunggu Pengajuan Persetujuan";
}

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

export function formatApprovalChainSummary(codes: ApprovalLevel[]): string {
  if (!codes || codes.length === 0) return "-";
  const chain = codes.join(" > ");
  return `${chain} (${codes.length} Level Wajib)`;
}
