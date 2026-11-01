import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Z_INDEX } from '@/constants/ui'

// 결제 결과를 다른 확인창들과 같은 모달 모양으로 보인다 (#1126, 2026-11-01 사용자 요청).
// 결제창에서 돌아온 주소라 페이지지만, 화면을 덮는 어두운 바탕 위에 카드 하나만 띄운다.
//
// ⚠️ 폭은 max-w-112(448px)다. max-w-md 는 Tailwind v4 에서 여백 토큰(32px)으로 풀린다.

interface PaymentResultCardProps {
  title: string
  children: ReactNode
  href: string
}

export default function PaymentResultCard({ title, children, href }: PaymentResultCardProps) {
  return (
    <div className={cn('fixed inset-0 flex items-center justify-center bg-gray-900/70 px-4', Z_INDEX.MODAL)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-result-title"
        className="flex w-full max-w-112 flex-col gap-4 rounded-lg bg-white p-5 text-center"
      >
        <h1 id="payment-result-title" className="text-lg font-bold text-gray-900">
          {title}
        </h1>
        {children}
        <Link href={href} className="bg-primary-600 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          채팅방으로 가기
        </Link>
      </div>
    </div>
  )
}
