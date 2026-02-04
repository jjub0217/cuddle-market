'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CuddleMarketLogo from '@/assets/images/CuddleMarketLogoImage_100.webp'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils/cn'
import { useFilterStore } from '@/store/filterStore'

interface LogoProps {
  logoClassname?: string
  textClassname?: string
  onClick?: () => void
}

export default function Logo({ logoClassname, textClassname, onClick }: LogoProps) {
  const router = useRouter()
  const resetFilters = useFilterStore((state) => state.resetFilters)

  const handleLogoClick = () => {
    // Clear search params by navigating to home without params
    router.push(ROUTES.HOME)
    resetFilters()
    onClick?.()
  }

  return (
    <Link href={ROUTES.HOME} onClick={handleLogoClick} className="flex items-center gap-2 xl:mr-5">
      <div className={cn('h-11 w-auto object-contain', logoClassname)}>
        <Image src={CuddleMarketLogo} alt="CuddleMarket 로고" className="h-full w-auto object-cover" />
      </div>

      <p className={cn('logo flex flex-col text-xl leading-none text-white', textClassname)}>
        <span>CUDDLE</span>
        <span>MARKET</span>
      </p>
    </Link>
  )
}
