import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  trustHost: true,
  pages: {
    signIn: "/ka/sign-in",
  },
  callbacks: {

    authorized: () => true,
  },
} satisfies NextAuthConfig;
