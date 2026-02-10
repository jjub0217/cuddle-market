# CSR vs SSR에서의 API 호출 도구 비교

> 이 문서는 Next.js App Router 환경에서 CSR(Client-Side Rendering)과 SSR(Server-Side Rendering) 각각에 적합한
> API 호출 도구의 장단점을 정리한 기술 블로그 포스트용 자료입니다.
>
> 관련 문서: [lighthouse-optimization-log.md](./lighthouse-optimization-log.md) — 2차 분석(LCP request discovery)에서 서버 전용 fetch 함수를 도입하게 된 배경

---

## 배경: 왜 이 주제를 다루게 되었는가

Cuddle Market 프로젝트를 Lighthouse로 분석한 결과, **"LCP request discovery"** 항목에서 초기 HTML에 이미지 URL이 포함되지 않는 문제가 발견되었다.
원인은 상품 데이터를 클라이언트에서만(CSR) 가져오고 있었기 때문이다.

이를 해결하기 위해 Server Component에서 데이터를 미리 fetch하는 방식(SSR)을 도입하면서,
기존에 사용하던 Axios를 서버에서 그대로 쓸 수 없다는 것을 알게 되었다.
이 과정에서 CSR과 SSR 각각에 적합한 API 호출 방식에 대해 정리하게 되었다.

---

## 실행 환경의 차이

CSR과 SSR에서 API 호출 도구를 선택할 때 가장 중요한 것은 **코드가 실행되는 환경**이 다르다는 점이다.

```
CSR (Client-Side Rendering)
  - 실행 환경: 브라우저
  - 상태 접근: Zustand, Context, localStorage 등 사용 가능
  - 타이밍: 사용자 인터랙션에 반응하여 API 호출

SSR (Server-Side Rendering)
  - 실행 환경: Node.js 서버
  - 상태 접근: 브라우저 전용 상태(Zustand, localStorage)에 접근 불가
  - 타이밍: HTML 생성 시점에 API 호출, 결과가 초기 HTML에 포함됨
```

---

## CSR에서의 API 호출

### 주요 도구: Axios + TanStack Query

CSR에서는 **Axios**와 **TanStack Query**(React Query) 조합이 널리 사용된다.

#### Axios의 장점 (CSR)

```ts
// 인터셉터로 모든 요청에 자동으로 토큰 주입
api.interceptors.request.use((config) => {
  const accessToken = useUserStore.getState().accessToken
  config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// 401 응답 시 자동 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const newToken = await refreshAccessToken()
      // 토큰 갱신 후 원래 요청 재시도
    }
  }
)
```

- **인터셉터**: 요청/응답을 가로채서 토큰 주입, 에러 처리, 로깅 등을 일괄 처리
- **Zustand 연동**: 클라이언트 상태 관리 라이브러리와 자연스럽게 통합
- **인스턴스 기반**: `baseURL`, `headers`, `timeout` 등을 한 곳에서 설정
- **자동 JSON 변환**: 요청/응답 데이터를 자동으로 직렬화/역직렬화

#### TanStack Query의 역할

```ts
const { data, isLoading } = useInfiniteQuery({
  queryKey: ['products', filters],
  queryFn: ({ pageParam }) => fetchAllProducts(pageParam, filters),
})
```

- **캐싱**: 같은 queryKey의 데이터를 메모리에 캐시
- **자동 갱신**: 포커스 복귀, 네트워크 재연결 시 자동 refetch
- **무한 스크롤**: `useInfiniteQuery`로 페이지네이션 처리
- **로딩/에러 상태**: 선언적으로 UI 상태 관리

### CSR API 호출의 한계

```
1. 브라우저가 빈 HTML 수신 (데이터 없음)
2. JavaScript 번들 다운로드 및 실행
3. 컴포넌트 마운트 → API 호출 시작
4. 응답 수신 → 데이터 렌더링
```

**네트워크 워터폴** 문제 — HTML → JS → API → 데이터 순서로 직렬 로딩되어 초기 렌더링이 느리다.
이것이 Lighthouse에서 "Request is discoverable in initial document" 실패로 나타난 원인이다.

---

## SSR에서의 API 호출

### 주요 도구: 네이티브 fetch (Next.js 확장)

Next.js App Router에서는 **네이티브 `fetch`**를 권장한다.
Next.js가 `fetch`를 확장하여 프레임워크 레벨의 최적화 기능을 추가했기 때문이다.

#### Next.js 확장 fetch의 장점

```ts
// 1. ISR (Incremental Static Regeneration)
fetch(url, { next: { revalidate: 60 } })
// → 60초 동안 캐시, 이후 백그라운드에서 갱신

// 2. 정적 캐시 (빌드 타임)
fetch(url, { cache: 'force-cache' })
// → 빌드 시 한 번만 호출, 이후 정적 파일처럼 서빙

// 3. 항상 최신 데이터
fetch(url, { cache: 'no-store' })
// → 매 요청마다 새로 호출
```

| 기능 | 네이티브 fetch (Next.js) | Axios |
|------|--------------------------|-------|
| ISR 캐싱 (`revalidate`) | ✅ 지원 | ❌ 미지원 |
| 요청 중복 제거 | ✅ 같은 URL 자동 중복 제거 | ❌ 미지원 |
| 정적/동적 렌더링 제어 | ✅ `cache` 옵션으로 제어 | ❌ 미지원 |
| 추가 의존성 | ❌ 불필요 (내장) | ✅ 필요 (`npm install axios`) |
| 서버 번들 크기 | 작음 | 추가됨 |

#### 왜 Axios를 SSR에서 쓰기 어려운가

Axios 자체는 Node.js에서도 동작한다. 하지만 문제는 **기존 클라이언트용 Axios 인스턴스를 SSR에서 재사용할 수 없다**는 점이다.

가장 큰 이유는 **Zustand store가 SSR 환경에 존재하지 않기 때문**이다.

```ts
// 기존 api.ts — 클라이언트 전용
api.interceptors.request.use((config) => {
  const accessToken = useUserStore.getState().accessToken  // ← Zustand: 서버에 없음
  ...
})
```

**Zustand가 SSR에서 동작하지 않는 이유:**

```
브라우저 (CSR): 1 탭 = 1 사용자 = 1 Zustand store
  └─ store = { accessToken: "abc123" }  ← 이 사용자의 토큰, 문제 없음

서버 (SSR): 1 프로세스 = N 사용자 = Zustand store ???
  ├─ 요청 A (사용자 A) ──┐
  ├─ 요청 B (사용자 B) ──┼── store가 공유됨 → 보안 위험
  └─ 요청 C (사용자 C) ──┘
```

- **store가 비어있음**: 서버에서는 아무도 "로그인"하지 않았으므로 `accessToken`이 `null`
- **상태 공유 위험**: 만약 사용자 A의 토큰을 store에 넣으면, 동시에 처리 중인 사용자 B의 요청에도 A의 토큰이 노출될 수 있음
- **`localStorage` 없음**: Zustand의 `persist` 미들웨어가 의존하는 `localStorage`가 서버에 존재하지 않음

결국 SSR에서 Axios를 쓰려면:
1. 서버 전용 Axios 인스턴스를 별도로 생성해야 함
2. 인터셉터를 SSR에 맞게 재작성해야 함 (Zustand 의존 제거)
3. 그래도 Next.js의 캐싱/ISR 기능을 사용할 수 없음
4. 결국 네이티브 fetch 대비 장점 없이 복잡성만 추가됨

---

## 종합 비교

### 도구별 적합도

| 도구 | CSR | SSR | 비고 |
|------|-----|-----|------|
| **Axios** | ✅ 최적 | ⚠️ 가능하나 비권장 | 인터셉터, Zustand 연동에 강점. SSR에서는 Next.js 캐싱 미지원 |
| **네이티브 fetch** | ✅ 가능 | ✅ 최적 | Next.js 확장 기능(ISR, 캐싱, 중복 제거) 활용 가능 |
| **TanStack Query** | ✅ 최적 | ⚠️ 보조적 | CSR에서 캐싱/상태 관리 담당. SSR 데이터를 `initialData`로 수신 가능 |

### 권장 패턴: CSR + SSR 하이브리드

```
SSR (Server Component)
  └─ 네이티브 fetch로 초기 데이터 조회 (캐싱 + ISR)
  └─ 초기 HTML에 데이터 포함 → LCP 개선

CSR (Client Component)
  └─ Axios + TanStack Query로 이후 인터랙션 처리
  └─ 필터 변경, 무한 스크롤, 토큰 기반 API 호출
  └─ SSR 데이터를 initialData로 받아 중복 요청 방지
```

---

## 이 프로젝트에서의 적용

### Before: CSR 단독

```
page.tsx (Server) → Home.tsx (Client) → useInfiniteQuery → API 호출 → 렌더링
                                         ↑ 여기서야 데이터 fetch 시작
```

- 초기 HTML에 데이터 없음
- Lighthouse "Request is discoverable in initial document" ❌

### After: SSR + CSR 하이브리드

```
page.tsx (Server) → fetch로 초기 데이터 조회 → Home.tsx에 initialData 전달
                                                  ↓
                                         useInfiniteQuery(initialData)
                                         → 초기 데이터는 이미 있음, 추가 fetch 불필요
                                         → 필터 변경 시에만 새로운 API 호출
```

- 초기 HTML에 상품 데이터 + 이미지 URL 포함
- Lighthouse "Request is discoverable in initial document" ✅

---

## 결론

**"CSR에서는 Axios, SSR에서는 fetch"가 아니라,
"각 환경의 특성에 맞는 도구를 적재적소에 사용"하는 것이 핵심이다.**

- 인증이 필요하고, 사용자 인터랙션에 반응하는 API 호출 → **Axios + TanStack Query (CSR)**
- 초기 데이터 로딩, SEO, LCP 최적화가 필요한 API 호출 → **네이티브 fetch (SSR)**
- 두 영역을 `initialData` 패턴으로 연결하면 중복 없이 자연스럽게 통합할 수 있다.
