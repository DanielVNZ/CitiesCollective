'use client';

import { useState, useEffect } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';

interface ViewCounterProps {
  cityId: number;
  initialViewCount?: number;
  className?: string;
  isContentCreator?: boolean;
  trackView?: boolean; // Only track view if true (for city details page)
  compact?: boolean; // Compact version for city cards
}

export function ViewCounter({ cityId, initialViewCount = 0, className = '', isContentCreator = false, trackView = false, compact = false }: ViewCounterProps) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    // Only track view if trackView prop is true (city details page) and not already tracked
    if (trackView && !hasTracked) {
      const recordView = async () => {
        try {
          const response = await fetch(`/api/cities/${cityId}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setViewCount(data.viewCount);
            setHasTracked(true);
            
            // If this session already viewed this city, mark as tracked to prevent future attempts
            if (data.alreadyViewed) {
              setHasTracked(true);
            }
          }
        } catch (error) {
          console.error('Error tracking view:', error);
        }
      };

      recordView();
    } else if (!trackView && initialViewCount === 0) {
      // If not tracking views but we don't have an initial count, fetch the current count
      const fetchViewCount = async () => {
        try {
          const response = await fetch(`/api/cities/${cityId}/view`, {
            method: 'GET',
          });

          if (response.ok) {
            const data = await response.json();
            setViewCount(data.viewCount);
          }
        } catch (error) {
          console.error('Error fetching view count:', error);
        }
      };

      fetchViewCount();
    }
  }, [cityId, hasTracked, trackView, initialViewCount]);

  // Format view count
  const formatViewCount = (count: number) => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`;
    } else if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Compact version for city cards (similar to CommentCount)
  if (compact) {
    return (
      <span className={className}>
        {formatViewCount(viewCount)} {viewCount === 1 ? 'view' : 'views'}
      </span>
    );
  }

  // Full version for city details page
  return (
    <div className={`flex items-center gap-2 ${className} ${
      isContentCreator 
        ? 'text-purple-700 dark:text-purple-300' 
        : 'text-gray-700 dark:text-gray-300'
    }`}>
      <div className={`p-2 rounded-lg shadow-sm ${
        isContentCreator 
          ? 'bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700' 
          : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
      }`}>
        <EyeIcon className="w-5 h-5" />
      </div>
      <div>
        <div className={`text-lg font-bold ${
          isContentCreator 
            ? 'text-purple-900 dark:text-purple-100' 
            : 'text-gray-900 dark:text-white'
        }`}>
          {formatViewCount(viewCount)}
        </div>
        <div className={`text-xs ${
          isContentCreator 
            ? 'text-purple-600 dark:text-purple-400' 
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {viewCount === 1 ? 'view' : 'views'}
        </div>
      </div>
    </div>
  );
} 