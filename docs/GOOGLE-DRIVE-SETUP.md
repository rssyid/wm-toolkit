# Panduan Pengaturan Kredensial Google Drive API (WM-Toolkit)

Dokumen ini memandu langkah demi langkah pembuatan kredensial **Google Drive API** untuk penyimpanan tangkapan layar bukti otorisasi SAP, berkas kontrak, foto progres fisik kebun, dan lampiran dokumen proyek WM-Toolkit.

---

## 1. Mengapa Menggunakan Google Service Account? (Rekomendasi Utama)

Pada aplikasi operasional holding/perkebunan seperti **WM-Toolkit**, metode **Google Service Account** adalah pilihan terbaik karena:
1. **Otomatis & Server-to-Server**: Pengguna (PIC kebun, Estate Manager, Admin) tidak perlu login ke akun Google masing-masing saat mengunggah foto lapangan atau bukti SAP.
2. **Penyimpanan Terpusat**: Seluruh file proyek tersimpan rapi di satu Google Drive Folder milik perusahaan (misal: `WM-Toolkit-Arsip-Proyek`).
3. **Aman di Vercel**: Kunci otentikasi berupa Service Account Private Key tersimpan aman di Environment Variables Vercel dan tidak terekspos ke browser pengguna.

---

## 2. Langkah-demi-Langkah Pengaturan di Google Cloud Console

### Langkah 1: Buat Project di Google Cloud Console
1. Buka peramban dan masuk ke **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Masuk menggunakan akun Google / Google Workspace perusahaan Anda.
3. Di bagian kiri atas samping logo *Google Cloud*, klik menu dropdown pemilih project, lalu klik **"New Project"**.
4. Masukkan nama project: `WM-Toolkit-Production` (atau sesuai standar holding).
5. Klik **Create** dan tunggu beberapa detik hingga project selesai dibuat.
6. Pastikan project yang baru dibuat telah terpilih aktif di bagian atas.

---

### Langkah 2: Aktifkan Google Drive API
1. Buka menu navigasi utama (ikon garis tiga di pojok kiri atas).
2. Pilih menu **APIs & Services** > **Library**.
3. Di kolom pencarian (*Search for APIs & Services*), ketik: `Google Drive API`.
4. Klik kartu **Google Drive API**, kemudian klik tombol **Enable (Aktifkan)**.
5. Tunggu hingga status API menjadi aktif.

---

### Langkah 3: Buat Service Account & Unduh Kunci JSON
1. Masuk ke menu **APIs & Services** > **Credentials**.
2. Di bagian atas layar, klik **+ CREATE CREDENTIALS**, lalu pilih **Service Account**.
3. Isi informasi Service Account:
   - **Service account name**: `wm-toolkit-uploader`
   - **Service account ID**: akan terisi otomatis, misalnya `wm-toolkit-uploader@wm-toolkit-prod.iam.gserviceaccount.com`.
   - **Description**: `Akun otomatis untuk upload arsip proyek WM-Toolkit`.
4. Klik **Create and Continue**.
5. Pada langkah *Grant this service account access to project* (opsional), Anda dapat memilih peran **Editor** atau lewati dengan klik **Continue**.
6. Klik **Done**.
7. Anda akan diarahkan kembali ke daftar Credentials. Pada tabel **Service Accounts**, klik nama service account yang baru saja dibuat (`wm-toolkit-uploader@...`).
8. Masuk ke tab **KEYS (Kunci)** di bagian atas.
9. Klik tombol **ADD KEY** > pilih **Create new key**.
10. Pilih tipe kunci: **JSON**, lalu klik **Create**.
11. Sebuah berkas file `.json` akan otomatis terunduh ke komputer Anda. Simpan berkas ini di tempat yang sangat aman dan **JANGAN PERNAH** meng-commit berkas ini ke GitHub!

---

### Langkah 4: Buat Folder di Google Drive & Berikan Izin Akses

> [!IMPORTANT]
> **Kebijakan Kuota Google Service Account:**
> Google Cloud Service Account secara default memiliki **kuota 0 Bytes**.
> - **Jika Anda menggunakan Google Workspace Perusahaan/Kampus:** Gunakan menu **"Drive Bersama" (Shared Drive)**, BUKAN folder biasa di "Drive Saya". Masukkan Service Account sebagai anggota dengan peran **Content Manager**.
> - **Jika Anda menggunakan Akun Pribadi (`@gmail.com`):** Akun pribadi tidak mendukung upload Service Account. Gunakan metode **OAuth 2.0 Refresh Token** (lihat Bagian 4 di bawah).

#### Cara A: Untuk Google Workspace (Shared Drive / Drive Bersama)
1. Buka **[Google Drive](https://drive.google.com/)**.
2. Di bilah samping kiri, klik **Drive Bersama (Shared drives)**.
3. Klik kanan &rarr; **Drive bersama baru (New shared drive)**, beri nama misalnya: `WM-Toolkit-Drive`.
4. Buka Drive Bersama tersebut, klik **Kelola anggota (Manage members)** di kanan atas.
5. Tambahkan email Service Account Anda: `wm-toolkit-uploader@...iam.gserviceaccount.com` dengan peran **Pengelola konten (Content manager)**.
6. Salin ID dari URL browser (setelah `/folders/` atau `/drives/`) untuk variabel `GOOGLE_DRIVE_FOLDER_ID`.

---

### Langkah 5: Konfigurasi Environment Variables

Buka file JSON Service Account yang Anda unduh pada Langkah 3 menggunakan text editor (Notepad atau VS Code). Anda akan melihat struktur seperti ini:
```json
{
  "type": "service_account",
  "project_id": "wm-toolkit-prod",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6...\n-----END PRIVATE KEY-----\n",
  "client_email": "wm-toolkit-uploader@wm-toolkit-prod.iam.gserviceaccount.com",
  "client_id": "..."
}
```

#### A. Pada file `.env` lokal:
Tambahkan nilai-nilai berikut ke dalam berkas `.env` proyek:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL="wm-toolkit-uploader@wm-toolkit-prod.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="1A2b3C4d5E6f7G8h9I0jKLMNOPQRSTUVWXYZ"
```
*(Catatan: pastikan `\n` pada private key tetap tertulis persis seperti di JSON).*

#### B. Pada Dashboard Vercel (Produksi):
1. Buka project Anda di [Vercel Dashboard](https://vercel.com).
2. Masuk ke **Settings** > **Environment Variables**.
3. Tambahkan 3 variabel:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (tempel seluruh isi string `-----BEGIN...END PRIVATE KEY-----\n`)
   - `GOOGLE_DRIVE_FOLDER_ID`
4. Klik **Save**. Variabel ini akan otomatis berlaku pada deployment berikutnya.

---

## 3. Skrip Pengujian Koneksi Google Drive

Untuk memverifikasi apakah akun Service Account Anda sudah dapat terhubung dan memiliki izin menulis ke folder Google Drive, jalankan perintah berikut di terminal:

```bash
pnpm tsx scripts/test-google-drive.ts
```

Skrip akan memeriksa:
- Ketersediaan environment variables
- Akses autentikasi ke Google Drive API
- Kemampuan membuat berkas pengujian di folder target dan menghapusnya kembali.

---

## 4. Alternatif Akun Pribadi (@gmail.com): OAuth 2.0 Refresh Token

Jika Anda tidak menggunakan Google Workspace perusahaan dan menggunakan akun pribadi `@gmail.com`, Google mewajibkan penggunaan **OAuth 2.0** agar berkas yang diunggah menggunakan kuota 15 GB akun pribadi Anda:

1. Di **Google Cloud Console** > **APIs & Services** > **OAuth consent screen**:
   - Pilih **External** > Masukkan App name (misal: `WM-Toolkit`) & email Anda.
   - Pada tab **Test users**, tambahkan email `@gmail.com` Anda.
2. Di **APIs & Services** > **Credentials**:
   - Klik **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Application type: **Web application**.
   - Pada **Authorized redirect URIs**, masukkan: `http://localhost:3099/oauth2callback`
   - Klik **Create** dan salin **Client ID** serta **Client Secret**.
3. Jalankan skrip generator otomatis di terminal:
   ```bash
   pnpm tsx scripts/get-google-refresh-token.ts <CLIENT_ID> <CLIENT_SECRET>
   ```
4. Buka tautan yang muncul di browser, klik izinkan (Allow), dan skrip akan secara otomatis menampilkan `GOOGLE_REFRESH_TOKEN` di terminal.
5. Simpan di file `.env`:
   ```env
   GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
   GOOGLE_REFRESH_TOKEN="1//xxx"
   GOOGLE_DRIVE_FOLDER_ID="xxx"
   ```
