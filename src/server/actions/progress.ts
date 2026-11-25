"use server";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { formatActionError } from "@/server/errors";
import { toPlainObject } from "@/server/serialize";
import { CreateDailyProgressSchema, CreateWeeklyProgressSchema } from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";
import { syncWorkItemAndProjectProgressTx } from "@/server/work-item-progress";

export async function addDailyProgressAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreateDailyProgressSchema.parse(rawInput);

    const txResult = await db.$transaction(async (tx) => {
      const log = await tx.progressLog.create({
        data: {
          projectId: parsed.projectId,
          workItemId: parsed.workItemId,
          spkId: parsed.spkId || undefined,
          periodType: "DAILY",
          logDate: new Date(parsed.date),
          activity: parsed.activity,
          targetVolume: parsed.targetVolume,
          plannedVolume: parsed.plannedVolume,
          actualVolume: parsed.actualVolume,
          remainingVolume: parsed.remainingVolume,
          cumulativeVolume: parsed.cumulativeVolume,
          unit: parsed.unit,
          progressPercent: parsed.progressPercent,
          manpower: parsed.manpower,
          weather: parsed.weather,
          notes: parsed.notes,
          photoName: parsed.photoName,
          photoUrl: parsed.photoUrl,
          createdById: user.id,
        },
        include: { project: true, workItem: true },
      });

      const newOverallProgress = await syncWorkItemAndProjectProgressTx(
        tx,
        parsed.projectId,
        parsed.workItemId,
        parsed.progressPercent
      );

      return { log, newOverallProgress };
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "PROGRESS_LOG",
      entityId: txResult.log.id,
      entityTitle: `Log Harian ${parsed.date} - ${txResult.log.workItem.name}`,
      projectId: txResult.log.projectId,
      projectName: txResult.log.project.name,
      afterData: {
        progressPercent: txResult.log.progressPercent,
        overallProgress: txResult.newOverallProgress,
      },
      notes: `Pencatatan log harian progres fisik (${parsed.progressPercent}%) oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${txResult.log.projectId}/execution`);
    revalidatePath(`/workspace/${txResult.log.projectId}`);
    revalidatePath("/dashboard");
    return {
      success: true,
      log: toPlainObject(txResult.log),
      newOverallProgress: txResult.newOverallProgress,
    };
  } catch (err: unknown) {
    console.error("Gagal mencatat progres harian:", err);
    return { success: false, error: formatActionError(err, "Gagal mencatat progres harian.") };
  }
}

export async function addWeeklyProgressAction(rawInput: unknown) {
  try {
    const user = await requireRole(["ADMIN", "PIC"]);
    const parsed = CreateWeeklyProgressSchema.parse(rawInput);

    const txResult = await db.$transaction(async (tx) => {
      const log = await tx.progressLog.create({
        data: {
          projectId: parsed.projectId,
          workItemId: parsed.workItemId,
          spkId: parsed.spkId || undefined,
          periodType: "WEEKLY",
          logDate: new Date(parsed.endDate),
          period: parsed.period,
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
          plannedProgress: parsed.plannedProgress,
          actualProgress: parsed.actualProgress,
          variance: parsed.variance,
          achievement: parsed.achievement,
          notes: parsed.notes,
          reportName: parsed.reportName,
          createdById: user.id,
        },
        include: { project: true, workItem: true },
      });

      const newOverallProgress = await syncWorkItemAndProjectProgressTx(
        tx,
        parsed.projectId,
        parsed.workItemId,
        parsed.actualProgress
      );

      return { log, newOverallProgress };
    });

    await recordServerAuditLog({
      action: "CREATE",
      entityType: "PROGRESS_LOG",
      entityId: txResult.log.id,
      entityTitle: `Laporan Mingguan ${parsed.period}`,
      projectId: txResult.log.projectId,
      projectName: txResult.log.project.name,
      afterData: {
        plannedProgress: parsed.plannedProgress,
        actualProgress: parsed.actualProgress,
        overallProgress: txResult.newOverallProgress,
      },
      notes: `Pencatatan evaluasi kurva-S mingguan (Rencana: ${parsed.plannedProgress}%, Realisasi: ${parsed.actualProgress}%) oleh ${user.name}`,
    });

    revalidatePath(`/workspace/${txResult.log.projectId}/execution`);
    revalidatePath(`/workspace/${txResult.log.projectId}`);
    revalidatePath("/dashboard");
    return {
      success: true,
      log: toPlainObject(txResult.log),
      newOverallProgress: txResult.newOverallProgress,
    };
  } catch (err: unknown) {
    console.error("Gagal mencatat laporan mingguan:", err);
    return { success: false, error: formatActionError(err, "Gagal mencatat laporan mingguan.") };
  }
}
