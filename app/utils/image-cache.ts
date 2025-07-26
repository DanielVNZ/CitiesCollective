'use client';

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
  accessCount: number;
}

class ImageCache {
  private cache = new Map<string, CachedImage>();
  private maxSize = 50; // Maximum number of cached images
  private maxAge = 30 * 60 * 1000; // 30 minutes in milliseconds

  async get(url: string): Promise<string | null> {
    const cached = this.cache.get(url);
    
    if (!cached) {
      return null;
    }

    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(url);
      return null;
    }

    // Update access count and timestamp
    cached.accessCount++;
    cached.timestamp = Date.now();
    
    return URL.createObjectURL(cached.blob);
  }

  async set(url: string, blob: Blob): Promise<void> {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(url, {
      url,
      blob,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  async preload(urls: string[]): Promise<void> {
    const promises = urls.map(async (url) => {
      if (this.cache.has(url)) {
        return; // Already cached
      }

      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          await this.set(url, blob);
        }
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  private cleanup(): void {
    // Remove expired entries first
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    for (let i = 0; i < entries.length; i++) {
      const [url, cached] = entries[i];
      if (now - cached.timestamp > this.maxAge) {
        this.cache.delete(url);
      }
    }

    // If still over limit, remove least recently used entries
    if (this.cache.size >= this.maxSize) {
      const currentEntries = Array.from(this.cache.entries());
      currentEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = currentEntries.slice(0, currentEntries.length - this.maxSize + 10);
      for (let i = 0; i < toRemove.length; i++) {
        this.cache.delete(toRemove[i][0]);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    const values = Array.from(this.cache.values());
    let totalAccess = 0;
    
    for (let i = 0; i < values.length; i++) {
      totalAccess += values[i].accessCount;
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? this.cache.size / totalAccess : 0,
    };
  }
}

// Global image cache instance
export const imageCache = new ImageCache();

// Hook for using image cache in React components
export function useImageCache() {
  const preloadImages = async (urls: string[]) => {
    await imageCache.preload(urls);
  };

  const getCachedImage = async (url: string) => {
    return await imageCache.get(url);
  };

  const clearCache = () => {
    imageCache.clear();
  };

  const getCacheStats = () => {
    return imageCache.getStats();
  };

  return {
    preloadImages,
    getCachedImage,
    clearCache,
    getCacheStats,
  };
}

// Utility function to generate responsive image URLs
export function generateResponsiveImageUrls(baseUrl: string): {
  thumbnail: string;
  medium: string;
  large: string;
  webp: {
    thumbnail: string;
    medium: string;
    large: string;
  };
  avif: {
    thumbnail: string;
    medium: string;
    large: string;
  };
} {
  // This assumes your image service supports format and size parameters
  // Adjust based on your actual image service implementation
  const getImageUrl = (url: string, width: number, format?: string) => {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('w', width.toString());
    if (format) {
      urlObj.searchParams.set('f', format);
    }
    return urlObj.toString();
  };

  return {
    thumbnail: getImageUrl(baseUrl, 300),
    medium: getImageUrl(baseUrl, 800),
    large: getImageUrl(baseUrl, 1200),
    webp: {
      thumbnail: getImageUrl(baseUrl, 300, 'webp'),
      medium: getImageUrl(baseUrl, 800, 'webp'),
      large: getImageUrl(baseUrl, 1200, 'webp'),
    },
    avif: {
      thumbnail: getImageUrl(baseUrl, 300, 'avif'),
      medium: getImageUrl(baseUrl, 800, 'avif'),
      large: getImageUrl(baseUrl, 1200, 'avif'),
    },
  };
}

// Service Worker registration for advanced caching (optional)
export function registerImageServiceWorker() {
  if ('serviceWorker' in navigator && 'caches' in window) {
    navigator.serviceWorker.register('/sw-images.js')
      .then((registration) => {
        if (process.env.NODE_ENV === 'production') {
          console.log('Image SW registered:', registration);
        }
      })
      .catch((error) => {
        console.warn('Image SW registration failed:', error);
      });
  }
}