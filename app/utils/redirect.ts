import { redirect } from 'next/navigation';

export function getRedirectUrl(searchParams: URLSearchParams): string {
  // Check for callbackUrl parameter (used by NextAuth)
  const callbackUrl = searchParams.get('callbackUrl');
  if (callbackUrl && callbackUrl.startsWith('/')) {
    return callbackUrl;
  }
  
  // Check for redirect parameter (custom)
  const redirectTo = searchParams.get('redirect');
  if (redirectTo && redirectTo.startsWith('/')) {
    return redirectTo;
  }
  
  // Default fallback
  return '/protected';
}

export function getLoginUrl(redirectTo?: string): string {
  if (redirectTo && redirectTo.startsWith('/')) {
    return `/login?redirect=${encodeURIComponent(redirectTo)}`;
  }
  return '/login';
} 