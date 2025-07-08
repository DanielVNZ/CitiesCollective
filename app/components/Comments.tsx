'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  username: string | null;
  userEmail: string | null;
}

interface CommentsProps {
  cityId: number;
}

export function Comments({ cityId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [moderationMessage, setModerationMessage] = useState<string | null>(null);
  const [moderationInfo, setModerationInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchComments();
  }, [cityId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cities/${cityId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    setModerationMessage(null);
    setModerationInfo(null);
    
    try {
      const response = await fetch(`/api/cities/${cityId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // Check if comment was filtered
        if (data.moderationInfo) {
          setModerationMessage(data.moderationInfo.message);
          setModerationInfo(data.moderationInfo);
        }
        
        setNewComment('');
        fetchComments(); // Refresh comments
        
        // Clear moderation message after 5 seconds
        if (data.moderationInfo) {
          setTimeout(() => {
            setModerationMessage(null);
            setModerationInfo(null);
          }, 5000);
        }
      } else {
        // Handle moderation rejection
        if (data.error) {
          setModerationMessage(data.error);
          if (data.moderationDetails) {
            setModerationInfo(data.moderationDetails);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setModerationMessage('An error occurred while posting your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserDisplayName = (comment: Comment) => {
    return comment.username || comment.userEmail || 'Anonymous User';
  };

  const getUserInitial = (comment: Comment) => {
    const name = getUserDisplayName(comment);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Comments ({comments.length})</h3>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add a comment
          </label>
          <textarea
            id="comment"
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts about this city..."
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
            {newComment.length}/1000 characters
          </div>
        </div>
        
        {/* Moderation Message */}
        {moderationMessage && (
          <div className={`p-3 rounded-md border ${
            moderationInfo?.wasFiltered 
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className={`text-sm ${
              moderationInfo?.wasFiltered 
                ? 'text-yellow-800 dark:text-yellow-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {moderationMessage}
            </div>
            {moderationInfo?.reasons && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Reason: {moderationInfo.reasons.join(', ')}
              </div>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading comments...</div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</div>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {getUserInitial(comment)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getUserDisplayName(comment)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      title="Delete comment"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 