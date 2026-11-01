'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'

// 토스 결제창에서 취소하거나 인증에 실패하면 이 페이지로 돌아온다 (#1126).
// 이때는 서버 확정을 부르지 않는다(토스 공식 문서). 토스가 준 문구를 보여 주고 다시 시도할 길을 준다.

export default function PaymentFail() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || '결제가 완료되지 않았어요.'

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-112 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-gray-900">결제가 완료되지 않았어요</h1>
      <p className="text-sm text-gray-600">{message}</p>
      <p className="text-sm text-gray-500">채팅방에서 결제하기를 다시 눌러 주세요.</p>
      <Link href={ROUTES.CHAT} className="text-primary-600 text-sm font-semibold hover:underline">
        채팅으로 돌아가기
      </Link>
    </div>
  )
}
