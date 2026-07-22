import type { Product } from '@cuddle/shared'

import { fetchProducts } from './products'

// fetch를 mock으로 갈아끼워 네트워크 없이 순수 로직만 검증한다.
const mockFetch = jest.fn()

beforeEach(() => {
  mockFetch.mockReset()
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
})
