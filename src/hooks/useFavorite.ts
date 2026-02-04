import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addFavorite } from '@/lib/api/products'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'

interface UseFavoriteOptions {
  productId: number
  initialIsFavorite: boolean
}

export function useFavorite({ productId, initialIsFavorite }: UseFavoriteOptions) {
  const { isLogin, setRedirectUrl } = useUserStore()
  const { openLoginModal } = useLoginModalStore()
  const queryClient = useQueryClient()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)

  // initialIsFavorite가 변경되면 로컬 state 동기화 (서버 데이터 반영)
  useEffect(() => {
    setIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  const { mutate: toggleFavorite, isPending } = useMutation({
    mutationFn: () => addFavorite(productId),
    onMutate: () => {
      // Optimistic Update: API 호출 전 즉시 UI 토글
      setIsFavorite((prev) => !prev)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      setIsFavorite(initialIsFavorite)
    },
  })

  const handleToggleFavorite = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (isPending) return

    // 미로그인 시 로그인 모달 열기
    if (!isLogin()) {
      setRedirectUrl(window.location.pathname)
      openLoginModal()
      return
    }

    toggleFavorite()
  }

  return {
    isFavorite,
    isPending,
    handleToggleFavorite,
  }
}
