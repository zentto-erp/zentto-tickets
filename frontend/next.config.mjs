/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  // basePath gestionado por nginx rewrite (strip /tickets prefix)
  // NO usar basePath de Next.js — tiene bugs en standalone con Next 16
  images: {
    domains: ['localhost', 'api.zentto.net', 'tickets.zentto.net'],
  },
};

export default nextConfig;
