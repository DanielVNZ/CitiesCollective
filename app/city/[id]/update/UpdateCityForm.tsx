'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UpdateCityFormProps {
  cityId: number;
}

export function UpdateCityForm({ cityId }: UpdateCityFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.cok')) {
        setError('Please select a .cok file');
        event.target.value = '';
        return;
      }
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const file = formData.get('file') as File;

    if (!file) {
      setError('Please select a file');
      setIsUploading(false);
      return;
    }

    if (!file.name.endsWith('.cok')) {
      setError('Please select a .cok file');
      setIsUploading(false);
      return;
    }

    try {
      const response = await fetch(`/api/cities/${cityId}/update`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/city/${cityId}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update city');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-400 text-sm">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
          <div className="text-green-800 dark:text-green-400 text-sm">
            City updated successfully! Redirecting...
          </div>
        </div>
      )}

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Save File (.cok)
        </label>
        <input
          type="file"
          id="file"
          name="file"
          accept=".cok"
          onChange={handleFileChange}
          required
          className="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-blue-50 dark:file:bg-blue-900/20
            file:text-blue-700 dark:file:text-blue-400
            hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30
            file:cursor-pointer
            cursor-pointer
            border border-gray-300 dark:border-gray-600
            rounded-md
            bg-white dark:bg-gray-800"
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Upload your .cok save file to update your city's statistics
        </p>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isUploading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isUploading ? 'Updating...' : 'Update City'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isUploading}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 