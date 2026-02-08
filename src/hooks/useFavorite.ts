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

  useEffect(() => {
    setIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  const { mutate: toggleFavorite, isPending } = useMutation({
    mutationFn: () => addFavorite(productId),
    onMutate: () => {
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

    if (!isLogin()) {
      setRedirectUrl(window.location.pathname)
      openLoginModal()
      return
    }

    toggleFavorite()
  }

  return { isFavorite, isPending, handleToggleFavorite }
}
