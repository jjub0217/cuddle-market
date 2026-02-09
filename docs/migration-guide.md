# Next.js 마이그레이션 가이드

Vite + React Router 프로젝트를 Next.js App Router로 마이그레이션하는 단계별 가이드입니다.

---

## Phase 1: 프로젝트 초기화

### 1.1 Next.js 초기화

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 1.2 Dependencies 설치

```bash
# 상태 관리 & 데이터 페칭
npm install zustand @tanstack/react-query axios

# UI & 애니메이션
npm install framer-motion lucide-react react-icons
npm install class-variance-authority clsx tailwind-merge

# 폼 & 날짜
npm install react-hook-form react-datepicker date-fns

# 파일 업로드
npm install react-dropzone browser-image-compression

# 드래그 앤 드롭
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# 실시간 통신
npm install @stomp/stompjs sockjs-client event-source-polyfill

# 마크다운
npm install react-markdown rehype-sanitize remark-breaks

# 타입 정의
npm install -D @types/sockjs-client @types/event-source-polyfill
```

### 1.3 환경변수 설정

`.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=https://cmarket-api.duckdns.org/api
NEXT_PUBLIC_WS_URL=https://cmarket-api.duckdns.org/ws-stomp
```

---

## Phase 2: 기존 소스 복사

```bash
cp -r ~/Desktop/Cuddle-Market-FE/src/components src/
cp -r ~/Desktop/Cuddle-Market-FE/src/hooks src/
cp -r ~/Desktop/Cuddle-Market-FE/src/store src/
cp -r ~/Desktop/Cuddle-Market-FE/src/types src/
cp -r ~/Desktop/Cuddle-Market-FE/src/constants src/
mkdir -p src/lib
cp -r ~/Desktop/Cuddle-Market-FE/src/api src/lib/
cp -r ~/Desktop/Cuddle-Market-FE/src/utils src/lib/
cp -r ~/Desktop/Cuddle-Market-FE/public/* public/
```

---

## Phase 3: 라우팅 변환

| React Router | Next.js App Router |
|--------------|-------------------|
| `useNavigate()` | `useRouter()` from `next/navigation` |
| `navigate('/path')` | `router.push('/path')` |
| `<Link to="/path">` | `<Link href="/path">` |
| `useParams()` | `useParams()` from `next/navigation` |

---

## Phase 4: 환경변수 변환

```tsx
// 기존 (Vite)
import.meta.env.VITE_API_BASE_URL

// 변경 (Next.js)
process.env.NEXT_PUBLIC_API_BASE_URL
```

---

## Phase 5: Client Component 표시

상호작용이 필요한 컴포넌트에 `'use client'` 추가:

```tsx
'use client';

import { useState } from 'react';
// ...
```

---

## 참고

- [Next.js 공식 문서](https://nextjs.org/docs)
- [App Router 마이그레이션 가이드](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
