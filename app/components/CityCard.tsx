'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LikeButton } from './LikeButton';
import { FavoriteButton } from './FavoriteButton';
import { getUsernameTextColor, getUsernameAvatarColor, getUsernameRingColor } from '../utils/userColors';

// Helper function to format large numbers
const formatNumber = (num: number | null) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

// Helper function to format dates consistently
const formatDate = (date: string | Date) => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  // Use explicit locale to ensure consistency between server and client
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function CityCard({ city, ranking }: { city: any; ranking?: number }) {
  const primaryImage = city.images?.find((img: any) => img.isPrimary) || city.images?.[0];
  const username = city.user?.username;
  const usernameTextColor = getUsernameTextColor(username);
  const usernameAvatarColor = getUsernameAvatarColor(username);
  const usernameRingColor = getUsernameRingColor(username);

  return (
    <div className="group relative flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden transform hover:-translate-y-1">
      {ranking && (
        <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-lg w-12 h-12 flex items-center justify-center rounded-br-2xl z-10 shadow-lg">
          #{ranking}
        </div>
      )}
      
      <div className="relative">
        <Link href={`/city/${city.id}`} className="block">
          <div className="relative w-full h-48">
            <Image
              src={primaryImage?.mediumPath || '/placeholder-image.png'}
              alt={`Image of ${city.cityName}`}
              fill
              style={{ objectFit: 'cover' }}
              className="group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </div>
        </Link>
        <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
          <LikeButton cityId={city.id} size="sm" />
          <FavoriteButton cityId={city.id} size="sm" />
        </div>
        <div className="absolute bottom-4 left-4 z-10">
          <Link href={`/city/${city.id}`}>
            <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
              {city.cityName || 'Unnamed City'}
            </h3>
            <p className="text-sm text-gray-200">{city.mapName || 'Unknown Map'}</p>
          </Link>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          {city.user && (
            <Link href={`/user/${city.userId}`} className="inline-flex items-center gap-2 mb-4 group/user">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${usernameAvatarColor} flex items-center justify-center text-sm font-bold text-white ring-2 ring-transparent group-hover/user:${usernameRingColor} transition-all`}>
                {city.user.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className={`text-sm font-medium ${usernameTextColor} group-hover/user:${usernameTextColor} transition-colors`}>
                {city.user.username || 'Anonymous'}
              </span>
            </Link>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div title="Population">
              <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(city.population)}</span>
              </div>
            </div>
            <div title="City Funds">
               <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(city.money)}</span>
              </div>
            </div>
             <div title="Experience Points">
               <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(city.xp)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{formatDate(city.uploadedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{city.commentCount} {city.commentCount === 1 ? 'comment' : 'comments'}</span>
            </div>
          </div>
          <Link href={`/city/${city.id}`} className="block w-full text-center bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors">
            View City
          </Link>
        </div>
      </div>
    </div>
  );
} 