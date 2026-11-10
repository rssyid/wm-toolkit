import { google, drive_v3 } from "googleapis";
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
 * Ekstrak Google Drive File ID dari berbagai format string/URL
 */
export function extractGoogleDriveFileId(input?: string | null): string | null {
  if (!input) return null;
  const str = input.trim();

  // Jika input sudah merupakan Google Drive ID murni (alfanumerik 25-45 karakter)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
    return str;
  }

  // Format 1: https://drive.google.com/file/d/{id}/view...
  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Format 2: https://drive.google.com/open?id={id} atau uc?id={id}
  const idParamMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // Format 3: /folders/{id}
  const folderMatch = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  return null;
}

/**
 * Inisialisasi client Google Drive API
 * Mendukung Google Service Account (rekomendasi) atau OAuth 2.0
 */
export function getGoogleDriveClient(): drive_v3.Drive | null {
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

  // Jika kredensial belum dikonfigurasi sama sekali, gunakan Graceful Mock Link Fallback
  if (!drive) {
    console.warn("Google Drive API client tidak terkonfigurasi. Menggunakan mock link fallback.");
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
    // Gunakan Readable.from untuk stream buffer yang stabil di Node.js
    const stream = Readable.from(buffer);

    const fileMetadata: drive_v3.Schema$File = {
      name: fileName,
      parents: targetFolderId ? [targetFolderId] : undefined,
    };

    const media = {
      mimeType: mimeType || "application/octet-stream",
      body: stream,
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink, webContentLink, size, mimeType",
      supportsAllDrives: true,
    });

    const file = res.data;

    if (!file.id) {
      throw new Error("Google Drive API tidak mengembalikan ID berkas.");
    }

    // Set permission agar berkas dapat diakses/dilihat (read-only) oleh siapa saja yang memiliki tautan
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

    const sizeKb = file.size
      ? Math.round(Number(file.size) / 1024)
      : Math.round(buffer.length / 1024);

    return {
      fileId: file.id,
      fileName: file.name || fileName,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      webContentLink: file.webContentLink || `https://drive.google.com/uc?id=${file.id}&export=download`,
      mimeType: file.mimeType || mimeType,
      fileSize: `${sizeKb} KB`,
      isMock: false,
    };
  } catch (error: any) {
    console.error("Gagal mengunggah berkas ke Google Drive API:", error);
    throw new Error(
      `Gagal mengunggah berkas ke Google Drive: ${error?.message || "Kesalahan API Google Drive"}`
    );
  }
}

/**
 * Ambil metadata berkas dari Google Drive API
 */
export async function getGoogleDriveFileMetadata(fileId: string) {
  const drive = getGoogleDriveClient();
  if (!drive) return null;

  try {
    const res = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, webViewLink, webContentLink, iconLink, thumbnailLink",
      supportsAllDrives: true,
    });
    return res.data;
  } catch (err: any) {
    console.warn(`Gagal mengambil metadata file Drive [${fileId}]:`, err?.message);
    return null;
  }
}

/**
 * Ambil binary stream berkas dari Google Drive API untuk download / streaming
 */
export async function downloadFileFromGoogleDrive(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  name: string;
  mimeType: string;
  size?: number;
} | null> {
  const drive = getGoogleDriveClient();
  if (!drive) return null;

  try {
    // 1. Ambil metadata nama & tipe
    const meta = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size",
      supportsAllDrives: true,
    });

    const fileName = meta.data.name || `dokumen-${fileId}.pdf`;
    const mimeType = meta.data.mimeType || "application/octet-stream";
    const size = meta.data.size ? Number(meta.data.size) : undefined;

    // 2. Ambil media stream
    const mediaRes = await drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "stream" }
    );

    return {
      stream: mediaRes.data as NodeJS.ReadableStream,
      name: fileName,
      mimeType,
      size,
    };
  } catch (err: any) {
    console.error(`Gagal streaming download dari Google Drive [${fileId}]:`, err?.message);
    return null;
  }
}
