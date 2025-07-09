import Link from 'next/link';
import { getRecentCities, getTopCitiesByLikes, isUserAdmin } from 'app/db';
import { CityCard } from 'app/components/CityCard';
import { QuickSearch } from 'app/components/QuickSearch';
import { ThemeToggle } from 'app/components/ThemeToggle';
import { auth } from 'app/auth';

export default async function Page() {
  const cities = await getRecentCities(12);
  const topCities = await getTopCitiesByLikes(3);
  const session = await auth();
  const isAdmin = session?.user?.email ? await isUserAdmin(session.user.email) : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cities Collective
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              {session ? (
                <>
                  <Link
                    href="/search"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Search
                  </Link>
                  <Link
                    href="/favorites"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Favorites
                  </Link>
                  <Link
                    href="/upload"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Upload City
                  </Link>
                  <Link
                    href="/protected"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      Admin
                    </Link>
                  )}
                  <ThemeToggle />
                </>
              ) : (
                <>
                  <Link
                    href="/search"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Search
                  </Link>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                  <ThemeToggle />
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Search Section */}
        <QuickSearch />

        {/* Most Liked Cities Section */}
        {topCities.length > 0 && (
          <div className="mb-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Most Liked Cities
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                The most beloved cities in our community showcase
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCities.map((city, index) => (
                <CityCard key={city.id} city={city} ranking={index + 1} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Recently Shared Cities
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover amazing cities created by the Cities: Skylines 2 community
          </p>
        </div>

        {cities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏙️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No cities yet!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to share your amazing city with the community.
            </p>
            {session ? (
              <Link
                href="/upload"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Upload Your City
              </Link>
            ) : (
              <Link
                href="/register"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>Join the Cities Collective and share your Cities: Skylines 2 creations with builders worldwide!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
