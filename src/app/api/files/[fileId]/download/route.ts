import { NextRequest, NextResponse } from "next/server";
import {
  downloadFileFromGoogleDrive,
  extractGoogleDriveFileId,
  isGoogleDriveConfigured,
} from "@/server/google-drive";
import { getCurrentUser } from "@/server/auth-guard";
import { Readable } from "stream";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sesi Anda telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }

    if (!isGoogleDriveConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Integrasi Google Drive belum dikonfigurasi pada server.",
        },
        { status: 503 }
      );
    }

    const { fileId: rawFileId } = await context.params;
    const url = new URL(req.url);
    const requestedName = url.searchParams.get("name") || url.searchParams.get("filename");
    const cleanFileId = extractGoogleDriveFileId(rawFileId) || rawFileId;

    const driveFile = await downloadFileFromGoogleDrive(cleanFileId);
    if (!driveFile) {
      return NextResponse.json(
        {
          success: false,
          error: "Berkas tidak ditemukan di Google Drive atau ID berkas tidak valid.",
        },
        { status: 404 }
      );
    }

    const fileName = requestedName || driveFile.name || `dokumen-${cleanFileId}`;
    const webStream = Readable.toWeb(driveFile.stream as Readable) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": driveFile.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        ...(driveFile.size ? { "Content-Length": String(driveFile.size) } : {}),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengunduh berkas.";
    console.error("Kesalahan API Download File:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
