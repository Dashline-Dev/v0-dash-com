/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force full module graph rebuild
  experimental: {
    turbo: {},
  },
}

export default nextConfig
