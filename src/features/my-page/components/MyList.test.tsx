import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import MyList from './MyList'
import type { Product } from '@/types'

// 마이페이지 목록 카드의 썸네일 뱃지.
//
// 예전에는 문구를 탭으로 골랐다 — `isPurchasesTab ? '구매완료' : '판매완료'`.
// 그런데 'tab-purchases' 탭의 실제 이름은 「판매요청」이라(constants.ts 의 MY_PAGE_TABS),
// 판매요청 글이 끝났는데 「구매완료」가 보였다. 지금은 공용 함수 `getTradeLabel`
// (원본 packages/shared)이 문구를 정하고, 그 함수는 상품의 `productType` 으로 가른다.
//
// jsdom 은 배치를 안 재므로 「어디에 몇 픽셀로 그려졌나」는 못 본다. 여기서는 글자만 본다.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// jsdom 에는 matchMedia 가 없다. 폭을 시험마다 손으로 정한다.
// 기본은 좁은 폭(모바일). 데스크탑 전용 단추를 볼 때만 넓은 폭으로 바꾼다
let isWide = false
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => isWide,
}))

beforeEach(() => {
  isWide = false
})

const baseProduct: Product = {
  id: 1,
  productType: 'SELL',
  tradeStatus: 'SELLING',
  petDetailType: 'DOG_SMALL',
  productStatus: 'NEW',
  title: '강아지 유모차',
  price: 30000,
  mainImageUrl: '',
  createdAt: '2026-08-01T00:00:00',
  favoriteCount: 0,
  isFavorite: false,
  viewCount: 0,
}

function renderMyList(overrides: Partial<Product> & { activeTab?: 'tab-sales' | 'tab-purchases' }) {
  const { activeTab = 'tab-sales', ...productOverrides } = overrides
  return render(
    <MyList {...baseProduct} {...productOverrides} activeTab={activeTab} handleConfirmModal={() => {}} />
  )
}

describe('마이페이지 목록 카드의 거래 상태 뱃지', () => {
  it("판매상품(SELL) 이 COMPLETED 면 「판매완료」가 보인다", () => {
    renderMyList({ productType: 'SELL', tradeStatus: 'COMPLETED', activeTab: 'tab-sales' })

    expect(screen.getByText('판매완료')).toBeInTheDocument()
  })

  it("판매요청(REQUEST) 이 COMPLETED 면 「요청완료」가 보인다 — 「구매완료」가 아니다", () => {
    renderMyList({ productType: 'REQUEST', tradeStatus: 'COMPLETED', activeTab: 'tab-purchases' })

    expect(screen.getByText('요청완료')).toBeInTheDocument()
    // 「구매」 갈래 말이 이 카드 어디에도 안 남아 있어야 한다
    expect(screen.queryByText(/구매/)).not.toBeInTheDocument()
  })

  it('판매상품(SELL) 이 RESERVED 면 「예약중」이 보인다', () => {
    renderMyList({ productType: 'SELL', tradeStatus: 'RESERVED', activeTab: 'tab-sales' })

    expect(screen.getByText('예약중')).toBeInTheDocument()
  })

  it('판매요청(REQUEST) 이 RESERVED 면 「예약중」이 보인다', () => {
    renderMyList({ productType: 'REQUEST', tradeStatus: 'RESERVED', activeTab: 'tab-purchases' })

    expect(screen.getByText('예약중')).toBeInTheDocument()
  })

  // 오른쪽 단추 칸은 넓은 폭에서만 그려진다(MyList 안의 `isMd`)
  it('판매요청(REQUEST) 이 아직 안 끝났으면 단추가 「요청완료」다 — 「구매완료」가 아니다', () => {
    isWide = true
    renderMyList({ productType: 'REQUEST', tradeStatus: 'SELLING', activeTab: 'tab-purchases' })

    expect(screen.getByRole('button', { name: '요청완료' })).toBeInTheDocument()
    expect(screen.queryByText(/구매/)).not.toBeInTheDocument()
  })

  it('SELLING 이면 뱃지를 안 그린다', () => {
    renderMyList({ productType: 'SELL', tradeStatus: 'SELLING', activeTab: 'tab-sales' })

    expect(screen.queryByText('판매중')).not.toBeInTheDocument()
    expect(screen.queryByText('판매완료')).not.toBeInTheDocument()
    expect(screen.queryByText('예약중')).not.toBeInTheDocument()
  })
})
