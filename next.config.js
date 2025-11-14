/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  images: {
    unoptimized: true, // Cloudflare handles image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  output: 'export', // Static export for Cloudflare Pages
  trailingSlash: true,
}

module.exports = nextConfig