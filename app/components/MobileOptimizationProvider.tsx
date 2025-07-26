'use client';

import { useEffect, ReactNode } from 'react';
import { 
  mobilePerformanceMonitor, 
  mobileOptimizer 
} from '../utils/mobile-performance-monitor';
import { mobileBundleOptimizer } from '../utils/mobile-bundle-optimization';
import { registerImageServiceWorker } from '../utils/image-cache';

interface MobileOptimizationProviderProps {
  children: ReactNode;
}

export function MobileOptimizationProvider({ children }: MobileOptimizationProviderProps) {
  useEffect(() => {
    // Initialize mobile optimizations
    const initializeMobileOptimizations = async () => {
      try {
        // Register service worker for mobile caching
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/sw-images.js');
          if (process.env.NODE_ENV === 'production') {
            console.log('Mobile SW registered successfully');
          }
        }

        // Initialize performance monitoring
        const metrics = mobilePerformanceMonitor.getMetrics();
        if (process.env.NODE_ENV === 'production') {
          console.log('Mobile performance monitoring initialized:', metrics);
        }

        // Apply mobile-specific optimizations
        if (mobileOptimizer.shouldEnableMobileMode()) {
          if (process.env.NODE_ENV === 'production') {
            console.log('Mobile optimization mode enabled');
          }
          
          // Apply mobile-specific styles
          document.documentElement.classList.add('mobile-optimized');
          
          // Optimize image quality for mobile
          const imageQuality = mobileOptimizer.getOptimalImageQuality();
          document.documentElement.style.setProperty('--mobile-image-quality', imageQuality.toString());
          
          // Configure bundle loading strategy
          const bundleStrategy = mobileOptimizer.getOptimalBundleStrategy();
          document.documentElement.setAttribute('data-bundle-strategy', bundleStrategy);
        }

        // Initialize bundle optimization
        const bundleConfig = mobileBundleOptimizer.getConfig();
        if (process.env.NODE_ENV === 'production') {
          console.log('Bundle optimization configured:', bundleConfig);
        }

        // Preload critical resources if appropriate
        if (bundleConfig.preloadCriticalChunks && !mobilePerformanceMonitor.isSlowDevice()) {
          // Delay preloading to avoid blocking initial render
          setTimeout(() => {
            mobileBundleOptimizer.preloadCriticalChunks(['city-card', 'search', 'like-button']);
          }, 2000);
        }

        // Monitor and report performance issues
        const recommendations = mobilePerformanceMonitor.getOptimizationRecommendations();
        if (recommendations.length > 0) {
          console.warn('Performance recommendations:', recommendations);
        }

        // Set up periodic performance checks
        const performanceCheckInterval = setInterval(() => {
          const coreWebVitals = mobilePerformanceMonitor.getCoreWebVitals();
          
          // Log significant performance issues
          if (coreWebVitals.lcp && coreWebVitals.lcp > 4000) {
            console.warn('Poor LCP detected:', coreWebVitals.lcp);
          }
          if (coreWebVitals.cls && coreWebVitals.cls > 0.25) {
            console.warn('Poor CLS detected:', coreWebVitals.cls);
          }
        }, 30000); // Check every 30 seconds

        // Clean up interval on page unload
        window.addEventListener('beforeunload', () => {
          clearInterval(performanceCheckInterval);
        });

      } catch (error) {
        console.error('Failed to initialize mobile optimizations:', error);
      }
    };

    initializeMobileOptimizations();

    // Cleanup on unmount
    return () => {
      mobilePerformanceMonitor.destroy();
    };
  }, []);

  // Add mobile-specific event listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause non-critical operations
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_MOBILE === 'true') {
          console.log('Page hidden, pausing non-critical operations');
        }
      } else {
        // Page is visible, resume operations
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_MOBILE === 'true') {
          console.log('Page visible, resuming operations');
        }
      }
    };

    const handleConnectionChange = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_MOBILE === 'true') {
          console.log('Connection changed:', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
          });
        }

        // Adjust optimization strategy based on new connection
        if (['slow-2g', '2g'].includes(connection.effectiveType)) {
          document.documentElement.classList.add('slow-connection');
        } else {
          document.documentElement.classList.remove('slow-connection');
        }
      }
    };

    const handleMemoryWarning = () => {
      console.warn('Memory pressure detected, clearing caches');
      
      // Clear image cache
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_IMAGE_CACHE'
        });
      }
      
      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', handleConnectionChange);
    }
    
    // Listen for memory pressure (if supported)
    if ('memory' in performance) {
      const checkMemory = () => {
        const memInfo = (performance as any).memory;
        if (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize > 0.9) {
          handleMemoryWarning();
        }
      };
      
      const memoryCheckInterval = setInterval(checkMemory, 60000); // Check every minute
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        if ('connection' in navigator) {
          (navigator as any).connection.removeEventListener('change', handleConnectionChange);
        }
        
        clearInterval(memoryCheckInterval);
      };
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return <>{children}</>;
}