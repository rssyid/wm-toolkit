"use client";

import React from "react";
import { Bell, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/context/app-state-context";
import { NotificationType } from "@/types";

const NOTIFICATION_CHANNELS: Array<{
  type: NotificationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: "LATE_PROJECT",
    label: "Peringatan Keterlambatan Proyek",
    description:
      "Notifikasi saat jadwal proyek melewati tanggal target selesai atau deviasi melebihi batas toleransi.",
    icon: AlertTriangle,
  },
  {
    type: "PENDING_APPROVAL",
    label: "Persetujuan AFCE Tertunda",
    description:
      "Pemberitahuan otomatis ketika terdapat dokumen AFCE yang masih menunggu pencatatan keputusan otorisasi.",
    icon: CheckCircle2,
  },
  {
    type: "NEW_TASK",
    label: "Diskusi, Mention & Penugasan",
    description:
      "Peringatan saat Anda disebut (@mention) pada diskusi proyek atau menerima tindak lanjut baru.",
    icon: Bell,
  },
  {
    type: "DEADLINE_REMINDER",
    label: "Pengingat Tenggat Waktu Proyek",
    description:
      "Pengingat proaktif H-3 sebelum target tanggal penyelesaian proyek atau tahapan pekerjaan berakhir.",
    icon: Clock,
  },
];

export function NotificationsTab() {
  const { notificationSettings, updateNotificationSetting } = useAppState();

  const isTypeEnabled = (type: NotificationType): boolean => {
    const found = notificationSettings.find((s) => s.notificationType === type);
    return found ? found.isEnabled : true;
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="p-5 border-b bg-card">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Preferensi Notifikasi & Peringatan
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pilih jenis notifikasi operasional yang ingin Anda terima pada pusat notifikasi akun Anda. Perubahan tersimpan langsung ke server.
        </p>
      </div>

      <div className="divide-y text-xs">
        {NOTIFICATION_CHANNELS.map((channel) => {
          const Icon = channel.icon;
          const switchId = `notif-setting-${channel.type.toLowerCase()}`;
          const enabled = isTypeEnabled(channel.type);

          return (
            <div
              key={channel.type}
              className="p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <label
                    htmlFor={switchId}
                    className="font-medium text-foreground block text-xs cursor-pointer"
                  >
                    {channel.label}
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {channel.description}
                  </p>
                </div>
              </div>
              <Switch
                id={switchId}
                checked={enabled}
                onCheckedChange={(checked) => {
                  void updateNotificationSetting(channel.type, checked);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
