import "dotenv/config";
import { google } from "googleapis";

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, webViewLink, size, createdTime)",
    });

    console.log(`\n📁 Berkas di Google Drive Folder [${folderId}]: ${res.data.files?.length || 0} berkas`);
    res.data.files?.forEach((f, idx) => {
      console.log(`${idx + 1}. [${f.name}]`);
      console.log(`   - ID: ${f.id}`);
      console.log(`   - Link: ${f.webViewLink}`);
      console.log(`   - Tipe: ${f.mimeType}`);
      console.log(`   - Waktu Buat: ${f.createdTime}`);
    });
  } catch (err: any) {
    console.error("Gagal memeriksa berkas Drive:", err.message);
  }
}

main();
