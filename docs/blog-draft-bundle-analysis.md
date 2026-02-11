# Next.js 번들 분석기로 홈페이지 JS 839KB의 정체를 파헤치다

> TBT 190ms의 원인을 찾기 위해 @next/bundle-analyzer를 사용했다. 결론은 예상 밖이었다.

---

## 들어가며

커들마켓 홈페이지의 Lighthouse 성능 점수를 개선하는 과정에서, TBT(Total Blocking Time)가 190ms로 점수를 깎고 있었다.

DebugBear의 CPU Time By Request를 보면 `5f**.js`라는 청크 하나가 **335ms**의 CPU 시간을 먹고 있었다.

| 청크 | CPU Time |
|------|----------|
| `5f**.js` | 335ms |
| HTML 문서 | 94ms |
| `8b**.js` | 68ms |
| `7d**.js` | 67ms |

335ms라니. 대체 이 청크 안에 뭐가 들어 있는 걸까? 혹시 내가 작성한 코드가 비효율적인 건 아닐까? 번들 크기를 줄이면 TBT를 낮출 수 있지 않을까?

이 궁금증에서 시작해서 `@next/bundle-analyzer`를 설치하고 분석을 진행했다.

---

## @next/bundle-analyzer 설치 및 설정

### 설치

```bash
npm install --save-dev @next/bundle-analyzer
```

### next.config.ts 설정

```ts
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  // 기존 설정...
};

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer({ enabled: true })(nextConfig)
  : nextConfig;
```

### 실행

```bash
ANALYZE=true npx next build
```

### 첫 번째 함정: Turbopack 호환 문제

그런데 실행하자마자 에러가 발생했다.

```
The Next Bundle Analyzer is not compatible with Turbopack builds.
```

Next.js 16은 기본적으로 **Turbopack**을 빌드에 사용하는데, `@next/bundle-analyzer`는 **webpack 기반**이라 호환되지 않았다.

해결 방법은 `--webpack` 플래그를 추가하는 것이다:

```bash
ANALYZE=true npx next build --webpack
```

이렇게 하면 webpack 모드로 빌드되면서 번들 분석 결과가 생성된다. 빌드가 완료되면 브라우저에 **트리맵**이 자동으로 열린다. 각 JS 청크가 크기에 비례한 사각형으로 표시되고, 그 안에 포함된 모듈(라이브러리, 컴포넌트 등)이 중첩된 사각형으로 나뉘어 보인다. 사각형을 클릭하면 해당 청크 안에 어떤 모듈이 얼마나 차지하는지 확인할 수 있다.

단, 여기서 중요한 주의점이 있다. **webpack으로 분석한 결과와 실제 프로덕션(Turbopack) 빌드의 청크 구조가 다를 수 있다.** webpack의 `splitChunks` 전략과 Turbopack의 청크 분할 전략이 다르기 때문이다. 그래서 트리맵에서 보이는 청크 이름과 DebugBear에서 보이는 청크 이름이 일치하지 않았고, 내용을 대조해가며 매칭하는 과정이 필요했다.

---

## 분석 결과: 839KB의 구성

트리맵과 DebugBear CPU Time 데이터를 대조해서 홈페이지에 로드되는 16개 JS 청크의 내용을 파악했다.

| 청크 | 크기 | CPU Time | 내용 |
|------|:---:|:---:|------|
| `5f6838a6...js` | 219KB | 335ms | react-dom + Next.js 런타임 |
| `a6dad97d...js` | 110KB | - | zustand + axios + Header 컴포넌트 |
| `7d6514a9...js` | 108KB | 67ms | Next.js 런타임 |
| 기타 13개 | ~402KB | ~130ms | 앱 코드, 유틸리티 등 |
| **합계** | **839KB** | | |

상위 3개 청크(219KB + 110KB + 108KB = 437KB)가 전체 839KB의 **52%**를 차지한다. 그리고 이 3개 모두 **내가 작성한 코드가 아니라 프레임워크와 라이브러리**였다.

처음에 "내 코드가 비효율적인 건 아닐까?"라고 생각했는데, 실제로는 반 이상이 React와 Next.js 자체의 비용이었다.

---

## react-hook-form이 왜 홈페이지에?

트리맵을 보다가 예상치 못한 것을 발견했다. **react-hook-form**이 홈페이지 청크에 포함되어 있었다.

홈페이지에는 폼이 없다. 상품 목록만 보여주는 페이지인데 왜 폼 라이브러리가 로드되는 걸까?

### import 체인 추적

코드베이스에서 react-hook-form을 import하는 곳을 추적했다:

```
react-hook-form
  ← src/features/login/Login.tsx (로그인 페이지)
  ← src/features/product-post/... (상품 등록 페이지)
```

홈페이지(`/`)에서 직접 import하는 곳은 없었다. 그런데 왜 로드될까?

### 원인: (main) 레이아웃 그룹의 공유 청크

Turbopack(그리고 webpack의 `splitChunks`)은 **같은 레이아웃 그룹 안의 라우트들이 공통으로 사용하는 모듈을 하나의 공유 청크로 묶는다.**

커들마켓의 라우트 구조를 보면:

```
app/(main)/layout.tsx        ← 공유 레이아웃
  ├── app/(main)/page.tsx    ← 홈페이지 (/)
  ├── app/(main)/login/      ← 로그인 (/login) — react-hook-form 사용
  ├── app/(main)/product-post/ ← 상품 등록 — react-hook-form 사용
  └── ...
```

`(main)` 레이아웃 그룹 안의 모든 라우트가 같은 레이아웃을 공유한다. 번들러는 이 라우트들에서 공통으로 사용하는 모듈을 공유 청크로 분리하는데, react-hook-form이 로그인과 상품 등록 두 곳에서 사용되므로 공유 청크에 포함된다. 그리고 이 공유 청크는 홈페이지에서도 로드된다.

### 해결할 수 있는가?

**import 구조를 바꾸는 것으로는 해결할 수 없다.** 이건 번들러의 청크 분할 전략에 의한 것이다.

해결하려면 로그인/상품등록 페이지를 별도 레이아웃 그룹으로 분리해야 하는데, 같은 Header/Footer를 공유해야 해서 코드 중복이 발생한다. react-hook-form 자체가 ~30KB(gzip) 정도로 TBT에 미치는 영향이 크지 않기 때문에, 라우트 구조 변경의 복잡도 대비 효과가 미미하다고 판단하고 **수용**했다.

---

## TBT 190ms의 진짜 정체

번들 분석의 가장 큰 수확은 이것이었다. DebugBear의 CPU Time 데이터와 번들 분석 결과를 대조해보니:

```
TBT 190ms의 구성:

react-dom 하이드레이션     ~100ms  ← 줄일 수 없음
Next.js 런타임             ~70ms   ← 줄일 수 없음
앱 코드                    ~20ms   ← 유일하게 줄일 수 있는 부분
```

**TBT 190ms 중 약 170ms는 React와 Next.js가 하이드레이션을 수행하는 데 드는 고정 비용이었다.** 프레임워크를 사용하는 한 이 비용은 피할 수 없다.

내가 줄일 수 있는 앱 코드 비중은 고작 20ms. 아무리 코드를 최적화해도 TBT를 의미 있게 줄일 수 없다는 뜻이었다.

---

## 생각의 전환: "번들 줄이기"가 아니라 "HTML에 콘텐츠 넣기"

번들 분석 전에는 "JS 번들 크기를 줄이면 TBT가 낮아질 것"이라고 생각했다. 하지만 분석 결과를 보고 나니, **번들 크기를 줄이는 건 해결책이 아니었다.**

대신 다른 방향을 찾았다. TBT가 높은 근본적인 이유는 **Suspense bailout** 때문이었다.

Suspense bailout이란, 서버에서 HTML을 만들 때 `<Suspense>` 안의 컴포넌트가 클라이언트에서만 실행 가능한 코드(예: `useQuery`로 API 호출)를 포함하고 있으면, 서버가 해당 콘텐츠 렌더링을 **포기(bailout)**하고 fallback(스켈레톤)만 HTML에 넣는 현상이다. 쉽게 말해 **"서버가 콘텐츠를 못 그려서 JS한테 떠넘기는 것"**이다.

커들마켓 홈페이지의 상품 목록이 클라이언트에서 `useQuery`로 데이터를 가져오는 구조였기 때문에, 초기 HTML에는 실제 상품 카드가 없고 스켈레톤만 들어 있었다. 브라우저가 JS를 다운로드하고 실행한 후에야 상품 카드가 렌더링되었고, 그 JS 실행 시간이 곧 TBT가 되었다. 그래서 접근을 바꿨다:

**"JS 번들을 줄이자" → "초기 HTML에 콘텐츠를 포함시키자"**

이 발상의 전환으로 만든 것이 `StaticHomeFallback`이다. Suspense의 fallback을 스켈레톤 대신 실제 상품 데이터가 담긴 서버 컴포넌트로 교체했더니, 초기 HTML에 `<img>` 태그 22개가 포함되었고 점수가 91 → 94로 개선되었다.

### forced reflow 제거: 77ms 추가 개선

`StaticHomeFallback` 적용 후에도 TBT가 여전히 높았는데, DebugBear에서 **forced reflow가 77ms**를 차지하고 있었다.

**forced reflow란?** 브라우저는 화면을 그릴 때 "레이아웃 계산 → 페인트" 순서로 진행한다. 그런데 JS가 레이아웃 정보(`scrollWidth`, `offsetHeight` 등)를 읽으려고 하면, 브라우저는 아직 계산이 끝나지 않았더라도 **강제로 레이아웃을 다시 계산**해야 한다. 이것이 forced reflow이고, 그동안 메인 스레드가 멈추면서 TBT가 늘어난다.

홈페이지의 `ProductPetTypeTabs` 컴포넌트가 원인이었다. 탭 영역의 스크롤 가능 여부를 판단하기 위해 `useEffect` 안에서 `scrollWidth`와 `clientWidth`를 읽는 `handleScroll()`을 **마운트 직후 즉시 호출**하고 있었다:

```tsx
// 수정 전: 마운트 직후 즉시 호출 → forced reflow 발생
useEffect(() => {
  handleScroll()                              // 여기서 scrollWidth 읽음
  el.addEventListener('scroll', handleScroll)
  return () => el.removeEventListener('scroll', handleScroll)
}, [])
```

컴포넌트가 마운트되는 시점에 브라우저가 아직 레이아웃 계산을 끝내지 않은 상태에서 `scrollWidth`를 읽으니, 브라우저가 강제로 레이아웃을 계산하면서 77ms가 소요된 것이다.

**`requestAnimationFrame`**은 브라우저에게 "다음 화면을 그리기 직전에 이 함수를 실행해줘"라고 예약하는 API이다. 이것을 사용하면 브라우저가 레이아웃 계산을 자연스럽게 마친 후에 `scrollWidth`를 읽기 때문에 forced reflow가 발생하지 않는다:

```tsx
// 수정 후: 다음 프레임으로 지연 → forced reflow 제거
useEffect(() => {
  const rafId = requestAnimationFrame(handleScroll) // 다음 프레임에 실행
  el.addEventListener('scroll', handleScroll, { passive: true })
  return () => {
    cancelAnimationFrame(rafId)
    el.removeEventListener('scroll', handleScroll)
  }
}, [])
```

`handleScroll()` → `requestAnimationFrame(handleScroll)`로 한 줄만 바꿨을 뿐인데, forced reflow 77ms가 사라지면서 TBT는 **190ms → 70ms**까지 내려갔다.

---

## 정리

### @next/bundle-analyzer 사용 시 주의점

1. **Turbopack과 호환 불가** — `ANALYZE=true npx next build --webpack` 으로 실행
2. **webpack 결과 ≠ Turbopack 결과** — 청크 이름과 구조가 다르므로 내용을 대조해서 매칭해야 한다

### 번들 분석에서 배운 것

번들 분석의 가치는 "크기를 줄이는 것"보다 **"내 앱의 JS가 어떻게 구성되어 있는지 이해하는 것"**에 있었다.

TBT가 높을 때 "코드를 최적화해야 한다"고 생각하기 쉽지만, 실제로는 **앱 코드가 차지하는 비중은 20ms에 불과**했고 나머지 170ms는 프레임워크 비용이었다. 이 사실을 알게 되면서 최적화의 방향이 완전히 바뀌었고, 실제로 점수 개선으로 이어졌다.

---

*이 글은 커들마켓 프로젝트의 성능 최적화 과정을 기록한 시리즈의 일부입니다.*
