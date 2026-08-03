'use client'

import { Heart } from 'lucide-react'
import Button from '@/components/commons/button/Button'
import { useUserStore } from '@/store/userStore'
import { useRouter } from 'next/navigation'
import { useFavorite } from '@/hooks/useFavorite'
import { fetchGraphQL } from '@/lib/api/graphql'
import { ROUTES } from '@/constants/routes'

// 상세 맨 아래 단추 줄. **그 화면에서 할 가장 중요한 일**을 두는 자리다.
//
//   남의 상품   [ 채팅하기 ─────── ] [♡]
//   내 상품     [♡]
//
// 수정·삭제는 여기 없다 — 위 정보 줄의 「신고하기」가 있던 자리로 옮겼다
// (ProductOwnerActions). 자주 하는 일이 아니라 이 자리를 차지할 만하지 않다.

interface ProductActionsProps {
  isFavorite: boolean
  id: number
  sellerInfo: {
    sellerId: number
    sellerNickname: string
    sellerProfileImageUrl: string
  }
}
export default function ProductActions({ id, isFavorite: initialIsFavorite, sellerInfo }: ProductActionsProps) {
  const { user } = useUserStore()
  const router = useRouter()

  const { isFavorite, handleToggleFavorite } = useFavorite({
    productId: id,
    initialIsFavorite,
  })

  const isMyProduct = user?.id === sellerInfo?.sellerId

  const handleChat = async () => {
    try {
      const { createChatRoom: chatRoom } = await fetchGraphQL<{ createChatRoom: { chatRoomId: number } }>(
        `
        mutation CreateChatRoom($productId: Int!) {
          createChatRoom(productId: $productId) { chatRoomId }
        }
      `,
        { productId: id }
      )
      sessionStorage.setItem('chatRoom', JSON.stringify(chatRoom))
      router.push(ROUTES.CHAT_ROOM_ID(chatRoom.chatRoomId))
    } catch {
      alert('채팅방 생성에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 찜은 내 상품에도 그대로 둔다 — 찜 수가 목록에 보여 자기 상품 홍보로 쓰인다(의도된 동작).
  const favoriteButton = (
    <Button
      icon={Heart}
      iconProps={{
        color: isFavorite ? '#fc8181' : undefined,
        fill: isFavorite ? '#fc8181' : 'none',
      }}
      size="md"
      className="cursor-pointer rounded-full border border-gray-300 bg-white"
      aria-label="찜하기"
      onClick={handleToggleFavorite}
    />
  )

  if (!isMyProduct) {
    return (
      <div className="gap-sm flex">
        <Button size="md" className="bg-primary-400 flex-1 cursor-pointer text-white" onClick={handleChat}>
          채팅하기
        </Button>
        {favoriteButton}
      </div>
    )
  }

  // 내 상품에는 수정·삭제가 여기 없다 — 위 정보 줄의 「신고하기」가 있던 자리로 옮겼다
  // (ProductOwnerActions). 이 줄은 그 화면에서 할 **가장 중요한 일**을 위한 자리인데,
  // 자기 물건을 고치거나 지우는 것은 자주 하는 일이 아니다.
  //
  // 그래서 내 상품에는 찜만 남는다. 자기 상품을 찜하는 것은 찜 수를 올려 홍보하는
  // 쓰임이라 없애지 않는다(의도된 동작).
  return <div className="flex justify-end">{favoriteButton}</div>
}
