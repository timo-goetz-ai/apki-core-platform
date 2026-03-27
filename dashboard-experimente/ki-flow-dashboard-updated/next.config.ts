import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker/Coolify deployment
  experimental: {
    // Server actions if needed later
  },
};

export default nextConfig;
