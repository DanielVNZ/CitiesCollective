'use client';

import { useRef } from 'react';
import { DeepLinkHandler } from './DeepLinkHandler';

interface ClientWrapperProps {
  children: React.ReactNode;
  cityId: number;
}

export function ClientWrapper({ children, cityId }: ClientWrapperProps) {
  const imageGalleryRef = useRef<{ navigateToImage?: (imageId: string, imageType: string) => void }>(null);
  const commentsRef = useRef<{ expandComment?: (commentId: number) => void }>(null);

  const handleImageNavigate = (imageId: string, imageType: string) => {
    if (imageGalleryRef.current?.navigateToImage) {
      imageGalleryRef.current.navigateToImage(imageId, imageType);
    }
  };

  const handleCommentExpand = (commentId: number) => {
    if (commentsRef.current?.expandComment) {
      commentsRef.current.expandComment(commentId);
    }
  };

  return (
    <>
      <DeepLinkHandler 
        onImageNavigate={handleImageNavigate}
        onCommentExpand={handleCommentExpand}
      />
      <div ref={imageGalleryRef as any}>
        {children}
      </div>
    </>
  );
} 