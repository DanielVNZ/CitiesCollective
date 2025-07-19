import './globals.css';
import 'leaflet/dist/leaflet.css';

import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from './components/ThemeProvider';
import { Footer } from './components/Footer';
import Script from 'next/script';

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
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/favicons/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicons/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/favicons/android-chrome-192x192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/favicons/android-chrome-512x512.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/favicons/site.webmanifest?v=2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" href="/favicons/favicon-16x16.png?v=2" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicons/favicon-32x32.png?v=2" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png?v=2" />
        <link rel="manifest" href="/favicons/site.webmanifest?v=2" />
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={GeistSans.variable} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
