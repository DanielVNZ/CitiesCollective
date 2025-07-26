'use client';

// Mobile-specific image optimization utilities

export interface MobileImageConfig {
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  formats: string[];
  qualities: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  sizes: {
    thumbnail: { mobile: number; tablet: number; desktop: number };
    medium: { mobile: number; tablet: number; desktop: number };
    large: { mobile: number; tablet: number; desktop: number };
  };
}

export const mobileImageConfig: MobileImageConfig = {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1920,
  },
  formats: ['avif', 'webp', 'jpeg'],
  qualities: {
    mobile: 70, // Lower quality for mobile to save bandwidth
    tablet: 80,
    desktop: 85,
  },
  sizes: {
    thumbnail: { mobile: 300, tablet: 400, desktop: 500 },
    medium: { mobile: 600, tablet: 800, desktop: 1000 },
    large: { mobile: 900, tablet: 1200, desktop: 1600 },
  },
};

// Detect device type and network conditions
export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true, networkSpeed: 'fast' };
  }

  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent) && window.innerWidth >= 768;
  const isDesktop = !isMobile && !isTablet;

  // Detect network speed using Network Information API
  let networkSpeed = 'fast';
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        networkSpeed = 'slow';
      } else if (effectiveType === '3g') {
        networkSpeed = 'medium';
      }
    }
  }

  return { isMobile, isTablet, isDesktop, networkSpeed };
}

// Generate mobile-optimized image URLs
export function generateMobileImageUrls(baseUrl: string, imageType: 'thumbnail' | 'medium' | 'large' = 'medium') {
  const { isMobile, isTablet, networkSpeed } = getDeviceInfo();
  const config = mobileImageConfig;
  
  // Adjust quality based on network speed
  let quality = config.qualities.desktop;
  if (isMobile) {
    quality = networkSpeed === 'slow' ? 60 : config.qualities.mobile;
  } else if (isTablet) {
    quality = config.qualities.tablet;
  }

  // Adjust size based on device
  let width = config.sizes[imageType].desktop;
  if (isMobile) {
    width = config.sizes[imageType].mobile;
  } else if (isTablet) {
    width = config.sizes[imageType].tablet;
  }

  // Generate URLs for different formats
  const generateUrl = (format?: string) => {
    try {
      // Check if baseUrl is already a complete URL
      let url: URL;
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        url = new URL(baseUrl);
      } else {
        url = new URL(baseUrl, window.location.origin);
      }
      
      // Only add query parameters if the URL doesn't already have them
      // This prevents breaking existing image URLs that don't support these parameters
      if (!url.searchParams.has('w') && !url.searchParams.has('q')) {
        url.searchParams.set('w', width.toString());
        url.searchParams.set('q', quality.toString());
        if (format) {
          url.searchParams.set('f', format);
        }
      }
      
      return url.toString();
    } catch (error) {
      // If URL parsing fails, return the original URL
      console.warn('Failed to parse image URL, using original:', baseUrl);
      return baseUrl;
    }
  };

  return {
    avif: generateUrl('avif'),
    webp: generateUrl('webp'),
    jpeg: generateUrl('jpeg'),
    default: generateUrl(),
  };
}

// Generate responsive sizes attribute for Next.js Image
export function generateResponsiveSizes(imageType: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
  const config = mobileImageConfig;
  const sizes = config.sizes[imageType];
  
  return `(max-width: ${config.breakpoints.mobile}px) ${sizes.mobile}px, (max-width: ${config.breakpoints.tablet}px) ${sizes.tablet}px, ${sizes.desktop}px`;
}

// Preload critical images for mobile
export function preloadCriticalImages(imageUrls: string[], priority: 'high' | 'low' = 'high') {
  if (typeof window === 'undefined') return;

  const { isMobile, networkSpeed } = getDeviceInfo();
  
  // Limit preloading on mobile with slow connections
  if (isMobile && networkSpeed === 'slow') {
    imageUrls = imageUrls.slice(0, 2); // Only preload first 2 images
  }

  imageUrls.forEach((url, index) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    
    // Set fetchPriority if supported
    if ('fetchPriority' in link) {
      (link as any).fetchPriority = index === 0 ? 'high' : 'low';
    }
    
    // Add to head
    document.head.appendChild(link);
    
    // Clean up after 30 seconds to avoid memory leaks
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 30000);
  });
}

// Intersection Observer for mobile-optimized lazy loading
export function createMobileIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const { isMobile, networkSpeed } = getDeviceInfo();
  
  // Adjust root margin based on device and network
  let rootMargin = '50px';
  if (isMobile) {
    rootMargin = networkSpeed === 'slow' ? '20px' : '100px';
  }

  const defaultOptions: IntersectionObserverInit = {
    rootMargin,
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Touch-optimized image gallery utilities
export interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPinchZoom?: (scale: number) => void;
  onDoubleTap?: () => void;
}

export class TouchGestureHandler {
  private element: HTMLElement;
  private handlers: TouchGestureHandlers;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTouchTime = 0;
  private initialDistance = 0;
  private currentScale = 1;

  constructor(element: HTMLElement, handlers: TouchGestureHandlers) {
    this.element = element;
    this.handlers = handlers;
    this.bindEvents();
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();

    // Handle pinch zoom
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
    }
  }

  private handleTouchMove(e: TouchEvent) {
    // Handle pinch zoom
    if (e.touches.length === 2 && this.handlers.onPinchZoom) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = currentDistance / this.initialDistance;
      this.currentScale = Math.max(0.5, Math.min(3, scale));
      this.handlers.onPinchZoom(this.currentScale);
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    const touchEndTime = Date.now();
    
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    const deltaTime = touchEndTime - this.touchStartTime;
    
    // Detect double tap
    if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      if (touchEndTime - this.lastTouchTime < 300 && this.handlers.onDoubleTap) {
        this.handlers.onDoubleTap();
      }
      this.lastTouchTime = touchEndTime;
      return;
    }

    // Detect swipe gestures
    if (deltaTime < 500 && Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
      if (deltaX > 0 && this.handlers.onSwipeRight) {
        this.handlers.onSwipeRight();
      } else if (deltaX < 0 && this.handlers.onSwipeLeft) {
        this.handlers.onSwipeLeft();
      }
    }
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}

// Mobile viewport utilities
export function optimizeMobileViewport() {
  if (typeof window === 'undefined') return;

  // Set viewport meta tag for optimal mobile rendering
  let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
  }
  
  viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';

  // Add mobile-specific CSS custom properties
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  
  // Update on resize
  const updateVH = () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  };
  
  window.addEventListener('resize', updateVH);
  window.addEventListener('orientationchange', updateVH);
  
  return () => {
    window.removeEventListener('resize', updateVH);
    window.removeEventListener('orientationchange', updateVH);
  };
}

// Performance monitoring for mobile images
export class MobileImagePerformanceMonitor {
  private metrics: Map<string, { loadTime: number; size: number; format: string }> = new Map();

  public recordImageLoad(url: string, loadTime: number, size?: number, format?: string) {
    this.metrics.set(url, {
      loadTime,
      size: size || 0,
      format: format || 'unknown',
    });
  }

  public getAverageLoadTime(): number {
    const times = Array.from(this.metrics.values()).map(m => m.loadTime);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  public getMetrics() {
    return {
      totalImages: this.metrics.size,
      averageLoadTime: this.getAverageLoadTime(),
      formatDistribution: this.getFormatDistribution(),
      slowestImages: this.getSlowestImages(5),
    };
  }

  private getFormatDistribution() {
    const distribution: Record<string, number> = {};
    const metricsArray = Array.from(this.metrics.values());
    for (const metric of metricsArray) {
      distribution[metric.format] = (distribution[metric.format] || 0) + 1;
    }
    return distribution;
  }

  private getSlowestImages(count: number) {
    return Array.from(this.metrics.entries())
      .sort(([, a], [, b]) => b.loadTime - a.loadTime)
      .slice(0, count)
      .map(([url, metric]) => ({ url, ...metric }));
  }
}

// Global performance monitor instance
export const mobileImagePerformanceMonitor = new MobileImagePerformanceMonitor();