


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'Rosewood.smartdent.online', port: '4000', pathname: '/**' }
    ],
    unoptimized: true,
  },

};

export default nextConfig;
