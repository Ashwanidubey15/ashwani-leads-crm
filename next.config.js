/** @type {import('next').NextConfig} */
const nextConfig = {
   serverExternalPackages: ["node-cron"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
    ],
  },
};

module.exports = nextConfig; 