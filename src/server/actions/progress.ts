"use server";

import { db } from "@/server/db";
import { requireAuth, requireRole } from "@/server/auth-guard";
import { recordServerAuditLog } from "@/server/audit";
import { CreateDailyProgressSchema, CreateWeeklyProgressSchema } from "@/server/schemas";
import { safeRevalidatePath as revalidatePath } from "@/server/revalidate";

export async function addDailyProgressAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateDailyProgressSchema.parse(rawInput);

  const log = await db.progressLog.create({
    data: {
      projectId: parsed.projectId,
      workItemId: parsed.workItemId,
      spkId: parsed.spkId,
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

  // Automatically update WorkItem progress in DB
  await db.workItem.update({
    where: { id: parsed.workItemId },
    data: {
      progress: parsed.progressPercent,
      status: parsed.progressPercent >= 100 ? "COMPLETED" : "IN_PROGRESS",
    },
  });

  // Calculate and update overall Project progress
  const allWorkItems = await db.workItem.findMany({
    where: { projectId: parsed.projectId },
  });
  const totalWeight = allWorkItems.reduce((acc, w) => acc + (w.weight || 0), 0) || 100;
  const weightedProgress = allWorkItems.reduce(
    (acc, w) => acc + (w.progress * (w.weight || 0)) / totalWeight,
    0
  );

  await db.project.update({
    where: { id: parsed.projectId },
    data: {
      progressPercent: Math.round(weightedProgress),
      status: weightedProgress >= 100 ? "COMPLETED" : "IN_PROGRESS",
    },
  });

  await recordServerAuditLog({
    action: "CREATE",
    entityType: "PROGRESS_LOG",
    entityId: log.id,
    entityTitle: `Log Harian ${parsed.date} - ${log.workItem.name}`,
    projectId: log.projectId,
    projectName: log.project.name,
    afterData: log,
    notes: `Pencatatan log harian progres fisik (${parsed.progressPercent}%) oleh ${user.name}`,
  });

  revalidatePath(`/workspace/${log.projectId}/execution`);
  revalidatePath(`/workspace/${log.projectId}/progress`);
  revalidatePath("/dashboard");
  return { success: true, log, newOverallProgress: Math.round(weightedProgress) };
}

export async function addWeeklyProgressAction(rawInput: any) {
  const user = await requireRole(["ADMIN", "PIC"]);
  const parsed = CreateWeeklyProgressSchema.parse(rawInput);

  const log = await db.progressLog.create({
    data: {
      projectId: parsed.projectId,
      workItemId: parsed.workItemId,
      spkId: parsed.spkId,
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

  await recordServerAuditLog({
    action: "CREATE",
    entityType: "PROGRESS_LOG",
    entityId: log.id,
    entityTitle: `Laporan Mingguan ${parsed.period}`,
    projectId: log.projectId,
    projectName: log.project.name,
    afterData: log,
    notes: `Pencatatan evaluasi kurva-S mingguan (Rencana: ${parsed.plannedProgress}%, Realisasi: ${parsed.actualProgress}%) oleh ${user.name}`,
  });

  revalidatePath(`/workspace/${log.projectId}/execution`);
  revalidatePath(`/workspace/${log.projectId}/progress`);
  revalidatePath("/dashboard");
  return { success: true, log };
}
