import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/brain-training/draw",
        destination: "/games/draw",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
