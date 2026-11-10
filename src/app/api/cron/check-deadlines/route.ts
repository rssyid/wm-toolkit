import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron Endpoint: Pengecekan otomatis harian (08:00 WIB / 01:00 UTC)
 * - Proyek terlambat (deviasi > 7 hari atau melewati targetEndDate)
 * - Approval AFCE tertunda (PENDING_APPROVAL)
 * - Pengingat tenggat waktu (H-3 & H-1)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verifikasi Vercel Cron Secret (jika CRON_SECRET dikonfigurasi)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: CRON_SECRET tidak valid." },
        { status: 401 }
      );
    }

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysLater = new Date(todayMidnight.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Ambil default Admin & PIC untuk penugasan notifikasi
    const adminUsers = await db.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true, name: true, email: true },
    });
    const defaultAdminId = adminUsers[0]?.id;

    let createdCount = 0;

    // 2. Cek Proyek Terlambat (LATE_PROJECT)
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
        picId: true,
      },
    });

    for (const project of activeProjects) {
      const isOverdue = project.targetEndDate < todayMidnight;
      const isHighVariance = project.scheduleVarianceDays > 7;

      if (isOverdue || isHighVariance) {
        const targetUserId = project.picId || defaultAdminId;
        if (!targetUserId) continue;

        // Cek apakah notifikasi unread sejenis sudah ada
        const existing = await db.notification.findFirst({
          where: {
            userId: targetUserId,
            projectId: project.id,
            type: "LATE_PROJECT",
            isRead: false,
          },
        });

        if (!existing) {
          const reason = isOverdue
            ? `telah melewati target selesai pada tanggal ${project.targetEndDate.toLocaleDateString("id-ID")}`
            : `mengalami deviasi keterlambatan +${project.scheduleVarianceDays} hari`;

          await db.notification.create({
            data: {
              userId: targetUserId,
              type: "LATE_PROJECT",
              title: `Peringatan Keterlambatan: ${project.name}`,
              message: `Proyek ${project.projectCode} ${reason}. Segera lakukan koordinasi teknis dan adendum waktu bila diperlukan.`,
              isRead: false,
              linkUrl: `/workspace/${project.id}/schedule`,
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

    // 3. Cek Dokumen AFCE yang Menunggu Persetujuan (PENDING_APPROVAL)
    const pendingAfces = await db.afce.findMany({
      where: {
        status: "PENDING_APPROVAL",
        deletedAt: null,
      },
      include: {
        project: {
          select: { id: true, projectCode: true, name: true, picId: true },
        },
      },
    });

    for (const afce of pendingAfces) {
      const targetUserId = afce.project?.picId || defaultAdminId;
      if (!targetUserId) continue;

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
            message: `Dokumen AFCE untuk proyek ${afce.project?.name} (${afce.afceNumber}) saat ini memerlukan persetujuan pada Level ${afce.currentLevel} (${afce.currentApproverRole || "Approver"}).`,
            isRead: false,
            linkUrl: `/workspace/${afce.projectId}/afce`,
            projectId: afce.projectId,
            projectCode: afce.afceNumber,
            projectName: afce.project?.name,
            priority: "warning",
          },
        });
        createdCount++;
      }
    }

    // 4. Cek Pengingat Tenggat Waktu (DEADLINE_REMINDER - H-3 s/d Hari-H)
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
      if (!targetUserId) continue;

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
            title: `Pengingat Deadline: ${project.name}`,
            message: `Tenggat waktu proyek tersisa ${daysLeft} hari lagi (${project.targetEndDate.toLocaleDateString("id-ID")}). Pastikan seluruh target pengadaan dan progres fisik terpantau.`,
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

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        checkedProjects: activeProjects.length,
        checkedPendingAfces: pendingAfces.length,
        checkedUpcomingDeadlines: upcomingDeadlines.length,
        newNotificationsCreated: createdCount,
      },
    });
  } catch (error: any) {
    console.error("Kesalahan Vercel Cron check-deadlines:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memproses pemeriksaan cron.",
      },
      { status: 500 }
    );
  }
}
