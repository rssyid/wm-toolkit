/**
 * Mengonversi rekursif nilai hasil query Prisma (khususnya instance Decimal)
 * menjadi objek polos JavaScript agar aman dikirim dari Server Component/Action ke Client Component.
 */
export function toPlainObject<T>(value: T): T {
  if (value === null || value === undefined || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPlainObject(item)) as unknown as T;
  }

  const candidate = value as { toNumber?: unknown };
  if (typeof candidate.toNumber === "function") {
    return (candidate.toNumber as () => number)() as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = toPlainObject(entry);
  }
  return out as T;
}
