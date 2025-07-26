'use client';

// Mobile performance monitoring and optimization utilities

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Additional metrics
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Mobile-specific metrics
  deviceMemory?: number;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  
  // Custom metrics
  imageLoadTime?: number;
  apiResponseTime?: number;
  bundleLoadTime?: number;
}

export class MobilePerformanceMonitor {
  private static instance: MobilePerformanceMonitor;
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = this.checkSupport();
    if (this.isSupported) {
      this.initializeObservers();
      this.collectDeviceInfo();
    }
  }

  public static getInstance(): MobilePerformanceMonitor {
    if (!MobilePerformanceMonitor.instance) {
      MobilePerformanceMonitor.instance = new MobilePerformanceMonitor();
    }
    return MobilePerformanceMonitor.instance;
  }

  private checkSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      'PerformanceObserver' in window &&
      'performance' in window
    );
  }

  private initializeObservers() {
    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('fid', this.metrics.fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
        this.reportMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }

    // Navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fcp = entry.firstContentfulPaint;
          this.metrics.ttfb = entry.responseStart - entry.requestStart;
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }

    // Resource timing for images and API calls
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.initiatorType === 'img') {
            this.metrics.imageLoadTime = entry.duration;
          } else if (entry.name.includes('/api/')) {
            this.metrics.apiResponseTime = entry.duration;
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource observer not supported:', error);
    }
  }

  private collectDeviceInfo() {
    // Device memory
    if ('deviceMemory' in navigator) {
      this.metrics.deviceMemory = (navigator as any).deviceMemory;
    }

    // Network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.type;
      this.metrics.effectiveType = connection.effectiveType;
      this.metrics.downlink = connection.downlink;
      this.metrics.rtt = connection.rtt;
    }
  }

  private reportMetric(name: string, value: number) {
    // Only report significant metrics to avoid spam
    const thresholds = {
      lcp: 2500, // Report if LCP > 2.5s
      fid: 100,  // Report if FID > 100ms
      cls: 0.1,  // Report if CLS > 0.1
      imageLoadTime: 1000, // Report if image load > 1s
      apiResponseTime: 500, // Report if API response > 500ms
    };

    if (thresholds[name as keyof typeof thresholds] && 
        value > thresholds[name as keyof typeof thresholds]) {
      console.warn(`Performance issue detected - ${name}: ${value}`);
      
      // Send to analytics if available
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'performance_issue', {
          metric_name: name,
          metric_value: value,
          device_memory: this.metrics.deviceMemory,
          connection_type: this.metrics.effectiveType,
        });
      }
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getCoreWebVitals(): { lcp?: number; fid?: number; cls?: number } {
    return {
      lcp: this.metrics.lcp,
      fid: this.metrics.fid,
      cls: this.metrics.cls,
    };
  }

  public isSlowDevice(): boolean {
    return (
      (this.metrics.deviceMemory !== undefined && this.metrics.deviceMemory <= 4) ||
      (this.metrics.effectiveType !== undefined && 
       ['slow-2g', '2g', '3g'].includes(this.metrics.effectiveType))
    );
  }

  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      recommendations.push('Consider optimizing largest contentful paint');
    }
    
    if (this.metrics.fid && this.metrics.fid > 100) {
      recommendations.push('Consider reducing JavaScript execution time');
    }
    
    if (this.metrics.cls && this.metrics.cls > 0.1) {
      recommendations.push('Consider fixing layout shifts');
    }
    
    if (this.isSlowDevice()) {
      recommendations.push('Consider enabling mobile-optimized mode');
    }
    
    return recommendations;
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Bundle size monitoring
export class BundleMonitor {
  private static instance: BundleMonitor;
  private bundleSizes: Map<string, number> = new Map();
  private loadTimes: Map<string, number> = new Map();

  public static getInstance(): BundleMonitor {
    if (!BundleMonitor.instance) {
      BundleMonitor.instance = new BundleMonitor();
    }
    return BundleMonitor.instance;
  }

  public recordBundleLoad(bundleName: string, size: number, loadTime: number) {
    this.bundleSizes.set(bundleName, size);
    this.loadTimes.set(bundleName, loadTime);
    
    // Warn about large bundles on mobile
    if (this.isMobile() && size > 200 * 1024) { // 200KB
      console.warn(`Large bundle detected on mobile: ${bundleName} (${Math.round(size / 1024)}KB)`);
    }
  }

  public getBundleStats() {
    const sizeValues = Array.from(this.bundleSizes.values());
    const timeValues = Array.from(this.loadTimes.values());
    
    const totalSize = sizeValues.reduce((a, b) => a + b, 0);
    const averageLoadTime = timeValues.length > 0 ? timeValues.reduce((a, b) => a + b, 0) / timeValues.length : 0;
    
    return {
      totalSize,
      averageLoadTime,
      bundleCount: this.bundleSizes.size,
      largestBundle: sizeValues.length > 0 ? Math.max(...sizeValues) : 0,
    };
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}

// Mobile-specific optimization utilities
export class MobileOptimizer {
  private static instance: MobileOptimizer;
  private performanceMonitor: MobilePerformanceMonitor;
  private bundleMonitor: BundleMonitor;

  constructor() {
    this.performanceMonitor = MobilePerformanceMonitor.getInstance();
    this.bundleMonitor = BundleMonitor.getInstance();
  }

  public static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  public shouldEnableMobileMode(): boolean {
    return (
      this.performanceMonitor.isSlowDevice() ||
      this.isMobileDevice() ||
      this.isSlowConnection()
    );
  }

  public getOptimalImageQuality(): number {
    if (this.performanceMonitor.isSlowDevice()) return 60;
    if (this.isMobileDevice()) return 70;
    return 85;
  }

  public getOptimalBundleStrategy(): 'aggressive' | 'moderate' | 'conservative' {
    if (this.performanceMonitor.isSlowDevice()) return 'aggressive';
    if (this.isMobileDevice()) return 'moderate';
    return 'conservative';
  }

  public shouldPreloadImages(): boolean {
    return !this.performanceMonitor.isSlowDevice() && !this.isSlowConnection();
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
}

// Global instances
export const mobilePerformanceMonitor = MobilePerformanceMonitor.getInstance();
export const bundleMonitor = BundleMonitor.getInstance();
export const mobileOptimizer = MobileOptimizer.getInstance();

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const getMetrics = () => mobilePerformanceMonitor.getMetrics();
  const getCoreWebVitals = () => mobilePerformanceMonitor.getCoreWebVitals();
  const getRecommendations = () => mobilePerformanceMonitor.getOptimizationRecommendations();
  const isSlowDevice = () => mobilePerformanceMonitor.isSlowDevice();
  
  return {
    getMetrics,
    getCoreWebVitals,
    getRecommendations,
    isSlowDevice,
  };
}