import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppStateProvider } from "@/context/app-state-context";
import { AppLayoutShell } from "@/components/layout/app-layout-shell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "WM-Toolkit — Estate Civil & Tech Project Monitoring",
  description: "Internal operations tool for estate technical project monitoring, AFCE, PR, PO, goods receipt, and Gantt tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppStateProvider>
            <AppLayoutShell>{children}</AppLayoutShell>
            <Toaster richColors position="top-right" closeButton />
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
