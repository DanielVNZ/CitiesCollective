'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import { NotificationsMenu } from './NotificationsMenu';
import { SignOutButton } from './SignOutButton';

interface ResponsiveNavigationProps {
  session: Session | null;
  isAdmin: boolean;
}

export function ResponsiveNavigation({ session, isAdmin }: ResponsiveNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="relative" ref={mobileMenuRef}>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-6">
        {session ? (
          <>
            <Link
              href="/search"
              className="relative text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors duration-200 group"
            >
              Search
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="/favorites"
              className="relative text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 font-medium transition-colors duration-200 group"
            >
              Favorites
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="/upload"
              className="relative text-gray-700 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 font-medium transition-colors duration-200 group"
            >
              Upload City
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="/protected"
              className="relative text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 font-medium transition-colors duration-200 group"
            >
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href={`/user/${session.user?.id || ''}`}
              className="relative text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 font-medium transition-colors duration-200 group"
            >
              Profile
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="relative text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors duration-200 group"
              >
                Admin
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            )}
            <Link
              href="https://feedback.citiescollective.space"
              target="_blank"
              rel="noopener noreferrer"
              className="relative text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 font-medium transition-colors duration-200 group"
            >
              Feedback
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
              <NotificationsMenu />
              <SignOutButton />
            </div>
          </>
        ) : (
          <>
            <Link
              href="/search"
              className="relative text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors duration-200 group"
            >
              Search
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="relative text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors duration-200 group"
            >
              Login
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent(pathname)}`}
              className="relative text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 font-medium transition-colors duration-200 group"
            >
              Sign Up
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="https://feedback.citiescollective.space"
              target="_blank"
              rel="noopener noreferrer"
              className="relative text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 font-medium transition-colors duration-200 group"
            >
              Feedback
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>

          </>
        )}
      </nav>

      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center space-x-3">
        {session && <NotificationsMenu />}
        {session && <SignOutButton className="!px-3 !py-2" />}
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="py-3">
            {session ? (
              <>
                <Link
                  href="/search"
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Search
                </Link>
                <Link
                  href="/favorites"
                  className="block px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-300 dark:hover:text-purple-400 dark:hover:bg-purple-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Favorites
                </Link>
                <Link
                  href="/upload"
                  className="block px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 dark:text-gray-300 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Upload City
                </Link>
                <Link
                  href="/protected"
                  className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-green-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href={`/user/${session.user?.id || ''}`}
                  className="block px-4 py-3 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors duration-200 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="https://feedback.citiescollective.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-300 dark:hover:text-teal-400 dark:hover:bg-teal-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Feedback
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <SignOutButton 
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
                  />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/search"
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Search
                </Link>
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href={`/register?redirect=${encodeURIComponent(pathname)}`}
                  className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-green-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
                <Link
                  href="https://feedback.citiescollective.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-teal-50 dark:text-gray-300 dark:hover:text-teal-400 dark:hover:bg-teal-900/20 transition-colors duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Feedback
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 