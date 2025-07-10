import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCityById, getUserById, getCityImages, getUser } from 'app/db';
import { ImageGallery } from './ImageGallery';
import { ImageManager } from 'app/components/ImageManager';
import { LikeButton } from 'app/components/LikeButton';
import { FavoriteButton } from 'app/components/FavoriteButton';
import { Comments } from 'app/components/Comments';
import { CityDescription } from 'app/components/CityDescription';
import { OsmMapManager } from 'app/components/OsmMapManager';
import { auth } from 'app/auth';
import { ImageSection } from './ImageSection';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';

interface CityDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CityDetailPage({ params }: CityDetailPageProps) {
  const cityId = parseInt(params.id);
  if (isNaN(cityId)) {
    notFound();
  }

  const [city, images] = await Promise.all([
    getCityById(cityId),
    getCityImages(cityId)
  ]);

  if (!city) {
    notFound();
  }

  // Get the user who uploaded this city
  const user = city.userId ? await getUserById(city.userId) : null;

  // Check if current user is the owner
  const session = await auth();
  let isOwner = false;
  if (session?.user?.email) {
    const currentUserData = await getUser(session.user.email);
    const currentUser = currentUserData && currentUserData[0];
    isOwner = currentUser && currentUser.id === city.userId;
  }

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
    return new Date(date).toLocaleDateString('en-GB');
  };

  const simulationDate = city.simulationDate as any;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              ← Back to Cities
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">City Details</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Section - handles both gallery and management */}
        <ImageSection cityId={cityId} initialImages={images} isOwner={isOwner} />

        {/* OSM Map Section */}
        <OsmMapManager 
          cityId={cityId} 
          initialOsmMapPath={city.osmMapPath} 
          isOwner={isOwner} 
        />

        {/* City Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {city.cityName || 'Unnamed City'}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-3">
                {city.mapName || 'Unknown Map'} • {city.theme || 'Default Theme'}
              </p>
              {/* Creator Information */}
              {user && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created by</p>
                    <Link 
                      href={`/user/${user.id}`}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      {user.username || user.email || 'Unknown User'}
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right space-y-2">
              <div>
                <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full font-medium">
                  {city.gameMode || 'Normal Mode'}
                </span>
              </div>
              {/* Download Button */}
              {city.filePath && (city.downloadable || isOwner) && session ? (
                <div>
                  <a
                    href={`/api/cities/${city.id}/download`}
                    download
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Save File
                    {isOwner && !city.downloadable && (
                      <span className="ml-2 text-xs bg-green-500 px-2 py-1 rounded">Owner</span>
                    )}
                  </a>
                </div>
              ) : city.filePath && (city.downloadable || isOwner) && !session ? (
                <div>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/city/${city.id}`)}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login to Download
                  </Link>
                </div>
              ) : null}
              {/* Show message when download is disabled */}
              {city.filePath && !city.downloadable && !isOwner && (
                <div className="text-right">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-10V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Disabled
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-700 dark:text-green-400 mb-2 break-words">
                {formatNumber(city.population)}
              </div>
              <div className="text-lg text-green-600 dark:text-green-300">Population</div>
            </div>
            <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-700 dark:text-yellow-400 mb-2 break-words">
                ${formatNumber(city.money)}
              </div>
              <div className="text-lg text-yellow-600 dark:text-yellow-300">Money</div>
            </div>
            <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-700 dark:text-purple-400 mb-2 break-words">
                {formatNumber(city.xp)}
              </div>
              <div className="text-lg text-purple-600 dark:text-purple-300">Experience Points</div>
            </div>
          </div>

          {/* Community Actions */}
          <div className="flex justify-center items-center space-x-4 mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <LikeButton cityId={city.id} size="lg" />
            <FavoriteButton cityId={city.id} size="lg" />
          </div>

          {/* Game Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-lg text-center ${city.leftHandTraffic ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
              <div className="font-semibold">Left-hand Traffic</div>
              <div className="text-sm">{city.leftHandTraffic ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${city.naturalDisasters ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
              <div className="font-semibold">Natural Disasters</div>
              <div className="text-sm">{city.naturalDisasters ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${city.unlimitedMoney ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
              <div className="font-semibold">Unlimited Money</div>
              <div className="text-sm">{city.unlimitedMoney ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${city.unlockMapTiles ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
              <div className="font-semibold">Unlock Map Tiles</div>
              <div className="text-sm">{city.unlockMapTiles ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>

          {/* Simulation Date */}
          {simulationDate && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">Simulation Date</h3>
              <p className="text-blue-700 dark:text-blue-300">
                Year {simulationDate.year}, Month {simulationDate.month}, 
                {simulationDate.hour !== undefined && simulationDate.minute !== undefined && 
                  ` ${simulationDate.hour.toString().padStart(2, '0')}:${simulationDate.minute.toString().padStart(2, '0')}`
                }
              </p>
            </div>
          )}
        </div>

        {/* City Description */}
        <CityDescription 
          cityId={cityId} 
          initialDescription={city.description} 
          isOwner={isOwner} 
        />

        <div className={`grid gap-8 ${
          city.contentPrerequisites && city.contentPrerequisites.length > 0 
            ? 'grid-cols-1 lg:grid-cols-2' 
            : 'grid-cols-1'
        }`}>
          {/* Content Prerequisites */}
          {city.contentPrerequisites && city.contentPrerequisites.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Required DLC</h3>
              <div className="flex flex-wrap gap-2">
                {city.contentPrerequisites.map((dlc: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 text-sm rounded-full"
                  >
                    {dlc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mods */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {city.modsEnabled && city.modsEnabled.length > 0 ? (
                <>Mods ({city.modsEnabled.length})</>
              ) : (
                <>Mods - Vanilla</>
              )}
            </h3>
            {city.modsEnabled && city.modsEnabled.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {city.modsEnabled.map((mod: string, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
                    >
                      {mod.replace(', Version=', ' v').replace(', Culture=neutral, PublicKeyToken=null', '')}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎮</div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  This city uses no mods - it&apos;s completely vanilla!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  This save file will work without any additional mods or dependencies.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* File Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">File Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Filename:</span> <span className="text-gray-900 dark:text-white">{city.fileName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Uploaded:</span> <span className="text-gray-900 dark:text-white">{formatDate(city.uploadedAt)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Session GUID:</span> 
              <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white">{city.sessionGuid}</code>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Auto Save:</span> <span className="text-gray-900 dark:text-white">{city.autoSave ? 'Yes' : 'No'}</span>
            </div>
            {city.filePath && (
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Save File:</span> <span className="text-gray-900 dark:text-white">Available for download</span>
              </div>
            )}
            {images.length > 0 && (
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Screenshots:</span> <span className="text-gray-900 dark:text-white">{images.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8">
          <Comments cityId={city.id} />
        </div>
      </main>
    </div>
  );
} 