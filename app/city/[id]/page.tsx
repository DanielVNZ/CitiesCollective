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
import { ImageTabs } from 'app/components/ImageTabs';
import { auth } from 'app/auth';
import { ImageSection } from './ImageSection';
import { getUsernameTextColor, getUsernameAvatarColor } from 'app/utils/userColors';
import { Header } from 'app/components/Header';
import { isUserAdmin } from 'app/db';
import { ClientComponents } from './ClientComponents';
import CityHallOfFameImages from 'app/components/CityHallOfFameImages';
import { DownloadToggle } from './DownloadToggle';
import { SaveGameSection } from './SaveGameSection';
import { CityNameEditor } from './CityNameEditor';
import { ViewCounter } from 'app/components/ViewCounter';

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
  
  // Check if the city creator is a content creator
  const isContentCreator = user?.isContentCreator;

  return (
    <div className={`min-h-screen ${
      isContentCreator 
        ? 'bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
    }`}>
      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section - City Header */}
        <div className={`rounded-2xl shadow-xl border overflow-hidden ${
          isContentCreator 
            ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* City Info */}
              <div className="flex-1">
                <CityNameEditor
                  cityId={cityId}
                  initialCityName={city.cityName}
                  initialMapName={city.mapName}
                  theme={city.theme}
                  hasHallOfFameImages={hallOfFameImages.length > 0}
                  isOwner={isOwner}
                />

                {/* Creator Information */}
                {user && (
                  <div className={`flex items-center space-x-3 p-4 rounded-xl ${
                    isContentCreator 
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700' 
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600'
                  }`}>
                    <div className="relative">
                      <div className={`w-12 h-12 bg-gradient-to-br ${usernameAvatarColor} rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        isContentCreator ? 'ring-2 ring-purple-300 dark:ring-purple-600 shadow-lg' : ''
                      }`}>
                        {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      {isContentCreator && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full border border-white dark:border-gray-800 flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm ${
                        isContentCreator 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {isContentCreator ? '🎬 Premium Content Creator' : 'Created by'}
                      </p>
                      <Link 
                        href={`/user/${user.id}`}
                        className={`text-lg font-semibold ${usernameTextColor} hover:underline ${
                          isContentCreator ? 'font-bold' : ''
                        }`}
                      >
                        {user.username || user.email || 'Unknown User'}
                        {isContentCreator && <span className="ml-1 text-purple-600 dark:text-purple-400">🎬</span>}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Download Button and View Counter */}
              <div className="lg:flex-shrink-0 flex flex-col items-center lg:items-end gap-4">
                {/* View Counter */}
                <ViewCounter cityId={cityId} initialViewCount={city.viewCount || 0} isContentCreator={isContentCreator || false} trackView={true} />
                
                {/* Download Button */}
                {city.filePath && (city.downloadable || isOwner) && session ? (
                  <a
                    href={`/api/cities/${city.id}/download`}
                    download
                    className={`inline-flex items-center px-6 py-3 text-white text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      isContentCreator 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {isContentCreator ? '🌟 Download Creator Save' : 'Download Save'}
                    {isOwner && !city.downloadable && (
                      <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                        isContentCreator ? 'bg-purple-500' : 'bg-green-500'
                      }`}>Owner</span>
                    )}
                  </a>
                ) : city.filePath && city.downloadable && !session ? (
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/city/${city.id}`)}`}
                    className={`inline-flex items-center px-6 py-3 text-white text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      isContentCreator 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    {isContentCreator ? '🌟 Login to Download Creator Save' : 'Login to Download'}
                  </Link>
                ) : city.filePath && !city.downloadable && !isOwner ? (
                  <button
                    disabled
                    className={`inline-flex items-center px-6 py-3 text-gray-400 dark:text-gray-500 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg bg-gray-200 dark:bg-gray-700 cursor-not-allowed ${
                      isContentCreator 
                        ? 'border-2 border-purple-200 dark:border-purple-700' 
                        : 'border-2 border-gray-200 dark:border-gray-600'
                    }`}
                    title="Downloads disabled by author"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {isContentCreator ? '🌟 Downloads Disabled' : 'Downloads Disabled'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content - Galleries and Description */}
          <div className="xl:col-span-3 space-y-6">
            {/* Images Section - Tabbed interface */}
            <ImageTabs 
              cityId={cityId}
              images={images}
              hallOfFameImages={hallOfFameImages}
              hofCreatorId={user?.hofCreatorId || null}
              cityName={city.cityName || ''}
              isOwner={isOwner}
              isFeaturedOnHomePage={isFeaturedOnHomePage}
              isContentCreator={isContentCreator || false}
            />

            {/* City Description */}
            <div className={`rounded-2xl shadow-xl border overflow-hidden ${
              isContentCreator 
                ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="p-6">
                <h2 className={`text-2xl font-bold mb-6 ${
                  isContentCreator 
                    ? 'text-purple-900 dark:text-purple-100' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {isContentCreator ? '🌟 About This Creator City' : 'About This City'}
                </h2>
                <CityDescription 
                  cityId={cityId} 
                  initialDescription={city.description} 
                  isOwner={isOwner} 
                />
              </div>
            </div>

            {/* Map Section */}
            {(isOwner || city.osmMapPath) && (
              <div className={`rounded-2xl shadow-xl border overflow-hidden ${
                isContentCreator 
                  ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="p-6">
                  <h2 className={`text-2xl font-bold mb-6 ${
                    isContentCreator 
                      ? 'text-purple-900 dark:text-purple-100' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {isContentCreator ? '🗺️ Creator City Map' : 'City Map'}
                  </h2>
                  {isOwner ? (
                    <OsmMapManager 
                      cityId={cityId} 
                      initialOsmMapPath={city.osmMapPath} 
                      isOwner={isOwner} 
                    />
                  ) : (
                    /* For non-owners, map takes full width if it exists */
                    city.osmMapPath ? (
                      <OsmMapManager 
                        cityId={cityId} 
                        initialOsmMapPath={city.osmMapPath} 
                        isOwner={isOwner} 
                      />
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className={`rounded-2xl shadow-xl border overflow-hidden ${
              isContentCreator 
                ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="p-6">
                <h2 className={`text-2xl font-bold mb-6 ${
                  isContentCreator 
                    ? 'text-purple-900 dark:text-purple-100' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {isContentCreator ? '💬 Creator Community Discussion' : 'Community Discussion'}
                </h2>
                <Comments cityId={city.id} />
              </div>
            </div>
          </div>

          {/* Sidebar - Stats and Details */}
          <div className="xl:col-span-1 space-y-6">
            {/* Key Stats */}
            <div className={`rounded-2xl shadow-xl border overflow-hidden ${
              isContentCreator 
                ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="p-6">
                <h3 className={`text-xl font-bold mb-6 ${
                  isContentCreator 
                    ? 'text-purple-900 dark:text-purple-100' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  🌟 City Stats
                </h3>
                <div className="space-y-4">
                  <div className={`text-center p-4 rounded-xl border ${
                    isContentCreator 
                      ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800' 
                      : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                  }`}>
                    <div className={`text-2xl lg:text-3xl font-bold mb-1 ${
                      isContentCreator 
                        ? 'text-purple-700 dark:text-purple-400' 
                        : 'text-green-700 dark:text-green-400'
                    }`}>
                      {formatNumber(city.population)}
                    </div>
                    <div className={`text-sm font-semibold ${
                      isContentCreator 
                        ? 'text-purple-600 dark:text-purple-300' 
                        : 'text-green-600 dark:text-green-300'
                    }`}>Population</div>
                  </div>
                  <div className={`text-center p-4 rounded-xl border ${
                    isContentCreator 
                      ? 'bg-gradient-to-br from-pink-50 to-indigo-50 dark:from-pink-900/20 dark:to-indigo-900/20 border-pink-200 dark:border-pink-800' 
                      : 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className={`text-2xl lg:text-3xl font-bold mb-1 ${
                      isContentCreator 
                        ? 'text-pink-700 dark:text-pink-400' 
                        : 'text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {city.unlimitedMoney ? '∞' : `$${formatNumber(city.money)}`}
                    </div>
                    <div className={`text-sm font-semibold ${
                      isContentCreator 
                        ? 'text-pink-600 dark:text-pink-300' 
                        : 'text-yellow-600 dark:text-yellow-300'
                    }`}>Money</div>
                  </div>
                  <div className={`text-center p-4 rounded-xl border ${
                    isContentCreator 
                      ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800' 
                      : 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800'
                  }`}>
                    <div className={`text-2xl lg:text-3xl font-bold mb-1 ${
                      isContentCreator 
                        ? 'text-indigo-700 dark:text-indigo-400' 
                        : 'text-purple-700 dark:text-purple-400'
                    }`}>
                      {formatNumber(city.xp)}
                    </div>
                    <div className={`text-sm font-semibold ${
                      isContentCreator 
                        ? 'text-indigo-600 dark:text-indigo-300' 
                        : 'text-purple-600 dark:text-purple-300'
                    }`}>Experience</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Settings */}
            <div className={`rounded-2xl shadow-xl border overflow-hidden ${
              isContentCreator 
                ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="p-6">
                <h3 className={`text-xl font-bold mb-6 ${
                  isContentCreator 
                    ? 'text-purple-900 dark:text-purple-100' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  🎮 Game Settings
                </h3>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${city.leftHandTraffic ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Left-hand Traffic</span>
                    <span className={`text-sm font-semibold ${city.leftHandTraffic ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {city.leftHandTraffic ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${city.naturalDisasters ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Natural Disasters</span>
                    <span className={`text-sm font-semibold ${city.naturalDisasters ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {city.naturalDisasters ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${city.unlimitedMoney ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unlimited Money</span>
                    <span className={`text-sm font-semibold ${city.unlimitedMoney ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {city.unlimitedMoney ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${city.unlockMapTiles ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unlock Map Tiles</span>
                    <span className={`text-sm font-semibold ${city.unlockMapTiles ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {city.unlockMapTiles ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

                        {/* City Settings - Only for owners */}
            {isOwner && (
              <div className={`rounded-2xl shadow-xl border overflow-hidden ${
                isContentCreator 
                  ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-6 ${
                    isContentCreator 
                      ? 'text-purple-900 dark:text-purple-100' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    ⚙️ City Settings
                  </h3>
                  <div className="space-y-6">
                    {/* Download Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Allow Downloads
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Let others download your .cok save file
                        </div>
                      </div>
                      <DownloadToggle cityId={cityId} initialDownloadable={city.downloadable ?? true} />
                    </div>
                    
                    {/* SaveGame Section */}
                    <SaveGameSection 
                      cityId={cityId} 
                      initialFilePath={city.filePath} 
                      initialFileName={city.fileName}
                      isOwner={isOwner} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Simulation Date */}
            {simulationDate && (
              <div className={`rounded-2xl shadow-xl border overflow-hidden ${
                isContentCreator 
                  ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-4 ${
                    isContentCreator 
                      ? 'text-purple-900 dark:text-purple-100' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    📅 Simulation Date
                  </h3>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      Year {simulationDate.year}, Month {simulationDate.month}
                    </div>
                    {simulationDate.hour !== undefined && simulationDate.minute !== undefined && (
                      <div className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                        {simulationDate.hour.toString().padStart(2, '0')}:{simulationDate.minute.toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Required DLC */}
            {city.contentPrerequisites && city.contentPrerequisites.length > 0 && (
              <div className={`rounded-2xl shadow-xl border overflow-hidden ${
                isContentCreator 
                  ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-4 ${
                    isContentCreator 
                      ? 'text-purple-900 dark:text-purple-100' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    🎯 Required DLC
                  </h3>
                  <div className="space-y-2">
                    {city.contentPrerequisites.map((dlc: string, index: number) => (
                      <div
                        key={index}
                        className="px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 text-orange-800 dark:text-orange-400 text-sm font-medium rounded-lg border border-orange-200 dark:border-orange-800"
                      >
                        {dlc}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mods */}
            <div className={`rounded-2xl shadow-xl border overflow-hidden ${
              isContentCreator 
                ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="p-6">
                <h3 className={`text-xl font-bold mb-4 ${
                  isContentCreator 
                    ? 'text-purple-900 dark:text-purple-100' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {city.modsEnabled && city.modsEnabled.length > 0 ? (
                    <>🔧 Mods ({city.modsEnabled.length})</>
                  ) : (
                    <>🔧 Mods - Vanilla</>
                  )}
                </h3>
                {city.modsEnabled && city.modsEnabled.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {city.modsEnabled.map((mod: string, index: number) => {
                      const parsedMod = parseModString(mod);
                      return (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                        >
                          {parsedMod.isSkyveMod && parsedMod.id ? (
                            <div>
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
                          ) : (
                            <div className="text-gray-700 dark:text-gray-300">
                              {mod.replace(', Version=', ' v').replace(', Culture=neutral, PublicKeyToken=null', '')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-3">🎮</div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      Vanilla City
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      No mods required
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File Info */}
            <div className={`rounded-2xl shadow-xl border overflow-hidden ${
              isContentCreator 
                ? 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-2xl' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="p-6">
                <h3 className={`text-xl font-bold mb-4 ${
                  isContentCreator 
                    ? 'text-purple-900 dark:text-purple-100' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  📁 File Info
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block">Filename</span>
                    <span className="text-sm text-gray-900 dark:text-white font-medium">{city.fileName}</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block">Uploaded</span>
                    <span className="text-sm text-gray-900 dark:text-white font-medium">{formatDate(city.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Client-side components */}
      <ClientComponents cityId={cityId} />
    </div>
  );
}