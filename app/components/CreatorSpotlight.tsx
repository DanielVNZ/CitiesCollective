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
    <section className="mb-16 sm:mb-24 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-10 shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Creator Spotlight</h2>
        <p className="text-lg max-w-3xl mx-auto">We&apos;ll be featuring your favourite creators&apos; cities here, encourage them to upload their cities! *cough cough* Biffa and City Planner Plays...</p>
        
        {/* Image Sort Selector */}
        {citiesWithImages.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">Sort images:</span>
              <ImageSortSelector
                currentSort={currentSort}
                onSortChange={handleSortChange}
                size="sm"
              />
            </div>
          </div>
        )}
      </div>
      
      {sortedCities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedCities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      )}
    </section>
  );
} 