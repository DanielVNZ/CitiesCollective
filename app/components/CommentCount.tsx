'use client';

import { useState, useEffect } from 'react';

interface CommentCountProps {
  cityId: number;
  initialCount?: number;
}

export function CommentCount({ cityId, initialCount = 0 }: CommentCountProps) {
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch current comment count
    const fetchCommentCount = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/cities/${cityId}/comment-count`);
        if (response.ok) {
          const data = await response.json();
          setCount(data.commentCount);
        }
      } catch (error) {
        console.error('Error fetching comment count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommentCount();
  }, [cityId]);

  // Function to refresh comment count (can be called from parent components)
  const refreshCount = async () => {
    try {
      const response = await fetch(`/api/cities/${cityId}/comment-count`);
      if (response.ok) {
        const data = await response.json();
        setCount(data.commentCount);
      }
    } catch (error) {
      console.error('Error refreshing comment count:', error);
    }
  };

  // Expose refresh function to parent components via ref
  useEffect(() => {
    // Store refresh function on window for global access
    if (typeof window !== 'undefined') {
      if (!window.commentCountRefreshers) {
        window.commentCountRefreshers = new Map();
      }
      window.commentCountRefreshers.set(cityId, refreshCount);
    }

    return () => {
      if (typeof window !== 'undefined' && window.commentCountRefreshers) {
        window.commentCountRefreshers.delete(cityId);
      }
    };
  }, [cityId, refreshCount]);

  return (
    <span className={loading ? 'opacity-50' : ''}>
      {count} {count === 1 ? 'comment' : 'comments'}
    </span>
  );
}

// Utility function to refresh comment count for a specific city
export function refreshCommentCount(cityId: number) {
  if (typeof window !== 'undefined' && window.commentCountRefreshers) {
    const refresher = window.commentCountRefreshers.get(cityId);
    if (refresher) {
      refresher();
    }
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    commentCountRefreshers?: Map<number, () => void>;
  }
} 