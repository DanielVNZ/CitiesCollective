import { ImageSortOption } from 'app/components/ImageSortSelector';

export interface SortableImage {
  id: number;
  uploadedAt: string;
  likeCount: number;
  viewCount: number;
  // Add any other properties your images have
  [key: string]: any;
}

export function sortImages(images: SortableImage[], sortOption: ImageSortOption): SortableImage[] {
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return [...images].sort((a, b) => {
    switch (sortOption) {
      case 'most-recent':
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();

      case 'most-liked':
        return (b.likeCount || 0) - (a.likeCount || 0);

      case 'most-likes-per-day':
        const aAgeDays = Math.max(1, (now.getTime() - new Date(a.uploadedAt).getTime()) / oneDayMs);
        const bAgeDays = Math.max(1, (now.getTime() - new Date(b.uploadedAt).getTime()) / oneDayMs);
        const aLikesPerDay = (a.likeCount || 0) / aAgeDays;
        const bLikesPerDay = (b.likeCount || 0) / bAgeDays;
        return bLikesPerDay - aLikesPerDay;

      case 'best-like-view-ratio':
        const aRatio = a.viewCount > 0 ? (a.likeCount || 0) / a.viewCount : 0;
        const bRatio = b.viewCount > 0 ? (b.likeCount || 0) / b.viewCount : 0;
        return bRatio - aRatio;

      case 'most-views-per-day':
        const aViewAgeDays = Math.max(1, (now.getTime() - new Date(a.uploadedAt).getTime()) / oneDayMs);
        const bViewAgeDays = Math.max(1, (now.getTime() - new Date(b.uploadedAt).getTime()) / oneDayMs);
        const aViewsPerDay = (a.viewCount || 0) / aViewAgeDays;
        const bViewsPerDay = (b.viewCount || 0) / bViewAgeDays;
        return bViewsPerDay - aViewsPerDay;

      case 'most-viewed':
        return (b.viewCount || 0) - (a.viewCount || 0);

      default:
        return 0;
    }
  });
}

// Helper function to get sort option from URL params
export function getSortOptionFromUrl(searchParams: URLSearchParams): ImageSortOption {
  const sort = searchParams.get('sort') as ImageSortOption;
  const validSorts: ImageSortOption[] = [
    'most-recent',
    'most-liked', 
    'most-likes-per-day',
    'best-like-view-ratio',
    'most-views-per-day',
    'most-viewed'
  ];
  
  return validSorts.includes(sort) ? sort : 'most-recent';
}

// Helper function to update URL with sort option
export function updateUrlWithSort(sortOption: ImageSortOption, currentUrl: string): string {
  const url = new URL(currentUrl, window.location.origin);
  url.searchParams.set('sort', sortOption);
  return url.toString();
} 