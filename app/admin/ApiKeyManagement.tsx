import { auth } from 'app/auth';
import CreateApiKeyForm from './CreateApiKeyForm';
import ApiKeyCard from './ApiKeyCard';
import { isUserAdmin, getAllUsersWithStats, getUserApiKeys } from 'app/db';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  isActive: boolean | null;
  lastUsed: Date | null;
  createdAt: Date | null;
}

interface User {
  id: number;
  email: string | null;
  username: string | null;
  isAdmin: boolean | null;
}

export default async function ApiKeyManagement() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return <div>Not authenticated</div>;
  }

  // Check if user is admin
  const isAdmin = await isUserAdmin(session.user.email);
  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  // Get all users
  const users = await getAllUsersWithStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Key Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Select User</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <UserApiKeySection key={user.id} user={user} />
                ))}
              </div>
            </div>
          </div>

          {/* API Keys Management */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Select a user to manage their API keys
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function UserApiKeySection({ user }: { user: User }) {
  const apiKeys = await getUserApiKeys(user.id);

  return (
    <details className="group">
      <summary className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
        <div className="font-medium">{user.username || user.email}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {user.email}
        </div>
        {user.isAdmin && (
          <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
            Admin
          </span>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {apiKeys.length} API key{apiKeys.length !== 1 ? 's' : ''}
        </div>
      </summary>
      
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <CreateApiKeyForm userId={user.id} />
        
        <div className="mt-4 space-y-4">
          {apiKeys.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No API keys found for this user
            </p>
          ) : (
            apiKeys.map((apiKey) => (
              <ApiKeyCard key={apiKey.id} apiKey={apiKey} userId={user.id} />
            ))
          )}
        </div>
      </div>
    </details>
  );
}

 