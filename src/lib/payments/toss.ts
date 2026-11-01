import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk'
import type { PaymentOrder } from '@/lib/api/payment'

// 토스 결제창을 연다 (#1126, 공식 v2 SDK).
//
// 클라이언트 키는 브라우저에 보이는 값이라 NEXT_PUBLIC_ 이름이다. 비밀 키는 여기에 절대 두지 않는다.
// 결제 수단은 카드 하나 — 일부 간편결제는 테스트 환경에서 동작하지 않는다.

export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY

export function isTossReady(): boolean {
  return Boolean(TOSS_CLIENT_KEY)
}

export async function startCardPayment(order: PaymentOrder, customerKey: string = ANONYMOUS): Promise<void> {
  if (!TOSS_CLIENT_KEY) throw new Error('결제 준비 중입니다.')
  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
  await tossPayments.payment({ customerKey }).requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: order.amount },
    orderId: order.orderId,
    orderName: order.orderName,
    successUrl: `${window.location.origin}/payments/success`,
    failUrl: `${window.location.origin}/payments/fail`,
  })
}
