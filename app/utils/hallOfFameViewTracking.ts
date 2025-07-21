// Utility to track Hall of Fame screenshot views and call the API

// Session storage key for viewed screenshots
const VIEWED_SCREENSHOTS_KEY = 'hof_viewed_screenshots';

// Import cookie consent check
import { hasAnalyticsConsent } from './cookieConsent';

// Debounce tracking to prevent rapid duplicate calls
const trackingTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Get viewed screenshots from sessionStorage
 */
function getViewedScreenshots(): Set<string> {
  try {
    const stored = sessionStorage.getItem(VIEWED_SCREENSHOTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (error) {
    console.error('🏆 HoF View Tracking: Error reading from sessionStorage:', error);
  }
  return new Set<string>();
}

/**
 * Save viewed screenshots to sessionStorage
 */
function saveViewedScreenshots(viewedScreenshots: Set<string>): void {
  try {
    const array = Array.from(viewedScreenshots);
    sessionStorage.setItem(VIEWED_SCREENSHOTS_KEY, JSON.stringify(array));
  } catch (error) {
    console.error('🏆 HoF View Tracking: Error saving to sessionStorage:', error);
  }
}

/**
 * Extract screenshot ID from Hall of Fame image URL
 * Example URL: https://halloffame.azureedge.net/screenshots/66f1548980615a08772d116b/687a127a810e41ee5f591f8c/sunny-isle-by-sunny-scunny-2025-07-18-09-23-06-fhd.jpg
 * Returns: 687a127a810e41ee5f591f8c
 */
export function extractScreenshotIdFromUrl(url: string): string | null {
  try {
    // Match the pattern: /screenshots/[firstId]/[screenshotId]/[filename]
    const match = url.match(/\/screenshots\/[^\/]+\/([^\/]+)\//);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Mark a Hall of Fame screenshot as viewed by calling the API
 */
export async function markScreenshotAsViewed(screenshotId: string, creatorId: string): Promise<void> {
  // Only track if user has given analytics consent
  if (!hasAnalyticsConsent()) {
    return;
  }

  // Check if we've already marked this screenshot as viewed in this session
  const viewedScreenshots = getViewedScreenshots();
  if (viewedScreenshots.has(screenshotId)) {
    return;
  }

  try {
    const response = await fetch(`https://halloffame.cs2.mtq.io/api/v1/screenshots/${screenshotId}/views`, {
      method: 'POST',
      headers: {
        'Authorization': `CreatorID ${creatorId}`,
        'Accept-Language': navigator.language || 'en',
        'X-Timezone-Offset': new Date().getTimezoneOffset().toString(),
        'X-Forwarded-For': '127.0.0.1', // This will be replaced by the server
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Send empty JSON object as required by the API
    });

    if (response.ok) {
      // Mark as viewed in this session
      viewedScreenshots.add(screenshotId);
      saveViewedScreenshots(viewedScreenshots);
    } else {
      console.error('❌ HoF View Tracking: Failed to mark screenshot as viewed:', {
        screenshotId,
        creatorId,
        status: response.status,
        statusText: response.statusText
      });
      
      // Try to get error details from response
      try {
        const errorData = await response.text();
        console.error('❌ HoF View Tracking: Error response body:', errorData);
      } catch (parseError) {
        console.error('❌ HoF View Tracking: Could not parse error response');
      }
    }
  } catch (error) {
    console.error('❌ HoF View Tracking: Network error marking screenshot as viewed:', {
      screenshotId,
      creatorId,
      error: error instanceof Error ? error.message : error
    });
  }
}

/**
 * Handle view tracking for a Hall of Fame image URL
 */
export async function trackHallOfFameImageView(imageUrl: string, creatorId: string): Promise<void> {
  const screenshotId = extractScreenshotIdFromUrl(imageUrl);
  if (screenshotId && creatorId) {
    // Clear any existing timeout for this screenshot
    if (trackingTimeouts.has(screenshotId)) {
      clearTimeout(trackingTimeouts.get(screenshotId)!);
    }
    
    // Set a new timeout to debounce the tracking
    const timeout = setTimeout(async () => {
      await markScreenshotAsViewed(screenshotId, creatorId);
      trackingTimeouts.delete(screenshotId);
    }, 1000); // 1 second debounce
    
    trackingTimeouts.set(screenshotId, timeout);
  }
}

/**
 * Clear the viewed screenshots cache (useful for testing or session reset)
 */
export function clearViewedScreenshotsCache(): void {
  const viewedScreenshots = getViewedScreenshots();
  
  viewedScreenshots.clear();
  saveViewedScreenshots(viewedScreenshots);
  
  // Clear all tracking timeouts
  trackingTimeouts.forEach(timeout => clearTimeout(timeout));
  trackingTimeouts.clear();
}

/**
 * Get the number of screenshots viewed in this session
 */
export function getViewedScreenshotsCount(): number {
  const viewedScreenshots = getViewedScreenshots();
  return viewedScreenshots.size;
} 