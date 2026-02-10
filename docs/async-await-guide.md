# async/await 사용법 정리

> 이 문서는 async/await의 동작 원리를 정리한 기술 블로그 포스트용 자료입니다.
>
> 관련 문서: [lighthouse-optimization-log.md](./lighthouse-optimization-log.md) — SSR 초기 데이터 fetch에 async/await를 적용한 사례

---

## async/await란?

비동기 작업(API 호출, 파일 읽기 등 시간이 걸리는 작업)을 **동기 코드처럼 읽기 쉽게** 작성할 수 있게 해주는 JavaScript 문법이다.

---

## 핵심 규칙 두 가지

### 1. `await`는 "기다려"라는 뜻

```ts
const data = await fetchInitialProducts()
//           ^^^^^ "fetchInitialProducts()가 끝날 때까지 기다려, 그 결과를 data에 넣어"
```

### 2. `await`를 쓰려면 함수에 `async`를 붙여야 함

```ts
// ❌ 에러 — 일반 함수에서는 await 사용 불가
function HomePage() {
  const data = await fetchInitialProducts()
}

// ✅ 정상 — async 함수에서만 await 사용 가능
async function HomePage() {
  const data = await fetchInitialProducts()
}
```

`async`는 "이 함수 안에서 `await`를 쓸 거야"라는 선언이다. 그 이상도 이하도 아니다.

---

## 함수 정의 vs 함수 호출

async/await를 이해하려면 **함수를 정의하는 것**과 **함수를 호출하는 것**의 차이를 알아야 한다.

### 함수 정의 — "레시피를 적는 것"

```ts
// 이건 레시피를 적어놓은 것일 뿐, 아직 아무 일도 일어나지 않는다
async function makeCoffee() {
  const beans = await grindBeans()      // 원두를 갈아
  const water = await boilWater()       // 물을 끓여
  return brew(beans, water)             // 커피를 내려
}
```

함수를 정의했다고 해서 커피가 만들어지는 게 아니다. 코드가 실행되지 않는다.

### 함수 호출 — "레시피를 보고 실제로 요리하는 것"

```ts
// 이 순간에 비로소 makeCoffee 안의 코드가 실행된다
const coffee = await makeCoffee()
```

`makeCoffee()`를 호출하는 이 한 줄이 실행될 때, 그제서야 원두를 갈고 → 물을 끓이고 → 커피를 내린다.

---

## 단계별 예제

### Step 1: await 없이 호출하면?

```ts
async function fetchData() {
  const res = await fetch('https://api.example.com/products')
  const json = await res.json()
  return json
}

// await 없이 호출
const result = fetchData()
console.log(result)  // Promise { <pending> }  ← 데이터가 아니라 Promise 객체!
```

`await` 없이 호출하면 **결과가 아니라 "아직 진행 중"이라는 Promise 객체**가 반환된다.

### Step 2: await와 함께 호출하면?

```ts
// await와 함께 호출
const result = await fetchData()
console.log(result)  // { products: [...] }  ← 실제 데이터!
```

`await`가 "끝날 때까지 기다려"라고 해서, Promise가 완료된 후 **실제 결과값**을 반환한다.

---

## 실제 프로젝트 적용 사례

### 문제 상황

Lighthouse 분석 결과, 초기 HTML에 상품 이미지 URL이 포함되지 않아 LCP 점수가 낮았다.
상품 데이터를 서버에서 미리 가져와 HTML에 포함시켜야 했다.

### 해결: 3개 파일의 역할

**파일 1) 함수 정의** — `lib/api/server/products.ts`

```ts
// "상품 데이터를 가져오는 방법"을 정의 (아직 실행 안 됨)
export async function fetchInitialProducts() {
  const res = await fetch('https://api.example.com/products/search?page=0&size=20', {
    next: { revalidate: 60 },
  })

  if (!res.ok) return null

  const json = await res.json()
  return {
    data: json,
    total: json.data.totalElements,
  }
}
```

**파일 2) 함수 호출** — `app/(main)/page.tsx`

```tsx
import { fetchInitialProducts } from '@/lib/api/server/products'

// async를 붙여야 await를 쓸 수 있다
export default async function HomePage() {
  // 여기서 비로소 fetchInitialProducts 안의 코드가 실행된다
  const initialData = await fetchInitialProducts()

  // 가져온 데이터를 Home 컴포넌트에 전달
  return <Home initialData={initialData} />
}
```

**파일 3) 데이터 사용** — `features/home/Home.tsx`

```tsx
function Home({ initialData }) {
  // 서버에서 가져온 데이터를 TanStack Query의 초기값으로 사용
  const { data } = useInfiniteQuery({
    queryKey: ['products'],
    queryFn: fetchAllProducts,
    initialData: initialData
      ? { pages: [initialData], pageParams: [0] }
      : undefined,
  })
}
```

### 실행 흐름

```
1. 사용자가 페이지 접속
2. Next.js 서버가 page.tsx의 HomePage() 실행
3. await fetchInitialProducts() → API 호출 → 응답 기다림 → 데이터 반환
4. initialData를 Home에 전달하여 HTML 생성
5. HTML에 상품 이미지 URL이 포함된 채로 브라우저에 전송
6. 브라우저가 즉시 이미지 다운로드 시작 → LCP 개선
```

---

## 흔한 실수 정리

### 실수 1: async 없이 await 사용

```ts
// ❌ SyntaxError
function getData() {
  const data = await fetch(url)
}

// ✅
async function getData() {
  const data = await fetch(url)
}
```

### 실수 2: await를 빼먹음

```ts
async function getData() {
  const response = fetch(url)       // ← await 빠짐
  const json = response.json()      // ❌ 에러: response는 Promise이지 Response가 아님
}

async function getData() {
  const response = await fetch(url)  // ← await 있음
  const json = await response.json() // ✅ 정상
}
```

### 실수 3: 함수 정의와 호출을 혼동

```ts
// 이건 함수를 "정의"만 한 것 → fetch 실행 안 됨
async function fetchData() {
  return await fetch(url)
}

// 이걸 해야 실제로 fetch가 실행됨
const result = await fetchData()
```
