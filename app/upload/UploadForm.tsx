'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface UploadedCity {
  id: number;
  cityName: string;
  mapName: string;
  population: number;
  money: number;
  xp: number;
  unlimitedMoney?: boolean;
}

export function UploadForm() {
  const [metadata, setMetadata] = useState<UploadedCity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageSuccess, setImageSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadable, setDownloadable] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setMetadata(null);
    setUploadProgress(0);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File;
    
    if (!file) {
      setError('Please select a file');
      setLoading(false);
      return;
    }
    
    try {
      // Step 1: Get presigned URL
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }),
      });
      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }
      const { uploadUrl, key, fileName } = await presignedResponse.json();
      // Step 2: Upload file directly to R2 with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });
      // Step 3: Process metadata
      const metadataResponse = await fetch('/api/upload/process-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
          fileName: fileName,
          downloadable: downloadable,
        }),
      });
      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.error || 'Failed to process metadata');
      }
      const data = await metadataResponse.json();
      setMetadata(data.city);
      // If images are selected, upload them automatically
      if (images.length > 0) {
        await uploadImages(data.city.id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  async function uploadImages(cityId: number) {
    if (images.length === 0) return;
    setImageLoading(true);
    setImageError(null);
    setImageSuccess(false);
    setImageUploadProgress(0);
    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append('images', image);
      });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/cities/${cityId}/images`);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setImageUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setImageUploadProgress(100);
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });
      setImageSuccess(true);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setImageLoading(false);
      setImageUploadProgress(0);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isImage && isValidSize;
    });
    
    setImages(prev => {
      const combined = [...prev, ...validFiles];
      return combined.slice(0, 15); // Maximum 15 images
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Your City</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Share your Cities: Skylines 2 creation with the Cities Collective
        </p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* City File Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Upload City Save File
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select .cok file
                </label>
                
                {/* Save file location help */}
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                        Cities: Skylines II save files are located at:
                      </p>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 px-2 py-1 rounded font-mono">
                          %USERPROFILE%\AppData\LocalLow\Colossal Order\Cities Skylines II\Saves\
                        </code>
                        <button
                          type="button"
                          onClick={async () => {
                            const path = '%USERPROFILE%\\AppData\\LocalLow\\Colossal Order\\Cities Skylines II\\Saves\\';
                            try {
                              await navigator.clipboard.writeText(path);
                              setCopySuccess(true);
                              setTimeout(() => setCopySuccess(false), 2000);
                            } catch (err) {
                              console.error('Failed to copy:', err);
                            }
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs"
                          title="Copy path to clipboard"
                        >
                          {copySuccess ? '✅ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Tip: Paste the path above into File Explorer&apos;s address bar to navigate directly to your saves folder.
                      </p>
                    </div>
                  </div>
                </div>

                <input 
                  type="file" 
                  name="file" 
                  accept=".cok" 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Maximum file size: 3GB
                </p>
              </div>
              
              {/* Downloadable checkbox */}
              <div className="flex items-center">
                <input
                  id="downloadable"
                  type="checkbox"
                  checked={downloadable}
                  onChange={(e) => setDownloadable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                />
                <label htmlFor="downloadable" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allow others to download this city
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                When enabled, other users can download your .cok save file. You can change this later in your dashboard.
              </p>
              
              {uploadProgress > 0 && loading && (
                <div className="w-full bg-gray-200 rounded h-4 mt-2">
                  <div
                    className="bg-blue-500 h-4 rounded"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? 'Uploading City...' : 'Upload City'}
              </button>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Image Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Add Screenshots (Optional)
            </h2>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-2">
                <div className="text-gray-400 text-4xl">📸</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Drag & drop images here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Up to 15 images, max 10MB each
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports JPEG, PNG, WebP, GIF
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected Images ({images.length}/15)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        width={200}
                        height={96}
                        className="w-full h-24 object-cover rounded-md"
                        style={{ objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {index === 0 ? 'Primary' : `${index + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Status */}
            {imageLoading && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-blue-700 dark:text-blue-400 text-sm">Uploading images... (you can leave this page now)</p>
              </div>
            )}
            {imageError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-700 dark:text-red-400 text-sm">{imageError}</p>
              </div>
            )}
            {imageSuccess && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-green-700 dark:text-green-400 text-sm">Images uploaded successfully!</p>
              </div>
            )}
            {imageUploadProgress > 0 && imageLoading && (
              <div className="w-full bg-gray-200 rounded h-4 mt-2">
                <div
                  className="bg-blue-500 h-4 rounded"
                  style={{ width: `${imageUploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {metadata && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">
                🎉 City Uploaded Successfully!
              </h3>
              <Link
                href={`/city/${metadata.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                View City
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{metadata.cityName}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">City Name</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{metadata.mapName}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Map</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{metadata.population?.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Population</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{metadata.unlimitedMoney ? '∞' : `$${metadata.money?.toLocaleString()}`}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Money</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{metadata.xp?.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">XP</div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href="/protected"
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-center"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  setMetadata(null);
                  setImages([]);
                  setImageSuccess(false);
                  setImageError(null);
                  setDownloadable(true); // Reset to default
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Upload Another City
              </button>
            </div>
          </div>
        )}
    </main>
  );
} 