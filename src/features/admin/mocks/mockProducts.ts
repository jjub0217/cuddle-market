import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'
import { CITIES, PROVINCES } from '@/constants/cities'

export interface MockProduct {
  id: number
  productType: string
  image: string
  name: string
  nickname: string
  category: string
  price: number
  tradeStatus: string
  createdAt: string
  updatedAt: string
  description: string
  condition: string
  viewCount: number
  likeCount: number
  subImages: string[]
  addressSido: string
  addressGugun: string
}

const TRADE_STATUSES_BUY = ['요청중', '요청완료'] as const
const TRADE_STATUSES_SELL = ['판매중', '예약중', '판매완료'] as const
const PRODUCT_TYPES = ['팝니다', '삽니다']
const CATEGORIES = ['사료/간식', '장난감', '사육장/하우스', '건강/위생', '의류/악세사리', '이동장/목줄', '미용용품', '기타']
const CONDITION_ITEMS = ['새 상품', '거의 새것', '사용감 있음', '수리 필요'] as const
const NICKNAMES = [
  '댕댕이맘', '냥이집사', '펫러버', '동물친구', '쿠들러',
  '멍뭉이파파', '고양이왕국', '반려인생', '펫프렌즈', '해피독',
]
const PRODUCT_NAMES = [
  '강아지 사료 10kg', '고양이 캣타워', '반려동물 이동장', '강아지 간식 세트',
  '고양이 장난감 세트', '반려동물 목욕용품', '강아지 옷 겨울용', '고양이 모래 10L',
  '반려동물 자동급식기', '강아지 리드줄', '고양이 스크래처', '반려동물 건강검진 쿠폰',
  '강아지 훈련용 간식', '고양이 습식사료', '반려동물 침대', '강아지 치실 장난감',
  '고양이 화장실', '반려동물 영양제', '강아지 발세정기', '고양이 브러쉬',
]
const DESCRIPTION_SUFFIXES = [
  '상태 좋습니다. 직거래 선호합니다.',
  '거의 새것이나 다름없어요. 박스도 있습니다.',
  '사용감 조금 있지만 기능에 문제 없습니다.',
  '급하게 정리합니다. 가격 협의 가능합니다.',
  '선물 받았는데 사용 안 해서 팝니다.',
  '구매한 지 얼마 안 됐어요. 영수증 있습니다.',
  '택배 가능합니다. 포장 꼼꼼히 해드립니다.',
  '실물이 사진보다 훨씬 예뻐요. 강추입니다.',
]

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString()
}

function generateProducts(count: number): MockProduct[] {
  return Array.from({ length: count }, (_, i) => {
    const createdAt = randomDate(new Date('2024-01-01'), new Date('2025-12-31'))
    const productType = PRODUCT_TYPES[Math.floor(Math.random() * PRODUCT_TYPES.length)]
    const tradeStatus =
      productType === '삽니다'
        ? TRADE_STATUSES_BUY[Math.floor(Math.random() * TRADE_STATUSES_BUY.length)]
        : TRADE_STATUSES_SELL[Math.floor(Math.random() * TRADE_STATUSES_SELL.length)]

    const sido = PROVINCES[Math.floor(Math.random() * PROVINCES.length)]
    const cities = CITIES[sido]
    const gugun = cities[Math.floor(Math.random() * cities.length)]

    const productName = PRODUCT_NAMES[i % PRODUCT_NAMES.length]
    const descSuffix = DESCRIPTION_SUFFIXES[Math.floor(Math.random() * DESCRIPTION_SUFFIXES.length)]
    const description = `${productName} 판매합니다. ${descSuffix}`

    const subImageCount = Math.floor(Math.random() * 4) // 0~3
    const subImages = Array.from({ length: subImageCount }, (__, j) =>
      `https://picsum.photos/seed/sub${i + 1}-${j + 1}/200/200`
    )

    return {
      id: i + 1,
      productType,
      image: `https://picsum.photos/seed/product${i + 1}/100/100`,
      name: productName,
      nickname: `${NICKNAMES[i % NICKNAMES.length]}${i + 1}`,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      price: Math.floor(Math.random() * 200000 + 5000),
      tradeStatus,
      createdAt,
      updatedAt: randomDate(new Date(createdAt), new Date('2026-03-01')),
      description,
      condition: CONDITION_ITEMS[Math.floor(Math.random() * CONDITION_ITEMS.length)],
      viewCount: Math.floor(Math.random() * 500),
      likeCount: Math.floor(Math.random() * 100),
      subImages,
      addressSido: sido,
      addressGugun: gugun,
    }
  })
}

const products = generateProducts(50)

export function getMockProducts(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<MockProduct> {
  let filtered = [...products]

  // 검색
  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q))
  }

  // 필터
  if (params.filters) {
    if (params.filters.tradeStatus) {
      filtered = filtered.filter((p) => p.tradeStatus === params.filters!.tradeStatus)
    }
    if (params.filters.category) {
      filtered = filtered.filter((p) => p.category === params.filters!.category)
    }
    if (params.filters.productType) {
      filtered = filtered.filter((p) => p.productType === params.filters!.productType)
    }
  }

  // 정렬
  if (params.sort?.direction) {
    const { key, direction } = params.sort
    filtered.sort((a, b) => {
      const aVal = a[key as keyof MockProduct]
      const bVal = b[key as keyof MockProduct]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const data = filtered.slice(start, start + params.pageSize)

  return { data, total, page: params.page, pageSize: params.pageSize }
}
