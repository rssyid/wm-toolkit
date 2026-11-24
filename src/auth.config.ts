import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.jabatan = (user as { jabatan?: string | null }).jabatan;
        token.estateName = (user as { estateName?: string | null }).estateName;
      }
      if (trigger === "update" && session) {
        const s = session as {
          name?: string;
          email?: string;
          jabatan?: string | null;
          estateName?: string | null;
        };
        if (s.name !== undefined) token.name = s.name;
        if (s.email !== undefined) token.email = s.email;
        if (s.jabatan !== undefined) token.jabatan = s.jabatan;
        if (s.estateName !== undefined) token.estateName = s.estateName;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        const userObj = session.user as unknown as Record<string, unknown>;
        userObj.role = token.role;
        userObj.jabatan = token.jabatan;
        userObj.estateName = token.estateName;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      if (pathname === "/") {
        return Response.redirect(new URL(isLoggedIn ? "/dashboard" : "/login", nextUrl));
      }

      if (pathname === "/login") {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      const protectedPaths = [
        "/dashboard",
        "/workspace",
        "/master-data",
        "/settings",
        "/notifications",
      ];
      const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
      if (isProtected) {
        if (!isLoggedIn) return false;

        if (pathname.startsWith("/master-data")) {
          const userRole = (auth?.user as { role?: string } | undefined)?.role;
          if (userRole !== "ADMIN") {
            return Response.redirect(new URL("/dashboard", nextUrl));
          }
        }
        return true;
      }

      return true;
    },
  },
  providers: [],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};
