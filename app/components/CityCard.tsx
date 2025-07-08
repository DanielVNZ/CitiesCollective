import Link from 'next/link';
import { LikeButton } from './LikeButton';
import { FavoriteButton } from './FavoriteButton';

interface City {
  id: number;
  userId?: number | null;
  cityName: string | null;
  mapName: string | null;
  population: number | null;
  money: number | null;
  xp: number | null;
  theme: string | null;
  gameMode: string | null;
  uploadedAt: Date | null;
  primaryImageThumbnail?: string | null;
  authorUsername?: string | null;
  modsEnabled?: string[] | null;
}

interface CityCardProps {
  city: City;
  ranking?: number;
}

export function CityCard({ city, ranking }: CityCardProps) {
  const formatNumber = (num: number | null) => {
    if (!num) return '0';
    
    // For very large numbers, use abbreviations
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2).replace(/\.?0+$/, '') + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    }
    
    return num.toLocaleString();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    // Use consistent date formatting to avoid hydration errors
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200">
        <Link href={`/city/${city.id}`} className="block w-full h-full">
          {city.primaryImageThumbnail ? (
            <img
              src={city.primaryImageThumbnail}
              alt={`${city.cityName || 'City'} screenshot`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
              <div className="text-center">
                <div className="text-4xl text-blue-400 mb-2">🏙️</div>
                <p className="text-blue-600 text-sm font-medium">No Image</p>
              </div>
            </div>
          )}
        </Link>
        
        {/* Like Button - Top Left Corner */}
        <div className="absolute top-3 left-3 z-10">
          <LikeButton cityId={city.id} size="sm" />
        </div>
        
        {/* Ranking Badge - Bottom Left Corner */}
        {ranking && (
          <div className="absolute bottom-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm font-bold shadow-lg z-10">
            #{ranking}
          </div>
        )}
        
        {/* Theme Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">
            {city.theme || 'Default'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* City Header */}
        <Link href={`/city/${city.id}`} className="block mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {city.cityName || 'Unnamed City'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{city.mapName || 'Unknown Map'}</p>
        </Link>
        
        {/* Author */}
        {city.authorUsername && city.userId && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              by <Link 
                href={`/user/${city.userId}`}
                className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              >
                {city.authorUsername}
              </Link>
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white break-words">
              {formatNumber(city.population)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Population</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white break-words">
              ${formatNumber(city.money)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Money</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white break-words">
              {formatNumber(city.xp)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">XP</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              {city.gameMode || 'Normal'}
            </span>
            {city.modsEnabled && city.modsEnabled.length > 0 ? (
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">
                Modded
              </span>
            ) : (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                Vanilla
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span>{formatDate(city.uploadedAt)}</span>
            <FavoriteButton cityId={city.id} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
} 