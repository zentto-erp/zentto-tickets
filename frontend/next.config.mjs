/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  basePath: '/tickets',
  trailingSlash: true,
  images: {
    domains: ['localhost', 'api.zentto.net', 'tickets.zentto.net'],
  },
};

export default nextConfig;
