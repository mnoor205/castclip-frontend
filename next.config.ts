import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['castclip.revolt-ai.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/video-proxy/:path*',
        destination: 'https://castclip.revolt-ai.com/:path*',
      },
    ]
  }
};

export default nextConfig;
