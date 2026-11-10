import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.jabatan = (user as any).jabatan;
        token.estateName = (user as any).estateName;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).jabatan = token.jabatan;
        (session.user as any).estateName = token.estateName;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = [
        "/dashboard",
        "/workspace",
        "/master-data",
        "/settings",
        "/notifications",
      ];
      const isProtected = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
      if (isProtected) {
        return isLoggedIn;
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
