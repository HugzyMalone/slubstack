import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return {
      afterFiles: [{ source: "/blockyard", destination: "/blockyard/index.html" }],
      beforeFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      {
        source: "/brain-training/draw",
        destination: "/games/draw",
        permanent: true,
      },
      {
        source: "/league",
        destination: "/leaderboard/league",
        permanent: false,
      },
      {
        source: "/wordle",
        destination: "/brain-training/wordle",
        permanent: false,
      },
      {
        source: "/connections",
        destination: "/brain-training/connections",
        permanent: false,
      },
      {
        source: "/semantle",
        destination: "/brain-training/semantle",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
