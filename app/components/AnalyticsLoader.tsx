'use client';

import { useEffect } from 'react';
import { hasAnalyticsConsent, loadCloudflareInsights } from '../utils/cookieConsent';

export function AnalyticsLoader() {
  useEffect(() => {
    // Check if user has already given consent for analytics
    if (hasAnalyticsConsent()) {
      loadCloudflareInsights();
    }
  }, []);

  return null; // This component doesn't render anything
} 