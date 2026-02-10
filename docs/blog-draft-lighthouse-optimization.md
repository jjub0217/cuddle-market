# Next.js Lighthouse 94점에서 91점으로 — 최적화했는데 왜 점수가 떨어졌을까?

> Suspense bailout이 숨기고 있던 LCP 병목을 발견하고, 서버 컴포넌트로 해결한 과정

---

## 들어가며

Next.js App Router로 마이그레이션한 커들마켓의 Lighthouse Performance 점수는 **94점**이었다. 나쁘지 않은 점수였지만, DebugBear로 세부 지표를 분석해보니 **LCP(Largest Contentful Paint)가 1.3초**로 개선 여지가 있었다. 특히 LCP 이미지가 초기 HTML에 포함되지 않아 JavaScript 실행 후에야 발견되는 구조적 문제가 있었다.

이 글에서는 LCP를 개선하기 위해 시도한 세 가지 접근과, 그 과정에서 발견한 **`useSearchParams()`와 Suspense의 상호작용**이 만들어낸 예상치 못한 함정을 다룬다.

---

## 현재 아키텍처

커들마켓 홈페이지의 데이터 흐름은 이렇다:

```
app/(main)/page.tsx (Server Component)
  └─ fetchInitialProducts()      ← 서버에서 상품 데이터 fetch (ISR 60초)
  └─ <Suspense fallback={<HomeSkeleton />}>
       └─ <Home initialData={...} />  ← 'use client'
            └─ useSearchParams()       ← URL 쿼리 파라미터 읽기
            └─ useInfiniteQuery()      ← 무한 스크롤
            └─ <ProductsSection />
                 └─ <ProductCard />
                      └─ <img />       ← LCP 대상 이미지
```

서버에서 `fetchInitialProducts()`로 상품 데이터를 미리 가져와 `Home` 컴포넌트에 `initialData`로 전달하고, `useInfiniteQuery`의 초기 데이터로 주입하는 구조다. 이미지는 CloudFront + Lambda로 리사이즈된 WebP를 네이티브 `<img>` 태그의 `srcSet`으로 서빙한다.

얼핏 보면 SSR + ISR이 잘 작동하는 구조 같다. 하지만 여기에는 눈에 보이지 않는 문제가 숨어 있었다.

---

## 1차 시도: `<link rel="preload">` 추가

DebugBear의 LCP Subparts 분석에서 **Load Delay가 917ms**로 전체 LCP 1.3초의 대부분을 차지했다. Load Delay는 "브라우저가 이미지 URL을 발견하기까지 걸린 시간"이다.

### 조치

`page.tsx`에서 첫 번째 상품 이미지의 URL을 추출해 `<link rel="preload">`를 `<head>`에 삽입했다:

```tsx
// app/(main)/page.tsx
export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  const products = initialData?.data?.data?.content ?? []
  const firstImageUrl = products[0]?.mainImageUrl

  return (
    <>
      {firstImageUrl && (
        <link
          rel="preload"
          as="image"
          imageSrcSet={getImageSrcSet(firstImageUrl)}
          imageSizes={IMAGE_SIZES.productThumbnail}
          fetchPriority="high"
        />
      )}
      <Suspense fallback={<HomeSkeleton />}>
        <Home initialData={initialData} />
      </Suspense>
    </>
  )
}
```

### 결과

| 지표 | 이전 | 이후 |
|------|------|------|
| LCP | 1.3s | 1.2s |
| Performance | 94점 | 91점 |
| TBT | 140ms | 190ms |

LCP는 0.1초 개선에 그쳤고, **오히려 전체 점수는 94에서 91로 하락**했다. TBT(Total Blocking Time)가 140ms에서 190ms로 올랐다.

이미지 다운로드는 빨라졌지만, 브라우저가 `<img>` 태그를 DOM에 만들어야 비로소 LCP가 완료되는데, 이 시점은 여전히 JavaScript 실행 이후였다. preload는 "이미지 파일을 미리 받아두는 것"이지, "이미지를 화면에 그리는 시점을 앞당기는 것"이 아니었다.

---

## 2차 시도: `<Suspense>` 제거 → `force-dynamic` 전환

preload만으로 부족하다면, 아예 초기 HTML에 `<img>` 태그를 포함시켜야 했다. 그래서 Suspense를 제거하는 방법을 시도했다.

### 왜 Suspense가 문제인가

**핵심 발견: `useSearchParams()`가 Suspense bailout을 일으킨다.**

Next.js App Router에서 `useSearchParams()`를 사용하는 클라이언트 컴포넌트가 Suspense 경계 안에 있으면, 정적 렌더링(ISR) 시 **해당 Suspense 경계가 fallback으로 대체**된다. 서버는 실제 컴포넌트 대신 fallback을 렌더링하고, 클라이언트에서 하이드레이션 후에야 실제 UI가 나타난다.

```
서버가 보내는 HTML:
  <div>
    <HomeSkeleton />  ← 상품 이미지가 없는 스켈레톤 UI
  </div>

클라이언트에서 하이드레이션 후:
  <div>
    <Home />          ← 여기에 <img> 태그 생성
  </div>
```

서버에서 `fetchInitialProducts()`로 데이터를 가져왔음에도, 그 데이터로 렌더링된 HTML은 **브라우저에 전달되지 않았다.** RSC 페이로드로 직렬화되어 클라이언트에서 하이드레이션 시 사용될 뿐이었다.

### 조치

Suspense를 제거하고 페이지를 동적 렌더링으로 전환했다:

```tsx
export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  return <Home initialData={initialData} />
}
```

동적 렌더링에서는 `useSearchParams()`가 서버에서 정상 동작하므로, `Home` 컴포넌트가 서버에서 완전히 렌더링되어 초기 HTML에 `<img>` 태그가 포함된다.

### 결과

점수가 **83점**으로 추가 하락했다.

동적 렌더링은 매 요청마다 서버에서 HTML을 생성해야 하므로 TTFB가 증가했고, ISR의 캐싱 이점을 잃었다. 이 방법은 즉시 되돌렸다.

---

## 왜 점수가 떨어졌나 — 근본 원인 정리

여기서 멈추고 전체 상황을 정리했다. 94점 → 91점으로 떨어진 진짜 이유:

### 1. `initialData` 추가로 인한 TBT 증가

서버에서 `fetchInitialProducts()`를 호출하면서 20개 상품의 JSON 데이터가 RSC 페이로드에 추가되었다. 이 데이터는 하이드레이션 시 파싱되어야 하므로 메인 스레드 작업이 늘었다. TBT가 140ms → 190ms로 50ms 증가한 원인이다.

### 2. preload의 한계

preload는 이미지 파일의 **다운로드 시작 시점**을 앞당긴다. 하지만 LCP는 이미지가 **화면에 렌더링된 시점**이다. `<img>` 태그가 DOM에 없으면 이미지를 아무리 빨리 다운로드해도 LCP는 개선되지 않는다.

```
시간 →
[preload 없을 때]
  HTML 수신 → JS 로드/실행 → <img> 생성 → 이미지 다운로드 시작 → 렌더링 → LCP
                                          ^^^^^^^^^^^^^^^^^^^^^^^^
                                          Load Duration (199ms)

[preload 있을 때]
  HTML 수신 → 이미지 다운로드 시작 → (이미 완료)
           → JS 로드/실행 → <img> 생성 → (이미 캐시에 있으므로 즉시) → 렌더링 → LCP
                                                                       ^^^^^^^^
                                                                       ~0ms
```

preload로 Load Duration은 줄었지만, **JS 로드/실행이 끝나야 `<img>`가 생기는 구조**는 변하지 않았다. Load Delay(917ms)의 대부분은 JS 실행 시간이었고, 이것은 preload로 해결할 수 없었다.

### 3. 개선과 퇴보가 상쇄

- 개선: preload로 이미지 Load Duration 감소 (-100ms 정도)
- 퇴보: RSC 페이로드 증가로 TBT 상승 (+50ms)
- 결과: 거의 상쇄되어 점수가 유의미하게 오르지 않음

---

## 번들 분석 — TBT 190ms의 정체

@next/bundle-analyzer로 홈페이지의 JS 번들을 분석했다.

> 참고: @next/bundle-analyzer는 Turbopack과 호환되지 않는다. `ANALYZE=true npx next build --webpack` 으로 webpack 모드에서 실행해야 한다.

### 홈페이지 JS 청크 구성

DebugBear의 CPU Time By Request 데이터와 대조한 결과:

| 청크 | 크기 | CPU Time | 내용 |
|------|------|----------|------|
| `5f**.js` | 219KB | 335ms | react-dom + Next.js 런타임 |
| `7d**.js` | 108KB | 67ms | Next.js 런타임 |
| `8b**.js` | - | 68ms | 앱 코드 |
| HTML 문서 | - | 94ms | RSC 페이로드 파싱 |

**TBT 190ms 중 약 170ms는 react-dom과 Next.js 런타임의 하이드레이션 비용**이었다. 이것은 프레임워크를 사용하는 한 피할 수 없는 비용이다.

### react-hook-form이 홈페이지에?

번들 분석 중 react-hook-form이 홈페이지 청크에 포함된 것을 발견했다. 홈페이지에는 폼이 없는데 왜 로드될까?

조사 결과, **Turbopack의 공유 청크 전략** 때문이었다. Turbopack은 여러 라우트에서 공통으로 사용하는 모듈을 하나의 공유 청크로 묶는다. react-hook-form은 로그인, 상품 등록 등 다른 페이지에서 사용하는데, 같은 레이아웃 그룹 `(main)`을 공유하기 때문에 홈페이지에서도 로드되었다. 이것은 import 구조를 바꿔서 해결할 수 있는 문제가 아니다.

---

## 3차 시도: StaticHomeFallback — 서버 컴포넌트를 Suspense fallback으로

문제의 본질을 다시 정리하면:

1. `useSearchParams()` 때문에 Suspense를 제거할 수 없다 (ISR에서 필요)
2. Suspense가 있으면 fallback(`HomeSkeleton`)이 초기 HTML에 렌더링된다
3. `HomeSkeleton`에는 `<img>` 태그가 없다
4. 따라서 LCP 이미지가 JS 실행 전에 발견되지 않는다

**발상의 전환: Suspense fallback을 스켈레톤이 아닌, 실제 데이터를 가진 서버 컴포넌트로 바꾸면 어떨까?**

### 핵심 아이디어

Suspense fallback은 어떤 React 노드든 될 수 있다. `<HomeSkeleton />` 대신 **서버에서 미리 가져온 상품 데이터로 렌더링된 서버 컴포넌트**를 fallback에 넣으면:

```
서버가 보내는 HTML:
  <div>
    <StaticHomeFallback products={[...]} />  ← 실제 <img> 태그 포함!
  </div>

클라이언트에서 하이드레이션 후:
  <div>
    <Home />  ← 인터랙티브한 버전으로 교체
  </div>
```

사용자는 초기 HTML에서 **실제 상품 이미지가 포함된 UI**를 즉시 보고, 하이드레이션이 완료되면 필터, 정렬, 무한 스크롤 등 인터랙티브 기능이 활성화된다.

### 구현

**StaticHomeFallback.tsx** — 서버 컴포넌트 (no `'use client'`)

```tsx
import type { Product } from '@/types/product'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import { formatPrice } from '@/lib/utils/formatPrice'
import Badge from '@/components/commons/badge/Badge'
import Link from 'next/link'

interface StaticHomeFallbackProps {
  products: Product[]
  totalElements: number
}

export default function StaticHomeFallback({ products, totalElements }: StaticHomeFallbackProps) {
  return (
    <div className="pb-4xl bg-white pt-6">
      <div className="px-lg mx-auto max-w-7xl">
        <div className="flex flex-col gap-12">
          {/* 필터 영역: 비인터랙티브 스켈레톤 */}
          <div className="flex flex-col gap-7">
            <FilterPlaceholder />
          </div>

          {/* 상품 영역: 실제 데이터 */}
          <div className="flex flex-col gap-3">
            <TabsPlaceholder />
            <section className="flex flex-col gap-5">
              <p className="text-text-secondary">{`총 ${totalElements}개의 상품`}</p>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product, index) => (
                  <li key={product.id}>
                    <StaticProductCard product={product} index={index} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
```

이 컴포넌트는 `Home`과 동일한 레이아웃 구조를 유지하면서:

- 필터, 탭: 비인터랙티브 플레이스홀더 (skeleton)
- 상품 카드: **실제 데이터로 렌더링** (`<img>` 포함)

`StaticProductCard`는 `ProductCard`의 서버 컴포넌트 버전이다. 클라이언트 전용 기능(좋아요, onError 핸들러)을 제거하고, 순수하게 데이터를 표시하는 역할만 한다:

```tsx
function StaticProductCard({ product, index }: { product: Product; index: number }) {
  const priority = index < 4

  return (
    <Link href={ROUTES.DETAIL_ID(product.id)} className="...">
      {/* 상품 정보 */}
      <div className="...">
        <span>{product.title}</span>
        <span>{formatPrice(product.price)}원</span>
      </div>

      {/* 상품 이미지 — LCP 대상 */}
      <div className="relative ...">
        <img
          alt={product.title}
          src={toResizedWebpUrl(product.mainImageUrl, 800)}
          srcSet={getImageSrcSet(product.mainImageUrl)}
          sizes={IMAGE_SIZES.productThumbnail}
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          className="absolute h-full w-full object-cover"
        />
      </div>
    </Link>
  )
}
```

**page.tsx** 변경:

```tsx
export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  const products = initialData?.data?.data?.content ?? []
  const totalElements = initialData?.data?.data?.totalElements ?? 0
  const firstImageUrl = products[0]?.mainImageUrl

  return (
    <>
      {firstImageUrl && (
        <link
          rel="preload"
          as="image"
          imageSrcSet={getImageSrcSet(firstImageUrl)}
          imageSizes={IMAGE_SIZES.productThumbnail}
          fetchPriority="high"
        />
      )}
      <Suspense fallback={
        <StaticHomeFallback products={products} totalElements={totalElements} />
      }>
        <Home initialData={initialData} />
      </Suspense>
    </>
  )
}
```

### 왜 이것이 작동하는가

1. `page.tsx`는 **Server Component**다. 여기서 `StaticHomeFallback`에 데이터를 전달하는 것은 서버에서 일어난다.
2. Suspense bailout이 발생해도, fallback에 있는 `StaticHomeFallback`은 **서버에서 렌더링**된다.
3. 따라서 초기 HTML에 `<img>` 태그가 포함된다.
4. 브라우저의 프리로드 스캐너가 HTML 파싱 시점에 이미지 URL을 발견한다.
5. `<link rel="preload">`와 결합되면, 이미지 다운로드가 HTML 파싱과 동시에 시작된다.

```
[변경 전]
HTML 수신 → HomeSkeleton 렌더링 (이미지 없음)
         → JS 로드/실행 (917ms)
         → <img> 생성 → 이미지 다운로드 (199ms) → LCP (1.3s)

[변경 후]
HTML 수신 → StaticHomeFallback 렌더링 (<img> 태그 포함!)
         → 프리로드 스캐너가 즉시 이미지 URL 발견
         → 이미지 다운로드 시작 → LCP (~0.4s + 다운로드 시간)
         → (백그라운드) JS 로드/실행 → Home으로 교체
```

### 빌드 결과 검증

```bash
$ npm run build
Route (app)                    Size     First Load JS
○ /                            ...      ...
  ○ Revalidate: 1m  Expire: 1y
```

ISR이 유지되었다 (`○` = static, `Revalidate: 1m`).

빌드된 HTML을 확인:

```bash
$ curl -s http://localhost:3000 | grep -c '<img'
22  # 2개 로고 + 20개 상품 이미지
```

**변경 전에는 0개였던 상품 이미지가 초기 HTML에 20개 포함되었다.**

---

## CLS 영향 — 레이아웃 시프트가 일어나지 않는 이유

Suspense fallback이 실제 컨텐츠로 교체될 때 레이아웃 시프트(CLS)가 발생하지 않을까?

**발생하지 않는다.** `StaticHomeFallback`은 `Home`과 동일한 CSS 클래스와 레이아웃 구조를 사용한다:

| 영역 | StaticHomeFallback | Home |
|------|-------------------|------|
| 외부 래퍼 | `pb-4xl bg-white pt-6` | 동일 |
| 컨테이너 | `px-lg mx-auto max-w-7xl` | 동일 |
| 상품 그리드 | `grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4` | 동일 |
| 카드 구조 | `flex flex-row-reverse rounded-xl border` | 동일 |
| 이미지 영역 | `pb-[35%] md:pb-[75%]` (aspect ratio) | 동일 |

교체 시 변하는 것은 필터 영역(스켈레톤 → 실제 버튼)뿐이고, 상품 그리드는 동일한 데이터로 동일한 크기를 유지한다.

---

## 정리: 세 가지 시도의 비교

| 시도 | 접근 | LCP | TBT | 점수 | ISR |
|------|------|-----|-----|------|-----|
| 기준 (최초) | — | 1.3s | 140ms | 94 | O |
| 1차: preload | `<link rel="preload">` | 1.2s | 190ms | 91 | O |
| 2차: Suspense 제거 | `force-dynamic` | (되돌림) | - | 83 | X |
| **3차: StaticHomeFallback** | **서버 컴포넌트 fallback** | **측정 예정** | **측정 예정** | **측정 예정** | **O** |

---

## 배운 점

### 1. SSR했다고 끝이 아니다

서버에서 데이터를 가져와 props로 전달해도, Suspense bailout이 발생하면 실제 HTML에는 포함되지 않는다. 데이터는 RSC 페이로드에 직렬화되어 하이드레이션 시 사용될 뿐이다.

### 2. preload ≠ 렌더링

`<link rel="preload">`는 리소스 다운로드를 앞당기지만, DOM에 해당 요소가 없으면 LCP에 영향을 주지 못한다. preload는 이미 HTML에 있는 이미지의 발견을 돕는 도구이지, 존재하지 않는 이미지를 만들어주지 않는다.

### 3. Suspense fallback은 스켈레톤일 필요가 없다

Suspense의 fallback에 데이터가 있는 서버 컴포넌트를 넣을 수 있다. `page.tsx`(Server Component)에서 데이터를 가져와 fallback에 전달하면, Suspense bailout이 발생해도 초기 HTML에 의미 있는 콘텐츠가 포함된다. 이것은 Streaming SSR과 ISR의 장점을 모두 취하는 패턴이다.

### 4. Lighthouse 점수는 ±3~5점 오차가 있다

94점과 91점의 차이는 통계적으로 유의미하지 않을 수 있다. 한 번의 측정으로 결론을 내리지 말고, 여러 번 측정하거나 DebugBear 같은 도구로 개별 지표의 변화를 추적해야 한다.

### 5. 번들 분석은 Turbopack과 함께 쓸 수 없다

`@next/bundle-analyzer`는 webpack 기반이라 Turbopack 빌드와 호환되지 않는다. `--webpack` 플래그로 별도 빌드해야 하며, 결과도 Turbopack의 실제 청크 구조와 다를 수 있다. Turbopack의 공유 청크 전략 때문에, 특정 라이브러리가 사용하지 않는 페이지에도 로드될 수 있다.

---

## 다음 단계

- DebugBear로 StaticHomeFallback 적용 후 재측정
- LCP Load Delay가 얼마나 줄었는지 확인
- TBT 변화 관찰 (RSC 페이로드에 fallback HTML이 추가되므로)
- 백엔드 팀에 Lambda WebP quality 75~80 조정 요청 (이미지 용량 추가 절감)

---

*이 글은 커들마켓 프로젝트의 성능 최적화 과정을 기록한 시리즈의 일부입니다.*
