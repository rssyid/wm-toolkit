# Architecture - Arsitektur WM-Toolkit

## High-Level
```
[Browser] <-> [Next.js (Vercel)] <-> [PostgreSQL]
                     |
                     +--> [Google Drive API]
                     +--> [Vercel Cron] -> notifikasi/reminder
```

## Stack
| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui |
| Backend | Server Actions + API Routes |
| Database | PostgreSQL (Neon/Supabase) |
| ORM | Prisma |
| Auth | NextAuth (Credentials) |
| File | Google Drive API |
| Deploy | Vercel + GitHub Actions |
| Cron | Vercel Cron |

## Pola
- Monolith Next.js
- Server Components (read) + Server Actions (mutasi)
- Zod validasi
- Audit log immutable

## Alur Data Utama (Dua Cabang setelah AFCE)
```
AFCE approved
   ├── Jalur Barang:
   │     PR → Evaluasi Vendor → PO (1:N) → Serah Terima Barang
   │
   └── Jalur Jasa:
         USPK → Evaluasi Teknis → SPK (1:1) → Pelaksanaan Proyek (progress)
```
Satu proyek bisa menjalankan kedua jalur sekaligus.

## Notifikasi
Cron harian cek proyek terlambat & deadline → buat notifikasi.
