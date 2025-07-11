import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                Cities Collective
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                ← Back to Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms and Conditions</h1>
          
          <div className="space-y-8">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              <strong>Last updated:</strong> January 9, 2025
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing and using Cities Collective (&quot;the Service&quot;), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                These terms apply to all visitors, users, and others who access or use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Cities Collective is a platform for sharing Cities: Skylines 2 save files and related content. Users can:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Upload and share Cities: Skylines 2 save files (.cok files)</li>
                <li>Upload screenshots and images of their cities</li>
                <li>Browse and download content shared by other users</li>
                <li>Interact with the community through likes, comments, and favorites</li>
                <li>Create user profiles and manage their content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. User Accounts</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To use certain features of the service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Not create multiple accounts or share accounts with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Upload Restrictions and Content Guidelines</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4.1 Upload Limits</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                During the beta phase, users are limited to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Maximum 3 cities per user account</li>
                <li>Maximum 15 images per city</li>
                <li>Maximum 3GB per save file</li>
                <li>Maximum 10MB per image file</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4.2 Acceptable Content</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You may only upload content that:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Is created by you or you have explicit permission to share</li>
                <li>Is related to Cities: Skylines 2</li>
                <li>Does not violate any laws or regulations</li>
                <li>Does not infringe on intellectual property rights</li>
                <li>Is appropriate for all ages</li>
              </ul>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Important: Content Ownership</h4>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  <strong>Do not upload other people&apos;s content without their explicit permission.</strong> This includes save files, screenshots, or any other content created by other users. Uploading content without permission may result in immediate account termination.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4.3 Prohibited Content</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You may not upload content that:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Contains hate speech, harassment, or discrimination</li>
                <li>Is sexually explicit or contains nudity</li>
                <li>Promotes violence or illegal activities</li>
                <li>Contains malware or harmful code</li>
                <li>Violates others&apos; privacy or personal information</li>
                <li>Is spam or misleading content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5.1 Your Content</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You retain ownership of content you upload, but you grant us a license to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Store, display, and distribute your content through our service</li>
                <li>Create backups and optimize content for performance</li>
                <li>Allow other users to view and download your content (if you choose)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5.2 Cities: Skylines 2</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Cities: Skylines 2 is owned by Colossal Order and Paradox Interactive. This service is not affiliated with or endorsed by these companies.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5.3 Our Service</h3>
              <p className="text-gray-700 dark:text-gray-300">
                The service, including its design, functionality, and code, is protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Community Guidelines</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To maintain a positive community environment, users must:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Be respectful and constructive in comments and interactions</li>
                <li>Not engage in harassment, bullying, or abusive behavior</li>
                <li>Not attempt to circumvent technical limitations or security measures</li>
                <li>Not use the service for commercial purposes without permission</li>
                <li>Report inappropriate content or behavior</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Content Moderation</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Review and moderate all uploaded content</li>
                <li>Remove content that violates these terms</li>
                <li>Delete any city or content for any reason at our sole discretion</li>
                <li>Suspend or terminate accounts for violations</li>
                <li>Cooperate with law enforcement when required</li>
              </ul>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">🚨 Content Removal Policy</h4>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  <strong>We reserve the right to delete your city for any reason.</strong> This includes, but is not limited to, violations of these terms, inappropriate content, copyright infringement, or technical issues. We recommend keeping backups of your important save files.
                </p>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300">
                We are not obligated to monitor content but may do so at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Privacy and Data Protection</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your privacy is important to us. Please review our{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Privacy Policy
                </Link>{' '}
                to understand how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Beta Service Notice</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Cities Collective is currently in beta testing. This means:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Features may be limited, changed, or removed</li>
                <li>Service availability may be inconsistent</li>
                <li>Upload limits may be adjusted based on usage</li>
                <li>Data backup and recovery procedures are still being refined</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                We recommend keeping backups of your important save files.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To the maximum extent permitted by law, we shall not be liable for:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Any indirect, incidental, or consequential damages</li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>Damages arising from user-generated content</li>
                <li>Service interruptions or technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about these terms, please contact us:
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