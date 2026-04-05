/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  basePath: '/tickets',
  images: {
    domains: ['localhost', 'api.zentto.net', 'tickets.zentto.net'],
  },
};

export default nextConfig;
