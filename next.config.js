import webpack from "webpack";

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

  // 2. The fix for the "__dirname" error
  webpack: (config) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        __dirname: JSON.stringify("."),
      }),
    );
    return config;
  },
};

export default nextConfig;
