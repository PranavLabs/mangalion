/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to compile these packages so they don't break the build
  transpilePackages: ['@consumet/extensions', 'undici', 'cheerio'],
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
