'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);
  const [token, setToken] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setIsValidToken(true);
    } else {
      setMessage('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validate passwords
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setPassword('');
        setConfirmPassword('');
        setIsResetSuccessful(true); // Mark as successful instead of invalidating token
      } else {
        setMessage(data.error || 'An error occurred. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success state after successful reset
  if (isResetSuccessful) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 pt-8 text-center sm:px-16">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Password Reset Successful!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your password has been updated successfully
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-8 sm:px-16">
            <div className="mb-4 p-3 rounded-md text-sm bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              {message}
            </div>
            
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Sign In with New Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 pt-8 text-center sm:px-16">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Invalid Reset Link</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The password reset link is invalid or has expired
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-8 sm:px-16">
            {message && (
              <div className="mb-4 p-3 rounded-md text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                {message}
              </div>
            )}
            
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Request New Reset Link
              </Link>
            </div>
            
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              {'Or '}
              <Link href="/login" className="font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                return to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Set New Password</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-8 sm:px-16">
          {message && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs text-gray-600 dark:text-gray-300 uppercase"
              >
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
                minLength={8}
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Must be at least 8 characters long
              </p>
            </div>
            
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs text-gray-600 dark:text-gray-300 uppercase"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
            
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {'Remember your password? '}
              <Link href="/login" className="font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                Sign in
              </Link>
              {' instead.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 