'use client'

import Button from '@/components/commons/button/Button'
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
        <h2 className="flex items-center gap-2 text-sm font-bold md:text-base">{heading}</h2>
        {description ? <p className="text-sm text-gray-500">{count !== undefined ? `${description} ${count}` : description}</p> : null}
      </div>
      {buttonLabel ? (
        <Button
          size="sm"
          icon={Plus}
          className={cn(
            'bg-primary shadow-primary/20 h-fit cursor-pointer font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl',
            buttonClassname
          )}
          onClick={goToProductPost}
          type="button"
        >
          {buttonLabel}
        </Button>
      ) : null}
    </div>
  )
}
