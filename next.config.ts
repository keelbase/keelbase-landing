import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Your own domain — journal cover images
        protocol: 'https',
        hostname: 'www.keelbase.io',
      },
      {
        // Notion-hosted images (file uploads, page covers)
        protocol: 'https',
        hostname: '**.notion.so',
      },
      {
        // Notion S3 assets
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        // Notion's prod-files CDN
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;