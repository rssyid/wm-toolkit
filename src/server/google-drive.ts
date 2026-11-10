import { google } from "googleapis";
import { Readable } from "stream";

export interface UploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink?: string;
  mimeType: string;
  fileSize?: string;
  isMock?: boolean;
}

/**
 * Inisialisasi client Google Drive API
 * Mendukung Google Service Account (rekomendasi) atau OAuth 2.0
 */
function getGoogleDriveClient() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (serviceAccountEmail && privateKey) {
    // Normalisasi newline pada private key yang disimpan di environment variable
    privateKey = privateKey.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    return google.drive({ version: "v3", auth });
  }

  // Cek apakah OAuth2 refresh token tersedia
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: "v3", auth: oauth2Client });
  }

  return null;
}

/**
 * Upload file buffer ke Google Drive folder terpusat perusahaan
 */
export async function uploadFileToGoogleDrive({
  buffer,
  fileName,
  mimeType,
  folderId,
}: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folderId?: string;
}): Promise<UploadResult> {
  const drive = getGoogleDriveClient();
  const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Jika kredensial belum dikonfigurasi, gunakan Graceful Mock Link Fallback
  if (!drive) {
    const mockFileId = `drive-mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sizeKb = Math.round(buffer.length / 1024) || 120;
    return {
      fileId: mockFileId,
      fileName,
      webViewLink: `https://drive.google.com/file/d/${mockFileId}/view?usp=sharing`,
      webContentLink: `https://drive.google.com/uc?id=${mockFileId}&export=download`,
      mimeType,
      fileSize: `${sizeKb} KB`,
      isMock: true,
    };
  }

  try {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const fileMetadata: any = {
      name: fileName,
      parents: targetFolderId ? [targetFolderId] : undefined,
    };

    const media = {
      mimeType,
      body: stream,
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink, webContentLink, size, mimeType",
      supportsAllDrives: true,
    });

    const file = res.data;

    // Set permission agar berkas dapat dibuka (read-only) oleh siapa saja yang memiliki tautan
    if (file.id) {
      try {
        await drive.permissions.create({
          fileId: file.id,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
          supportsAllDrives: true,
        });
      } catch (permError) {
        console.warn("Peringatan izin file Google Drive:", permError);
      }
    }

    const sizeKb = file.size ? Math.round(Number(file.size) / 1024) : 100;

    return {
      fileId: file.id || "",
      fileName: file.name || fileName,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      webContentLink: file.webContentLink || undefined,
      mimeType: file.mimeType || mimeType,
      fileSize: `${sizeKb} KB`,
      isMock: false,
    };
  } catch (error: any) {
    console.error("Gagal mengunggah berkas ke Google Drive API:", error);
    // Fallback darurat agar proses transaksi proyek tidak macet
    const fallbackId = `err-fallback-${Date.now()}`;
    return {
      fileId: fallbackId,
      fileName,
      webViewLink: `https://drive.google.com/file/d/${fallbackId}/view`,
      mimeType,
      fileSize: "1.0 MB",
      isMock: true,
    };
  }
}
