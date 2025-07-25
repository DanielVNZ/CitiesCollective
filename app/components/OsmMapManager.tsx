'use client';

import { useState } from 'react';
import { OsmMapViewer } from './OsmMapViewer';

interface OsmMapManagerProps {
  cityId: number;
  initialOsmMapPath?: string | null;
  isOwner: boolean;
}

export function OsmMapManager({ cityId, initialOsmMapPath, isOwner }: OsmMapManagerProps) {
  const [osmMapPath, setOsmMapPath] = useState(initialOsmMapPath || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // Collapsible only if owner and no map
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('osmMap', selectedFile);
      const response = await fetch(`/api/cities/${cityId}/osm-map`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload OSM map');
      }
      const data = await response.json();
      setOsmMapPath(data.osmMapPath);
      setSelectedFile(null);
      const fileInput = document.getElementById('osm-map-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload OSM map');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/cities/${cityId}/osm-map`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove OSM map');
      }
      setOsmMapPath('');
      setIsMapLoaded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove OSM map');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLoadMap = () => {
    setIsMapLoaded(true);
  };

  // If not owner and no map, show nothing
  if (!isOwner && !osmMapPath) {
    return null;
  }

  // If a map is uploaded, show the map section with load button
  if (osmMapPath) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          {isOwner && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Removing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Map
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {!isMapLoaded ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🗺️</div>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-4">
              OSM Map Available
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Click the button below to load and view the city map
            </p>
            <button
              onClick={handleLoadMap}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
              Load OSM Map
            </button>
          </div>
        ) : (
          <OsmMapViewer osmMapPath={osmMapPath} cityId={cityId} />
        )}
        
        {isOwner && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Upload a new OSM file to replace the current one
          </p>
        )}
        {isOwner && (
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="osm-map-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload OSM Map
              </label>
              <input
                id="osm-map-input"
                type="file"
                accept=".osm,application/xml,text/xml"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  dark:file:bg-blue-900/20 dark:file:text-blue-400
                  hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30
                  file:cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Supported format: .osm files. Max size: 3GB
              </p>
            </div>
            {selectedFile && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    const fileInput = document.getElementById('osm-map-input') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Map'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // If owner and no map, collapsible and collapsed by default
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <button
        className="w-full flex justify-between items-center px-6 py-4 focus:outline-none"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-expanded={!isCollapsed}
        aria-controls="osm-map-collapse"
      >
        <span className="text-xl font-semibold text-gray-900 dark:text-white">City Map</span>
        <svg
          className={`w-5 h-5 ml-2 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        id="osm-map-collapse"
        className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`}
        style={{ padding: isCollapsed ? 0 : '1.5rem' }}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            No OSM map uploaded yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Upload an OSM file to share your city&apos;s map data
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="osm-map-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload OSM Map
            </label>
            <input
              id="osm-map-input"
              type="file"
              accept=".osm,application/xml,text/xml"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900/20 dark:file:text-blue-400
                hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30
                file:cursor-pointer"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Supported format: .osm files. Max size: 100MB
            </p>
          </div>
          {selectedFile && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  const fileInput = document.getElementById('osm-map-input') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Map'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 