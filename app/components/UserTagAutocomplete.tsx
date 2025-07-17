'use client';

import { useState, useEffect, useRef } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserTagAutocompleteProps {
  query: string;
  onSelectUser: (user: User) => void;
  onClose: () => void;
}

export function UserTagAutocomplete({ query, onSelectUser, onClose }: UserTagAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (users.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % users.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
          break;
        case 'Tab':
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelectUser(users[selectedIndex]);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelectUser(users[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelectUser, onClose]);

  if (users.length === 0 && !loading && query.length > 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
      style={{ minWidth: '200px' }}
    >
      {loading ? (
        <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
          Searching users...
        </div>
      ) : (
        <div className="py-1">
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                index === selectedIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              <div className="font-medium">@{user.username}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 