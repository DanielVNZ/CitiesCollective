'use client';

import { useState, useEffect } from 'react';
import { SocialLinksEditor } from './SocialLinksEditor';

interface UserProfile {
  id: number;
  email: string | null;
  username: string | null;
  isAdmin: boolean | null;
}

interface ProfileEditorProps {
  user: UserProfile;
}

export default function ProfileEditor({ user }: ProfileEditorProps) {
  const [profile, setProfile] = useState<UserProfile>(user);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully!');
        setMessageType('success');
        setProfile(data.user);
      } else {
        setMessage(data.error || 'Failed to update profile');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An error occurred while updating your profile');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          messageType === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={profile?.email || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={profile?.username || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Username cannot be changed here</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
      </div>

      {/* Social Links Editor */}
      <SocialLinksEditor onSave={() => {}} />
    </div>
  );
} 