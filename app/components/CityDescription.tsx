'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CityDescriptionProps {
  cityId: number;
  initialDescription?: string | null;
  isOwner: boolean;
}

export function CityDescription({ cityId, initialDescription, isOwner }: CityDescriptionProps) {
  const [description, setDescription] = useState(initialDescription || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!isOwner) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cities/${cityId}/description`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save description');
      }

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save description');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription(initialDescription || '');
    setIsEditing(false);
    setError(null);
  };

  if (!isOwner && !description) {
    return null; // Don't show anything if not owner and no description
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          City Description
        </h3>
        {isOwner && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {isEditing ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {description ? 'Edit' : 'Add Description'}
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Text formatting supported)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Write a description of your city... (Text formatting supported)"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              You can use text formatting like **bold**, *italic*, [links](url), and more. Images are not supported.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Description'}
            </button>
          </div>
        </div>
      ) : (
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          {description ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Disable image rendering
                img: () => null,
                // Disable image references
                image: () => null,
              }}
            >
              {description}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No description added yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
} 