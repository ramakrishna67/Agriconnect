/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://agriconnect-uopt.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
