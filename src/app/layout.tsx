import type { Metadata } from 'next'
import Providers from './providers'
import ClientComponents from '@/components/ClientComponents'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://cuddle-market.vercel.app'),
  title: '커들마켓',
  description: '반려동물 용품을 사고팔 수 있는 커들마켓',
  verification: {
    google: 'QwSeEYXUKCcLgTD8CtBEEpERKpp34sHBD_6r8dvKM2Q',
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
