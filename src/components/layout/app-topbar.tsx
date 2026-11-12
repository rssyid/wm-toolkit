"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileClock,
  Briefcase,
  CalendarClock,
  Menu,
  CheckCheck,
  ArrowRight,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlobalSearch } from "./global-search";
import { useAppState } from "@/context/app-state-context";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

interface AppTopbarProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function AppTopbar({ onToggleSidebar }: AppTopbarProps) {
  const { theme, setTheme } = useTheme();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    userProfile,
    activeRole,
  } = useAppState();

  const handleLogout = async () => {
    try {
      toast.info("Sedang keluar dari sesi akun...");
      await signOut({ callbackUrl: "/login" });
    } catch {
      window.location.href = "/login";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "LATE_PROJECT":
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      case "PENDING_APPROVAL":
        return <FileClock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case "NEW_TASK":
        return <Briefcase className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
      case "DEADLINE_REMINDER":
        return <CalendarClock className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-card/95 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Toggle Sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            ESTATE ENG. OPS
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">&bull;</span>
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            Wilayah Sumatera Utara
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <GlobalSearch />

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadNotificationCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-88 p-2">
            <DropdownMenuLabel className="text-xs font-semibold flex items-center justify-between pb-1.5">
              <div className="flex items-center gap-1.5">
                <span>Pemberitahuan & Peringatan</span>
                {unreadNotificationCount > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded font-semibold">
                    {unreadNotificationCount} Baru
                  </span>
                )}
              </div>
              {unreadNotificationCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllNotificationsAsRead();
                  }}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Tandai dibaca</span>
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <div className="max-h-72 overflow-y-auto space-y-1 py-1">
              {notifications.slice(0, 5).map((n) => (
                <Link
                  key={n.id}
                  href={n.linkUrl || "/notifications"}
                  onClick={() => {
                    if (!n.isRead) markNotificationAsRead(n.id);
                  }}
                >
                  <div
                    className={cn(
                      "p-2 rounded-md hover:bg-muted text-xs transition-colors flex items-start gap-2.5 cursor-pointer relative",
                      !n.isRead && "bg-muted/40 font-medium"
                    )}
                  >
                    {getNotifIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn("text-xs leading-tight truncate", !n.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                        {n.message}
                      </p>
                      {n.projectCode && (
                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5 inline-block">
                          {n.projectCode}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {notifications.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Semua persetujuan & jadwal terkendali dengan baik.
                </div>
              )}
            </div>

            <DropdownMenuSeparator />
            <Link href="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 justify-center flex items-center gap-1.5"
              >
                <span>Lihat Semua Notifikasi ({notifications.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark/Light Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Ubah Mode Gelap / Terang"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-300" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Active User Profile & Role Switcher */}
        {/* Active User Profile (Immutable Session) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 pl-2 border-l hover:opacity-85 transition-opacity text-left cursor-pointer outline-none select-none"
              title="Profil Pengguna & Sesi Aktif"
            >
              <Avatar className="h-8 w-8 border shrink-0">
                {userProfile?.avatarUrl && (
                  <AvatarImage
                    src={userProfile.avatarUrl}
                    alt={userProfile?.fullName || "Avatar"}
                    className="object-cover"
                  />
                )}
                <AvatarFallback
                  className={cn(
                    "text-white font-semibold text-xs",
                    activeRole === "ADMIN"
                      ? "bg-purple-600"
                      : activeRole === "PIC"
                      ? "bg-emerald-600"
                      : activeRole === "APPROVER"
                      ? "bg-amber-600"
                      : "bg-blue-600"
                  )}
                >
                  {getInitials(userProfile?.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="hidden lg:flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[130px]">
                    {userProfile?.fullName || "Pengguna Sesi"}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-bold px-1 py-0 h-4 border",
                      activeRole === "ADMIN"
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-300"
                        : activeRole === "PIC"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300"
                        : activeRole === "APPROVER"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-300"
                    )}
                  >
                    {activeRole}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                  {userProfile?.role || "Operasional Lapangan"}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-1.5">
            <DropdownMenuLabel className="p-2 pb-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Sesi Terautentikasi</span>
                <Badge
                  className={cn(
                    "text-[9px] font-bold",
                    activeRole === "ADMIN"
                      ? "bg-purple-600 text-white"
                      : activeRole === "PIC"
                      ? "bg-emerald-600 text-white"
                      : activeRole === "APPROVER"
                      ? "bg-amber-600 text-white"
                      : "bg-blue-600 text-white"
                  )}
                >
                  {activeRole}
                </Badge>
              </div>
              <p className="text-xs font-medium text-foreground mt-1">{userProfile?.fullName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{userProfile?.email}</p>
              {userProfile?.selectedLocation && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  Unit: {userProfile.selectedLocation}
                </p>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer text-xs">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Pengaturan Akun & Profil</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-xs text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar dari Sistem</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
