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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
