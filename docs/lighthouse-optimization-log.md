# Lighthouse 성능 최적화 기록

> 이 문서는 Cuddle Market Next.js 프로젝트의 Lighthouse 점수를 개선하는 과정을 기록합니다.
> 추후 기술 블로그 포스트 작성을 위한 컨텍스트 파일입니다.

---

## 1차 분석 — 이미지 전달 최적화 (2026-02-10)

### Lighthouse 진단 항목

**"Improve image delivery"** — 예상 절약량: **88 KiB**

### 진단 결과 요약

CloudFront에서 서빙되는 상품 이미지 2개의 압축률이 부족하다는 진단이 나왔다.

| 이미지 | 포맷 | 현재 크기 | 절약 가능 | 비고 |
|--------|------|----------|----------|------|
| 도마뱀 비바리움 | `.webp` | 92.1 KiB | 48.2 KiB | `fetchpriority="high"`, `loading="eager"` — LCP 후보 |
| 열대어 비바리움 | `.webp` | 84.1 KiB | 40.1 KiB | 압축률 향상 필요 |

### 영향 지표

- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)

특히 첫 번째 이미지가 `fetchpriority="high"` + `loading="eager"`로 설정되어 LCP에 직접 영향을 주는 요소로 판단된다.

### 현재 코드 분석

#### priority 전략 (ProductCard.tsx)

```tsx
// dataIndex가 4 미만인 상품(처음 4개)만 priority 적용
priority={dataIndex !== undefined && dataIndex < 4}
```

- 처음 4개 상품: `fetchPriority="high"` + `loading="eager"`
- 나머지 상품: `fetchPriority="auto"` + `loading="lazy"`
- 이 전략 자체는 합리적 — 뷰포트 안의 상품만 즉시 로드

#### 이미지 서빙 구조

- 네이티브 `<img>` 태그 사용 (Next.js `<Image>` 아님)
- `toResizedWebpUrl` 유틸리티로 CloudFront의 Lambda 리사이즈 이미지(150/400/800 webp) URL 생성
- `srcSet`과 `sizes`를 직접 관리
- `onError`로 원본 URL 및 placeholder 이미지 fallback 처리

### 이미지 인프라 (백엔드)

- 업로드 시 원본만 S3에 저장
- AWS Lambda가 S3 이벤트 기반으로 150px/400px/800px 리사이즈 및 WebP 변환을 비동기 생성
- URL 규칙: `{uuid}.jpg` → `{uuid}_150.webp`, `{uuid}_400.webp`, `{uuid}_800.webp`
- CloudFront CDN으로 서빙

### 검토 결과 — Next.js `<Image>` 전환은 불필요

Next.js `<Image>` vs 백엔드 Lambda 리사이즈를 비교한 결과:

| 방식 | 흐름 | 장단점 |
|------|------|--------|
| Next.js `<Image>` | 브라우저 → Next.js 서버 → CloudFront(원본) → 리사이즈+재압축 → 브라우저 | Next.js 서버에 부하 발생, 이미 Lambda가 해주는 작업을 중복 처리 |
| 백엔드 Lambda (현재) | 브라우저 → CloudFront(리사이즈된 webp) → 브라우저 | 서버 부하 없음, CDN 직접 서빙으로 효율적 |

**결론: 백엔드에서 이미 리사이즈+WebP 변환을 해주고 있으므로, `toResizedWebpUrl`을 유지하고 Next.js `<Image>` 전환은 하지 않는다.**

### DPR (Device Pixel Ratio) 고려사항

단순히 요청 사이즈를 줄이는 것(예: 800 → 400)은 효과가 없다.
고해상도 디바이스(2x DPR)에서는 400px CSS 컨테이너에도 800px 이미지가 필요하며, `srcset`이 DPR에 맞는 이미지를 자동 선택하기 때문이다.

### 근본 원인 및 해결 방안

Lighthouse가 지적한 문제는 이미지 크기(dimensions)가 아니라 **압축 품질(quality)**이다.

```
Lambda webp 변환 quality ~90 → 92 KiB (현재)
Lambda webp 변환 quality 75  → ~46 KiB (Lighthouse 권장 수준)
```

Lighthouse는 내부적으로 이미지를 재인코딩하여 비교하며, 절약 가능량이 4 KiB 이상이면 항목에 표시한다.
현재 Lighthouse 추정 최적 크기가 ~44 KiB이므로, quality 75~80으로 낮추면 해당 항목이 사라지거나 영향이 미미해질 것으로 예상된다.

**해결 방안: 백엔드 팀에 Lambda의 webp 변환 quality를 75~80으로 조정 요청**

- quality 75로 시작하고, 이미지 품질 열화가 눈에 띄면 80으로 조정
- 적용 후 Lighthouse 재측정으로 확인 필요

### 다음 단계

- [ ] 백엔드 팀에 Lambda webp quality 조정 요청 (75~80)
- [ ] 적용 후 Lighthouse 재측정
- [ ] 결과 비교 및 기록

---

## 2차 분석 — LCP request discovery (2026-02-10)

### Lighthouse 진단 항목

**"LCP request discovery"** — Unscored (경고)

### 체크리스트 결과

| 항목 | 결과 | 의미 |
|------|------|------|
| `fetchpriority=high applied` | ✅ 통과 | 높은 우선순위 적용됨 |
| `Request is discoverable in initial document` | ❌ 실패 | 초기 HTML에서 이미지 URL을 찾을 수 없음 |
| `lazy load not applied` | ✅ 통과 | LCP 이미지에 lazy loading 미적용 (올바른 동작) |

LCP 요소로 식별된 이미지: 상품 카드 썸네일 (강아지 휴대용 물병)

### 문제 원인 분석

**초기 HTML에 이미지 URL이 포함되어 있지 않다.**

현재 데이터 흐름:

```
app/(main)/page.tsx (Server Component)
  └─ <Suspense fallback={<HomeSkeleton />}>
       └─ <Home />  ← 'use client', 여기서 useInfiniteQuery로 API 호출
            └─ <ProductsSection products={allProducts} />
                 └─ <ProductList products={products} />
                      └─ <ProductCard data={product} />
                           └─ <ProductThumbnail imageUrl={...} />  ← <img> 태그
```

문제의 타임라인:

```
1. 브라우저가 서버로부터 HTML 수신
2. HTML에는 <HomeSkeleton />만 있고, 이미지 URL 없음
3. JavaScript 번들 로드 및 실행
4. Home 컴포넌트 마운트 → useInfiniteQuery 실행
5. API 호출: GET /api/products/search?page=0&size=20
6. 응답 수신 후 상품 데이터 렌더링
7. 그제서야 <img src="..."> 가 DOM에 추가됨
8. 이미지 다운로드 시작 ← LCP가 여기서 발생 (느림)
```

**핵심**: 브라우저의 프리로드 스캐너가 초기 HTML을 파싱할 때 이미지 URL을 찾을 수 없어서,
JavaScript 실행 → API 호출 → 응답 수신 이후에야 이미지 다운로드가 시작된다.

### 현재 아키텍처의 한계

| 파일 | 타입 | 역할 |
|------|------|------|
| `app/(main)/page.tsx` | Server Component | `<Suspense>` + `<Home />` 렌더링만 담당 |
| `features/home/Home.tsx` | `'use client'` | `useInfiniteQuery`로 상품 데이터 클라이언트 fetch |
| `lib/api/api.ts` | Axios 인스턴스 | Zustand store에서 토큰을 읽어 인터셉터에 주입 (클라이언트 전용) |

`api.ts`가 Zustand(`useUserStore`)에 의존하고 있어서, 현재 `fetchAllProducts`를 서버 컴포넌트에서 직접 호출할 수 없다.

**Zustand가 SSR에서 사용 불가한 이유:**
Zustand store는 브라우저 메모리에 존재하는 클라이언트 전용 상태이다.
서버(Node.js)는 하나의 프로세스로 여러 사용자의 요청을 동시에 처리하는데,
Zustand store는 요청별로 격리되지 않으므로 서버에서 사용할 수 없다.

- 서버에서는 아무도 "로그인"하지 않았으므로 `accessToken`이 `null`
- 만약 상태를 넣더라도 여러 사용자 간 상태가 공유되어 보안 문제 발생 가능
- Zustand `persist` 미들웨어가 의존하는 `localStorage`도 서버에 존재하지 않음

### 왜 SSR에서 Axios 대신 네이티브 fetch를 사용하는가

위 이유로 기존 Axios 인스턴스(`api.ts`)를 SSR에서 사용할 수 없고,
Next.js가 네이티브 fetch를 확장하여 ISR 캐싱, 요청 중복 제거 등의 기능을 제공하기 때문에
SSR에서는 네이티브 fetch가 최적이다.

자세한 CSR vs SSR API 호출 도구 비교는 별도 문서 참고:
→ [CSR vs SSR에서의 API 호출 도구 비교](./csr-vs-ssr-api-fetching.md)

### 해결 방안 — Server-side 초기 데이터 fetch

`app/(main)/page.tsx`(Server Component)에서 첫 페이지 상품 데이터를 미리 가져와
초기 HTML에 이미지 URL이 포함되도록 한다.

#### 방법: 서버 전용 fetch 함수 + initialData

**Step 1. 서버 전용 fetch 함수 생성** (`src/lib/api/server/products.ts`)

상품 목록 조회 API(`/products/search`)는 인증 없이 접근 가능하므로,
Zustand/Axios 인터셉터 없이 서버에서 직접 fetch할 수 있다.

```ts
// src/lib/api/server/products.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function fetchInitialProducts() {
  const res = await fetch(`${API_BASE_URL}/products/search?page=0&size=20`, {
    next: { revalidate: 60 }, // 60초마다 재검증 (ISR)
  })

  if (!res.ok) return null

  const json = await res.json()
  return {
    data: json,
    total: json.data.totalElements,
  }
}
```

**Step 2. page.tsx에서 서버 fetch 후 Home에 전달**

```tsx
// src/app/(main)/page.tsx
import { Suspense } from 'react'
import Home from '@/features/home/Home'
import HomeSkeleton from '@/features/home/components/product-section/HomeSkeleton'
import { fetchInitialProducts } from '@/lib/api/server/products'

export default async function HomePage() {
  const initialData = await fetchInitialProducts()

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home initialData={initialData} />
    </Suspense>
  )
}
```

**Step 3. Home.tsx에서 initialData를 useInfiniteQuery에 주입**

```tsx
// Home.tsx — props에 initialData 추가
interface HomeProps {
  initialData?: { data: ProductResponse; total: number } | null
}

function Home({ initialData }: HomeProps) {
  // ... 기존 코드 ...

  const { data, fetchNextPage, ... } = useInfiniteQuery({
    queryKey: ['products', ...],
    queryFn: ({ pageParam = 0 }) => { ... },
    initialData: initialData
      ? {
          pages: [initialData],
          pageParams: [0],
        }
      : undefined,
    // ... 나머지 옵션
  })
}
```

#### 개선 후 예상 타임라인

```
1. 서버에서 fetchInitialProducts() 호출
2. 상품 데이터가 포함된 HTML 생성 → 이미지 URL이 HTML에 포함됨
3. 브라우저가 HTML 수신
4. 프리로드 스캐너가 즉시 이미지 URL 발견 → 이미지 다운로드 시작
5. JavaScript 로드와 동시에 이미지 다운로드 진행
6. hydration 완료 → TanStack Query가 initialData 사용
7. LCP 시간 대폭 단축
```

### 고려사항

- **인증 불필요**: 상품 목록 조회 API는 public이므로 서버에서 토큰 없이 호출 가능
- **ISR 활용**: `revalidate: 60`으로 설정하면 매 요청마다 API를 호출하지 않고, 60초 간격으로 캐시 갱신
- **필터가 있는 경우**: 사용자가 필터를 적용하면 클라이언트에서 `useInfiniteQuery`가 새로운 데이터를 가져오므로, `initialData`는 기본 상태(필터 없음)에만 적용됨
- **fallback**: `fetchInitialProducts()`가 실패해도 `null`을 반환하므로, 기존 클라이언트 fetch 로직이 그대로 동작

### 작업 진행 상황 (2026-02-10)

#### 완료된 작업

**1. `app/(main)/page.tsx` 수정 완료**

```tsx
import { Suspense } from 'react'
import Home from '@/features/home/Home'
import HomeSkeleton from '@/features/home/components/product-section/HomeSkeleton'
import { fetchInitialProducts } from '@/lib/api/server/products'

export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home initialData={initialData} />
    </Suspense>
  )
}
```

- `async` 함수로 변경하여 `await` 사용 가능하게 함
- `fetchInitialProducts()`를 호출하여 서버에서 초기 데이터를 가져옴
- 결과를 `Home` 컴포넌트에 `initialData` props로 전달

**2. `Home.tsx` 수정 완료**

```tsx
import { ProductResponse } from '@/types'

interface HomeProps {
  initialData: { data: ProductResponse; total: number } | null
}

function Home({ initialData }: HomeProps) {
  const { data, ... } = useInfiniteQuery({
    ...
    initialData: initialData ? { pages: [initialData], pageParams: [0] } : undefined,
    ...
  })
}
```

- `HomeProps` 인터페이스 추가 (`initialData` 타입 정의)
- `useInfiniteQuery`의 `initialData` 옵션에 서버 데이터 주입
- `initialData`가 `null`이면 `undefined`로 처리하여 기존 클라이언트 fetch 동작 유지

#### 남은 작업

- [ ] `src/lib/api/server/products.ts` 생성 (서버 전용 fetch 함수)
- [ ] Lighthouse 재측정으로 "Request is discoverable in initial document" 통과 확인

---

## 3차 분석 — Render blocking requests (2026-02-10)

### Lighthouse 진단 항목

**"Render blocking requests"** — 예상 절약량: **70ms** (Unscored)

### 진단 결과 요약

| 항목 | 값 |
|------|-----|
| 차단 리소스 | `...chunks/adb98aee794e2cc8.css` |
| 크기 | 10.1 KiB |
| 차단 시간 | 80ms |
| 예상 절약량 | 70ms |
| 영향 지표 | FCP, LCP |

이 CSS 파일이 `<head>`에서 로드되면서 화면 그리기를 80ms 동안 멈추게 하고 있다.
파일명이 해시(`adb98aee794e2cc8`)로 되어 있는 건 Next.js가 빌드 시 생성하는 CSS 청크이다.
Next.js가 자동으로 CSS를 청크 분리하고 `<head>`에 삽입하는 구조라서,
이 부분은 우리가 직접 제어하기 어렵다.

### 결론

- **점수에 반영되지 않음** (Unscored)
- 10.1 KiB / 80ms는 매우 작은 수치
- **조치 불필요**

---

## 4차 분석 — 지원 중단된 API 및 bfcache 차단 (2026-02-10)

### Lighthouse 진단 항목

1. **"지원 중단된 API 사용 (Uses deprecated APIs)"** — Best Practices 카테고리, 경고 1개
2. **"페이지에서 뒤로-앞으로 캐시 복원이 차단됨"** — Performance 진단, Unscored

### 두 항목의 관계

동일한 원인의 두 가지 결과이다.

```
unload 이벤트 리스너 존재 (원인)
  → bfcache 사용 불가 (결과)
    → 뒤로/앞으로 가기 시 페이지를 처음부터 다시 로드해야 함
```

### 진단 결과 요약

| 항목 | 내용 |
|------|------|
| 경고 | `unload` 이벤트 리스너가 지원 중단됨 |
| 소스 | `ca7bff569a45890d.js:6` (1st Party, vercel.app) |
| bfcache 차단 이유 | 페이지 기본 프레임에 로드 취소 핸들러가 있음 |
| 실패 유형 | 조치 실행 가능 |

### `unload` 이벤트란?

사용자가 페이지를 떠날 때(탭 닫기, 다른 페이지 이동 등) 실행되는 이벤트이다.
이 이벤트가 등록되어 있으면 브라우저의 **bfcache(뒤로/앞으로 캐시)**가 작동하지 않는다.
bfcache는 뒤로 가기 시 페이지를 즉시 복원해주는 기능인데,
`unload` 리스너가 있으면 브라우저가 페이지를 캐시에 보관하지 않는다.

### 원인 조사

`src/` 디렉토리에서 `unload` 키워드를 검색한 결과 **일치하는 항목 없음**.
우리 코드에서는 `unload` 이벤트를 사용하지 않으며,
Next.js 또는 설치된 라이브러리(TanStack Query, Zustand 등) 내부에서 등록하는 것으로 판단된다.
소스 파일명도 해시(`ca7bff569a45890d.js`)로 되어 있어 번들된 라이브러리 코드이며,
이 부분은 우리가 직접 제어하기 어렵다.

### 결론

- 두 항목 모두 **점수에 반영되지 않음** (Unscored)
- 우리 코드에서 `unload`를 사용하지 않으므로 **프론트엔드에서 직접 제어 불가**
- Next.js 또는 라이브러리 업데이트 시 자연스럽게 해결될 수 있음
- **조치 불필요**

---

## 5차 분석 — DebugBear LCP Load Delay (2026-02-10)

### 분석 도구

Lighthouse 외에 **DebugBear**를 사용하여 LCP를 더 세밀하게 분석했다.
DebugBear는 LCP를 TTFB, Load Delay, Load Duration으로 분해하여 병목 지점을 정확히 보여준다.

### DebugBear 측정 결과

**Performance Subscores:**

| 지표 | 값 | 점수 | 기여도 |
|------|-----|------|--------|
| TBT | 140ms | 91% | 27/30% |
| CLS | 0 | 100% | 25/25% |
| **LCP** | **1.3s** | **86%** | **22/25%** |
| SI | 1.0s | 97% | 10/10% |
| FCP | 0.4s | 100% | 10/10% |

LCP만 만점(25%)을 받지 못하고 22%에 머물러 있다.

### LCP Subparts 분석

| 구간 | 시간 | 상태 |
|------|------|------|
| TTFB | 190ms | 양호 |
| **Load Delay** | **917ms** | **병목** |
| Load Duration | 199ms | 양호 |

LCP 1.3s 중 **917ms가 Load Delay**이다.
이미지 자체의 다운로드(199ms)와 서버 응답(190ms)은 빠른데,
브라우저가 이미지 URL을 발견하기까지 917ms나 걸리고 있다.

### 원인: `useSearchParams()` + `<Suspense>`

LCP Image Discovery에서 JS 청크(`static/chunks/5f**.js`)가 **LCP INITIATOR**로 표시되었다.
이미지 URL이 초기 HTML에 없고, JavaScript가 실행된 후에야 브라우저가 발견한다는 뜻이다.

**왜 SSR로 데이터를 가져왔는데 이미지가 HTML에 없는가?**

```
page.tsx (Server Component)
  └── <Suspense fallback={HomeSkeleton}>    ← 문제의 Suspense
       └── Home ('use client')
            └── useSearchParams()           ← 이것이 SSR을 차단
```

Next.js 정적 렌더링에서 `useSearchParams()`를 사용하면,
**가장 가까운 Suspense 경계까지 서버 렌더링을 건너뛰고 클라이언트에서만 렌더링**한다.

즉, 서버에서 `fetchInitialProducts()`로 데이터를 가져왔음에도:

1. 서버는 `Home` 대신 `HomeSkeleton`을 렌더링 (이미지 URL 없음)
2. 브라우저가 JS를 다운로드 + 실행 (917ms)
3. React가 하이드레이션 → `Home` 컴포넌트 렌더링
4. 그제서야 `<img>` 태그가 DOM에 생성 → 이미지 다운로드 시작

이 과정이 917ms의 Load Delay이다.

### LCP Development 과정

DebugBear의 LCP Development 데이터가 이를 확인해준다:

| 순서 | 요소 | 픽셀 면적 | 시점 |
|------|------|-----------|------|
| 1 | `<span>MARKET` (헤더 텍스트) | 1,848 | 376ms |
| 2 | `HTML not available` (JS 렌더링 콘텐츠) | 3,526 | 928ms |
| 3 | `<img alt="휴대용 물병">` (상품 이미지) | 66,491 | 1.34s |

최종 LCP 요소는 상품 목록의 세 번째 이미지였다.
LCP 요소는 뷰포트에서 **가장 큰 픽셀 면적**을 가진 요소로 결정되므로,
몇 번째 상품 이미지가 될지는 매번 달라질 수 있다.
하지만 모든 상품 이미지가 동일한 Load Delay 문제를 겪고 있으므로 원인은 같다.

### 해결 방안 — `<Suspense>` 제거

`page.tsx`에서 `<Suspense>` 래퍼를 제거한다.

**변경 전:**

```tsx
import { Suspense } from 'react'
import Home from '@/features/home/Home'
import HomeSkeleton from '@/features/home/components/product-section/HomeSkeleton'
import { fetchInitialProducts } from '@/lib/api/server/products'

export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home initialData={initialData} />
    </Suspense>
  )
}
```

**변경 후:**

```tsx
import Home from '@/features/home/Home'
import { fetchInitialProducts } from '@/lib/api/server/products'

export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  return <Home initialData={initialData} />
}
```

### 왜 Suspense 제거만으로 해결되는가

1. Suspense가 없으면 → 페이지가 **동적 렌더링**으로 전환됨
2. 동적 렌더링에서는 → `useSearchParams()`가 SSR에서 **정상 동작**
3. `Home`이 서버에서 완전히 렌더링 → 초기 HTML에 `<img>` 태그 포함
4. 브라우저가 HTML 파싱 즉시 이미지 다운로드 시작 → **Load Delay 제거**

### 데이터 캐싱은 유지됨

`fetchInitialProducts()` 내부의 `next: { revalidate: 60 }`은 페이지 렌더링 방식과 별개로 동작한다.
페이지가 동적 렌더링으로 바뀌어도 데이터는 여전히 60초간 캐싱되므로 API 부하 걱정 없다.

```
변경 전 (정적 + Suspense):  페이지 HTML 캐싱 ✅  데이터 캐싱 ✅  이미지 SSR ❌
변경 후 (동적):             페이지 HTML 캐싱 ❌  데이터 캐싱 ✅  이미지 SSR ✅
```

### FCP에 미치는 영향

현재 `page.tsx`에서 `await fetchInitialProducts()`를 Suspense **바깥에서** 호출하고 있기 때문에,
Suspense 유무와 관계없이 서버는 데이터 fetch가 끝난 후에야 HTML을 보낸다.
TTFB가 동일하므로 FCP도 거의 변화 없다.

```
변경 전: 서버에서 데이터 fetch 완료 → HomeSkeleton HTML 전송 → FCP 0.4s
변경 후: 서버에서 데이터 fetch 완료 → 상품 포함 HTML 전송   → FCP ~0.4s
```

HTML이 약간 커지지만 (스켈레톤 vs 상품 그리드), 수 KB 차이라 네트워크 전송 시간에 미치는 영향은 무시할 수준이다.
결론: **FCP는 유지되면서 LCP만 개선**되는 구조이다.

### 기대 효과

```
변경 전: TTFB(190ms) + Load Delay(917ms) + Load Duration(203ms) = LCP 1.3s
변경 후: TTFB(190ms) + Load Delay(~0ms)  + Load Duration(203ms) = LCP 대폭 개선
```

### 주의사항

- `src/app/(main)/loading.tsx` 파일이 있다면 암묵적 Suspense 역할을 하므로 함께 확인 필요
- `Home.tsx`, `fetchInitialProducts` 수정 불필요

---

## 6차 분석 — TBT 증가 원인 및 StaticHomeFallback (2026-02-10)

### 상황

5차 분석에서 `<link rel="preload">`를 추가했으나 점수가 94 → 91로 하락했다.
DebugBear 측정 결과 TBT가 140ms → 190ms로 증가한 것이 원인이다.

### DebugBear 측정 결과

**Performance Score: 91점**

| 지표 | 값 | 점수 |
|------|-----|------|
| **TBT** | **190ms** | **84%** |
| CLS | 0 | 100% |
| LCP | 1.2s | 88% |
| SI | 1.0s | 97% |
| FCP | 0.4s | 100% |

### TBT 분석 — CPU Time By Request

DebugBear의 CPU Time By Request 데이터:

| 청크 | CPU Time | 내용 |
|------|----------|------|
| `5f**.js` | 335ms | react-dom + Next.js 런타임 |
| HTML 문서 | 94ms | RSC 페이로드 파싱 |
| `8b**.js` | 68ms | 앱 코드 |
| `7d**.js` | 67ms | Next.js 런타임 |

TBT Window: FCP(380ms) ~ TTI(993ms) = 613ms

### 번들 분석 (@next/bundle-analyzer)

`@next/bundle-analyzer`를 사용하여 홈페이지 JS 번들을 분석했다.

> 주의: `@next/bundle-analyzer`는 Turbopack과 호환되지 않는다.
> `ANALYZE=true npx next build --webpack` 으로 webpack 모드에서 실행해야 한다.

**홈페이지 주요 청크:**

| 청크 | 크기 | 내용 |
|------|------|------|
| `5f6838a6...js` | 219KB | react-dom + Next.js runtime (불가피) |
| `a6dad97d...js` | 110KB | zustand + axios + Header 컴포넌트 |
| `7d6514a9...js` | 108KB | Next.js runtime |
| 기타 13개 | ~402KB | 앱 코드, 유틸리티 등 |
| **합계** | **839KB** | **16개 청크** |

**발견 사항: react-hook-form이 홈페이지 청크에 포함**

홈페이지에는 폼이 없지만 react-hook-form이 로드되고 있었다.
조사 결과, Turbopack의 공유 청크 전략 때문이었다:

- react-hook-form은 로그인, 상품 등록 등 다른 페이지에서 사용
- 같은 `(main)` 레이아웃 그룹을 공유하는 라우트들이 공유 청크에 묶임
- import 구조를 바꿔서 해결할 수 있는 문제가 아님

### TBT 190ms의 결론

TBT 190ms 중 **~170ms는 react-dom + Next.js 런타임의 하이드레이션 비용**으로 프레임워크를 사용하는 한 피할 수 없다.
나머지 ~20ms만 앱 코드 비용이다.

### 근본 원인 — LCP가 개선되지 않은 이유

`initialData`를 추가하고 preload를 적용했지만 LCP가 1.3s → 1.2s로 미미하게 개선된 이유:

**`useSearchParams()`가 Suspense bailout을 일으키기 때문**

```
page.tsx (Server Component)
  └── <Suspense fallback={HomeSkeleton}>    ← Suspense 경계
       └── Home ('use client')
            └── useSearchParams()           ← 이것이 SSR bailout 유발
```

Next.js ISR에서 `useSearchParams()`를 사용하면, 가장 가까운 Suspense 경계까지 서버 렌더링을 건너뛰고 fallback을 렌더링한다.

결과:
1. 서버는 `Home` 대신 `HomeSkeleton`을 렌더링 → 초기 HTML에 `<img>` 태그 없음
2. `initialData`는 RSC 페이로드에 직렬화되어 하이드레이션 시에만 사용됨
3. preload로 이미지 다운로드는 빨라졌지만, `<img>` 태그가 JS 실행 후에야 생성됨
4. RSC 페이로드 증가(20개 상품 JSON)로 TBT가 50ms 증가

**개선(Load Duration 감소)과 퇴보(TBT 증가)가 거의 상쇄된 것.**

### 해결 방안 — StaticHomeFallback

**핵심 아이디어: Suspense fallback을 스켈레톤이 아닌, 실제 데이터를 가진 서버 컴포넌트로 교체**

Suspense bailout이 발생해도 fallback은 서버에서 렌더링된다.
따라서 fallback에 실제 상품 데이터가 포함된 서버 컴포넌트를 넣으면, 초기 HTML에 `<img>` 태그가 포함된다.

### 구현

**1. StaticHomeFallback.tsx 생성** (`src/features/home/components/StaticHomeFallback.tsx`)

서버 컴포넌트로, `Home`과 동일한 레이아웃 구조를 유지하면서:
- 필터/탭: 비인터랙티브 스켈레톤 플레이스홀더
- 상품 카드: 실제 데이터로 렌더링 (`<img>` 포함, `srcSet`, priority 적용)
- 클라이언트 전용 기능(좋아요, onError) 제거

**2. page.tsx 수정**

```tsx
import { Suspense } from 'react'
import Home from '@/features/home/Home'
import StaticHomeFallback from '@/features/home/components/StaticHomeFallback'
import { fetchInitialProducts } from '@/lib/api/server/products'
import { getImageSrcSet, IMAGE_SIZES } from '@/lib/utils/imageUrl'

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
      <Suspense fallback={<StaticHomeFallback products={products} totalElements={totalElements} />}>
        <Home initialData={initialData} />
      </Suspense>
    </>
  )
}
```

### 검증

빌드 성공: `○ / Revalidate: 1m Expire: 1y` (ISR 유지)

초기 HTML 검증:
```
변경 전: <img> 0개 (상품 이미지 없음, 스켈레톤만)
변경 후: <img> 22개 (로고 2개 + 상품 이미지 20개)
```

첫 번째 상품 이미지에 `fetchPriority="high"`, `loading="eager"` 적용 확인.

### 기대 효과

```
변경 전: TTFB(190ms) + Load Delay(917ms) + Load Duration(199ms) = LCP 1.3s
변경 후: TTFB(190ms) + Load Delay(~0ms)  + Load Duration(199ms) = LCP ~0.4s
```

`<img>` 태그가 초기 HTML에 포함되므로 Load Delay가 대폭 감소할 것으로 예상.
preload와 결합되면 이미지 다운로드가 HTML 파싱과 동시에 시작된다.

### CLS 영향

`StaticHomeFallback`은 `Home`과 동일한 CSS 클래스와 레이아웃 구조를 사용하므로,
하이드레이션 시 `Home`으로 교체될 때 레이아웃 시프트가 발생하지 않는다.

### DebugBear 4차 측정 결과 (StaticHomeFallback 적용 후)

**Performance Score: 94점** (3차 91점 → 94점, +3)

| 지표 | 3차 (preload만) | 4차 (StaticHomeFallback) | 변화 |
|------|:---:|:---:|:---:|
| **Score** | 91 | **94** | **+3** |
| **LCP** | 1.2s (88%) | **1.0s (95%)** | **-0.2s** |
| **TBT** | 190ms (84%) | **160ms (88%)** | **-30ms** |
| CLS | 0 (100%) | 0.008 (100%) | +0.008 |
| FCP | 0.4s (100%) | 0.9s (92%) | +0.5s |
| SI | 1.0s (97%) | 1.1s (95%) | +0.1s |

**CPU Time By Request:**

| 청크 | CPU Time |
|------|----------|
| `5f**.js` (react-dom) | 400ms |
| HTML 문서 | 188ms |
| `7d**.js` | 80ms |
| `turbopack-b9**.js` | 62ms |

TBT Window: 447ms (FCP 866ms ~ TTI 1.31s)

**트레이드오프:**
- FCP 0.4s → 0.9s — StaticHomeFallback으로 HTML이 커져 첫 페인트까지 시간 증가
- HTML 문서 CPU Time 94ms → 188ms — 더 큰 HTML 파싱 비용
- CLS 0 → 0.008 — StaticHomeFallback → Home 교체 시 미미한 레이아웃 시프트

---

## 7차 분석 — Forced Reflow 제거 (2026-02-10)

### 상황

4차 DebugBear 측정의 Diagnostics에서 **Forced reflow** 항목이 발견되었다.
총 81ms의 forced reflow 중 77ms가 단일 청크(`daf39bea7378ed38.js:1:27014`)에서 발생.

### 원인 추적

Vercel 배포된 청크를 다운로드하여 분석한 결과, `ProductPetTypeTabs.tsx`의 `useEffect`에서
`scrollWidth`, `clientWidth` 등 레이아웃 속성을 하이드레이션 직후 동기적으로 읽고 있었다.

```tsx
// 변경 전 — forced reflow 발생
useEffect(() => {
  const el = scrollRef.current
  if (!el) return
  const handleScroll = () => {
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
    setShowFade(!isAtEnd)
  }
  handleScroll()  // ← 하이드레이션 직후 동기적 레이아웃 읽기 → forced reflow
  el.addEventListener('scroll', handleScroll)
  return () => el.removeEventListener('scroll', handleScroll)
}, [])
```

### 해결

1. **`requestAnimationFrame`으로 초기 체크 지연**: 브라우저가 레이아웃을 완료한 후 읽기 수행
2. **`{ passive: true }` 추가**: 스크롤 이벤트에서 `preventDefault()` 미호출 보장
3. **`isMd` 의존성 추가**: 반응형 브레이크포인트 변경 시 fade 상태 재계산

```tsx
// 변경 후 — forced reflow 제거
useEffect(() => {
  const el = scrollRef.current
  if (!el) return
  const handleScroll = () => {
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
    setShowFade(!isAtEnd)
  }
  const rafId = requestAnimationFrame(handleScroll)  // ← 다음 프레임으로 지연
  el.addEventListener('scroll', handleScroll, { passive: true })
  return () => {
    cancelAnimationFrame(rafId)
    el.removeEventListener('scroll', handleScroll)
  }
}, [isMd])  // ← 브레이크포인트 변경 시 재실행
```

### 기대 효과

- Forced reflow 77ms 제거
- DebugBear Diagnostics에서 "Forced reflow" 항목 개선

### 최종 최적화 여정 요약

| 단계 | 점수 | LCP | TBT | 주요 변경 |
|------|:---:|:---:|:---:|----------|
| 1차 (최초) | 94 | 1.3s | 140ms | 기준선 |
| 2차 (SSR initialData) | 94 | 1.3s | 140ms | 서버 fetch + initialData 추가 |
| 3차 (preload) | 91 | 1.2s | 190ms | `<link rel="preload">` 추가 |
| (Suspense 제거 시도) | 83 | - | - | force-dynamic → 즉시 되돌림 |
| 4차 (StaticHomeFallback) | 94 | 1.0s | 160ms | 서버 컴포넌트 fallback |
| **5차 (Forced Reflow)** | **측정 예정** | - | - | **rAF + passive + isMd 의존성** |

---

<!-- 이후 최적화 작업 내용은 아래에 추가 -->
