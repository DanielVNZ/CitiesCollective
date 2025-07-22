'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ImageSortOption } from 'app/components/ImageSortSelector';
import { getSortOptionFromUrl, updateUrlWithSort } from 'app/utils/imageSorting';

export function useImageSorting(defaultSort: ImageSortOption = 'most-recent') {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [currentSort, setCurrentSort] = useState<ImageSortOption>(() => {
    // Get initial sort from URL or use default
    if (typeof window !== 'undefined') {
      return getSortOptionFromUrl(new URLSearchParams(window.location.search));
    }
    return defaultSort;
  });

  // Only update from URL on initial load, not on every searchParams change
  useEffect(() => {
    const urlSort = getSortOptionFromUrl(new URLSearchParams(searchParams.toString()));
    if (urlSort !== currentSort && currentSort === defaultSort) {
      setCurrentSort(urlSort);
    }
  }, []); // Only run once on mount

  const handleSortChange = (newSort: ImageSortOption) => {
    setCurrentSort(newSort);
    
    // Update URL without page refresh using replaceState
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    window.history.replaceState({}, '', `${pathname}?${params.toString()}`);
    
    // Force the component to re-render immediately
    // The URL change might not trigger searchParams update immediately
  };

  return {
    currentSort,
    handleSortChange,
    setCurrentSort
  };
} 