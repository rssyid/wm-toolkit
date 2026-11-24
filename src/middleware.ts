import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    const isPublicApi =
      pathname.startsWith("/api/auth") ||
      pathname === "/api/health" ||
      pathname.startsWith("/api/cron/");

    if (!isPublicApi && !req.auth?.user) {
      return NextResponse.json(
        { success: false, error: "Sesi Anda telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }
  }
});

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/workspace/:path*",
    "/master-data/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/api/:path*",
  ],
};
