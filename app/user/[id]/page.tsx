import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCitiesByUser, getUserById } from 'app/db';
import { CityCard } from 'app/components/CityCard';

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

  const [user, cities] = await Promise.all([
    getUserById(userId),
    getCitiesByUser(userId)
  ]);

  if (!user) {
    notFound();
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
    return new Date(date).toLocaleDateString();
  };

  // Get the most recent upload date
  const lastUpload = cities.length > 0 ? cities[0].uploadedAt : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              ← Back to Cities
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">User Profile</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full text-2xl font-bold">
                {(user.username || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.username || user.email || 'Unknown User'}</h1>
                <p className="text-gray-600 dark:text-gray-400">Cities: Skylines 2 Builder</p>
                {(user.pdxUsername || user.discordUsername) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.pdxUsername && (
                      <a
                        href={`https://mods.paradoxplaza.com/authors/${user.pdxUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
                      >
                        PDX: {user.pdxUsername}
                      </a>
                    )}
                    {user.discordUsername && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        Discord: {user.discordUsername}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cities.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cities Shared</div>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatNumber(totalPopulation)}
              </div>
              <div className="text-sm text-green-600 dark:text-green-300">Total Population</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                ${formatNumber(totalMoney)}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-300">Total Money</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {formatNumber(totalXP)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-300">Total XP</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                {lastUpload ? formatDate(lastUpload) : 'Never'}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300">Last Upload</div>
            </div>
          </div>
        </div>

        {/* Cities Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Cities by {user.username || user.email || 'Unknown User'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {cities.length === 0 
              ? 'This user hasn&apos;t shared any cities yet.' 
              : `Explore ${cities.length} amazing ${cities.length === 1 ? 'city' : 'cities'} created by this builder.`
            }
          </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city: any) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 