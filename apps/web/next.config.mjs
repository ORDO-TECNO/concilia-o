/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@conciliacao/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.googleusercontent.com' }],
  },
};

export default nextConfig;
