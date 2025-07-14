'use client';

import { useState } from 'react';

interface HoFCreatorIdEditorProps {
  currentHoFCreatorId: string | null;
}

export default function HoFCreatorIdEditor({ currentHoFCreatorId }: HoFCreatorIdEditorProps) {
  const [hofCreatorId, setHoFCreatorId] = useState(currentHoFCreatorId || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/hof-creator-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hofCreatorId: hofCreatorId.trim() || null }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('HoF Creator ID updated successfully!');
        setMessageType('success');
        setIsEditing(false);
      } else {
        setMessage(data.error || 'Failed to update HoF Creator ID');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An error occurred while updating your HoF Creator ID');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setHoFCreatorId(currentHoFCreatorId || '');
    setIsEditing(false);
    setMessage('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          HoF Creator ID
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="hofCreatorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your HoF Creator ID
            </label>
            <input
              type="text"
              id="hofCreatorId"
              value={hofCreatorId}
              onChange={(e) => setHoFCreatorId(e.target.value)}
              placeholder="Enter your HoF Creator ID (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This ID will be used when you make API calls to the HoF Creator API. Leave empty to use your user ID.
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              messageType === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current ID:</span>
            <span className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentHoFCreatorId || 'Not set'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {currentHoFCreatorId 
              ? 'This ID will be used in your HoF Creator API calls.'
              : 'Set a custom HoF Creator ID or leave empty to use your user ID.'
            }
          </p>
        </div>
      )}
    </div>
  );
} 