import type { NextConfig } from "next";
import { assertTossClientKey } from "./src/lib/payments/clientKeyGuard";

// 토스 클라이언트 키 자리에 시크릿 키 등이 들어가면 여기서 빌드를 멈춘다(#1128).
// NEXT_PUBLIC_ 값은 빌드 결과에 박혀 공개되므로, 빌드가 끝나기 전에 막아야 한다
assertTossClientKey(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);

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
