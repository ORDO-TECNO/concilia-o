/**
 * Destino do rewrite de /docs. Tolera a URL da API sem protocolo ou com barra
 * no fim (ex.: "api.up.railway.app/"); um destino inválido derrubaria o
 * `next build` inteiro, então nesse caso o rewrite é pulado com um aviso.
 */
function docsProxyTarget(raw) {
  const value = (raw || 'http://localhost:3001').trim().replace(/\/+$/, '');
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    new URL(withScheme);
    return withScheme;
  } catch {
    console.warn(`[next.config] NEXT_PUBLIC_API_URL inválida (${raw}); rewrite de /docs desativado.`);
    return null;
  }
}

const API_URL = docsProxyTarget(process.env.NEXT_PUBLIC_API_URL);

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
    if (!API_URL) return [];
    return [
      { source: '/docs', destination: `${API_URL}/docs` },
      { source: '/docs/:path*', destination: `${API_URL}/docs/:path*` },
    ];
  },
};

export default nextConfig;
