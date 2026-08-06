/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/f/**", 
      },
    ],
  },
  webpack: (config, { isServer }) => {
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
