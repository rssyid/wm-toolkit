"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { OnboardingProvider } from "@/context/onboarding-context";
import { OnboardingWelcomeDialog } from "@/components/onboarding/onboarding-welcome-dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname() || "";

  // If on login page, render full screen without dashboard shell
  if (pathname === "/login") {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-foreground overflow-y-auto">
        {children}
      </main>
    );
  }

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <OnboardingProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground print:block print:h-auto print:overflow-visible print:bg-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-primary-foreground print:hidden"
        >
          Langsung ke konten utama
        </a>

        {/* Desktop Sidebar */}
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* Mobile Navigation Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-72 sm:max-w-xs">
            <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
            <SheetDescription className="sr-only">
              Navigasi halaman utama WM-Toolkit
            </SheetDescription>
            <AppSidebar
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              onNavigate={() => setMobileMenuOpen(false)}
              isMobileDrawer
            />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0 print:block print:overflow-visible">
          <AppTopbar
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={collapsed}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/20 focus:outline-none print:overflow-visible print:p-0 print:bg-white"
          >
            {children}
          </main>
        </div>
      </div>
      <OnboardingWelcomeDialog />
    </OnboardingProvider>
  );
}
