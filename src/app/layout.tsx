import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import ClientComponents from '@/components/ClientComponents'

export const metadata: Metadata = {
  title: '커들마켓 | 반려동물 마켓플레이스',
  description: '반려동물 용품을 사고팔 수 있는 커들마켓',
  openGraph: {
    title: '커들마켓 | 반려동물 마켓플레이스',
    description: '따뜻한 우리 동네 중고거래',
    url: 'https://cuddle-market-fe.vercel.app',
    type: 'website',
    images: [
      {
        url: 'https://cuddle-market-fe.vercel.app/og-image.png',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {children}
          <ClientComponents />
        </Providers>
      </body>
    </html>
  )
}
