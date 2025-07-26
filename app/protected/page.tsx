export const dynamic = 'force-dynamic';

import { auth } from 'app/auth';
import { getUser, getCitiesByUser } from 'app/db';
import Link from 'next/link';
import { CityManagementCard } from './CityManagementCard';
import { UserProfileSection } from 'app/components/UserProfileSection';
import ProfileEditor from 'app/components/ProfileEditor';
import HoFCreatorIdEditor from 'app/components/HoFCreatorIdEditor';
import HoFBindingStatus from 'app/components/HoFBindingStatus';
import { SignOutButton } from 'app/components/SignOutButton';
import { Header } from 'app/components/Header';
import { UserHallOfFameImageManagement } from 'app/components/UserHallOfFameImageManagement';
import { CollapsibleSection } from 'app/components/CollapsibleSection';

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
      <Header session={session} isAdmin={false} />

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

        {/* Hall of Fame Section */}
        <div className="mb-8">
          <CollapsibleSection title="Hall of Fame" defaultExpanded={true}>
            <div className="space-y-6">
              {/* HoF Creator ID Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Creator ID</h3>
                <HoFCreatorIdEditor 
                  currentHoFCreatorId={user.hofCreatorId} 
                />
              </div>

              {/* HoF Binding Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connection</h3>
                <HoFBindingStatus 
                  hofCreatorId={user.hofCreatorId}
                  userId={user.id}
                />
              </div>

              {/* Hall of Fame Image Management */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images</h3>
                <UserHallOfFameImageManagement userId={user.id} cities={cities} hofCreatorId={user.hofCreatorId} />
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Cities Management */}
        <div className="mb-8">
          <CollapsibleSection title="My Cities" defaultExpanded={true}>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Manage your uploaded cities - view details, share links, or remove cities
              </p>
            </div>

            {cities.length === 0 ? (
              <div className="text-center py-12">
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
          </CollapsibleSection>
        </div>
      </main>
    </div>
  );
}
