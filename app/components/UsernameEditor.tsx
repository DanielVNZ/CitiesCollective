'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UsernameEditorProps {
  currentUsername: string;
  onUsernameUpdate: (newUsername: string) => void;
}

export function UsernameEditor({ currentUsername, onUsernameUpdate }: UsernameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.trim() === currentUsername) {
      setIsEditing(false);
      return;
    }

    if (username.trim().length < 3 || username.trim().length > 32) {
      setError('Username must be between 3 and 32 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        onUsernameUpdate(data.user.username);
        setIsEditing(false);
        router.refresh(); // Refresh the page to show updated data
      } else {
        setError(data.error || 'Failed to update username');
      }
    } catch (error) {
      setError('An error occurred while updating username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername(currentUsername);
    setError('');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{currentUsername}</span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
          title="Edit username"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="text-3xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-500 bg-transparent focus:outline-none focus:border-blue-700"
          placeholder="Enter username"
          disabled={isLoading}
          autoFocus
        />
        <div className="flex space-x-1">
          <button
            type="submit"
            disabled={isLoading}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 disabled:opacity-50"
            title="Save username"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 disabled:opacity-50"
            title="Cancel edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Username must be 3-32 characters long and contain only letters, numbers, underscores, and hyphens.
      </p>
    </form>
  );
} 