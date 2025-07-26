'use client';

// Mobile bundle optimization utilities

export interface BundleOptimizationConfig {
  strategy: 'aggressive' | 'moderate' | 'conservative';
  maxInitialBundleSize: number;
  maxChunkSize: number;
  preloadCriticalChunks: boolean;
  enableCodeSplitting: boolean;
  lazyLoadThreshold: number;
}

export class MobileBundleOptimizer {
  private static instance: MobileBundleOptimizer;
  private config: BundleOptimizationConfig;
  private loadedChunks: Set<string> = new Set();
  private preloadedChunks: Set<string> = new Set();

  constructor() {
    this.config = this.getOptimalConfig();
  }

  public static getInstance(): MobileBundleOptimizer {
    if (!MobileBundleOptimizer.instance) {
      MobileBundleOptimizer.instance = new MobileBundleOptimizer();
    }
    return MobileBundleOptimizer.instance;
  }

  private getOptimalConfig(): BundleOptimizationConfig {
    const isMobile = this.isMobileDevice();
    const isSlowConnection = this.isSlowConnection();
    const hasLowMemory = this.hasLowMemory();

    if (isMobile && (isSlowConnection || hasLowMemory)) {
      return {
        strategy: 'aggressive',
        maxInitialBundleSize: 150 * 1024, // 150KB
        maxChunkSize: 50 * 1024, // 50KB
        preloadCriticalChunks: false,
        enableCodeSplitting: true,
        lazyLoadThreshold: 0, // Load everything on demand
      };
    } else if (isMobile) {
      return {
        strategy: 'moderate',
        maxInitialBundleSize: 250 * 1024, // 250KB
        maxChunkSize: 100 * 1024, // 100KB
        preloadCriticalChunks: true,
        enableCodeSplitting: true,
        lazyLoadThreshold: 1000, // 1s delay before lazy loading
      };
    } else {
      return {
        strategy: 'conservative',
        maxInitialBundleSize: 500 * 1024, // 500KB
        maxChunkSize: 200 * 1024, // 200KB
        preloadCriticalChunks: true,
        enableCodeSplitting: false,
        lazyLoadThreshold: 2000, // 2s delay before lazy loading
      };
    }
  }

  // Dynamic import with optimization
  public async optimizedImport<T>(
    importFn: () => Promise<T>,
    chunkName: string,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    // Check if already loaded
    if (this.loadedChunks.has(chunkName)) {
      return importFn();
    }

    // Apply loading strategy based on config
    if (this.config.strategy === 'aggressive' && priority === 'low') {
      // Delay low priority imports on aggressive mode
      await this.delay(this.config.lazyLoadThreshold);
    }

    const startTime = performance.now();
    
    try {
      const moduleResult = await importFn();
      const loadTime = performance.now() - startTime;
      
      this.loadedChunks.add(chunkName);
      this.recordChunkLoad(chunkName, loadTime);
      
      return moduleResult;
    } catch (error) {
      console.error(`Failed to load chunk ${chunkName}:`, error);
      throw error;
    }
  }

  // Preload critical chunks
  public preloadCriticalChunks(chunkNames: string[]) {
    if (!this.config.preloadCriticalChunks) return;

    chunkNames.forEach(chunkName => {
      if (!this.preloadedChunks.has(chunkName)) {
        this.preloadChunk(chunkName);
        this.preloadedChunks.add(chunkName);
      }
    });
  }

  private preloadChunk(chunkName: string) {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = `/_next/static/chunks/${chunkName}.js`;
    document.head.appendChild(link);

    // Clean up after 30 seconds
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 30000);
  }

  private recordChunkLoad(chunkName: string, loadTime: number) {
    // Log slow chunk loads
    if (loadTime > 1000) {
      console.warn(`Slow chunk load detected: ${chunkName} (${Math.round(loadTime)}ms)`);
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'chunk_load', {
        chunk_name: chunkName,
        load_time: Math.round(loadTime),
        strategy: this.config.strategy,
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private isSlowConnection(): boolean {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return ['slow-2g', '2g', '3g'].includes(connection.effectiveType);
    }
    return false;
  }

  private hasLowMemory(): boolean {
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory <= 4;
    }
    return false;
  }

  public getConfig(): BundleOptimizationConfig {
    return { ...this.config };
  }

  public getLoadedChunks(): string[] {
    return Array.from(this.loadedChunks);
  }
}

// Component lazy loading utilities
import React from 'react';

export function createMobileLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string,
  fallback?: React.ComponentType
) {
  const optimizer = MobileBundleOptimizer.getInstance();
  
  return React.lazy(async () => {
    return optimizer.optimizedImport(importFn, chunkName, 'medium');
  });
}

// Hook for bundle optimization
export function useBundleOptimization() {
  const optimizer = MobileBundleOptimizer.getInstance();
  
  const preloadCritical = (chunkNames: string[]) => {
    optimizer.preloadCriticalChunks(chunkNames);
  };
  
  const getConfig = () => optimizer.getConfig();
  const getLoadedChunks = () => optimizer.getLoadedChunks();
  
  return {
    preloadCritical,
    getConfig,
    getLoadedChunks,
  };
}

// Critical chunk definitions for the application
export const CRITICAL_CHUNKS = {
  // Core functionality
  CITY_CARD: 'city-card',
  IMAGE_GALLERY: 'image-gallery',
  SEARCH: 'search',
  
  // User interactions
  LIKE_BUTTON: 'like-button',
  FAVORITE_BUTTON: 'favorite-button',
  COMMENTS: 'comments',
  
  // Admin features (low priority)
  ADMIN_PANEL: 'admin-panel',
  UPLOAD_FORM: 'upload-form',
  
  // Third-party libraries
  PHOTOSWIPE: 'photoswipe',
  LEAFLET: 'leaflet',
  FANCYBOX: 'fancybox',
};

// Mobile-specific component loading strategies
export const MOBILE_LOADING_STRATEGIES = {
  // Load immediately on mobile
  CRITICAL: ['CITY_CARD', 'SEARCH', 'LIKE_BUTTON', 'FAVORITE_BUTTON'],
  
  // Load on interaction
  ON_DEMAND: ['IMAGE_GALLERY', 'COMMENTS', 'PHOTOSWIPE'],
  
  // Load only when needed
  LAZY: ['ADMIN_PANEL', 'UPLOAD_FORM', 'LEAFLET', 'FANCYBOX'],
};

// Global instance
export const mobileBundleOptimizer = MobileBundleOptimizer.getInstance();

// Initialize critical chunk preloading
if (typeof window !== 'undefined') {
  // Preload critical chunks after initial load
  window.addEventListener('load', () => {
    const config = mobileBundleOptimizer.getConfig();
    if (config.preloadCriticalChunks) {
      mobileBundleOptimizer.preloadCriticalChunks(MOBILE_LOADING_STRATEGIES.CRITICAL);
    }
  });
}