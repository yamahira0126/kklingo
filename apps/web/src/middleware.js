// middleware.js
import { NextResponse } from 'next/server';

const publicPaths = ['/', '/login', '/signup', '/favicon.ico'];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // 公開パスなら許可
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Cookieからトークン取得
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/search', '/create', '/solve/:path*', '/mypage/:path*', '/review/:path*', '/dev', '/admin'],
};