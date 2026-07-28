import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchGraphQL } from '@/lib/api/graphql'
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

  useEffect(() => {
    setIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  const { mutate: runFavoriteRequest, isPending } = useMutation({
    mutationFn: () =>
      fetchGraphQL(
        `
      mutation ToggleFavorite($productId: Int!) {
        toggleFavorite(productId: $productId) { success }
      }
    `,
        { productId }
      ),
    onMutate: () => {
      setIsFavorite((prev) => !prev)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      // 찜 목록은 일부러 무효화하지 않는다.
      // 하트를 끄자마자 항목이 사라지면 실수로 눌렀을 때 되돌릴 방법이 없다.
      // 자리에 남겨두면 한 번 더 눌러 복구할 수 있고, 화면을 나갔다 오면 정리된다.
      // 앱도 같은 규칙이다(설계 §5).
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

    if (!isLogin()) {
      setRedirectUrl(window.location.pathname)
      openLoginModal()
      return
    }

    runFavoriteRequest()
  }

  return { isFavorite, isPending, handleToggleFavorite }
}
