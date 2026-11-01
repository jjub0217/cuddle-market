'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { confirmPayment, getPaymentErrorMessage, type PaymentResult } from '@/lib/api/payment'
import { formatPrice } from '@/lib/utils/formatPrice'
import { ROUTES } from '@/constants/routes'
import Spinner from '@/components/commons/spinner/Spinner'
import PaymentResultCard from './PaymentResultCard'
import { PLACEHOLDER_IMAGES, toResizedWebpUrl } from '@/lib/utils/imageUrl'

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
        <ProductImage src={result.productImageUrl} alt={result.productTitle} />
        <div className="flex flex-col gap-1">
          <p className="text-base text-gray-900">{result.productTitle}</p>
          <p className="text-lg font-bold text-gray-900">{formatPrice(result.amount)} 원</p>
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

// 상품 사진. 우리 이미지 서버(CDN)의 400px 판을 쓰고, 못 불러오면 원본 → 기본 그림 순으로 바꾼다(MyList 와 같은 순서)
function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  const [stage, setStage] = useState<'resized' | 'original' | 'placeholder'>(src ? 'resized' : 'placeholder')
  const url = stage === 'resized' ? toResizedWebpUrl(src, 400) : stage === 'original' ? (src ?? '') : PLACEHOLDER_IMAGES[400]
  // CDN 이미지라 next/image 대신 img 를 쓴다(이 저장소 관례)
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className="mx-auto size-28 rounded-xl object-cover" onError={() => setStage((s) => (s === 'resized' ? 'original' : 'placeholder'))} />
}
