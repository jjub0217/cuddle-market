'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { confirmPayment, getPaymentErrorMessage, type PaymentResult } from '@/lib/api/payment'
import { ROUTES } from '@/constants/routes'
import Spinner from '@/components/commons/spinner/Spinner'
import PaymentResultCard from './PaymentResultCard'
import ChatProductCard from '@/components/commons/card/ChatProductCard'

// 토스 결제창이 성공하면 이 페이지로 돌아온다 (#1126).
//
// 돌아온 paymentKey·orderId·amount 로 우리 서버에 확정을 부탁한다. 서버가 저장한 금액과 대조하고
// 토스 승인을 부른다. 새로고침해서 다시 불러도 서버는 같은 결과를 돌려준다(두 번 결제되지 않는다).

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = Number(searchParams.get('amount'))
  const isValid = Boolean(paymentKey && orderId && searchParams.get('amount') && Number.isFinite(amount))
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const error = isValid ? requestError : '결제 정보가 올바르지 않아요.'
  // StrictMode 는 effect 를 두 번 돌린다. 확정 요청은 한 번만 보낸다
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current || !isValid || !paymentKey || !orderId) return
    requested.current = true
    confirmPayment({ paymentKey, orderId, amount })
      .then(setResult)
      .catch((e) => setRequestError(getPaymentErrorMessage(e)))
  }, [isValid, paymentKey, orderId, amount])

  const chatHref = result?.chatRoomId ? ROUTES.CHAT_ROOM_ID(result.chatRoomId) : ROUTES.CHAT

  if (result) {
    return (
      <PaymentResultCard title="결제가 완료됐어요" href={chatHref}>
        {/* 채팅방 위쪽과 같은 상품 카드 — 방금 대화하던 그 상품이라는 게 이어져 보이게 한다(2026-11-01 사용자 결정) */}
        <div className="bg-outline-variant/20 rounded-2xl px-2.5 py-3 text-left">
          <ChatProductCard
            productImageUrl={result.productImageUrl ?? undefined}
            productTitle={result.productTitle}
            productPrice={result.amount}
            size="md"
          />
        </div>
        <p className="text-sm text-gray-500">테스트 결제예요. 실제로 돈이 나가지 않아요</p>
      </PaymentResultCard>
    )
  }
  if (error) {
    return (
      <PaymentResultCard title="결제를 마치지 못했어요" href={chatHref}>
        <p className="text-sm text-gray-600">{error}</p>
        <p className="text-sm text-gray-500">채팅방에서 결제하기를 다시 눌러 주세요.</p>
      </PaymentResultCard>
    )
  }
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Spinner size="md" />
    </div>
  )
}

