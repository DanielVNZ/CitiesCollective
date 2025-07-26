'use client';

import { CityCard } from './CityCard';
import ImageSortSelector from './ImageSortSelector';
import { useImageSorting } from 'app/hooks/useImageSorting';
import { sortImages } from 'app/utils/imageSorting';

interface CreatorSpotlightProps {
  cities: Array<{
    id: number;
    cityName: string | null;
    mapName: string | null;
    population: number | null;
    money: number | null;
    xp: number | null;
    unlimitedMoney: boolean | null;
    uploadedAt: Date | null;
    likeCount?: number;
    viewCount?: number;
    user: {
      id: number;
      username: string | null;
      isContentCreator: boolean | null;
    } | null;
    images: Array<{
      id: number;
      fileName: string;
      isPrimary: boolean;
      mediumPath: string;
      largePath: string;
      thumbnailPath: string;
      isHallOfFame?: boolean;
    }>;
    commentCount: number;
  }>;
}

export function CreatorSpotlight({ cities }: CreatorSpotlightProps) {
  const { currentSort, handleSortChange } = useImageSorting('most-recent');
  
  if (cities.length === 0) return null;
  
  // Prepare cities with their primary images for sorting
  const citiesWithImages = cities.map(city => {
    const primaryImage = city.images?.find((img: any) => img.isPrimary) || city.images?.[0];
    return {
      ...city,
      primaryImage: primaryImage ? {
        ...primaryImage,
        uploadedAt: typeof city.uploadedAt === 'string' ? city.uploadedAt : city.uploadedAt?.toISOString() || new Date().toISOString(), // Convert to string for sorting
        likeCount: city.likeCount || 0, // Use city-level like count
        viewCount: city.viewCount || 0  // Use city-level view count
      } : null
    };
  }).filter(city => city.primaryImage); // Only include cities with images

  // Sort cities by their primary images
  const sortedCities = sortImages(citiesWithImages.map(city => city.primaryImage!).filter(Boolean), currentSort).map((sortedImage) => {
    return citiesWithImages.find(c => c.primaryImage?.id === sortedImage.id);
  }).filter((city): city is NonNullable<typeof city> => city !== undefined);

  return (
    <section className="section-modern animate-fade-in">
      {/* Modern container with subtle gradient that works in both themes */}
      <div className="relative overflow-hidden rounded-3xl p-12 shadow-xl bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 border border-blue-100 dark:border-purple-800/30">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-400/10 dark:to-purple-400/10"></div>
        
        {/* Content container */}
        <div className="relative z-10">
          {/* Enhanced header with modern styling */}
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h2 className="heading-modern heading-lg text-primary">
                Creator Spotlight
              </h2>
            </div>
            
            <p className="text-lg text-secondary max-w-4xl mx-auto mb-6 leading-relaxed">
              We&apos;ll be featuring your favourite creators&apos; cities here, encourage them to upload their cities! 
              <span className="text-purple-600 dark:text-purple-400 font-medium"> *cough cough* Biffa and City Planner Plays...</span>
            </p>
            
            {/* Enhanced sort selector */}
            {citiesWithImages.length > 0 && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-md border border-white/20 dark:border-gray-700/50">
                  <span className="text-sm font-medium text-secondary">Sort cities:</span>
                  <ImageSortSelector
                    currentSort={currentSort}
                    onSortChange={handleSortChange}
                    size="sm"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced grid with staggered animations */}
          {sortedCities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedCities.map((city, index) => (
                <div 
                  key={city.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <CityCard city={city} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
} 