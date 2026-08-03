'use client'

import { useState } from 'react'
import { EllipsisVertical, Heart } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '@/components/commons/button/Button'
import IconButton from '@/components/commons/button/IconButton'
import { BottomSheet, BottomSheetItem } from '@/components/commons/BottomSheet'
import { useUserStore } from '@/store/userStore'
import { useRouter } from 'next/navigation'
import { useFavorite } from '@/hooks/useFavorite'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { fetchGraphQL } from '@/lib/api/graphql'
import { api } from '@/lib/api/api'
import { ROUTES } from '@/constants/routes'

const DeleteConfirmModal = dynamic(() => import('@/components/modal/DeleteConfirmModal'))

interface ProductActionsProps {
  isFavorite: boolean
  id: number
  title: string
  price: number
  mainImageUrl: string
  sellerInfo: {
    sellerId: number
    sellerNickname: string
    sellerProfileImageUrl: string
  }
}
export default function ProductActions({
  id,
  title,
  price,
  mainImageUrl,
  isFavorite: initialIsFavorite,
  sellerInfo,
}: ProductActionsProps) {
  const { user } = useUserStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isMd = useMediaQuery('(min-width: 768px)')

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<React.ReactNode | null>(null)

  const { isFavorite, handleToggleFavorite } = useFavorite({
    productId: id,
    initialIsFavorite,
  })

  const isMyProduct = user?.id === sellerInfo?.sellerId

  const handleEdit = (productId: number) => {
    router.push(`/products/${productId}/edit`)
  }

  const { mutate: deleteProductMutate } = useMutation({
    mutationFn: (productId: number) => api.delete(`/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['myProducts'] })
      setIsDeleteModalOpen(false)
      // 지운 상품의 상세에 머물 수 없다. 목록(홈)으로 보낸다.
      router.push(ROUTES.HOME)
    },
    onError: () => {
      setDeleteError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">상품 삭제에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    },
  })

  const handleOpenDeleteModal = () => {
    setIsMoreMenuOpen(false)
    setIsDeleteModalOpen(true)
  }

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

  return (
    <>
      {/* 내 상품 관리(수정·삭제)를 왼쪽에 묶고, 성격이 다른 찜은 오른쪽 끝으로 떼어 둔다. */}
      <div className="gap-sm flex items-center justify-between">
        {isMd ? (
          <div className="gap-sm flex">
            <Button size="md" className="bg-primary-400 cursor-pointer px-6 text-white" onClick={() => handleEdit(id)}>
              수정
            </Button>
            {/* 삭제는 붉은 계열로 갈라 둔다 — 수정 옆에 같은 모양으로 두면 잘못 누르기 쉽다.
                채우지 않고 테두리로만 붉게 두는 건, 되돌릴 수 없는 단추가 수정보다
                먼저 눈에 들어오면 안 되기 때문이다. */}
            <Button
              size="md"
              className="border-danger-600 text-danger-600 hover:bg-danger-600 cursor-pointer border px-6 hover:text-white"
              onClick={handleOpenDeleteModal}
            >
              삭제
            </Button>
          </div>
        ) : (
          <div className="relative">
            <IconButton
              size="lg"
              className="border border-gray-300 bg-white"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              aria-label="상품 옵션 메뉴 열기"
            >
              <EllipsisVertical size={20} className="text-gray-500" />
            </IconButton>
            {/* 좁은 폭에서는 아래에서 올라오는 시트로 연다. 마이 목록(MyList)·앱과 같은 모양이다(#793). */}
            <BottomSheet isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} label={`${title} 상품 메뉴`}>
              <BottomSheetItem onClick={() => handleEdit(id)}>
                <span>수정하기</span>
              </BottomSheetItem>
              <BottomSheetItem tone="danger" onClick={handleOpenDeleteModal}>
                <span>삭제</span>
              </BottomSheetItem>
            </BottomSheet>
          </div>
        )}
        {favoriteButton}
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        product={{ id, title, price, mainImageUrl }}
        onConfirm={(productId: number) => deleteProductMutate(productId)}
        onCancel={() => setIsDeleteModalOpen(false)}
        error={deleteError}
        onClearError={() => setDeleteError(null)}
      />
    </>
  )
}
