'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ImageWithLoadingProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  enableLazyLoading?: boolean;
  preloadSiblings?: string[]; // URLs of related images to preload
}

export function ImageWithLoading({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  style,
  sizes,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  objectFit = 'cover',
  objectPosition = 'center',
  enableLazyLoading = true,
  preloadSiblings = [],
}: ImageWithLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority || !enableLazyLoading);
  const imgRef = useRef<HTMLDivElement>(null);

  // Generate a simple blur placeholder if none provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  // Simple preloading of sibling images (without complex caching)
  useEffect(() => {
    if (!isInView || !preloadSiblings.length) return;

    preloadSiblings.forEach((siblingUrl) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = siblingUrl;
      document.head.appendChild(link);
    });
  }, [isInView, preloadSiblings]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading || priority || !imgRef.current || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [enableLazyLoading, priority, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const imageProps = {
    src,
    alt,
    onLoad: handleLoad,
    onError: handleError,
    quality,
    sizes,
    className: `transition-opacity duration-300 ${
      isLoading ? 'opacity-0' : 'opacity-100'
    } ${className}`,
    style: {
      objectFit,
      objectPosition,
      ...style,
    },
    placeholder: placeholder as 'blur' | 'empty',
    ...(placeholder === 'blur' && {
      blurDataURL: blurDataURL || defaultBlurDataURL,
    }),
  };

  return (
    <div ref={imgRef} className="relative overflow-hidden">
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mb-2"
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
          <span className="text-sm">Failed to load image</span>
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