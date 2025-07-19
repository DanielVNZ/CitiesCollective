'use client';

import { useState, useRef, useEffect } from 'react';
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
  const mainImageRef = useRef<HTMLDivElement>(null);
  const hasHandledDeepLink = useRef(false);

  // Show 12 thumbnails at a time (more with smaller thumbnails)
  const thumbnailsPerPage = 12;
  const displayedThumbnails = images.slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailsPerPage);
  const hasMoreImages = images.length > thumbnailsPerPage;
  const canScrollLeft = thumbnailStartIndex > 0;
  const canScrollRight = thumbnailStartIndex + thumbnailsPerPage < images.length;

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
    // Use a unique identifier for this specific Hall of Fame gallery
    const galleryId = `hall-of-fame-${cityId}`;
    
    // Bind Fancybox to a specific container to avoid conflicts
    const galleryContainer = document.querySelector('.hall-of-fame-gallery-container') as HTMLElement;
    if (galleryContainer) {
      Fancybox.bind(galleryContainer, `[data-fancybox="${galleryId}"]`);
    }

    // Add custom like button to Fancybox toolbar for Hall of Fame images
    const addLikeButtonToFancybox = () => {
      const toolbar = document.querySelector('.fancybox__toolbar');
      if (toolbar && !toolbar.querySelector('.fancybox-like-btn-hof')) {
        const likeButton = document.createElement('button');
        likeButton.className = 'fancybox__toolbar__item fancybox__toolbar__btn fancybox-like-btn fancybox-like-btn-hof';
        likeButton.setAttribute('data-fancybox-like-hof', '');
        likeButton.innerHTML = `
          <svg class="fancybox__toolbar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        `;
        likeButton.title = 'Like this Hall of Fame image';
        
        // Insert before close button
        const closeButton = toolbar.querySelector('[data-fancybox-close]');
        if (closeButton) {
          toolbar.insertBefore(likeButton, closeButton);
        } else {
          toolbar.appendChild(likeButton);
        }
        
        // Add click handler
        likeButton.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Get current slide and image ID
          const currentSlide = document.querySelector('.fancybox__slide--current');
          const imageElement = currentSlide?.querySelector('img');
          const imageId = imageElement?.getAttribute('data-hof-image-id');
          
          if (imageId) {
            try {
              const response = await fetch(`/api/images/${imageId}/like?type=hall_of_fame&cityId=${cityId}`, {
                method: 'POST',
              });
              
              if (response.ok) {
                const data = await response.json();
                
                // Update button appearance
                const svg = likeButton.querySelector('svg') as SVGElement;
                if (svg) {
                  if (data.liked) {
                    svg.style.fill = 'currentColor';
                    (likeButton as HTMLElement).style.color = '#ef4444';
                  } else {
                    svg.style.fill = 'none';
                    (likeButton as HTMLElement).style.color = '';
                  }
                }
              }
            } catch (error) {
              console.error('Error toggling Hall of Fame image like:', error);
            }
          }
        });
      }
    };

    // Enhanced polling mechanism for Hall of Fame like button
    let pollingIntervalHof: NodeJS.Timeout | null = null;
    let isFancyboxOpenHof = false;
    
    const startPollingHof = () => {
      isFancyboxOpenHof = true;
      pollingIntervalHof = setInterval(() => {
        // Check if Fancybox is still open
        const fancyboxContainer = document.querySelector('.fancybox__container');
        const fancyboxBackdrop = document.querySelector('.fancybox__backdrop');
        
        if (!fancyboxContainer && !fancyboxBackdrop) {
          // Fancybox is closed, stop polling
          if (pollingIntervalHof) {
            clearInterval(pollingIntervalHof);
            pollingIntervalHof = null;
            isFancyboxOpenHof = false;
          }
          return;
        }
        
        // Try to add like button if it doesn't exist
        const existingButton = document.querySelector('.fancybox-like-btn-hof');
        if (!existingButton) {
          addLikeButtonToFancybox();
        }
      }, 200); // Check every 200ms
    };

    // Listen for Fancybox events for Hall of Fame images
    const handleFancyboxOpenHof = () => {
      setTimeout(startPollingHof, 100);
    };

    const handleFancyboxSlideChangeHof = () => {
      setTimeout(() => {
        const likeButton = document.querySelector('.fancybox-like-btn-hof');
        if (likeButton) {
          const currentSlide = document.querySelector('.fancybox__slide--current');
          const imageElement = currentSlide?.querySelector('img');
          const imageId = imageElement?.getAttribute('data-hof-image-id');
          
          if (imageId) {
            // Fetch current like status
            fetch(`/api/images/${imageId}/like?type=hall_of_fame`)
              .then(response => response.json())
              .then(data => {
                const svg = likeButton.querySelector('svg') as SVGElement;
                if (svg) {
                  if (data.isLiked) {
                    svg.style.fill = 'currentColor';
                    (likeButton as HTMLElement).style.color = '#ef4444';
                  } else {
                    svg.style.fill = 'none';
                    (likeButton as HTMLElement).style.color = '';
                  }
                }
              })
              .catch(error => {
                console.error('Error fetching Hall of Fame image like status:', error);
              });
          }
        }
      }, 100);
    };

    // Global click listener to detect Hall of Fame Fancybox opens
    const handleGlobalClickHof = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && target.closest(`[data-fancybox="hall-of-fame-${cityId}"]`)) {
        setTimeout(startPollingHof, 200); // Small delay to let Fancybox open
      }
    };

    document.addEventListener('fancybox:open', handleFancyboxOpenHof);
    document.addEventListener('fancybox:slidechange', handleFancyboxSlideChangeHof);
    document.addEventListener('click', handleGlobalClickHof);

    // Also try DOM events as backup
    const handleFancyboxReveal = (event: any) => {
      if (hofCreatorId && event.detail?.slide?.src) {
        trackHallOfFameImageView(event.detail.slide.src, hofCreatorId);
      }
    };

    const handleFancyboxDone = (event: any) => {
      if (hofCreatorId && event.detail?.slide?.src) {
        trackHallOfFameImageView(event.detail.slide.src, hofCreatorId);
      }
    };

    const handleFancyboxSlideChange = (event: any) => {
      if (hofCreatorId && event.detail?.slide?.src) {
        trackHallOfFameImageView(event.detail.slide.src, hofCreatorId);
      }
    };

    const handleFancyboxSelect = (event: any) => {
      if (hofCreatorId && event.detail?.slide?.src) {
        trackHallOfFameImageView(event.detail.slide.src, hofCreatorId);
      }
    };

    // Add multiple event listeners to catch the right one for Fancybox v6
    document.addEventListener('fancybox:reveal', handleFancyboxReveal);
    document.addEventListener('fancybox:done', handleFancyboxDone);
    document.addEventListener('fancybox:slidechange', handleFancyboxSlideChange);
    document.addEventListener('fancybox:select', handleFancyboxSelect);
    
    // Try Fancybox v6 specific events
    document.addEventListener('fancybox:change', (event: any) => {
      if (hofCreatorId && event.detail?.slide?.src) {
        trackHallOfFameImageView(event.detail.slide.src, hofCreatorId);
      }
    });

    // Fallback: Use MutationObserver to detect Fancybox content changes
    let mutationObserver: MutationObserver | null = null;
    let lastTrackedImageUrl = '';
    
    const startMutationObserver = () => {
      // Look for Fancybox container
      const fancyboxContainer = document.querySelector('.fancybox__container');
      if (fancyboxContainer && hofCreatorId) {
        mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
              // Look for the current image in Fancybox
              const currentImage = document.querySelector('.fancybox__content img') as HTMLImageElement;
              if (currentImage && currentImage.src && currentImage.src !== lastTrackedImageUrl) {
                lastTrackedImageUrl = currentImage.src;
                trackHallOfFameImageView(currentImage.src, hofCreatorId);
              }
            }
          });
        });
        
        mutationObserver.observe(fancyboxContainer, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['src']
        });
      }
    };

    // Start observing when Fancybox opens
    const handleFancyboxOpen = () => {
      setTimeout(startMutationObserver, 100); // Small delay to ensure Fancybox is fully rendered
    };

    document.addEventListener('fancybox:open', handleFancyboxOpen);

    // Enhanced polling mechanism as a fallback
    let pollingInterval: NodeJS.Timeout | null = null;
    let lastPolledImageUrl = '';
    let isFancyboxOpen = false;
    
    const startPolling = () => {
      isFancyboxOpen = true;
      pollingInterval = setInterval(() => {
        // Check if Fancybox is still open
        const fancyboxContainer = document.querySelector('.fancybox__container');
        const fancyboxBackdrop = document.querySelector('.fancybox__backdrop');
        
        if (!fancyboxContainer && !fancyboxBackdrop) {
          // Fancybox is closed, stop polling
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
            lastPolledImageUrl = '';
            isFancyboxOpen = false;
          }
          return;
        }
        
        if (hofCreatorId) {
          // Try multiple selectors for the current image
          const currentImage = document.querySelector('.fancybox__content img, .fancybox__slide img, .fancybox__container img') as HTMLImageElement;
          if (currentImage && currentImage.src && currentImage.src !== lastPolledImageUrl) {
            lastPolledImageUrl = currentImage.src;
            trackHallOfFameImageView(currentImage.src, hofCreatorId);
          }
        }
      }, 200); // Check every 200ms for more responsive tracking
    };

    // Start polling when Fancybox opens
    const handleFancyboxOpenPolling = () => {
      setTimeout(startPolling, 100);
    };

    document.addEventListener('fancybox:open', handleFancyboxOpenPolling);
    
    // Also start polling immediately in case Fancybox events don't fire
    setTimeout(() => {
      const fancyboxContainer = document.querySelector('.fancybox__container');
      const fancyboxBackdrop = document.querySelector('.fancybox__backdrop');
      if (fancyboxContainer || fancyboxBackdrop) {
        startPolling();
      }
    }, 1000); // Check after 1 second
    
    // Global click listener to detect Fancybox opens
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && target.closest(`[data-fancybox="hall-of-fame-${cityId}"]`)) {
        setTimeout(startPolling, 200); // Small delay to let Fancybox open
      }
    };
    
    document.addEventListener('click', handleGlobalClick);

    return () => {
      Fancybox.destroy();
      document.removeEventListener('fancybox:reveal', handleFancyboxReveal);
      document.removeEventListener('fancybox:done', handleFancyboxDone);
      document.removeEventListener('fancybox:slidechange', handleFancyboxSlideChange);
      document.removeEventListener('fancybox:select', handleFancyboxSelect);
      document.removeEventListener('fancybox:open', handleFancyboxOpen);
      document.removeEventListener('fancybox:open', handleFancyboxOpenPolling);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('fancybox:open', handleFancyboxOpenHof);
      document.removeEventListener('fancybox:slidechange', handleFancyboxSlideChangeHof);
      document.removeEventListener('click', handleGlobalClickHof);
      
      if (pollingIntervalHof) {
        clearInterval(pollingIntervalHof);
        pollingIntervalHof = null;
      }
      
      // Remove Fancybox v6 specific events
      document.removeEventListener('fancybox:ready', () => {});
      document.removeEventListener('fancybox:show', () => {});
      document.removeEventListener('fancybox:shown', () => {});
      document.removeEventListener('fancybox:change', () => {});
      
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };
  }, [images, hofCreatorId]);

  // Track view when main image is displayed (larger format)
  useEffect(() => {
    if (hofCreatorId && displayedThumbnails[mainGalleryIndex]?.imageUrlFHD) {
      // Only track if this is a different image than the last one tracked
      const currentImageUrl = displayedThumbnails[mainGalleryIndex].imageUrlFHD;
      trackHallOfFameImageView(currentImageUrl, hofCreatorId);
    }
  }, [mainGalleryIndex, hofCreatorId]);

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No Hall of Fame images available for this city.
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery View */}
      <div className="mb-6">
                <div className="hall-of-fame-gallery-container relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
          {/* Hidden Fancybox Gallery - All Images except current main image (for Fancybox to discover) */}
          <div className="hidden">
            {images.map((image) => {
              const currentMainImage = displayedThumbnails[mainGalleryIndex];
              // Skip the currently displayed main image to avoid duplication
              if (currentMainImage && image.hofImageId === currentMainImage.hofImageId) {
                return null;
              }
              return (
                <a
                  key={`fancybox-hidden-hof-${image.id}`}
                  href={image.imageUrl4K}
                  data-fancybox={`hall-of-fame-${cityId}`}
                  data-caption={`${image.cityName} - Hall of Fame Image`}
                >
                  <img 
                    src={image.imageUrlThumbnail} 
                    alt={`${image.cityName} - Hall of Fame Image`} 
                    data-hof-image-id={image.hofImageId}
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
              onClick={() => {
                // Track view when main image is clicked to open fullscreen
                if (hofCreatorId && displayedThumbnails[mainGalleryIndex].imageUrl4K) {
                  trackHallOfFameImageView(displayedThumbnails[mainGalleryIndex].imageUrl4K, hofCreatorId);
                }
              }}
            >
              <img
                src={displayedThumbnails[mainGalleryIndex].imageUrlFHD}
                alt={`${displayedThumbnails[mainGalleryIndex].cityName} - Hall of Fame Image`}
                className="w-full h-full object-contain transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl"
                data-hof-image-id={displayedThumbnails[mainGalleryIndex].hofImageId}
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
                    className="block w-full h-full absolute inset-0 z-10"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent default link behavior
                      e.stopPropagation(); // Prevent the div onClick from firing
                      // Track view when thumbnail is clicked to open fullscreen
                      if (hofCreatorId && image.imageUrl4K) {
                        trackHallOfFameImageView(image.imageUrl4K, hofCreatorId);
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