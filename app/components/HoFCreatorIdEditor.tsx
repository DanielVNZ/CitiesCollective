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
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSave = async () => {
    // Check if this is a new Creator ID or if it's being changed
    const isNewOrChanged = !currentHoFCreatorId || hofCreatorId.trim() !== currentHoFCreatorId;
    
    if (isNewOrChanged && hofCreatorId.trim()) {
      setShowConfirmation(true);
      return;
    }
    
    await performSave();
  };

  const performSave = async () => {
    setIsLoading(true);
    setMessage('');
    setShowConfirmation(false);

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
    setShowConfirmation(false);
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">HoF Creator ID:</span>
            <span className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {currentHoFCreatorId 
                ? `${currentHoFCreatorId.substring(0, 8)}...${currentHoFCreatorId.substring(currentHoFCreatorId.length - 4)}`
                : 'Not set'
              }
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {currentHoFCreatorId 
              ? ''
              : 'Set a custom HoF Creator ID or leave empty to use your user ID.'
            }
          </p>
          {currentHoFCreatorId && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Hall of Fame Integration</p>
                  <p>Your Hall of Fame screenshots will automatically appear on city pages where the city name matches. No manual upload needed!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 mr-3">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Hall of Fame Integration
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                By setting a Hall of Fame Creator ID, you agree to allow Cities Collective to:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  Share your user information (username, user ID) with Hall of Fame
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  Share your city information (names, IDs) with Hall of Fame
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  Automatically display your Hall of Fame screenshots on matching city pages
                </li>

              </ul>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This integration helps connect your Cities Collective profile with your Hall of Fame content.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={performSave}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Confirm & Continue'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 