import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductsSection } from './ProductsSection'

// next/navigation은 실제 라우터가 있어야 돌아간다. 가짜로 둔다.
// (useFilterNavigation은 Provider 밖에서 이 셋으로 되돌아간다 — useFilterNavigation.tsx)
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

// 목록 위 **개수 줄**만 본다(#1026). 검색 중에는 거기에 검색어가 같이 적혀야 한다 —
// 좁은 폭에서는 검색칸이 MobileSearchOverlay 안에만 있어 엔터를 치면 검색어가 사라지고,
// 그러면 결과만 보고는 무엇으로 검색했는지 알 수가 없다.
//
// ⚠️ 상품 카드는 안 그린다(`products={[]}`). 여기서 지키려는 것은 카드가 아니라 그 윗줄이고,
//    개수는 `totalElements`가 따로 들고 있어서 빈 배열로도 그 줄을 볼 수 있다.
describe('ProductsSection 개수 줄', () => {
  it('검색 중이 아니면 개수만 적는다', () => {
    render(<ProductsSection products={[]} totalElements={61} activeTab="tab-all" />)

    expect(screen.getByText('상품 61개')).toBeInTheDocument()
  })

  it('검색 중이면 검색어를 같이 적는다', () => {
    render(<ProductsSection products={[]} totalElements={1} activeTab="tab-all" keyword="강아지" />)

    expect(screen.getByText("'강아지' 검색 결과 1개")).toBeInTheDocument()
  })

  it('검색어가 빈 글자면 개수만 적는다', () => {
    // `?keyword=` 처럼 값이 비어 오는 경우. 「'' 검색 결과」가 되면 안 된다.
    render(<ProductsSection products={[]} totalElements={61} activeTab="tab-all" keyword="" />)

    expect(screen.getByText('상품 61개')).toBeInTheDocument()
  })
})
