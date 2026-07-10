/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@conciliacao/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
