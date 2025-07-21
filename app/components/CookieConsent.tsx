'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getCookieConsent, updateCookieConsent, getCookieConsentFromDB, updateCookieConsentInDB } from '../utils/cookieConsent';

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const checkConsent = async () => {
      let hasConsent = false;

      if (session?.user) {
        // User is logged in - check database
        const dbConsent = await getCookieConsentFromDB();
        hasConsent = dbConsent !== null;
        
        // Sync with localStorage for consistency
        if (dbConsent) {
          localStorage.setItem('cookie-consent', dbConsent);
          localStorage.setItem('cookie-consent-date', new Date().toISOString());
        }
      } else {
        // User is not logged in - check localStorage
        const localConsent = getCookieConsent();
        hasConsent = localConsent !== null;
      }

      if (!hasConsent) {
        setShowConsent(true);
      }
    };

    checkConsent();

    // Listen for cookie consent cleared event
    const handleConsentCleared = () => {
      setShowConsent(true);
    };

    window.addEventListener('cookieConsentCleared', handleConsentCleared);

    return () => {
      window.removeEventListener('cookieConsentCleared', handleConsentCleared);
    };
  }, [session]);

  // Don't render anything if user hasn't made a choice yet
  if (!showConsent) {
    return null;
  }

  const acceptAll = async () => {
    if (session?.user) {
      // User is logged in - save to database
      await updateCookieConsentInDB('all');
    }
    
    // Always update localStorage for consistency
    updateCookieConsent('all');
    setShowConsent(false);
  };

  const acceptNecessary = async () => {
    if (session?.user) {
      // User is logged in - save to database
      await updateCookieConsentInDB('necessary');
    }
    
    // Always update localStorage for consistency
    updateCookieConsent('necessary');
    setShowConsent(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🍪 We use cookies
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-0">
              We use cookies to enhance your experience and analyze site traffic. 
              Learn more in our{' '}
              <Link 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                target="_blank"
              >
                Privacy Policy
              </Link>.
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
              <div><strong>Necessary:</strong> Login sessions, theme preferences, bot protection (Turnstile), session tracking, view counting, basic functionality</div>
              <div><strong>Accept All:</strong> Everything above plus website usage statistics (Cloudflare Insights), Hall of Fame view tracking, performance monitoring, user behavior analytics</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Necessary Only
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 