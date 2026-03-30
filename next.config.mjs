/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Cache-bust: forces Turbopack to recompile from source (do not remove)
  env: {
    NEXT_BUILD_ID: Date.now().toString(),
  },
}

export default nextConfig
