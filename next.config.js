/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Your favicon rewrite
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.png",
      },
    ];
  },
};

export default nextConfig;
