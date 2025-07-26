/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable experimental features if needed
    experimental: {
      // serverActions: true,
    },
    async headers() {
      return [
        {
          source: '/_next/image(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/uploads/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
        {
          source: '/:path*.ico',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
        {
          source: '/:path*.png',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
        {
          source: '/:path*.jpg',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
        {
          source: '/:path*.jpeg',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
        {
          source: '/:path*.gif',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
        {
          source: '/:path*.webp',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
        {
          source: '/:path*.avif',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
        {
          source: '/:path*.svg',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
      ];
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '*.r2.cloudflarestorage.com',
        },
        {
          protocol: 'https',
          hostname: 'cs2-saves.0810ac2482c0f83dca9b574b1c9b2cae.r2.cloudflarestorage.com',
        },
        {
          protocol: 'https',
          hostname: '*.r2.dev',
        },
        {
          protocol: 'https',
          hostname: '*.citiescollective.space',
        },
        {
          protocol: 'https',
          hostname: 'halloffame.azureedge.net',
        },
      ],
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
};

module.exports = nextConfig; 