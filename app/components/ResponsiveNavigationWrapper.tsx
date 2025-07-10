'use client';

import { Session } from 'next-auth';
import { ResponsiveNavigation } from './ResponsiveNavigation';

interface ResponsiveNavigationWrapperProps {
  session: Session | null;
  isAdmin: boolean;
}

export function ResponsiveNavigationWrapper({ session, isAdmin }: ResponsiveNavigationWrapperProps) {
  return <ResponsiveNavigation session={session} isAdmin={isAdmin} />;
} 