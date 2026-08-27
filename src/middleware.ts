import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedPathRegex =
  /^\/(ka|en)\/(profile|adminall|checkout\/personal|summary|new|edit)(\/|$)/;

const sessionCookieRe =
  /^(authjs\.session-token|__Secure-authjs\.session-token|__Host-authjs\.session-token|next-auth\.session-token|__Secure-next-auth\.session-token)(\.\d+)?$/;

function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => sessionCookieRe.test(cookie.name));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Do not wrap protected routes with NextAuth auth().
  // auth() rewrites the request origin to AUTH_URL/NEXTAUTH_URL, and
  // next-intl then redirects — that www vs apex mismatch is a Vercel 508.
  if (protectedPathRegex.test(pathname) && !hasSessionCookie(request)) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
