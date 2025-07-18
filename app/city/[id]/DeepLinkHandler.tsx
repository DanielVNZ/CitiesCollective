'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface DeepLinkHandlerProps {
  onImageNavigate?: (imageId: string, imageType: string) => void;
  onCommentExpand?: (commentId: number) => void;
}

export function DeepLinkHandler({ onImageNavigate, onCommentExpand }: DeepLinkHandlerProps) {
  const searchParams = useSearchParams();
  const hasHandledDeepLink = useRef(false);

  useEffect(() => {
    // Only handle deep link once
    if (hasHandledDeepLink.current) return;

    const imageId = searchParams.get('image');
    const imageType = searchParams.get('type');
    const commentId = searchParams.get('comment');

    if (imageId && imageType && onImageNavigate) {
      // Small delay to ensure components are mounted
      setTimeout(() => {
        onImageNavigate(imageId, imageType);
        
        // If there's also a comment ID, expand the comments after navigating to the image
        if (commentId && onCommentExpand) {
          setTimeout(() => {
            onCommentExpand(parseInt(commentId));
          }, 500); // Wait for image navigation to complete
        }
      }, 100);
      
      hasHandledDeepLink.current = true;
    } else if (commentId && onCommentExpand) {
      // If only comment ID is provided (for regular city comments)
      setTimeout(() => {
        onCommentExpand(parseInt(commentId));
      }, 100);
      
      hasHandledDeepLink.current = true;
    }
  }, [searchParams, onImageNavigate, onCommentExpand]);

  // This component doesn't render anything
  return null;
} 