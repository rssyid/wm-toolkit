import { NextRequest, NextResponse } from "next/server";
import { uploadFileToGoogleDrive, getOrCreateGoogleDriveFolder } from "@/server/google-drive";
import { db } from "@/server/db";
import { auth } from "@/auth";

export const maxDuration = 60; // Izinkan durasi streaming hingga 60 detik di Vercel

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi sesi login (jika ada sesi NextAuth)
    const session = await auth();
    // Jika tidak ada session (misal saat transisi demo lokal), izinkan atau tangani dengan aman
    const uploaderName = session?.user?.name || "Pengguna WM-Toolkit";

    // 2. Ambil payload multi-part FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = (formData.get("projectId") as string | null) || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada berkas yang dipilih untuk diunggah." },
        { status: 400 }
      );
    }

    // 3. Batasi ukuran maksimum 15 MB
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "Ukuran berkas melebihi batas maksimum 15 MB.",
        },
        { status: 400 }
      );
    }

    // 4. Ubah file stream menjadi Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Tentukan folder target di Google Drive (Folder khusus per proyek jika ada projectId)
    let targetFolderId: string | undefined = process.env.GOOGLE_DRIVE_FOLDER_ID;
    let projectFolderName: string | undefined;
    let projectFolderViewLink: string | undefined;

    if (projectId) {
      try {
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
      } catch (folderErr: any) {
        console.warn("Peringatan pembuatan folder proyek Google Drive:", folderErr?.message);
        // Tetap lanjutkan upload ke folder induk root jika gagal membuat folder spesifik proyek
      }
    }

    // 6. Unggah ke Google Drive (di dalam folder proyek)
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
        uploaderName,
        folderId: targetFolderId,
        folderName: projectFolderName,
        folderViewLink: projectFolderViewLink,
      },
    });
  } catch (error: any) {
    console.error("Kesalahan API Upload Google Drive:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengunggah berkas ke Google Drive.",
      },
      { status: 500 }
    );
  }
}
