import { auth } from 'app/auth';
import { redirect } from 'next/navigation';
import { getUserFavorites, getUser } from 'app/db';
import { CityCard } from 'app/components/CityCard';
import Link from 'next/link';

export default async function FavoritesPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Get user ID
  const users = await getUser(session.user.email);
  if (users.length === 0) {
    redirect('/login');
  }

  const user = users[0];
  const favorites = await getUserFavorites(user.id, 50); // Get up to 50 favorites

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4">
                ← Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Favorites
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/search"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Search
              </Link>
              <Link
                href="/upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Upload City
              </Link>
              <Link
                href="/protected"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              ⭐
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Your Favorite Cities
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Cities you&apos;ve saved for later viewing
              </p>
            </div>
          </div>
          
          {favorites.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
                </div>
                <Link
                  href="/search"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Discover more cities →
                </Link>
              </div>
            </div>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No favorites yet!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Start exploring cities and click the star icon to save your favorites. 
              They&apos;ll appear here for easy access.
            </p>
            <div className="space-y-4">
              <Link
                href="/search"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Explore Cities
              </Link>
              <div>
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  View recently uploaded cities
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((city) => (
              <div key={city.id} className="relative">
                <CityCard city={city} />
                <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  ⭐ Favorited {city.favoritedAt ? new Date(city.favoritedAt).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>Share your Cities: Skylines 2 creations with the world!</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 