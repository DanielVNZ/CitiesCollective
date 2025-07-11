'use client';

import { useState, useEffect } from 'react';

interface SocialLink {
  id: number;
  platform: string;
  url: string;
}

interface SocialLinksEditorProps {
  onSave?: () => void;
}

const PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'X', label: 'X (formerly Twitter)' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'threads', label: 'Threads' },
  { value: 'discord', label: 'Discord' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'bilibili', label: 'Bilibili' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'kofi', label: 'Ko-fi' },
  { value: 'buymeacoffee', label: 'Buy Me a Coffee' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
  { value: 'paradoxmods', label: 'Paradox Mods' },
];

export function SocialLinksEditor({ onSave }: SocialLinksEditorProps) {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load existing social links
  useEffect(() => {
    loadSocialLinks();
  }, []);

  const loadSocialLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/social-links');
      if (response.ok) {
        const data = await response.json();
        setSocialLinks(data.socialLinks || []);
      }
    } catch (error) {
      console.error('Error loading social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPlatform || !url.trim()) {
      setError('Please select a platform and enter a URL');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const response = await fetch('/api/user/social-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          url: url.trim(),
        }),
      });

      if (response.ok) {
        setSuccessMessage('Social link saved successfully!');
        setSelectedPlatform('');
        setUrl('');
        await loadSocialLinks();
        onSave?.();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save social link');
      }
    } catch (error) {
      setError('Failed to save social link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (platform: string) => {
    try {
      const response = await fetch(`/api/user/social-links?platform=${platform}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('Social link deleted successfully!');
        await loadSocialLinks();
        onSave?.();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete social link');
      }
    } catch (error) {
      setError('Failed to delete social link');
    }
  };

  const getPlatformLabel = (platform: string) => {
    const option = PLATFORM_OPTIONS.find(opt => opt.value === platform);
    return option ? option.label : platform;
  };

  const getAvailablePlatforms = () => {
    const usedPlatforms = socialLinks.map(link => link.platform);
    return PLATFORM_OPTIONS.filter(option => !usedPlatforms.includes(option.value));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
        <div className="text-center py-4">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
      
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Existing Social Links */}
      {socialLinks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Your Social Links</h4>
          <div className="space-y-2">
            {socialLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {getPlatformLabel(link.platform)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {link.url}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(link.platform)}
                  className="ml-3 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Social Link */}
      {getAvailablePlatforms().length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Social Link</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a platform</option>
                {getAvailablePlatforms().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profile URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/yourprofile"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !selectedPlatform || !url.trim()}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Add Social Link'}
          </button>
        </div>
      )}

      {getAvailablePlatforms().length === 0 && socialLinks.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You&apos;ve added all available social platforms!
          </p>
        </div>
      )}
    </div>
  );
} 