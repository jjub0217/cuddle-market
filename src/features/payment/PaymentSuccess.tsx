'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { confirmPayment, getPaymentErrorMessage, type PaymentResult } from '@/lib/api/payment'
import { formatPrice } from '@/lib/utils/formatPrice'
import { ROUTES } from '@/constants/routes'
import Spinner from '@/components/commons/spinner/Spinner'

// 토스 결제창이 성공하면 이 페이지로 돌아온다 (#1126).
//
// 돌아온 paymentKey·orderId·amount 로 우리 서버에 확정을 부탁한다. 서버가 저장한 금액과 대조하고
// 토스 승인을 부른다. 새로고침해서 다시 불러도 서버는 같은 결과를 돌려준다(두 번 결제되지 않는다).

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  // StrictMode 는 effect 를 두 번 돌린다. 확정 요청은 한 번만 보낸다
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = Number(searchParams.get('amount'))
    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      setError('결제 정보가 올바르지 않아요.')
      return
    }
    confirmPayment({ paymentKey, orderId, amount })
      .then(setResult)
      .catch((e) => setError(getPaymentErrorMessage(e)))
  }, [searchParams])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {result ? (
        <>
          <h1 className="text-xl font-bold text-gray-900">결제가 완료됐어요</h1>
          <p className="text-base text-gray-900">{result.productTitle}</p>
          <p className="text-lg font-bold text-gray-900">{formatPrice(result.amount)} 원</p>
          <p className="text-sm text-gray-500">테스트 결제예요. 실제로 돈이 나가지 않아요</p>
        </>
      ) : error ? (
        <>
          <h1 className="text-xl font-bold text-gray-900">결제를 마치지 못했어요</h1>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-sm text-gray-500">채팅방에서 결제하기를 다시 눌러 주세요.</p>
        </>
      ) : (
        <Spinner size="md" />
      )}
      {result || error ? (
        <Link href={ROUTES.CHAT} className="text-primary-600 text-sm font-semibold hover:underline">
          채팅으로 돌아가기
        </Link>
      ) : null}
    </div>
  )
}
