import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workspace/:path*",
    "/master-data/:path*",
    "/settings/:path*",
    "/notifications/:path*",
  ],
};
