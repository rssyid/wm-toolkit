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

  // Jika input sudah merupakan Google Drive ID murni (alfanumerik 25-50 karakter)
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

function createOAuth2Client(): drive_v3.Drive | null {
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

function createServiceAccountClient(): drive_v3.Drive | null {
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
  return null;
}

/**
 * Inisialisasi client Google Drive API
 * Prioritas:
 * 1. OAuth 2.0 (jika kredensial tersedia): Memiliki kuota penyimpanan (15 GB akun pengguna)
 *    sehingga tidak pernah terkena limit 0-byte kuota Service Account pada folder pribadi.
 * 2. Service Account: Cocok untuk Google Workspace Shared Drive.
 */
export function getGoogleDriveClient(preferredMode?: "oauth2" | "service_account"): drive_v3.Drive | null {
  const hasOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
  const hasServiceAccount = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );

  if (preferredMode === "oauth2" && hasOAuth) return createOAuth2Client();
  if (preferredMode === "service_account" && hasServiceAccount) return createServiceAccountClient();

  const authModeEnv = process.env.GOOGLE_DRIVE_AUTH_MODE?.toLowerCase();
  if (authModeEnv === "service_account" && hasServiceAccount) return createServiceAccountClient();
  if (authModeEnv === "oauth2" && hasOAuth) return createOAuth2Client();

  // Prioritaskan OAuth2 jika tersedia, karena Service Account memiliki kuota 0 bytes di folder "Drive Saya"
  if (hasOAuth) {
    return createOAuth2Client();
  }

  if (hasServiceAccount) {
    return createServiceAccountClient();
  }

  return null;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
  isMock?: boolean;
}

// In-memory cache & pending promise locks untuk mencegah duplikasi pembuatan folder di Google Drive
const folderCache = new Map<string, DriveFolderInfo>();
const pendingFolderCreations = new Map<string, Promise<DriveFolderInfo>>();

/**
 * Mencari atau membuat folder khusus per proyek di Google Drive
 */
export async function getOrCreateGoogleDriveFolder({
  folderName,
  parentFolderId,
}: {
  folderName: string;
  parentFolderId?: string;
}): Promise<DriveFolderInfo> {
  const targetParentId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const cacheKey = `${targetParentId || "root"}:${folderName.trim()}`;

  // 1. Cek cache in-memory
  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey)!;
  }

  // 2. Cek apakah ada proses pembuatan folder yang sedang berlangsung untuk key yang sama
  if (pendingFolderCreations.has(cacheKey)) {
    return await pendingFolderCreations.get(cacheKey)!;
  }

  const creationPromise = (async (): Promise<DriveFolderInfo> => {
    const drive = getGoogleDriveClient();
    const hasOAuth = Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    );

    // Graceful Mock Fallback jika Drive belum dikonfigurasi
    if (!drive) {
      console.warn("Google Drive API client tidak terkonfigurasi. Menggunakan mock folder fallback.");
      const mockFolderId = `mock-folder-${Date.now()}`;
      const mockResult: DriveFolderInfo = {
        id: mockFolderId,
        name: folderName,
        webViewLink: `https://drive.google.com/drive/folders/${mockFolderId}`,
        isMock: true,
      };
      folderCache.set(cacheKey, mockResult);
      return mockResult;
    }

    const executeFindOrCreate = async (driveClient: drive_v3.Drive): Promise<DriveFolderInfo> => {
      // Escape karakter ' dan \ untuk query parameter Drive
      const escapedName = folderName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${escapedName}' and trashed = false`;
      if (targetParentId) {
        query += ` and '${targetParentId}' in parents`;
      }

      // 1. Cari folder yang sudah ada
      const listRes = await driveClient.files.list({
        q: query,
        fields: "files(id, name, webViewLink)",
        spaces: "drive",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const existingFolder = listRes.data.files?.[0];
      if (existingFolder && existingFolder.id) {
        return {
          id: existingFolder.id,
          name: existingFolder.name || folderName,
          webViewLink: existingFolder.webViewLink || `https://drive.google.com/drive/folders/${existingFolder.id}`,
          isMock: false,
        };
      }

      // 2. Buat folder baru jika belum ditemukan
      const createRes = await driveClient.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: targetParentId ? [targetParentId] : undefined,
        },
        fields: "id, name, webViewLink",
        supportsAllDrives: true,
      });

      const newFolder = createRes.data;
      if (!newFolder.id) {
        throw new Error(`Google Drive API gagal mengembalikan ID folder baru: "${folderName}"`);
      }

      // Berikan izin view (reader) untuk tautan folder
      try {
        await driveClient.permissions.create({
          fileId: newFolder.id,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
          supportsAllDrives: true,
        });
      } catch (permErr) {
        console.warn("Peringatan izin folder Google Drive:", permErr);
      }

      return {
        id: newFolder.id,
        name: newFolder.name || folderName,
        webViewLink: newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`,
        isMock: false,
      };
    };

    try {
      return await executeFindOrCreate(drive);
    } catch (error: any) {
      const isQuotaError =
        error?.message?.includes("storage quota") ||
        error?.message?.includes("Service Accounts do not have storage quota") ||
        error?.status === 403;

      if (isQuotaError && hasOAuth) {
        console.warn("Kuota 0-byte Service Account terdeteksi saat membuat folder. Beralih ke OAuth 2.0...");
        const oauthDrive = createOAuth2Client();
        if (oauthDrive) {
          return await executeFindOrCreate(oauthDrive);
        }
      }

      console.error("Gagal membuat/mencari folder Google Drive:", error);
      throw error;
    }
  })();

  pendingFolderCreations.set(cacheKey, creationPromise);

  try {
    const result = await creationPromise;
    folderCache.set(cacheKey, result);
    return result;
  } finally {
    pendingFolderCreations.delete(cacheKey);
  }
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
  const hasOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

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

  const executeUpload = async (driveClient: drive_v3.Drive): Promise<UploadResult> => {
    const stream = Readable.from(buffer);

    const fileMetadata: drive_v3.Schema$File = {
      name: fileName,
      parents: targetFolderId ? [targetFolderId] : undefined,
    };

    const media = {
      mimeType: mimeType || "application/octet-stream",
      body: stream,
    };

    const res = await driveClient.files.create({
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
      await driveClient.permissions.create({
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
  };

  try {
    return await executeUpload(drive);
  } catch (error: any) {
    const isQuotaError =
      error?.message?.includes("storage quota") ||
      error?.message?.includes("Service Accounts do not have storage quota") ||
      error?.status === 403;

    // Jika terjadi kuota error pada Service Account dan OAuth2 tersedia, beralih otomatis ke OAuth2
    if (isQuotaError && hasOAuth) {
      console.warn("Mendeteksi kuota 0-byte Service Account. Mencoba otomatis menggunakan kredensial OAuth 2.0...");
      const oauthDrive = createOAuth2Client();
      if (oauthDrive) {
        return await executeUpload(oauthDrive);
      }
    }

    if (isQuotaError) {
      console.error("Gagal kuota Service Account Google Drive:", error.message);
      throw new Error(
        "Google Drive menolak unggahan karena akun Service Account memiliki kuota penyimpanan 0 Bytes. " +
        "Penyebab: Folder target berada di 'Drive Saya' akun pribadi (@gmail.com). " +
        "Solusi: (1) Jika menggunakan akun @gmail.com: Masukkan variabel OAuth 2.0 (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) di Vercel dan HAPUS variabel GOOGLE_SERVICE_ACCOUNT_EMAIL. " +
        "(2) Jika menggunakan Google Workspace perusahaan: Buat folder di 'Drive Bersama' (Shared Drive), bukan di 'Drive Saya'."
      );
    }

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
