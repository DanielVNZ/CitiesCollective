'use client';

import { useState, useEffect } from 'react';

interface ModerationSettingsProps {}

export function ModerationSettings({}: ModerationSettingsProps) {
  const [profanityList, setProfanityList] = useState<string[]>([]);
  const [spamIndicators, setSpamIndicators] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProfanityWord, setNewProfanityWord] = useState('');
  const [newSpamIndicator, setNewSpamIndicator] = useState('');
  const [bulkProfanityWords, setBulkProfanityWords] = useState('');
  const [bulkSpamIndicators, setBulkSpamIndicators] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/moderation-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profanityList,
          spamIndicators,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const addProfanityWord = () => {
    if (newProfanityWord.trim() && !profanityList.includes(newProfanityWord.trim())) {
      setProfanityList([...profanityList, newProfanityWord.trim()]);
      setNewProfanityWord('');
    }
  };

  const removeProfanityWord = (index: number) => {
    setProfanityList(profanityList.filter((_, i) => i !== index));
  };

  const addSpamIndicator = () => {
    if (newSpamIndicator.trim() && !spamIndicators.includes(newSpamIndicator.trim())) {
      setSpamIndicators([...spamIndicators, newSpamIndicator.trim()]);
      setNewSpamIndicator('');
    }
  };

  const removeSpamIndicator = (index: number) => {
    setSpamIndicators(spamIndicators.filter((_, i) => i !== index));
  };

  const addBulkProfanityWords = () => {
    if (!bulkProfanityWords.trim()) return;
    
    const words = bulkProfanityWords
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    const newWords = words.filter(word => !profanityList.includes(word));
    const duplicates = words.filter(word => profanityList.includes(word));
    
    if (newWords.length > 0) {
      setProfanityList([...profanityList, ...newWords]);
      setMessage({ 
        type: 'success', 
        text: `Added ${newWords.length} new words${duplicates.length > 0 ? ` (${duplicates.length} duplicates ignored)` : ''}` 
      });
    } else if (duplicates.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `All ${duplicates.length} words already exist in the list` 
      });
    }
    
    setBulkProfanityWords('');
    setTimeout(() => setMessage(null), 3000);
  };

  const addBulkSpamIndicators = () => {
    if (!bulkSpamIndicators.trim()) return;
    
    const indicators = bulkSpamIndicators
      .split(',')
      .map(indicator => indicator.trim())
      .filter(indicator => indicator.length > 0);
    
    const newIndicators = indicators.filter(indicator => !spamIndicators.includes(indicator));
    const duplicates = indicators.filter(indicator => spamIndicators.includes(indicator));
    
    if (newIndicators.length > 0) {
      setSpamIndicators([...spamIndicators, ...newIndicators]);
      setMessage({ 
        type: 'success', 
        text: `Added ${newIndicators.length} new indicators${duplicates.length > 0 ? ` (${duplicates.length} duplicates ignored)` : ''}` 
      });
    } else if (duplicates.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `All ${duplicates.length} indicators already exist in the list` 
      });
    }
    
    setBulkSpamIndicators('');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/moderation-settings');
        if (response.ok) {
          const data = await response.json();
          setProfanityList(data.profanityList || []);
          setSpamIndicators(data.spamIndicators || []);
        }
      } catch (error) {
        console.error('Error loading moderation settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading moderation settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Moderation Settings
      </h2>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md mb-6 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className={`text-sm ${
            message.type === 'success' 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-red-800 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profanity List */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Profanity List ({profanityList.length} words)
          </h3>
          
          <div className="space-y-4">
            {/* Add new word */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newProfanityWord}
                onChange={(e) => setNewProfanityWord(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addProfanityWord)}
                placeholder="Add profanity word..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addProfanityWord}
                disabled={!newProfanityWord.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {/* Bulk add words */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bulk Add Words (comma-separated)
              </label>
              <div className="flex space-x-2">
                <textarea
                  value={bulkProfanityWords}
                  onChange={(e) => setBulkProfanityWords(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addBulkProfanityWords)}
                  placeholder="word1, word2, word3, word4..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={addBulkProfanityWords}
                  disabled={!bulkProfanityWords.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start"
                >
                  Bulk Add
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter multiple words separated by commas. Duplicates will be automatically ignored.
              </p>
            </div>

            {/* Word list */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3">
              {profanityList.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No profanity words added</p>
              ) : (
                <div className="space-y-2">
                  {profanityList.map((word, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-900 dark:text-white font-mono text-sm">{word}</span>
                      <button
                        onClick={() => removeProfanityWord(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spam Indicators */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Spam Indicators ({spamIndicators.length} phrases)
          </h3>
          
          <div className="space-y-4">
            {/* Add new indicator */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSpamIndicator}
                onChange={(e) => setNewSpamIndicator(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addSpamIndicator)}
                placeholder="Add spam phrase..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addSpamIndicator}
                disabled={!newSpamIndicator.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {/* Bulk add indicators */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bulk Add Indicators (comma-separated)
              </label>
              <div className="flex space-x-2">
                <textarea
                  value={bulkSpamIndicators}
                  onChange={(e) => setBulkSpamIndicators(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addBulkSpamIndicators)}
                  placeholder="phrase1, phrase2, phrase3, phrase4..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={addBulkSpamIndicators}
                  disabled={!bulkSpamIndicators.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start"
                >
                  Bulk Add
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter multiple phrases separated by commas. Duplicates will be automatically ignored.
              </p>
            </div>

            {/* Indicator list */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3">
              {spamIndicators.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No spam indicators added</p>
              ) : (
                <div className="space-y-2">
                  {spamIndicators.map((indicator, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-900 dark:text-white text-sm">{indicator}</span>
                      <button
                        onClick={() => removeSpamIndicator(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          How it works:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Profanity words are automatically filtered and replaced with asterisks</li>
          <li>• Spam indicators cause comments to be rejected entirely</li>
          <li>• Changes take effect immediately after saving</li>
          <li>• Use exact words/phrases that should be detected</li>
        </ul>
      </div>
    </div>
  );
} 