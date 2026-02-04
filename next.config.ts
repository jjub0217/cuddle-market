import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 외부 이미지 도메인 허용 (API 서버에서 제공하는 이미지)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
