/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@proagenda/ui', '@proagenda/utils'],
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;

