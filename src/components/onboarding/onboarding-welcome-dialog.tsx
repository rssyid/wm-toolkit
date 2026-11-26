"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileCheck2,
  GitBranch,
  PlusCircle,
} from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/context/app-state-context";
import { useOnboarding } from "@/context/onboarding-context";

const RINGKASAN_FASE = [
  {
    nomor: "1",
    judul: "Inisiasi Proyek (Wizard 4 Langkah)",
    detail: "Daftarkan proyek, blok kebun, inisiasi AFCE, jadwal baseline, dan WBS berbobot 100%.",
  },
  {
    nomor: "2",
    judul: "Otorisasi AFCE Berbasis SAP",
    detail: "Catat realisasi persetujuan berjenjang per level jabatan hingga status AFCE menjadi Approved.",
  },
  {
    nomor: "3",
    judul: "Cabang Paralel: Jalur Barang & Jalur Jasa",
    detail: "Jalur Barang (PR, Evaluasi Vendor, PO, GR, BAST) dan Jalur Jasa (USPK, Evaluasi Teknis, SPK) dapat berjalan bersamaan.",
  },
  {
    nomor: "4",
    judul: "Pelaksanaan Fisik & Kurva-S",
    detail: "Catat log progres harian atau mingguan, pantau Kurva-S dan Gantt, serta simpan dokumen Google Drive.",
  },
  {
    nomor: "5",
    judul: "Pemantauan EWS & Laporan Portofolio",
    detail: "Pantau keterlambatan jadwal di Dashboard dan ekspor laporan portofolio ke Excel atau CSV.",
  },
];

export function OnboardingWelcomeDialog() {
  const router = useRouter();
  const { userProfile, activeRole, canEditProjects } = useAppState();
  const { welcomeModalOpen, dismissWelcomeModal } = useOnboarding();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dismissWelcomeModal();
    }
  };

  const handleGoToGuide = () => {
    dismissWelcomeModal();
    router.push("/guide");
  };

  const handleGoToNewProject = () => {
    dismissWelcomeModal();
    router.push("/workspace/new");
  };

  const displayName = userProfile?.fullName || "Rekan Operasional";

  return (
    <Dialog open={welcomeModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent scrollable className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              Selamat Datang di WM-Toolkit, {displayName}
            </DialogTitle>
            <Badge
              variant="outline"
              className="text-[10px] font-bold px-1.5 py-0.5 border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              {activeRole}
            </Badge>
          </div>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground pt-1">
            Aplikasi pencatatan dan pemantauan proyek teknis perkebunan sawit. Pahami prinsip inti dan urutan kerja PIC sebelum mulai mencatat proyek.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-amber-300/80 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
                <FileCheck2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Pencatatan Manual Berbasis SAP</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-950/85 dark:text-amber-100/85">
                Approval AFCE tidak mengubah sistem SAP secara otomatis. Anda mencatat realisasi persetujuan beserta nomor dan bukti SAP ke dalam sistem.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-300/80 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-200">
                <GitBranch className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Dua Jalur Paralel Pasca-AFCE</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-950/85 dark:text-emerald-100/85">
                Setelah AFCE berstatus Approved, satu proyek dapat menjalankan Jalur Barang dan Jalur Jasa secara paralel hingga selesai.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-foreground">
              Alur Kerja Utama Operasional PIC
            </h3>
            <ol className="space-y-2">
              {RINGKASAN_FASE.map((item) => (
                <li
                  key={item.nomor}
                  className="flex items-start gap-2.5 rounded-md border bg-card px-3 py-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white mt-0.5">
                    {item.nomor}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground leading-snug">
                      {item.judul}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-[11px] text-muted-foreground rounded-md bg-muted/60 px-3 py-2 border">
            Anda dapat membuka kembali panduan dan checklist ini kapan saja melalui menu{" "}
            <strong className="text-foreground">Panduan</strong> di sidebar kiri.
          </p>
        </DialogBody>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={dismissWelcomeModal}
            className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs"
          >
            Lewati untuk Sekarang
          </Button>
          {canEditProjects && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGoToNewProject}
              className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Buat Proyek Pertama</span>
            </Button>
          )}
          <Button
            type="button"
            onClick={handleGoToGuide}
            className="min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Buka Panduan &amp; Checklist</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
