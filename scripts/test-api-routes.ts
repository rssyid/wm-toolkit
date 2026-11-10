import "dotenv/config";
import { downloadFileFromGoogleDrive, getGoogleDriveFileMetadata } from "../src/server/google-drive";

async function main() {
  console.log("🧪 Menguji fungsi Google Drive dan download...");

  const testFileId = "1yDJdgVHfgWwTq21_XyXUkagtm8_Zsdv7";

  console.log(`\n1. Menguji metadata berkas [${testFileId}]...`);
  const meta = await getGoogleDriveFileMetadata(testFileId);
  console.log("-> Metadata hasil:", {
    id: meta?.id,
    name: meta?.name,
    mimeType: meta?.mimeType,
    size: meta?.size,
    webViewLink: meta?.webViewLink,
  });

  console.log(`\n2. Menguji streaming download berkas [${testFileId}]...`);
  const download = await downloadFileFromGoogleDrive(testFileId);
  if (!download) {
    throw new Error("Gagal menginisialisasi streaming download dari Google Drive");
  }

  console.log("-> Download stream siap:", {
    name: download.name,
    mimeType: download.mimeType,
    size: download.size,
  });

  // Baca stream menjadi buffer untuk membuktikan data riil
  const chunks: Buffer[] = [];
  for await (const chunk of download.stream as any) {
    chunks.push(Buffer.from(chunk));
  }
  const totalBuffer = Buffer.concat(chunks);
  console.log(`✅ Berhasil mengunduh media dari Google Drive: ${totalBuffer.length} bytes!`);
  console.log(`Header PDF awal: ${totalBuffer.slice(0, 8).toString("utf-8")}`);
}

main().catch((err) => {
  console.error("❌ Test gagal:", err);
  process.exit(1);
});
