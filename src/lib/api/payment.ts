import { api } from './api'

// 토스페이먼츠 테스트 결제 (#1126). 금액은 서버가 정하고, 확정도 서버가 한다.
// 토스 API 는 웹에서 직접 부르지 않는다 — 비밀 키가 서버에만 있다.

export interface PaymentOrder {
  orderId: string
  amount: number
  orderName: string
}

export interface PaymentResult {
  orderId: string
  amount: number
  productId: number
  productTitle: string
  approvedAt: string | null
}

export async function createPaymentOrder(productId: number): Promise<PaymentOrder> {
  const response = await api.post('/payments/orders', { productId })
  return response.data.data
}

export async function confirmPayment(input: { paymentKey: string; orderId: string; amount: number }): Promise<PaymentResult> {
  const response = await api.post('/payments/confirm', input)
  return response.data.data
}

/** 서버 오류 응답의 문구. 없으면 기본 문구 */
export function getPaymentErrorMessage(error: unknown): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  return message || '결제를 확인하지 못했어요. 잠시 후 다시 시도해주세요.'
}
