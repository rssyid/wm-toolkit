import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

export interface UploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink?: string;
  mimeType: string;
  fileSize?: string;
}

export function extractGoogleDriveFileId(input?: string | null): string | null {
  if (!input) return null;
  const str = input.trim();

  if (/^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
    return str;
  }

  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch?.[1]) {
    return fileDMatch[1];
  }

  const idParamMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch?.[1]) {
    return idParamMatch[1];
  }

  const folderMatch = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) {
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

export function isGoogleDriveConfigured(): boolean {
  const hasOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );
  const hasServiceAccount = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
  return hasOAuth || hasServiceAccount;
}

/** Memprioritaskan OAuth2 untuk akun Drive pribadi karena Service Account tidak memiliki kuota di "Drive Saya". */
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

  if (hasOAuth) return createOAuth2Client();
  if (hasServiceAccount) return createServiceAccountClient();

  return null;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

const FOLDER_CACHE_TTL_MS = 10 * 60 * 1000;
const folderCache = new Map<string, { info: DriveFolderInfo; expiresAt: number }>();
const pendingFolderCreations = new Map<string, Promise<DriveFolderInfo>>();

function isServiceAccountQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return (
    msg.includes("storage quota") ||
    msg.includes("Service Accounts do not have storage quota")
  );
}

export async function getOrCreateGoogleDriveFolder({
  folderName,
  parentFolderId,
}: {
  folderName: string;
  parentFolderId?: string;
}): Promise<DriveFolderInfo> {
  const drive = getGoogleDriveClient();
  if (!drive) {
    throw new Error(
      "Integrasi Google Drive belum dikonfigurasi pada server. Hubungi administrator untuk melengkapi kredensial."
    );
  }

  const targetParentId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const cacheKey = `${targetParentId || "root"}:${folderName.trim()}`;

  const cached = folderCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.info;
  }
  if (cached) {
    folderCache.delete(cacheKey);
  }

  const existingPending = pendingFolderCreations.get(cacheKey);
  if (existingPending) {
    return await existingPending;
  }

  const hasOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );

  const creationPromise = (async (): Promise<DriveFolderInfo> => {
    const executeFindOrCreate = async (driveClient: drive_v3.Drive): Promise<DriveFolderInfo> => {
      const escapedName = folderName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${escapedName}' and trashed = false`;
      if (targetParentId) {
        query += ` and '${targetParentId}' in parents`;
      }

      const listRes = await driveClient.files.list({
        q: query,
        fields: "files(id, name, webViewLink)",
        spaces: "drive",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const existingFolder = listRes.data.files?.[0];
      if (existingFolder?.id) {
        return {
          id: existingFolder.id,
          name: existingFolder.name || folderName,
          webViewLink:
            existingFolder.webViewLink ||
            `https://drive.google.com/drive/folders/${existingFolder.id}`,
        };
      }

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
        throw new Error(`Google Drive gagal mengembalikan ID folder baru: "${folderName}".`);
      }

      return {
        id: newFolder.id,
        name: newFolder.name || folderName,
        webViewLink:
          newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`,
      };
    };

    try {
      return await executeFindOrCreate(drive);
    } catch (error: unknown) {
      if (isServiceAccountQuotaError(error) && hasOAuth) {
        const oauthDrive = createOAuth2Client();
        if (oauthDrive) {
          return await executeFindOrCreate(oauthDrive);
        }
      }
      throw error;
    }
  })();

  pendingFolderCreations.set(cacheKey, creationPromise);

  try {
    const result = await creationPromise;
    folderCache.set(cacheKey, {
      info: result,
      expiresAt: Date.now() + FOLDER_CACHE_TTL_MS,
    });
    return result;
  } finally {
    pendingFolderCreations.delete(cacheKey);
  }
}

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
  if (!drive) {
    throw new Error(
      "Integrasi Google Drive belum dikonfigurasi pada server. Berkas tidak dapat diunggah."
    );
  }

  const hasOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );
  const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  const executeUpload = async (driveClient: drive_v3.Drive): Promise<UploadResult> => {
    const stream = Readable.from(buffer);
    const res = await driveClient.files.create({
      requestBody: {
        name: fileName,
        parents: targetFolderId ? [targetFolderId] : undefined,
      },
      media: {
        mimeType: mimeType || "application/octet-stream",
        body: stream,
      },
      fields: "id, name, webViewLink, webContentLink, size, mimeType",
      supportsAllDrives: true,
    });

    const file = res.data;
    if (!file.id) {
      throw new Error("Google Drive tidak mengembalikan ID berkas.");
    }

    const sizeKb = file.size
      ? Math.max(1, Math.round(Number(file.size) / 1024))
      : Math.max(1, Math.round(buffer.length / 1024));

    return {
      fileId: file.id,
      fileName: file.name || fileName,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      webContentLink:
        file.webContentLink || `https://drive.google.com/uc?id=${file.id}&export=download`,
      mimeType: file.mimeType || mimeType,
      fileSize: sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`,
    };
  };

  try {
    return await executeUpload(drive);
  } catch (error: unknown) {
    if (isServiceAccountQuotaError(error) && hasOAuth) {
      const oauthDrive = createOAuth2Client();
      if (oauthDrive) {
        return await executeUpload(oauthDrive);
      }
    }

    if (isServiceAccountQuotaError(error)) {
      throw new Error(
        "Google Drive menolak unggahan karena Service Account tidak memiliki kuota penyimpanan di Drive pribadi. Gunakan Shared Drive atau OAuth 2.0."
      );
    }

    const msg = error instanceof Error ? error.message : "Kesalahan API Google Drive";
    throw new Error(`Gagal mengunggah berkas ke Google Drive: ${msg}`);
  }
}

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
  } catch {
    return null;
  }
}

export async function downloadFileFromGoogleDrive(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  name: string;
  mimeType: string;
  size?: number;
} | null> {
  const drive = getGoogleDriveClient();
  if (!drive) return null;

  try {
    const meta = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size",
      supportsAllDrives: true,
    });

    const fileName = meta.data.name || `dokumen-${fileId}`;
    const mimeType = meta.data.mimeType || "application/octet-stream";
    const size = meta.data.size ? Number(meta.data.size) : undefined;

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
  } catch {
    return null;
  }
}

export async function deleteFileFromGoogleDrive(fileId: string): Promise<void> {
  const drive = getGoogleDriveClient();
  if (!drive) return;

  try {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  } catch (err: unknown) {
    console.warn(`Gagal menghapus berkas Google Drive [${fileId}]:`, err);
  }
}
