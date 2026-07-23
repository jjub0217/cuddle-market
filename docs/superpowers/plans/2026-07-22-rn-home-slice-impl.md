# C3 구현 할일 — RN 홈 슬라이스(상품 목록)

> 협업 루프 C3의 구현 계획. **프론트A가 이 문서대로 구현**하고, 프론트B가 리뷰한다.
> 근거(SSOT): 요구사항 `docs/superpowers/specs/2026-07-21-rn-home-slice-requirements.md`, UI 스펙 `docs/superpowers/specs/2026-07-21-rn-home-slice-ui.md`.

**Goal:** 로그인 없이 홈 진입 → REST 실데이터로 상품 카드 목록을 폰에 렌더 + 로딩/빈/오류 3상태. (경로 검증이 목적, 기능 완성도 아님.)

**환경 전제:** Expo SDK 54(RN 0.81, expo-router 6, 구조 `app/`), `@cuddle/shared` 연결됨, `EXPO_PUBLIC_API_BASE_URL` 주입됨. 실기기 = Expo Go 54(웹 미리보기도 가능).

## 기술 결정

- **데이터 페칭**: **TanStack Query `useInfiniteQuery`** (웹 홈과 동일한 데이터층). queryFn은 인증 없는 공개 조회라 **순수 `fetch`**(axios/토큰 불필요), 성공/오류는 **HTTP status(`res.ok`)** 기준(요구사항 §6.3-3). 응답 `data.content` + `hasNext`로 페이지네이션.
- **무한스크롤**: `FlatList`의 `onEndReached` → `fetchNextPage()`. `hasNextPage`가 false면 멈춤. 하단에 "더 불러오는 중" 인디케이터, 끝이면 표시 안 함(또는 담백한 끝 표시).
- **Provider**: 앱 루트(`app/_layout.tsx`)를 `QueryClientProvider`로 1회 감쌈. `@tanstack/react-query` 추가.
- **타입/헬퍼**: `@cuddle/shared`의 `Product`·`ProductResponse`·`formatPrice` 사용.
- **탭 구조**: 이번 슬라이스는 홈 하나. **템플릿 탭 셸은 최소로 두되, 홈 탭 화면을 상품 목록으로** 교체(라우팅 대공사 안 함). Explore 탭 정리는 다음 루프.
- **이미지**: `expo-image`(템플릿에 이미 있음). `mainImageUrl` 절대 URL 그대로.

---

## Task C3-0: TanStack Query 설치 + Provider 설정

**Files:** `mobile/package.json`, `mobile/app/_layout.tsx`

- [ ] `pnpm exec expo install @tanstack/react-query` (SDK 54 호환 버전).
- [ ] `app/_layout.tsx` 최상위를 `QueryClientProvider`(single `QueryClient`)로 감쌈. 기존 테마/스택 Provider와 중첩.

**검증:** `tsc --noEmit` + 앱이 기존대로 뜸(실기기).

## Task C3-1: 상품 목록 API (fetch, 페이지 파라미터) + Jest

**Files:** `mobile/lib/products.ts`, `mobile/lib/products.test.ts`

- [ ] `fetchProducts(page: number): Promise<ProductResponse['data']>` — `GET ${EXPO_PUBLIC_API_BASE_URL}/products/search?page=${page}&size=20`. `res.ok` 아니면 throw. 성공 시 `(await res.json()).data` 반환(무한스크롤에 `content`+`hasNext` 둘 다 필요). 타입은 `@cuddle/shared`.
- [ ] Jest 유닛(mock `fetch`): 200이면 `{content, hasNext}` 반환 / `res.ok=false`면 throw. `cd mobile && pnpm test` PASS.

**검증:** 테스트 PASS + `tsc --noEmit`.

## Task C3-2: 거래상태 라벨·오버레이 규칙 유틸 + 테스트

**Files:** `mobile/lib/tradeStatus.ts`, `mobile/lib/tradeStatus.test.ts`

근거: 요구사항 §4.1, UI 스펙 §5.

- [ ] `getTradeLabel(tradeStatus, productType)` — SELLING→판매중, RESERVED→예약중, COMPLETED→판매완료. 단 `productType==='REQUEST'`이면 COMPLETED→요청완료, null→요청중.
- [ ] `getOverlay(tradeStatus, productType)` — 판매중/요청중 → `null`(오버레이 없음); 예약중 → `{scrim:'rgba(0,0,0,0.40)', label:'예약중'}`; 완료계열 → `{scrim:'rgba(0,0,0,0.60)', label}`.
- [ ] Jest: 5가지 상태(판매중·예약중·판매완료·요청완료·요청중) 라벨/오버레이 매핑 검증.

**검증:** 테스트 PASS. (순수 함수라 나중에 `@cuddle/shared`로 승격 후보 — 이번엔 mobile에 둠.)

## Task C3-3: 썸네일 컴포넌트(오버레이 포함)

**Files:** `mobile/components/product-thumbnail.tsx`

근거: UI 스펙 §4.2, §5.

- [ ] 1:1 정사각(약 100dp), 라운드 8, `expo-image`로 `mainImageUrl` cover. 로드 실패 시 회색 placeholder.
- [ ] 거래상태 오버레이: `getOverlay` 결과 있으면 전체 스크림(불투명도 2단계) + 중앙 흰 pill(라운드 999, 흰95%, 글자 11~12 bold #111827). 없으면 아무것도 안 그림.

**검증:** `tsc` 통과 + (다음 태스크에서 화면에 붙여 실기기 확인).

## Task C3-4: 상품 카드(가로형)

**Files:** `mobile/components/product-card.tsx`

근거: UI 스펙 §4(골격/정보영역), §4.3. **펫종류 없음, 찜="찜 N" 텍스트(표시전용).**

- [ ] 가로 레이아웃: 좌 썸네일(C3-3) + 우 정보영역(flex 1), 간격 12, 카드 라운드 12·패딩 12·옅은 테두리.
- [ ] 정보영역(위→아래): 뱃지행(판매유형[판매/판매요청]·상품상태) → 제목(최대 2줄, 말줄임) → 가격(`formatPrice`, 굵게) → 메타행(위치 `addressGugun||addressSido` · `찜 {favoriteCount}` … 오른쪽끝 상대시간).
- [ ] 코드→이름 변환 최소만(없으면 코드 그대로 허용, 요구사항 §4).

**검증:** `tsc` 통과.

## Task C3-5: 3상태 컴포넌트(로딩/빈/오류)

**Files:** `mobile/components/list-states.tsx` (또는 화면 내 분리)

근거: 요구사항 §5, UI 스펙 §6.

- [ ] 로딩(첫 로드): 카드 스켈레톤 6~8개(회색 뼈대). 무한 스피너 금지.
- [ ] 빈: 중앙 "아직 등록된 상품이 없어요." (CTA 없음). 오류와 명확히 구분.
- [ ] 오류(첫 로드 실패): 중앙 문구 + **"다시 시도"** 버튼(≥44dp) → 누르면 재요청(`refetch`).
- [ ] **다음 페이지 로딩(무한스크롤)**: 리스트 하단 footer에 작은 스피너("더 불러오는 중"). 이미 렌더된 목록은 유지(전체화면 오류로 덮지 않음, 요구사항 §5.3 불변규칙).

**검증:** `tsc` 통과.

## Task C3-6: 홈 화면 조립(useInfiniteQuery + FlatList + Safe Area)

**Files:** `mobile/app/(tabs)/index.tsx` (교체)

근거: UI 스펙 §2, §3, §7.

- [ ] `useInfiniteQuery`: `queryKey: ['products']`, `queryFn: ({pageParam}) => fetchProducts(pageParam)`, `initialPageParam: 0`, `getNextPageParam: (last, all) => last.hasNext ? all.length : undefined`. → `data.pages`를 flat하게 이어 `Product[]`로.
- [ ] `SafeAreaView` + 최소 헤더("커들마켓") + `FlatList`(1열, 카드 간격 12, 좌우 패딩 16, 하단 `insets.bottom+12`).
- [ ] `onEndReached`: `hasNextPage && !isFetchingNextPage`이면 `fetchNextPage()`. `ListFooterComponent`에 "더 불러오는 중" 스피너(C3-5).
- [ ] 상태 렌더: `isLoading`→스켈레톤 / `isError`(첫 로드)→오류+다시시도(`refetch`) / 성공+0개→빈 / 성공→목록. 카드 탭 이동은 **없음**(범위 밖).

**검증:** `tsc --noEmit` + `pnpm test`(C3-1·2) + `expo lint` 통과. **실기기(폰/웹)에서 실데이터 목록 + 스크롤하면 다음 페이지 로드 확인 — 강한 게이트.**

## Task C3-7: 프론트B 코드리뷰 → 반영 → dev 로컬 머지

- [ ] 프론트B가 `feat/rn-main-screen` diff 리뷰(정확성·RN 관용구·UI 스펙 준수·테스트 적정성) → file:line 코멘트.
- [ ] 프론트A 반영 커밋.
- [ ] 로컬 `dev` 머지(`git checkout dev || -b dev; git merge --no-ff feat/rn-main-screen`). GitHub PR은 C5에서 1회.

**검증(C3 완료 = 요구사항 §7 DoD):** 로그인 없이 홈이 뜨고 `/products/search`로 실데이터 카드 렌더(썸네일·제목·가격), 로딩/빈/오류 3상태 구분, 실기기 확인, tsc·jest·lint 통과, 프론트B 리뷰 반영 + dev 머지.

---

## 파일 요약

```
mobile/
├─ app/
│  ├─ _layout.tsx                            (C3-0 QueryClientProvider)
│  └─ (tabs)/index.tsx                       (C3-6 홈 조립: useInfiniteQuery)
├─ lib/
│  ├─ products.ts / products.test.ts        (C3-1 fetch(page))
│  └─ tradeStatus.ts / tradeStatus.test.ts  (C3-2 라벨·오버레이)
└─ components/
   ├─ product-thumbnail.tsx                 (C3-3 오버레이)
   ├─ product-card.tsx                      (C3-4 카드)
   └─ list-states.tsx                       (C3-5 로딩/빈/오류/더로딩)
```
