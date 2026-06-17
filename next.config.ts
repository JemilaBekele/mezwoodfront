


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'rcf.ordere.net', port: '4000', pathname: '/**' }
    ],
    unoptimized: true,
  },

};

export default nextConfig;
