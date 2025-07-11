import { Session } from 'next-auth';
import { Logo } from './Logo';
import { ResponsiveNavigationWrapper } from './ResponsiveNavigationWrapper';

interface HeaderProps {
  session: Session | null;
  isAdmin: boolean;
}

export function Header({ session, isAdmin }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-[9999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Logo height={35} />
          </div>
          <ResponsiveNavigationWrapper session={session} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
} 