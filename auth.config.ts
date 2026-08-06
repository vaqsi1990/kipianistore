import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    authorized({ request, auth }) {
      const protectedPaths = [
        /\/(ka|en)\/profile/,
        /\/(ka|en)\/adminall/,
        /\/(ka|en)\/checkout\/personal/,
        /\/(ka|en)\/summary/,
        /\/(ka|en)\/new/,
        /\/(ka|en)\/edit/,
      ];

      const { pathname } = request.nextUrl;
      const isProtected = protectedPaths.some((p) => p.test(pathname));

      if (isProtected && !auth) {
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
