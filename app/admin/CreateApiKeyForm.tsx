'use client';

import { useState } from 'react';

interface CreateApiKeyFormProps {
  userId: number;
}

export default function CreateApiKeyForm({ userId }: CreateApiKeyFormProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);
    setNewKey(null);

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: name.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewKey(data.apiKey.key);
        setName('');
        // Don't refresh the page - let the user copy the key first
        // The key will appear in the list when they manually refresh or navigate away and back
      } else {
        setError(data.error || 'Failed to create API key');
      }
    } catch (error) {
      setError('Error creating API key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="font-medium mb-3">Create New API Key</h3>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded text-sm">
          {error}
        </div>
      )}

      {newKey && (
        <div className="mb-3 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              ⚠️ New API Key Created
            </h4>
            <button
              onClick={() => setNewKey(null)}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mb-2">
            Copy this key now! It won&apos;t be shown again.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
              {newKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey);
                alert('API key copied to clipboard!');
              }}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter key name (e.g., 'Production API')"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
} 