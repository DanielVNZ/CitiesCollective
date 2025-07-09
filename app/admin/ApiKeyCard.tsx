'use client';

import { toggleApiKeyAction, deleteApiKeyAction } from './actions';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  isActive: boolean | null;
  lastUsed: Date | null;
  createdAt: Date | null;
}

interface ApiKeyCardProps {
  apiKey: ApiKey;
  userId: number;
}

export default function ApiKeyCard({ apiKey, userId }: ApiKeyCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown date';
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium">{apiKey.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created: {apiKey.createdAt ? formatDate(apiKey.createdAt) : 'Unknown'}
          </p>
          {apiKey.lastUsed && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last used: {formatDate(apiKey.lastUsed)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <form action={() => toggleApiKeyAction(apiKey.id)}>
            <button
              type="submit"
              className={`px-3 py-1 text-xs rounded ${
                apiKey.isActive
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}
            >
              {apiKey.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </form>
          
          <form action={() => deleteApiKeyAction(apiKey.id)}>
            <button
              type="submit"
              className="px-3 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
              onClick={(e) => {
                if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
                  e.preventDefault();
                }
              }}
            >
              Delete
            </button>
          </form>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {apiKey.key.substring(0, 20)}...
        </code>
        <span className={`px-2 py-1 text-xs rounded ${
          apiKey.isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {apiKey.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
} 