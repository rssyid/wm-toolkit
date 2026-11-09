"use client";

import React, { useState, useEffect } from "react";
import { Bell, Mail, ShieldAlert, Check, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppState } from "@/context/app-state-context";
import { toast } from "sonner";

export function NotificationsTab() {
  const { systemSettings, updateSystemSettings } = useAppState();

  const [workingDays, setWorkingDays] = useState(systemSettings.workingDays);
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(
    String(systemSettings.budgetAlertThreshold || 95)
  );
  const [notifAfce, setNotifAfce] = useState(systemSettings.notifAfce);
  const [notifPr, setNotifPr] = useState(systemSettings.notifPr);
  const [notifPo, setNotifPo] = useState(systemSettings.notifPo);
  const [notifGr, setNotifGr] = useState(systemSettings.notifGr);
  const [notifDelayed, setNotifDelayed] = useState(systemSettings.notifDelayed);
  const [deviationThreshold, setDeviationThreshold] = useState(systemSettings.deviationThreshold);
  const [emailDigest, setEmailDigest] = useState(systemSettings.emailDigest);

  useEffect(() => {
    setWorkingDays(systemSettings.workingDays);
    setBudgetAlertThreshold(String(systemSettings.budgetAlertThreshold || 95));
    setNotifAfce(systemSettings.notifAfce);
    setNotifPr(systemSettings.notifPr);
    setNotifPo(systemSettings.notifPo);
    setNotifGr(systemSettings.notifGr);
    setNotifDelayed(systemSettings.notifDelayed);
    setDeviationThreshold(systemSettings.deviationThreshold);
    setEmailDigest(systemSettings.emailDigest);
  }, [systemSettings]);

  const handleSave = () => {
    updateSystemSettings({
      workingDays: workingDays as "5" | "6" | "7",
      budgetAlertThreshold: Number(budgetAlertThreshold),
      notifAfce,
      notifPr,
      notifPo,
      notifGr,
      notifDelayed,
      deviationThreshold,
      emailDigest: emailDigest as "daily" | "weekly" | "critical-only" | "off",
    });
    toast.success("Parameter proyek & sistem peringatan dini (EWS) berhasil disimpan!");
  };

  const handleReset = () => {
    setWorkingDays(systemSettings.workingDays);
    setBudgetAlertThreshold(String(systemSettings.budgetAlertThreshold || 95));
    setNotifAfce(systemSettings.notifAfce);
    setNotifPr(systemSettings.notifPr);
    setNotifPo(systemSettings.notifPo);
    setNotifGr(systemSettings.notifGr);
    setNotifDelayed(systemSettings.notifDelayed);
    setDeviationThreshold(systemSettings.deviationThreshold);
    setEmailDigest(systemSettings.emailDigest);
    toast.info("Pengaturan dikembalikan ke setelan tersimpan");
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="p-5 border-b bg-card">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Parameter Proyek & Sistem Peringatan Dini (EWS)
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tentukan standar hari kerja operasional kebun, ambang batas deviasi kurva-S, kontrol overbudget AFCE, dan saluran notifikasi.
        </p>
      </div>

      {/* Form Content - 2-Column Rows */}
      <div className="divide-y text-xs">
        {/* Row 1: Standar Hari Kerja Mingguan Proyek */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/2">
            <span className="font-medium text-foreground block text-xs">
              Standar Hari Kerja Mingguan Proyek
            </span>
            <span className="text-[11px] text-muted-foreground">
              Basis perhitungan durasi otomatis pada diagram kurva-S dan jadwal milestone pekerjaan sipil kebun.
            </span>
          </div>
          <div className="md:w-1/2 max-w-sm md:ml-auto">
            <SearchableSelect
              value={workingDays}
              onValueChange={(val) => setWorkingDays(val as "5" | "6" | "7")}
              placeholder="Pilih Hari Kerja"
              triggerClassName="h-9 text-xs"
              options={[
                { value: "5", label: "5 Hari Kerja (Senin s.d. Jumat • Kantor Direksi)" },
                { value: "6", label: "6 Hari Kerja (Senin s.d. Sabtu • Standar Estate Kebun)" },
                { value: "7", label: "7 Hari Kalender Penuh (Proyek Tanggap Darurat / Lembur)" },
              ]}
            />
          </div>
        </div>

        {/* Row 2: Ambang Toleransi Anggaran AFCE (Budget Overrun Alert) */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/2">
            <span className="font-medium text-foreground block text-xs">
              Ambang Peringatan Komitmen Anggaran AFCE
            </span>
            <span className="text-[11px] text-muted-foreground">
              Peringatan dini saat akumulasi komitmen PO rekanan mendekati pagu anggaran proposal AFCE.
            </span>
          </div>
          <div className="md:w-1/2 max-w-sm md:ml-auto">
            <SearchableSelect
              value={budgetAlertThreshold}
              onValueChange={setBudgetAlertThreshold}
              placeholder="Pilih Ambang Batas"
              triggerClassName="h-9 text-xs"
              options={[
                { value: "85", label: "Peringatan saat komitmen mencapai ≥ 85% AFCE" },
                { value: "90", label: "Peringatan saat komitmen mencapai ≥ 90% AFCE" },
                { value: "95", label: "Peringatan saat komitmen mencapai ≥ 95% AFCE (Standar)" },
                { value: "100", label: "Peringatan ketat saat mencapai 100% (Pagu Penuh)" },
              ]}
            />
          </div>
        </div>

        {/* Row 3: EWS Deviasi Jadwal Fisik */}
        <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="md:w-1/2">
            <span className="font-medium text-foreground block text-xs">
              Alarm Peringatan Dini (EWS) Keterlambatan Fisik
            </span>
            <span className="text-[11px] text-muted-foreground">
              Tampilkan badge peringatan merah dan notifikasi lonceng ketika realisasi progres tertinggal dari baseline kurva-S.
            </span>
          </div>
          <div className="md:w-1/2 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
            <SearchableSelect
              value={deviationThreshold}
              onValueChange={setDeviationThreshold}
              placeholder="Pilih Ambang Deviasi"
              triggerClassName="h-8 text-xs w-48"
              options={[
                { value: "3", label: "Deviasi > 3 Hari Kalender" },
                { value: "7", label: "Deviasi > 7 Hari (Standar SOP)" },
                { value: "14", label: "Deviasi > 14 Hari (Kritis)" },
              ]}
            />
            <Switch checked={notifDelayed} onCheckedChange={setNotifDelayed} />
          </div>
        </div>

        {/* Row 4: Notifikasi Dokumen AFCE */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-2/3">
            <span className="font-medium text-foreground block text-xs">
              Pemberitahuan Persetujuan Dokumen AFCE
            </span>
            <span className="text-[11px] text-muted-foreground">
              Kirim notifikasi lonceng saat proposal AFCE baru membutuhkan evaluasi atau telah disetujui reviewer.
            </span>
          </div>
          <div className="md:w-1/3 flex md:justify-end">
            <Switch checked={notifAfce} onCheckedChange={setNotifAfce} />
          </div>
        </div>

        {/* Row 5: Notifikasi PR */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-2/3">
            <span className="font-medium text-foreground block text-xs">
              Pemberitahuan Rilis Purchase Requisition (PR)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Peringatan ketika nomor PR SAP resmi berhasil diterbitkan untuk item material proyek perkebunan.
            </span>
          </div>
          <div className="md:w-1/3 flex md:justify-end">
            <Switch checked={notifPr} onCheckedChange={setNotifPr} />
          </div>
        </div>

        {/* Row 6: Notifikasi PO */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-2/3">
            <span className="font-medium text-foreground block text-xs">
              Pemberitahuan Penerbitan Purchase Order (PO)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Notifikasi saat kontrak PO rekanan telah disahkan dan siap untuk jadwal mobilisasi atau pengiriman fisik.
            </span>
          </div>
          <div className="md:w-1/3 flex md:justify-end">
            <Switch checked={notifPo} onCheckedChange={setNotifPo} />
          </div>
        </div>

        {/* Row 7: Notifikasi GR */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-2/3">
            <span className="font-medium text-foreground block text-xs">
              Penerimaan Material Gudang (Goods Receipt / GR)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Konfirmasi otomatis saat bukti surat jalan dan penerimaan material fisik dicatatkan petugas gudang kebun.
            </span>
          </div>
          <div className="md:w-1/3 flex md:justify-end">
            <Switch checked={notifGr} onCheckedChange={setNotifGr} />
          </div>
        </div>

        {/* Row 8: Ringkasan Email Berkala */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="md:w-1/2">
            <span className="font-medium text-foreground block text-xs">
              Saluran Ringkasan Email (Email Digest)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Rekapitulasi berkala progres pekerjaan seluruh distrik dan status PO ke email kedinasan.
            </span>
          </div>
          <div className="md:w-1/2 max-w-xs md:ml-auto">
            <SearchableSelect
              value={emailDigest}
              onValueChange={(val) => setEmailDigest(val as "daily" | "weekly" | "critical-only" | "off")}
              placeholder="Pilih Frekuensi Email"
              triggerClassName="h-9 text-xs"
              options={[
                { value: "daily", label: "Harian (Setiap Hari • 07:00 WIB)" },
                { value: "weekly", label: "Mingguan (Setiap Senin • 08:00 WIB)" },
                { value: "critical-only", label: "Hanya Saat Status Proyek Deviasi Kritis" },
                { value: "off", label: "Nonaktifkan Ringkasan Email" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 bg-muted/20 border-t flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-8 text-xs"
        >
          Batal
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium"
        >
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}
