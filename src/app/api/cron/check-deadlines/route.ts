import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Menjalankan pemeriksaan keterlambatan proyek, AFCE tertunda, dan pengingat tenggat waktu.
 * Dapat dipanggil oleh Vercel Cron (Bearer CRON_SECRET) atau Administrator terautentikasi.
 */
async function runDeadlineCheck() {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDaysLater = new Date(todayMidnight.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [adminUsers, notificationSettings] = await Promise.all([
    db.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true, name: true, email: true },
    }),
    db.notificationSetting.findMany(),
  ]);

  const settingMap = new Map<string, boolean>();
  for (const s of notificationSettings) {
    settingMap.set(`${s.userId}:${s.notificationType}`, s.isEnabled);
  }

  const isNotifEnabled = (userId: string, type: string) => {
    const val = settingMap.get(`${userId}:${type}`);
    return val === undefined ? true : val;
  };

  const defaultAdminId = adminUsers[0]?.id;
  let createdCount = 0;

  // 1. Proyek Terlambat (LATE_PROJECT -> kirim ke PIC + Admin sesuai WORKFLOW.md)
  const activeProjects = await db.project.findMany({
    where: {
      status: { in: ["PLANNED", "IN_PROGRESS"] },
      deletedAt: null,
    },
    select: {
      id: true,
      projectCode: true,
      name: true,
      targetEndDate: true,
      scheduleVarianceDays: true,
      ewsStatus: true,
      picId: true,
    },
  });

  for (const project of activeProjects) {
    const isOverdue = project.targetEndDate < todayMidnight;
    const isHighVariance =
      project.scheduleVarianceDays > 7 ||
      project.ewsStatus === "Warning" ||
      project.ewsStatus === "Critical";

    if (!isOverdue && !isHighVariance) continue;

    const recipients = new Set<string>();
    if (project.picId) recipients.add(project.picId);
    for (const admin of adminUsers) recipients.add(admin.id);

    const reason = isOverdue
      ? `telah melewati target selesai pada tanggal ${project.targetEndDate.toLocaleDateString("id-ID")}`
      : `mengalami deviasi keterlambatan +${project.scheduleVarianceDays} hari`;

    for (const targetUserId of recipients) {
      if (!isNotifEnabled(targetUserId, "LATE_PROJECT")) continue;

      const existing = await db.notification.findFirst({
        where: {
          userId: targetUserId,
          projectId: project.id,
          type: "LATE_PROJECT",
          isRead: false,
        },
      });

      if (!existing) {
        await db.notification.create({
          data: {
            userId: targetUserId,
            type: "LATE_PROJECT",
            title: `Peringatan Keterlambatan: ${project.name}`,
            message: `Proyek ${project.projectCode} ${reason}. Segera lakukan koordinasi teknis dan adendum waktu bila diperlukan.`,
            isRead: false,
            linkUrl: `/workspace/${project.id}/execution?tab=schedule`,
            projectId: project.id,
            projectCode: project.projectCode,
            projectName: project.name,
            priority: "critical",
          },
        });
        createdCount++;
      }
    }
  }

  // 2. Approval AFCE Tertunda (PENDING_APPROVAL -> PIC proyek)
  const pendingAfces = await db.afce.findMany({
    where: {
      status: "PENDING_APPROVAL",
      deletedAt: null,
    },
    include: {
      project: {
        select: { id: true, projectCode: true, name: true, picId: true, deletedAt: true },
      },
    },
  });

  for (const afce of pendingAfces) {
    if (!afce.project || afce.project.deletedAt) continue;
    const targetUserId = afce.project.picId || defaultAdminId;
    if (!targetUserId || !isNotifEnabled(targetUserId, "PENDING_APPROVAL")) continue;

    const existing = await db.notification.findFirst({
      where: {
        userId: targetUserId,
        projectId: afce.projectId,
        type: "PENDING_APPROVAL",
        isRead: false,
      },
    });

    if (!existing) {
      await db.notification.create({
        data: {
          userId: targetUserId,
          type: "PENDING_APPROVAL",
          title: `Approval AFCE Menunggu: ${afce.afceNumber}`,
          message: `Dokumen AFCE untuk proyek ${afce.project.name} (${afce.afceNumber}) memerlukan persetujuan pada Level ${afce.currentLevel} (${afce.currentApproverRole || "Approver"}).`,
          isRead: false,
          linkUrl: `/workspace/${afce.projectId}/afce`,
          projectId: afce.projectId,
          projectCode: afce.project.projectCode,
          projectName: afce.project.name,
          priority: "warning",
        },
      });
      createdCount++;
    }
  }

  // 3. Pengingat Tenggat Waktu (DEADLINE_REMINDER - H-3 s/d Hari-H)
  const upcomingDeadlines = await db.project.findMany({
    where: {
      status: { in: ["PLANNED", "IN_PROGRESS"] },
      targetEndDate: {
        gte: todayMidnight,
        lte: threeDaysLater,
      },
      deletedAt: null,
    },
    select: {
      id: true,
      projectCode: true,
      name: true,
      targetEndDate: true,
      picId: true,
    },
  });

  for (const project of upcomingDeadlines) {
    const targetUserId = project.picId || defaultAdminId;
    if (!targetUserId || !isNotifEnabled(targetUserId, "DEADLINE_REMINDER")) continue;

    const existing = await db.notification.findFirst({
      where: {
        userId: targetUserId,
        projectId: project.id,
        type: "DEADLINE_REMINDER",
        isRead: false,
      },
    });

    if (!existing) {
      const daysLeft = Math.ceil(
        (project.targetEndDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
      );

      await db.notification.create({
        data: {
          userId: targetUserId,
          type: "DEADLINE_REMINDER",
          title: `Pengingat Tenggat: ${project.name}`,
          message: `Tenggat waktu proyek tersisa ${daysLeft} hari lagi (${project.targetEndDate.toLocaleDateString("id-ID")}). Pastikan target pengadaan dan progres fisik terpantau.`,
          isRead: false,
          linkUrl: `/workspace/${project.id}`,
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.name,
          priority: "normal",
        },
      });
      createdCount++;
    }
  }

  return {
    timestamp: now.toISOString(),
    summary: {
      checkedProjects: activeProjects.length,
      checkedPendingAfces: pendingAfces.length,
      checkedUpcomingDeadlines: upcomingDeadlines.length,
      newNotificationsCreated: createdCount,
    },
  };
}

async function authorizeCronOrAdmin(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { ok: true as const };
  }

  const user = await getCurrentUser();
  if (user && user.role === "ADMIN") {
    return { ok: true as const };
  }

  if (!cronSecret && !user) {
    return {
      ok: false as const,
      status: 503,
      error: "CRON_SECRET belum dikonfigurasi dan tidak ada sesi administrator aktif.",
    };
  }

  return {
    ok: false as const,
    status: 401,
    error: "Akses ditolak: token cron tidak valid atau memerlukan peran ADMIN.",
  };
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authorizeCronOrAdmin(req);
    if (!authResult.ok) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    const data = await runDeadlineCheck();
    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memproses pemeriksaan cron.";
    console.error("Kesalahan Cron check-deadlines:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
