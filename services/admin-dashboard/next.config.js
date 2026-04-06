/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    // ESLint runs separately in CI; circular-ref in react plugin breaks docker build
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_AIOS_CORE_API_URL: process.env.NEXT_PUBLIC_AIOS_CORE_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000",
  },
};

module.exports = nextConfig;
