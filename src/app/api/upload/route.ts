import { NextRequest, NextResponse } from "next/server";
import { uploadFileToGoogleDrive, getOrCreateGoogleDriveFolder, isGoogleDriveConfigured } from "@/server/google-drive";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth-guard";

export const maxDuration = 60;

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "txt",
]);

const ALLOWED_MIME_PREFIXES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sesi Anda telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }

    if (user.role === "VIEWER") {
      return NextResponse.json(
        { success: false, error: "Peran VIEWER tidak memiliki izin untuk mengunggah berkas." },
        { status: 403 }
      );
    }

    if (!isGoogleDriveConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Integrasi Google Drive belum dikonfigurasi pada server. Hubungi administrator.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = (formData.get("projectId") as string | null) || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada berkas yang dipilih untuk diunggah." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeAllowed =
      !file.type ||
      ALLOWED_MIME_PREFIXES.includes(file.type) ||
      file.type === "application/octet-stream";

    if (!ALLOWED_EXTENSIONS.has(ext) || !mimeAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipe berkas tidak diizinkan. Gunakan PDF, gambar (PNG/JPG/WebP), Word, Excel, CSV, atau TXT.",
        },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran berkas melebihi batas maksimum 15 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let targetFolderId: string | undefined = process.env.GOOGLE_DRIVE_FOLDER_ID;
    let projectFolderName: string | undefined;
    let projectFolderViewLink: string | undefined;

    if (projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { id: true, projectCode: true, name: true },
      });

      if (project) {
        projectFolderName = `[${project.projectCode}] ${project.name}`.trim();
        const folderInfo = await getOrCreateGoogleDriveFolder({
          folderName: projectFolderName,
          parentFolderId: targetFolderId,
        });
        targetFolderId = folderInfo.id;
        projectFolderViewLink = folderInfo.webViewLink;
      }
    }

    const uploadResult = await uploadFileToGoogleDrive({
      buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      folderId: targetFolderId,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...uploadResult,
        uploaderName: user.name,
        folderId: targetFolderId,
        folderName: projectFolderName,
        folderViewLink: projectFolderViewLink,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengunggah berkas ke Google Drive.";
    console.error("Kesalahan API Upload Google Drive:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
