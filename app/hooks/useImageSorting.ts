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

  // Update sort when URL changes
  useEffect(() => {
    const urlSort = getSortOptionFromUrl(new URLSearchParams(searchParams.toString()));
    if (urlSort !== currentSort) {
      setCurrentSort(urlSort);
    }
  }, [searchParams, currentSort]);

  const handleSortChange = (newSort: ImageSortOption) => {
    setCurrentSort(newSort);
    
    // Update URL without page refresh
    const newUrl = updateUrlWithSort(newSort, window.location.href);
    router.push(newUrl, { scroll: false });
  };

  return {
    currentSort,
    handleSortChange,
    setCurrentSort
  };
} 