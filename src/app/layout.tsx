import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { loadInitialAppStateForUser } from "@/server/initial-state";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { AppStateProvider } from "@/context/app-state-context";
import { AppLayoutShell } from "@/components/layout/app-layout-shell";
import { Toaster } from "sonner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WM-Toolkit - Estate Civil & Tech Project Monitoring",
  description: "Internal operations tool for estate technical project monitoring, AFCE, PR, PO, goods receipt, and Gantt tracking.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userId =
    session?.user?.id ||
    (process.env.NODE_ENV !== "production" ? process.env.TEST_AUTH_USER_ID : undefined);

  const initialStateResult = userId ? await loadInitialAppStateForUser(userId) : null;
  const initialState = initialStateResult?.success ? initialStateResult : null;

  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AppStateProvider initialState={initialState}>
              <AppLayoutShell>{children}</AppLayoutShell>
              <Toaster richColors position="top-right" closeButton />
            </AppStateProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
