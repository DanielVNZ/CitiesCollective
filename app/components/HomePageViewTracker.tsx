'use client';

import { useEffect } from 'react';

export function HomePageViewTracker() {
  useEffect(() => {
    const recordView = async () => {
      try {
        await fetch('/api/home-page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Failed to record home page view:', error);
      }
    };

    recordView();
  }, []);

  // This component doesn't render anything
  return null;
} 