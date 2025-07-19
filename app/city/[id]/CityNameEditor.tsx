'use client';

import { useState } from 'react';

interface CityNameEditorProps {
  cityId: number;
  initialCityName: string | null;
  initialMapName: string | null;
  theme: string | null;
  hasHallOfFameImages: boolean;
  isOwner: boolean;
}

export function CityNameEditor({ 
  cityId, 
  initialCityName, 
  initialMapName, 
  theme,
  hasHallOfFameImages, 
  isOwner 
}: CityNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [cityName, setCityName] = useState(initialCityName || '');
  const [mapName, setMapName] = useState(initialMapName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHofWarning, setShowHofWarning] = useState(false);

  if (!isOwner) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          {initialCityName || 'Unnamed City'}
        </h1>
        <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
          Normal Mode
        </span>
      </div>
    );
  }

  const handleSave = async () => {
    if (!cityName.trim()) {
      setError('City name cannot be empty');
      return;
    }

    if (hasHallOfFameImages && !showHofWarning) {
      setShowHofWarning(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cities/${cityId}/update-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityName: cityName.trim(),
          mapName: mapName.trim(),
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        setShowHofWarning(false);
        // Optionally refresh the page or update parent component
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update city details');
      }
    } catch (error) {
      setError('Failed to update city details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCityName(initialCityName || '');
    setMapName(initialMapName || '');
    setIsEditing(false);
    setError(null);
    setShowHofWarning(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Hall of Fame Warning Modal */}
        {showHofWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  Hall of Fame Warning
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This city has Hall of Fame images. The city name <strong>MUST</strong> match exactly with the Hall of Fame entry to maintain proper attribution and recognition.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowHofWarning(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Continue Anyway'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="cityName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City Name *
            </label>
            <input
              type="text"
              id="cityName"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter city name"
            />
          </div>
          
          <div>
            <label htmlFor="mapName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Map Name
            </label>
            <input
              type="text"
              id="mapName"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter map name"
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          {initialCityName || 'Unnamed City'}
        </h1>
        <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
          Normal Mode
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Edit city name and map"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
      
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
        {initialMapName || 'Unknown Map'} • {theme || 'Default Theme'}
      </p>
    </div>
  );
} 