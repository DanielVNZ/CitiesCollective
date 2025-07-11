import Link from 'next/link';
import { Header } from 'app/components/Header';
import { auth } from 'app/auth';
import { isUserAdmin } from 'app/db';

export default async function PrivacyPolicy() {
  const session = await auth();
  const isAdmin = session?.user?.email ? await isUserAdmin(session.user.email) : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Welcome to Cities Collective (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services for sharing Cities: Skylines 2 save files and related content.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you register for an account, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Email address (required for account creation)</li>
                <li>Username (chosen by you)</li>
                <li>Password (encrypted and stored securely) - for email/password accounts</li>
                <li>Name and avatar (when using Google or GitHub OAuth login)</li>
                <li>Google ID or GitHub ID (when using OAuth login)</li>
                <li>Optional profile information (social media links, bio)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.2 Content You Upload</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you use our services, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Cities: Skylines 2 save files (.cok files) - up to 3GB per file</li>
                <li>City screenshots and images (processed into multiple sizes for optimization)</li>
                <li>Optional OpenStreetMap (.osm) files for custom map data</li>
                <li>Metadata extracted from save files (city name, population, money, XP, etc.)</li>
                <li>Comments and interactions with other users&apos; content</li>
                <li>Likes, favorites, and social interactions</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.3 Usage Information</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on the site</li>
                <li>Referral sources</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Provide, operate, and maintain our website and services</li>
                <li>Process and display your uploaded cities and content</li>
                <li>Enable community features (likes, comments, favorites)</li>
                <li>Communicate with you about your account and our services</li>
                <li>Improve our website and user experience</li>
                <li>Prevent fraud and ensure platform security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Data Storage and Security</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Passwords are encrypted using industry-standard bcrypt hashing</li>
                <li>OAuth tokens are stored securely and encrypted</li>
                <li>Save files (.cok), images, and OSM files are stored securely using Cloudflare R2</li>
                <li>Images are automatically processed into optimized formats (WebP) and multiple sizes</li>
                <li>Our website uses SSL encryption for secure data transmission</li>
                <li>Database access is restricted and monitored</li>
                <li>File uploads are validated and scanned for security</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Information Sharing</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties, except:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Content you choose to make public (city uploads, comments, usernames)</li>
                <li>When required by law or to protect our rights</li>
                <li>With trusted service providers who assist in operating our website</li>
                <li>In the event of a business transfer or merger</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Third-Party Services</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our website uses the following third-party services:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li><strong>Cloudflare R2:</strong> File storage for save files, images, and OSM files</li>
                <li><strong>Neon Database:</strong> Database hosting for user data and metadata</li>
                <li><strong>NextAuth.js:</strong> Authentication service supporting email/password, Google OAuth, and GitHub OAuth</li>
                <li><strong>Google OAuth:</strong> For Google account login (subject to Google&apos;s privacy policy)</li>
                <li><strong>GitHub OAuth:</strong> For GitHub account login (subject to GitHub&apos;s privacy policy)</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                These services have their own privacy policies and terms of service. When you use OAuth login, we receive basic profile information (name, email, avatar) from the respective service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Download your uploaded content</li>
                <li>Withdraw consent for data processing</li>
                <li>Request correction of inaccurate information</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Maintain your login session</li>
                <li>Remember your preferences (theme, etc.)</li>
                <li>Analyze website usage and performance</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Data Retention</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain your information for as long as necessary to provide our services or as required by law:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Account information: Until you delete your account</li>
                <li>Uploaded save files (.cok): Until you remove them or delete your account</li>
                <li>Uploaded images: Until you remove them or delete your account</li>
                <li>Uploaded OSM files: Until you remove them or delete your account</li>
                <li>OAuth tokens: Until you disconnect your account or delete your account</li>
                <li>Usage logs: Up to 12 months for security and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the &quot;last updated&quot; date. You are advised to review this privacy policy periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this privacy policy or our practices, please contact us:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Website: <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">citiescollective.space</Link></li>
                <li>Email: support@citiescollective.space</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>
              <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</Link> •{' '}
              <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 