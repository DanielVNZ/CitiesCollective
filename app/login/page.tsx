import Link from 'next/link';
import { signIn } from 'app/auth';
import { SubmitButton } from 'app/submit-button';

export default function Login() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use your email/username and password to sign in
          </p>
        </div>
        <form
          action={async (formData: FormData) => {
            'use server';
            await signIn('credentials', {
              redirectTo: '/protected',
              email: formData.get('email') as string,
              password: formData.get('password') as string,
            });
          }}
          className="flex flex-col space-y-4 bg-gray-50 dark:bg-gray-700 px-4 py-8 sm:px-16"
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
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <SubmitButton>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
              Sign up
            </Link>
            {' for free.'}
          </p>
        </form>
      </div>
    </div>
  );
}
