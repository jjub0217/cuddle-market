'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Z_INDEX } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'

// 모바일 폭에서만 보이는 뒤로가기 헤더.
//
// 왜 조각으로 빼나: 상품 등록과 커뮤니티 글 작성이 같은 역할을 각자 손으로 만들어
// 색(베이지 vs 흰색)과 정렬(가운데 vs 왼쪽)이 갈려 있었다. 페이지가 늘면 또 갈린다.
//
// 데스크탑에서는 전역 헤더가 있으므로 md 이상에서 숨긴다.

interface MobileBackHeaderProps {
  title: string
  /** 안 주면 브라우저 뒤로가기 */
  onBack?: () => void
  className?: string
}

export default function MobileBackHeader({ title, onBack, className }: MobileBackHeaderProps) {
  const router = useRouter()

  return (
    <div
      className={cn(
        'sticky top-0 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden',
        // 합치기 전 두 페이지가 모두 쓰던 값을 그대로 둔다 — z-10으로 낮추면
        // 아래로 흘러가는 본문이 헤더 위에 그려질 수 있다.
        Z_INDEX.HEADER,
        className
      )}
    >
      <button type="button" onClick={onBack ?? (() => router.back())} aria-label="뒤로가기" className="cursor-pointer">
        <ArrowLeft size={20} />
      </button>
      <span className="text-base font-semibold text-gray-900">{title}</span>
    </div>
  )
}
