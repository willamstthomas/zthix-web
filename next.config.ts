import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/verify/:path*",
        destination: "https://zthix-broker-terminal.vercel.app/verify/:path*",
      },
    ];
  },
};

export default nextConfig;
