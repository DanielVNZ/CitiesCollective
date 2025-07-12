export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getRecentCities, getTopCitiesWithImages, getContentCreatorCities, isUserAdmin, getTotalCityCount } from 'app/db';
import { CityCard } from 'app/components/CityCard';
import { QuickSearch } from 'app/components/QuickSearch';
import { Header } from 'app/components/Header';
import { auth } from 'app/auth';
import { HeroCarousel } from 'app/components/HeroCarousel';
import { CommunityFavorites } from 'app/components/CommunityFavorites';

export default async function Page({ searchParams }: { searchParams?: { page?: string } }) {
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1'));
  const citiesPerPage = 9;
  const offset = (currentPage - 1) * citiesPerPage;
  
  const cities = await getRecentCities(citiesPerPage, offset);
  const totalCities = await getTotalCityCount();
  const totalPages = Math.ceil(totalCities / citiesPerPage);
  
  const topCitiesWithImages = await getTopCitiesWithImages(25);
  const contentCreatorCities = await getContentCreatorCities(6);
  const session = await auth();
  const isAdmin = session?.user?.email ? await isUserAdmin(session.user.email) : false;

  const quickLinks = [
    {
      href: '/upload',
      title: 'Upload Your City',
      description: 'Share your masterpiece with the world.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l-2.293-2.293a1 1 0 010-1.414l7.586-7.586a1 1 0 011.414 0l4.293 4.293a1 1 0 010 1.414l-7.586 7.586a1 1 0 01-1.414 0z" />
        </svg>
      ),
    },
    {
      href: session ? '/protected' : '/register',
      title: session ? 'View My Profile' : 'Join the Collective',
      description: session ? 'Manage your uploads and favorites.' : 'Create an account to get started.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen min-w-[320px] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />
      
      {/* Beta Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center text-center">
            <div className="flex items-center space-x-2">
              <span className="bg-white text-orange-600 px-2 py-1 rounded text-xs font-bold">BETA</span>
              <span className="text-sm sm:text-base">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 min-w-[320px]">
        {/* Community Favorites Section */}
        <CommunityFavorites cities={topCitiesWithImages} />

        {/* Quick Links Section */}
        <section className="mb-16 sm:mb-24 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
           <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Get Started</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
             {quickLinks.map((link) => (
               <Link
                 key={link.href}
                 href={link.href}
                 className="group block p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1 text-center"
               >
                 <div className="flex justify-center">
                   {link.icon}
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{link.title}</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{link.description}</p>
               </Link>
             ))}
           </div>
        </section>

        {/* Creator Spotlight Section */}
        <section className="mb-16 sm:mb-24 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-10 shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Creator Spotlight</h2>
            <p className="text-lg max-w-3xl mx-auto">We&apos;ll be featuring your favourite creators&apos; cities here, encourage them to upload their cities! *cough cough* Biffa and City Planner Plays...</p>
          </div>
          {contentCreatorCities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {contentCreatorCities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          )}
        </section>

        {/* Recently Shared Cities Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Freshly Uploaded
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Discover the latest cities shared by the community.
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
              <Link href={session ? "/upload" : "/register"} className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold">
                {session ? 'Upload Your City' : 'Get Started'}
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cities.map((city) => (
                  <CityCard key={city.id} city={city} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center space-x-2">
                  {/* Previous Button */}
                  <Link
                    href={`/?page=${currentPage - 1}`}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}
                    {...(currentPage === 1 && { 'aria-disabled': true })}
                  >
                    Previous
                  </Link>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Link
                        key={pageNumber}
                        href={`/?page=${pageNumber}`}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {pageNumber}
                      </Link>
                    );
                  })}

                  {/* Next Button */}
                  <Link
                    href={`/?page=${currentPage + 1}`}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}
                    {...(currentPage === totalPages && { 'aria-disabled': true })}
                  >
                    Next
                  </Link>
                </div>
              )}

              {/* Page Info */}
              <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Showing {offset + 1} to {Math.min(offset + citiesPerPage, totalCities)} of {totalCities} cities
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
