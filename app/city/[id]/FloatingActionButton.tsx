'use client';

import { useState, useEffect } from 'react';
import { LikeButton } from 'app/components/LikeButton';
import { FavoriteButton } from 'app/components/FavoriteButton';

interface FloatingActionButtonProps {
  cityId: number;
}

export function FloatingActionButton({ cityId }: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(true); // Always visible

  // Optional: Hide when at the very top if you want that behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 50); // Show after scrolling just 50px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-row space-x-2">
        {/* Like Button */}
        <div className="hover:scale-105 transition-all duration-200">
          <LikeButton cityId={cityId} size="lg" />
        </div>
        
        {/* Favorite Button */}
        <div className="hover:scale-105 transition-all duration-200">
          <FavoriteButton cityId={cityId} size="lg" />
        </div>
      </div>
    </div>
  );
} 