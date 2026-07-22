import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from 'next-intl/middleware';

import { applyCsrfProtection } from "@/lib/middleware/csrf";
import { locales } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});

export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

    // Handle locale prefixes for manual path checks
    const pathnameWithoutLocale = locales.some(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)
        ? pathname.replace(new RegExp(`^/(${locales.join('|')})`), '') || '/'
        : pathname;

    // Skip middleware for API routes and static files to avoid next-intl capturing them incorrectly if matcher isn't strict enough
    if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
        if (pathname.startsWith('/api')) {
             const csrfResponse = await applyCsrfProtection(req);
             if (csrfResponse) return csrfResponse;
        }
        return NextResponse.next();
    }

    // Auth redirects
    if (token && (pathnameWithoutLocale === "/login" || pathnameWithoutLocale === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (!token && pathnameWithoutLocale.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const csrfResponse = await applyCsrfProtection(req);
    if (csrfResponse) {
        return csrfResponse;
    }

    const nonce = crypto.randomUUID();
    const isDev = process.env.NODE_ENV === "development";
    
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""};
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://res.cloudinary.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      connect-src 'self';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, " ").trim();

    req.headers.set("x-nonce", nonce);
    req.headers.set("Content-Security-Policy", cspHeader);

    const response = intlMiddleware(req);

    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/api/:path*']
};
