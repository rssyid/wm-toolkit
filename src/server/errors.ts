import { ZodError } from "zod";

/** Mengubah galat apa pun menjadi pesan Bahasa Indonesia yang aman ditampilkan ke pengguna. */
export function formatActionError(err: unknown, fallback = "Terjadi kesalahan pada server."): string {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    if (!first) return "Data yang dikirim tidak valid.";
    const field = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
    return `${field}${first.message}`;
  }
  if (err instanceof Error) {
    if (err.message.startsWith("UNAUTHORIZED") || err.message.startsWith("FORBIDDEN")) {
      return err.message.replace(/^(UNAUTHORIZED|FORBIDDEN):\s*/, "");
    }
    const code = (err as { code?: string }).code;
    if (code === "P2002") return "Data dengan nilai unik yang sama sudah ada.";
    if (code === "P2003") {
      const isDeleteOp =
        err.message.includes(".delete(") ||
        err.message.includes(".deleteMany(") ||
        /menghapus|mengarsipkan/i.test(fallback);
      return isDeleteOp
        ? "Data masih dipakai oleh data lain sehingga tidak dapat diubah atau dihapus."
        : "Referensi data terkait tidak ditemukan atau tidak valid.";
    }
    if (code === "P2025") return "Data tidak ditemukan.";
    if (code?.startsWith("P")) return fallback;
    return err.message || fallback;
  }
  return fallback;
}
