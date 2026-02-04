'use client'

import { Button } from '@/components/commons/button/Button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface MyPageTitleProps {
  heading: string
  count?: number
  description: string
  buttonLabel?: string
  buttonClassname?: string
  navigateTo?: string
}

export default function MyPageTitle({ heading, count, description, buttonLabel, navigateTo, buttonClassname }: MyPageTitleProps) {
  const router = useRouter()
  const goToProductPost = () => {
    if (navigateTo) {
      router.push(navigateTo)
    }
  }
  return (
    <div className="flex justify-between">
      <div>
        <h4 className="flex items-center gap-2 text-lg font-bold">{heading}</h4>
        {description && <p>{count !== undefined ? `총 ${count}${description}` : description}</p>}
      </div>
      {buttonLabel && (
        <Button
          size="sm"
          icon={Plus}
          className={cn('bg-primary-200 h-fit cursor-pointer font-bold text-white', buttonClassname)}
          onClick={goToProductPost}
          type="button"
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  )
}
