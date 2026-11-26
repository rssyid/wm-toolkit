import {
  DailyProgressRecord,
  GoodsHandover,
  GoodsReceipt,
  Project,
  ProjectStatus,
  PurchaseOrder,
  SPKContract,
  ScheduleGanttCell,
  ScheduleGanttGroup,
  ScheduleGanttTask,
  WeeklyProgressRecord,
  WorkItem,
} from "@/types";

export interface WeekColumn {
  index: number;
  key: string; // Contoh: "W1", "W2"
  label: string;
  dateLabel: string; // Contoh: "25/08"
  monthLabel: string; // Contoh: "Agu 2026"
  startDate: Date;
  endDate: Date;
  isCurrentWeek: boolean;
}

export interface MonthSpan {
  label: string;
  colSpan: number;
}

export interface BuildScheduleMatrixInput {
  project: Project;
  weeks: WeekColumn[];
  today: Date;
  dailyProgress?: DailyProgressRecord[];
  weeklyProgress?: WeeklyProgressRecord[];
  pos?: PurchaseOrder[];
  grs?: GoodsReceipt[];
  goodsHandovers?: GoodsHandover[];
  spkContracts?: SPKContract[];
}

const ID_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const PHASE_META: Record<string, { number: number; title: string }> = {
  Tender: { number: 1, title: "Pekerjaan Persiapan & Pengadaan" },
  "Physical Execution": { number: 2, title: "Pelaksanaan Pekerjaan Fisik" },
  "Supporting Materials": { number: 3, title: "Pengadaan Material Penunjang" },
};

/**
 * Mengurai string tanggal ISO ("YYYY-MM-DD" atau timestamp) ke tanggal lokal pukul 00:00:00
 * agar perbandingan antar-hari tidak bergeser akibat zona waktu UTC+7.
 */
export function parseLocalDate(dateInput: string | Date | undefined | null): Date {
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  if (!dateInput) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const match = String(dateInput).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return new Date(year, month, day);
  }
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function tryParseLocalDate(dateInput: string | Date | undefined | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) return null;
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  const raw = String(dateInput).trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function getLatestDate(dates: (string | Date | undefined | null)[]): Date | null {
  let latest: Date | null = null;
  for (const raw of dates) {
    const parsed = tryParseLocalDate(raw);
    if (parsed && (!latest || parsed.getTime() > latest.getTime())) {
      latest = parsed;
    }
  }
  return latest;
}

export function formatShortIdDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "-";
  const d = parseLocalDate(dateInput);
  return `${String(d.getDate()).padStart(2, "0")}-${ID_MONTHS[d.getMonth()]}`;
}

/**
 * Menghitung kolom mingguan (W1..WN) mulai dari tanggal awal paling awal (proyek/WBS/realisasi)
 * hingga tanggal akhir terjauh (baseline, target revisi, item pekerjaan WBS, atau realisasi aktual).
 */
export function calculateDynamicWeekColumns(
  project: Project,
  today: Date,
  extraDates?: (string | Date | undefined | null)[]
): WeekColumn[] {
  const candidateStarts: Date[] = [];
  const candidateEnds: Date[] = [];

  if (project.baselineStartDate) candidateStarts.push(parseLocalDate(project.baselineStartDate));
  if (project.baselineEndDate) candidateEnds.push(parseLocalDate(project.baselineEndDate));
  if (project.targetEndDate) candidateEnds.push(parseLocalDate(project.targetEndDate));

  for (const wi of project.workItems || []) {
    if (wi.startDate) candidateStarts.push(parseLocalDate(wi.startDate));
    if (wi.endDate) candidateEnds.push(parseLocalDate(wi.endDate));
  }

  for (const rawDate of extraDates || []) {
    const parsed = tryParseLocalDate(rawDate);
    if (parsed) {
      candidateStarts.push(parsed);
      candidateEnds.push(parsed);
    }
  }

  const start =
    candidateStarts.length > 0
      ? new Date(Math.min(...candidateStarts.map((d) => d.getTime())))
      : parseLocalDate(today);

  const fallbackEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 16 * 7 - 1);
  const end =
    candidateEnds.length > 0
      ? new Date(Math.max(...candidateEnds.map((d) => d.getTime())))
      : fallbackEnd;

  const result: WeekColumn[] = [];
  const currentStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let index = 1;

  while (currentStart <= end || index <= 16) {
    const currentEnd = new Date(
      currentStart.getFullYear(),
      currentStart.getMonth(),
      currentStart.getDate() + 6
    );

    const day = String(currentStart.getDate()).padStart(2, "0");
    const month = String(currentStart.getMonth() + 1).padStart(2, "0");
    const isCurrentWeek = today >= currentStart && today <= currentEnd;

    result.push({
      index,
      key: `W${index}`,
      label: `W${index}`,
      dateLabel: `${day}/${month}`,
      monthLabel: `${ID_MONTHS[currentStart.getMonth()]} ${currentStart.getFullYear()}`,
      startDate: new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate()),
      endDate: currentEnd,
      isCurrentWeek,
    });

    currentStart.setDate(currentStart.getDate() + 7);
    index++;

    // Batas aman 104 minggu (2 tahun) agar tidak terjadi loop tak terbatas
    if (index > 104) break;
  }

  return result;
}

export function groupWeeksByMonth(weeks: WeekColumn[]): MonthSpan[] {
  const groups: MonthSpan[] = [];
  for (const w of weeks) {
    const last = groups[groups.length - 1];
    if (last && last.label === w.monthLabel) {
      last.colSpan++;
    } else {
      groups.push({ label: w.monthLabel, colSpan: 1 });
    }
  }
  return groups;
}

function normalizeSymbol(symbol: unknown): "#" | "DONE" | null {
  if (symbol === "#") return "#";
  if (symbol === "DONE" || symbol === "\u2713") return "DONE";
  return null;
}

function resolveEffectiveWorkItemState(
  item: WorkItem,
  dailyLogs: DailyProgressRecord[],
  weeklyLogs: WeeklyProgressRecord[],
  linkedPos: PurchaseOrder[],
  linkedGrs: GoodsReceipt[],
  linkedHandovers: GoodsHandover[],
  linkedSpks: SPKContract[]
): {
  status: ProjectStatus;
  progress: number;
  sourceHint: string;
} {
  let progress = Math.max(0, Math.min(100, Math.round(item.progress || 0)));
  let status: ProjectStatus = item.status || "Planned";
  const hints: string[] = [];

  // 1. Cek realisasi dari Jalur Pengadaan Barang (PO, GR, dan BAST)
  const activePos = linkedPos.filter((p) => !p.deletedAt && p.status !== "Cancelled");
  if (activePos.length > 0) {
    const poIds = new Set(activePos.map((p) => p.id));
    const completedHandovers = linkedHandovers.filter(
      (gh) => poIds.has(gh.poId) && gh.status === "COMPLETED"
    );
    const completedHandover = completedHandovers.length > 0;
    const poProgressAvg = Math.round(
      activePos.reduce(
        (sum, po) =>
          sum + (po.status === "Closed" ? Math.max(po.receiptProgressPercent, 100) : po.receiptProgressPercent),
        0
      ) / activePos.length
    );

    if (completedHandover || poProgressAvg >= 100) {
      if (item.type === "Material" || progress === 0) {
        progress = 100;
        status = "Completed";
      }
      const latestHandoverDate = getLatestDate(completedHandovers.map((gh) => gh.handoverDate));
      const latestGrDate = getLatestDate(linkedGrs.map((g) => g.receiptDate));
      if (latestHandoverDate) {
        hints.push(`BAST Tuntas 100% (${formatShortIdDate(latestHandoverDate)})`);
      } else if (latestGrDate) {
        hints.push(`GR Tuntas 100% (${formatShortIdDate(latestGrDate)})`);
      } else {
        hints.push("PO/BAST Tuntas 100%");
      }
    } else if (activePos.some((p) => p.status === "Released" || p.receiptProgressPercent > 0)) {
      if (item.type === "Material" || progress === 0) {
        progress = Math.max(progress, poProgressAvg);
      }
      if (status === "Planned") {
        status = "In Progress";
      }
      hints.push(
        poProgressAvg > 0 ? `Penerimaan PO ${poProgressAvg}%` : "PO Dirilis"
      );
    }
  }

  // 2. Cek realisasi dari Jalur Jasa (SPK aktif/ditutup)
  const activeSpks = linkedSpks.filter((s) => !s.deletedAt);
  if (activeSpks.length > 0) {
    const hasClosedSpk = activeSpks.some((s) => s.status === "CLOSED");
    const hasActiveSpk = activeSpks.some((s) => s.status === "ACTIVE");
    if (hasClosedSpk && progress === 0 && dailyLogs.length === 0 && weeklyLogs.length === 0) {
      progress = 100;
      status = "Completed";
      hints.push("SPK Selesai");
    } else if (hasActiveSpk) {
      const spkNumber = activeSpks.find((s) => s.status === "ACTIVE")?.spkNumber || "";
      const hasProgressInput =
        progress > 0 || dailyLogs.length > 0 || weeklyLogs.length > 0;
      hints.push(
        hasProgressInput
          ? `SPK Aktif (${spkNumber})`.trim()
          : `SPK Aktif (${spkNumber}) - Belum ada progres`.trim()
      );
    }
  }

  // 3. Cek realisasi dari Log Progres Harian / Mingguan
  if (dailyLogs.length > 0 || weeklyLogs.length > 0) {
    const maxDaily = dailyLogs.reduce((m, d) => Math.max(m, d.progressPercent || 0), 0);
    const maxWeekly = weeklyLogs.reduce((m, w) => Math.max(m, w.actualProgress || 0), 0);
    const hasVolume = dailyLogs.some((d) => (d.actualVolume || 0) > 0);
    progress = Math.max(progress, Math.round(Math.max(maxDaily, maxWeekly)));
    if (progress >= 100) {
      status = "Completed";
    } else if ((progress > 0 || hasVolume) && status === "Planned") {
      status = "In Progress";
    }
    hints.push(`${dailyLogs.length + weeklyLogs.length} Log Progres`);
  }

  if (progress >= 100) {
    status = "Completed";
  } else if (progress > 0 && status === "Planned") {
    status = "In Progress";
  }

  return {
    status,
    progress,
    sourceHint: hints.join(" | "),
  };
}

function mapWeeklyLogToWeeks(
  startDate: Date,
  endDate: Date,
  weeks: WeekColumn[]
): WeekColumn[] {
  const rangeStart = startDate <= endDate ? startDate : endDate;
  const rangeEnd = startDate <= endDate ? endDate : startDate;
  const msPerDay = 24 * 60 * 60 * 1000;
  const spanDays = Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / msPerDay) + 1;

  const overlapping = weeks.filter((w) => rangeStart <= w.endDate && rangeEnd >= w.startDate);
  if (overlapping.length === 0) return [];
  if (spanDays > 7) return overlapping;

  let bestWeek = overlapping[0];
  let bestOverlapDays = -1;
  for (const w of overlapping) {
    const overlapStart = Math.max(rangeStart.getTime(), w.startDate.getTime());
    const overlapEnd = Math.min(rangeEnd.getTime(), w.endDate.getTime());
    const overlapDays = Math.floor((overlapEnd - overlapStart) / msPerDay) + 1;
    const containsEndDate = rangeEnd >= w.startDate && rangeEnd <= w.endDate;
    if (
      overlapDays > bestOverlapDays ||
      (overlapDays === bestOverlapDays && containsEndDate)
    ) {
      bestOverlapDays = overlapDays;
      bestWeek = w;
    }
  }
  return [bestWeek];
}

function buildManualOverrideLookup(savedGroups?: ScheduleGanttGroup[]) {
  const byWorkItemId = new Map<string, ScheduleGanttTask>();
  const byNormalizedName = new Map<string, ScheduleGanttTask>();

  for (const grp of savedGroups || []) {
    for (const task of grp.tasks || []) {
      const cleanId = task.workItemId || (task.id.startsWith("gen-") ? task.id.slice(4) : task.id);
      byWorkItemId.set(cleanId, task);
      byWorkItemId.set(task.id, task);
      byNormalizedName.set(task.name.trim().toLowerCase(), task);
    }
  }

  return { byWorkItemId, byNormalizedName };
}

/**
 * Membangun matriks Gantt terpadu yang selalu tersinkronisasi dengan WorkItem,
 * ProgressLog, PO/GR/BAST, SPK, serta Revisi Jadwal, sambil tetap mempertahankan
 * edit sel manual yang disimpan pada project.scheduleMatrix.
 */
export function buildMergedScheduleMatrix({
  project,
  weeks,
  today,
  dailyProgress = [],
  weeklyProgress = [],
  pos = [],
  grs = [],
  goodsHandovers = [],
  spkContracts = [],
}: BuildScheduleMatrixInput): ScheduleGanttGroup[] {
  const workItems = project.workItems || [];
  if (workItems.length === 0) {
    return project.scheduleMatrix || [];
  }

  const baselineEnd = parseLocalDate(project.baselineEndDate);
  const revisions = project.revisions || [];
  const firstRevisionEnd =
    revisions.length > 0 ? parseLocalDate(revisions[0].newEndDate) : baselineEnd;
  const currentWeek = weeks.find((w) => w.isCurrentWeek);

  const manualLookup = buildManualOverrideLookup(project.scheduleMatrix);

  const groupedMap = new Map<string, WorkItem[]>();
  for (const wi of workItems) {
    const phaseKey = wi.phase || "Physical Execution";
    const list = groupedMap.get(phaseKey) || [];
    list.push(wi);
    groupedMap.set(phaseKey, list);
  }

  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const result: ScheduleGanttGroup[] = [];
  let groupCounter = 1;

  groupedMap.forEach((items, phaseKey) => {
    const meta = PHASE_META[phaseKey] || {
      number: groupCounter,
      title: phaseKey,
    };

    const tasks: ScheduleGanttTask[] = items.map((item, itemIdx) => {
      const code = alphabet[itemIdx % alphabet.length];
      const startD = parseLocalDate(item.startDate || project.baselineStartDate);
      const endD = parseLocalDate(item.endDate || project.targetEndDate);

      const itemDailyLogs = dailyProgress.filter(
        (d) => d.projectId === project.id && d.workItemId === item.id
      );
      const itemWeeklyLogs = weeklyProgress.filter(
        (w) => w.projectId === project.id && w.workItemId === item.id
      );
      const itemPos = pos.filter((p) => p.projectId === project.id && p.workItemId === item.id);
      const activeItemPos = itemPos.filter((p) => !p.deletedAt && p.status !== "Cancelled");
      const itemPoIds = new Set(activeItemPos.map((p) => p.id));
      const itemGrs = grs.filter((g) => itemPoIds.has(g.poId));
      const itemCompletedHandovers = goodsHandovers.filter(
        (gh) => itemPoIds.has(gh.poId) && gh.status === "COMPLETED"
      );
      const itemSpks = spkContracts.filter(
        (s) => s.projectId === project.id && s.workItemId === item.id
      );

      const effective = resolveEffectiveWorkItemState(
        item,
        itemDailyLogs,
        itemWeeklyLogs,
        itemPos,
        itemGrs,
        goodsHandovers,
        itemSpks
      );

      // Cari minggu di mana ada log progres atau realisasi pengadaan (PO, GR, BAST)
      const loggedWeekIndices = new Set<number>();
      let latestLoggedWeekIndex = -1;

      const findWeekForDate = (
        rawDate: string | Date | undefined | null
      ): WeekColumn | undefined => {
        const parsed = tryParseLocalDate(rawDate);
        if (!parsed) return undefined;
        return weeks.find((w) => parsed >= w.startDate && parsed <= w.endDate);
      };

      const recordRealizationWeek = (rawDate: string | Date | undefined | null) => {
        const matched = findWeekForDate(rawDate);
        if (matched) {
          loggedWeekIndices.add(matched.index);
          latestLoggedWeekIndex = Math.max(latestLoggedWeekIndex, matched.index);
        }
      };

      for (const dp of itemDailyLogs) {
        recordRealizationWeek(dp.date);
      }

      for (const wp of itemWeeklyLogs) {
        const ws = parseLocalDate(wp.startDate || wp.endDate);
        const we = parseLocalDate(wp.endDate || wp.startDate);
        const matchedWeeks = mapWeeklyLogToWeeks(ws, we, weeks);
        for (const w of matchedWeeks) {
          loggedWeekIndices.add(w.index);
          latestLoggedWeekIndex = Math.max(latestLoggedWeekIndex, w.index);
        }
      }

      for (const po of activeItemPos) {
        if (po.status === "Released" || po.status === "Closed" || po.receiptProgressPercent > 0) {
          recordRealizationWeek(po.releaseDate || po.poDate);
        }
      }

      for (const gr of itemGrs) {
        recordRealizationWeek(gr.receiptDate);
      }

      for (const gh of itemCompletedHandovers) {
        recordRealizationWeek(gh.handoverDate);
      }

      const activeWeeks = weeks.filter((w) => startD <= w.endDate && endD >= w.startDate);
      const cells: Record<string, ScheduleGanttCell> = {};

      // Tentukan warna dasar sel untuk minggu yang tercover jadwal rencana/revisi
      for (const w of activeWeeks) {
        let cellType: ScheduleGanttCell["type"] = "plan";
        if (w.startDate > baselineEnd) {
          cellType =
            revisions.length > 1 && w.startDate > firstRevisionEnd
              ? "extended-revised"
              : "revised";
        }
        cells[w.key] = {
          type: cellType,
          symbol: null,
          note: item.notes,
        };
      }

      // Terapkan simbol sesuai realisasi aktual:
      // - Item selesai (100%): minggu aktivitas sebelumnya "#", minggu realisasi selesai "DONE" (Check)
      //   Prioritas tanggal selesai pengadaan barang: BAST COMPLETED -> GR terakhir -> log/PO -> fallback akhir rencana.
      // - Item berjalan (In Progress):
      //   * Bila sudah ada log progres / aktivitas PO / GR, "#" hanya muncul pada minggu realisasi tersebut.
      //   * Bila tanpa tanggal realisasi, tandai minggu aktif berjalan.
      if (effective.status === "Completed") {
        const fallbackLastWeek =
          activeWeeks[activeWeeks.length - 1] || currentWeek || weeks[weeks.length - 1];
        const latestHandoverWeek = findWeekForDate(
          getLatestDate(itemCompletedHandovers.map((gh) => gh.handoverDate))
        );
        const latestGrWeek = findWeekForDate(
          getLatestDate(itemGrs.map((g) => g.receiptDate))
        );
        const latestLogWeek =
          latestLoggedWeekIndex > 0
            ? weeks.find((w) => w.index === latestLoggedWeekIndex)
            : undefined;
        const hasPhysicalLogs = itemDailyLogs.length > 0 || itemWeeklyLogs.length > 0;
        const completionWeek =
          (item.type === "Material" || !hasPhysicalLogs
            ? latestHandoverWeek || latestGrWeek || latestLogWeek
            : latestLogWeek || latestHandoverWeek || latestGrWeek) || fallbackLastWeek;

        if (completionWeek) {
          if (loggedWeekIndices.size > 0) {
            for (const loggedIdx of loggedWeekIndices) {
              if (loggedIdx < completionWeek.index) {
                const loggedWeek = weeks.find((w) => w.index === loggedIdx);
                if (loggedWeek) {
                  cells[loggedWeek.key] = {
                    type: cells[loggedWeek.key]?.type || "empty",
                    symbol: "#",
                    note: cells[loggedWeek.key]?.note || item.notes,
                  };
                }
              }
            }
          } else {
            for (const w of activeWeeks) {
              if (w.index < completionWeek.index) {
                cells[w.key] = { ...cells[w.key], symbol: "#" };
              }
            }
          }
          cells[completionWeek.key] = {
            type: cells[completionWeek.key]?.type || "empty",
            symbol: "DONE",
            note: cells[completionWeek.key]?.note || item.notes,
          };
        }
      } else if (effective.status === "In Progress") {
        let markedAny = false;
        if (loggedWeekIndices.size > 0) {
          for (const loggedIdx of loggedWeekIndices) {
            const loggedWeek = weeks.find((w) => w.index === loggedIdx);
            if (loggedWeek) {
              cells[loggedWeek.key] = {
                type: cells[loggedWeek.key]?.type || "empty",
                symbol: "#",
                note: cells[loggedWeek.key]?.note || item.notes,
              };
              markedAny = true;
            }
          }
        } else {
          for (const w of activeWeeks) {
            if (w.endDate < today || w.isCurrentWeek) {
              cells[w.key] = { ...cells[w.key], symbol: "#" };
              markedAny = true;
            }
          }
        }
        if (!markedAny) {
          const anchorWeek =
            (currentWeek && activeWeeks.some((w) => w.key === currentWeek.key)
              ? currentWeek
              : undefined) ||
            currentWeek ||
            activeWeeks[0] ||
            weeks[0];
          if (anchorWeek) {
            cells[anchorWeek.key] = {
              type: cells[anchorWeek.key]?.type || "empty",
              symbol: "#",
              note: cells[anchorWeek.key]?.note || item.notes,
            };
          }
        }
      }

      // Gabungkan override manual yang tersimpan pada project.scheduleMatrix
      const savedTask =
        manualLookup.byWorkItemId.get(item.id) ||
        manualLookup.byWorkItemId.get(`gen-${item.id}`) ||
        manualLookup.byNormalizedName.get(item.name.trim().toLowerCase());

      if (savedTask?.cells) {
        for (const [weekKey, savedCell] of Object.entries(savedTask.cells)) {
          if (!savedCell) continue;
          const normalizedSym = normalizeSymbol(savedCell.symbol);
          if (savedCell.manual) {
            if (savedCell.type === "empty" && !normalizedSym && !savedCell.note) {
              delete cells[weekKey];
            } else {
              cells[weekKey] = {
                type: savedCell.type,
                symbol: normalizedSym,
                note: savedCell.note,
                manual: true,
              };
            }
          } else {
            // Kompatibilitas data lama sebelum flag `manual` diperkenalkan:
            // pertahankan tipe revisi dan catatan saja tanpa memunculkan ulang simbol lama yang sudah usang.
            const autoCell = cells[weekKey];
            const mergedSymbol = autoCell?.symbol ?? null;
            const mergedType =
              savedCell.type === "revised" || savedCell.type === "extended-revised"
                ? savedCell.type
                : autoCell?.type || "empty";

            if (mergedType !== "empty" || mergedSymbol || savedCell.note) {
              cells[weekKey] = {
                type: mergedType,
                symbol: mergedSymbol,
                note: savedCell.note || autoCell?.note,
              };
            }
          }
        }
      }

      return {
        id: `gen-${item.id}`,
        workItemId: item.id,
        code,
        name: item.name,
        planStartDate: formatShortIdDate(startD),
        planEndDate: formatShortIdDate(endD),
        status: effective.status,
        progress: effective.progress,
        sourceHint: effective.sourceHint || undefined,
        cells,
      };
    });

    result.push({
      id: `gen-grp-${meta.number}`,
      number: meta.number,
      title: meta.title,
      tasks,
    });

    groupCounter++;
  });

  return result.sort((a, b) => a.number - b.number);
}
