import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCityById, getUserById, getCityImages, getUser, getModCompatibility, getTopCitiesWithImages, getHallOfFameImagesForCity } from 'app/db';
import { ImageGallery } from './ImageGallery';
import { ImageManager } from 'app/components/ImageManager';
import { LikeButton } from 'app/components/LikeButton';
import { FavoriteButton } from 'app/components/FavoriteButton';
import { Comments } from 'app/components/Comments';
import { CityDescription } from 'app/components/CityDescription';
import { OsmMapManager } from 'app/components/OsmMapManager';
import { MapLegend } from 'app/components/MapLegend';
import { auth } from 'app/auth';
import { ImageSection } from './ImageSection';
import { getUsernameTextColor, getUsernameAvatarColor } from 'app/utils/userColors';
import { Header } from 'app/components/Header';
import { isUserAdmin } from 'app/db';
import { ClientComponents } from './ClientComponents';
import CityHallOfFameImages from 'app/components/CityHallOfFameImages';

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

  const [city, images, hallOfFameImages] = await Promise.all([
    getCityById(cityId),
    getCityImages(cityId),
    getHallOfFameImagesForCity(cityId)
  ]);

  if (!city) {
    notFound();
  }

  // No need to parse modsEnabled - it should already be an array from the database
  // Just use city.modsEnabled directly like the old working code

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

  // Helper function to parse mod string and extract ID if available
  const parseModString = (modString: string) => {
    // Try to extract mod ID from the string (format: "ModName, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null")
    // For Skyve mods, we might have stored them with a special format that includes the ID
    const match = modString.match(/^(\d+):\s*(.+?)(?:\s+(\d+\.\d+\.\d+\.\d+))?$/);
    if (match) {
      // This is a Skyve mod with ID
      return {
        id: match[1],
        name: match[2].trim(),
        version: match[3] || undefined,
        isSkyveMod: true
      };
    }
    
    // Regular mod string - extract name and version
    const nameMatch = modString.match(/^(.+?)(?:,\s*Version=([^,]+))?/);
    if (nameMatch) {
      return {
        id: null,
        name: nameMatch[1].trim(),
        version: nameMatch[2] || undefined,
        isSkyveMod: false
      };
    }
    
    // Fallback
    return {
      id: null,
      name: modString,
      version: undefined,
      isSkyveMod: false
    };
  };

  // Get mod compatibility data from cache, with fallback to city-specific notes
  let modNotes: { [key: string]: string[] } = {};
  
  // First, try to get cached compatibility data
  if (city.modsEnabled && city.modsEnabled.length > 0) {
    // Get all mod IDs from the city
    const modIds = city.modsEnabled
      .map((mod: string) => parseModString(mod))
      .filter((parsed: any) => parsed.isSkyveMod && parsed.id)
      .map((parsed: any) => parsed.id!);
    
    // Fetch compatibility data for all mods
    const modCompatibilityPromises = modIds.map(async (modId: string) => {
      const compatibility = await getModCompatibility(modId);
      return { modId, compatibility };
    });
    
    const modCompatibilityResults = await Promise.all(modCompatibilityPromises);
    
    // Build notes object from cached data
    modCompatibilityResults.forEach(({ modId, compatibility }: any) => {
      if (compatibility && compatibility.notes && compatibility.notes.length > 0) {
        modNotes[modId] = compatibility.notes;
      }
    });
  }
  
  // Fallback to city-specific notes if cached data isn't available
  if (Object.keys(modNotes).length === 0 && city.modsNotes) {
    try {
      modNotes = JSON.parse(city.modsNotes);
    } catch (error) {
      console.error('Failed to parse city-specific mod notes:', error);
    }
  }

  const simulationDate = city.simulationDate as any;

  // Get user colors
  const username = user?.username || user?.email || 'Unknown User';
  const usernameTextColor = getUsernameTextColor(username);
  const usernameAvatarColor = getUsernameAvatarColor(username);

  const isAdmin = session?.user?.email ? await isUserAdmin(session.user.email) : false;
  
  // Check if this city is featured on the home page (in top 25)
  const topCities = await getTopCitiesWithImages(25);
  const isFeaturedOnHomePage = topCities.some(topCity => topCity.id === cityId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Images Section - Dynamic layout based on available images */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Screenshots Section */}
          {images.length > 0 && (
            <div className={`order-2 xl:order-1 ${hallOfFameImages.length === 0 ? 'xl:col-span-2' : ''}`}>
              <ImageSection cityId={cityId} initialImages={images} isOwner={isOwner} />
            </div>
          )}
          
          {/* Hall of Fame Images */}
          {user?.hofCreatorId && hallOfFameImages.length > 0 && (
            <div className={`order-1 xl:order-2 ${images.length === 0 ? 'xl:col-span-2' : ''}`}>
              <CityHallOfFameImages 
                cityName={city.cityName || ''} 
                hofCreatorId={user?.hofCreatorId || null} 
                cityId={cityId}
                isOwner={isOwner}
                isFeaturedOnHomePage={isFeaturedOnHomePage}
              />
            </div>
          )}
        </div>

        {/* Main Content Grid - Map and other content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Map and Details Section - Full width */}
          {(city.osmMapPath || isOwner) && (
            <div className="xl:col-span-3">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Map */}
                <div className="xl:col-span-2">
                  <OsmMapManager 
                    cityId={cityId} 
                    initialOsmMapPath={city.osmMapPath} 
                    isOwner={isOwner} 
                  />
                </div>
                
                {/* Map Legend and Download Section */}
                {city.osmMapPath && (
                  <div className="xl:col-span-1 space-y-6">
                    {/* Map Legend */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <MapLegend />
                    </div>
                    
                    {/* OSM Download Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">OSM Map File</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              {city.osmMapPath?.split('/').pop() || 'osm-map.osm'}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <a
                            href={city.osmMapPath}
                            download
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download OSM File
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Special Thanks Section */}
        {city.osmMapPath && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Special thanks to{' '}
                  <a 
                    href="https://github.com/fergusq" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                  >
                    ferqusq
                  </a>
                  {' '}for the OSM export functionality
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <a 
                    href="https://mods.paradoxplaza.com/mods/87422/Windows" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                  >
                    OSM Export Mod
                  </a>
                  {' '}- Use this mod to create your OSM files
                </p>
              </div>
            </div>
          </div>
        )}

        {/* City Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
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
                  <div className={`w-10 h-10 bg-gradient-to-br ${usernameAvatarColor} rounded-full flex items-center justify-center text-white font-bold`}>
                    {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created by</p>
                    <Link 
                      href={`/user/${user.id}`}
                      className={`text-lg font-semibold ${usernameTextColor} hover:underline`}
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
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 shadow-lg">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-700 dark:text-green-400 mb-3 break-words">
                {formatNumber(city.population)}
              </div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-300">Population</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-lg">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-700 dark:text-yellow-400 mb-3 break-words">
                {city.unlimitedMoney ? '∞' : `$${formatNumber(city.money)}`}
              </div>
              <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-300">Money</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800 shadow-lg">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-purple-700 dark:text-purple-400 mb-3 break-words">
                {formatNumber(city.xp)}
              </div>
              <div className="text-lg font-semibold text-purple-600 dark:text-purple-300">Experience Points</div>
            </div>
          </div>

          {/* Community Actions */}
          <div className="flex justify-center items-center mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Community Actions</h3>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Like and favorite this city using the floating buttons in the bottom right corner
              </p>
            </div>
          </div>

          {/* Game Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className={`p-5 rounded-xl text-center border shadow-lg transition-all duration-200 ${city.leftHandTraffic ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
              <div className="font-bold text-lg mb-1">Left-hand Traffic</div>
              <div className="text-sm font-medium">{city.leftHandTraffic ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div className={`p-5 rounded-xl text-center border shadow-lg transition-all duration-200 ${city.naturalDisasters ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
              <div className="font-bold text-lg mb-1">Natural Disasters</div>
              <div className="text-sm font-medium">{city.naturalDisasters ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div className={`p-5 rounded-xl text-center border shadow-lg transition-all duration-200 ${city.unlimitedMoney ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
              <div className="font-bold text-lg mb-1">Unlimited Money</div>
              <div className="text-sm font-medium">{city.unlimitedMoney ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div className={`p-5 rounded-xl text-center border shadow-lg transition-all duration-200 ${city.unlockMapTiles ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
              <div className="font-bold text-lg mb-1">Unlock Map Tiles</div>
              <div className="text-sm font-medium">{city.unlockMapTiles ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>

          {/* Simulation Date */}
          {simulationDate && (
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-lg">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-3">Simulation Date</h3>
              <p className="text-blue-700 dark:text-blue-300 text-lg">
                Year {simulationDate.year}, Month {simulationDate.month}
                {simulationDate.hour !== undefined && simulationDate.minute !== undefined && 
                  ` • ${simulationDate.hour.toString().padStart(2, '0')}:${simulationDate.minute.toString().padStart(2, '0')}`
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Required DLC</h3>
              <div className="flex flex-wrap gap-3">
                {city.contentPrerequisites.map((dlc: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 text-orange-800 dark:text-orange-400 text-sm font-medium rounded-full border border-orange-200 dark:border-orange-800 shadow-sm"
                  >
                    {dlc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mods */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {city.modsEnabled && city.modsEnabled.length > 0 ? (
                <>Mods ({city.modsEnabled.length})</>
              ) : (
                <>Mods - Vanilla</>
              )}
            </h3>
            {city.modsEnabled && city.modsEnabled.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {city.modsEnabled.map((mod: string, index: number) => {
                    const parsedMod = parseModString(mod);
                    return (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
                      >
                        {parsedMod.isSkyveMod && parsedMod.id ? (
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <a
                                  href={`https://mods.paradoxplaza.com/mods/${parsedMod.id}/Windows`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                  {parsedMod.name}
                                </a>
                                {parsedMod.version && (
                                  <span className="text-gray-500 dark:text-gray-400 ml-2">v{parsedMod.version}</span>
                                )}
                              </div>
                              <span className="text-gray-400 dark:text-gray-500 text-xs">#{parsedMod.id}</span>
                            </div>
                            {/* Show mod notes if available */}
                            {modNotes[parsedMod.id] && (
                              <div className="mt-2 pl-4 border-l-2 border-orange-300 dark:border-orange-600">
                                {modNotes[parsedMod.id].map((note, noteIndex) => (
                                  <div key={noteIndex} className="text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 p-2 rounded mb-1">
                                    <span className="font-medium">⚠️ Note:</span> {note}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {/* For non-Skyve mods, use the simple format from the old working code */}
                            {mod.replace(', Version=', ' v').replace(', Culture=neutral, PublicKeyToken=null', '')}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
            
            {/* Skyve logs message */}
            {city.modsEnabled && city.modsEnabled.length > 0 && city.modsEnabled.some((mod: string) => {
              const parsedMod = parseModString(mod);
              return parsedMod.isSkyveMod && parsedMod.id;
            }) && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Skyve logs are produced from Skyve. Compatibility data is cached and synchronized across all cities - notes are automatically updated when newer compatibility information is available.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* File Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">File Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="font-semibold text-gray-600 dark:text-gray-400 block mb-1">Filename</span>
              <span className="text-gray-900 dark:text-white font-medium">{city.fileName}</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="font-semibold text-gray-600 dark:text-gray-400 block mb-1">Uploaded</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatDate(city.uploadedAt)}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <Comments cityId={city.id} />
        </div>
      </main>
      
      {/* Client-side components */}
      <ClientComponents cityId={cityId} />
    </div>
  );
}