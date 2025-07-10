import NextAuth from 'next-auth';
import { authConfig } from 'app/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isOnProtected = nextUrl.pathname.startsWith('/protected');
  const isOnLogin = nextUrl.pathname === '/login';
  const isOnRegister = nextUrl.pathname === '/register';
  const isOnAuth = isOnLogin || isOnRegister;

  // If user is on protected route and not logged in, redirect to login with current URL as redirect
  if (isOnProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('redirect', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and on login/register page, redirect to their intended destination
  if (isOnAuth && isLoggedIn) {
    const redirectTo = nextUrl.searchParams.get('redirect') || 
                      nextUrl.searchParams.get('callbackUrl') || 
                      '/protected';
    return NextResponse.redirect(new URL(redirectTo, nextUrl));
  }

  // If user is not logged in and tries to access login/register, allow it
  if (isOnAuth && !isLoggedIn) {
    return NextResponse.next();
  }

  // For all other routes, just continue
  return NextResponse.next();
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
