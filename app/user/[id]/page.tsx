import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCitiesByUser, getUserById, getFollowerCount, getFollowingCount } from 'app/db';
import { CityCard } from 'app/components/CityCard';
import { FollowButton } from 'app/components/FollowButton';
import { auth } from 'app/auth';
import { getUsernameTextColor, getUsernameAvatarColor } from 'app/utils/userColors';

interface UserProfilePageProps {
  params: {
    id: string;
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const userId = parseInt(params.id);
  if (isNaN(userId)) {
    notFound();
  }

  const session = await auth();
  
  const [user, cities, followerCount, followingCount] = await Promise.all([
    getUserById(userId),
    getCitiesByUser(userId),
    getFollowerCount(userId),
    getFollowingCount(userId)
  ]);

  if (!user) {
    notFound();
  }

  // Get current user info for follow button
  let currentUser = null;
  let isFollowing = false;
  if (session?.user?.email) {
    const { getUser, isFollowing: checkFollowing } = await import('app/db');
    const currentUsers = await getUser(session.user.email);
    currentUser = currentUsers[0];
    
    if (currentUser && currentUser.id !== userId) {
      isFollowing = await checkFollowing(currentUser.id, userId);
    }
  }

  const totalPopulation = cities.reduce((sum: number, city: any) => sum + (city.population || 0), 0);
  const totalMoney = cities.reduce((sum: number, city: any) => sum + (city.money || 0), 0);
  const totalXP = cities.reduce((sum: number, city: any) => sum + (city.xp || 0), 0);

  const formatNumber = (num: number) => {
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
    const d = new Date(date);
    // Use explicit locale to ensure consistency between server and client
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get the most recent upload date
  const lastUpload = cities.length > 0 ? cities[0].uploadedAt : null;

  // Get user colors
  const username = user.username || user.name || user.email || 'Unknown User';
  const usernameTextColor = getUsernameTextColor(username);
  const usernameAvatarColor = getUsernameAvatarColor(username);

  return (
    <div className="min-h-screen min-w-[320px] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              ← Back to Cities
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">User Profile</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 min-w-[320px]">
        {/* User Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-20 h-20 bg-gradient-to-br ${usernameAvatarColor} text-white rounded-full text-2xl font-bold shadow-lg`}>
                {(user.username || user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="ml-6 flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className={`text-3xl font-bold ${usernameTextColor}`}>
                    {user.username || user.name || user.email || 'Unknown User'}
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">Cities Collective Builder</p>
                
                {/* Social Stats Row */}
                <div className="flex items-center gap-6 mb-3">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{cities.length}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cities</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{followerCount}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{followingCount}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Following</span>
                  </div>
                </div>

                {/* Platform Badges */}
                {(user.pdxUsername || user.discordUsername) && (
                  <div className="flex flex-wrap gap-2">
                    {user.pdxUsername && (
                      <a
                        href={`https://mods.paradoxplaza.com/authors/${user.pdxUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12L8 10l2-2 2 2-2 2z"/>
                        </svg>
                        PDX: {user.pdxUsername}
                      </a>
                    )}
                    {user.discordUsername && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2L3 7v11l7-5 7 5V7l-7-5z"/>
                        </svg>
                        Discord: {user.discordUsername}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Follow Button - Right Side */}
            {currentUser && currentUser.id !== userId && (
              <div className="ml-6 flex-shrink-0">
                <FollowButton
                  targetUserId={userId}
                  initialIsFollowing={isFollowing}
                  initialFollowerCount={followerCount}
                  className="min-w-[120px]"
                />
              </div>
            )}
          </div>

          {/* City Statistics */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Total City Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-1">
                  {formatNumber(totalPopulation)}
                </div>
                <div className="text-sm font-medium text-orange-600 dark:text-orange-300">Total Population</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400 mb-1">
                  ${formatNumber(totalMoney)}
                </div>
                <div className="text-sm font-medium text-green-600 dark:text-green-300">Total Money</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-1">
                  {formatNumber(totalXP)}
                </div>
                <div className="text-sm font-medium text-purple-600 dark:text-purple-300">Total XP</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                  {lastUpload ? formatDate(lastUpload) : 'Never'}
                </div>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-300">Last Upload</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cities Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cities by <span className={usernameTextColor}>{user.username || user.name || user.email || 'Unknown User'}</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {cities.length === 0 
                  ? 'This user hasn\'t shared any cities yet.' 
                  : `Explore ${cities.length} amazing ${cities.length === 1 ? 'city' : 'cities'} created by this builder.`
                }
              </p>
            </div>
            {cities.length > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {cities.length} {cities.length === 1 ? 'city' : 'cities'}
              </div>
            )}
          </div>

          {cities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No cities yet!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This user hasn&apos;t shared any cities with the community yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cities.map((city: any) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 