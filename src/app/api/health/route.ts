import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let latencyMs = -1;
  let usersCount = 0;
  let projectsCount = 0;
  let dbError = null;

  try {
    const startDb = Date.now();
    [usersCount, projectsCount] = await Promise.all([
      db.user.count(),
      db.project.count({ where: { deletedAt: null } }),
    ]);
    latencyMs = Date.now() - startDb;
    dbStatus = "connected";
  } catch (err: any) {
    dbStatus = "error";
    dbError = err.message || "Gagal menghubungi database.";
  }

  const isDriveConfigured =
    Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) ||
    Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);

  const isAuthSecretSet = Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
  const isCronSecretSet = Boolean(process.env.CRON_SECRET);

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      name: "WM-Toolkit Project Monitoring",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      totalDurationMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        provider: "PostgreSQL (Neon Serverless)",
        latencyMs,
        activeProjects: projectsCount,
        registeredUsers: usersCount,
        ...(dbError ? { error: dbError } : {}),
      },
      integrations: {
        googleDrive: {
          configured: isDriveConfigured,
          folderIdConfigured: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
        },
        authSecretConfigured: isAuthSecretSet,
        cronSecretConfigured: isCronSecretSet,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
