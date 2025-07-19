'use client';

import { useState } from 'react';

interface DownloadToggleProps {
  cityId: number;
  initialDownloadable: boolean;
}

export function DownloadToggle({ cityId, initialDownloadable }: DownloadToggleProps) {
  const [downloadable, setDownloadable] = useState(initialDownloadable);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleDownloadable = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/cities/${cityId}/downloadable`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          downloadable: !downloadable,
        }),
      });

      if (response.ok) {
        setDownloadable(!downloadable);
      } else {
        const error = await response.json();
        alert(`Failed to update download setting: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to update download setting. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={toggleDownloadable}
      disabled={isUpdating}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        downloadable
          ? 'bg-blue-600'
          : 'bg-gray-200 dark:bg-gray-600'
      } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          downloadable ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
} 