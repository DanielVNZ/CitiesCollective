'use client';

import { signOutAction } from 'app/actions/auth';

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function SignOutButton({ className = '', children }: SignOutButtonProps) {
  return (
    <form action={signOutAction}>
      <button 
        type="submit"
        className={`text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
      >
        {children || 'Sign Out'}
      </button>
    </form>
  );
} 