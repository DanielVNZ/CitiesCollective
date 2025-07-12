'use client';

import { useState } from 'react';
import { Header } from 'app/components/Header';
import { AdminUserManagement } from './AdminUserManagement';
import { CommentModeration } from './CommentModeration';
import { ModerationSettings } from './ModerationSettings';
import { UserCityManagement } from './UserCityManagement';
import ApiKeyManagement from './ApiKeyManagement';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

function CollapsibleSection({ title, children, defaultCollapsed = true }: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        <svg
          className={`w-6 h-6 transform transition-transform text-gray-500 dark:text-gray-400 ${
            isCollapsed ? '' : 'rotate-180'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {!isCollapsed && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
}

interface AdminPageClientProps {
  session: any;
  isAdmin: boolean;
  usersWithStats: any[];
  totalCityCount: number;
  allComments: any[];
}

export function AdminPageClient({ session, isAdmin, usersWithStats, totalCityCount, allComments }: AdminPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview */}
        <CollapsibleSection title="System Overview">
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
        </CollapsibleSection>

        {/* User Management */}
        <CollapsibleSection title="User Management">
          <AdminUserManagement users={usersWithStats} />
        </CollapsibleSection>

        {/* User City Management */}
        <CollapsibleSection title="City Management">
          <UserCityManagement />
        </CollapsibleSection>

        {/* Comment Moderation */}
        <CollapsibleSection title="Comment Moderation">
          <CommentModeration comments={allComments} />
        </CollapsibleSection>

        {/* Moderation Settings */}
        <CollapsibleSection title="Moderation Settings">
          <ModerationSettings />
        </CollapsibleSection>

        {/* API Key Management */}
        <CollapsibleSection title="API Key Management">
          <ApiKeyManagement users={usersWithStats} />
        </CollapsibleSection>
      </main>
    </div>
  );
} 