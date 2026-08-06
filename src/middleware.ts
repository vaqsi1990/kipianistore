import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { defineRouting, LocalePrefix } from 'next-intl/routing';
import createMiddleware from 'next-intl/middleware';

const routing = defineRouting({
  locales: ['ka', 'en'],
  defaultLocale: 'ka',
});

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // გადამისამართება მხოლოდ root ან EN root-ზე
  if (pathname === '/' ) {
    const url = request.nextUrl.clone();
    url.pathname = '/ka';
    return NextResponse.redirect(url);
  }

  return createMiddleware(routing)(request);
}

export const config = {
  matcher: ['/', '/(ka|en)/:path*'],
};


