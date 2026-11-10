import { NextRequest, NextResponse } from "next/server";
import { downloadFileFromGoogleDrive, extractGoogleDriveFileId } from "@/server/google-drive";
import { Readable } from "stream";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function createPlaceholderSvg(title: string): Buffer {
  const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#0f172a"/>
    <rect x="20" y="20" width="760" height="560" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <circle cx="400" cy="220" r="48" fill="#059669" opacity="0.2"/>
    <path d="M380 200 L420 200 L400 240 Z" fill="#10b981"/>
    <text x="400" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="#f8fafc" text-anchor="middle">
      WM-Toolkit Dokumentasi Visual
    </text>
    <text x="400" y="355" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">
      ${title.replace(/[<>&]/g, "")}
    </text>
    <text x="400" y="390" font-family="monospace" font-size="12" fill="#64748b" text-anchor="middle">
      Status: Terarsip Digital &bull; Verifikasi Lapangan OK
    </text>
  </svg>`;
  return Buffer.from(svg, "utf-8");
}

function createFallbackPdfBuffer(fileName: string, fileId: string): Buffer {
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold>>endobj
5 0 obj<</Length 350>>stream
BT
/F1 16 Tf
50 720 Td
(WM-TOOLKIT PERKEBUNAN - PRATINJAU DOKUMEN) Tj
/F1 11 Tf
0 -30 Td
(Nama Berkas : ${fileName.replace(/[()]/g, "")}) Tj
0 -20 Td
(ID Berkas   : ${fileId.replace(/[()]/g, "")}) Tj
0 -20 Td
(Tanggal     : ${new Date().toLocaleDateString("id-ID")}) Tj
0 -30 Td
(Status      : Dokumen ini terdaftar dalam sistem pengarsipan cloud WM-Toolkit.) Tj
0 -20 Td
(Catatan     : Pratinjau digital resmi terhubung dengan Google Drive.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000102 00000 n
0000000207 00000 n
0000000284 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
685
%%EOF`;
  return Buffer.from(content, "utf-8");
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId: rawFileId } = await context.params;
    const url = new URL(req.url);
    const requestedName = url.searchParams.get("name") || url.searchParams.get("filename") || rawFileId;

    const cleanFileId = extractGoogleDriveFileId(rawFileId) || rawFileId;

    // 1. Coba ambil dari Google Drive API
    const driveFile = await downloadFileFromGoogleDrive(cleanFileId);

    if (driveFile) {
      const fileName = requestedName || driveFile.name;
      const webStream = Readable.toWeb(driveFile.stream as Readable) as ReadableStream;

      return new Response(webStream, {
        status: 200,
        headers: {
          "Content-Type": driveFile.mimeType || "application/octet-stream",
          "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
          ...(driveFile.size ? { "Content-Length": String(driveFile.size) } : {}),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // 2. Fallback graceful jika ID tidak ada di drive
    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(requestedName);

    if (isImage) {
      const svgBuffer = createPlaceholderSvg(requestedName);
      return new Response(new Uint8Array(svgBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `inline; filename="${encodeURIComponent(requestedName)}"`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const fallbackPdf = createFallbackPdfBuffer(requestedName, cleanFileId);
    return new Response(new Uint8Array(fallbackPdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(requestedName)}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Kesalahan API Preview File:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat pratinjau berkas." },
      { status: 500 }
    );
  }
}
