import Link from 'next/link';
import { auth } from 'app/auth';
import { redirect } from 'next/navigation';
import { isUserAdmin, getAllUsersWithStats, getTotalCityCount, getAllComments } from 'app/db';
import { AdminUserManagement } from './AdminUserManagement';
import { CommentModeration } from './CommentModeration';
import { ModerationSettings } from './ModerationSettings';
import { UserCityManagement } from './UserCityManagement';
import ApiKeyManagement from './ApiKeyManagement';
import { Header } from 'app/components/Header';

export default async function AdminPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if user is admin
  const isAdmin = await isUserAdmin(session.user.email);
  if (!isAdmin) {
    redirect('/');
  }

  // Get all users with their stats
  const usersWithStats = await getAllUsersWithStats();
  const totalCityCount = await getTotalCityCount();
  const allComments = await getAllComments();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Stats Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {usersWithStats.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300">Total Users</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {usersWithStats.filter(u => u.isAdmin).length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-300">Admin Users</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {usersWithStats.filter(u => u.isContentCreator).length}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-300">Content Creators</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {totalCityCount}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-300">Total Cities</div>
            </div>
            <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                {usersWithStats.filter(u => u.cityCount > 0).length}
              </div>
              <div className="text-sm text-teal-600 dark:text-teal-300">Active Users</div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <AdminUserManagement users={usersWithStats} />

        {/* User City Management */}
        <div className="mt-8">
          <UserCityManagement />
        </div>

        {/* Comment Moderation */}
        <div className="mt-8">
          <CommentModeration comments={allComments} />
        </div>

        {/* Moderation Settings */}
        <div className="mt-8">
          <ModerationSettings />
        </div>

        {/* API Key Management */}
        <div className="mt-8">
          <ApiKeyManagement />
        </div>
      </main>
    </div>
  );
} 