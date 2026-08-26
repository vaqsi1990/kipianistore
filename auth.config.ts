import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  trustHost: true,
  pages: {
    signIn: "/ka/sign-in",
  },
  callbacks: {
    // Protected-route checks and redirects live in middleware.ts so they
    // can use the real request host (not AUTH_URL) and avoid Vercel 508 loops.
    authorized: () => true,
  },
} satisfies NextAuthConfig;
