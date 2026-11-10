import "dotenv/config";
import { uploadFileToGoogleDrive, downloadFileFromGoogleDrive } from "../src/server/google-drive";

async function main() {
  console.log("🧪 Memulai Uji Coba End-to-End Google Drive...");

  // 1. Buat berkas uji coba PDF
  const testFileName = `Uji_Coba_Upload_WMToolkit_${Date.now()}.pdf`;
  const testBuffer = Buffer.from(`%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 400 200]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000102 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
163
%%EOF`, "utf-8");

  console.log(`\n1. Mengunggah ${testFileName} (${testBuffer.length} bytes)...`);
  const uploadRes = await uploadFileToGoogleDrive({
    buffer: testBuffer,
    fileName: testFileName,
    mimeType: "application/pdf",
  });

  console.log("-> Upload Result:", {
    fileId: uploadRes.fileId,
    fileName: uploadRes.fileName,
    webViewLink: uploadRes.webViewLink,
    isMock: uploadRes.isMock,
  });

  if (uploadRes.isMock || !uploadRes.fileId) {
    throw new Error("Upload gagal mengembalikan Google Drive File ID yang valid!");
  }

  // 2. Unduh kembali berkas dari Google Drive API
  console.log(`\n2. Mengunduh kembali berkas [${uploadRes.fileId}] via streaming download...`);
  const downloadRes = await downloadFileFromGoogleDrive(uploadRes.fileId);

  if (!downloadRes) {
    throw new Error("Gagal mengunduh berkas dari Google Drive!");
  }

  const chunks: Buffer[] = [];
  for await (const chunk of downloadRes.stream as any) {
    chunks.push(Buffer.from(chunk));
  }
  const downloadedBuf = Buffer.concat(chunks);

  console.log(`-> Berkas berhasil diunduh: ${downloadedBuf.length} bytes.`);
  console.log(`-> Header berkas: ${downloadedBuf.slice(0, 8).toString("utf-8")}`);

  if (downloadedBuf.length !== testBuffer.length) {
    throw new Error(`Ukuran berkas tidak cocok: diharapkan ${testBuffer.length}, didapat ${downloadedBuf.length}`);
  }

  console.log("\n✅ SEMUA PENGUJIAN END-TO-END GOOGLE DRIVE BERHASIL DENGAN SEMPURNA!");
}

main().catch((err) => {
  console.error("❌ E2E test gagal:", err);
  process.exit(1);
});
