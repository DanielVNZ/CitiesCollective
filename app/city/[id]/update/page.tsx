import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCityById, getUserById, getUser } from 'app/db';
import { auth } from 'app/auth';
import { UpdateCityForm } from './UpdateCityForm';

interface UpdateCityPageProps {
  params: {
    id: string;
  };
}

export default async function UpdateCityPage({ params }: UpdateCityPageProps) {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const cityId = parseInt(params.id);
  if (isNaN(cityId)) {
    notFound();
  }

  const city = await getCityById(cityId);
  if (!city) {
    notFound();
  }

  // Get current user
  const users = await getUser(session.user.email);
  if (users.length === 0) {
    redirect('/login');
  }
  const currentUser = users[0];

  // Check if user owns this city
  if (city.userId !== currentUser.id) {
    redirect('/');
  }

  // Get the user who owns this city
  const user = city.userId ? await getUserById(city.userId) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={`/city/${city.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              ← Back to City
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Update City</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* City Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Update: {city.cityName || 'Unnamed City'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                {city.population?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-green-600 dark:text-green-300">Current Population</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
                ${city.money?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-300">Current Money</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                {city.xp?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-300">Current XP</div>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Map:</strong> {city.mapName || 'Unknown'}</p>
            <p><strong>Theme:</strong> {city.theme || 'Default'}</p>
            <p><strong>Game Mode:</strong> {city.gameMode || 'Normal'}</p>
            <p><strong>Last Updated:</strong> {city.updatedAt ? new Date(city.updatedAt).toLocaleDateString() : 'Unknown'}</p>
          </div>
        </div>

        {/* Update Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Upload New Save File
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upload a new save file to update your city&apos;s statistics. Your existing images will be preserved.
          </p>
          <UpdateCityForm cityId={city.id} />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-3">
            How to Update Your City
          </h3>
          <div className="text-blue-700 dark:text-blue-300 space-y-2">
            <p>1. Continue playing your city in Cities: Skylines 2</p>
            <p>2. Save your game (this creates a .cok file)</p>
            <p>3. Find your save file in: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">%USERPROFILE%\AppData\LocalLow\Colossal Order\Cities Skylines II\Saves\</code></p>
            <p>4. Upload the .cok file here to update your city&apos;s stats</p>
            <p>5. Your existing screenshots will be preserved</p>
          </div>
        </div>
      </main>
    </div>
  );
} 