import { db } from "@/server/db";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/**
 * Memperbarui progres serta status WorkItem dan menghitung ulang progres agregat Proyek.
 * Dipakai bersama oleh modul Progres Lapangan, Pengadaan Barang (GR/BAST), dan Jasa (SPK).
 */
export async function syncWorkItemAndProjectProgressTx(
  tx: TxClient,
  projectId: string,
  workItemId: string,
  nextWorkItemProgress: number,
  options?: {
    forceStatus?: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
    skipWorkItemUpdate?: boolean;
  }
): Promise<number> {
  if (!options?.skipWorkItemUpdate) {
    const clampedProgress = Math.max(0, Math.min(100, Math.round(nextWorkItemProgress)));
    const nextStatus =
      clampedProgress >= 100
        ? "COMPLETED"
        : clampedProgress > 0
        ? "IN_PROGRESS"
        : options?.forceStatus ?? "PLANNED";

    await tx.workItem.update({
      where: { id: workItemId },
      data: {
        progress: clampedProgress,
        status: nextStatus,
      },
    });
  }

  const [project, allWorkItems] = await Promise.all([
    tx.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    }),
    tx.workItem.findMany({
      where: { projectId },
    }),
  ]);

  const totalWeight = allWorkItems.reduce((acc, w) => acc + (w.weight || 0), 0) || 100;
  const weightedProgress = allWorkItems.reduce(
    (acc, w) => acc + (w.progress * (w.weight || 0)) / totalWeight,
    0
  );
  const overallProgress = Math.min(100, Math.round(weightedProgress));

  const hasAnyActiveItem = allWorkItems.some(
    (w) => w.status === "IN_PROGRESS" || w.status === "COMPLETED" || w.progress > 0
  );

  let nextProjectStatus = project?.status ?? "PLANNED";
  if (overallProgress >= 100) {
    nextProjectStatus = "COMPLETED";
  } else if (
    (overallProgress > 0 || hasAnyActiveItem) &&
    (nextProjectStatus === "PLANNED" || nextProjectStatus === "COMPLETED")
  ) {
    nextProjectStatus = "IN_PROGRESS";
  }

  await tx.project.update({
    where: { id: projectId },
    data: {
      progressPercent: overallProgress,
      status: nextProjectStatus,
    },
  });

  return overallProgress;
}

/**
 * Menyinkronkan progres WorkItem material berdasarkan seluruh PO aktif terkait.
 * Hanya menimpa progres bila item bertipe Material atau belum memiliki log progres fisik.
 */
export async function syncMaterialWorkItemFromPosTx(
  tx: TxClient,
  projectId: string,
  workItemId: string
): Promise<number | null> {
  const [workItem, progressLogCount, activePos] = await Promise.all([
    tx.workItem.findUnique({ where: { id: workItemId } }),
    tx.progressLog.count({ where: { workItemId } }),
    tx.purchaseOrder.findMany({
      where: {
        projectId,
        workItemId,
        deletedAt: null,
        status: { not: "CANCELLED" },
      },
      select: { status: true, receiptProgressPercent: true },
    }),
  ]);

  if (!workItem || activePos.length === 0) return null;
  if (workItem.type !== "Material" && progressLogCount > 0) return null;

  const poProgressList = activePos.map((po) =>
    po.status === "CLOSED" ? Math.max(po.receiptProgressPercent, 100) : po.receiptProgressPercent
  );
  const avgProgress = Math.round(
    poProgressList.reduce((sum, val) => sum + val, 0) / poProgressList.length
  );
  const hasReleasedOrActivePo = activePos.some(
    (po) => po.status === "RELEASED" || po.status === "CLOSED" || po.receiptProgressPercent > 0
  );

  return syncWorkItemAndProjectProgressTx(tx, projectId, workItemId, avgProgress, {
    forceStatus: hasReleasedOrActivePo ? "IN_PROGRESS" : "PLANNED",
  });
}
