'use client';

import { useState, useEffect } from 'react';

interface HoFBindingStatusProps {
  hofCreatorId: string | null;
  userId: number;
}

interface BindingTestResult {
  success: boolean;
  message: string;
  hasImages?: boolean;
  imageCount?: number;
}

export default function HoFBindingStatus({ hofCreatorId, userId }: HoFBindingStatusProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<BindingTestResult | null>(null);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  const testBinding = async () => {
    if (!hofCreatorId) {
      setTestResult({
        success: false,
        message: 'No HoF Creator ID set. Please set your Creator ID first.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test the binding by checking if we can fetch creator info
      const response = await fetch('/api/hof-binding/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hofCreatorId }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: data.message,
          hasImages: data.hasImages,
          imageCount: data.imageCount
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to test binding'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error while testing binding'
      });
    } finally {
      setIsTesting(false);
      setLastTestTime(new Date());
    }
  };

  const getStatusColor = () => {
    if (!hofCreatorId) return 'text-gray-500';
    if (testResult?.success) return 'text-green-600';
    if (testResult && !testResult.success) return 'text-red-600';
    return 'text-blue-600';
  };

  const getStatusIcon = () => {
    if (!hofCreatorId) return '❓';
    if (testResult?.success) return '✅';
    if (testResult && !testResult.success) return '❌';
    return '⏳';
  };

  const getStatusText = () => {
    if (!hofCreatorId) return 'Not configured';
    if (testResult?.success) return 'Active';
    if (testResult && !testResult.success) return 'Connection failed';
    return 'Ready to test';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Hall of Fame Connection
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${getStatusColor()}`}>
            {getStatusIcon()}
          </span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Creator ID Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hall of Fame ID:
          </span>
          <span className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {hofCreatorId 
              ? `${hofCreatorId.substring(0, 8)}...${hofCreatorId.substring(hofCreatorId.length - 4)}`
              : 'Not set'
            }
          </span>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className={`p-3 rounded-md text-sm ${
            testResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            <div className="font-medium mb-1">
              {testResult.success ? '✅ Connection Successful' : '❌ Connection Failed'}
            </div>
            <p>{testResult.message}</p>
            {testResult.success && testResult.hasImages && (
              <p className="mt-1 text-xs opacity-75">
                {testResult.imageCount} Hall of Fame images available
              </p>
            )}
            {lastTestTime && (
              <p className="mt-1 text-xs opacity-75">
                Last tested: {lastTestTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {/* Test Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={testBinding}
            disabled={isTesting || !hofCreatorId}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Testing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                                 Test Connection
              </>
            )}
          </button>

          {hofCreatorId && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Click to test your Hall of Fame connection
            </span>
          )}
        </div>

        {/* Information */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Connection Test</p>
              <p>Test your Hall of Fame connection instantly without refreshing the page. This verifies that your Hall of Fame ID is working correctly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 