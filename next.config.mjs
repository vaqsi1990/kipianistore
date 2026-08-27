/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-neon",
      "@neondatabase/serverless",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/f/**", 
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@prisma/client/runtime/library": "@prisma/client/runtime/client",
    };

    // Handle node: protocol imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "node:async_hooks": false,
      "node:util": false,
      "node:buffer": false,
      "node:process": false,
    };
    
    return config;
  },
};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
