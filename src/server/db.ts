import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing.");
  }

  // Handle sslmode & channel_binding compatibility with pg Pool
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Mencegah uncaught exception saat koneksi idle diputus oleh serverless Neon
  pool.on("error", (err) => {
    console.warn("Peringatan koneksi idle PostgreSQL Pool:", err.message);
  });

  const adapter = new PrismaPg(pool, {
    onPoolError: (err) => {
      console.warn("Peringatan PrismaPg adapter pool:", err.message);
    },
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// Selalu cache instance prisma pada globalThis agar digunakan kembali pada warm container serverless
globalForPrisma.prisma = db;
