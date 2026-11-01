import { Suspense } from 'react'
import type { Metadata } from 'next'
import PaymentSuccess from '@/features/payment/PaymentSuccess'

export const metadata: Metadata = { title: '결제 완료', robots: { index: false, follow: false } }

export default function PaymentSuccessPage() {
  // useSearchParams 를 쓰는 화면은 Suspense 안에 둬야 빌드가 통과한다
  return (
    <Suspense>
      <PaymentSuccess />
    </Suspense>
  )
}
