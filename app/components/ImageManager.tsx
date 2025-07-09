'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CityImage {
  id: number;
  fileName: string | null;
  originalName: string | null;
  thumbnailPath: string | null;
  mediumPath: string | null;
  largePath: string | null;
  originalPath: string | null;
  width: number | null;
  height: number | null;
  isPrimary: boolean | null;
  sortOrder: number | null;
  uploadedAt: Date | null;
}

interface ImageManagerProps {
  cityId: number;
  images: CityImage[];
  onImagesChange?: (images: CityImage[]) => void;
}

export function ImageManager({ cityId, images, onImagesChange }: ImageManagerProps) {
  const [imageList, setImageList] = useState<CityImage[]>(images);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setImageList(images);
  }, [images]);

  // Only update from props if the images array length changes (new uploads)
  // This prevents the component from reverting to the original order
  useEffect(() => {
    if (images.length !== imageList.length) {
      setImageList(images);
    }
  }, [images.length, imageList.length]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder images
    const newImageList = [...imageList];
    const [draggedImage] = newImageList.splice(draggedIndex, 1);
    newImageList.splice(dropIndex, 0, draggedImage);
    
    setImageList(newImageList);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Update order in database
    try {
      const response = await fetch(`/api/cities/${cityId}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageIds: newImageList.map(img => img.id)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder images');
      }

      onImagesChange?.(newImageList);
      // Don't refresh - let the local state handle the display
      // The changes are saved to the database and will persist
    } catch (error) {
      console.error('Error reordering images:', error);
      // Revert on error
      setImageList(images);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const newImageList = imageList.filter(img => img.id !== imageId);
        setImageList(newImageList);
        onImagesChange?.(newImageList);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      const response = await fetch(`/api/images/${imageId}/primary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityId: cityId
        }),
      });

      if (response.ok) {
        const newImageList = imageList.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }));
        setImageList(newImageList);
        onImagesChange?.(newImageList);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set primary image');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      alert('Failed to set primary image. Please try again.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const response = await fetch(`/api/cities/${cityId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newImages = await response.json();
        const updatedImageList = [...imageList, ...newImages.images];
        setImageList(updatedImageList);
        onImagesChange?.(updatedImageList);
      } else {
        throw new Error('Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add New Images
        </h3>
        <div className="flex items-center space-x-4">
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading ? 'Uploading...' : 'Choose Images'}
          </label>
          {isUploading && (
            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          You can upload multiple images at once. Supported formats: JPEG, PNG, WebP, GIF (max 10MB each)
        </p>
      </div>

      {/* Image List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Manage Images ({imageList.length})
        </h3>
        
        {imageList.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No images uploaded yet. Add some images above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imageList.map((image, index) => (
              <div
                key={image.id}
                className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 transition-all duration-200 ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent'
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                {/* Image */}
                <div className="aspect-square relative">
                  <img
                    src={image.mediumPath || image.thumbnailPath || ''}
                    alt={image.originalName || 'City image'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary Badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Primary
                    </div>
                  )}
                  
                  {/* Drag Handle */}
                  <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded cursor-move">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {image.originalName || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {image.width} × {image.height} • {image.uploadedAt ? new Date(image.uploadedAt).toLocaleDateString('en-GB') : 'Unknown'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="p-3 pt-0 flex space-x-2">
                  {!image.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(image.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors"
                    >
                      Set Primary
                    </button>
                  )}
                                     <button
                     onClick={() => handleDeleteImage(image.id)}
                     className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded transition-colors"
                     disabled={!!image.isPrimary && imageList.length === 1}
                     title={!!image.isPrimary && imageList.length === 1 ? 'Cannot delete the only primary image' : 'Delete image'}
                   >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to manage images:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Drag and drop images to reorder them</li>
          <li>• Click &quot;Set Primary&quot; to make an image the main thumbnail</li>
          <li>• Click &quot;Delete&quot; to remove an image (you must have at least one primary image)</li>
          <li>• Upload new images using the form above</li>
        </ul>
      </div>
    </div>
  );
} 