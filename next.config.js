/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable experimental features if needed
    experimental: {
      // serverActions: true,
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
          hostname: 'pub-ba1c78e7f54646c4bd11875db43f3c72.r2.dev',
        },
      ],
    },
};

module.exports = nextConfig; 