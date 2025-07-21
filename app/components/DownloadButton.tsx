'use client';

import { useState } from 'react';

interface DownloadButtonProps {
  cityId: number;
  cityName: string;
  fileName?: string;
  downloadable: boolean;
  isOwner: boolean;
  className?: string;
}

export default function DownloadButton({ 
  cityId, 
  cityName, 
  fileName, 
  downloadable, 
  isOwner, 
  className 
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!downloadable && !isOwner) {
      setError('This city is not available for download');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      // Direct redirect to download endpoint - browser will handle the redirect
      window.location.href = `/api/cities/${cityId}/download`;

    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
      setIsDownloading(false);
    }
  };

  if (!downloadable && !isOwner) {
    return (
      <button 
        disabled 
        className={`flex h-10 items-center justify-center rounded-md bg-gray-400 px-3 py-2 text-sm font-semibold text-white shadow-sm cursor-not-allowed ${className || ''}`}
        title="This city is not available for download"
      >
        Download Unavailable
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`flex h-10 items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed ${className || ''}`}
      >
        {isDownloading ? 'Generating Download...' : 'Download City'}
      </button>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {!isOwner && downloadable && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Download link expires in 1 hour
        </p>
      )}
    </div>
  );
} 