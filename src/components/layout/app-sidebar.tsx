"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Database,
  Settings,
  ChevronDown,
  Layers,
  Tags,
  MapPin,
  Package,
  Truck,
  Users2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Bell,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/app-state-context";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppSidebar({ collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname() || "";
  const { unreadNotificationCount, canManageSystem, activeRole } = useAppState();
  const [masterDataOpen, setMasterDataOpen] = useState(pathname.startsWith("/master-data"));

  React.useEffect(() => {
    if (pathname.startsWith("/master-data")) {
      setMasterDataOpen(true);
    }
  }, [pathname]);

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Workspace",
      icon: Briefcase,
      href: "/workspace",
      active: pathname.startsWith("/workspace"),
    },
    {
      label: "Notifikasi",
      icon: Bell,
      href: "/notifications",
      active: pathname === "/notifications",
      badge: unreadNotificationCount,
    },
  ];

  const masterDataSubItems = [
    { label: "Semua Master Data", href: "/master-data", icon: Database },
    { label: "Organisasi & Kebun", href: "/master-data/locations", icon: MapPin },
    { label: "Kategori Proyek", href: "/master-data/project-categories", icon: Tags },
    { label: "Tipe Proyek", href: "/master-data/project-types", icon: Layers },
    { label: "Tipe Pengadaan", href: "/master-data/procurement-types", icon: FolderGit2 },
    { label: "Katalog Material", href: "/master-data/materials", icon: Package },
    { label: "Supplier Rekanan", href: "/master-data/suppliers", icon: Truck },
    { label: "User & Role", href: "/master-data/users", icon: Users2 },
    { label: "Matriks Approval", href: "/master-data/approval-matrix", icon: ShieldCheck },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out shrink-0 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b px-3.5">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-sm shrink-0">
            WM
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground leading-tight">
                WM-Toolkit
              </span>
              <span className="text-[10px] text-muted-foreground font-medium truncate">
                Estate Civil & Tech Monitor
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                item.active
                  ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? (item.badge && item.badge > 0 ? `${item.label} (${item.badge} baru)` : item.label) : undefined}
            >
              <div className="relative shrink-0">
                <Icon className={cn("h-4 w-4", item.active && "text-emerald-600 dark:text-emerald-400")} />
                {collapsed && item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-600" />
                ) : null}
              </div>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && item.badge && item.badge > 0 ? (
                <span className="flex h-4 px-1.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}

        {/* Master Data Menu (Admin Only) */}
        {canManageSystem && (
          <div>
            <button
              type="button"
              onClick={() => setMasterDataOpen(!masterDataOpen)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors",
                pathname.startsWith("/master-data")
                  ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? "Master Data" : undefined}
            >
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                {!collapsed && (
                  <div className="flex items-center gap-1.5">
                    <span>Master Data</span>
                  </div>
                )}
              </div>
              {!collapsed && (
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform duration-200", masterDataOpen && "rotate-180")}
                />
              )}
            </button>

            {!collapsed && masterDataOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-border/80 space-y-1">
                {masterDataSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                        isSubActive
                          ? "text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      <SubIcon className="h-3 w-3 shrink-0" />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
            pathname === "/settings"
              ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <div className="flex items-center justify-between flex-1">
              <span>Pengaturan</span>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse Toggle Footer */}
      <div className="border-t p-2 flex items-center justify-end">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 p-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-[11px]">Perkecil Menu</span>}
        </button>
      </div>
    </aside>
  );
}
