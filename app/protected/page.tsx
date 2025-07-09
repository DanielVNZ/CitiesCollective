import { auth, signOut } from 'app/auth';
import { getUser, getCitiesByUser } from 'app/db';
import Link from 'next/link';
import { CityManagementCard } from './CityManagementCard';
import { UserProfileSection } from 'app/components/UserProfileSection';
import ProfileEditor from 'app/components/ProfileEditor';

export default async function ProtectedPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return <div>Not authenticated</div>;
  }

  // Get user and their cities
  const users = await getUser(session.user.email);
  const user = users && users[0];
  
  if (!user) {
    return <div>User not found</div>;
  }

  const cities = await getCitiesByUser(user.id);

  const totalPopulation = cities.reduce((sum: number, city: any) => sum + (city.population || 0), 0);
  const totalMoney = cities.reduce((sum: number, city: any) => sum + (city.money || 0), 0);
  const lastUpload = cities.length > 0 ? cities[0].uploadedAt : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              ← Back to Home
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My Dashboard</h1>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Overview */}
        <UserProfileSection
          user={{
            id: user.id,
            email: user.email || '',
            username: user.username || user.email || 'Unknown User'
          }}
          cities={cities}
          totalPopulation={totalPopulation}
          totalMoney={totalMoney}
          lastUpload={lastUpload}
        />

        {/* Profile Settings */}
        <div className="mb-8">
          <ProfileEditor user={user} />
        </div>
        {/* Cities Management */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Cities</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your uploaded cities - view details, share links, or remove cities
              </p>
            </div>
          </div>

          {cities.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🏙️</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No cities uploaded yet!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start sharing your amazing Cities: Skylines 2 creations with the Cities Collective.
              </p>
              <Link
                href="/upload"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block"
              >
                Upload Your First City
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cities.map((city: any) => (
                <CityManagementCard key={city.id} city={city} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server';
        await signOut();
      }}
    >
      <button 
        type="submit"
        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
      >
        Sign Out
      </button>
    </form>
  );
}
