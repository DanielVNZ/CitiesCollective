'use client';

import { useState } from 'react';

interface SaveGameManagerProps {
  cityId: number;
  initialFilePath?: string | null;
  initialFileName?: string | null;
  isOwner: boolean;
}

export function SaveGameManager({ cityId, initialFilePath, initialFileName, isOwner }: SaveGameManagerProps) {
  const [filePath, setFilePath] = useState(initialFilePath || '');
  const [fileName, setFileName] = useState(initialFileName || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      formData.append('file', selectedFile);
      const response = await fetch(`/api/cities/${cityId}/update`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload savegame file');
      }
      const data = await response.json();
      setFilePath(data.city.filePath);
      setFileName(data.city.fileName);
      setSelectedFile(null);
      const fileInput = document.getElementById('savegame-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload savegame file');
    } finally {
      setIsUploading(false);
    }
  };

  // Don't show anything if not owner
  if (!isOwner) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <button
        className="w-full flex justify-between items-center px-6 py-4 focus:outline-none"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-expanded={!isCollapsed}
        aria-controls="savegame-collapse"
      >
        <span className="text-xl font-semibold text-gray-900 dark:text-white">Manage Savegame</span>
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
        id="savegame-collapse"
        className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`}
        style={{ padding: isCollapsed ? 0 : '1.5rem' }}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
        {filePath ? (
          <div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">Current Savegame</p>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    {fileName || 'savegame.cok'}
                  </p>
                </div>
              </div>
            </div>
            {isOwner && (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Upload a new .cok file to replace the current savegame
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎮</div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              No savegame file uploaded yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Upload a .cok file to share your city save
            </p>
          </div>
        )}
        {isOwner && (
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="savegame-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Savegame File
              </label>
              <input
                id="savegame-input"
                type="file"
                accept=".cok"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-50 file:text-green-700
                  dark:file:bg-green-900/20 dark:file:text-green-400
                  hover:file:bg-green-100 dark:hover:file:bg-green-900/30
                  file:cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Supported format: .cok files. Max size: 3GB
              </p>
            </div>
            {selectedFile && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    const fileInput = document.getElementById('savegame-input') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Savegame'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 