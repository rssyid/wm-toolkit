import {
  AFCEDocument,
  DailyProgressRecord,
  GoodsHandover,
  Project,
  PurchaseOrder,
  PurchaseRequisition,
  SPKContract,
  TechnicalEvaluation,
  USPKItem,
  UserProfile,
  VendorEvaluation,
  WeeklyProgressRecord,
} from "@/types";

export type OnboardingStepId =
  | "profile-setup"
  | "create-project"
  | "afce-approval"
  | "goods-track"
  | "service-track"
  | "execution-progress"
  | "reports-monitoring";

export type OnboardingPhase =
  | "Persiapan"
  | "Inisiasi"
  | "Otorisasi"
  | "Jalur Barang"
  | "Jalur Jasa"
  | "Pelaksanaan"
  | "Pelaporan";

export type OnboardingBranch = "core" | "barang" | "jasa" | "closing";

export interface OnboardingStoragePayload {
  version: 1;
  welcomeDismissed: boolean;
  welcomeDismissedAt: string | null;
  dashboardWidgetHidden: boolean;
  manualCompletedStepIds: OnboardingStepId[];
  visitedReports: boolean;
  updatedAt: string;
}

export interface OnboardingDetectionContext {
  activeUserId: string | null;
  userProfile: UserProfile;
  projects: Project[];
  afces: AFCEDocument[];
  prs: PurchaseRequisition[];
  vendorEvaluations: VendorEvaluation[];
  pos: PurchaseOrder[];
  goodsHandovers: GoodsHandover[];
  uspks: USPKItem[];
  technicalEvaluations: TechnicalEvaluation[];
  spkContracts: SPKContract[];
  dailyProgress: DailyProgressRecord[];
  weeklyProgress: WeeklyProgressRecord[];
  visitedReports: boolean;
}

export interface OnboardingStepDef {
  id: OnboardingStepId;
  order: number;
  phase: OnboardingPhase;
  branch: OnboardingBranch;
  title: string;
  shortSummary: string;
  objective: string;
  estimatedMinutes: number;
  prerequisites: string[];
  guardrails: string[];
  actions: string[];
  actionLabel: (ctx: OnboardingDetectionContext) => string;
  resolveHref: (ctx: OnboardingDetectionContext) => string;
  detectCompleted: (ctx: OnboardingDetectionContext) => boolean;
}

export interface OnboardingStepView extends OnboardingStepDef {
  isAutoCompleted: boolean;
  isManualCompleted: boolean;
  isCompleted: boolean;
  resolvedHref: string;
  resolvedActionLabel: string;
}

export interface GlossaryItem {
  term: string;
  fullName: string;
  category: "Otorisasi" | "Jalur Barang" | "Jalur Jasa" | "Pelaksanaan" | "Sistem";
  description: string;
}

export interface GuideFaqItem {
  id: string;
  question: string;
  answer: string;
  relatedStepId?: OnboardingStepId;
}

const VALID_STEP_IDS = new Set<OnboardingStepId>([
  "profile-setup",
  "create-project",
  "afce-approval",
  "goods-track",
  "service-track",
  "execution-progress",
  "reports-monitoring",
]);

export const DEFAULT_ONBOARDING_STORAGE: OnboardingStoragePayload = {
  version: 1,
  welcomeDismissed: false,
  welcomeDismissedAt: null,
  dashboardWidgetHidden: false,
  manualCompletedStepIds: [],
  visitedReports: false,
  updatedAt: "",
};

/**
 * Prefix sengaja memakai "onboarding.wm_toolkit.v1." (bukan "wm_" atau "wm-toolkit")
 * agar tidak ikut terhapus oleh rutinitas pembersihan kunci cache saat logout di AppTopbar.
 */
export function getOnboardingStorageKey(userId: string): string {
  return `onboarding.wm_toolkit.v1.${userId}`;
}

export function readOnboardingStorage(userId: string): OnboardingStoragePayload {
  if (typeof window === "undefined" || !userId) {
    return { ...DEFAULT_ONBOARDING_STORAGE };
  }

  try {
    const raw = window.localStorage.getItem(getOnboardingStorageKey(userId));
    if (!raw) {
      return { ...DEFAULT_ONBOARDING_STORAGE };
    }
    const parsed = JSON.parse(raw) as Partial<OnboardingStoragePayload>;
    const manualCompletedStepIds = Array.isArray(parsed.manualCompletedStepIds)
      ? parsed.manualCompletedStepIds.filter((id): id is OnboardingStepId =>
          VALID_STEP_IDS.has(id as OnboardingStepId)
        )
      : [];

    return {
      version: 1,
      welcomeDismissed: Boolean(parsed.welcomeDismissed),
      welcomeDismissedAt:
        typeof parsed.welcomeDismissedAt === "string"
          ? parsed.welcomeDismissedAt
          : null,
      dashboardWidgetHidden: Boolean(parsed.dashboardWidgetHidden),
      manualCompletedStepIds,
      visitedReports: Boolean(parsed.visitedReports),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return { ...DEFAULT_ONBOARDING_STORAGE };
  }
}

export function writeOnboardingStorage(
  userId: string,
  payload: OnboardingStoragePayload
): void {
  if (typeof window === "undefined" || !userId) return;

  try {
    const nextPayload: OnboardingStoragePayload = {
      ...payload,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      getOnboardingStorageKey(userId),
      JSON.stringify(nextPayload)
    );
  } catch {
    // Abaikan jika penyimpanan lokal dibatasi kuota atau mode privat
  }
}

/**
 * Memilih proyek aktif sebagai acuan tautan cepat onboarding.
 * Prioritas: proyek aktif yang ditugaskan kepada user aktif, lalu proyek aktif pertama.
 */
export function pickReferenceProject(
  projects: Project[],
  activeUserId: string | null
): Project | null {
  const activeProjects = projects.filter((p) => !p.deletedAt);
  if (activeProjects.length === 0) return null;

  if (activeUserId) {
    const assigned = activeProjects.find((p) => p.picId === activeUserId);
    if (assigned) return assigned;
  }

  return activeProjects[0];
}

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: "profile-setup",
    order: 1,
    phase: "Persiapan",
    branch: "core",
    title: "Lengkapi Profil & Preferensi Notifikasi",
    shortSummary:
      "Pastikan nama, jabatan, lokasi kebun utama, dan pengingat deadline aktif.",
    objective:
      "Menjamin identitas PIC pada dokumen audit log, penugasan proyek, dan unit kebun di topbar tercatat akurat serta memastikan notifikasi keterlambatan aktif.",
    estimatedMinutes: 2,
    prerequisites: [
      "Sudah masuk ke aplikasi menggunakan akun yang dibuat oleh Admin.",
    ],
    guardrails: [
      "Perubahan unit kebun pada profil membantu identifikasi wilayah kerja Anda pada topbar dan catatan aktivitas.",
    ],
    actions: [
      "Buka menu Pengaturan di sidebar kiri atau klik avatar profil Anda di pojok kanan atas lalu pilih Pengaturan Akun & Profil.",
      "Periksa Nama Lengkap, Jabatan operasional, serta pilih Lokasi Kebun Utama Anda.",
      "Buka bagian Preferensi Notifikasi, lalu pastikan pengingat proyek terlambat, persetujuan AFCE pending, tugas baru, dan pengingat deadline H-3/H-1 aktif.",
      "Simpan perubahan profil dan perhatikan unit kebun pada topbar ikut diperbarui.",
    ],
    actionLabel: () => "Buka Pengaturan Profil",
    resolveHref: () => "/settings",
    detectCompleted: (ctx) =>
      Boolean(
        ctx.userProfile.fullName?.trim() &&
          ctx.userProfile.selectedLocation?.trim()
      ),
  },
  {
    id: "create-project",
    order: 2,
    phase: "Inisiasi",
    branch: "core",
    title: "Buat Proyek Baru (Wizard 4 Langkah)",
    shortSummary:
      "Catat identitas proyek, lokasi blok kebun, inisiasi AFCE, jadwal baseline, dan WBS 100%.",
    objective:
      "Mendaftarkan proyek teknis perkebunan beserta struktur pekerjaan (Work Items) dan dokumen AFCE awal agar siap masuk tahap otorisasi anggaran.",
    estimatedMinutes: 5,
    prerequisites: [
      "Admin telah menyiapkan Master Data Wilayah, PT, Kebun, Blok, Kategori Proyek, dan Matriks Approval.",
    ],
    guardrails: [
      "Total bobot seluruh Work Items (WBS) pada Langkah 3 harus tepat 100% agar perhitungan kemajuan fisik proyek akurat.",
      "Proyek yang baru dibuat memiliki status awal Planned sampai otorisasi dan pelaksanaan dimulai.",
    ],
    actions: [
      "Klik tombol Tambah Proyek Baru di Dashboard atau buka menu Workspace lalu pilih Tambah Proyek.",
      "Langkah 1 (Informasi Dasar & AFCE): isi kode proyek, nama proyek, kategori, tipe proyek, PIC, lokasi wilayah/kebun/blok tanam, serta nomor, nilai, dan referensi SAP AFCE.",
      "Langkah 2 (Jadwal & Baseline): tentukan tanggal mulai baseline, tanggal selesai baseline, dan target selesai.",
      "Langkah 3 (Rincian Item Pekerjaan / WBS): tambahkan item pekerjaan fisik maupun material pendukung beserta bobot persentasenya hingga total 100%.",
      "Langkah 4 (Konfirmasi & Simpan): periksa seluruh ringkasan data dan klik Simpan Proyek.",
    ],
    actionLabel: () => "Buka Wizard Proyek Baru",
    resolveHref: () => "/workspace/new",
    detectCompleted: (ctx) => {
      const activeProjects = ctx.projects.filter((p) => !p.deletedAt);
      if (activeProjects.length === 0) return false;
      if (ctx.activeUserId) {
        const ownProject = activeProjects.some(
          (p) => p.picId === ctx.activeUserId
        );
        if (ownProject) return true;
      }
      return activeProjects.length > 0;
    },
  },
  {
    id: "afce-approval",
    order: 3,
    phase: "Otorisasi",
    branch: "core",
    title: "Catat Persetujuan AFCE Berbasis SAP",
    shortSummary:
      "Ajukan AFCE dan catat realisasi persetujuan berjenjang sesuai bukti SAP.",
    objective:
      "Memastikan seluruh level jabatan pada Matriks Approval mencatat persetujuan SAP secara manual hingga status AFCE menjadi Approved.",
    estimatedMinutes: 4,
    prerequisites: [
      "Proyek dan dokumen AFCE awal sudah tersimpan di Workspace.",
      "Data persetujuan atau nomor dokumen SAP sudah diterbitkan di sistem SAP perusahaan.",
    ],
    guardrails: [
      "WM-Toolkit adalah aplikasi PENCATATAN manual berbasis bukti SAP. Aksi di sini tidak memicu approval otomatis di sistem SAP.",
      "Selama AFCE belum berstatus Approved, tombol Tambah PR, pembuatan USPK, dan Input Progres akan dikunci oleh sistem.",
    ],
    actions: [
      "Buka proyek dari halaman Workspace, lalu pilih tab Otorisasi AFCE.",
      "Jika status AFCE masih Draft, klik Ajukan AFCE agar status berubah menjadi Pending Approval.",
      "Pada tabel Matriks Persetujuan Berjenjang, catat persetujuan tiap level jabatan wajib dengan mengisi nama approver, tanggal verifikasi, nomor dokumen SAP, tautan/bukti SAP, dan catatan.",
      "Setelah seluruh level wajib tercatat disetujui, status AFCE otomatis berubah menjadi Approved dan jalur Barang serta Jasa terbuka.",
    ],
    actionLabel: (ctx) =>
      pickReferenceProject(ctx.projects, ctx.activeUserId)
        ? "Buka Tab Otorisasi AFCE"
        : "Buat Proyek Terlebih Dahulu",
    resolveHref: (ctx) => {
      const refProject = pickReferenceProject(ctx.projects, ctx.activeUserId);
      return refProject
        ? `/workspace/${refProject.id}/afce`
        : "/workspace/new";
    },
    detectCompleted: (ctx) =>
      ctx.afces.some((a) => !a.deletedAt && a.status === "Approved"),
  },
  {
    id: "goods-track",
    order: 4,
    phase: "Jalur Barang",
    branch: "barang",
    title: "Jalankan Jalur Pengadaan Barang (PR, Evaluasi Vendor, PO, GR & BAST)",
    shortSummary:
      "Catat PR SAP, evaluasi vendor hingga Recommended, terbitkan PO, lalu catat GR dan BAST.",
    objective:
      "Mendokumentasikan seluruh siklus pengadaan material pendukung proyek dari permintaan pembelian hingga serah terima fisik di kebun.",
    estimatedMinutes: 6,
    prerequisites: [
      "Dokumen AFCE proyek sudah berstatus Approved.",
      "Katalog Material dan Supplier Rekanan tersedia di Master Data.",
    ],
    guardrails: [
      "Tombol Buat PO terkunci secara otomatis sebelum PR memiliki minimal satu Evaluasi Vendor dengan hasil RECOMMENDED.",
      "Satu PR dapat diturunkan menjadi beberapa PO (1 PR : N PO), dan satu proyek boleh menjalankan Jalur Barang serta Jalur Jasa secara paralel.",
    ],
    actions: [
      "Buka tab Pengadaan & Kontrak pada detail proyek, lalu pastikan sub-tab Jalur Barang terpilih.",
      "Klik Tambah PR untuk mencatat nomor PR internal, nomor PR SAP, tanggal rilis, dan keterkaitannya dengan Work Item.",
      "Pada baris PR tersebut, buka dialog Evaluasi Vendor dan catat hasil penilaian evaluator (pilih RECOMMENDED bagi rekanan yang lolos).",
      "Klik Buat PO dari PR yang sudah direkomendasikan, pilih supplier, lalu masukkan daftar item material beserta volume dan harga satuannya.",
      "Saat barang tiba di lokasi kebun, catat penerimaan parsial atau penuh melalui Goods Receipt (GR), lalu selesaikan Berita Acara Serah Terima (BAST).",
    ],
    actionLabel: (ctx) =>
      pickReferenceProject(ctx.projects, ctx.activeUserId)
        ? "Buka Jalur Barang"
        : "Buat Proyek Terlebih Dahulu",
    resolveHref: (ctx) => {
      const refProject = pickReferenceProject(ctx.projects, ctx.activeUserId);
      return refProject
        ? `/workspace/${refProject.id}/procurement?track=barang`
        : "/workspace/new";
    },
    detectCompleted: (ctx) =>
      ctx.prs.some((pr) => !pr.deletedAt) &&
      (ctx.vendorEvaluations.length > 0 ||
        ctx.pos.some((po) => !po.deletedAt) ||
        ctx.goodsHandovers.length > 0),
  },
  {
    id: "service-track",
    order: 5,
    phase: "Jalur Jasa",
    branch: "jasa",
    title: "Jalankan Jalur Pekerjaan Jasa (USPK, Evaluasi Teknis & SPK)",
    shortSummary:
      "Buat USPK, catat Evaluasi Teknis rekanan, lalu terbitkan dan aktifkan kontrak SPK (1:1).",
    objective:
      "Menetapkan kontrak kerja pelaksana jasa lapangan secara tertib mulai dari usulan kontraktor, uji kelaikan teknis, hingga penerbitan SPK aktif.",
    estimatedMinutes: 5,
    prerequisites: [
      "Dokumen AFCE proyek sudah berstatus Approved.",
      "Data supplier/kontraktor dan Work Item pekerjaan fisik sudah tersedia.",
    ],
    guardrails: [
      "Hubungan kontrak jasa bersifat 1 USPK : 1 SPK.",
      "Pastikan target volume dan satuan pada USPK/SPK selaras agar pencatatan progres pekerjaan jasa terhitung otomatis dengan tepat.",
    ],
    actions: [
      "Buka tab Pengadaan & Kontrak pada detail proyek, lalu pilih sub-tab Jalur Jasa.",
      "Klik Tambah USPK untuk mencatat nomor usulan, nama vendor pelaksana, ruang lingkup pekerjaan, target volume, nilai kontrak, dan periode pelaksanaan.",
      "Catat Evaluasi Teknis terhadap USPK tersebut (nama evaluator, tanggal evaluasi, skor/rekomendasi teknis, dan catatan).",
      "Terbitkan SPK resmi dari USPK yang telah disetujui/direkomendasikan, lalu ubah status SPK menjadi ACTIVE saat pekerjaan lapangan dimulai.",
    ],
    actionLabel: (ctx) =>
      pickReferenceProject(ctx.projects, ctx.activeUserId)
        ? "Buka Jalur Jasa"
        : "Buat Proyek Terlebih Dahulu",
    resolveHref: (ctx) => {
      const refProject = pickReferenceProject(ctx.projects, ctx.activeUserId);
      return refProject
        ? `/workspace/${refProject.id}/procurement?track=jasa`
        : "/workspace/new";
    },
    detectCompleted: (ctx) =>
      ctx.uspks.some((u) => !u.deletedAt) ||
      ctx.spkContracts.some((s) => !s.deletedAt),
  },
  {
    id: "execution-progress",
    order: 6,
    phase: "Pelaksanaan",
    branch: "jasa",
    title: "Catat Progres Fisik, Kurva-S & Kolaborasi Tim",
    shortSummary:
      "Input log harian/mingguan, pantau Kurva-S dan Gantt, serta unggah berkas Google Drive.",
    objective:
      "Memantau realisasi fisik di kebun terhadap rencana baseline melalui grafik Kurva-S, matriks jadwal Gantt, BOQ, serta dokumentasi lapangan.",
    estimatedMinutes: 5,
    prerequisites: [
      "Dokumen AFCE berstatus Approved dan Work Items (WBS) sudah terdaftar.",
    ],
    guardrails: [
      "Saat progres fisik mencapai 100% dan seluruh BAST/SPK selesai, perbarui status proyek menjadi Completed lewat tombol Edit Proyek di header proyek.",
      "Dokumen atau proyek yang terhapus tersimpan di arsip Recycle Bin (soft delete) dan dapat dipulihkan kembali.",
    ],
    actions: [
      "Buka tab Pelaksanaan & Progres pada detail proyek (atau klik Input Progres di header proyek).",
      "Pada sub-tab Progres, catat log harian atau laporan mingguan (pilih Work Item atau SPK, isi volume aktual, kondisi cuaca, jumlah tenaga kerja, catatan kendala, dan tautan foto).",
      "Periksa grafik Kurva-S untuk membandingkan rencana kumulatif vs realisasi mingguan, serta kelola tab WBS, Jadwal Gantt (termasuk revisi jadwal jika ada adendum), dan BOQ.",
      "Klik tombol Berkas & Diskusi di header proyek untuk menautkan/mengunggah dokumen Google Drive dan mengirim komentar dengan mention @user.",
    ],
    actionLabel: (ctx) =>
      pickReferenceProject(ctx.projects, ctx.activeUserId)
        ? "Buka Pelaksanaan & Progres"
        : "Buat Proyek Terlebih Dahulu",
    resolveHref: (ctx) => {
      const refProject = pickReferenceProject(ctx.projects, ctx.activeUserId);
      return refProject
        ? `/workspace/${refProject.id}/execution?tab=progress`
        : "/workspace/new";
    },
    detectCompleted: (ctx) =>
      ctx.dailyProgress.length > 0 || ctx.weeklyProgress.length > 0,
  },
  {
    id: "reports-monitoring",
    order: 7,
    phase: "Pelaporan",
    branch: "closing",
    title: "Pantau Dashboard, Notifikasi & Laporan Portofolio",
    shortSummary:
      "Gunakan filter Dashboard, pantau status EWS dan Notifikasi, serta ekspor laporan Excel/CSV.",
    objective:
      "Menjaga kendali keterlambatan proyek secara proaktif dan menyiapkan laporan ringkasan manajemen maupun jejak audit.",
    estimatedMinutes: 3,
    prerequisites: [
      "Minimal terdapat proyek atau aktivitas tercatat di workspace.",
    ],
    guardrails: [
      "Seluruh perubahan data di WM-Toolkit tercatat pada Pusat Jejak Audit secara permanen (immutable) untuk keperluan pemeriksaan internal.",
    ],
    actions: [
      "Buka menu Dashboard untuk memantau KPI ringkas, status pipeline Jalur Barang vs Jasa, Gantt multi-proyek, dan indikator EWS (Normal, Warning, Critical).",
      "Periksa menu Notifikasi secara berkala untuk menindaklanjuti proyek terlambat, persetujuan AFCE pending, dan pengingat deadline.",
      "Buka menu Laporan, terapkan filter kebun/status/periode sesuai kebutuhan, lalu unduh laporan ke format Excel (.xlsx), CSV, atau cetak dalam tata letak A4 lanskap.",
    ],
    actionLabel: () => "Buka Halaman Laporan",
    resolveHref: () => "/reports",
    detectCompleted: (ctx) => ctx.visitedReports,
  },
];

export const ONBOARDING_GLOSSARY: GlossaryItem[] = [
  {
    term: "AFCE",
    fullName: "Authorization for Capital Expenditure",
    category: "Otorisasi",
    description:
      "Dokumen persetujuan anggaran belanja modal proyek di SAP. Di WM-Toolkit, status approval AFCE dicatat manual berdasarkan bukti SAP hingga berstatus Approved.",
  },
  {
    term: "Matriks Approval",
    fullName: "Matriks Persetujuan Berjenjang AFCE",
    category: "Otorisasi",
    description:
      "Aturan berjenjang (hingga 9 level jabatan dari WM sampai Chairman) yang ditentukan oleh Admin berdasarkan rentang nilai investasi AFCE.",
  },
  {
    term: "WBS",
    fullName: "Work Breakdown Structure (Work Items)",
    category: "Pelaksanaan",
    description:
      "Daftar rincian paket pekerjaan fisik atau material pendukung pada suatu proyek dengan total bobot 100% sebagai dasar perhitungan progres proyek.",
  },
  {
    term: "BOQ",
    fullName: "Bill of Quantity",
    category: "Pelaksanaan",
    description:
      "Daftar rincian volume, satuan, dan harga satuan teknis dari survei lapangan yang menjadi acuan perhitungan pekerjaan proyek.",
  },
  {
    term: "PR",
    fullName: "Purchase Requisition",
    category: "Jalur Barang",
    description:
      "Dokumen permintaan pengadaan barang yang terhubung ke AFCE dan nomor PR SAP. Satu PR dapat diturunkan menjadi satu atau lebih PO.",
  },
  {
    term: "Evaluasi Vendor",
    fullName: "Penilaian Rekanan Jalur Barang",
    category: "Jalur Barang",
    description:
      "Pencatatan hasil evaluasi supplier untuk suatu PR. Status RECOMMENDED menjadi syarat wajib sistem sebelum PO dapat dibuat.",
  },
  {
    term: "PO",
    fullName: "Purchase Order",
    category: "Jalur Barang",
    description:
      "Dokumen pemesanan pembelian barang kepada supplier rekanan yang memuat daftar item material, volume, harga, dan progres penerimaan.",
  },
  {
    term: "GR",
    fullName: "Goods Receipt",
    category: "Jalur Barang",
    description:
      "Catatan penerimaan fisik barang per item material di gudang atau kebun. Mendukung penerimaan bertahap (parsial) terhadap kuantitas PO.",
  },
  {
    term: "BAST",
    fullName: "Berita Acara Serah Terima Barang (Goods Handover)",
    category: "Jalur Barang",
    description:
      "Dokumen formal serah terima barang antara pihak pengirim/supplier dan pihak penerima di kebun untuk menutup pengiriman PO.",
  },
  {
    term: "USPK",
    fullName: "Usulan Surat Perintah Kerja",
    category: "Jalur Jasa",
    description:
      "Dokumen usulan pengadaan pekerjaan jasa yang terhubung ke AFCE, berisi calon kontraktor, ruang lingkup, target volume, nilai, dan jadwal.",
  },
  {
    term: "Evaluasi Teknis",
    fullName: "Penilaian Kelaikan Teknis Rekanan Jasa",
    category: "Jalur Jasa",
    description:
      "Catatan verifikasi kelaikan teknis kontraktor pelaksana pada USPK oleh evaluator sebelum SPK resmi diterbitkan.",
  },
  {
    term: "SPK",
    fullName: "Surat Perintah Kerja",
    category: "Jalur Jasa",
    description:
      "Kontrak kerja resmi pelaksanaan jasa di lapangan yang terbit dengan rasio 1 USPK : 1 SPK dan menjadi referensi pencatatan progres pekerjaan.",
  },
  {
    term: "Kurva-S",
    fullName: "Grafik Perbandingan Rencana vs Realisasi Kumulatif",
    category: "Pelaksanaan",
    description:
      "Visualisasi perkembangan bobot atau progres mingguan untuk mendeteksi penyimpangan (varians) antara jadwal rencana dan realisasi lapangan.",
  },
  {
    term: "EWS",
    fullName: "Early Warning System",
    category: "Sistem",
    description:
      "Indikator status keterlambatan jadwal proyek (Normal, Warning, Critical) yang dihitung dari selisih hari target selesai terhadap kondisi terkini.",
  },
  {
    term: "Recycle Bin",
    fullName: "Arsip Pemulihan Penghapusan (Soft Delete)",
    category: "Sistem",
    description:
      "Tempat penampungan sementara untuk proyek, AFCE, PR, PO, USPK, atau SPK yang dihapus sehingga data masih dapat dipulihkan kembali.",
  },
];

export const ONBOARDING_FAQ: GuideFaqItem[] = [
  {
    id: "faq-sap-manual",
    question:
      "Apakah persetujuan AFCE di WM-Toolkit otomatis mengubah status di SAP?",
    answer:
      "Tidak. WM-Toolkit adalah aplikasi pencatatan dan pemantauan operasional. Persetujuan resmi tetap diproses di SAP perusahaan, lalu PIC atau Approver mencatat realisasi approval beserta nomor dokumen dan bukti SAP di tab Otorisasi AFCE.",
    relatedStepId: "afce-approval",
  },
  {
    id: "faq-locked-buttons",
    question:
      "Mengapa tombol Tambah PR, pembuatan USPK, dan Input Progres tidak bisa diklik?",
    answer:
      "Sistem mengunci pengadaan dan pencatatan progres sampai dokumen AFCE proyek mencapai status Approved. Periksa tab Otorisasi AFCE untuk memastikan semua level matriks persetujuan wajib sudah tercatat disetujui.",
    relatedStepId: "afce-approval",
  },
  {
    id: "faq-po-guardrail",
    question:
      "Mengapa tombol Buat PO masih nonaktif padahal PR sudah dicatat?",
    answer:
      "Pada Jalur Barang terdapat guardrail Evaluasi Vendor. Sistem mewajibkan minimal satu catatan Evaluasi Vendor pada PR terkait dengan hasil RECOMMENDED sebelum Anda dapat menerbitkan PO.",
    relatedStepId: "goods-track",
  },
  {
    id: "faq-parallel-tracks",
    question:
      "Apakah satu proyek dapat menjalankan Jalur Barang dan Jalur Jasa secara bersamaan?",
    answer:
      "Ya. Setelah AFCE berstatus Approved, proyek dapat mencatat pengadaan material di sub-tab Jalur Barang sekaligus mengelola kontrak kontraktor di sub-tab Jalur Jasa pada hub Pengadaan & Kontrak.",
    relatedStepId: "goods-track",
  },
  {
    id: "faq-gr-vs-bast",
    question:
      "Apa perbedaan pencatatan Goods Receipt (GR) dan Berita Acara Serah Terima (BAST)?",
    answer:
      "Goods Receipt (GR) mencatat penerimaan kuantitas per item material di gudang/kebun (bisa dilakukan bertahap sesuai pengiriman parsial). BAST mencatat dokumen formal serah terima barang keseluruhan PO antara pihak penyerah dan penerima kebun.",
    relatedStepId: "goods-track",
  },
  {
    id: "faq-soft-delete",
    question:
      "Bagaimana jika proyek, AFCE, PR, PO, USPK, atau SPK tidak sengaja terhapus?",
    answer:
      "Seluruh entitas utama menggunakan mekanisme soft delete. Proyek terhapus dapat dipulihkan melalui tab Recycle Bin di halaman Workspace, sedangkan arsip AFCE, PR, PO, USPK, dan SPK dapat ditampilkan melalui toggle arsip di masing-masing halaman proyek.",
    relatedStepId: "execution-progress",
  },
  {
    id: "faq-gdrive-mention",
    question:
      "Bagaimana cara melampirkan berkas Google Drive dan menyebut rekan tim di proyek?",
    answer:
      "Buka detail proyek lalu klik tombol Berkas & Diskusi di bagian header proyek. Di dalam panel tersebut tersedia tab Berkas Digital (untuk tautan link atau unggah file ke Google Drive) dan tab Komentar & Diskusi yang mendukung @mention rekan tim.",
    relatedStepId: "execution-progress",
  },
];
