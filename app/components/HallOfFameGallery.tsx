'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Fancybox } from '@fancyapps/ui';
import { ImageLikeButton } from './ImageLikeButton';
import { ImageComments } from './ImageComments';
import { trackHallOfFameImageView } from '../utils/hallOfFameViewTracking';

interface HallOfFameImage {
  id: number;
  cityId: number;
  hofImageId: string;
  cityName: string;
  cityPopulation: number | null;
  cityMilestone: number | null;
  imageUrlThumbnail: string;
  imageUrlFHD: string;
  imageUrl4K: string;
  isPrimary: boolean;
  createdAt: string;
  lastUpdated: string;
}

interface HallOfFameGalleryProps {
  images: HallOfFameImage[];
  cityId: number;
  isOwner: boolean;
  isFeaturedOnHomePage?: boolean;
  hofCreatorId?: string | null;
  deepLinkImageId?: string | null;
  deepLinkImageType?: string | null;
  deepLinkCommentId?: string | null;
}

export function HallOfFameGallery({ images, cityId, isOwner, isFeaturedOnHomePage = false, hofCreatorId, deepLinkImageId, deepLinkImageType, deepLinkCommentId }: HallOfFameGalleryProps) {
  const [mainGalleryIndex, setMainGalleryIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isClosingComments, setIsClosingComments] = useState(false);
  const [imageLikeStates, setImageLikeStates] = useState<Record<string, { liked: boolean; count: number }>>({});
  const mainImageRef = useRef<HTMLDivElement>(null);
  const hasHandledDeepLink = useRef(false);

  // Fetch like states for all images
  useEffect(() => {
    const fetchLikeStates = async () => {
      const likeStates: Record<string, { liked: boolean; count: number }> = {};
      
      for (const image of images) {
        try {
          const response = await fetch(`/api/images/${image.hofImageId}/like?type=hall_of_fame`);
          if (response.ok) {
            const data = await response.json();
            likeStates[image.hofImageId] = {
              liked: data.isLiked,
              count: data.likeCount
            };
          }
        } catch (error) {
          console.error(`Error fetching like state for Hall of Fame image ${image.hofImageId}:`, error);
          likeStates[image.hofImageId] = { liked: false, count: 0 };
        }
      }
      
      setImageLikeStates(likeStates);
    };

    if (images.length > 0) {
      fetchLikeStates();
    }
  }, [images]); // Re-run if images changes

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
              const fancyboxLinks = document.querySelectorAll(`[data-fancybox="hall-of-fame-${cityId}"]`);
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
      const response = await fetch(`/api/images/${imageId}/like?type=hall_of_fame&cityId=${cityId}`, {
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
      console.error('Error toggling Hall of Fame image like:', error);
    }
  }, [cityId]);

  // Show 12 thumbnails at a time (more with smaller thumbnails)
  const thumbnailsPerPage = 12;
  const displayedThumbnails = images.slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailsPerPage);
  const hasMoreImages = images.length > thumbnailsPerPage;
  const canScrollLeft = thumbnailStartIndex > 0;
  const canScrollRight = thumbnailStartIndex + thumbnailsPerPage < images.length;

  // Reset thumbnail state when images change (due to sorting)
  useEffect(() => {
    setThumbnailStartIndex(0);
    setMainGalleryIndex(0);
  }, [images]);

  const nextMainImage = () => {
    const currentGlobalIndex = thumbnailStartIndex + mainGalleryIndex;
    if (currentGlobalIndex < images.length - 1) {
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
  };

  const prevMainImage = () => {
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
      const lastPageStart = Math.max(0, images.length - thumbnailsPerPage);
      setThumbnailStartIndex(lastPageStart);
      setMainGalleryIndex(images.length - lastPageStart - 1);
    }
  };

  const scrollThumbnailsLeft = () => {
    if (canScrollLeft) {
      setThumbnailStartIndex(Math.max(0, thumbnailStartIndex - thumbnailsPerPage));
      setMainGalleryIndex(0); // Reset to first image in new set
    }
  };

  const scrollThumbnailsRight = () => {
    if (canScrollRight) {
      setThumbnailStartIndex(Math.min(images.length - thumbnailsPerPage, thumbnailStartIndex + thumbnailsPerPage));
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
    if (!touchStart || !touchEnd) return;
    
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

  const handleSetPrimary = async (hofImageId: string) => {
    try {
      const response = await fetch(`/api/hall-of-fame/${hofImageId}/primary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityId: cityId
        }),
      });

      if (response.ok) {
        // Refresh the page to show updated primary status
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set primary image');
      }
    } catch (error) {
      console.error('Error setting primary Hall of Fame image:', error);
      alert('Failed to set primary image. Please try again.');
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

  // Handle deep link navigation from props
  useEffect(() => {
    if (hasHandledDeepLink.current) return;

    if (deepLinkImageId && deepLinkImageType && deepLinkImageType === 'hall_of_fame') {
      // Find the image by hofImageId
      const targetImageIndex = images.findIndex(img => img.hofImageId === deepLinkImageId);
      
      if (targetImageIndex !== -1) {
        // Calculate which page this image is on
        const targetPage = Math.floor(targetImageIndex / thumbnailsPerPage);
        const targetIndexInPage = targetImageIndex % thumbnailsPerPage;
        
        // Navigate to the correct page and image
        setThumbnailStartIndex(targetPage * thumbnailsPerPage);
        setMainGalleryIndex(targetIndexInPage);
      }
      
      // Small delay to ensure component is mounted
      setTimeout(() => {
        setShowComments(true);
        
        // If there's also a comment ID, we'll handle it in the ImageComments component
        if (deepLinkCommentId) {
          // The ImageComments component will handle scrolling to the specific comment
        }
      }, 100);
      
      hasHandledDeepLink.current = true;
    }
  }, [deepLinkImageId, deepLinkImageType, deepLinkCommentId, images]);

  // Initialize Fancybox
  useEffect(() => {
    // Check if Fancybox is available (client-side only)
    if (typeof window === 'undefined' || !Fancybox) {
      return;
    }
    
    // Use a unique identifier for this specific Hall of Fame gallery
    const galleryId = `hall-of-fame-${cityId}`;
    
    // Destroy any existing Fancybox instances for this gallery
    Fancybox.close();
    
    // Simple function to update like button based on current image
    const updateLikeButtonForCurrentImage = () => {
      const likeButton = document.querySelector('.f-button--like');
      if (!likeButton) {
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
                    const response = await fetch(`/api/images/${imageId}/like?type=hall_of_fame`);
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
                    console.error('Error fetching fresh Hall of Fame like state:', error);
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
          }, 50);
        }
      }
    }, 200); // Check every 200ms
    
    // Bind only to Hall of Fame gallery with specific container
    const galleryContainer = document.getElementById(`hall-of-fame-gallery-${cityId}`);
    if (galleryContainer) {
      Fancybox.bind(galleryContainer, `[data-fancybox="${galleryId}"]`, {
        on: {
          init: (fancybox: any) => {
            // Initial setup for first slide
            updateLikeButtonForCurrentImage();
            
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
                likeButton.title = 'Like this Hall of Fame image';
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
                updateLikeButtonForCurrentImage();

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

  // Track view when main image is displayed (larger format)
  useEffect(() => {
    if (hofCreatorId && displayedThumbnails[mainGalleryIndex]?.imageUrlFHD) {
      // Only track if this is a different image than the last one tracked
      const currentImageUrl = displayedThumbnails[mainGalleryIndex].imageUrlFHD;
      trackHallOfFameImageView(currentImageUrl, hofCreatorId);
    }
  }, [mainGalleryIndex, hofCreatorId, displayedThumbnails]);

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No Hall of Fame images available for this city.
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
        <div id={`hall-of-fame-gallery-${cityId}`} className="hall-of-fame-gallery-container relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
          {/* Hidden Fancybox Gallery - All Images except current main image (for Fancybox to discover) */}
          <div className="hidden">
            {images.map((image) => {
              const currentMainImage = displayedThumbnails[mainGalleryIndex];
              // Skip the currently displayed main image to avoid duplication
              if (currentMainImage && image.hofImageId === currentMainImage.hofImageId) {
                return null;
              }
              const likeState = imageLikeStates[image.hofImageId] || { liked: false, count: 0 };
              return (
                <a
                  key={`fancybox-hidden-hof-${image.id}`}
                  href={image.imageUrl4K}
                  data-fancybox={`hall-of-fame-${cityId}`}
                  data-caption={`${image.cityName} - Hall of Fame Image`}
                  data-image-id={image.hofImageId}
                  data-liked={likeState.liked.toString()}
                  data-like-count={likeState.count.toString()}
                >
                  <img 
                    src={image.imageUrlThumbnail} 
                    alt={`${image.cityName} - Hall of Fame Image`} 
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
            <a
              href={displayedThumbnails[mainGalleryIndex].imageUrl4K}
              data-fancybox={`hall-of-fame-${cityId}`}
              data-caption={`${displayedThumbnails[mainGalleryIndex].cityName} - Hall of Fame Image`}
              data-image-id={displayedThumbnails[mainGalleryIndex].hofImageId}
              data-liked={(imageLikeStates[displayedThumbnails[mainGalleryIndex].hofImageId]?.liked || false).toString()}
              data-like-count={(imageLikeStates[displayedThumbnails[mainGalleryIndex].hofImageId]?.count || 0).toString()}
              onClick={async () => {
                // Track view when main image is clicked to open fullscreen
                if (hofCreatorId && displayedThumbnails[mainGalleryIndex].imageUrl4K) {
                  trackHallOfFameImageView(displayedThumbnails[mainGalleryIndex].imageUrl4K, hofCreatorId);
                }
                // Track view in our new API
                try {
                  await fetch(`/api/images/${displayedThumbnails[mainGalleryIndex].hofImageId}/view`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      type: 'hall_of_fame',
                      cityId: cityId
                    }),
                  });
                } catch (error) {
                  console.error('Error tracking view:', error);
                }
              }}
            >
                              <img
                  src={displayedThumbnails[mainGalleryIndex].imageUrlFHD}
                  alt={`${displayedThumbnails[mainGalleryIndex].cityName} - Hall of Fame Image`}
                  className="w-full h-full object-contain transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl"
                  data-image-id={displayedThumbnails[mainGalleryIndex].hofImageId}
                />
            </a>
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
            
            {/* Primary Badge */}
            {displayedThumbnails[mainGalleryIndex].isPrimary && (
              <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Primary
              </div>
            )}

            {/* Hall of Fame Icon */}
            <div className="absolute top-4 right-4">
              <div className="bg-yellow-400 rounded-full p-1 shadow-lg">
                <img
                  src="/logo/hof-icon.svg"
                  alt="Hall of Fame"
                  className="w-5 h-5"
                />
              </div>
            </div>

            {/* Like and Comment Controls */}
            <div className="absolute bottom-2 right-4 flex space-x-2">
              <ImageLikeButton
                imageId={displayedThumbnails[mainGalleryIndex].hofImageId}
                imageType="hall_of_fame"
                cityId={cityId}
                size="md"
              />
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
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Next Button */}
                <button
                  onClick={nextMainImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-10">
                  {thumbnailStartIndex + mainGalleryIndex + 1} of {images.length}
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
            <ImageComments
              imageId={displayedThumbnails[mainGalleryIndex].hofImageId}
              imageType="hall_of_fame"
              cityId={cityId}
            />
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
                    ? 'border-yellow-500 ring-2 ring-yellow-200 cursor-default' 
                    : 'border-transparent hover:border-gray-300 cursor-pointer'
                }`}
              >
                {index !== mainGalleryIndex ? (
                  <a
                    href={image.imageUrl4K}
                    data-fancybox={`hall-of-fame-${cityId}`}
                    data-caption={`${image.cityName} - Hall of Fame Image`}
                    data-image-id={image.hofImageId}
                    data-liked={(imageLikeStates[image.hofImageId]?.liked || false).toString()}
                    data-like-count={(imageLikeStates[image.hofImageId]?.count || 0).toString()}
                    className="block w-full h-full absolute inset-0 z-10"
                    onClick={async (e) => {
                      e.preventDefault(); // Prevent default link behavior
                      e.stopPropagation(); // Prevent the div onClick from firing
                      // Track view when thumbnail is clicked to open fullscreen
                      if (hofCreatorId && image.imageUrl4K) {
                        trackHallOfFameImageView(image.imageUrl4K, hofCreatorId);
                      }
                      // Track view in our new API
                      try {
                        await fetch(`/api/images/${image.hofImageId}/view`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            type: 'hall_of_fame',
                            cityId: cityId
                          }),
                        });
                      } catch (error) {
                        console.error('Error tracking view:', error);
                      }
                      // Find the index of this image in the full images array
                      const imageIndex = images.findIndex(img => img.hofImageId === image.hofImageId);
                      if (imageIndex !== -1) {
                        // Find the corresponding hidden Fancybox link and click it
                        const hiddenLink = document.querySelector(`[data-fancybox="hall-of-fame-${cityId}"][href="${image.imageUrl4K}"]`) as HTMLElement;
                        if (hiddenLink) {
                          hiddenLink.click();
                        }
                      }
                    }}
                  >
                    <img
                      src={image.imageUrlThumbnail}
                      alt={`${image.cityName} - Hall of Fame Image`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      data-hof-image-id={image.hofImageId}
                    />
                  </a>
                ) : (
                  <img
                    src={image.imageUrlThumbnail}
                    alt={`${image.cityName} - Hall of Fame Image`}
                    className="w-full h-full object-cover"
                    data-hof-image-id={image.hofImageId}
                  />
                )}
                
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-1 left-1 bg-yellow-500 text-white px-1 py-0.5 rounded-full text-xs font-medium">
                    Primary
                  </div>
                )}

                {/* Hall of Fame Icon */}
                <div className="absolute top-1 right-1">
                  <div className="bg-yellow-400 rounded-full p-0.5 shadow-lg">
                    <img
                      src="/logo/hof-icon.svg"
                      alt="Hall of Fame"
                      className="w-3 h-3"
                    />
                  </div>
                </div>

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

                {/* Primary Button - Always visible to show current primary status */}
                <div className="absolute bottom-1 right-1 flex space-x-1 z-20">
                  {/* Set Primary Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isOwner) {
                        handleSetPrimary(image.hofImageId);
                      }
                    }}
                    className={`w-6 h-6 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                      image.isPrimary 
                        ? 'bg-yellow-500 text-white' 
                        : isOwner 
                          ? 'bg-black bg-opacity-50 text-white hover:bg-opacity-70' 
                          : 'bg-black bg-opacity-30 text-white'
                    }`}
                    title={image.isPrimary ? 'This is the featured Hall of Fame image' : isOwner ? 'Set as featured Hall of Fame image' : 'Featured Hall of Fame image'}
                  >
                    <span className={image.isPrimary ? '' : 'transform translate-y-[-1px]'}>
                      {image.isPrimary ? '✓' : '★'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 