'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useFilterStore } from '@/store/filterStore'
import { ROUTES } from '@/constants/routes'

interface LogoProps {
  logoClassname?: string
  textClassname?: string
  onClick?: () => void
}

export default function Logo({ logoClassname, textClassname, onClick }: LogoProps) {
  const resetFilters = useFilterStore((state) => state.resetFilters)

  const handleLogoClick = () => {
    resetFilters()
    onClick?.()
  }

  return (
    <Link href={ROUTES.HOME} onClick={handleLogoClick} className="flex items-center gap-2 xl:mr-5">
      <div className={cn('h-11 w-auto object-contain', logoClassname)}>
        <Image src="/images/CuddleMarketLogoImage_100.webp" alt="CuddleMarket 로고" width={44} height={44} className="h-full w-auto object-cover" />
      </div>

      <p className={cn('logo flex flex-col text-xl leading-none text-white', textClassname)}>
        <span>CUDDLE</span>
        <span>MARKET</span>
      </p>
    </Link>
  )
}
