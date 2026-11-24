# WM-Toolkit - Estate Civil & Technical Project Monitoring

Aplikasi internal berbasis web untuk pencatatan dan pemantauan proyek teknis perkebunan sawit (infrastruktur air, tanggul, drainase, jembatan, jalan, dan pengadaan barang/jasa), dibangun dengan Next.js App Router (TypeScript), Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL (Neon), NextAuth, dan Google Drive API.

---

## Key Features

1. **End-to-End Estate Project Lifecycle**:
   - **AFCE Initiation & 9-Level Approval Matrix** (`WM -> EM -> GEM -> RH -> PH -> MCA -> CFO -> COO -> Chairman` berdasarkan tier nilai anggaran).
   - **Dual-Track Procurement Hub (`/workspace/[projectId]/procurement`)**:
     - Jalur Barang: PR -> Evaluasi Vendor (`RECOMMENDED`) -> PO Multi-Item -> Goods Receipt (GR) -> BAST.
     - Jalur Jasa: USPK -> Evaluasi Teknis (`RECOMMENDED`) -> Kontrak SPK 1:1.
   - **Unified Multi-Project Gantt Visualization** (`Weekly`, `Monthly`, `Quarterly` zoom, revisi addendum, dan filter status).
   - **Execution & Progress Hub (`/workspace/[projectId]/execution`)**:
     - Kurva-S Recharts (Plan vs Actual), Log Harian & Mingguan, WBS, Matriks Jadwal Mingguan, Adendum Waktu, dan Survey/BOQ.
   - **Master Data Terpadu (`/master-data/*`)**: Organisasi/Kebun, Kategori/Tipe Proyek & Pengadaan, Material SAP, Supplier, Pengguna, RBAC, dan Matriks Approval AFCE.
   - **Auth, Audit Trail & Cloud Storage**: NextAuth Credentials, PostgreSQL Immutable Audit Log, dan integrasi unggah Google Drive API (fail-fast apabila kredensial belum terpasang).

2. **Localization & Styling**:
   - Indonesian Rupiah currency formatting (`Rp 120.000.000`).
   - Indonesian date formatting (`23 Okt 2026`).
   - Dense enterprise operations aesthetic with emerald/forest engineering accent.

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on Node v24)
- pnpm or npm

### Installation

```bash
# Clone or navigate to the directory
cd "d:\Web Dev\PM"

# Install dependencies
pnpm install
```

### Running the Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. It will automatically redirect to the interactive `/dashboard`.

### Building for Production

```bash
pnpm run build
pnpm start
```

---

## Application Structure

- `/dashboard` - 7 KPI metric cards, Unified multi-project Gantt timeline, 5 operational status widgets.
- `/workspace` - Project portfolio table with dense filters, search, EWS status, and pagination.
- `/workspace/new` - 4-Step stepper wizard (Basic Info, Baseline Schedule, Work Items & 100% Weight check, Review & Save).
- `/workspace/[projectId]` - Project Detail shell dengan hub utama:
  - `Ringkasan` (`/workspace/[projectId]`) - Ikhtisar eksekutif, Smart Action Stepper, AFCE & jadwal.
  - `Otorisasi AFCE` (`/workspace/[projectId]/afce`) - Matriks 9 level (`WM..Chairman`) dan pencatatan approval manual SAP.
  - `Pengadaan` (`/workspace/[projectId]/procurement`) - Hub Jalur Barang (`?track=barang`) & Jalur Jasa (`?track=jasa`). Rute `/pr`, `/po`, `/services`, `/uspk`, `/technical-evaluation`, `/spk` dialihkan otomatis ke hub ini.
  - `Pelaksanaan` (`/workspace/[projectId]/execution`) - Hub Kurva-S, Log Harian/Mingguan (`?tab=progress`), WBS (`?tab=wbs`), Jadwal Gantt (`?tab=schedule`), Survey/BOQ (`?tab=boq`). Rute `/progress`, `/work-items`, `/schedule`, `/survey-boq` dialihkan otomatis ke hub ini.
  - `Riwayat Audit` (`/workspace/[projectId]/history`), `Dokumen` (`/documents`), dan `Diskusi` (`/comments`).
- `/master-data/*` - CRUD management for locations, materials, suppliers, users, and approval matrix.
- `/settings` - Preferences, table density, notifications, SAP validations, and demo reset.

---

## Interactive Testing Scenarios

1. **Create a Project**:
   - Click `+ Tambah Proyek` in the top right.
   - Complete Step 1 (Code, Name, AFCE, Estate).
   - In Step 2, pick dates to see auto-calculated duration.
   - In Step 3, configure work items with weights summing to 100%.
   - In Step 4, click Save. Notice the toast and redirection to the new project detail!

2. **Simulate Tiered AFCE Approval**:
   - Open project `PRJ-2026-004` (Box Culvert, Rp 560M).
   - Go to the **AFCE Approval** tab.
   - Click **Approve AFCE**, enter a note, and submit.
   - Notice the status advances to Level 3 (Head Office) per the matrix rule!

3. **Record Partial Material Receipt (GR)**:
   - Go to **PO & Materials** in `PRJ-2026-001`.
   - Click `+ Catat GR` on a PO.
   - Enter a received volume (e.g. 50 out of 150).
   - Submit and observe that the remaining volume decreases to 100 and status updates to `Partially Received`.

4. **Add Daily Progress & Plan vs Actual Chart**:
   - Go to the **Progress** tab and click `+ Log Harian`.
   - Enter today's activity, manpower, weather, and volume.
   - The cumulative progress updates and recalculates overall project completion!
