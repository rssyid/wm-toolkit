# Workflow - Alur Proses WM-Toolkit (Pencatatan Manual Berbasis SAP)

## Konsep
WM-Toolkit adalah aplikasi PENCATATAN. Approval AFCE dicatat manual berdasarkan SAP.
Setelah AFCE approved, alur bercabang menjadi dua jalur paralel.

## Alur Utama
```
User buat proyek (PLANNED)
   → PIC buat AFCE (DRAFT) + isi data sesuai SAP
   → User catat approval per level jabatan (dari matriks):
       nama approver, jabatan, tanggal, aksi (APPROVED/REJECTED), catatan, bukti SAP
   → Semua level tercatat → status AFCE: APPROVED
   → AFCE mendapat persetujuan investasi & kode budget dari Direksi
        |
        ├── JALUR BARANG:
        │     PR dibuat & release
        │     → Evaluasi Vendor dicatat (evaluator, tanggal, hasil)
        │     → PO dibuat (1 PR : banyak PO) → release
        │     → Serah Terima Barang dicatat (tanggal, pihak, berita acara)
        │
        └── JALUR JASA:
              USPK dibuat (usulan vendor, nilai, tanggal, scope)
              → Evaluasi Teknis dicatat (evaluator, tanggal, hasil)
              → SPK dibuat/release (1 USPK : 1 SPK)
              → Pelaksanaan Proyek = progress harian/mingguan
   → Proyek selesai (COMPLETED)
```

Satu proyek BISA menjalankan kedua jalur sekaligus.

## Matriks Approval
Admin definisikan: level (1,2,3...), jabatan, urutan wajib.
User isi realisasi per level: nama, jabatan, tanggal, aksi, catatan, bukti SAP.

## Notifikasi
| Trigger | Penerima | Tipe |
|---|---|---|
| Proyek lewat target_end_date | PIC + Admin | LATE_PROJECT |
| AFCE belum lengkap approval | PIC | PENDING_APPROVAL |
| Tugas baru | PIC | NEW_TASK |
| Mendekati deadline (H-3, H-1) | PIC | DEADLINE_REMINDER |

## Soft Delete
projects, afce, PR, PO, USPK, SPK punya deleted_at; delete = set deleted_at; ada restore.
