'use client';

import { useState, useEffect } from 'react';
import { LikeButton } from 'app/components/LikeButton';
import { FavoriteButton } from 'app/components/FavoriteButton';

interface FloatingActionButtonProps {
  cityId: number;
}

export default function FloatingActionButton({ cityId }: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
    console.log('FloatingActionButton mounted for cityId:', cityId);
  }, [cityId]);

  // Show/hide based on scroll position - always visible now
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(true); // Always visible
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    } ${
      // Mobile-first positioning - bottom center on mobile, bottom right on larger screens
      'bottom-4 left-1/2 transform -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:transform-none'
    }`}>
      <div className="flex flex-row space-x-3 sm:space-x-2">
        {/* Like Button - Normal size */}
        <div className="hover:scale-105 active:scale-95 transition-all duration-200">
          <LikeButton 
            cityId={cityId} 
            size="md" 
          />
        </div>
        
        {/* Favorite Button - Normal size */}
        <div className="hover:scale-105 active:scale-95 transition-all duration-200">
          <FavoriteButton 
            cityId={cityId} 
            size="md" 
          />
        </div>
      </div>
      

    </div>
  );
} 