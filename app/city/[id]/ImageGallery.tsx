'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import { ImageLikeButton } from 'app/components/ImageLikeButton';
import { ImageComments } from 'app/components/ImageComments';
import { useSearchParams } from 'next/navigation';

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

interface ImageGalleryProps {
  images: CityImage[];
  cityId: number;
  isOwner: boolean;
  onImagesChange?: (newImages: CityImage[]) => void;
  deepLinkImageId?: string | null;
  deepLinkImageType?: string | null;
  deepLinkCommentId?: string | null;
}

export function ImageGallery({ images, cityId, isOwner, onImagesChange, deepLinkImageId, deepLinkImageType, deepLinkCommentId }: ImageGalleryProps) {
  const [mainGalleryIndex, setMainGalleryIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isClosingComments, setIsClosingComments] = useState(false);
  const [imageLikeStates, setImageLikeStates] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const mainImageRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const hasHandledDeepLink = useRef(false);

  // Filter out images with missing required data and use the sorted images from props
  const validImages = images.filter(image => 
    image.mediumPath && image.largePath && image.originalName && image.thumbnailPath && image.originalPath
  );

  // Preload adjacent images
  const preloadAdjacentImages = useCallback((currentIndex: number) => {
    const imagesToPreload = [];
    
    // Preload previous image
    if (currentIndex > 0) {
      const prevImage = validImages[currentIndex - 1];
      if (prevImage?.originalPath) {
        imagesToPreload.push(prevImage.originalPath);
      }
    }
    
    // Preload next image
    if (currentIndex < validImages.length - 1) {
      const nextImage = validImages[currentIndex + 1];
      if (nextImage?.originalPath) {
        imagesToPreload.push(nextImage.originalPath);
      }
    }
    
    // Preload images
    imagesToPreload.forEach(imagePath => {
      if (!preloadedImages.has(imagePath)) {
        const img = new window.Image();
        img.onload = () => {
          setPreloadedImages(prev => new Set(Array.from(prev).concat([imagePath])));
        };
        img.src = imagePath;
      }
    });
  }, [validImages, preloadedImages]);

  // Preload current image and adjacent images on mount and when images change
  useEffect(() => {
    if (validImages.length > 0) {
      const currentImage = validImages[mainGalleryIndex];
      if (currentImage?.originalPath) {
        preloadAdjacentImages(mainGalleryIndex);
      }
    }
  }, [validImages, mainGalleryIndex, preloadAdjacentImages]);

  // Fetch like states for all images
  useEffect(() => {
    const fetchLikeStates = async () => {
      const likeStates: Record<string, { liked: boolean; count: number }> = {};
      
      for (const image of validImages) {
        try {
          const response = await fetch(`/api/images/${image.id}/like?type=screenshot`);
          if (response.ok) {
            const data = await response.json();
            likeStates[image.id.toString()] = {
              liked: data.isLiked,
              count: data.likeCount
            };
          }
        } catch (error) {
          console.error(`Error fetching like state for image ${image.id}:`, error);
          likeStates[image.id.toString()] = { liked: false, count: 0 };
        }
      }
      
      setImageLikeStates(likeStates);
    };

    if (validImages.length > 0) {
      fetchLikeStates();
    }
  }, [validImages]); // Re-run if validImages changes

  // Update like button when like states change
  useEffect(() => {
    if (Object.keys(imageLikeStates).length > 0) {
      // Function to update like button for current image
      const updateCurrentLikeButton = () => {
        const likeButton = document.querySelector('.f-button--like');
        if (likeButton) {
          // Get current image ID from Fancybox instance
          const fancyboxInstance = Fancybox.getInstance();
          if (fancyboxInstance) {
            const currentSlideData = fancyboxInstance.getSlide();
            if (currentSlideData?.src) {
              const fancyboxLinks = document.querySelectorAll(`[data-fancybox="screenshots-${cityId}"]`);
              const currentHref = currentSlideData.src;
              
              for (const link of Array.from(fancyboxLinks)) {
                const linkHref = link.getAttribute('href');
                if (linkHref === currentHref) {
                  const currentImageId = link.getAttribute('data-image-id');
                  
                  if (currentImageId) {
                    const likeState = imageLikeStates[currentImageId];
                    if (likeState) {
                      const countElement = likeButton.querySelector('.like-count');
                      if (countElement) {
                        countElement.textContent = likeState.count.toString();
                      }
                      
                      if (likeState.liked) {
                        likeButton.classList.add('is-liked');
                        likeButton.innerHTML = '❤️ <span class="like-count">' + likeState.count + '</span>';
                      } else {
                        likeButton.classList.remove('is-liked');
                        likeButton.innerHTML = '🤍 <span class="like-count">' + likeState.count + '</span>';
                      }
                    }
                  }
                  break;
                }
              }
            }
          }
        }
      };
      
      // Try to update immediately
      updateCurrentLikeButton();
      
      // Also try again after a short delay in case Fancybox is still loading
      setTimeout(updateCurrentLikeButton, 200);
      
      // Also try again after a longer delay to ensure Fancybox is fully initialized
      setTimeout(updateCurrentLikeButton, 500);
      
      // Additional timeout to ensure like button is updated after all initialization
      setTimeout(updateCurrentLikeButton, 1000);
    }
  }, [imageLikeStates, cityId]);

  // Handle like toggle from Fancybox
  const handleFancyboxLike = useCallback(async (imageId: string) => {
    try {
      const response = await fetch(`/api/images/${imageId}/like?type=screenshot&cityId=${cityId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setImageLikeStates(prev => ({
          ...prev,
          [imageId]: {
            liked: data.liked,
            count: data.likeCount
          }
        }));
        
        // Update the data attribute on the Fancybox slide
        const currentSlide = document.querySelector('.fancybox__slide.is-selected, .fancybox__slide--current');
        if (currentSlide) {
          currentSlide.setAttribute('data-liked', data.liked.toString());
          currentSlide.setAttribute('data-like-count', data.likeCount.toString());
        }
        
        // Update the like button in Fancybox toolbar
        const likeButton = document.querySelector('.f-button--like') as HTMLElement;
        if (likeButton) {
          if (data.liked) {
            likeButton.classList.add('is-liked');
            likeButton.innerHTML = '❤️ <span class="like-count">' + data.likeCount + '</span>';
          } else {
            likeButton.classList.remove('is-liked');
            likeButton.innerHTML = '🤍 <span class="like-count">' + data.likeCount + '</span>';
          }
        }
      }
    } catch (error) {
      console.error('Error toggling image like:', error);
    }
  }, [cityId]);

  // Show 12 thumbnails at a time (more with smaller thumbnails)
  const thumbnailsPerPage = 12;
  const displayedThumbnails = validImages.slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailsPerPage);
  const hasMoreImages = validImages.length > thumbnailsPerPage;
  const canScrollLeft = thumbnailStartIndex > 0;
  const canScrollRight = thumbnailStartIndex + thumbnailsPerPage < validImages.length;

  // Reset thumbnail state when images change (due to sorting)
  useEffect(() => {
    setThumbnailStartIndex(0);
    setMainGalleryIndex(0);
  }, [images]);

  const nextMainImage = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setIsImageLoading(true);
    const currentGlobalIndex = thumbnailStartIndex + mainGalleryIndex;
    
    if (currentGlobalIndex < validImages.length - 1) {
      // Move to next image in the same page
      if (mainGalleryIndex < displayedThumbnails.length - 1) {
        setMainGalleryIndex(mainGalleryIndex + 1);
      } else {
        // Move to next page
        scrollThumbnailsRight();
      }
    } else {
      // Wrap around to first image
      setThumbnailStartIndex(0);
      setMainGalleryIndex(0);
    }
    
    // Preload adjacent images for the new position
    setTimeout(() => {
      const newGlobalIndex = thumbnailStartIndex + mainGalleryIndex;
      preloadAdjacentImages(newGlobalIndex);
      setIsLoading(false);
    }, 100);
  };

  const prevMainImage = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setIsImageLoading(true);
    const currentGlobalIndex = thumbnailStartIndex + mainGalleryIndex;
    
    if (currentGlobalIndex > 0) {
      // Move to previous image in the same page
      if (mainGalleryIndex > 0) {
        setMainGalleryIndex(mainGalleryIndex - 1);
      } else {
        // Move to previous page
        scrollThumbnailsLeft();
      }
    } else {
      // Wrap around to last image
      const lastPageStart = Math.max(0, validImages.length - thumbnailsPerPage);
      setThumbnailStartIndex(lastPageStart);
      setMainGalleryIndex(validImages.length - lastPageStart - 1);
    }
    
    // Preload adjacent images for the new position
    setTimeout(() => {
      const newGlobalIndex = thumbnailStartIndex + mainGalleryIndex;
      preloadAdjacentImages(newGlobalIndex);
      setIsLoading(false);
    }, 100);
  };

  const scrollThumbnailsLeft = () => {
    if (canScrollLeft) {
      setThumbnailStartIndex(Math.max(0, thumbnailStartIndex - thumbnailsPerPage));
      setMainGalleryIndex(0); // Reset to first image in new set
    }
  };

  const scrollThumbnailsRight = () => {
    if (canScrollRight) {
      setThumbnailStartIndex(Math.min(validImages.length - thumbnailsPerPage, thumbnailStartIndex + thumbnailsPerPage));
      setMainGalleryIndex(0); // Reset to first image in new set
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isLoading) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && displayedThumbnails.length > 1) {
      nextMainImage();
    }
    if (isRightSwipe && displayedThumbnails.length > 1) {
      prevMainImage();
    }

    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
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
        // Update local state
        const newImages = validImages.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }));
        onImagesChange?.(newImages);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set primary image');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      alert('Failed to set primary image. Please try again.');
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
        // Update local state
        const newImages = validImages.filter(img => img.id !== imageId);
        onImagesChange?.(newImages);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  const handleToggleComments = () => {
    if (showComments) {
      // Start closing animation
      setIsClosingComments(true);
      // Wait for animation to complete before hiding
      setTimeout(() => {
        setShowComments(false);
        setIsClosingComments(false);
      }, 200); // Match the animation duration
    } else {
      setShowComments(true);
    }
  };

  // Method to navigate to a specific image (for deep linking)
  const navigateToImage = useCallback((imageId: string, imageType: string) => {
    if (imageType === 'screenshot') {
      // Find the image by ID (convert string to number for city images)
      const targetImageIndex = validImages.findIndex(img => img.id.toString() === imageId);
      
      if (targetImageIndex !== -1) {
        // Calculate which page this image is on
        const targetPage = Math.floor(targetImageIndex / thumbnailsPerPage);
        const targetIndexInPage = targetImageIndex % thumbnailsPerPage;
        
        // Navigate to the correct page and image
        setThumbnailStartIndex(targetPage * thumbnailsPerPage);
        setMainGalleryIndex(targetIndexInPage);
      }
    }
    
    // Always expand comments for image comment notifications
    if (imageType === 'screenshot' || imageType === 'hall_of_fame') {
      setShowComments(true);
    }
  }, [validImages, thumbnailsPerPage]);

  // Handle deep link navigation from props
  useEffect(() => {
    if (hasHandledDeepLink.current) return;

    if (deepLinkImageId && deepLinkImageType) {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        navigateToImage(deepLinkImageId, deepLinkImageType);
        
        // If there's also a comment ID, we'll handle it in the ImageComments component
        if (deepLinkCommentId) {
          setShowComments(true);
        }
        
        hasHandledDeepLink.current = true;
      }, 100);
    }
  }, [deepLinkImageId, deepLinkImageType, deepLinkCommentId, navigateToImage]);

  // Initialize PhotoSwipe for screenshots
  useEffect(() => {
    // PhotoSwipe will be initialized when images are clicked
    // No need to pre-initialize like lightGallery
  }, [validImages, cityId]);



  // Initialize Fancybox for screenshots
  useEffect(() => {
    // Check if Fancybox is available (client-side only)
    if (typeof window === 'undefined' || !Fancybox) {
      return;
    }
    
        // Use a unique identifier for this specific gallery to avoid conflicts
    const galleryId = `screenshots-${cityId}`;
    
    // Destroy any existing Fancybox instances for this gallery
    try {
      Fancybox.close();
    } catch (error) {
      // Ignore errors during cleanup
    }
    
    // Simple function to update like button based on current image
    const updateLikeButtonForCurrentImage = () => {
      const likeButton = document.querySelector('.f-button--like');
      if (!likeButton) {
        return;
      }
      
      // Check if like states are loaded
      if (Object.keys(imageLikeStates).length === 0) {
        return;
      }
      
      // Get current image ID from Fancybox instance
      const fancyboxInstance = Fancybox.getInstance();
      if (fancyboxInstance) {
        const currentSlideData = fancyboxInstance.getSlide();
        if (currentSlideData?.src) {
          const fancyboxLinks = document.querySelectorAll(`[data-fancybox="${galleryId}"]`);
          const currentHref = currentSlideData.src;
          
          for (const link of Array.from(fancyboxLinks)) {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentHref) {
              const imageId = link.getAttribute('data-image-id');
              if (imageId) {
                // Get fresh like state from API instead of using cached state
                const fetchAndUpdateLikeState = async () => {
                  try {
                    const response = await fetch(`/api/images/${imageId}/like?type=screenshot`);
                    if (response.ok) {
                      const data = await response.json();
                      
                      const countElement = likeButton.querySelector('.like-count');
                      if (countElement) {
                        countElement.textContent = data.likeCount.toString();
                      }
                      
                      if (data.isLiked) {
                        likeButton.classList.add('is-liked');
                        likeButton.innerHTML = '❤️ <span class="like-count">' + data.likeCount + '</span>';
                      } else {
                        likeButton.classList.remove('is-liked');
                        likeButton.innerHTML = '🤍 <span class="like-count">' + data.likeCount + '</span>';
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching fresh like state:', error);
                    // Fallback to cached state
                    const likeState = imageLikeStates[imageId];
                    if (likeState) {
                      const countElement = likeButton.querySelector('.like-count');
                      if (countElement) {
                        countElement.textContent = likeState.count.toString();
                      }
                      
                      if (likeState.liked) {
                        likeButton.classList.add('is-liked');
                      } else {
                        likeButton.classList.remove('is-liked');
                      }
                    }
                  }
                };
                
                fetchAndUpdateLikeState();
              }
              break;
            }
          }
        }
      }
    };
    
    // Set up polling to check for image changes
    let lastImageSrc = '';
    const pollForChanges = setInterval(() => {
      const fancyboxInstance = Fancybox.getInstance();
      if (fancyboxInstance) {
        const currentSlideData = fancyboxInstance.getSlide();
        if (currentSlideData?.src && currentSlideData.src !== lastImageSrc) {
          lastImageSrc = currentSlideData.src;
          
          // Update like button immediately
          setTimeout(() => {
            updateLikeButtonForCurrentImage();
          }, 100);
        }
      }
    }, 500); // Check every 500ms
    
    // Bind only to screenshots gallery with specific container
    const galleryContainer = document.getElementById(`screenshots-gallery-${cityId}`);
    if (galleryContainer) {
      Fancybox.bind(galleryContainer, `[data-fancybox="${galleryId}"]`, {
        on: {
          init: (fancybox: any) => {
            // Add like button after initialization
            setTimeout(() => {
              // Try multiple selectors and log what we find
              const selectors = [
                '.f-carousel_toolbar',
                '.fancybox__toolbar', 
                '.fancybox-toolbar',
                '.fancybox__container .f-carousel_toolbar',
                '.fancybox__container .fancybox__toolbar',
                '[class*="toolbar"]',
                '[class*="carousel"]'
              ];
              
              let toolbar = null;
              for (const selector of selectors) {
                toolbar = document.querySelector(selector);
                if (toolbar) {
                  break;
                }
              }
              
              if (toolbar) {
                const likeButton = document.createElement('button');
                likeButton.className = 'f-button f-button--like';
                likeButton.title = 'Like this image';
                likeButton.innerHTML = '🤍 <span class="like-count">0</span>';
                // Remove inline styles to use CSS classes
                likeButton.style.cssText = '';
                
                // Insert into the right column of the toolbar
                const rightColumn = toolbar.querySelector('.f-carousel__toolbar__column.is-right');
                if (rightColumn) {
                  rightColumn.insertBefore(likeButton, rightColumn.firstChild);
                } else {
                  // Fallback: try to add to the toolbar directly
                  toolbar.appendChild(likeButton);
                }
                
                // Function to update like button state
                const updateLikeButtonState = (imageId: string) => {
                  const likeState = imageLikeStates[imageId];
                  if (likeState) {
                    const countElement = likeButton.querySelector('.like-count');
                    if (countElement) {
                      countElement.textContent = likeState.count.toString();
                    }
                    
                    if (likeState.liked) {
                      likeButton.classList.add('is-liked');
                      likeButton.innerHTML = '❤️ <span class="like-count">' + likeState.count + '</span>';
                    } else {
                      likeButton.classList.remove('is-liked');
                      likeButton.innerHTML = '🤍 <span class="like-count">' + likeState.count + '</span>';
                    }
                  }
                };

                // Get current image data and update button
                setTimeout(() => {
                  updateLikeButtonForCurrentImage();
                }, 300);

                // Add click handler
                likeButton.onclick = (e) => {
                  // Get current image ID from Fancybox instance
                  const fancyboxInstance = Fancybox.getInstance();
                  if (fancyboxInstance) {
                    const currentSlideData = fancyboxInstance.getSlide();
                    if (currentSlideData?.src) {
                      const fancyboxLinks = document.querySelectorAll(`[data-fancybox="${galleryId}"]`);
                      const currentHref = currentSlideData.src;
                      
                      for (const link of Array.from(fancyboxLinks)) {
                        const linkHref = link.getAttribute('href');
                        if (linkHref === currentHref) {
                          const imageId = link.getAttribute('data-image-id');
                          if (imageId) {
                            handleFancyboxLike(imageId);
                            
                            // Update button state after a short delay to allow API response
                            setTimeout(() => {
                              updateLikeButtonForCurrentImage();
                            }, 100);
                          }
                          break;
                        }
                      }
                    }
                  }
                };

                // Listen for slide changes to update like button
                const handleSlideChange = () => {
                  setTimeout(() => {
                    updateLikeButtonForCurrentImage();
                  }, 100);
                };

                // Add slide change listener
                document.addEventListener('fancybox:slidechange', handleSlideChange);
              }
            }, 200);
          }
        }
      });
    }

    return () => {
      // Clear polling interval
      clearInterval(pollForChanges);
      
      Fancybox.destroy();
    };
  }, [cityId, handleFancyboxLike]);



  if (validImages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No images available for this city.
      </div>
    );
  }

  return (
    <>
      {/* Fancybox Like Button Styles */}
      <style jsx global>{`
        .f-button--like {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
          color: #ffffff;
          font-size: 16px;
          background: rgba(75, 85, 99, 0.8);
          border: none;
          cursor: pointer;
          opacity: 0.9;
          margin: 0 4px;
          min-width: 32px;
          height: 32px;
          justify-content: center;
        }
        
        .f-button--like:hover {
          opacity: 1;
          background-color: rgba(75, 85, 99, 1);
        }
        
        .f-button--like.is-liked {
          color: #ec4899;
          opacity: 1;
        }
        
        .f-button--like .like-count {
          font-weight: 500;
          font-size: 12px;
          color: #9ca3af;
          margin-left: 2px;
        }
        
        .f-button--like.is-liked .like-count {
          color: #ec4899;
        }
      `}</style>
      
      {/* Main Gallery View */}
      <div className="mb-6">
        <div id={`screenshots-gallery-${cityId}`} className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
          {/* Hidden Fancybox Gallery - All Images except current main image (for Fancybox to discover) */}
          <div className="hidden">
            {validImages.map((image) => {
              const currentMainImage = displayedThumbnails[mainGalleryIndex];
              // Skip the currently displayed main image to avoid duplication
              if (currentMainImage && image.id === currentMainImage.id) {
                return null;
              }
              const likeState = imageLikeStates[image.id.toString()] || { liked: false, count: 0 };
              return (
                <a
                  key={`fancybox-hidden-${image.id}`}
                  href={image.originalPath!}
                  data-fancybox={`screenshots-${cityId}`}
                  data-caption={image.originalName!}
                  data-image-id={image.id.toString()}
                  data-liked={likeState.liked.toString()}
                  data-like-count={likeState.count.toString()}
                >
                  <img 
                    src={image.thumbnailPath || image.mediumPath || ''} 
                    alt={image.originalName || ''} 
                  />
                </a>
              );
            })}
          </div>
          
          {/* Main Image with Touch Gestures */}
          <div 
            ref={mainImageRef}
            className="relative aspect-video group cursor-pointer select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {displayedThumbnails[mainGalleryIndex] && (
              <a
                href={displayedThumbnails[mainGalleryIndex].originalPath!}
                data-fancybox={`screenshots-${cityId}`}
                data-caption={displayedThumbnails[mainGalleryIndex].originalName!}
                data-image-id={displayedThumbnails[mainGalleryIndex].id.toString()}
                data-liked={(imageLikeStates[displayedThumbnails[mainGalleryIndex].id.toString()]?.liked || false).toString()}
                data-like-count={(imageLikeStates[displayedThumbnails[mainGalleryIndex].id.toString()]?.count || 0).toString()}
                className="block w-full h-full cursor-pointer"
                onClick={async () => {
                  // Track view when main image is clicked to open fullscreen
                  try {
                    await fetch(`/api/images/${displayedThumbnails[mainGalleryIndex].id}/view`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        type: 'screenshot',
                        cityId: cityId
                      }),
                    });
                  } catch (error) {
                    console.error('Error tracking view:', error);
                  }
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={displayedThumbnails[mainGalleryIndex].originalPath!}
                    alt={displayedThumbnails[mainGalleryIndex].originalName!}
                    width={1200}
                    height={675}
                    className="w-full h-full object-contain transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl"
                    quality={100}
                    data-image-id={displayedThumbnails[mainGalleryIndex].id.toString()}
                    priority={true}
                    onLoad={() => setIsImageLoading(false)}
                    onError={() => setIsImageLoading(false)}
                  />
                  
                  {/* Loading overlay */}
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              </a>
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
            
            {/* Primary Badge */}
            {displayedThumbnails[mainGalleryIndex]?.isPrimary && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Primary
              </div>
            )}

            {/* Like and Comment Controls */}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              {displayedThumbnails[mainGalleryIndex] && (
                <ImageLikeButton
                  imageId={displayedThumbnails[mainGalleryIndex].id.toString()}
                  imageType="screenshot"
                  cityId={cityId}
                  size="md"
                />
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleComments();
                }}
                className="flex items-center space-x-1.5 px-3 py-2 min-h-[44px] rounded-lg transition-all duration-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50 bg-white/80 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:text-blue-400 cursor-pointer hover:shadow-md touch-manipulation select-none active:scale-95 sm:active:scale-100"
                title="View comments"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-semibold text-sm">Comments</span>
              </button>
            </div>

            {/* Swipe Indicator (only show on mobile) */}
            {displayedThumbnails.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs md:hidden">
                ← Swipe →
              </div>
            )}

            {/* Navigation Controls */}
            {displayedThumbnails.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={prevMainImage}
                  disabled={isLoading}
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 z-10 ${
                    isLoading 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-black bg-opacity-50 hover:bg-opacity-70 text-white hover:scale-110'
                  }`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  )}
                </button>

                {/* Next Button */}
                <button
                  onClick={nextMainImage}
                  disabled={isLoading}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 z-10 ${
                    isLoading 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-black bg-opacity-50 hover:bg-opacity-70 text-white hover:scale-110'
                  }`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-10">
                  {thumbnailStartIndex + mainGalleryIndex + 1} of {validImages.length}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Comments Section - Outside the main container */}
        {showComments && (
          <div 
            className={`mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto transform transition-all duration-200 ease-out ${
              isClosingComments 
                ? 'opacity-0 -translate-y-4 max-h-0 overflow-hidden' 
                : 'opacity-100 translate-y-0 max-h-[2000px]'
            }`}
          >
            {displayedThumbnails[mainGalleryIndex] && (
              <ImageComments
                imageId={displayedThumbnails[mainGalleryIndex].id.toString()}
                imageType="screenshot"
                cityId={cityId}
              />
            )}
          </div>
        )}
      </div>

      {/* Thumbnail Grid with Scroll Arrows */}
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={scrollThumbnailsLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={scrollThumbnailsRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}




          {/* Thumbnail Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 px-8">
            {displayedThumbnails.map((image, index) => (
              <div
                key={image.id}
                className={`relative aspect-square group overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  index === mainGalleryIndex 
                    ? 'border-blue-500 ring-2 ring-blue-200 cursor-default' 
                    : 'border-transparent hover:border-gray-300 cursor-pointer'
                }`}
              >
                {index !== mainGalleryIndex ? (
                  <a
                    href={image.originalPath!}
                    data-fancybox={`screenshots-${cityId}`}
                    data-caption={image.originalName!}
                    data-image-id={image.id.toString()}
                    data-liked={(imageLikeStates[image.id.toString()]?.liked || false).toString()}
                    data-like-count={(imageLikeStates[image.id.toString()]?.count || 0).toString()}
                    className="block w-full h-full absolute inset-0 z-10"
                    onClick={async (e) => {
                      e.preventDefault(); // Prevent default link behavior
                      e.stopPropagation(); // Prevent the div onClick from firing
                      // Track view when thumbnail is clicked to open fullscreen
                      try {
                        await fetch(`/api/images/${image.id}/view`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            type: 'screenshot',
                            cityId: cityId
                          }),
                        });
                      } catch (error) {
                        console.error('Error tracking view:', error);
                      }
                      // Find the corresponding hidden Fancybox link and click it
                      const hiddenLink = document.querySelector(`[data-fancybox="screenshots-${cityId}"][href="${image.originalPath}"]`) as HTMLElement;
                      if (hiddenLink) {
                        hiddenLink.click();
                      }
                    }}
                  >
                    <Image
                      src={image.mediumPath!}
                      alt={image.originalName!}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      quality={85}
                      data-image-id={image.id.toString()}
                    />
                  </a>
                ) : (
                  <Image
                    src={image.mediumPath!}
                    alt={image.originalName!}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    quality={85}
                    data-image-id={image.id.toString()}
                  />
                )}
                
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-1 left-1 bg-blue-500 text-white px-1 py-0.5 rounded-full text-xs font-medium">
                    Primary
                  </div>
                )}

                {/* Hover Overlay - Show for all thumbnails EXCEPT currently selected */}
                {index !== mainGalleryIndex && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Owner Controls */}
                {isOwner && (
                  <div className="absolute top-1 right-1 flex space-x-1 z-20">
                    {/* Set Primary Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(image.id);
                      }}
                      className={`w-6 h-6 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                        image.isPrimary 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                      }`}
                      title={image.isPrimary ? 'This is your featured image (will be shown on your city page and home page)' : 'Set as featured image (will be shown on your city page and home page)'}
                    >
                      <span className={image.isPrimary ? '' : 'transform translate-y-[-1px]'}>
                        {image.isPrimary ? '✓' : '★'}
                      </span>
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      className="w-6 h-6 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-200 flex items-center justify-center"
                      title="Delete this screenshot (cannot be undone)"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>


    </>
  );
} 