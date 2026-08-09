'use client'

import ProductCard from '@/components/product/ProductCard'
import { useLoginModalStore } from '@/store/modalStore'
import { useUserStore } from '@/store/userStore'
import type { Product } from '@/types/product'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/constants/routes'

interface ProductListProps {
  products: Product[]
  showMoreButton?: boolean
  sellerId?: number
  hideProductType?: boolean
}

export default function ProductList({ products, showMoreButton = false, sellerId, hideProductType }: ProductListProps) {
  const { user, isLogin, setRedirectUrl } = useUserStore()
  const { openLoginModal } = useLoginModalStore()
  const router = useRouter()
  const pathname = usePathname()
  const goToUserPage = (sellerId: number) => {
    if (!isLogin()) {
      setRedirectUrl(pathname)
      openLoginModal()
      return
    }
    // 내 프로필이면 마이페이지로. SellerProfileCard 와 같은 규칙이다(#869).
    router.push(sellerId === user?.id ? ROUTES.MYPAGE : `/user-profile/${sellerId}`)
  }
  return (
    <ul
      className={cn('grid grid-cols-1 gap-4 md:grid-cols-4 md:pt-5 lg:grid-cols-5', showMoreButton && sellerId && 'items-center')}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard data-index={index} data={product} hideProductType={hideProductType} />
        </li>
      ))}
      {showMoreButton && sellerId && products.length >= 4 ? (
        <button
          type="button"
          onClick={() => goToUserPage(sellerId)}
          className="bg-primary-600 h-fit w-full cursor-pointer rounded-lg px-4 py-2.5 font-bold text-white md:w-fit md:rounded-full md:py-5"
        >
          더보기
        </button>
      ) : null}
    </ul>
  )
}
