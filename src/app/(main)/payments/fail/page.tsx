import { Suspense } from 'react'
import type { Metadata } from 'next'
import PaymentFail from '@/features/payment/PaymentFail'

export const metadata: Metadata = { title: '결제 실패', robots: { index: false, follow: false } }

export default function PaymentFailPage() {
  return (
    <Suspense>
      <PaymentFail />
    </Suspense>
  )
}
