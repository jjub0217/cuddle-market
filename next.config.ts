import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @cuddle/shared는 빌드 없이 TS 소스를 그대로 내보내는 워크스페이스 패키지라
  // Next가 직접 변환해야 한다.
  transpilePackages: ['@cuddle/shared'],
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
