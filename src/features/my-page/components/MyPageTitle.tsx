'use client'

import Button from '@/components/commons/button/Button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MyPageTitleProps {
  heading: string
  count?: number
  description: string
  buttonLabel?: string
  navigateTo?: string
}

export default function MyPageTitle({ heading, count, description, buttonLabel, navigateTo }: MyPageTitleProps) {
  const router = useRouter()
  const goToProductPost = () => {
    if (navigateTo) {
      router.push(navigateTo)
    }
  }
  return (
    <div className="flex justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">{heading}</h2>
        {description ? (
          <p className="text-sm text-gray-500">{count !== undefined ? `${description} ${count}` : description}</p>
        ) : null}
      </div>
      {buttonLabel ? (
        <Button
          size="sm"
          icon={Plus}
          variant="primary"
          // 높이를 여기서 다시 정하지 않는다. size="sm" 이 h-9(36) 를 못 박아 둔다(buttonClass.ts).
          // 전에는 h-fit 을 얹어 그것을 덮었고, 그러면 글자 줄높이 20 만 남아 단추가 납작했다(#1000).
          className="cursor-pointer font-bold"
          onClick={goToProductPost}
          type="button"
        >
          {buttonLabel}
        </Button>
      ) : null}
    </div>
  )
}
