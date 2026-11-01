'use client'

import { useState } from 'react'
import Button from '@/components/commons/button/Button'
import { formatPrice } from '@/lib/utils/formatPrice'
import { createPaymentOrder, getPaymentErrorMessage } from '@/lib/api/payment'
import { isTossReady, startCardPayment } from '@/lib/payments/toss'

// 예약자 본인의 채팅방에만 보이는 결제하기 (#1126, 설계 9절).
//
// 가격은 채팅방에 저장된 옛 값이 아니라 **지금 상품 가격**이다 — 깎았으면 판매자가 상품 가격을 고친다.
// 금액은 서버가 주문을 만들며 정하고, 확정할 때 다시 대조한다. 여기서 보내는 값을 믿지 않는다.

interface PayButtonProps {
  productId: number
  price: number | undefined
}

export default function PayButton({ productId, price }: PayButtonProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ready = isTossReady()

  const handlePay = async () => {
    // disabled 대신 aria-disabled 로 막는다 — disabled 는 초점을 강제로 뗀다(CLAUDE.md)
    if (!ready || isStarting) return
    setError(null)
    setIsStarting(true)
    try {
      const order = await createPaymentOrder(productId)
      await startCardPayment(order)
    } catch (e) {
      setError(getPaymentErrorMessage(e))
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-primary-100 bg-primary-50/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-gray-900">{price != null ? `${formatPrice(price)} 원` : ''}</span>
        <Button
          type="button"
          size="sm"
          aria-disabled={!ready || isStarting}
          onClick={handlePay}
          className="bg-primary-600 cursor-pointer rounded-lg text-white aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          {ready ? '결제하기' : '결제 준비 중'}
        </Button>
      </div>
      <p className="text-xs text-gray-500">테스트 결제예요. 실제로 돈이 나가지 않아요</p>
      {error ? (
        <p role="alert" className="text-xs text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
