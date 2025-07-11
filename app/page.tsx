import Link from 'next/link';
import { getRecentCities, getTopCitiesByLikes, isUserAdmin } from 'app/db';
import { CityCard } from 'app/components/CityCard';
import { QuickSearch } from 'app/components/QuickSearch';
import { ResponsiveNavigationWrapper } from 'app/components/ResponsiveNavigationWrapper';
import { auth } from 'app/auth';

export default async function Page() {
  const cities = await getRecentCities(12);
  const topCities = await getTopCitiesByLikes(3);
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
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cities Collective
              </h1>
            </div>
            <ResponsiveNavigationWrapper session={session} isAdmin={isAdmin} />
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative bg-gray-800 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/70 via-blue-500/70 to-green-400/70"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-32">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
            Discover & Share Incredible Cities
          </h1>
          <p className="mt-6 text-xl text-gray-200 max-w-3xl mx-auto">
            The ultimate hub for Cities: Skylines 2 creators. Upload your save files, showcase your work, and explore masterpieces from the community.
          </p>
          <div className="mt-10 max-w-xl mx-auto">
            <QuickSearch />
            <p className="mt-3 text-sm text-gray-300">Search by city name, map, or creator.</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 min-w-[320px]">
        {/* Most Liked Cities Section */}
        {topCities.length > 0 && (
          <section className="mb-16 sm:mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Community Favorites
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                The most beloved cities, ranked by the community.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topCities.map((city, index) => (
                <CityCard key={city.id} city={city} ranking={index + 1} />
              ))}
            </div>
          </section>
        )}

        {/* Quick Links Section */}
        <section className="mb-16 sm:mb-24 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
           <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Get Started</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
             {quickLinks.map((link) => (
               <Link
                 key={link.href}
                 href={link.href}
                 className="group block p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1"
               >
                 {link.icon}
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{link.title}</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{link.description}</p>
               </Link>
             ))}
           </div>
        </section>

        {/* Creator Spotlight Section */}
        <section className="mb-16 sm:mb-24 text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-10 shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Creator Spotlight</h2>
          <p className="text-lg max-w-3xl mx-auto">We&apos;ll be featuring your favourite creators&apos; cities here, encourage them to upload their cities! *cough cough* Biffa and City Planner Plays...</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="mb-4">Join the Cities Collective and share your Cities: Skylines 2 creations with builders worldwide!</p>
            <p className="text-sm">
              <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</Link> •{' '}
              <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
