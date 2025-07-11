import { Suspense } from 'react';
import Link from 'next/link';
import { SearchBar } from 'app/components/SearchBar';
import { CityCard } from 'app/components/CityCard';
import { SearchResults } from './SearchResults';
import { Header } from 'app/components/Header';
import { auth } from 'app/auth';
import { isUserAdmin } from 'app/db';

export default async function SearchPage() {
  const session = await auth();
  const isAdmin = session?.user?.email ? await isUserAdmin(session.user.email) : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Search Results */}
        <Suspense fallback={<SearchResultsLoading />}>
          <SearchResults />
        </Suspense>
      </main>
    </div>
  );
}

function SearchResultsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
} 