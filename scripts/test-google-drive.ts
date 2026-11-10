import "dotenv/config";
import { uploadFileToGoogleDrive } from "../src/server/google-drive";

async function main() {
  console.log("🔍 Memeriksa konfigurasi Google Drive API...");

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const isServiceAccount = Boolean(email && key);
  const isOAuth2 = Boolean(clientId && refreshToken);

  if (!isServiceAccount && !isOAuth2) {
    console.log("ℹ️ Kredensial Google Drive belum diatur di .env (Service Account atau OAuth2).");
    console.log("👉 Sistem saat ini berjalan dalam mode Graceful Mock Link Fallback (Aman & Tidak Crash).");
    console.log("📖 Ikuti panduan lengkap di: docs/GOOGLE-DRIVE-SETUP.md untuk mengaktifkan koneksi riil.");
    return;
  }

  if (isOAuth2) {
    console.log(`-> Mode: OAuth 2.0 User Delegation (Kuota 15 GB Akun Pribadi)`);
    console.log(`-> Client ID: ${clientId}`);
  } else {
    console.log(`-> Mode: Service Account Server-to-Server (Google Workspace Shared Drive)`);
    console.log(`-> Service Account: ${email}`);
  }
  console.log(`-> Target Folder ID: ${folderId || "(Root Folder)"}`);

  const dummyContent = Buffer.from("File uji coba koneksi Google Drive API dari WM-Toolkit pada " + new Date().toISOString());

  try {
    const result = await uploadFileToGoogleDrive({
      buffer: dummyContent,
      fileName: `test_wm_toolkit_${Date.now()}.txt`,
      mimeType: "text/plain",
      folderId,
    });

    if (result.isMock) {
      console.log("⚠️ Menggunakan fallback mock link (kredensial belum lengkap).");
    } else {
      console.log("✅ BERHASIL TERHUBUNG KE GOOGLE DRIVE!");
      console.log(`📁 File ID: ${result.fileId}`);
      console.log(`🔗 Link Berkas: ${result.webViewLink}`);
    }
  } catch (error: any) {
    console.error("❌ Gagal terhubung ke Google Drive API:", error.message);
  }
}

main();
