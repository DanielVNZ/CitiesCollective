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
    },
};

module.exports = nextConfig; 