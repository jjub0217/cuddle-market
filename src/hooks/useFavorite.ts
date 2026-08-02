import { useState } from 'react'
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

  // 서버가 준 값이 바뀌면(목록을 새로 받는 등) 하트를 거기에 맞춘다.
  //
  // 예전에는 useEffect로 했는데, 그러면 한 번 그린 뒤에 또 그린다 —
  // 잠깐 옛 하트가 보였다 바뀐다. react-hooks/set-state-in-effect가 그걸 잡는다.
  //
  // 렌더 도중에 맞추면 React가 화면에 내보내기 전에 다시 그려서 깜빡임이 없다.
  // 「이전 값을 기억해 두고 달라졌을 때만」이 핵심이다 — 그냥 대입하면 매번 돌아
  // 눌러 둔 하트가 되돌아간다.
  // (react.dev 「You Might Not Need an Effect」의 prop이 바뀔 때 state 조정하기)
  const [prevInitial, setPrevInitial] = useState(initialIsFavorite)
  if (prevInitial !== initialIsFavorite) {
    setPrevInitial(initialIsFavorite)
    setIsFavorite(initialIsFavorite)
  }

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
