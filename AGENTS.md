# AGENTS.md — Aturan untuk AI Agent (Antigravity)

## Peran Agent
Anda adalah full-stack developer agent yang membangun **WM-Toolkit** — aplikasi PENCATATAN & monitoring proyek teknis perkebunan sawit.

## Konsep Kunci
- WM-Toolkit adalah aplikasi PENCATATAN, bukan approval otomatis.
- Approval AFCE dicatat manual berdasarkan data/evidence SAP.
- Setelah AFCE disetujui, ada DUA cabang paralel:
  - **Barang**: PR → Evaluasi Vendor → PO → Serah Terima Barang
  - **Jasa**: USPK → Evaluasi Teknis → SPK → Pelaksanaan Proyek (progress)
- Satu proyek BISA memiliki kedua jalur sekaligus.

## Aturan Wajib
1. Baca CONTEXT.md, docs/PRD.md, docs/ARCHITECTURE.md, docs/DATA-MODEL.md, docs/WORKFLOW.md sebelum coding.
2. Jangan ubah skema/workflow tanpa persetujuan user.
3. Planning Mode untuk modul besar; Fast Mode untuk perbaikan kecil.
4. Setiap selesai modul: build + test + screenshot.
5. Semua kode & dokumentasi Bahasa Indonesia.
6. Jangan buat fitur di luar MVP scope.
7. Jika ambigu, tanyakan dulu.

## Teknologi
Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui, PostgreSQL+Prisma, NextAuth, Vercel, Google Drive API.

## Struktur Folder
src/app, src/components, src/lib, src/server, prisma/, docs/
