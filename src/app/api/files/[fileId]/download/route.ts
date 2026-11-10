import { NextRequest, NextResponse } from "next/server";
import { downloadFileFromGoogleDrive, extractGoogleDriveFileId } from "@/server/google-drive";
import { Readable } from "stream";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
(WM-TOOLKIT PERKEBUNAN - ARSIP DOKUMEN PROYEK) Tj
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
(Catatan     : Berkas asli tersimpan di repositori Google Drive perusahaan.) Tj
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
    const requestedName = url.searchParams.get("name") || url.searchParams.get("filename");

    const cleanFileId = extractGoogleDriveFileId(rawFileId) || rawFileId;

    // 1. Coba unduh langsung dari Google Drive API
    const driveFile = await downloadFileFromGoogleDrive(cleanFileId);

    if (driveFile) {
      const fileName = requestedName || driveFile.name || `dokumen-${cleanFileId}.pdf`;
      const webStream = Readable.toWeb(driveFile.stream as Readable) as ReadableStream;

      return new Response(webStream, {
        status: 200,
        headers: {
          "Content-Type": driveFile.mimeType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          ...(driveFile.size ? { "Content-Length": String(driveFile.size) } : {}),
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // 2. Fallback graceful jika ID berkas adalah rekod demo/mock lama
    const fallbackName = requestedName || (cleanFileId.endsWith(".pdf") ? cleanFileId : `${cleanFileId}.pdf`);
    const fallbackPdf = createFallbackPdfBuffer(fallbackName, cleanFileId);

    return new Response(new Uint8Array(fallbackPdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fallbackName)}"; filename*=UTF-8''${encodeURIComponent(fallbackName)}`,
        "Content-Length": String(fallbackPdf.length),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error: any) {
    console.error("Kesalahan API Download File:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunduh berkas." },
      { status: 500 }
    );
  }
}
