# WM-Toolkit - Estate Civil & Technical Project Monitoring (UI Mockup)

A modern, high-density, interactive internal operations tool built with **Next.js App Router (TypeScript)**, **Tailwind CSS**, and **shadcn/ui** components for monitoring technical estate work in agricultural/estate engineering (civil infrastructure, water gates, drainage channels, road maintenance, and material procurement).

---

## Key Features

1. **End-to-End Estate Project Lifecycle**:
   - **AFCE Initiation & Tiered Approval Matrix** (Estate Manager $\le$ 100M, Area Manager 100-500M, Head Office $>$ 500M).
   - **PR (Purchase Requisition) Tracking** with SAP doc references.
   - **Multi-PO Generation from PRs** linked to registered vendors.
   - **Material Receipt (Goods Receipt / GR)** with automatic partial/full quantity deductions and item status transitions (`Ordered` $\rightarrow$ `Partially Received` $\rightarrow$ `Received`).
   - **Unified Multi-Project Gantt Visualization**:
     - Baseline bars (Gray), revision extension bars (Yellow), `#` progress markers, and completion checkmarks.
     - Weekly, Monthly, and Quarterly zoom levels.
     - Filter by Running, Delayed, and Pending Approval.
   - **Physical Progress Tracking**:
     - Daily site logs with manpower count, weather conditions (Cerah/Hujan/Berawan), volume calculation, and site photo previews.
     - Weekly progress S-Curve comparison (Plan vs Actual) with interactive Recharts line charts.
     - Work-item weighted contribution to overall project progress.
   - **Schedule Revision (Addendum)** retaining baseline schedule history.
   - **Comprehensive Master Data CRUD**:
     - Locations/Estates (`/master-data/locations`)
     - Material Catalog SAP (`/master-data/materials`)
     - Suppliers & Contractors (`/master-data/suppliers`)
     - Users & Roles (`/master-data/users`)
     - Approval Matrix Configuration (`/master-data/approval-matrix`)
     - Project Types & Procurement Methods
   - **Settings & Theme**:
     - Dark / Light / System theme toggle.
     - Table density toggle (Comfortable vs Compact).
     - Global Command Palette search (Ctrl+K).
     - One-click "Reset Mock Data" to restore clean demo state.

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
- `/workspace/[projectId]` - Project Detail shell with 10 interactive tabs:
  - `Overview` - Executive summary, AFCE & schedule status, latest logs.
  - `Work Items` - WBS table with add/edit work item modal.
  - `Schedule` - Baseline vs revised schedule bars, revision history, and Revise Schedule modal.
  - `Survey & BOQ` - Topography survey data and Bill of Quantities table.
  - `AFCE Approval` - AFCE tiered matrix, SAP screenshot mock, approve/revise/reject actions with mandatory notes.
  - `PR Tracking` - PR release recording form and linked PO counter.
  - `PO & Materials` - Multi-line material items, partial/full Goods Receipt (GR) modal with auto-deduction.
  - `Progress` - Plan vs Actual S-Curve chart (Recharts) and daily/weekly logs.
  - `Documents` - Central document repository with attachment preview modal.
  - `History & Audit` - Chronological audit trail of all project events.
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
