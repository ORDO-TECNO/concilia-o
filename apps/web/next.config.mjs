const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@conciliacao/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.googleusercontent.com' }],
  },
  // A documentação é servida pela API (manual em /docs/ledger-manual, Swagger
  // em /docs/api). O rewrite faz ela abrir no domínio do web — ex.:
  // https://ledgercompany.com.br/docs/ledger-manual — sem expor o domínio da API.
  async rewrites() {
    return [
      { source: '/docs', destination: `${API_URL}/docs` },
      { source: '/docs/:path*', destination: `${API_URL}/docs/:path*` },
    ];
  },
};

export default nextConfig;
