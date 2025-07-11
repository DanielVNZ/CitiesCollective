import Link from 'next/link';
import { signIn } from 'app/auth';
import { getRedirectUrl } from 'app/utils/redirect';
import TurnstileWidget from 'app/components/TurnstileWidget';
import { validateTurnstileToken } from 'app/utils/turnstile';
import { redirect } from 'next/navigation';

export default function Login({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const redirectTo = getRedirectUrl(new URLSearchParams(searchParams as Record<string, string>));
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      {/* Return Home Button */}
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Return Home</span>
        </Link>
      </div>
      
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use your email/username and password to sign in
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-8 sm:px-16">
          {/* OAuth Sign-In Buttons */}
          <div className="space-y-3 mb-6">
            {/* Google Sign-In Button */}
            <form
              action={async () => {
                'use server';
                await signIn('google', { redirectTo });
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </form>

            {/* GitHub Sign-In Button */}
            <form
              action={async () => {
                'use server';
                await signIn('github', { redirectTo });
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 dark:bg-gray-700 px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form
            action={async (formData: FormData) => {
              'use server';
              
              // Validate Turnstile token
              const turnstileToken = formData.get('cf-turnstile-response') as string;
              const isValidToken = await validateTurnstileToken(turnstileToken);
              
              if (!isValidToken) {
                // Redirect back with error
                redirect('/login?error=Please complete the security check');
              }
              
              await signIn('credentials', {
                redirectTo,
                email: formData.get('email') as string,
                password: formData.get('password') as string,
              });
            }}
            className="flex flex-col space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-xs text-gray-600 dark:text-gray-300 uppercase"
              >
                Email or Username
              </label>
              <input
                id="email"
                name="email"
                type="text"
                placeholder="user@acme.com or username"
                autoComplete="email"
                required
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs text-gray-600 dark:text-gray-300 uppercase"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Temporarily show Turnstile everywhere for testing */}
            <div className="flex items-center justify-between">
              <div></div>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot your password?
              </Link>
            </div>
            
            {/* Cloudflare Turnstile - temporarily showing everywhere for testing */}
            <TurnstileWidget 
              siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || 'test-key'}
              theme="light"
            />
            
            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Sign in
            </button>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href={`/register?redirect=${encodeURIComponent(redirectTo)}`} className="font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                Sign up
              </Link>
              {' for free.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
