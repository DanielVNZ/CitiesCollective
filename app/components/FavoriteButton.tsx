'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TouchOptimizedButton } from './TouchOptimizedButton';

interface FavoriteButtonProps {
  cityId: number;
  initialFavorited?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({ cityId, initialFavorited = false, size = 'md' }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch initial favorite status
    const fetchFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/cities/${cityId}/favorite`);
        if (response.ok) {
          const data = await response.json();
          setFavorited(data.isFavorited);
        }
      } catch (error) {
        console.error('Error fetching favorite status:', error);
      }
    };

    fetchFavoriteStatus();
  }, [cityId]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/cities/${cityId}/favorite`, {
        method: 'POST',
      });
      
      if (response.status === 401) {
        // Redirect to login if not authenticated
        router.push('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setFavorited(data.favorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
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

  return (
    <TouchOptimizedButton
      onClick={handleFavorite}
      disabled={loading}
      className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
        favorited 
          ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 shadow-sm' 
          : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 bg-white/80 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:text-yellow-400'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'} ${sizeClasses[size]}`}
      ariaLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
      feedback={{
        haptic: true,
        visual: true,
        intensity: favorited ? 'medium' : 'light',
      }}
      minTouchTarget={44}
    >
      <svg 
        className={`${iconSizes[size]} ${favorited ? 'fill-current' : 'fill-none'}`}
        stroke="currentColor" 
        strokeWidth="2" 
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
      </svg>
    </TouchOptimizedButton>
  );
} 