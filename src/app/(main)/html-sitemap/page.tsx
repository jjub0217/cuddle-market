import type { Metadata } from 'next'
import Link from 'next/link'
import { toUrlName } from '@/lib/utils/toUrlName'
import { fetchProductSitemapEntries, fetchCommunitySitemapEntries } from '@/lib/api/server/sitemap'

export const metadata: Metadata = {
  title: '사이트맵 | 커들마켓',
  description: '커들마켓의 모든 페이지를 한눈에 확인하세요.',
  alternates: {
    canonical: '/html-sitemap',
  },
  robots: { index: true, follow: true },
}

export const revalidate = 3600

const PET_TYPES = [
  {
    code: 'MAMMAL',
    name: '포유류',
    details: [
      { code: 'DOG', name: '강아지' },
      { code: 'CAT', name: '고양이' },
      { code: 'RABBIT', name: '토끼' },
      { code: 'HAMSTER', name: '햄스터' },
      { code: 'GUINEA_PIG', name: '기니피그' },
      { code: 'FERRET', name: '페럿' },
      { code: 'CHINCHILLA', name: '친칠라' },
      { code: 'HEDGEHOG', name: '고슴도치' },
    ],
  },
  {
    code: 'BIRD',
    name: '조류',
    details: [
      { code: 'BUDGERIGAR', name: '잉꼬' },
      { code: 'PARROT', name: '앵무새' },
      { code: 'CANARY', name: '카나리아' },
      { code: 'LOVEBIRD', name: '모란앵무' },
    ],
  },
  {
    code: 'REPTILE',
    name: '파충류',
    details: [
      { code: 'LIZARD', name: '도마뱀' },
      { code: 'SNAKE', name: '뱀' },
      { code: 'TURTLE', name: '거북이' },
      { code: 'GECKO', name: '게코' },
    ],
  },
  {
    code: 'FISH',
    name: '수생동물',
    details: [
      { code: 'GOLDFISH', name: '금붕어' },
      { code: 'TROPICAL_FISH', name: '열대어' },
      { code: 'CHERRY_SHRIMP', name: '체리새우' },
      { code: 'SNAIL', name: '달팽이' },
    ],
  },
  {
    code: 'AMPHIBIAN',
    name: '곤충/절지동물',
    details: [
      { code: 'CRICKET', name: '귀뚜라미' },
      { code: 'MANTIS', name: '사마귀' },
      { code: 'BEETLE', name: '딱정벌레' },
      { code: 'SPIDER', name: '거미' },
    ],
  },
]

const PRODUCT_CATEGORIES = [
  { code: 'FOOD', name: '사료/간식' },
  { code: 'TOY', name: '장난감' },
  { code: 'HOUSE', name: '사육장/하우스' },
  { code: 'HEALTH', name: '건강/위생' },
  { code: 'CLOTHING', name: '의류/악세사리' },
  { code: 'WALKING', name: '이동장/목줄' },
  { code: 'GROOMING', name: '미용용품' },
  { code: 'ETC', name: '기타' },
]

const TRADE_STATUSES = [
  { code: 'SELLING', name: '판매중' },
  { code: 'RESERVED', name: '예약중' },
  { code: 'COMPLETED', name: '판매완료' },
]

const PRODUCT_TYPES = [
  { code: 'SELL', name: '판매' },
  { code: 'REQUEST', name: '판매요청' },
]

export default async function HtmlSitemapPage() {
  const [products, questionPosts, infoPosts] = await Promise.all([
    fetchProductSitemapEntries(),
    fetchCommunitySitemapEntries('QUESTION'),
    fetchCommunitySitemapEntries('INFO'),
  ])

  return (
    <div className="mx-auto px-4 py-8 xl:max-w-7xl">
      <h1 className="mb-8 border-b pb-4 text-2xl font-bold">커들마켓 사이트맵</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">홈</h2>
        <ul className="space-y-1 pl-4">
          <li>
            <Link href="/" className="text-blue-600 hover:underline">
              - 커들마켓 홈
            </Link>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">카테고리별 상품</h2>
        <ul className="space-y-1 pl-4">
          {PRODUCT_CATEGORIES.map((cat) => (
            <li key={cat.code}>
              <Link href={`/?categories=${cat.code}`} className="text-blue-600 hover:underline">
                - {cat.name} 상품
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">종류별 상품</h2>
        <ul className="space-y-1 pl-4">
          {PET_TYPES.map((pet) => (
            <li key={pet.code}>
              <Link href={`/?petType=${pet.code}`} className="text-blue-600 hover:underline">
                - {pet.name} 용품
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {PET_TYPES.map((pet) => (
        <div key={pet.code}>
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{pet.name} 종류별 상품</h2>
            <ul className="space-y-1 pl-4">
              {pet.details.map((detail) => (
                <li key={detail.code}>
                  <Link href={`/?petType=${pet.code}&petDetailType=${detail.code}`} className="text-blue-600 hover:underline">
                    - {detail.name} 용품
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{pet.name} 카테고리별 상품</h2>
            <ul className="space-y-1 pl-4">
              {PRODUCT_CATEGORIES.map((cat) => (
                <li key={cat.code}>
                  <Link href={`/?petType=${pet.code}&categories=${cat.code}`} className="text-blue-600 hover:underline">
                    - {pet.name} {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {pet.details.map((detail) => (
            <section key={detail.code} className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">{detail.name} 카테고리별 상품</h2>
              <ul className="space-y-1 pl-4">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <li key={cat.code}>
                    <Link
                      href={`/?petType=${pet.code}&petDetailType=${detail.code}&categories=${cat.code}`}
                      className="text-blue-600 hover:underline"
                    >
                      - {detail.name} {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ))}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">거래 상태별 상품</h2>
        <ul className="space-y-1 pl-4">
          {TRADE_STATUSES.map((status) => (
            <li key={status.code}>
              <Link href={`/?productStatuses=${status.code}`} className="text-blue-600 hover:underline">
                - {status.name} 상품
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">거래 유형별 상품</h2>
        <ul className="space-y-1 pl-4">
          {PRODUCT_TYPES.map((type) => (
            <li key={type.code}>
              <Link href={`/?productType=${type.code}`} className="text-blue-600 hover:underline">
                - {type.name} 상품
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">커뮤니티</h2>
        <ul className="space-y-1 pl-4">
          <li>
            <Link href="/community?tab=tab-question" className="text-blue-600 hover:underline">
              - 질문 게시판
            </Link>
          </li>
          <li>
            <Link href="/community?tab=tab-info" className="text-blue-600 hover:underline">
              - 정보 공유 게시판
            </Link>
          </li>
        </ul>
      </section>

      {products.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">중고거래 상품 ({products.length})</h2>
          <ul className="space-y-1 pl-4">
            {products.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.id}/${toUrlName(p.title)}`} className="text-blue-600 hover:underline">
                  - {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {questionPosts.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">질문 게시글 ({questionPosts.length})</h2>
          <ul className="space-y-1 pl-4">
            {questionPosts.map((p) => (
              <li key={p.id}>
                <Link href={`/community/${p.id}/${toUrlName(p.title)}`} className="text-blue-600 hover:underline">
                  - {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {infoPosts.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">정보 게시글 ({infoPosts.length})</h2>
          <ul className="space-y-1 pl-4">
            {infoPosts.map((p) => (
              <li key={p.id}>
                <Link href={`/community/${p.id}/${toUrlName(p.title)}`} className="text-blue-600 hover:underline">
                  - {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
