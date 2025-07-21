'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getCookieConsent, updateCookieConsent, getCookieConsentFromDB, updateCookieConsentInDB, getCookiePreferences, updateCookiePreferences, getCookiePreferencesFromDB, updateCookiePreferencesInDB, CookieConsentType, CookiePreferences } from '../utils/cookieConsent';

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    performance: false,
    marketing: false
  });
  const { data: session } = useSession();

  useEffect(() => {
    const checkConsent = async () => {
      let hasConsent = false;

      if (session?.user) {
        // User is logged in - check database
        const dbConsent = await getCookieConsentFromDB();
        const dbPreferences = await getCookiePreferencesFromDB();
        hasConsent = dbConsent !== null;
        
        // Sync with localStorage for consistency
        if (dbConsent) {
          localStorage.setItem('cookie-consent', dbConsent);
          localStorage.setItem('cookie-consent-date', new Date().toISOString());
        }
        
        // Sync preferences if available
        if (dbPreferences) {
          localStorage.setItem('cookie-preferences', JSON.stringify(dbPreferences));
          setCookiePreferences(dbPreferences);
        }
      } else {
        // User is not logged in - check localStorage
        const localConsent = getCookieConsent();
        const localPreferences = getCookiePreferences();
        hasConsent = localConsent !== null;
        
        // Restore preferences if available
        if (localPreferences) {
          setCookiePreferences(localPreferences);
        }
      }

      if (!hasConsent) {
        setShowConsent(true);
      }
    };

    checkConsent();

    // Listen for cookie consent cleared event
    const handleConsentCleared = () => {
      setShowConsent(true);
      setShowCustomize(false);
      setCookiePreferences({
        necessary: true,
        analytics: false,
        performance: false,
        marketing: false
      });
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

  const saveCustomPreferences = async () => {
    if (session?.user) {
      // User is logged in - save to database
      await updateCookiePreferencesInDB(cookiePreferences);
    }
    
    // Always update localStorage for consistency
    updateCookiePreferences(cookiePreferences);
    setShowConsent(false);
    setShowCustomize(false);
  };

  const handlePreferenceChange = (category: keyof typeof cookiePreferences) => {
    if (category === 'necessary') return; // Cannot change necessary cookies
    
    setCookiePreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {!showCustomize ? (
          // Main consent view
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                🍪 We use cookies
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-0">
                We use cookies to ensure basic functionality and enhance your experience. You can choose to accept only necessary cookies or allow all cookies, including for analytics and performance monitoring. You can change your preferences at any time.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                <div><strong>Necessary:</strong> Login sessions, theme preferences, bot protection (Turnstile), basic functionality</div>
                <div><strong>Accept All:</strong> Everything above plus website usage statistics (Cloudflare Insights), Hall of Fame view tracking, home page view tracking, session tracking, performance monitoring, user behavior analytics</div>
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
                onClick={() => setShowCustomize(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Customize
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Customize view
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🍪 Customize Cookie Preferences
              </h3>
              <button
                onClick={() => setShowCustomize(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ← Back
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Necessary Cookies - Always enabled and grayed out */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cookiePreferences.necessary}
                      disabled
                      className="h-4 w-4 text-blue-600 bg-gray-300 border-gray-300 rounded cursor-not-allowed"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">Necessary Cookies</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">Required</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Login sessions, theme preferences, bot protection, basic functionality
                  </p>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cookiePreferences.analytics}
                      onChange={() => handlePreferenceChange('analytics')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">Analytics Cookies</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Website usage statistics (Cloudflare Insights), Hall of Fame view tracking, home page view tracking, session tracking, performance monitoring
                  </p>
                </div>
              </div>

              {/* Performance Cookies */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cookiePreferences.performance}
                      onChange={() => handlePreferenceChange('performance')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">Performance Cookies</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Help us understand how visitors interact with our website to improve performance
                  </p>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cookiePreferences.marketing}
                      onChange={() => handlePreferenceChange('marketing')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">Marketing Cookies</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Used to track visitors across websites to display relevant advertisements
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={saveCustomPreferences}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowCustomize(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 