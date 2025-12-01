/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@proagenda/ui', '@proagenda/api-client', '@proagenda/utils'],
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;

