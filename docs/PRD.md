# PRD — Product Requirements Document

## 1. Tujuan
Membangun WM-Toolkit untuk mencatat & memonitor proyek teknis perkebunan sawit. Setelah AFCE disetujui, alur bercabang menjadi jalur Barang dan jalur Jasa.

## 2. Target Pengguna
- Admin: kelola user & master data, definisikan matriks approval
- PIC: kelola proyek, catat approval, update progress
- Viewer: pantau

## 3. Fitur MVP (semua wajib rilis pertama)

### F1. CRUD Proyek + Progress
- Buat/edit/hapus (soft delete + restore) proyek
- Field: kode, nama, deskripsi, PIC, status, tanggal, progress %
- Progress harian/mingguan + foto

### F2. Pencatatan Approval AFCE (Manual Berbasis SAP)
- Admin definisikan matriks: level + jabatan
- User catat realisasi per level: nama approver, jabatan, tanggal, aksi (APPROVED/REJECTED), catatan, bukti SAP
- Status AFCE: DRAFT → IN_REVIEW → APPROVED/REJECTED

### F3. Jalur Barang: PR → Evaluasi Vendor → PO → Serah Terima
- PR terhubung ke AFCE, nomor PR + nomor SAP, status release
- Evaluasi Vendor: entitas tersendiri (evaluator, tanggal, hasil, catatan)
- PO terhubung ke PR (1 PR : N PO), berisi data barang
- Serah Terima Barang: entitas tersendiri (tanggal, pihak, berita acara, status)

### F4. Jalur Jasa: USPK → Evaluasi Teknis → SPK → Pelaksanaan
- USPK terhubung langsung ke AFCE, berisi usulan vendor, nilai, tanggal, scope
- Evaluasi Teknis: entitas tersendiri (evaluator, tanggal, hasil, catatan)
- SPK terhubung ke USPK (1 USPK : 1 SPK), nomor, vendor, nilai, tanggal, status
- Pelaksanaan Proyek = progress harian/mingguan

### F5. Komentar & Mention
- Komentar per proyek, mention @user

### F6. Google Drive Integration
- Link file atau upload langsung, terhubung ke proyek

### F7. Notifikasi & Reminder
- Trigger: proyek terlambat, belum approval, tugas baru, reminder deadline
- On/off per tipe per user

### F8. Pencarian, Filter, Sorting, Pagination
- Cari nama proyek; filter status/PIC/tanggal; sorting semua kolom; pagination

### F9. Dashboard & Laporan
- Ringkasan status, progress, approval pending, proyek terlambat + chart
- Dual-track pipeline status bar (Jalur Pengadaan Barang vs Pekerjaan Jasa)
- Unified multi-project Gantt timeline terpadu (kontrol zoom mingguan, bulanan, kuartalan)
- Workstation operasional: antrean AFCE, peringatan EWS, Kurva S mingguan, dan live audit feed

### F10. Audit Log
- Catat semua aksi: siapa, apa, kapan, before/after data; immutable

## 4. Non-Functional
- Responsif, Bahasa Indonesia, load < 3 detik untuk 200 proyek

## 5. Out of Scope
- Email/WhatsApp notifikasi, kalender, API publik, multi-tenant, monetisasi
