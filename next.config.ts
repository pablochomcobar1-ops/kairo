import type { NextConfig } from "next";

// Product photos come from your Supabase project's public "products" bucket only.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // pictures never change at a given address (each upload gets a new name), so cache them long
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: supabase
      ? [
          {
            protocol: supabase.protocol === "http:" ? "http" : "https",
            hostname: supabase.hostname,
            port: supabase.port,
            pathname: "/storage/v1/object/public/products/**",
          },
        ]
      : [],
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // review photos: up to 4, shrunk in the browser first; hosting caps a request near 4.5 MB
    serverActions: { bodySizeLimit: "4mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
