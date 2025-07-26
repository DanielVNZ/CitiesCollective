'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  generateMobileImageUrls, 
  generateResponsiveSizes, 
  getDeviceInfo,
  createMobileIntersectionObserver,
  mobileImagePerformanceMonitor,
  optimizeMobileViewport
} from '../utils/mobile-image-optimization';

interface MobileOptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  imageType?: 'thumbnail' | 'medium' | 'large';
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  enableLazyLoading?: boolean;
  preloadSiblings?: string[];
  enableTouchOptimization?: boolean;
}

export function MobileOptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  style,
  priority = false,
  imageType = 'medium',
  onLoad,
  onError,
  objectFit = 'cover',
  objectPosition = 'center',
  enableLazyLoading = true,
  preloadSiblings = [],
  enableTouchOptimization = true,
}: MobileOptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority || !enableLazyLoading);
  const [loadStartTime, setLoadStartTime] = useState(0);
  const imgRef = useRef<HTMLDivElement>(null);
  const [deviceInfo] = useState(() => getDeviceInfo());

  // For now, use original URLs since the image services don't support query parameter optimization
  const responsiveSizes = generateResponsiveSizes(imageType);

  // Optimize viewport on mount
  useEffect(() => {
    const cleanup = optimizeMobileViewport();
    return cleanup;
  }, []);

  // Mobile-optimized intersection observer
  useEffect(() => {
    if (!enableLazyLoading || priority || !imgRef.current || isInView) return;

    // Use standard intersection observer for now to ensure compatibility
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          setLoadStartTime(Date.now());
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [enableLazyLoading, priority, isInView]);

  // Preload sibling images for mobile
  useEffect(() => {
    if (!isInView || !preloadSiblings.length || deviceInfo.networkSpeed === 'slow') return;

    // Limit preloading on mobile
    const imagesToPreload = deviceInfo.isMobile ? preloadSiblings.slice(0, 2) : preloadSiblings;
    
    imagesToPreload.forEach((siblingUrl) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = siblingUrl;
      
      // Set fetchPriority if supported
      if ('fetchPriority' in link) {
        (link as any).fetchPriority = 'low';
      }
      
      document.head.appendChild(link);

      // Clean up after 30 seconds
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }, 30000);
    });
  }, [isInView, preloadSiblings, deviceInfo]);

  const handleLoad = () => {
    setIsLoading(false);
    
    // Record performance metrics
    if (loadStartTime > 0) {
      const loadTime = Date.now() - loadStartTime;
      mobileImagePerformanceMonitor.recordImageLoad(src, loadTime, undefined, 'optimized');
    }
    
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder based on device capabilities
  const generateBlurPlaceholder = () => {
    if (deviceInfo.networkSpeed === 'slow') {
      // Simple solid color for slow connections
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
    }
    
    // Low-quality blur for better connections
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';
  };

  // Determine optimal image quality based on device and network
  const getOptimalQuality = () => {
    if (deviceInfo.networkSpeed === 'slow') return 60;
    if (deviceInfo.isMobile) return 70;
    if (deviceInfo.isTablet) return 80;
    return 85;
  };

  const imageProps = {
    src: src, // Use original src - works with existing image services
    alt,
    onLoad: handleLoad,
    onError: handleError,
    quality: getOptimalQuality(),
    sizes: responsiveSizes,
    className: `transition-opacity duration-300 ${
      isLoading ? 'opacity-0' : 'opacity-100'
    } ${className}`,
    style: {
      objectFit,
      objectPosition,
      ...style,
    },
    placeholder: 'blur' as const,
    blurDataURL: generateBlurPlaceholder(),
  };

  // Touch optimization styles for mobile
  const touchOptimizedStyles: React.CSSProperties = enableTouchOptimization && deviceInfo.isMobile ? {
    touchAction: 'manipulation',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  } : {};

  return (
    <div 
      ref={imgRef} 
      className="relative overflow-hidden"
      style={touchOptimizedStyles}
    >
      {/* Loading skeleton optimized for mobile */}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          deviceInfo.isMobile 
            ? 'bg-gray-100 dark:bg-gray-800' 
            : 'bg-gray-200 dark:bg-gray-700 animate-pulse'
        }`}>
          {deviceInfo.isMobile ? (
            // Simple loading indicator for mobile
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          ) : (
            // More elaborate loading for desktop
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          )}
        </div>
      )}

      {/* Error state optimized for mobile */}
      {hasError && (
        <div className={`absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 ${
          deviceInfo.isMobile ? 'text-xs' : 'text-sm'
        }`}>
          <svg
            className={`mb-2 ${deviceInfo.isMobile ? 'w-8 h-8' : 'w-12 h-12'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-center">
            {deviceInfo.isMobile ? 'Image failed' : 'Failed to load image'}
          </span>
        </div>
      )}

      {/* Actual image - only render when in view or priority */}
      {(isInView || priority) && !hasError && (
        <>
          {fill ? (
            <Image
              {...imageProps}
              fill
            />
          ) : (
            <Image
              {...imageProps}
              width={width}
              height={height}
            />
          )}
        </>
      )}
    </div>
  );
}