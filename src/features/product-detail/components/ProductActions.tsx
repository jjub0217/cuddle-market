'use client'

import { Heart } from 'lucide-react'
import Button from '@/components/commons/button/Button'
import { useUserStore } from '@/store/userStore'
import { useRouter } from 'next/navigation'
import { useFavorite } from '@/hooks/useFavorite'
import { createChatRoom } from '@/lib/api/chatting'
import { ROUTES } from '@/constants/routes'

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

  const handleEdit = (productId: number) => {
    router.push(`/products/${productId}/edit`)
  }

  const handleChat = async () => {
    try {
      const chatRoom = await createChatRoom({ productId: id })
      sessionStorage.setItem('chatRoom', JSON.stringify(chatRoom))
      router.push(ROUTES.CHAT_ROOM_ID(chatRoom.chatRoomId))
    } catch {
      alert('채팅방 생성에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="gap-sm flex">
      <Button
        icon={Heart}
        iconProps={{
          color: isFavorite ? '#fc8181' : undefined,
          fill: isFavorite ? '#fc8181' : 'none',
        }}
        size="md"
        className="cursor-pointer border border-gray-300 bg-white"
        onClick={handleToggleFavorite}
      />
      <Button size="md" className="bg-primary-400 flex-1 cursor-pointer text-white" onClick={isMyProduct ? () => handleEdit(id) : handleChat}>
        {isMyProduct ? '수정하기' : '채팅하기'}
      </Button>
    </div>
  )
}
