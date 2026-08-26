import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { authConfig } from "../auth.config";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

const protectedPathRegex =
  /^\/(ka|en)\/(profile|adminall|checkout\/personal|summary|new|edit)(\/|$)/;

type AuthMiddleware = (
  request: NextRequest,
  event: unknown
) => ReturnType<typeof intlMiddleware> | Promise<ReturnType<typeof intlMiddleware>>;

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Keep auth() off public routes so AUTH_URL/NEXTAUTH_URL cannot
  // rewrite the origin and create a host redirect loop (Vercel 508).
  if (protectedPathRegex.test(pathname)) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;

    const withAuth = auth((req) => {
      if (!req.auth) {
        // Use the original request URL (pre Auth.js rewrite) as base.
        const signInUrl = new URL(`/${locale}/sign-in`, request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
      }

      return intlMiddleware(req as NextRequest);
    }) as AuthMiddleware;

    return withAuth(request, {});
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
