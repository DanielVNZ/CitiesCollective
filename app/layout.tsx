import './globals.css';
import 'leaflet/dist/leaflet.css';

import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from './components/ThemeProvider';
import { SessionProvider } from './components/SessionProvider';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { AnalyticsLoader } from './components/AnalyticsLoader';

import Script from 'next/script';
import TurnstileScriptLoader from './components/TurnstileScriptLoader';

let title = 'Cities Collective';
let description =
  'Share and discover amazing Cities: Skylines 2 creations from builders worldwide. Upload your save files, showcase your cities, and connect with the community.';

export const metadata = {
  title,
  description,
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  metadataBase: new URL('https://citiescollective.space'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/favicons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/favicons/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.variable} suppressHydrationWarning>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange={false}
          >
            {children}
            <Footer />
            <CookieConsent />
            <AnalyticsLoader />
            <TurnstileScriptLoader />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}


