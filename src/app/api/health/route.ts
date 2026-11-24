import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "sehat" }, { status: 200 });
  } catch (err) {
    console.error("Pemeriksaan kesehatan gagal menghubungi database:", err);
    return NextResponse.json({ status: "terganggu" }, { status: 503 });
  }
}
