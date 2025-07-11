'use client';

import { useState, useEffect, useCallback } from 'react';

interface FollowButtonProps {
  targetUserId: number;
  initialIsFollowing?: boolean;
  initialFollowerCount?: number;
  className?: string;
}

export function FollowButton({ 
  targetUserId, 
  initialIsFollowing = false, 
  initialFollowerCount = 0,
  className = ""
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);

  const fetchFollowStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/follow/${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      }
    } catch (error) {
      console.error('Failed to fetch follow status:', error);
    }
  }, [targetUserId]);

  // Fetch initial state if not provided
  useEffect(() => {
    if (initialIsFollowing === undefined) {
      fetchFollowStatus();
    }
  }, [fetchFollowStatus, initialIsFollowing]);

  const handleToggleFollow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/follow/${targetUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-md font-medium transition-colors ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </span>
      ) : (
        isFollowing ? 'Unfollow' : 'Follow'
      )}
    </button>
  );
} 