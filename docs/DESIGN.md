# Design - Spesifikasi UI/UX WM-Toolkit

## Design System
shadcn/ui, Tailwind CSS, tema hijau perkebunan sawit (Emerald/Forest Green), Light/Dark Mode, Geist font, Lucide icons.

## Layout
- **Sidebar Kiri**: Dashboard, Workspace (Daftar Proyek & Monitoring), Master Data (Hub & 8 Sub-Modul), Notifikasi, Pengaturan.
- **Topbar**: Penanda wilayah operasional, Global Command Search (`Ctrl+K`), tombol reset data mock, dropdown lonceng notifikasi dinamis (indikator keterlambatan & pending approval), pengalih tema Light/Dark, dan avatar pengguna.

## Halaman Utama
- **Dashboard (`/dashboard`)**:
  - **Tab 1 (Ringkasan Operasional)**: Filter bar lokasi & status fokus, 4 Hero KPI Cards eksekutif, Dual-Track Pipeline Status Bar (Jalur Barang & Jalur Jasa paralel), Unified Multi-Project Gantt Timeline (zoom Weekly/Monthly/Quarterly, filter status baris, garis penanda Hari Ini dengan smooth auto-scroll, ekspansi WBS), serta Workstation Operasional 2-kolom (Modul A: Pusat Tindakan & EWS Kritis, Modul B: Realisasi Kurva-S Mingguan, Modul C: Pelacakan Pengadaan Barang/Jasa, dan Modul D: Live Audit Feed).
  - **Tab 2 (Pusat Jejak Audit)**: Konsol Audit Log immutable dengan metrik log, multi-filter kategori entitas, filter jenis aksi, pencarian teks bebas, ekspor CSV, dan modal dialog visualisasi *Before Data vs After Data JSON Diff*.
- **Daftar Proyek (`/workspace`)**: Tabel interaktif, pencarian multi-parameter, filter lokasi/status/varians jadwal, pengaturan densitas (comfortable/compact), ekspansi baris, pagination, aksi soft delete & tombol restore recycle bin.
- **Form Pembuatan Proyek (`/workspace/new`)**: Wizard berurutan 4 langkah (Info Umum & Lokasi, Jadwal Baseline, Anggaran & AFCE, WBS Awal) dengan indikator *circular progress ring*.
- **Detail Proyek (`/workspace/[projectId]`)**:
  - **Sticky Header**: Kode proyek, nama, status badges, nilai kemajuan total %, tombol aksi cepat (Approval AFCE, Tambah PR/PO, Input Progress), banner peringatan soft delete & pemulihan, serta tombol pemicu laci *Berkas & Diskusi*.
  - **4 Primary Integrated Tabs**:
    1. *Ringkasan Proyek* (`/workspace/[projectId]`): *Smart Action Stepper* dinamis siklus hidup proyek, kartu metrik anggaran & durasi, dan log harian terbaru.
    2. *Otorisasi AFCE* (`/workspace/[projectId]/afce`): Visualisasi matriks persetujuan berjenjang SAP, status verifikasi per jabatan, riwayat approval, dan dialog pencatatan manual.
    3. *Pengadaan & Kontrak* (`/workspace/[projectId]/procurement`): Hub terpadu Jalur Barang (PR, Evaluasi Rekanan Barang, PO, GR, BAST) dan Jalur Jasa (USPK, Evaluasi Teknis, Kontrak SPK).
    4. *Pelaksanaan & Progres* (`/workspace/[projectId]/execution`): Hub terpadu Kurva S Recharts mingguan, log harian/mingguan, struktur rincian kerja (WBS), matriks jadwal Gantt & adendum revisi waktu, serta rincian BOQ.
  - **Universal Collaboration Drawer**: Laci geser samping (*Sheet*) untuk *Berkas & Diskusi*: tab Komentar dengan mention `@user`, tab Dokumen & Google Drive simulator, serta tab Jejak Audit proyek.
  - **Sub-Rute Khusus (Direct Linkable)**: Tetap aktif mendukung deep-link langsung (`/afce`, `/pr`, `/po`, `/services`, `/uspk`, `/technical-evaluation`, `/spk`, `/progress`, `/schedule`, `/survey-boq`, `/work-items`, `/comments`, `/documents`, `/history`).
- **Pusat Notifikasi (`/notifications`)**: 6 filter tab notifikasi, kartu KPI peringatan, simulasi Vercel Cron EWS, dan sakelar konfigurasi tipe peringatan di Settings.
- **Master Data (`/master-data/*`)**: Hub pusat dan 8 sub-halaman master organisasi, katalog material, rekanan supplier, matriks approval, kategori proyek, tipe proyek, tipe pengadaan, dan manajemen pengguna.
- **Autentikasi (`/login`)**: Halaman simulasi login dengan preset peran akun (Admin, PIC, Viewer).

## Komponen Reusable
`DataTable`, `StatusBadge`, `KPICard`, `PipelineStatusBar`, `UnifiedGantt`, `DashboardFilterBar`, `SmartActionStepper`, `CollaborationDrawer`, `ScheduleGanttMatrix`, `ScheduleRevisionDialog`, `PRRecordDialog`, `POCreateDialog`, `VendorEvaluationDialog`, `GRReceiptDialog`, `GoodsHandoverDialog`, `USPKCreateDialog`, `TechnicalEvaluationDialog`, `SPKCreateDialog`, `AFCEActionDialog`, `DailyProgressDialog`, `WeeklyProgressDialog`, `AuditLogViewer`, `AuditLogDetailDialog`, `AttachmentPreview`.
