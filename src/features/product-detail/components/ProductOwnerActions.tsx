'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import { ROUTES } from '@/constants/routes'

const DeleteConfirmModal = dynamic(() => import('@/components/modal/DeleteConfirmModal'))

// 내 상품에서 「신고하기」가 있던 자리에 들어가는 것 — 수정 · 삭제.
//
// 왜 여기인가: 그 자리는 「이 상품에 대해 내가 할 관리 행동」이다. 남의 것이면 신고,
// 내 것이면 수정·삭제다. 예전에는 신고는 위, 수정·삭제는 맨 아래 채운 단추로 흩어져
// 있었는데, 같은 성격인데 자리가 달랐다.
//
// 글자 단추로 조용히 두는 이유: 자주 하는 일이 아니다. 아래 단추 줄은 그 화면에서
// 할 가장 중요한 일(남의 상품이면 채팅하기)을 위한 자리다.

interface ProductOwnerActionsProps {
  productId: number
  title: string
  price: number
  mainImageUrl: string
}

export default function ProductOwnerActions({ productId, title, price, mainImageUrl }: ProductOwnerActionsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<React.ReactNode | null>(null)

  const { mutate: deleteProductMutate } = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
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

  return (
    <>
      {/* 크기는 이 줄의 이웃(조회·찜, 등록일·지역)과 같게 간다. 한 줄에 나란히 있는데
          크기가 다르면 실수처럼 보인다. 원래 이 자리에 있던 「신고하기」도 폭에 따라
          text-xs ↔ text-sm으로 바뀐다. */}
      <div className="flex items-center gap-2 text-xs md:text-sm">
        <button
          type="button"
          onClick={() => router.push(`/products/${productId}/edit`)}
          className="cursor-pointer text-gray-400 hover:text-gray-600"
        >
          수정
        </button>
        <span aria-hidden className="text-gray-300">
          ·
        </span>
        {/* 삭제만 붉게 물든다 — 되돌릴 수 없는 쪽을 손이 가기 전에 가려낼 단서가 있어야 한다.
            평소에는 수정과 같은 회색이라 이 줄이 시끄러워지지 않는다. */}
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="cursor-pointer text-gray-400 hover:text-red-500"
        >
          삭제
        </button>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        product={{ id: productId, title, price, mainImageUrl }}
        onConfirm={(id: number) => deleteProductMutate(id)}
        onCancel={() => setIsDeleteModalOpen(false)}
        error={deleteError}
        onClearError={() => setDeleteError(null)}
      />
    </>
  )
}
