'use client'

import { useRouter } from 'next/navigation'
import ProductCard from '@/components/product/ProductCard'
import { useLoginModalStore } from '@/store/modalStore'
import { useUserStore } from '@/store/userStore'
import type { Product } from '@/types'
import { cn } from '@/lib/utils/cn'

interface ProductListProps {
  products: Product[]
  showMoreButton?: boolean
  sellerId?: number
}

export default function ProductList({ products, showMoreButton = false, sellerId }: ProductListProps) {
  const { isLogin, setRedirectUrl } = useUserStore()
  const { openLoginModal } = useLoginModalStore()
  const router = useRouter()
  const goToUserPage = (sellerId: number) => {
    if (!isLogin()) {
      setRedirectUrl(window.location.pathname)
      openLoginModal()
      return
    }
    router.push(`/user-profile/${sellerId}`)
  }
  return (
    <ul className={cn('grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4', showMoreButton && sellerId && 'items-center')}>
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard data-index={index} data={product} />
        </li>
      ))}
      {showMoreButton && sellerId && products.length >= 4 && (
        <button
          type="button"
          onClick={() => goToUserPage(sellerId)}
          className="bg-primary-300 h-fit w-full cursor-pointer rounded-lg px-4 py-2.5 font-bold text-white md:w-fit md:rounded-full md:py-5"
        >
          더보기
        </button>
      )}
    </ul>
  )
}
