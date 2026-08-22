// 상품 조회도 apiFetch를 타므로 SecureStore가 딸려 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

import type { Product } from '@cuddle/shared'

import { useAuthStore } from './auth/store'
import {
  createProduct,
  deleteProduct,
  fetchProductDetail,
  fetchProducts,
  ProductNotFoundError,
  updateProduct,
  type ProductPayload,
} from './products'

// fetch를 mock으로 갈아끼워 네트워크 없이 순수 로직만 검증한다.
const mockFetch = jest.fn()

/** 요청에 실린 Authorization 헤더를 꺼낸다. */
function authHeaderOf(call: unknown[]): string | undefined {
  const init = call[1] as { headers?: Record<string, string> } | undefined
  return init?.headers?.Authorization
}

/** 요청에 실린 두 번째 인자(method·body 등)를 꺼낸다. */
function initOf(call: unknown[]): { method?: string; body?: string } {
  return (call[1] ?? {}) as { method?: string; body?: string }
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

    const result = await fetchProducts({ page: 0 })

    expect(result.content).toHaveLength(1)
    expect(result.hasNext).toBe(true)
  })

  it('page/size 쿼리 파라미터를 붙여 /products/search를 호출한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({ page: 2 })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('/products/search')
    expect(calledUrl).toContain('page=2')
    expect(calledUrl).toContain('size=20')
  })


  // ----- 조건(검색어·필터) -----
  //
  // 홈과 검색 결과가 같은 함수를 쓴다. 조건은 있을 때만 실어야 한다 —
  // 빈 값을 그대로 실으면 서버가 「이름이 빈 종류」를 찾는다.

  it('조건을 안 주면 page·size 만 보낸다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({ page: 0 })

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).not.toContain('keyword')
    expect(url).not.toContain('petType')
    expect(url).not.toContain('categories')
  })

  it('검색어·대분류·카테고리를 쿼리에 싣는다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({ page: 0, keyword: '강아지 사료', petType: 'MAMMAL', categories: 'FOOD' })

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('petType=MAMMAL')
    expect(url).toContain('categories=FOOD')
    // 한글은 주소에 실을 수 있게 바뀐다.
    // ⚠️ **공백은 %20 이 아니라 + 다.** URLSearchParams 가 그렇게 쓴다
    //    (encodeURIComponent 는 %20 을 쓴다 — 둘이 다르다).
    //    query string 에서 + 는 공백을 뜻하므로 서버(Spring)가 제대로 읽는다.
    expect(url).toContain('keyword=%EA%B0%95%EC%95%84%EC%A7%80+%EC%82%AC%EB%A3%8C')
  })

  it('빈 값은 아예 안 싣는다 — 「전체」가 이 경우다', async () => {
    // 알약의 「전체」는 null 이다. 'ALL' 같은 글자를 보내면 서버가 그런 종류를 찾는다.
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({ page: 0, keyword: '', petType: undefined, categories: '' })

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).not.toContain('keyword')
    expect(url).not.toContain('petType')
    expect(url).not.toContain('categories')
  })

  it('세부 조건(소분류·판매유형·상태·지역·정렬)도 쿼리에 싣는다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({
      page: 0,
      petDetailType: 'DOG',
      productType: 'SELL',
      productStatuses: 'USED',
      addressSido: '서울특별시',
      addressGugun: '은평구',
      sortBy: 'price',
      sortOrder: 'asc',
    })

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('petDetailType=DOG')
    expect(url).toContain('productType=SELL')
    expect(url).toContain('productStatuses=USED')
    expect(url).toContain('sortBy=price')
    expect(url).toContain('sortOrder=asc')
    // 한글 지역도 주소에 실을 수 있게 바뀐다
    expect(url).toContain('addressSido=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C')
    expect(url).toContain('addressGugun=%EC%9D%80%ED%8F%89%EA%B5%AC')
  })

  it('거래 상태(판매중)를 tradeStatuses 로 싣고, 없으면 아예 안 싣는다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({ page: 0, tradeStatuses: 'SELLING' })
    expect(mockFetch.mock.calls[0][0] as string).toContain('tradeStatuses=SELLING')

    await fetchProducts({ page: 0 })
    expect(mockFetch.mock.calls[1][0] as string).not.toContain('tradeStatuses')
  })

  it('가격 구간을 minPrice·maxPrice 로 싣는다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({ page: 0, minPrice: 10000, maxPrice: 50000 })

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('minPrice=10000')
    expect(url).toContain('maxPrice=50000')
  })

  it('minPrice 가 0이어도 싣는다', async () => {
    // ⚠️ 0 은 거짓값이다. `if (값)` 으로 거르면 「0원부터」가 조용히 사라진다.
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({ page: 0, minPrice: 0, maxPrice: 10000 })

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('minPrice=0')
  })

  it('위 끝이 없는 구간은 maxPrice 를 안 싣는다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({ page: 0, minPrice: 100000 })

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('minPrice=100000')
    expect(url).not.toContain('maxPrice')
  })

  it('res.ok가 false면 throw한다 (HTTP status 기준)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    await expect(fetchProducts({ page: 0 })).rejects.toThrow()
  })

  it('EXPO_PUBLIC_API_BASE_URL 미설정이면 명확히 throw한다', async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    await expect(fetchProducts({ page: 0 })).rejects.toThrow('EXPO_PUBLIC_API_BASE_URL')
  })

  it('로그인 상태면 목록 조회에도 토큰을 붙인다', async () => {
    // 서버는 토큰이 있어야 isFavorite을 채워준다. 없으면 목록 하트가 항상 비어 보인다.
    useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: 'ok', data: { content: [], hasNext: false } }),
    })

    await fetchProducts({ page: 0 })

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

// ── 등록·수정·삭제 ─────────────────────────────────────────────
//
// 서버가 전체 교체를 요구하므로 등록과 수정이 **같은 모양**을 보낸다
// (ProductServiceImpl:235-247 · 요청 DTO 필수 항목에 전부 @NotNull).
// 하나라도 빠지면 400이 나거나 그 값이 비워진다.

function payload(overrides: Partial<ProductPayload> = {}): ProductPayload {
  return {
    petType: 'MAMMAL',
    petDetailType: 'DOG',
    category: 'FOOD',
    title: '강아지 사료 10kg',
    description: '거의 새것입니다.',
    price: 30000,
    productStatus: 'LIKE_NEW',
    mainImageUrl: 'https://cdn/a.webp',
    subImageUrls: ['https://cdn/b.webp'],
    addressSido: '서울특별시',
    addressGugun: '강남구',
    ...overrides,
  }
}

describe('createProduct', () => {
  it('만든 상품 id를 돌려준다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'CREATED', message: '성공', data: { id: 123 } }),
    })

    await expect(createProduct(payload())).resolves.toBe(123)
  })

  it('POST /products로 보낸다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    })

    await createProduct(payload())

    expect(mockFetch.mock.calls[0][0]).toContain('/products')
    expect(initOf(mockFetch.mock.calls[0]).method).toBe('POST')
  })

  it('필드를 하나도 빠뜨리지 않고 보낸다', async () => {
    // 서버가 전체 교체를 요구한다 — 빠진 값은 비워지거나 400이 난다
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    })

    await createProduct(payload())

    const sent = JSON.parse(initOf(mockFetch.mock.calls[0]).body as string)
    expect(Object.keys(sent).sort()).toEqual(
      [
        'addressGugun',
        'addressSido',
        'category',
        'description',
        'mainImageUrl',
        'petDetailType',
        'petType',
        'price',
        'productStatus',
        'subImageUrls',
        'title',
      ].sort()
    )
  })

  it('실패하면 웹과 같은 문구로 던진다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) })

    await expect(createProduct(payload())).rejects.toThrow('상품 등록에 실패했습니다.')
  })

  it('200인데 id가 없으면 같은 문구로 던진다', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) })

    await expect(createProduct(payload())).rejects.toThrow('상품 등록에 실패했습니다.')
  })
})

describe('updateProduct', () => {
  it('PATCH /products/{id}로 보낸다', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) })

    await updateProduct(42, payload())

    expect(mockFetch.mock.calls[0][0]).toContain('/products/42')
    expect(initOf(mockFetch.mock.calls[0]).method).toBe('PATCH')
  })

  it('등록과 **같은** 필드를 보낸다', async () => {
    // PATCH지만 실제로는 전체 교체다 (ProductServiceImpl:235-247)
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) })

    await updateProduct(42, payload())

    const sent = JSON.parse(initOf(mockFetch.mock.calls[0]).body as string)
    expect(sent.title).toBe('강아지 사료 10kg')
    expect(sent.addressGugun).toBe('강남구')
    expect(sent.subImageUrls).toEqual(['https://cdn/b.webp'])
  })

  it('실패하면 웹과 같은 문구로 던진다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) })

    await expect(updateProduct(42, payload())).rejects.toThrow('상품 수정에 실패했습니다.')
  })
})

describe('deleteProduct', () => {
  it('DELETE /products/{id}로 보낸다', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: null }) })

    await deleteProduct(42)

    expect(mockFetch.mock.calls[0][0]).toContain('/products/42')
    expect(initOf(mockFetch.mock.calls[0]).method).toBe('DELETE')
  })

  it('실패하면 웹과 같은 문구로 던진다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    await expect(deleteProduct(42)).rejects.toThrow('상품 삭제에 실패했습니다.')
  })
})
