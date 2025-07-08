/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure body size limit for API routes
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  
  // Enable experimental features if needed
  experimental: {
    serverComponentsExternalPackages: ['adm-zip'],
  },
  
  // Configure headers for better CORS handling
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 