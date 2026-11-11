import { revalidatePath } from "next/cache";

/**
 * Membungkus revalidatePath agar aman dari error 'static generation store missing'
 * jika dieksekusi di luar konteks HTTP request Next.js (seperti pada skrip pengujian atau CLI).
 */
export function safeRevalidatePath(originalPath: string, type?: "page" | "layout"): void {
  try {
    revalidatePath(originalPath, type);
  } catch {
    // Abaikan kegagalan revalidasi cache di lingkungan script non-HTTP
  }
}
