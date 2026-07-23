# 사용자용 RN 앱 + 점진적 모노레포 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cuddle Market 웹의 사용자 화면(로그인·상품 목록·상세) 3개를 Expo(RN) 앱으로 만들고, 저장소를 pnpm 워크스페이스 모노레포로 세워 웹과 타입을 공유한다.

**Architecture:** 저장소 루트를 pnpm 워크스페이스로 전환(웹은 코드·위치 유지, 설치만 pnpm으로) → `packages/shared`에 공유 타입 → `mobile/` Expo 앱이 Metro 설정으로 shared를 import → 로그인·목록·상세를 기존 백엔드 REST API로 구현. (설계: `docs/superpowers/specs/2026-07-19-rn-app-monorepo-design.md`)

**Tech Stack:** pnpm workspace, Expo(React Native, TypeScript), Metro, axios, expo-secure-store, expo-router. 테스트: **Vitest**(shared 순수 로직) · **Jest/jest-expo**(mobile) · **Maestro**(앱 E2E). 백엔드는 기존 서버(`~/Desktop/cmarket_api`, `https://cmarket-api.duckdns.org/api`) 그대로 사용.

## Global Constraints

- **작업 브랜치에서만.** develop/main 직접 커밋 금지. 이 작업용 브랜치를 파고 진행.
- **층별 테스트 게이트 (겹치지 않는 담당 구역).** 같은 코드를 두 러너로 검사하는 중복 금지.
  - **Vitest** → `packages/shared` 순수 로직
  - **Jest(jest-expo)** → `mobile` 로직·컴포넌트 (axios·SecureStore는 mock)
  - **Maestro** → 앱 E2E(로그인→목록→상세)
  - 공통: `tsc --noEmit` + `eslint` + **실기기(Expo Go) 수동 확인**
  - Playwright는 웹 전용이라 이번 앱 범위 밖(웹 손댈 때).
- **공유 범위**: 첫 마일스톤은 **타입 + 순수 공유 로직(헬퍼)**를 공유한다. API 클라이언트는 플랫폼 결합(웹 Zustand·`NEXT_PUBLIC_` / 앱 SecureStore·`EXPO_PUBLIC_`) 때문에 공유하지 않고 앱에 별도로 작성한다.
- **웹 무손상 원칙**: 웹의 코드/폴더는 옮기지 않는다. pnpm 전환 직후 `pnpm build`로 웹 정상 동작을 반드시 확인한다.
- **패키지명 규칙**: 공유 패키지는 `@cuddle/shared`.
- **API 기본 주소**: `https://cmarket-api.duckdns.org/api` (앱은 `EXPO_PUBLIC_API_BASE_URL`로 주입).
- **커밋 단위**: 태스크마다 검증 통과 후 커밋. 커밋/푸시/PR/머지는 사용자 요청 시에만.

---

## Task 1: 기존 웹 화면 확인 + UI/UX 접근 합의 (그때그때 방식, 코드 없음)

UI/UX는 **미리 다 그리지 않는다.** 로그인·목록·상세가 이미 웹에 있으므로, **각 화면을 만들기 직전(Task 7~9)에 웹 화면을 참고해 모바일 배치를 간단히 스케치**하는 just-in-time 방식으로 간다. **Figma는 쓰지 않는다**(3개 기존 화면 번역엔 과함). 이 태스크에선 대상 화면 확인과 흐름 결정 하나만 한다.

**Files:**
- Create: `docs/superpowers/specs/2026-07-19-rn-app-ui-notes.md` (짧은 결정 노트)

**Interfaces:**
- Produces: 웹에서 모달로 뜨던 알림(예: 로그인 실패)의 **모바일 표현 방식 결정**(인라인 오류 텍스트 / 토스트 / 별도 화면). Task 7이 참조.

- [ ] **Step 1: 대상 웹 화면 3개 훑기**

Cuddle Market 웹의 로그인·상품 목록·상품 상세를 브라우저(가능하면 모바일 뷰)로 열어 요소·흐름을 눈으로 확인한다. (번역 대상 파악.)

- [ ] **Step 2: 모바일 전환 결정 1개**

웹에서 모달로 뜨던 알림(로그인 실패 등)을 앱에선 무엇으로 할지 정한다.
> 권장: **인라인 오류 텍스트** 또는 **토스트**. 별도 화면은 과함. 지엽적 디자인(색·폰트·간격)은 지금 정하지 않는다.

- [ ] **Step 3: 접근 기록 + 커밋**

노트에 (1) 3화면 확인 완료, (2) 알림 표현 결정, (3) "화면별 스케치는 Task 7~9에서 그때그때, Figma 미사용"을 적는다.
```bash
git add docs/superpowers/specs/2026-07-19-rn-app-ui-notes.md
git commit -m "docs: RN 앱 UI/UX 접근(그때그때) + 알림 표현 결정"
```

**검증:** 노트에 3화면 확인 + 알림 표현 결정이 적혀 있는지 확인.

---

## Task 2: 기존 백엔드 API 계약 파악 (읽기, 코드 없음)

백엔드가 이미 존재하므로 API를 **설계하지 않고**, 로그인·목록·상세에 쓸 엔드포인트와 응답 형태를 읽어 정리만 한다.

**Files:**
- Read: `~/Desktop/cmarket_api` (서버 코드), `src/lib/api/auth.ts`, `src/lib/api/products.ts`, `src/lib/api/api.ts`, `src/types/product.ts`, `src/types/auth.ts` (웹의 호출 코드)
- Create: `docs/superpowers/specs/2026-07-19-api-contract-notes.md`

**Interfaces:**
- Produces: 로그인/목록/상세의 (HTTP 메서드, 경로, 요청 바디, 응답 형태). Task 4(타입)·7~9(호출)가 참조.

- [ ] **Step 1: 로그인 계약 확인**

웹 `src/lib/api/auth.ts`의 로그인 함수와 서버 코드에서 경로·요청·응답을 확인한다. 예상 형태:
- `POST /auth/login`, body `{ email, password }`, 응답에 `accessToken`/`refreshToken` 포함.

- [ ] **Step 2: 상품 목록·상세 계약 확인**

웹 `src/lib/api/products.ts`·`src/types/product.ts`와 서버에서 확인:
- 목록: 페이지네이션 응답(`data.content: Product[]`, `hasNext` 등 — `ProductResponse` 형태)
- 상세: 단건(`ProductDetailItem` 형태)

- [ ] **Step 3: 계약 노트 저장 + 커밋**

확인한 경로·요청·응답 형태를 `2026-07-19-api-contract-notes.md`에 적는다.

```bash
git add docs/superpowers/specs/2026-07-19-api-contract-notes.md
git commit -m "docs: 로그인·상품 API 계약 정리(기존 백엔드)"
```

**검증:** 3개 호출 각각의 경로·요청·응답 필드가 노트에 적혀 있는지 확인.

---

## Task 3: pnpm 워크스페이스 뼈대 + 웹 무손상 검증

저장소 루트를 pnpm 워크스페이스로 전환한다. 웹 설치가 pnpm으로 넘어가므로 **직후 웹 빌드로 즉시 검증**한다.

**Files:**
- Create: `pnpm-workspace.yaml`, `.npmrc`
- Modify: `package.json` (루트 — `name`/`private` 확인, 필요 시 추가)
- Delete: `package-lock.json` (pnpm-lock.yaml로 대체)

**Interfaces:**
- Produces: `mobile`, `packages/*`를 워크스페이스 멤버로 인식하는 루트. Task 4·5가 이 위에 폴더를 만든다.

- [ ] **Step 1: pnpm 설치 확인**

Run: `pnpm --version`
없으면 `npm install -g pnpm` 후 재확인. Expected: 버전 출력(예: `9.x`).

- [ ] **Step 2: 워크스페이스 선언 파일 생성**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "mobile"
  - "packages/*"
```

- [ ] **Step 3: npm 호환 안전장치 `.npmrc` 생성**

pnpm의 엄격한 링크가 기존 웹을 깨지 않도록 npm처럼 평평한 `node_modules`를 쓴다.
`.npmrc`:
```
node-linker=hoisted
```

- [ ] **Step 4: 루트 package.json 점검**

루트 `package.json`에 `"name"`과 `"private": true`가 있는지 확인하고 없으면 추가한다(워크스페이스 루트 관례).

- [ ] **Step 5: 기존 lockfile 제거 후 pnpm 설치**

```bash
rm -f package-lock.json
pnpm install
```
Expected: `pnpm-lock.yaml` 생성, 에러 없이 완료.

- [ ] **Step 6: 웹 무손상 검증 (핵심 게이트)**

```bash
pnpm build
```
Expected: 기존과 동일하게 `next build` 성공. 실패 시 로그의 "module not found"류를 보고, 누락 의존성을 `package.json`에 명시(유령 의존성 노출일 수 있음)한 뒤 재빌드.

- [ ] **Step 7: 웹 개발 서버 수동 확인**

```bash
pnpm dev
```
브라우저로 접속해 홈이 정상 렌더되는지 눈으로 확인 후 종료.

- [ ] **Step 8: 커밋**

```bash
git add pnpm-workspace.yaml .npmrc package.json pnpm-lock.yaml
git rm --cached package-lock.json 2>/dev/null || true
git commit -m "chore: pnpm 워크스페이스 뼈대 도입(웹 빌드 검증 완료)"
```

**검증:** `pnpm build` 성공 + 웹 홈 정상 렌더(실물 확인).

---

## Task 4: `packages/shared` 생성 + 공유 타입 + 순수 로직(Vitest)

첫 마일스톤에 필요한 타입(상품·로그인)과 **순수 공유 로직 헬퍼**를 shared에 둔다. 방식 A(처음부터 정석 위치). 헬퍼는 Vitest로 테스트한다(Vitest에 실제 테스트 대상 제공 + 웹·앱 공용 로직 검증).

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/vitest.config.ts`, `packages/shared/src/index.ts`, `packages/shared/src/types/product.ts`, `packages/shared/src/types/auth.ts`, `packages/shared/src/lib/format.ts`, `packages/shared/src/lib/format.test.ts`
- Read(복사 원본): `src/types/product.ts`, `src/types/auth.ts`

**Interfaces:**
- Produces: `@cuddle/shared`가 export하는 타입 — `Product`, `ProductResponse`, `ProductDetailItem`(product.ts), `LoginRequestData`, `LoginResponse`(auth.ts) — 과 순수 헬퍼 `formatPrice(price: number): string`, `isTradeAvailable(tradeStatus: string | null): boolean`. Task 7~9가 import(헬퍼는 목록·상세 화면에서 사용).

- [ ] **Step 1: 패키지 매니페스트 생성**

`packages/shared/package.json`:
```json
{
  "name": "@cuddle/shared",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

- [ ] **Step 2: tsconfig 생성**

`packages/shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "declaration": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 상품 타입 복사**

`src/types/product.ts`에서 `Product`, `ProductResponse`, `ProductDetailItem`을 `packages/shared/src/types/product.ts`로 복사한다. (웹 원본은 그대로 둔다 — 웹의 완전 이전은 후순위.) `@/` 경로에 의존하는 부분이 있으면 shared 안에서 자립하도록 최소 수정.

- [ ] **Step 4: 로그인 타입 복사**

`src/types/auth.ts`에서 로그인에 필요한 `LoginRequestData`, `LoginResponse`(및 이들이 참조하는 최소 타입)를 `packages/shared/src/types/auth.ts`로 복사한다. `@/constants/...` 등 웹 전용 참조는 shared 자립형으로 치환.

- [ ] **Step 5: 순수 공유 로직 헬퍼 작성**

`packages/shared/src/lib/format.ts`:
```ts
/** 가격을 "1,000원" 형태로 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`
}

/** 거래 가능 여부 (tradeStatus 가 null/판매중일 때 true) */
export function isTradeAvailable(tradeStatus: string | null): boolean {
  return tradeStatus === null || tradeStatus === 'SELLING'
}
```
> `isTradeAvailable`의 판정 문자열(`'SELLING'` 등)은 Task 2 계약 노트의 실제 값에 맞춘다.

- [ ] **Step 6: 배럴 export**

`packages/shared/src/index.ts`:
```ts
export * from './types/product'
export * from './types/auth'
export * from './lib/format'
```

- [ ] **Step 7: Vitest 설치 + 설정**

```bash
pnpm --filter @cuddle/shared add -D vitest
```
`packages/shared/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node' },
})
```
`packages/shared/package.json`의 `scripts`에 추가:
```json
"scripts": { "test": "vitest run" }
```

- [ ] **Step 8: 헬퍼 테스트 작성**

`packages/shared/src/lib/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatPrice, isTradeAvailable } from './format'

describe('formatPrice', () => {
  it('천 단위 콤마 + 원', () => {
    expect(formatPrice(1000)).toBe('1,000원')
    expect(formatPrice(0)).toBe('0원')
  })
})

describe('isTradeAvailable', () => {
  it('판매중이면 true', () => {
    expect(isTradeAvailable('SELLING')).toBe(true)
    expect(isTradeAvailable(null)).toBe(true)
  })
  it('판매완료면 false', () => {
    expect(isTradeAvailable('SOLD')).toBe(false)
  })
})
```

- [ ] **Step 9: 테스트 + 타입체크 실행**

```bash
pnpm --filter @cuddle/shared test
pnpm --filter @cuddle/shared exec tsc --noEmit
```
Expected: Vitest 전부 PASS, 타입 에러 없음.

- [ ] **Step 10: 커밋**

```bash
git add packages/shared
git commit -m "feat(shared): 공유 타입 + 순수 로직 헬퍼(Vitest 테스트)"
```

**검증:** `pnpm --filter @cuddle/shared test` 전부 PASS + `tsc --noEmit` 통과.

---

## Task 5: Expo 앱 생성 + 실기기 빈 화면

`mobile/`에 Expo 앱을 만들고 실기기(Expo Go)에서 기본 화면을 띄운다.

**Files:**
- Create: `mobile/` (create-expo-app 산출물 — `app/`, `package.json`, `tsconfig.json`, `app.json` 등)
- Create: `mobile/.env` (`EXPO_PUBLIC_API_BASE_URL`)

**Interfaces:**
- Produces: 실행 가능한 Expo 앱 뼈대(expo-router 기반). Task 6~9가 여기에 화면을 추가.

- [ ] **Step 1: Expo 앱 생성**

```bash
pnpm dlx create-expo-app@latest mobile
```
Expected: `mobile/`에 기본 템플릿(expo-router 포함) 생성.

- [ ] **Step 2: 워크스페이스 재설치**

```bash
pnpm install
```
Expected: mobile이 워크스페이스 멤버로 인식됨.

- [ ] **Step 3: 환경변수 파일 생성**

`mobile/.env`:
```
EXPO_PUBLIC_API_BASE_URL=https://cmarket-api.duckdns.org/api
```
(`.env`가 `.gitignore`에 있는지 확인. 없으면 mobile/.gitignore에 추가.)

- [ ] **Step 4: 개발 서버 실행**

```bash
cd mobile && pnpm exec expo start
```
Expected: 터미널에 QR 코드(Metro 서버) 표시.

- [ ] **Step 5: 실기기 확인 (핵심 게이트)**

폰에 **Expo Go** 앱 설치 → QR 스캔 → 기본 화면이 뜨는지 확인.
> USB 연결 디버깅도 가능(iOS: Safari Web Inspector, Android: Chrome DevTools).

- [ ] **Step 6: Jest(jest-expo) 설치**

```bash
cd mobile && pnpm exec expo install jest-expo jest && pnpm add -D @testing-library/react-native @types/jest
```

- [ ] **Step 7: Jest 설정 + test 스크립트**

`mobile/package.json`에 추가:
```json
"scripts": { "test": "jest" },
"jest": { "preset": "jest-expo" }
```

- [ ] **Step 8: 스모크 테스트 작성 + 실행**

`mobile/lib/smoke.test.ts` (러너 동작 확인용):
```ts
describe('jest 러너 동작', () => {
  it('실행된다', () => {
    expect(1 + 1).toBe(2)
  })
})
```
Run: `cd mobile && pnpm test`
Expected: 1 passed. (확인 후 이 파일은 Task 7에서 실제 테스트로 대체하거나 삭제.)

- [ ] **Step 9: 커밋**

```bash
git add mobile .gitignore pnpm-lock.yaml
git commit -m "feat(mobile): Expo 앱 생성 + Jest(jest-expo) 셋업 + 실기기 확인"
```

**검증:** 실기기에서 기본 화면 렌더(실물) + `pnpm test` 1 passed.

---

## Task 6: Metro 설정 — mobile이 `@cuddle/shared` import

Metro가 앱 폴더 바깥 `packages/shared`를 찾도록 설정하고, 실제 타입 import로 해석을 검증한다.

**Files:**
- Create: `mobile/metro.config.js`
- Modify: `mobile/package.json` (dependencies에 `@cuddle/shared` 추가), `mobile/tsconfig.json` (paths)
- Modify: `mobile/app/(tabs)/index.tsx` 또는 첫 화면 (import 검증용, 임시)

**Interfaces:**
- Consumes: `@cuddle/shared`의 `Product` 타입.
- Produces: mobile에서 shared 타입 해석 성공(모노레포 공유 성립).

- [ ] **Step 1: shared를 의존성으로 추가**

`mobile/package.json`의 `dependencies`에:
```json
"@cuddle/shared": "workspace:*"
```

- [ ] **Step 2: Metro 모노레포 설정 생성**

`mobile/metro.config.js` (Expo 공식 모노레포 가이드 형태):
```js
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// 1) 워크스페이스 전체를 감시(옆 폴더 shared 변경 감지)
config.watchFolders = [workspaceRoot]

// 2) 모듈 해석 경로: 앱의 node_modules → 루트 node_modules 순
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
```

- [ ] **Step 3: tsconfig 경로 매핑**

`mobile/tsconfig.json`의 `compilerOptions.paths`에 추가:
```json
"paths": {
  "@cuddle/shared": ["../packages/shared/src"]
}
```

- [ ] **Step 4: 재설치**

```bash
pnpm install
```
Expected: mobile ↔ shared 링크 생성.

- [ ] **Step 5: import로 해석 검증**

첫 화면 컴포넌트 상단에 임시로 추가:
```tsx
import type { Product } from '@cuddle/shared'
// 임시 확인용: 타입만 참조
const _typecheck: Product | null = null
```

- [ ] **Step 6: 타입체크 + 실기기 확인**

```bash
cd mobile && pnpm exec tsc --noEmit
```
Expected: 에러 없음(shared 타입 해석 성공).
이어서 `expo start`로 앱이 에러 없이 뜨는지 실기기 확인.

- [ ] **Step 7: 커밋**

```bash
git add mobile/metro.config.js mobile/package.json mobile/tsconfig.json pnpm-lock.yaml
git commit -m "feat(mobile): Metro 모노레포 설정 + @cuddle/shared 해석 검증"
```

**검증:** `tsc --noEmit` 통과 + 앱이 shared import한 채 실기기에서 정상 실행.

---

## Task 7: 로그인 화면 + API

앱용 API 계층(토큰은 SecureStore)과 로그인 화면을 만든다.

**Files:**
- Create: `mobile/lib/api.ts` (axios 인스턴스 + baseURL), `mobile/lib/auth.ts` (login 호출 + 토큰 저장), `mobile/lib/auth.test.ts` (Jest), `mobile/app/login.tsx`
- Modify: `mobile/app/_layout.tsx` (라우팅에 login 포함), 이전 태스크의 임시 import 정리
- Add deps: `axios`, `expo-secure-store`

**Interfaces:**
- Consumes: `@cuddle/shared`의 `LoginRequestData`, `LoginResponse`.
- Produces: `login(email, password): Promise<void>`(성공 시 토큰 SecureStore 저장), `getToken(): Promise<string|null>`. Task 8·9가 인증 헤더에 사용.

- [ ] **Step 1: 의존성 추가**

```bash
cd mobile && pnpm exec expo install expo-secure-store && pnpm add axios
```

- [ ] **Step 2: API 인스턴스 작성**

`mobile/lib/api.ts`:
```ts
import axios from 'axios'
import { getToken } from './auth'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

- [ ] **Step 3: 인증(로그인·토큰) 작성**

`mobile/lib/auth.ts`:
```ts
import * as SecureStore from 'expo-secure-store'
import axios from 'axios'
import type { LoginRequestData, LoginResponse } from '@cuddle/shared'

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL
const KEY = 'accessToken'

export async function login(email: string, password: string): Promise<void> {
  const body: LoginRequestData = { email, password }
  const res = await axios.post<LoginResponse>(`${BASE}/auth/login`, body)
  const token = res.data?.data?.accessToken
  if (!token) throw new Error('토큰을 받지 못했습니다')
  await SecureStore.setItemAsync(KEY, token)
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY)
}
```
> 실제 응답 필드 경로(`data.accessToken` 등)는 Task 2의 계약 노트에 맞춘다.

- [ ] **Step 4: 로그인 화면 작성**

먼저 웹 로그인 화면을 참고해 모바일 배치를 간단히 스케치(just-in-time)한 뒤 작성한다.
`mobile/app/login.tsx` — 이메일/비밀번호 `TextInput` + 버튼. 성공 시 `router.replace('/products')`. 실패 시 오류 표시(Task 1에서 정한 인라인/토스트 방식). (RN 컴포넌트 `View`/`Text`/`TextInput`/`Pressable` 사용.)

- [ ] **Step 5: `login()` Jest 유닛 테스트 (mock)**

`mobile/lib/auth.test.ts`:
```ts
import { login } from './auth'
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

jest.mock('axios')
jest.mock('expo-secure-store')

it('로그인 성공 시 토큰을 SecureStore에 저장한다', async () => {
  ;(axios.post as jest.Mock).mockResolvedValue({ data: { data: { accessToken: 'tok123' } } })
  await login('a@b.com', 'pw')
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'tok123')
})
```
Run: `cd mobile && pnpm test`
Expected: PASS. (실제 응답 경로 `data.data.accessToken`은 Task 2 계약에 맞춤.)

- [ ] **Step 6: 타입체크 + lint**

```bash
cd mobile && pnpm exec tsc --noEmit && pnpm exec expo lint
```
Expected: 에러 없음.

- [ ] **Step 7: 실기기 확인 (핵심 게이트)**

실기기에서 실제 계정으로 로그인 → 목록 경로로 이동하는지 확인. (백엔드 응답으로 토큰 수신·저장 성공.)

- [ ] **Step 8: 커밋**

```bash
git add mobile/lib mobile/app/login.tsx mobile/app/_layout.tsx mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): 로그인 화면 + API + Jest 유닛 테스트"
```

**검증:** `pnpm test` PASS + 실기기 로그인 성공 + `tsc`·lint 통과.

---

## Task 8: 상품 목록 화면 + API

로그인 후 상품 목록을 실제 백엔드에서 받아 리스트로 그린다.

**Files:**
- Create: `mobile/lib/products.ts` (목록 호출), `mobile/lib/products.test.ts` (Jest), `mobile/app/products/index.tsx`
- Uses: `mobile/lib/api.ts`

**Interfaces:**
- Consumes: `@cuddle/shared`의 `Product`, `ProductResponse`; `api`(Task 7).
- Produces: `fetchProducts(): Promise<Product[]>`. Task 9가 상세 진입에 목록 아이템의 `id` 사용.

- [ ] **Step 1: 목록 API 작성**

`mobile/lib/products.ts`:
```ts
import { api } from './api'
import type { Product, ProductResponse } from '@cuddle/shared'

export async function fetchProducts(): Promise<Product[]> {
  const res = await api.get<ProductResponse>('/products')
  return res.data.data.content
}
```
> 실제 경로·쿼리(페이지네이션 파라미터)는 Task 2 계약 노트에 맞춘다.

- [ ] **Step 2: `fetchProducts()` Jest 유닛 테스트 (mock)**

`mobile/lib/products.test.ts`:
```ts
import { fetchProducts } from './products'
import { api } from './api'

jest.mock('./api')

it('응답에서 content 배열을 꺼내 반환한다', async () => {
  ;(api.get as jest.Mock).mockResolvedValue({
    data: { data: { content: [{ id: 1, title: '강아지 사료' }] } },
  })
  const list = await fetchProducts()
  expect(list).toHaveLength(1)
  expect(list[0].id).toBe(1)
})
```
Run: `cd mobile && pnpm test`
Expected: PASS.

- [ ] **Step 3: 목록 화면 작성**

먼저 웹 목록 화면을 참고해 모바일 배치를 간단히 스케치(just-in-time)한 뒤 작성한다.
`mobile/app/products/index.tsx` — `FlatList`로 `Product[]` 렌더(썸네일 `mainImageUrl`, 제목 `title`, 가격은 `formatPrice(price)`(shared), 찜수 `favoriteCount`). 로딩·에러 상태 표시. 카드 탭 시 `router.push('/products/' + item.id)`.
> CDN 이미지는 RN `<Image source={{ uri }}>` 사용.

- [ ] **Step 4: 타입체크 + lint**

```bash
cd mobile && pnpm exec tsc --noEmit && pnpm exec expo lint
```
Expected: 에러 없음.

- [ ] **Step 5: 실기기 확인 (핵심 게이트)**

로그인 후 목록에 **실제 상품 데이터**가 뜨는지 확인(가격이 `formatPrice`로 "1,000원" 형태인지도).

- [ ] **Step 6: 커밋**

```bash
git add mobile/lib/products.ts mobile/lib/products.test.ts mobile/app/products/index.tsx
git commit -m "feat(mobile): 상품 목록 화면 + API + Jest 유닛 테스트"
```

**검증:** `pnpm test` PASS + 실기기에 실제 상품 목록 렌더 + `tsc`·lint 통과.

---

## Task 9: 상품 상세 화면 + API + 네비게이션

목록에서 상품을 탭하면 상세 화면으로 이동해 단건 데이터를 보여준다. 첫 마일스톤 완성.

**Files:**
- Create: `mobile/app/products/[id].tsx`
- Modify: `mobile/lib/products.ts` (상세 호출 추가), `mobile/lib/products.test.ts` (상세 테스트 추가)

**Interfaces:**
- Consumes: `@cuddle/shared`의 `ProductDetailItem`; `api`; 목록에서 넘어온 `id`.
- Produces: 없음(첫 마일스톤 종점).

- [ ] **Step 1: 상세 API 추가**

`mobile/lib/products.ts`에 추가:
```ts
import type { ProductDetailItem } from '@cuddle/shared'

export async function fetchProduct(id: number): Promise<ProductDetailItem> {
  const res = await api.get<{ data: ProductDetailItem }>(`/products/${id}`)
  return res.data.data
}
```
> 실제 경로·응답 래핑은 Task 2 계약 노트에 맞춘다.

- [ ] **Step 2: `fetchProduct()` Jest 유닛 테스트 (mock)**

`mobile/lib/products.test.ts`에 추가:
```ts
import { fetchProduct } from './products'

it('단건 상세를 반환한다', async () => {
  ;(api.get as jest.Mock).mockResolvedValue({
    data: { data: { id: 7, title: '고양이 타워' } },
  })
  const p = await fetchProduct(7)
  expect(p.id).toBe(7)
})
```
Run: `cd mobile && pnpm test`
Expected: PASS.

- [ ] **Step 3: 상세 화면 작성**

먼저 웹 상세 화면을 참고해 모바일 배치를 간단히 스케치(just-in-time)한 뒤 작성한다.
`mobile/app/products/[id].tsx` — `useLocalSearchParams`로 `id` 획득 → `fetchProduct(Number(id))` → 대표 이미지·제목·가격(`formatPrice`)·상태·위치 렌더. 로딩·에러 상태 표시. 헤더 뒤로가기.

- [ ] **Step 4: 타입체크 + lint**

```bash
cd mobile && pnpm exec tsc --noEmit && pnpm exec expo lint
```
Expected: 에러 없음.

- [ ] **Step 5: 상세 화면 실기기 확인**

목록에서 카드 탭 → 상세로 이동해 단건 데이터가 뜨는지, 뒤로가기가 되는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add mobile/app/products/[id].tsx mobile/lib/products.ts mobile/lib/products.test.ts
git commit -m "feat(mobile): 상품 상세 화면 + 네비게이션 + Jest 유닛 테스트"
```

**검증:** `pnpm test` PASS + 상세 화면 실기기 정상 + `tsc`·lint 통과.

---

## Task 10: Maestro E2E — 로그인→목록→상세 흐름 (마일스톤 마무리)

앱 전체 흐름을 Maestro로 자동 검증한다. 이 태스크 통과가 첫 마일스톤의 최종 게이트.

**Files:**
- Create: `mobile/.maestro/login-to-detail.yaml`

**Interfaces:**
- Consumes: 완성된 로그인·목록·상세 화면(Task 7~9).
- Produces: 없음(마일스톤 종점).

- [ ] **Step 1: Maestro 설치**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
maestro --version
```
Expected: 버전 출력. (실기기/에뮬레이터가 연결돼 있어야 함.)

- [ ] **Step 2: E2E 흐름 작성**

`mobile/.maestro/login-to-detail.yaml`:
```yaml
appId: host.exp.Exponent   # Expo Go로 실행 시. 독립 빌드면 앱의 실제 appId로.
---
- launchApp
- tapOn: "이메일"
- inputText: "test@example.com"
- tapOn: "비밀번호"
- inputText: "password"
- tapOn: "로그인"
- assertVisible: "상품"        # 목록 화면 진입 확인
- tapOn:
    index: 0
    text: ".*원"               # 첫 상품 카드 탭
- assertVisible: ".*원"        # 상세 화면의 가격 표시 확인
- back
- assertVisible: "상품"        # 목록으로 복귀 확인
```
> 라벨 문자열(`"로그인"`, `"상품"` 등)은 실제 화면 텍스트에 맞춘다. 테스트 계정은 백엔드의 유효 계정으로.

- [ ] **Step 3: E2E 실행 (마일스톤 게이트)**

```bash
cd mobile && maestro test .maestro/login-to-detail.yaml
```
Expected: 모든 단계 통과(로그인→목록→상세→복귀).

- [ ] **Step 4: 커밋**

```bash
git add mobile/.maestro/login-to-detail.yaml
git commit -m "test(mobile): Maestro E2E(로그인→목록→상세)"
```

**검증(Definition of Done, 설계 문서 §10):**
1. 워크스페이스 구조가 서고 웹이 여전히 정상(`pnpm build`).
2. Expo 앱이 실기기에서 실행.
3. mobile이 `@cuddle/shared` 타입·공유 로직을 import(모노레포 공유 성립).
4. 로그인 → 목록 → 상세가 실제 백엔드로 동작.
5. 테스트 통과: **Vitest**(shared) + **Jest**(mobile) + **Maestro**(E2E).
6. `tsc --noEmit`·`eslint` 통과.

---

## Task 11: (선택·학습 트랙) Figma 스파이크 — 상세 화면 1개 디자인→코드

Figma + MCP 워크플로우를 **작게 한 바퀴** 체험한다. 앱 출시 경로와 **별개의 학습 트랙**(마일스톤 필수 아님, 병행 가능). 한 화면(상세)만 대상 — Figma·MCP 감을 잡는 게 목적. 지엽적 디자인(색·폰트) 늪 금지.

**전제:** Figma 원격 MCP(`https://mcp.figma.com/mcp`)가 Claude Code에 연결·인증돼 있어야 함(세션에서 별도 설정).

**Files:**
- Figma 파일(클라우드) + Create: `docs/superpowers/specs/2026-07-19-figma-spike-notes.md` (학습 기록, 블로그 "Figma MCP 사용법" 포스트 후보)

**Interfaces:**
- Consumes: Task 9의 상세 화면(비교 기준).
- Produces: 없음(학습 산출물).

- [ ] **Step 1: Figma에서 상세 화면 목업 1개**

모바일 프레임으로 상세 화면(대표 이미지·제목·가격·상태·위치·뒤로가기)을 **요소 배치만** 그린다.

- [ ] **Step 2: MCP로 디자인→코드 시도**

Figma에서 해당 프레임을 선택/링크로 지정 → Figma MCP를 통해 RN 코드 초안 생성을 요청한다.

- [ ] **Step 3: 손으로 짠 코드와 비교**

Task 9에서 직접 작성한 상세 화면과 MCP 생성 코드를 비교한다. 무엇을 잘 뽑고(레이아웃 등) 무엇을 손봐야 하는지(RN 특유 처리·API 연동 등) 기록.

- [ ] **Step 4: 학습 노트 + 커밋**

```bash
git add docs/superpowers/specs/2026-07-19-figma-spike-notes.md
git commit -m "docs: Figma MCP 디자인→코드 스파이크(상세 화면) 학습 기록"
```

**검증:** 노트에 "Figma→MCP→RN 코드" 한 바퀴 경험과 비교 소감이 적혀 있음.

---

## 후순위(다음 마일스톤, 이번 범위 밖)

- 웹을 `apps/web/`으로 이동 + 웹이 `@cuddle/shared` 소비(완전 공유)
- 플랫폼 중립 API 클라이언트를 shared로 승격
- 나머지 사용자 기능(채팅·검색·거래·지도)
- 웹 E2E는 **Playwright**로(웹 손댈 때 — 이미 설치돼 있음)
- 스토어 출시, Turborepo, CI/CD
