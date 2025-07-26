'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TouchOptimizedButton } from './TouchOptimizedButton';

interface LikeButtonProps {
  cityId: number;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function LikeButton({ cityId, initialLiked = false, initialCount = 0, size = 'md' }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch initial like status
    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/cities/${cityId}/like`);
        if (response.ok) {
          const data = await response.json();
          setLiked(data.isLiked);
          setCount(data.likeCount);
        }
      } catch (error) {
        console.error('Error fetching like status:', error);
      }
    };

    fetchLikeStatus();
  }, [cityId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/cities/${cityId}/like`, {
        method: 'POST',
      });
      
      if (response.status === 401) {
        // Redirect to login if not authenticated
        router.push('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizes = {
    sm: 'px-2.5 py-1.5 min-h-[36px]',
    md: 'px-3 py-2 min-h-[44px]',
    lg: 'px-4 py-3 min-h-[52px]'
  };

  return (
    <TouchOptimizedButton
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center space-x-1.5 rounded-lg transition-all duration-200 ${
        liked 
          ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 shadow-sm' 
          : 'text-gray-700 hover:text-red-600 hover:bg-red-50 bg-white/80 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:text-red-400'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'} ${sizeClasses[size]} ${buttonSizes[size]}`}
      ariaLabel={liked ? 'Unlike this city' : 'Like this city'}
      feedback={{
        haptic: true,
        visual: true,
        intensity: liked ? 'medium' : 'light',
      }}
      minTouchTarget={size === 'sm' ? 36 : size === 'md' ? 44 : 52}
    >
      <svg 
        className={`${iconSizes[size]} ${liked ? 'fill-current' : 'fill-none'}`}
        stroke="currentColor" 
        strokeWidth="2" 
        viewBox="0 0 24 24"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span className="font-semibold text-sm">{count}</span>
    </TouchOptimizedButton>
  );
} 