# CONTEXT.md — Konteks Proyek WM-Toolkit

## Deskripsi
WM-Toolkit: aplikasi web untuk MENCATATAN dan memonitor proyek teknis perkebunan sawit. Setelah AFCE disetujui, alur bercabang menjadi dua jalur paralel:

- **Jalur Barang**: PR → Evaluasi Vendor → PO → Serah Terima Barang
- **Jalur Jasa**: USPK → Evaluasi Teknis → SPK → Pelaksanaan Proyek (progress)

Satu proyek bisa memiliki kedua jalur sekaligus.

**Penting:** Approval AFCE dicatat MANUAL berdasarkan data SAP.

## Pengguna & Role
- Admin: kelola user & data, definisikan matriks approval
- PIC: kelola proyek, catat approval, update progress
- Viewer: pantau
Semua bisa lihat semua data; semua bisa edit; audit log aktif; unlimited users.

## Skala
- Pengguna aktif: < 20
- Proyek aktif: 50–200

## Keputusan Penting
- Validasi: field wajib (*), error inline, konfirmasi hapus, soft delete + restore
- Integrasi: hanya Google Drive (link/upload)
- Hosting: Vercel, subdomain default, CI/CD otomatis, tanpa backup otomatis
- Notifikasi: proyek terlambat, belum approval, tugas baru, reminder deadline; on/off per tipe
- Pencarian: nama proyek; filter status/PIC/tanggal; sorting semua kolom; pagination
- MVP: SEMUA fitur masuk rilis pertama
- Bahasa: Indonesia
- Open source, tanpa monetisasi
