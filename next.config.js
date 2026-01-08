/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to exclude these libraries from the build process
  // and treat them as server-side only dependencies.
  experimental: {
    serverComponentsExternalPackages: ['@consumet/extensions', 'cheerio', 'undici'],
  },
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
