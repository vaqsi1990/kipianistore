import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { authConfig } from "../auth.config";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((request) => {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/ka";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request as NextRequest);
});

export const config = {
  matcher: ["/", "/(ka|en)/:path*"],
};
