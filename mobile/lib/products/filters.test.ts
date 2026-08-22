import { EMPTY_FILTERS, toParams, type ProductFilters } from './filters'

/** 조건 하나만 바꾼 덩어리를 만든다. */
function filters(overrides: Partial<ProductFilters> = {}): ProductFilters {
  return { ...EMPTY_FILTERS, ...overrides }
}

describe('EMPTY_FILTERS', () => {
  it('아무것도 안 고른 상태다 — 정렬만 최신순', () => {
    expect(EMPTY_FILTERS).toEqual({
      petType: null,
      petDetailType: null,
      category: null,
      productType: null,
      productStatus: null,
      tradeStatus: null,
      price: null,
      sido: null,
      gugun: null,
      sortBy: 'createdAt',
    })
  })
})

describe('toParams — 빈 값은 뺀다', () => {
  // ⚠️ 「전체」는 null 이다. 'ALL' 같은 글자를 보내면 서버가 그런 종류를 찾아
  //    아무것도 안 나온다 (15바퀴에서 정한 규칙).

  it('아무 조건도 없으면 page 와 정렬만 남는다', () => {
    const params = toParams(EMPTY_FILTERS, 0)

    expect(params).toEqual({ page: 0, sortBy: 'createdAt' })
  })

  it('page 를 그대로 싣는다', () => {
    expect(toParams(EMPTY_FILTERS, 3).page).toBe(3)
  })

  it('검색어는 있을 때만 싣는다', () => {
    expect(toParams(EMPTY_FILTERS, 0, '사료').keyword).toBe('사료')
    expect(toParams(EMPTY_FILTERS, 0, '')).not.toHaveProperty('keyword')
    expect(toParams(EMPTY_FILTERS, 0)).not.toHaveProperty('keyword')
  })

  it('고른 조건만 실린다', () => {
    const params = toParams(
      filters({ petType: 'MAMMAL', petDetailType: 'DOG', category: 'FOOD' }),
      0
    )

    expect(params.petType).toBe('MAMMAL')
    expect(params.petDetailType).toBe('DOG')
    expect(params.categories).toBe('FOOD')
    // 안 고른 것은 아예 키가 없다
    expect(params).not.toHaveProperty('productType')
    expect(params).not.toHaveProperty('addressSido')
  })

  it('카테고리는 서버 이름(categories)으로 바뀐다', () => {
    // 서버는 목록을 받지만 하나만 보낸다 — 웹과 같다
    expect(toParams(filters({ category: 'TOY' }), 0).categories).toBe('TOY')
  })

  it('판매/판매요청과 상태를 싣는다', () => {
    const params = toParams(filters({ productType: 'SELL', productStatus: 'USED' }), 0)

    expect(params.productType).toBe('SELL')
    expect(params.productStatuses).toBe('USED')
  })

  it('판매중 토글은 tradeStatuses 로 간다', () => {
    // ⚠️ 서버는 SELLING 을 물으면 거래 상태가 NULL 인 판매요청도 함께 준다.
    //    그래서 앱은 값 하나만 보내고 더 거르지 않는다.
    expect(toParams(filters({ tradeStatus: 'SELLING' }), 0).tradeStatuses).toBe('SELLING')
  })

  it('판매중 토글이 꺼져 있으면 키 자체가 없다', () => {
    expect(toParams(EMPTY_FILTERS, 0)).not.toHaveProperty('tradeStatuses')
  })

  it('지역 둘을 싣는다', () => {
    const params = toParams(filters({ sido: '서울특별시', gugun: '은평구' }), 0)

    expect(params.addressSido).toBe('서울특별시')
    expect(params.addressGugun).toBe('은평구')
  })
})

describe('toParams — 가격은 min/max 로 갈라진다', () => {
  it('구간을 minPrice·maxPrice 로 나눈다', () => {
    const params = toParams(filters({ price: { min: 10000, max: 50000 } }), 0)

    expect(params.minPrice).toBe(10000)
    expect(params.maxPrice).toBe(50000)
  })

  it('위 끝이 없는 구간(10만원 이상)은 maxPrice 를 안 보낸다', () => {
    const params = toParams(filters({ price: { min: 100000, max: null } }), 0)

    expect(params.minPrice).toBe(100000)
    expect(params).not.toHaveProperty('maxPrice')
  })

  it('0원부터인 구간도 minPrice 를 싣는다', () => {
    // ⚠️ 0 은 거짓값이라 `if (값)` 으로 거르면 사라진다. 숫자는 따로 봐야 한다
    const params = toParams(filters({ price: { min: 0, max: 10000 } }), 0)

    expect(params.minPrice).toBe(0)
    expect(params.maxPrice).toBe(10000)
  })

  it('구간을 안 골랐으면 둘 다 없다', () => {
    const params = toParams(EMPTY_FILTERS, 0)

    expect(params).not.toHaveProperty('minPrice')
    expect(params).not.toHaveProperty('maxPrice')
  })
})

describe('toParams — 정렬은 둘로 나뉜다', () => {
  // 웹 SORT_TYPE 의 id 와 서버가 받는 sortBy+sortOrder 가 다르다.
  // 근거: 웹 `ProductsSection.tsx` 의 `handleSortChange`

  it('최신순은 sortBy 만', () => {
    const params = toParams(filters({ sortBy: 'createdAt' }), 0)

    expect(params.sortBy).toBe('createdAt')
    expect(params).not.toHaveProperty('sortOrder')
  })

  it('저가순은 price + asc', () => {
    const params = toParams(filters({ sortBy: 'orderedLowPriced' }), 0)

    expect(params.sortBy).toBe('price')
    expect(params.sortOrder).toBe('asc')
  })

  it('고가순은 price + desc', () => {
    const params = toParams(filters({ sortBy: 'orderedHighPriced' }), 0)

    expect(params.sortBy).toBe('price')
    expect(params.sortOrder).toBe('desc')
  })

  it('찜 많은 순은 sortBy 만', () => {
    const params = toParams(filters({ sortBy: 'favoriteCount' }), 0)

    expect(params.sortBy).toBe('favoriteCount')
    expect(params).not.toHaveProperty('sortOrder')
  })
})
