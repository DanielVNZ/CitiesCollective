'use client';

import { useState } from 'react';
import CreateApiKeyForm from './CreateApiKeyForm';
import ApiKeyCard from './ApiKeyCard';

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

interface ApiKeyManagementProps {
  users: User[];
}

export default function ApiKeyManagement({ users }: ApiKeyManagementProps) {
  return (
    <div>
      <div className="mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">Select User</span>
      </div>
      <div className="space-y-2">
        {users.map((user) => (
          <UserApiKeySection key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function UserApiKeySection({ user }: { user: User }) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchApiKeys = async () => {
    if (loading || apiKeys.length > 0) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/api-keys/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && apiKeys.length === 0) {
      fetchApiKeys();
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md">
      <button
        onClick={handleToggle}
        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
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
              {loading ? 'Loading...' : `${apiKeys.length} API key${apiKeys.length !== 1 ? 's' : ''}`}
            </div>
          </div>
          <svg
            className={`w-5 h-5 transform transition-transform text-gray-500 dark:text-gray-400 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <CreateApiKeyForm userId={user.id} />
          
          <div className="mt-4 space-y-4">
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Loading API keys...
              </p>
            ) : apiKeys.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No API keys found for this user
              </p>
            ) : (
              apiKeys.map((apiKey) => (
                <ApiKeyCard 
                  key={apiKey.id} 
                  apiKey={apiKey} 
                  userId={user.id} 
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

 