import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createUser, getUser, client } from 'app/db';
import { SubmitButton } from 'app/submit-button';

export default function Register() {
  async function register(formData: FormData) {
    'use server';
    let email = formData.get('email') as string;
    let password = formData.get('password') as string;
    let username = formData.get('username') as string;
    let agreeToTerms = formData.get('agreeToTerms') as string;
    
    // Check if user agreed to terms
    if (!agreeToTerms) {
      // TODO: Handle errors with useFormStatus
      return;
    }
    
    // Check if user already exists
    let user = await getUser(email);
    if (user.length > 0) {
      // TODO: Handle errors with useFormStatus
      return;
    }
    
    // Check if username is already taken
    const existingUsername = await client`SELECT id FROM "User" WHERE username = ${username};`;
    if (existingUsername.length > 0) {
      // TODO: Handle errors with useFormStatus
      return;
    }

    await createUser(email, password, username);
    redirect('/login');
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create an account with your email, username, and password
          </p>
        </div>
        <form
          action={register}
          className="flex flex-col space-y-4 bg-gray-50 dark:bg-gray-700 px-4 py-8 sm:px-16"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xs text-gray-600 dark:text-gray-300 uppercase"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="user@acme.com"
              autoComplete="email"
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="username"
              className="block text-xs text-gray-600 dark:text-gray-300 uppercase"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="johndoe"
              autoComplete="username"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
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
          <div className="flex items-start">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mt-1"
            />
            <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-600 dark:text-gray-300">
              I agree to the{' '}
              <Link 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link 
                href="/terms" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                target="_blank"
              >
                Terms of Service
              </Link>
            </label>
          </div>
          <SubmitButton>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {'Already have an account? '}
            <Link href="/login" className="font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
              Sign in
            </Link>
            {' instead.'}
          </p>
        </form>
      </div>
    </div>
  );
}
