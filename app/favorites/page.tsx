import Link from 'next/link';
import { auth } from 'app/auth';
import { getUserFavorites, getUser } from 'app/db';
import { CityCard } from 'app/components/CityCard';
import { Header } from 'app/components/Header';
import { isUserAdmin } from 'app/db';
import { redirect } from 'next/navigation';

export default async function FavoritesPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const isAdmin = session?.user?.email ? await isUserAdmin(session.user.email) : false;
  
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
      <Header session={session} isAdmin={isAdmin} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Favorites
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your saved cities from the community.
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No favorites yet!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start exploring cities and add them to your favorites.
            </p>
            <Link href="/search" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold">
              Browse Cities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 