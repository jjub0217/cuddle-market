# Next.js 학습 컨텍스트 (React 개발자용)

이 문서는 React.js를 알고 있는 개발자가 Next.js App Router를 이해하기 위한 가이드입니다.
Cuddle-Market 프로젝트의 Vite + React Router → Next.js 마이그레이션 과정에서 배운 내용을 정리했습니다.

---

## 1. 핵심 개념: 파일 기반 라우팅

### React Router (기존)
```tsx
// App.tsx에서 라우팅을 코드로 정의
<Route path="/" element={<Home />} />
<Route path="/community" element={<Community />} />
<Route path="/chat/:id" element={<Chat />} />
```

### Next.js App Router (신규)
```
src/app/
  page.tsx              → "/"
  community/
    page.tsx            → "/community"
  chat/
    [id]/
      page.tsx          → "/chat/:id" (동적 라우트)
```

**핵심**: 폴더 구조 = URL 경로. 라우팅 코드를 작성할 필요 없음.

---

## 2. 예약된 파일명

Next.js가 **자동으로 인식**하는 특별한 파일명들:

| 파일명 | 역할 | import 필요? |
|--------|------|-------------|
| `page.tsx` | 해당 경로의 페이지 | 자동 |
| `layout.tsx` | 하위 페이지들을 감싸는 레이아웃 | 자동 |
| `loading.tsx` | 로딩 UI (Suspense fallback) | 자동 |
| `error.tsx` | 에러 UI | 자동 |
| `not-found.tsx` | 404 UI | 자동 |

예시:
```
src/app/
  layout.tsx      ← 모든 페이지에 적용되는 루트 레이아웃
  page.tsx        ← "/" 페이지
  community/
    layout.tsx    ← /community/* 페이지들에만 적용
    page.tsx      ← "/community" 페이지
```

---

## 3. Route Group: 괄호 `()` 폴더

**URL에 영향 없이** 페이지들을 그룹화하고 공통 레이아웃 적용.

```
src/app/
  (main)/                 ← URL에 포함 안 됨
    layout.tsx            ← MainLayout 적용
    page.tsx              → "/" (not "/main")
    community/
      page.tsx            → "/community" (not "/main/community")

  auth/                   ← URL에 포함됨
    login/
      page.tsx            → "/auth/login"
```

**용도**:
- `(main)`: 헤더/네비게이션이 있는 페이지들
- `auth/`: 레이아웃 없는 인증 페이지들

---

## 4. Server Components vs Client Components

### 기본값: Server Component
```tsx
// page.tsx - 기본적으로 서버에서 렌더링
export default function Page() {
  return <div>서버에서 렌더링됨</div>
}
```

### Client Component: 'use client' 필요
```tsx
'use client'  // ← 파일 최상단에 필수

import { useState, useEffect } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)  // 브라우저 API 사용
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### 'use client'가 필요한 경우
- `useState`, `useEffect`, `useRef` 등 React 훅 사용
- `onClick`, `onChange` 등 이벤트 핸들러 사용
- `window`, `document`, `localStorage` 등 브라우저 API 사용
- `usePathname()`, `useSearchParams()`, `useRouter()` 등 next/navigation 훅 사용

---

## 5. SSR과 Hydration

### SSR (Server-Side Rendering)이란?
1. 서버에서 HTML을 미리 생성
2. 브라우저로 HTML 전송 (빠른 초기 로드)
3. JavaScript 로드 후 이벤트 연결 (Hydration)

### Hydration 에러
서버 HTML과 클라이언트 초기 렌더링이 다르면 에러 발생.

**문제 예시**:
```tsx
// useMediaQuery가 서버에서는 false, 클라이언트에서는 true 반환
const isXl = useMediaQuery('(min-width: 1280px)')
// → 서버/클라이언트 className 불일치 → Hydration 에러
```

**해결책**: 항상 동일한 초기값으로 시작
```tsx
export function useMediaQuery(query: string): boolean {
  // SSR-safe: 항상 false로 시작
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // 클라이언트에서만 실제 값으로 업데이트
    setMatches(window.matchMedia(query).matches)
  }, [query])

  return matches
}
```

---

## 6. SSR-safe 패턴들

### SSR-safe란?

**SSR-safe** = Server-Side Rendering에서 안전하게 동작하는 코드

Next.js는 컴포넌트를 **서버에서 먼저 렌더링**합니다. 이때 브라우저 전용 API(`window`, `document`, `localStorage` 등)는 서버에 존재하지 않습니다.

```
[서버]                              [브라우저]
  │                                    │
  ├─ window? ❌ 없음                   ├─ window? ✅ 있음
  ├─ localStorage? ❌ 없음             ├─ localStorage? ✅ 있음
  └─ document? ❌ 없음                 └─ document? ✅ 있음
```

**SSR-safe 코드**란:
1. 서버에서 에러 없이 실행되고
2. 서버와 클라이언트에서 **동일한 초기 결과**를 반환하는 코드

### 왜 중요한가?

서버와 클라이언트의 렌더링 결과가 다르면 **Hydration 에러** 발생:
```
Error: Hydration failed because the server rendered HTML didn't match the client
```

**예시**: 로그인 상태 확인
```tsx
// ❌ SSR-unsafe - Hydration 에러 발생
const isLoggedIn = localStorage.getItem('token') !== null
// 서버: localStorage 없음 → 에러 또는 false
// 클라이언트: localStorage 있음 → true (로그인 시)
// → 결과 불일치 → Hydration 에러!

// ✅ SSR-safe - useEffect로 클라이언트에서만 확인
const [isLoggedIn, setIsLoggedIn] = useState(false)  // 서버/클라이언트 동일
useEffect(() => {
  setIsLoggedIn(localStorage.getItem('token') !== null)  // 클라이언트에서만 실행
}, [])
```

---

### localStorage 접근
```tsx
// ❌ 잘못된 방법
const [value] = useState(localStorage.getItem('key'))  // 서버에서 에러

// ✅ SSR-safe 방법
const storage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null  // 서버면 null
    return localStorage.getItem(name)
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(name, value)
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(name)
  },
}
```

### dynamic import로 SSR 비활성화
```tsx
import dynamic from 'next/dynamic'

// 이 컴포넌트는 클라이언트에서만 렌더링
const LoginModal = dynamic(() => import('@/components/LoginModal'), {
  ssr: false  // 서버에서 렌더링하지 않음
})
```

---

## 7. useSearchParams와 Suspense

`useSearchParams()`를 사용하는 페이지는 반드시:

```tsx
// page.tsx
import { Suspense } from 'react'
import Home from '@/features/home/Home'

export const dynamic = 'force-dynamic'  // 1. 동적 렌더링 강제

export default function HomePage() {
  return (
    <Suspense fallback={null}>  {/* 2. Suspense로 감싸기 */}
      <Home />
    </Suspense>
  )
}
```

**이유**: `useSearchParams()`는 빌드 시점에 알 수 없는 값이므로 동적 렌더링 필요.

---

## 8. React Router → Next.js 마이그레이션

### 라우팅 관련 변경

| React Router | Next.js |
|--------------|---------|
| `react-router-dom` | `next/navigation` |
| `<Link to="/path">` | `<Link href="/path">` |
| `useNavigate()` | `useRouter()` |
| `useLocation().pathname` | `usePathname()` |
| `useParams()` | `useParams()` |
| `useSearchParams()` | `useSearchParams()` |
| `<Outlet />` | `{children}` |

### 예시: useNavigate → useRouter
```tsx
// React Router
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/home')
navigate(-1)  // 뒤로가기

// Next.js
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/home')
router.back()  // 뒤로가기
```

### 예시: Layout 변환
```tsx
// React Router - MainLayout.tsx
import { Outlet } from 'react-router-dom'
export default function MainLayout() {
  return (
    <div>
      <Header />
      <Outlet />  {/* 자식 라우트 렌더링 */}
    </div>
  )
}

// Next.js - MainLayout.tsx
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      {children}  {/* 자식 페이지 렌더링 */}
    </div>
  )
}
```

---

## 9. 환경변수

| Vite | Next.js |
|------|---------|
| `import.meta.env.VITE_API_URL` | `process.env.NEXT_PUBLIC_API_URL` |

- `NEXT_PUBLIC_` 접두사: 클라이언트에서 접근 가능
- 접두사 없음: 서버에서만 접근 가능

---

## 10. 정적 에셋 (이미지, SVG) 처리

### Vite vs Next.js 차이점

| Vite | Next.js |
|------|---------|
| `import logo from './logo.svg'` → 경로 문자열 | `import logo from './logo.svg'` → 모듈 객체 |
| `<img src={logo} />` 바로 사용 | `<img src={logo.src} />` 또는 `<Image src={logo} />` |

### SVG 사용 방법

**방법 1: public 폴더 사용 (권장)**
```tsx
// SVG 파일을 public/images/에 복사
// public/images/kakao.svg

// 컴포넌트에서 경로로 직접 참조
<img src="/images/kakao.svg" alt="카카오" />
<Button iconSrc="/images/kakao.svg">카카오 로그인</Button>
```

**방법 2: next/image 사용**
```tsx
import Image from 'next/image'
import logo from '@/assets/images/logo.svg'

// StaticImageData 객체이므로 Image 컴포넌트에서 사용
<Image src={logo} alt="로고" />

// 일반 img 태그에서는 .src 필요
<img src={logo.src} alt="로고" />
```

### 이 프로젝트에서의 처리

소셜 로그인 아이콘 등 기존 `src/assets/images/`의 SVG들을 `public/images/`로 복사하여 사용:
```
public/
  images/
    kakao.svg
    google.svg
```

---

## 11. 프로젝트 폴더 구조

```
src/
  app/                    ← Next.js 라우팅 (예약됨)
    (main)/               ← Route Group (MainLayout 적용)
      layout.tsx
      page.tsx            → "/"
      community/
        page.tsx          → "/community"
        [id]/
          page.tsx        → "/community/:id"
    auth/                 ← 레이아웃 없는 페이지들
      login/
        page.tsx          → "/auth/login"
    layout.tsx            ← 루트 레이아웃
    providers.tsx         ← QueryClientProvider 등

  features/               ← 실제 페이지 컴포넌트들 (기존 pages/)
    home/Home.tsx
    community/Community.tsx

  components/             ← 공통 컴포넌트
  hooks/                  ← 커스텀 훅
  store/                  ← Zustand 스토어
  lib/                    ← 유틸리티, API 등
    api/
    utils/
  layouts/                ← 레이아웃 컴포넌트
  constants/              ← 상수
  types/                  ← TypeScript 타입
```

### 왜 features 폴더를 따로 두나요?

`app/` 폴더는 Next.js 라우팅 규칙에 종속됨:
- `page.tsx` → 페이지
- `layout.tsx` → 레이아웃
- 기타 파일은 라우팅에 영향

실제 UI 로직을 `features/`에 분리하면:
- 기존 React 코드를 거의 그대로 유지 가능
- `app/`의 page.tsx는 라우팅 + Next.js 설정만 담당

---

## 12. 자주 발생하는 에러와 해결

### "use client" 누락
```
Error: useState only works in Client Components
```
→ 파일 최상단에 `'use client'` 추가

### 이벤트 핸들러 에러
```
Error: Event handlers cannot be passed to Client Component props.
  <button onClick={function handleClick} ...>
```
→ `onClick`, `onChange` 등 이벤트 핸들러를 사용하는 컴포넌트에 `'use client'` 추가

**실제 사례**: `SocialLoginButtons.tsx`에서 `onClick={handleKakaoLogin}` 사용
```tsx
// ❌ 에러 발생 - Server Component에서 이벤트 핸들러 사용
export function SocialLoginButtons() {
  const handleKakaoLogin = () => { ... }
  return <Button onClick={handleKakaoLogin}>로그인</Button>
}

// ✅ 해결 - 'use client' 추가
'use client'
export function SocialLoginButtons() {
  const handleKakaoLogin = () => { ... }
  return <Button onClick={handleKakaoLogin}>로그인</Button>
}
```

### Hydration 에러
```
Error: Hydration failed because the server rendered HTML didn't match the client
```
→ 서버/클라이언트 초기값 일치시키기 (섹션 6 참고)

**실제 사례**: `UserControls.tsx`에서 로그인 상태에 따라 다른 UI 렌더링
```tsx
// ❌ Hydration 에러 - 서버와 클라이언트 결과 불일치
const { isLogin } = useUserStore()
return isLogin() ? <UserMenu /> : <AuthMenu />
// 서버: isLogin() → false (localStorage 없음)
// 클라이언트: isLogin() → true (로그인 상태)

// ✅ SSR-safe - 초기값 동일, 마운트 후 업데이트
const [isLoggedIn, setIsLoggedIn] = useState(false)  // 항상 false로 시작
useEffect(() => {
  setIsLoggedIn(isLogin())  // 클라이언트에서만 실제 값으로 업데이트
}, [isLogin, user])
return isLoggedIn ? <UserMenu /> : <AuthMenu />
```

### useSearchParams 에러
```
Error: useSearchParams() should be wrapped in a suspense boundary
```
→ `export const dynamic = 'force-dynamic'` + `<Suspense>` 래핑

### localStorage 에러
```
Error: localStorage is not defined
```
→ `typeof window === 'undefined'` 체크 추가

### API 요청 403 Forbidden (CORS)
```
// 브라우저 네트워크 탭에서 403 에러
check?nickname=xxx  403  xhr
```
→ **포트 확인**: 서버에서 `localhost:3000`만 CORS 허용하는 경우, 다른 포트(3001, 3002 등)에서는 403 발생

**해결 방법**:
1. 포트 3000을 사용 중인 프로세스 확인: `lsof -i :3000`
2. 해당 프로세스 종료: `kill <PID>` 또는 `pkill -f "next dev"`
3. 개발 서버 재시작: `npm run dev` → `http://localhost:3000`에서 실행 확인

**Turbopack 캐시 에러 발생 시**:
```
FATAL: An unexpected Turbopack error occurred
```
→ `.next` 폴더 삭제 후 재시작: `rm -rf .next && npm run dev`

### SVG import 에러
```
// 이미지가 표시되지 않음 (Vite → Next.js 마이그레이션 시)
import kakao from '@/assets/images/kakao.svg'
<img src={kakao} />  // kakao가 문자열이 아닌 객체
```
→ SVG를 `public/` 폴더로 이동하고 경로 문자열로 직접 참조
```tsx
<img src="/images/kakao.svg" />
```

---

## 13. 이 프로젝트에서 변경된 파일 목록

### 새로 생성된 파일
- `src/app/layout.tsx` - 루트 레이아웃
- `src/app/providers.tsx` - QueryClientProvider
- `src/app/(main)/layout.tsx` - MainLayout 적용
- `src/app/(main)/page.tsx` 및 기타 라우트 파일들
- `src/components/AuthValidator.tsx` - 인증 상태 검증
- `src/components/ClientComponents.tsx` - 클라이언트 전용 컴포넌트 래퍼

### 수정된 파일
- `src/store/userStore.ts` - SSR-safe storage 추가
- `src/hooks/useMediaQuery.ts` - SSR-safe 초기값
- `src/layouts/MainLayout.tsx` - Outlet → children
- `src/features/**/*.tsx` - 'use client' 추가, import 경로 수정
- `src/features/login/components/SocialLoginButtons.tsx` - 'use client' 추가, SVG import를 public 경로로 변경
- `src/components/header/components/UserControls.tsx` - SSR-safe 로그인 상태 체크 (Hydration 에러 해결)
- `src/components/header/components/MobileNavigation.tsx` - SSR-safe 로그인 상태 체크 (Hydration 에러 해결)
- `src/components/commons/InputWithButton.tsx` - 'use client' 추가
- `src/features/home/Home.tsx` - SSR-safe 로그인 상태 체크 (Hydration 에러 해결)

### 추가된 정적 파일
- `public/images/kakao.svg` - 카카오 로그인 아이콘
- `public/images/google.svg` - 구글 로그인 아이콘

---

## 다음 세션에서 이어서 할 작업

1. 브라우저에서 각 페이지 기능 테스트 (로그인, 회원가입, 게시글 작성 등)
2. 추가 Hydration 에러 발생 시 수정
3. 프로덕션 빌드 테스트 (`npm run build && npm run start`)

---

## 14. Next.js Image 컴포넌트

### 기본 사용법

`<img>` 태그 대신 `next/image`의 `<Image>` 컴포넌트를 사용하면 자동 이미지 최적화가 적용됩니다.

```tsx
import Image from 'next/image'

// 기본 사용
<Image src="/images/logo.png" alt="로고" width={100} height={100} />

// fill 모드 (부모 크기에 맞춤)
<div className="relative w-32 h-32">
  <Image src={url} alt="이미지" fill className="object-cover" />
</div>
```

### fill 속성 사용 시 주의사항

`fill` 속성을 사용하면 이미지가 **가장 가까운 `position: relative` 부모**를 기준으로 채워집니다.

```tsx
// ✅ 올바른 사용 - 부모에 relative 필수
<div className="relative w-32 h-32 overflow-hidden rounded-lg">
  <Image src={url} alt="이미지" fill className="object-cover" />
</div>

// ❌ 잘못된 사용 - relative 누락
<div className="w-32 h-32">
  <Image src={url} alt="이미지" fill />  {/* 이미지가 페이지 전체를 덮을 수 있음 */}
</div>
```

**실제 사례**: `md:static` 클래스 충돌
```tsx
// ❌ 문제 - md:static이 relative를 덮어써서 레이아웃 깨짐
<div className="relative md:static w-32 h-32">
  <Image src={url} fill />  {/* md 이상에서 이미지가 제대로 표시 안 됨 */}
</div>

// ✅ 해결 - md:static 제거
<div className="relative w-32 h-32">
  <Image src={url} fill />
</div>
```

### 이미지 에러 처리 (Fallback 패턴)

외부 이미지 로드 실패 시 대체 이미지를 보여주는 패턴:

```tsx
const [imgError, setImgError] = useState(false)
const [usePlaceholder, setUsePlaceholder] = useState(false)

// 2단계 fallback: 최적화 이미지 → 원본 → 플레이스홀더
const handleImageError = () => {
  if (!imgError && imageUrl) {
    setImgError(true)  // 1차: 원본 URL 시도
  } else {
    setUsePlaceholder(true)  // 2차: 플레이스홀더 사용
  }
}

const getImageSrc = () => {
  if (usePlaceholder || !imageUrl) return PLACEHOLDER_IMAGE
  if (imgError) return imageUrl  // 원본 URL
  return toResizedWebpUrl(imageUrl, 400)  // 최적화 URL
}

<Image
  src={getImageSrc()}
  loader={imgError || usePlaceholder ? undefined : imageLoader}
  onError={handleImageError}
  unoptimized={imgError || usePlaceholder}  // 에러 시 최적화 비활성화
  fill
/>
```

### imageLoader 함수

커스텀 이미지 로더로 srcSet에 적절한 크기의 이미지를 제공:

```tsx
// lib/utils/imageUrl.ts
export function imageLoader({ src, width }: { src: string; width: number }): string {
  const size: ImageSize = width <= 150 ? 150 : width <= 400 ? 400 : 800
  return toResizedWebpUrl(src, size)
}

// 사용
<Image
  src={url}
  loader={imageLoader}
  sizes="(max-width: 768px) 100vw, 400px"
  fill
/>
```

### overflow-hidden과 절대 위치 요소

이미지 위에 아이콘을 올릴 때, `overflow-hidden` 안에 두면 잘릴 수 있습니다:

```tsx
// ❌ 카메라 아이콘이 잘림
<div className="relative overflow-hidden rounded-full">
  <Image src={url} fill />
  <div className="absolute right-0 bottom-2">
    <Camera />  {/* overflow-hidden 때문에 잘림 */}
  </div>
</div>

// ✅ 외부 wrapper 사용
<div className="relative h-28 w-28">
  <div className="overflow-hidden rounded-full h-full w-full relative">
    <Image src={url} fill />
  </div>
  <div className="absolute right-0 bottom-2">
    <Camera />  {/* overflow-hidden 바깥이라 안 잘림 */}
  </div>
</div>
```

---

## 15. React Compiler와 React Hook Form 호환성

### React Compiler란?

React 19에 도입된 컴파일러로, 컴포넌트를 **자동으로 메모이제이션**합니다.
`useMemo`, `useCallback`을 직접 작성할 필요가 줄어듭니다.

### watch() 함수 경고

React Hook Form의 `watch()` 함수는 React Compiler와 호환되지 않습니다:

```
Compilation Skipped: Use of incompatible library
React Hook Form's `useForm()` API returns a `watch()` function which cannot be memoized safely.
```

**원인**: `watch()`는 매 렌더링마다 새로운 함수 참조를 반환하여 메모이제이션 불가

**해결**: `useWatch` 훅 사용

```tsx
// ❌ React Compiler 경고 발생
const { watch } = useForm()
const nickname = watch('nickname')
const introduction = watch('introduction')

// ✅ useWatch로 변경
import { useForm, useWatch } from 'react-hook-form'

const { control } = useForm()
const nickname = useWatch({ control, name: 'nickname' })
const introduction = useWatch({ control, name: 'introduction' })
```

### useEffect 내 setState 경고

React Compiler는 `useEffect` 안에서 동기적으로 `setState`를 호출하면 경고합니다:

```
Error: Calling setState synchronously within an effect can trigger cascading renders
```

**해결 방법**: 중복 상태를 제거하고 폼 값을 직접 구독

```tsx
// ❌ 중복 상태 + useEffect 내 setState
const [previewUrl, setPreviewUrl] = useState('')

useEffect(() => {
  if (myData) {
    setPreviewUrl(myData.profileImageUrl)  // 경고 발생
    reset({ profileImageUrl: myData.profileImageUrl })
  }
}, [myData])

// ✅ 폼 값을 직접 구독 (중복 제거)
const profileImageUrl = useWatch({ control, name: 'profileImageUrl' })

useEffect(() => {
  if (myData) {
    reset({ profileImageUrl: myData.profileImageUrl })  // 폼만 업데이트
  }
}, [myData])

// profileImageUrl을 직접 사용
<Image src={profileImageUrl} ... />
```

---

## 16. 중복 상태 제거 패턴

### 문제: 같은 값을 여러 곳에 저장

```tsx
// 폼 상태
const { setValue, reset } = useForm()

// 별도 상태 (중복!)
const [previewUrl, setPreviewUrl] = useState('')

// 이미지 업로드 시 두 곳에 저장
setValue('profileImageUrl', uploadedUrl)  // 폼에 저장
setPreviewUrl(uploadedUrl)                 // 별도 상태에도 저장

// 데이터 로드 시 두 곳에 저장
reset({ profileImageUrl: data.url })       // 폼에 저장
setPreviewUrl(data.url)                    // 별도 상태에도 저장
```

### 해결: 폼 값 직접 구독

```tsx
// 폼 값을 구독 (상태 하나로 통일)
const profileImageUrl = useWatch({ control, name: 'profileImageUrl' })

// 이미지 업로드 시 폼만 업데이트
setValue('profileImageUrl', uploadedUrl)

// 데이터 로드 시 폼만 업데이트
reset({ profileImageUrl: data.url })

// 화면에서는 폼 값 직접 사용
<Image src={profileImageUrl} ... />
```

**장점**:
- 코드 간소화 (상태 관리 포인트 감소)
- 동기화 버그 방지 (값이 불일치할 가능성 제거)
- React Compiler 경고 해결

---

## 17. URL을 단일 진실 공급원으로 사용

### 문제: URL 파라미터를 상태에 동기화

URL 파라미터 값을 `useState`로 관리하고 `useEffect`로 동기화하면 React Compiler 경고가 발생합니다:

```tsx
// ❌ 문제: useEffect 내 setState 경고 발생
const searchParams = useSearchParams()
const tabParam = searchParams.get('tab')

const [activeTab, setActiveTab] = useState(tabParam || 'tab-question')

// URL 변경 시 상태 동기화
useEffect(() => {
  if (tabParam) {
    setActiveTab(tabParam)  // 경고: setState in useEffect
  }
}, [tabParam])

const handleTabChange = (tabId: string) => {
  setActiveTab(tabId)  // 상태 업데이트
  router.replace(`?tab=${tabId}`)  // URL도 업데이트
}
```

**문제점**:
- 같은 값(탭 ID)을 두 곳(URL + 상태)에서 관리
- `useEffect`로 동기화 → React Compiler 경고
- 동기화 누락 시 불일치 발생 가능

### 해결: URL에서 직접 계산

상태를 제거하고 URL 파라미터에서 직접 값을 계산합니다:

```tsx
// ✅ 해결: URL을 단일 진실 공급원으로 사용
const searchParams = useSearchParams()
const tabParam = searchParams.get('tab')

// URL에서 직접 계산 (상태 불필요)
const activeTab = tabParam === 'tab-info' ? 'tab-info' : 'tab-question'

const handleTabChange = (tabId: string) => {
  router.replace(`?tab=${tabId}`)  // URL만 업데이트
  // 다음 렌더링에서 activeTab이 자동으로 새 값으로 계산됨
}
```

### 동작 원리

```
[사용자 탭 클릭]
    ↓
router.replace(`?tab=tab-info`)  // URL 업데이트
    ↓
[컴포넌트 리렌더링]
    ↓
searchParams.get('tab')  // 'tab-info' 반환
    ↓
activeTab = 'tab-info'  // 새 값으로 계산됨
```

### 장점

1. **코드 간소화**: `useState`, `useEffect` 제거
2. **동기화 버그 방지**: 값이 한 곳(URL)에만 존재
3. **React Compiler 호환**: `useEffect` 내 `setState` 없음
4. **브라우저 뒤로/앞으로 지원**: URL 변경 시 자동 반영
5. **공유 가능한 URL**: 현재 탭 상태가 URL에 포함됨

### 언제 사용하나요?

- 탭, 필터, 정렬 등 **URL에 저장해야 하는 UI 상태**
- 브라우저 뒤로/앞으로 버튼으로 **복원되어야 하는 상태**
- 다른 사람과 **공유 가능해야 하는 상태**

---

## 참고 링크

- [Next.js App Router 공식 문서](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Next.js Image 최적화](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [React Hook Form useWatch](https://react-hook-form.com/docs/usewatch)
