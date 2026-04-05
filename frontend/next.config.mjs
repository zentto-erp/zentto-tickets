/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  // Assets cargan desde el dominio standalone (no desde el shell ERP)
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  images: {
    domains: ['localhost', 'api.zentto.net', 'tickets.zentto.net', 'ticketsdev.zentto.net'],
  },
};

export default nextConfig;
