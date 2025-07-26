export const revalidate = 300; // 5 minutes

import Link from 'next/link';
import { getRecentCities, getTopCitiesWithImages, getContentCreatorCities, isUserAdmin, getTotalCityCount, getCommunityStats, getCitiesWithImagesCount } from 'app/db';
import { CityCard } from 'app/components/CityCard';
import { QuickSearch } from 'app/components/QuickSearch';
import { Header } from 'app/components/Header';
import { auth } from 'app/auth';
import { HeroCarousel } from 'app/components/HeroCarousel';
import { CommunityFavorites } from 'app/components/CommunityFavorites';
import { CreatorSpotlight } from 'app/components/CreatorSpotlight';
import { ClientPaginationWrapper } from 'app/components/ClientPaginationWrapper';
import { StatsSection } from 'app/components/StatsSection';
import { SessionTracker } from 'app/components/SessionTracker';

export default async function Page({ searchParams }: { searchParams?: { page?: string } }) {
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1'));
  const citiesPerPage = 9;

  // Use search API to get the 30 most recent cities (same as search page logic)
  const searchResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/search?limit=30&sortBy=newest&sortOrder=desc`, {
    next: { revalidate: 300 } // 5 minutes cache
  });

  let cities: any[] = [];
  let totalCities = 0;
  let citiesWithImages = 0;

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    cities = searchData.cities || [];
    totalCities = searchData.pagination?.totalCount || 0;
    citiesWithImages = cities.filter(city => city.images && city.images.length > 0).length;
  } else {
    // Fallback to original method if search fails
    cities = await getRecentCities(30, 0);
    totalCities = await getTotalCityCount();
    citiesWithImages = await getCitiesWithImagesCount();
  }

  const totalPages = Math.ceil(Math.min(30, totalCities) / citiesPerPage);

  const topCitiesWithImages = await getTopCitiesWithImages(25);
  const contentCreatorCities = await getContentCreatorCities(6);
  const communityStats = await getCommunityStats();
  const session = await auth();
  const isAdmin = session?.user?.email ? await isUserAdmin(session.user.email) : false;

  const quickLinks = [
    {
      href: '/upload',
      title: 'Upload Your City',
      description: 'Share your masterpiece with the world.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      authRequired: true,
    },
    {
      href: '/search',
      title: 'Browse Cities',
      description: 'Explore creations from other builders.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l-2.293-2.293a1 1 0 010-1.414l7.586-7.586a1 1 0 011.414 0l4.293 4.293a1 1 0 010 1.414l-7.586 7.586a1 1 0 01-1.414 0z" />
        </svg>
      ),
    },
    {
      href: session ? '/protected' : '/register',
      title: session ? 'View My Profile' : 'Join the Collective',
      description: session ? 'Manage your uploads and favorites.' : 'Create an account to get started.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen min-w-[320px] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Session Tracker */}
      <SessionTracker />

      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />

      {/* Enhanced Beta Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center text-center">
            <div className="flex items-center space-x-3">
              <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">BETA</span>
              <span className="text-sm sm:text-base font-medium">
                🚧 Cities Collective is in beta! Upload limit: 3 cities per user. This may expand in future.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gray-800 text-white overflow-hidden">
        <HeroCarousel topCities={topCitiesWithImages} />
      </section>

      {/* Enhanced Search Section */}
      <section className="bg-gradient-to-b from-gray-800 to-transparent py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Find Your Next Inspiration</h2>
            <p className="text-gray-300">Search through thousands of amazing cities from our community</p>
          </div>
          <QuickSearch />
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-w-[320px] space-y-24">
        {/* Community Favorites Section */}
        <CommunityFavorites cities={topCitiesWithImages} />

        {/* Enhanced Quick Actions and Stats Section */}
        <section className="section-modern animate-fade-in">
          <div className="card-modern p-12">
            {/* Enhanced section header */}
            <div className="text-center mb-12 animate-slide-up">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  Quick Actions & Stats
                </h2>
              </div>
            </div>

            {/* Enhanced Community Stats Section */}
            <div className="mb-12">
              <StatsSection stats={communityStats} />
            </div>

            {/* Enhanced Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {quickLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group card-modern p-8 text-center touch-card focus-modern animate-scale-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      {link.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {link.description}
                  </p>

                  {/* Subtle hover indicator */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Creator Spotlight Section */}
        <CreatorSpotlight cities={contentCreatorCities} />

        {/* Recently Shared Cities Section */}
        <section className="section-modern animate-fade-in">
          {/* Enhanced section header */}
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Freshly Uploaded
              </h2>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover the latest cities shared by the community.
            </p>
          </div>

          {cities.length === 0 ? (
            /* Enhanced empty state */
            <div className="text-center py-16 animate-scale-in">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">🏙️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                No cities yet!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Be the first to share your amazing city with the community.
              </p>
              <Link
                href={session ? "/upload" : "/register"}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {session ? 'Upload Your City' : 'Get Started'}
              </Link>
            </div>
          ) : (
            <div className="animate-fade-in">
              <ClientPaginationWrapper
                initialCities={cities}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={Math.min(30, totalCities)}
                itemsPerPage={citiesPerPage}
                offset={0}
                citiesWithImages={citiesWithImages}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
