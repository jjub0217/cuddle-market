import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '커들마켓',
  description: '반려동물 용품을 사고팔 수 있는 커들마켓',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
