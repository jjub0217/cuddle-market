'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/constants/routes'

interface LogoProps {
  logoClassname?: string
  onClick?: () => void
}

/**
 * 새 로고 이미지(아이콘 + Cuddle Market 텍스트가 일체화된 가로형) 단일 사용.
 * 이전 텍스트 span(CUDDLE / MARKET)은 이미지에 포함되어 제거됨.
 */
export default function Logo({ logoClassname, onClick }: LogoProps) {
  return (
    <Link href={ROUTES.HOME} onClick={onClick} className="flex items-center xl:mr-5">
      <Image
        src="/images/CuddleMarketLogoImage_v2.webp"
        alt="Cuddle Market 로고"
        width={144}
        height={48}
        priority
        className={cn('h-9 w-auto md:h-10', logoClassname)}
      />
    </Link>
  )
}
