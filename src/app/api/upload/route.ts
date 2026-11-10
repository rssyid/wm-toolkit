import { NextRequest, NextResponse } from "next/server";
import { uploadFileToGoogleDrive } from "@/server/google-drive";
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

    // 5. Unggah ke Google Drive
    const uploadResult = await uploadFileToGoogleDrive({
      buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      success: true,
      data: {
        ...uploadResult,
        uploaderName,
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
