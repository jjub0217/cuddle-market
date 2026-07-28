// 상품 조회도 apiFetch를 타므로 SecureStore가 딸려 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

import type { Product } from '@cuddle/shared'

import { useAuthStore } from './auth/store'
import { fetchProductDetail, fetchProducts, ProductNotFoundError } from './products'

// fetch를 mock으로 갈아끼워 네트워크 없이 순수 로직만 검증한다.
const mockFetch = jest.fn()

/** 요청에 실린 Authorization 헤더를 꺼낸다. */
function authHeaderOf(call: unknown[]): string | undefined {
  const init = call[1] as { headers?: Record<string, string> } | undefined
  return init?.headers?.Authorization
}

beforeEach(() => {
  mockFetch.mockReset()
  // 테스트 환경엔 .env가 안 실리므로 base URL을 명시적으로 주입(가드 통과).
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api'
  // globalThis.fetch를 테스트용 mock으로 교체.
  ;(globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch
  // 기본은 비로그인. 로그인 상태가 필요한 테스트가 각자 덮어쓴다.
  useAuthStore.setState({ status: 'guest', accessToken: null, refreshToken: null })
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

  it('로그인 상태면 목록 조회에도 토큰을 붙인다', async () => {
    // 서버는 토큰이 있어야 isFavorite을 채워준다. 없으면 목록 하트가 항상 비어 보인다.
    useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts(0)

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer a-token')
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

  it('로그인 상태면 토큰을 붙여 조회한다', async () => {
    // 이 테스트가 없어서 놓쳤던 버그:
    // 토큰 없이 상세를 다시 받으면 서버가 isFavorite을 null로 준다(실측).
    // 그래서 찜을 눌러 하트가 켜졌다가, 재조회가 끝나는 순간 도로 꺼졌다.
    useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: '성공', data: makeDetail() }),
    })

    await fetchProductDetail(61)

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer a-token')
  })

  it('비로그인이면 토큰 없이 그대로 조회한다', async () => {
    // 상세는 게스트도 볼 수 있어야 한다. 토큰이 없다고 요청을 막으면 안 된다.
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: '성공', data: makeDetail() }),
    })

    await fetchProductDetail(61)

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBeUndefined()
  })
})
