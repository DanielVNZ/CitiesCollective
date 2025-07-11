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


      {/* Social Links Editor */}
      <SocialLinksEditor onSave={() => {}} />
    </div>
  );
} 