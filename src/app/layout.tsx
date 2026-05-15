import type { Metadata, Viewport } from 'next'
import Providers from './providers'
import ClientComponents from '@/components/ClientComponents'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://cuddle-market.vercel.app'),
  title: '커들마켓',
  description: '반려동물 용품을 사고팔 수 있는 커들마켓',
  manifest: '/manifest.json',
  themeColor: '#FF6F0F',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '커들마켓',
  },
  verification: {
    google: 'QwSeEYXUKCcLgTD8CtBEEpERKpp34sHBD_6r8dvKM2Q',
    other: {
      'naver-site-verification': '765503856b8ad106fd6d4890a149f0a5bc5de581',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://df1xl13ui5mlo.cloudfront.net" />
        {/* 메인페이지 새로고침 시 브라우저 scroll restoration 비활성화 — hydration 전에 적용해 헤더 색 깜빡임 방지 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(location.pathname==='/'&&'scrollRestoration' in history){history.scrollRestoration='manual';}`,
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
          <ClientComponents />
        </Providers>
      </body>
    </html>
  )
}
