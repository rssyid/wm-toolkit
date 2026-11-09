"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  FileClock,
  Briefcase,
  CalendarClock,
  Check,
  CheckCheck,
  Trash2,
  Search,
  ExternalLink,
  Sparkles,
  Settings,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppState } from "@/context/app-state-context";
import { NotificationItem, NotificationType } from "@/types";
import { formatIDDate, cn } from "@/lib/utils";

export function NotificationCenter() {
  const router = useRouter();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    simulateCronReminderCheck,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Helper to format relative time in Indonesian
  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return "Baru saja";
      if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays === 1) return "Kemarin";
      if (diffDays < 7) return `${diffDays} hari yang lalu`;
      return formatIDDate(isoString, false);
    } catch {
      return formatIDDate(isoString, false);
    }
  };

  // KPI Calculations
  const lateCount = useMemo(
    () => notifications.filter((n) => n.type === "LATE_PROJECT").length,
    [notifications]
  );
  const pendingCount = useMemo(
    () => notifications.filter((n) => n.type === "PENDING_APPROVAL").length,
    [notifications]
  );
  const taskCount = useMemo(
    () => notifications.filter((n) => n.type === "NEW_TASK").length,
    [notifications]
  );
  const deadlineCount = useMemo(
    () => notifications.filter((n) => n.type === "DEADLINE_REMINDER").length,
    [notifications]
  );

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === "unread" && n.isRead) return false;
      if (
        activeTab !== "all" &&
        activeTab !== "unread" &&
        n.type !== activeTab
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(query);
        const matchMsg = n.message.toLowerCase().includes(query);
        const matchProject =
          n.projectName?.toLowerCase().includes(query) ||
          n.projectCode?.toLowerCase().includes(query);
        return matchTitle || matchMsg || matchProject;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markNotificationAsRead(item.id);
    }
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  };

  const getTypeMeta = (type: NotificationType) => {
    switch (type) {
      case "LATE_PROJECT":
        return {
          label: "Proyek Terlambat",
          icon: AlertTriangle,
          badgeClass:
            "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800",
          iconColor: "text-rose-600 dark:text-rose-400",
          cardBorder: "border-l-4 border-l-rose-500",
        };
      case "PENDING_APPROVAL":
        return {
          label: "Approval AFCE",
          icon: FileClock,
          badgeClass:
            "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800",
          iconColor: "text-amber-600 dark:text-amber-400",
          cardBorder: "border-l-4 border-l-amber-500",
        };
      case "NEW_TASK":
        return {
          label: "Tugas Baru",
          icon: Briefcase,
          badgeClass:
            "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800",
          iconColor: "text-blue-600 dark:text-blue-400",
          cardBorder: "border-l-4 border-l-blue-500",
        };
      case "DEADLINE_REMINDER":
        return {
          label: "Pengingat Deadline",
          icon: CalendarClock,
          badgeClass:
            "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800",
          iconColor: "text-purple-600 dark:text-purple-400",
          cardBorder: "border-l-4 border-l-purple-500",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Pusat Notifikasi & Pengingat
            </h1>
            {unreadNotificationCount > 0 && (
              <Badge className="bg-rose-600 text-white font-semibold">
                {unreadNotificationCount} Baru
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Monitoring otomatis EWS keterlambatan jadwal, persetujuan berjenjang dokumen AFCE, tugas lapangan, dan pengingat batas waktu kerja kebun.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => simulateCronReminderCheck()}
            className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            title="Simulasi pemicu Vercel Cron harian untuk memeriksa keterlambatan dan tenggat waktu"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulasi Cron EWS</span>
          </Button>

          {unreadNotificationCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllNotificationsAsRead()}
              className="h-8 text-xs flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tandai Semua Dibaca</span>
            </Button>
          )}

          <Link href="/settings">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              title="Atur preferensi sakelar notifikasi"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Setelan</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-xs hover:border-border transition-colors">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Notifikasi
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {notifications.length}
                </span>
                <span className="text-xs text-muted-foreground">pemberitahuan</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:border-border transition-colors">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Belum Dibaca
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {unreadNotificationCount}
                </span>
                <span className="text-xs text-muted-foreground">perlu ditinjau</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:border-border transition-colors">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Peringatan Terlambat
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {lateCount}
                </span>
                <span className="text-xs text-muted-foreground">kritis EWS</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:border-border transition-colors">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Tindakan Tertunda
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {pendingCount + taskCount}
                </span>
                <span className="text-xs text-muted-foreground">approval & tugas</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <FileClock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area: Filter & Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs Filter */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-9 p-1 bg-muted/60 grid grid-cols-3 sm:flex sm:flex-wrap w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs">
                Semua ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Belum Dibaca ({unreadNotificationCount})
              </TabsTrigger>
              <TabsTrigger value="LATE_PROJECT" className="text-xs">
                Terlambat ({lateCount})
              </TabsTrigger>
              <TabsTrigger value="PENDING_APPROVAL" className="text-xs hidden md:inline-flex">
                Approval AFCE ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="NEW_TASK" className="text-xs hidden md:inline-flex">
                Tugas Baru ({taskCount})
              </TabsTrigger>
              <TabsTrigger value="DEADLINE_REMINDER" className="text-xs hidden lg:inline-flex">
                Reminder ({deadlineCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari judul, proyek, pesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs bg-card"
            />
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-2.5">
            {filteredNotifications.map((item) => {
              const meta = getTypeMeta(item.type);
              const Icon = meta.icon;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative rounded-xl border p-4 transition-all duration-200 bg-card hover:shadow-xs",
                    meta.cardBorder,
                    !item.isRead
                      ? "bg-muted/30 border-border dark:bg-muted/15"
                      : "opacity-85 hover:opacity-100"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Icon & Content */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={cn(
                          "mt-0.5 p-2 rounded-lg shrink-0",
                          item.type === "LATE_PROJECT"
                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                            : item.type === "PENDING_APPROVAL"
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                            : item.type === "NEW_TASK"
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                            : "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        {/* Title & Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            onClick={() => handleNotificationClick(item)}
                            className={cn(
                              "text-sm font-semibold cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors",
                              !item.isRead ? "text-foreground font-bold" : "text-foreground/90"
                            )}
                          >
                            {item.title}
                          </h3>

                          {!item.isRead && (
                            <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0 inline-block" title="Belum dibaca" />
                          )}

                          <Badge variant="outline" className={cn("text-[10px] py-0 px-2 font-medium", meta.badgeClass)}>
                            {meta.label}
                          </Badge>
                        </div>

                        {/* Message Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed pr-2">
                          {item.message}
                        </p>

                        {/* Associated Project / Context */}
                        {item.projectName && (
                          <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            {item.projectCode && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/80 font-medium">
                                {item.projectCode}
                              </span>
                            )}
                            <span className="font-medium text-foreground/75 truncate max-w-sm">
                              {item.projectName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Timestamp & Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(item.createdAt)}
                      </span>

                      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.linkUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center gap-1 font-medium"
                            onClick={() => handleNotificationClick(item)}
                            title="Buka halaman kerja alur proyek"
                          >
                            <span>Tinjau</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            if (item.isRead) {
                              // toggle to unread not provided in type, or mark read
                            } else {
                              markNotificationAsRead(item.id);
                            }
                          }}
                          title={item.isRead ? "Sudah dibaca" : "Tandai sudah dibaca"}
                          disabled={item.isRead}
                        >
                          <Check className={cn("w-3.5 h-3.5", item.isRead && "text-emerald-600")} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          onClick={() => deleteNotification(item.id)}
                          title="Hapus pemberitahuan ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={searchQuery ? "Tidak ada notifikasi yang cocok" : "Tidak ada notifikasi di kategori ini"}
            description={
              searchQuery
                ? `Tidak ditemukan notifikasi dengan kata kunci "${searchQuery}". Coba gunakan kata kunci lain.`
                : activeTab === "unread"
                ? "Semua notifikasi telah dibaca. Semua pekerjaan dan persetujuan terkendali dengan baik!"
                : "Belum ada catatan notifikasi pada kategori yang dipilih."
            }
            icon={<Bell className="w-8 h-8 opacity-60 text-emerald-600" />}
            actionLabel={searchQuery ? "Reset Pencarian" : "Periksa Semua Notifikasi"}
            onAction={() => {
              setSearchQuery("");
              setActiveTab("all");
            }}
          />
        )}
      </div>

      {/* Footer Info Box */}
      {notifications.length > 0 && (
        <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Sistem EWS secara berkala memantau deviasi kurva-S harian dan memeriksa dokumen AFCE pending approval.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearAllNotifications()}
            className="h-7 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 self-end sm:self-auto"
          >
            Bersihkan Semua ({notifications.length})
          </Button>
        </div>
      )}
    </div>
  );
}
