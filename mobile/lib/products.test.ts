import type { Product } from '@cuddle/shared'

import { fetchProductDetail, fetchProducts, ProductNotFoundError } from './products'

// fetch를 mock으로 갈아끼워 네트워크 없이 순수 로직만 검증한다.
const mockFetch = jest.fn()

beforeEach(() => {
  mockFetch.mockReset()
  // 테스트 환경엔 .env가 안 실리므로 base URL을 명시적으로 주입(가드 통과).
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api'
  // globalThis.fetch를 테스트용 mock으로 교체.
  ;(globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch
})

// data.content 한 건을 만드는 최소 헬퍼.
function makeProduct(id: number): Product {
  return {
    id,
    productType: 'SELL',
    tradeStatus: 'SELLING',
    petDetailType: 'DOG',
    productStatus: 'USED',
    title: `상품 ${id}`,
    price: 1000 * id,
    mainImageUrl: 'https://cdn.example.com/a.webp',
    createdAt: '2026-07-21T00:00:00Z',
    favoriteCount: 0,
    isFavorite: false,
  }
}

describe('fetchProducts', () => {
  it('200 응답이면 data(content + hasNext)를 반환한다', async () => {
    const data = {
      page: 0,
      size: 20,
      total: 1,
      content: [makeProduct(1)],
      totalPages: 1,
      hasNext: true,
      hasPrevious: false,
      totalElements: 1,
      numberOfElements: 1,
    }
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data }),
    })

    const result = await fetchProducts(0)

    expect(result.content).toHaveLength(1)
    expect(result.hasNext).toBe(true)
  })

  it('page/size 쿼리 파라미터를 붙여 /products/search를 호출한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts(2)

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('/products/search')
    expect(calledUrl).toContain('page=2')
    expect(calledUrl).toContain('size=20')
  })

  it('res.ok가 false면 throw한다 (HTTP status 기준)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    await expect(fetchProducts(0)).rejects.toThrow()
  })

  it('EXPO_PUBLIC_API_BASE_URL 미설정이면 명확히 throw한다', async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    await expect(fetchProducts(0)).rejects.toThrow('EXPO_PUBLIC_API_BASE_URL')
  })
})

function makeDetail() {
  return {
    ...makeProduct(61),
    category: 'FOOD',
    description: '두부간식 잘먹어요',
    subImageUrls: [],
    addressSido: '서울특별시',
    addressGugun: '은평구',
    viewCount: 12,
    sellerInfo: {
      sellerId: 28,
      sellerNickname: '유리',
      sellerProfileImageUrl: null,
      addressSido: '서울특별시',
      addressGugun: '은평구',
    },
    sellerOtherProducts: [],
  }
}

describe('fetchProductDetail', () => {
  it('200이면 data를 그대로 반환한다', async () => {
    const detail = makeDetail()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: '성공', data: detail }),
    })

    const result = await fetchProductDetail(61)

    expect(result.title).toBe('상품 61')
    expect(result.sellerInfo.sellerNickname).toBe('유리')
  })

  it('/products/{id} 를 호출한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: '성공', data: makeDetail() }),
    })

    await fetchProductDetail(61)

    expect(mockFetch.mock.calls[0][0]).toContain('/products/61')
  })

  it('404면 ProductNotFoundError를 던진다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })

    await expect(fetchProductDetail(55)).rejects.toBeInstanceOf(ProductNotFoundError)
  })

  it('404가 아닌 실패는 일반 오류를 던진다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    const promise = fetchProductDetail(61)
    await expect(promise).rejects.toThrow()
    await expect(promise).rejects.not.toBeInstanceOf(ProductNotFoundError)
  })

  it('EXPO_PUBLIC_API_BASE_URL 미설정이면 명확히 throw한다', async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    await expect(fetchProductDetail(61)).rejects.toThrow('EXPO_PUBLIC_API_BASE_URL')
  })
})
