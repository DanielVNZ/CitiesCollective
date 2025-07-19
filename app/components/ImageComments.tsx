'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getUsernameTextColor, getUsernameAvatarColor } from '../utils/userColors';
import { UserTagAutocomplete } from './UserTagAutocomplete';

interface ImageComment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  likeCount: number;
  isLikedByUser: boolean;
}

interface ImageCommentsProps {
  imageId: string;
  imageType: 'screenshot' | 'hall_of_fame';
  cityId: number;
  initialComments?: ImageComment[];
}

export function ImageComments({ imageId, imageType, cityId, initialComments = [] }: ImageCommentsProps) {
  const [comments, setComments] = useState<ImageComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'likes'>('recent');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showTagAutocomplete, setShowTagAutocomplete] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [tagCursorPosition, setTagCursorPosition] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const hasHandledDeepLink = useRef(false);

  const commentsPerPage = 6;
  const totalPages = Math.ceil(comments.length / commentsPerPage);
  const startIndex = currentPage * commentsPerPage;
  const endIndex = startIndex + commentsPerPage;
  const displayedComments = comments.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/images/${imageId}/comments?type=${imageType}&sortBy=${sortBy}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments);
        }
      } catch (error) {
        console.error('Error fetching image comments:', error);
      }
    };

    fetchComments();
  }, [imageId, imageType, sortBy]);

  // Reset to first page when comments change
  useEffect(() => {
    setCurrentPage(0);
  }, [comments.length]);

  // Animation effect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50); // Small delay to ensure smooth animation

    return () => clearTimeout(timer);
  }, []);

  // Handle deep link to specific comment
  useEffect(() => {
    if (hasHandledDeepLink.current) return;

    const commentId = searchParams.get('comment');
    if (commentId) {
      const targetCommentId = parseInt(commentId);
      
      // Find the comment and navigate to the correct page
      const commentIndex = comments.findIndex(comment => comment.id === targetCommentId);
      if (commentIndex !== -1) {
        const targetPage = Math.floor(commentIndex / commentsPerPage);
        setCurrentPage(targetPage);
        
        // Scroll to the comment after a short delay
        setTimeout(() => {
          const commentElement = document.getElementById(`comment-${targetCommentId}`);
          if (commentElement) {
            commentElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            // Add a highlight effect
            commentElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
            setTimeout(() => {
              commentElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
            }, 3000);
          }
        }, 500);
        
        hasHandledDeepLink.current = true;
      }
    }
  }, [comments, searchParams]);



  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || loading) return;
    
    setLoading(true);
    
    // Extract tagged users from comment
    const taggedUsers = newComment.match(/@(\w+)/g)?.map(tag => tag.slice(1)) || [];
    
    try {
      const response = await fetch(`/api/images/${imageId}/comments?type=${imageType}&cityId=${cityId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: newComment.trim(),
          taggedUsers: taggedUsers
        }),
      });
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        setShowCommentForm(false);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const response = await fetch(`/api/image-comments/${commentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      const response = await fetch(`/api/image-comments/${commentId}/like`, {
        method: 'POST',
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        // Update the comment in the local state
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentId
              ? {
                  ...comment,
                  isLikedByUser: data.liked,
                  likeCount: data.liked ? comment.likeCount + 1 : comment.likeCount - 1
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    
    const cursorPos = e.target.selectionStart;
    setTagCursorPosition(cursorPos);
    
    // Check if we're typing a tag (@username)
    const beforeCursor = value.substring(0, cursorPos);
    const tagMatch = beforeCursor.match(/@(\w*)$/);
    
    if (tagMatch) {
      setTagQuery(tagMatch[1]);
      setShowTagAutocomplete(true);
    } else {
      setShowTagAutocomplete(false);
    }
  };

  const handleSelectUser = (user: { id: number; username: string; email: string }) => {
    const beforeTag = newComment.substring(0, tagCursorPosition - tagQuery.length - 1); // -1 for @
    const afterTag = newComment.substring(tagCursorPosition);
    const newValue = beforeTag + `@${user.username} ` + afterTag;
    
    setNewComment(newValue);
    setShowTagAutocomplete(false);
    setTagQuery('');
    
    // Focus back to textarea and set cursor position
    if (commentInputRef.current) {
      commentInputRef.current.focus();
      const newCursorPos = beforeTag.length + user.username.length + 2; // +2 for @ and space
      commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }
  };

  const handleCloseTagAutocomplete = () => {
    setShowTagAutocomplete(false);
    setTagQuery('');
  };

  const handleReply = (username: string) => {
    setShowCommentForm(true);
    setNewComment(`@${username} `);
    // Focus the textarea and position cursor after the username
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        const cursorPosition = `@${username} `.length;
        commentInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Cache for user ID lookups
  const [userIdCache, setUserIdCache] = useState<Record<string, number>>({});

  // Component for tagged username links
  const TaggedUsername = ({ username }: { username: string }) => {
    const [userId, setUserId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const usernameTextColor = getUsernameTextColor(username);

    useEffect(() => {
      const fetchUserId = async () => {
        // Check cache first
        if (userIdCache[username]) {
          setUserId(userIdCache[username]);
          return;
        }

        setIsLoading(true);
        try {
          const response = await fetch(`/api/search/user-by-username?username=${encodeURIComponent(username)}`);
          if (response.ok) {
            const data = await response.json();
            setUserId(data.userId);
            // Cache the result
            setUserIdCache(prev => ({ ...prev, [username]: data.userId }));
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserId();
    }, [username]);

    if (isLoading) {
      return <span className={`${usernameTextColor} font-medium`}>@{username}</span>;
    }

    if (userId) {
      return (
        <Link 
          href={`/user/${userId}`}
          className={`${usernameTextColor} font-medium hover:underline`}
        >
          @{username}
        </Link>
      );
    }

    // Fallback if user not found
    return <span className={`${usernameTextColor} font-medium`}>@{username}</span>;
  };

  return (
    <div 
      ref={commentsRef}
      className={`transform transition-all duration-300 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comments ({comments.length})
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'likes')}
              className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1"
            >
              <option value="recent">Recent</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>

        {/* Comment Form */}
        {!showCommentForm ? (
          <button
            onClick={() => setShowCommentForm(true)}
            className="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            Add a comment...
          </button>
        ) : (
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <div className="relative">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={handleCommentChange}
                placeholder="Write your comment... Use @ to tag users"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                rows={3}
                maxLength={1000}
              />
              
              {/* User Tag Autocomplete */}
              {showTagAutocomplete && (
                <UserTagAutocomplete
                  query={tagQuery}
                  onSelectUser={handleSelectUser}
                  onClose={handleCloseTagAutocomplete}
                />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {newComment.length}/1000
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCommentForm(false);
                    setNewComment('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {displayedComments.map((comment, index) => {
            const username = comment.user?.username || 'Anonymous';
            const userId = comment.user?.id || 0;
            const usernameTextColor = getUsernameTextColor(username);
            const usernameAvatarColor = getUsernameAvatarColor(username);
            
            return (
              <div 
                key={comment.id} 
                id={`comment-${comment.id}`}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 transform transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.3s ease-out forwards'
                }}
              >
                <div className="flex items-start space-x-3">
                  <Link href={`/user/${userId}`} className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${usernameAvatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                      {username.charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link 
                        href={`/user/${userId}`}
                        className={`text-sm font-medium ${usernameTextColor} hover:underline`}
                      >
                        {username}
                      </Link>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-900 dark:text-white text-sm mb-2 whitespace-pre-wrap">
                      {comment.content.split(/(@\w+)/).map((part, index) => {
                        if (part.startsWith('@')) {
                          const username = part.slice(1); // Remove the @ symbol
                          return <TaggedUsername key={index} username={username} />;
                        }
                        return part;
                      })}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <button 
                        onClick={() => handleLikeComment(comment.id)}
                        className={`flex items-center space-x-1 transition-colors ${
                          comment.isLikedByUser 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'hover:text-red-600 dark:hover:text-red-400'
                        }`}
                      >
                        <svg className={`w-4 h-4 ${comment.isLikedByUser ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{Number(comment.likeCount)}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleReply(username)}
                        className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        Reply
                      </button>
                      
                      {/* Delete button for comment owner - we'll need to add user context later */}
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, comments.length)} of {comments.length} comments
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
} 