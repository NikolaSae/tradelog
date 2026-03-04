import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: [
        'localhost:3000',
        'fantastic-space-disco-j4pr9rg64g9cpw5p-3000.app.github.dev',
      ],
    },
  },
};

export default nextConfig;
