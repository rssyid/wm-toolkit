"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // If on login page, render full screen without dashboard shell
  if (pathname === "/login") {
    return (
      <main className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-foreground overflow-y-auto">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar
          onToggleSidebar={() => setCollapsed(!collapsed)}
          isSidebarCollapsed={collapsed}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/20">
          {children}
        </main>
      </div>
    </div>
  );
}
