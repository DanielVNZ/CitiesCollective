'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: number;
  content: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId: number | null;
  username: string | null;
  userEmail: string | null;
  cityId: number | null;
  cityName: string | null;
}

interface CommentModerationProps {
  comments: Comment[];
}

export function CommentModeration({ comments }: CommentModerationProps) {
  const [filteredComments, setFilteredComments] = useState<Comment[]>(comments);
  const [filter, setFilter] = useState<'all' | 'recent' | 'flagged'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let filtered = comments;

    // Apply filter
    if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(comment => 
        comment.createdAt && new Date(comment.createdAt) > oneWeekAgo
      );
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(comment =>
        (comment.content && comment.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (comment.username && comment.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (comment.userEmail && comment.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (comment.cityName && comment.cityName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredComments(filtered);
  }, [comments, filter, searchTerm]);

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setFilteredComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error deleting comment');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown date';
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    const displayHours = (d.getHours() % 12 || 12).toString().padStart(2, '0');
    return `${month}/${day}/${year} at ${displayHours}:${minutes} ${ampm}`;
  };

  const getUserDisplayName = (comment: Comment) => {
    return comment.username || comment.userEmail || 'Anonymous User';
  };

  const getUserInitial = (comment: Comment) => {
    const name = getUserDisplayName(comment);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Comment Moderation ({filteredComments.length} comments)
      </h2>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Comments
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'recent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Recent (7 days)
          </button>
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search comments, users, or cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No comments match your search.' : 'No comments found.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredComments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {getUserInitial(comment)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getUserDisplayName(comment)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        City: {comment.cityName || 'Unknown'}
                      </span>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete comment"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content || 'No content'}
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