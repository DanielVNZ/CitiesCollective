import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCitiesByUser, getUserById, getFollowerCount, getFollowingCount } from 'app/db';
import { CityCard } from 'app/components/CityCard';
import { FollowButton } from 'app/components/FollowButton';
import { SocialLinksDisplay } from 'app/components/SocialLinksDisplay';
import { auth } from 'app/auth';
import { getUsernameTextColor, getUsernameAvatarColor } from 'app/utils/userColors';
import { Header } from 'app/components/Header';
import { isUserAdmin } from 'app/db';

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

  const isAdmin = session?.user?.email ? await isUserAdmin(session.user.email) : false;

  return (
    <div className="min-h-screen min-w-[320px] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <div className={`rounded-2xl shadow-lg p-8 mb-8 border ${
          user.isContentCreator 
            ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 relative overflow-hidden' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          {/* Premium Background Pattern for Content Creators */}
          {user.isContentCreator && (
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400"></div>
            </div>
          )}
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-6">
              {/* Left: Avatar, Name, Subtitle, Stats */}
              <div className="flex flex-col items-start text-left gap-2 flex-1 min-w-[220px]">
                <div className="relative">
                  <div className={`flex items-center justify-center w-24 h-24 bg-gradient-to-br ${usernameAvatarColor} text-white rounded-full text-3xl font-bold shadow-lg mb-2 ${
                    user.isContentCreator ? 'ring-4 ring-purple-300 dark:ring-purple-600 shadow-xl' : ''
                  }`}>
                    {(user.username || user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  {/* Content Creator Badge */}
                  {user.isContentCreator && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        CREATOR
                      </div>
                    </div>
                  )}
                </div>
                <h1 className={`text-3xl font-bold ${usernameTextColor}`}>{user.username || user.name || user.email || 'Unknown User'}</h1>
                <p className={`mb-1 ${
                  user.isContentCreator 
                    ? 'text-purple-700 dark:text-purple-300 font-semibold' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {user.isContentCreator ? '🎬 Premium Content Creator' : 'Cities Collective Builder'}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{cities.length} {cities.length === 1 ? 'City' : 'Cities'}</span>
                  <span>•</span>
                  <span>{followerCount} {followerCount === 1 ? 'Follower' : 'Followers'}</span>
                  <span>•</span>
                  <span>{followingCount} Following</span>
                </div>
                {/* Follow Button - Below stats, left-aligned */}
                {currentUser && currentUser.id !== userId && (
                  <div className="mt-2">
                    <FollowButton
                      targetUserId={userId}
                      initialIsFollowing={isFollowing}
                      initialFollowerCount={followerCount}
                      className={`min-w-[120px] ${
                        user.isContentCreator ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''
                      }`}
                    />
                  </div>
                )}
              </div>
              {/* Right: Social Links */}
              <div className="flex flex-col items-center md:items-center md:justify-start w-full md:w-auto md:ml-8">
                <div className="md:mt-2"><SocialLinksDisplay userId={userId} /></div>
              </div>
            </div>
          </div>

          {/* City Statistics */}
          <div className={`border-t pt-6 ${
            user.isContentCreator 
              ? 'border-purple-200 dark:border-purple-700' 
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              user.isContentCreator 
                ? 'text-purple-900 dark:text-purple-100' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {user.isContentCreator ? '🌟 Creator Statistics' : 'Total City Statistics'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-xl border ${
                user.isContentCreator 
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700' 
                  : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800'
              }`}>
                <div className={`text-2xl font-bold mb-1 ${
                  user.isContentCreator 
                    ? 'text-purple-700 dark:text-purple-400' 
                    : 'text-orange-700 dark:text-orange-400'
                }`}>
                  {formatNumber(totalPopulation)}
                </div>
                <div className={`text-sm font-medium ${
                  user.isContentCreator 
                    ? 'text-purple-600 dark:text-purple-300' 
                    : 'text-orange-600 dark:text-orange-300'
                }`}>Total Population</div>
              </div>
              <div className={`text-center p-4 rounded-xl border ${
                user.isContentCreator 
                  ? 'bg-gradient-to-br from-pink-50 to-indigo-50 dark:from-pink-900/20 dark:to-indigo-900/20 border-pink-200 dark:border-pink-700' 
                  : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
              }`}>
                <div className={`text-2xl font-bold mb-1 ${
                  user.isContentCreator 
                    ? 'text-pink-700 dark:text-pink-400' 
                    : 'text-green-700 dark:text-green-400'
                }`}>
                  ${formatNumber(totalMoney)}
                </div>
                <div className={`text-sm font-medium ${
                  user.isContentCreator 
                    ? 'text-pink-600 dark:text-pink-300' 
                    : 'text-green-600 dark:text-green-300'
                }`}>Total Money</div>
              </div>
              <div className={`text-center p-4 rounded-xl border ${
                user.isContentCreator 
                  ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700' 
                  : 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800'
              }`}>
                <div className={`text-2xl font-bold mb-1 ${
                  user.isContentCreator 
                    ? 'text-indigo-700 dark:text-indigo-400' 
                    : 'text-purple-700 dark:text-purple-400'
                }`}>
                  {formatNumber(totalXP)}
                </div>
                <div className={`text-sm font-medium ${
                  user.isContentCreator 
                    ? 'text-indigo-600 dark:text-indigo-300' 
                    : 'text-purple-600 dark:text-purple-300'
                }`}>Total XP</div>
              </div>
              <div className={`text-center p-4 rounded-xl border ${
                user.isContentCreator 
                  ? 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-700' 
                  : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800'
              }`}>
                <div className={`text-xl font-bold mb-1 ${
                  user.isContentCreator 
                    ? 'text-violet-700 dark:text-violet-400' 
                    : 'text-blue-700 dark:text-blue-400'
                }`}>
                  {lastUpload ? formatDate(lastUpload) : 'Never'}
                </div>
                <div className={`text-sm font-medium ${
                  user.isContentCreator 
                    ? 'text-violet-600 dark:text-violet-300' 
                    : 'text-blue-600 dark:text-blue-300'
                }`}>Last Upload</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cities Section */}
        <div className={`rounded-2xl shadow-lg p-8 border ${
          user.isContentCreator 
            ? 'bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-indigo-900/10 border-purple-200 dark:border-purple-700' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${
                user.isContentCreator 
                  ? 'text-purple-900 dark:text-purple-100' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {user.isContentCreator ? '🎬 Creator Portfolio' : `Cities by ${user.username || user.name || user.email || 'Unknown User'}`}
              </h2>
              <p className={`mt-1 ${
                user.isContentCreator 
                  ? 'text-purple-700 dark:text-purple-300' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {cities.length === 0 
                  ? (user.isContentCreator ? 'This creator hasn\'t shared any cities yet.' : 'This user hasn\'t shared any cities yet.')
                  : user.isContentCreator 
                    ? `Explore ${cities.length} amazing ${cities.length === 1 ? 'city' : 'cities'} from this premium creator.`
                    : `Explore ${cities.length} amazing ${cities.length === 1 ? 'city' : 'cities'} created by this builder.`
                }
              </p>
            </div>
            {cities.length > 0 && (
              <div className={`text-sm ${
                user.isContentCreator 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
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
