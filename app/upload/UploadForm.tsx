'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [metadata, setMetadata] = useState<UploadedCity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadable, setDownloadable] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [skyveLogsFile, setSkyveLogsFile] = useState<File | null>(null);
  const [skyveLogsError, setSkyveLogsError] = useState<string | null>(null);
  const [skyveLogsLoading, setSkyveLogsLoading] = useState(false);
  const [parsedMods, setParsedMods] = useState<Array<{id: string, name: string, version?: string}>>([]);
  const [useSkyveMods, setUseSkyveMods] = useState(false);

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
      setError('Please select a city save file');
      setLoading(false);
      return;
    }
    
    try {
      // Step 1: Get presigned URL for city save file
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
      
      // Step 2: Upload city save file directly to R2 with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 50)); // 50% for file upload
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });
      
      setUploadProgress(60); // File uploaded, now processing
      
      // Step 3: Process metadata with Skyve mods if available
      const metadataResponse = await fetch('/api/upload/process-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
          fileName: fileName,
          downloadable: downloadable,
          skyveMods: useSkyveMods ? parsedMods : null,
        }),
      });
      
      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.error || 'Failed to process metadata');
      }
      
      const data = await metadataResponse.json();
      setUploadProgress(80); // Metadata processed
      
      // Step 4: Upload images if any are selected
      if (images.length > 0) {
        const imageFormData = new FormData();
        images.forEach((image) => {
          imageFormData.append('images', image);
        });
        
        const imageResponse = await fetch(`/api/cities/${data.city.id}/images`, {
          method: 'POST',
          body: imageFormData,
        });
        
        if (!imageResponse.ok) {
          console.error('Failed to upload images, but city was created successfully');
        }
      }
      
      setUploadProgress(100);
      setMetadata(data.city);
      
      // Automatically redirect to the city page after successful upload
      setTimeout(() => {
        router.push(`/city/${data.city.id}`);
      }, 1500); // Give user a moment to see the success message
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
      setUploadProgress(0);
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

  const handleSkyveLogsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSkyveLogsFile(null);
      setParsedMods([]);
      setUseSkyveMods(false);
      return;
    }

    if (!file.name.endsWith('.zip')) {
      setSkyveLogsError('Please select a ZIP file');
      setSkyveLogsFile(null);
      return;
    }

    setSkyveLogsError(null);
    setSkyveLogsLoading(true);
    setSkyveLogsFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/process-skyve-logs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process Skyve logs');
      }

      const data = await response.json();
      setParsedMods(data.mods);
      setUseSkyveMods(true);
    } catch (error) {
      setSkyveLogsError(error instanceof Error ? error.message : 'Failed to process Skyve logs');
      setSkyveLogsFile(null);
      setParsedMods([]);
      setUseSkyveMods(false);
    } finally {
      setSkyveLogsLoading(false);
    }
  };

  const handleSkyveLogsPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('application/zip') !== -1 || item.type.indexOf('application/x-zip-compressed') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const zipFile = new File([file], 'skyve-logs.zip', { type: 'application/zip' });
          setSkyveLogsFile(zipFile);
          
          setSkyveLogsError(null);
          setSkyveLogsLoading(true);

          try {
            const formData = new FormData();
            formData.append('file', zipFile);

            const response = await fetch('/api/upload/process-skyve-logs', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to process Skyve logs');
            }

            const data = await response.json();
            setParsedMods(data.mods);
            setUseSkyveMods(true);
          } catch (error) {
            setSkyveLogsError(error instanceof Error ? error.message : 'Failed to process Skyve logs');
            setSkyveLogsFile(null);
            setParsedMods([]);
            setUseSkyveMods(false);
          } finally {
            setSkyveLogsLoading(false);
          }
          break;
        }
      }
    }
  };

  const removeSkyveLogs = () => {
    setSkyveLogsFile(null);
    setParsedMods([]);
    setUseSkyveMods(false);
    setSkyveLogsError(null);
    const fileInput = document.getElementById('skyve-logs-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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

      <div className="flex flex-col lg:flex-row gap-6">
        <form id="upload-form" onSubmit={handleSubmit} className="flex-1 space-y-8">
          {/* City Save File - Required */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              City Save File <span className="text-red-500">*</span>
            </h2>
                
                {/* Save file location help */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
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
                        >
                          {copySuccess ? '✅ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select .cok file
              </label>
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
                </div>
          </div>

        {/* Screenshots - Optional */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Screenshots <span className="text-gray-500 text-sm">(Optional)</span>
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
                Up to 15 images, max 10MB each • Supports JPEG, PNG, WebP, GIF
                </p>
              </div>
          </div>
          
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected Images ({images.length}/15)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                      <div key={index} className="relative group aspect-video">
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover rounded-md"
                      />
                      <button
                          type="button"
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
        </div>

        {/* Skyve Logs - Optional */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Skyve Logs <span className="text-gray-500 text-sm">(Optional)</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your Skyve logs to automatically populate the mods list with clickable links to Paradox Mods and compatibility notes.
          </p>
          
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">How to get your Skyve logs:</h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                <span>Run Cities: Skylines II with the playset used for this city</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                <span>In Skyve, go to <strong>Help & Logs</strong> → <strong>Copy logs to clipboard</strong></span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                <span>Paste the ZIP file below (Ctrl+V)</span>
              </li>
            </ol>
          </div>
          
          <div className="space-y-4">
            {/* File Upload with Paste Support */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select or paste Skyve logs ZIP file
              </label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:border-blue-400 dark:hover:border-blue-500"
                onPaste={handleSkyveLogsPaste}
              >
                <div className="space-y-2">
                  <div className="text-gray-400 text-4xl">📁</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag & drop ZIP file here, or{' '}
                    <button
                      type="button"
                      onClick={() => document.getElementById('skyve-logs-input')?.click()}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You can also paste a ZIP file with Ctrl+V • Maximum file size: 10MB
                  </p>
                </div>
              </div>
              <input
                id="skyve-logs-input"
                type="file"
                accept=".zip"
                onChange={handleSkyveLogsChange}
                className="hidden"
              />
            </div>

            {/* Loading State */}
            {skyveLogsLoading && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Processing Skyve logs...</span>
              </div>
            )}

            {/* Error State */}
            {skyveLogsError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-700 dark:text-red-400 text-sm">{skyveLogsError}</p>
              </div>
            )}

            {/* Success State - Show Parsed Mods */}
            {parsedMods.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Successfully parsed {parsedMods.length} mods from Skyve logs
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeSkyveLogs}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>

                {/* Use Skyve Mods Toggle */}
                <div className="flex items-center">
                  <input
                    id="use-skyve-mods"
                    type="checkbox"
                    checked={useSkyveMods}
                    onChange={(e) => setUseSkyveMods(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                  />
                  <label htmlFor="use-skyve-mods" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Use mods from Skyve logs instead of extracting from save file
                  </label>
                </div>

                {/* Mods Preview */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Mods Preview ({parsedMods.length} mods):
                  </h4>
                  <div className="space-y-2">
                    {parsedMods.slice(0, 10).map((mod, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <a
                            href={`https://mods.paradoxplaza.com/mods/${mod.id}/Windows`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {mod.name}
                          </a>
                        </div>
                        <span className="text-gray-400 dark:text-gray-500 text-xs">#{mod.id}</span>
                      </div>
                    ))}
                    {parsedMods.length > 10 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-600">
                        ... and {parsedMods.length - 10} more mods
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        </form>

        {/* Upload Button Container */}
        <div className="w-full lg:w-64 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 lg:self-start">
          <button 
            type="submit" 
            form="upload-form"
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium" 
            disabled={loading}
          >
            {loading ? 'Uploading City...' : 'Upload City'}
          </button>
          
          {/* Progress Bar */}
          {uploadProgress > 0 && loading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2">
                <div
                  className="bg-blue-500 h-2 rounded transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
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
              type="button"
                onClick={() => {
                  setMetadata(null);
                  setImages([]);
                setDownloadable(true);
                setSkyveLogsFile(null);
                setParsedMods([]);
                setUseSkyveMods(false);
                setSkyveLogsError(null);
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