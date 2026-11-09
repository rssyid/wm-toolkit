"use client";

import React, { useState } from "react";
import {
  User,
  Palette,
  Bell,
  Database,
  Sparkles,
  Settings as SettingsIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProfileTab } from "@/components/settings/profile-tab";
import { AppearanceScheduleTab } from "@/components/settings/appearance-schedule-tab";
import { NotificationsTab } from "@/components/settings/notifications-tab";
import { MaintenanceDangerTab } from "@/components/settings/maintenance-danger-tab";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Konfigurasi &bull; WM-Toolkit</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
          Pengaturan Sistem & Akun
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola profil pengguna & wewenang approval, tampilan antarmuka, parameter proyek & alarm EWS, serta pemulihan cadangan data.
        </p>
      </div>

      {/* Main Layout: Side-Tab Navigation Rail + Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col md:flex-row gap-6 items-start"
      >
        {/* Left Side-Tab Rail Navigation */}
        <aside className="w-full md:w-56 shrink-0">
          <div className="sticky top-20">
            <TabsList className="flex flex-row md:flex-col h-auto w-full overflow-x-auto md:overflow-x-visible space-x-1 md:space-x-0 md:space-y-1 bg-transparent p-0 text-muted-foreground justify-start">
              <TabsTrigger
                value="profile"
                className="w-full justify-start gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground text-left"
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Profil Pengguna</span>
              </TabsTrigger>

              <TabsTrigger
                value="appearance"
                className="w-full justify-start gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground text-left"
              >
                <Palette className="w-4 h-4 shrink-0" />
                <span>Tampilan & Antarmuka</span>
              </TabsTrigger>

              <TabsTrigger
                value="notifications"
                className="w-full justify-start gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground text-left"
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span>Parameter Proyek & EWS</span>
              </TabsTrigger>

              <TabsTrigger
                value="maintenance"
                className="w-full justify-start gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 hover:text-foreground text-left"
              >
                <Database className="w-4 h-4 shrink-0" />
                <span>Pemeliharaan & Cadangan</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 w-full space-y-4 min-w-0">
          {/* ReUI Settings-7 Signature Callout Banner */}
          {!bannerDismissed && (
            <div className="rounded-xl border border-amber-300/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Lengkapi profil operasional Anda
                  </h4>
                  <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                    Pastikan jabatan estate, kontak kedinasan, dan zona waktu Anda selalu terbarui untuk kelancaran alur otorisasi AFCE.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setBannerDismissed(true)}
                  className="h-7 text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setActiveTab("profile");
                  }}
                  className="h-7 text-xs bg-amber-900 dark:bg-amber-200 text-amber-50 dark:text-amber-950 hover:bg-amber-800 dark:hover:bg-amber-300 font-medium"
                >
                  Perbarui
                </Button>
              </div>
            </div>
          )}

          {/* Tab Panels */}
          <TabsContent value="profile" className="mt-0 outline-none">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 outline-none">
            <AppearanceScheduleTab />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 outline-none">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-0 outline-none">
            <MaintenanceDangerTab />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
