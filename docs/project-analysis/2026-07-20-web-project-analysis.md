# 커들마켓 웹 프로젝트 분석 보고서

작성일: 2026-07-20
기준 코드베이스: `src/app` 기반 Next.js App Router 프로젝트

## 1. 프로젝트 개요

- 프레임워크: Next.js App Router
- 데이터 계층: REST(`axios`) + GraphQL BFF(`/api/graphql`) 혼합
- 클라이언트 상태: Zustand
- 서버/비동기 상태: TanStack Query
- 주요 영역:
  - 사용자 메인 서비스: 홈, 상품, 커뮤니티, 채팅, 지도, 마이페이지
  - 인증: 일반 로그인, 회원가입, 소셜 로그인 콜백, 소셜 추가정보 입력
  - 관리자: 대시보드, 상품/회원/커뮤니티/신고 관리

핵심 진입 파일:

- 앱 공통 레이아웃: `src/app/layout.tsx`
- 메인 레이아웃: `src/app/(main)/layout.tsx`
- 관리자 레이아웃: `src/app/(admin)/layout.tsx`
- 전역 상태/보정: `src/components/ClientComponents.tsx`
- 사용자 인증 상태: `src/store/userStore.ts`
- REST API 공통: `src/lib/api/api.ts`
- GraphQL 공통: `src/lib/api/graphql.ts`

## 2. 전체 라우트 목록

### 2.1 메인 사용자 라우트

| 경로 | 역할 | 비고 |
| --- | --- | --- |
| `/` | 홈/상품 리스트 | 서버 프리패치 + 클라이언트 무한스크롤 |
| `/map` | 펫 지도 | Naver Map 로딩 후 장소 검색 |
| `/community` | 커뮤니티 목록 | 질문/정보 탭 |
| `/community-post` | 커뮤니티 글 작성 | 로그인 필요, 컴포넌트에서 검사 |
| `/community/[id]` | 커뮤니티 상세 진입용 | slug 경로로 유도되는 구조와 병행 |
| `/community/[id]/edit` | 커뮤니티 글 수정 | 로그인 필요 추정 |
| `/community/[id]/[name]` | 커뮤니티 상세 canonical 경로 | OG/Twitter 이미지 라우트 포함 |
| `/products/[id]` | 상품 상세 리다이렉트 | `/products/[id]/[name]`으로 redirect |
| `/products/[id]/[name]` | 상품 상세 canonical 경로 | 서버 데이터 선조회 |
| `/products/[id]/edit` | 상품 수정 | 로그인 필요, 컴포넌트에서 검사 |
| `/product-post` | 상품 등록/판매요청 등록 | 로그인 필요 |
| `/chat` | 채팅방 목록 | 로그인 필요 |
| `/chat/[id]` | 특정 채팅방 | 로그인 필요 |
| `/mypage` | 마이페이지 | 로그인 필요 |
| `/profile-update` | 프로필 수정 | 로그인 필요 |
| `/user-profile/[id]` | 다른 사용자 프로필 | 비회원 접근 가능 |
| `/notifications` | 알림 목록 | 로그인 필요 |
| `/auth/login` | 로그인 | 일반/소셜 로그인 진입 |
| `/auth/signup` | 회원가입 | 일반 회원가입 |
| `/auth/social-signup` | 소셜 추가 정보 입력 | 소셜 로그인 후 미완성 프로필 보완 |
| `/auth/find-password` | 비밀번호 찾기 | 비로그인 공개 |
| `/oauth-redirect` | OAuth 콜백 처리 | access/refresh token query 파라미터 처리 |
| `/graphql-demo` | GraphQL 데모 페이지 | 개발/검증용 성격 |
| `/html-sitemap` | HTML 사이트맵 | 공개 |

### 2.2 관리자 라우트

| 경로 | 역할 | 비고 |
| --- | --- | --- |
| `/admin/login` | 관리자 로그인 | `(admin-auth)` 레이아웃 |
| `/admin` | 관리자 대시보드 | 관리자 가드 적용 |
| `/admin/products` | 상품 관리 | 테이블 기반 |
| `/admin/community` | 커뮤니티 관리 | 테이블 기반 |
| `/admin/members` | 회원 대시보드 | 가입/탈퇴 통계 |
| `/admin/members/users` | 회원 목록 | 테이블 기반 |
| `/admin/members/withdrawals` | 탈퇴 회원 목록 | 테이블 기반 |
| `/admin/reports/user` | 사용자 신고 관리 | 테이블 기반 |
| `/admin/reports/product-sell` | 판매상품 신고 관리 | 테이블 기반 |
| `/admin/reports/product-request` | 판매요청 신고 관리 | 테이블 기반 |
| `/admin/reports/community` | 커뮤니티 신고 관리 | 테이블 기반 |

### 2.3 API/메타 라우트

| 경로 | 역할 |
| --- | --- |
| `/api/graphql` | Apollo Server 기반 GraphQL BFF |
| `/sitemap.xml` | 사이트맵 생성 |
| `/products/[id]/[name]/opengraph-image` | 상품 OG 이미지 |
| `/products/[id]/[name]/twitter-image` | 상품 Twitter 이미지 |
| `/community/[id]/[name]/opengraph-image` | 커뮤니티 OG 이미지 |
| `/community/[id]/[name]/twitter-image` | 커뮤니티 Twitter 이미지 |

## 3. 주요 사용자 화면

### 3.1 일반 사용자 화면

- 홈
  - 히어로
  - 반려동물 유형/카테고리/상세 필터
  - 상품 리스트 무한스크롤
  - 로그인 시 상품 등록 CTA 노출
- 상품 상세
  - 이미지 갤러리
  - 상품 요약/설명
  - 찜, 채팅 시작, 판매자 프로필/다른 상품
- 상품 등록/수정
  - 판매상품 등록 폼
  - 판매요청 등록 폼
  - 이미지 업로드/정렬
- 커뮤니티 목록
  - 질문/정보 탭
  - 검색
  - 정렬
  - 글쓰기 CTA
- 커뮤니티 상세
  - 본문/댓글/답글
  - 글 수정/삭제/신고
- 채팅
  - 채팅방 목록
  - 메시지 로그
  - 이미지 전송
  - 채팅방 정보/나가기
- 지도
  - 카테고리 탭
  - 장소 목록 사이드바
  - 장소 상세 카드/사이드바
  - 내 위치, 현재 지도에서 검색
- 마이페이지
  - 대시보드
  - 판매/구매/찜/차단 목록
  - 프로필 카드
  - 모바일 오버레이 패널
- 프로필 수정
  - 기본 정보 수정
  - 비밀번호 변경
  - 회원탈퇴
- 사용자 프로필
  - 공개 프로필
  - 해당 사용자의 판매/요청 상품
  - 신고/차단
- 알림
  - 읽지 않음 카운트
  - 알림 목록 무한스크롤
  - 전체 읽음/개별 읽음

### 3.2 인증 관련 화면

- 로그인
  - 이메일/비밀번호 로그인
  - 소셜 로그인 버튼
- 회원가입
  - 이메일 인증 코드
  - 닉네임 중복 확인
- 소셜 추가정보 입력
  - 주소/생년월일 등 미완성 프로필 보완
- 비밀번호 찾기

### 3.3 관리자 화면

- 대시보드 카드형 요약
- 상품/회원/탈퇴/커뮤니티/신고 관리 테이블
- 상세 모달 중심의 검토 UX

## 4. 인증 흐름

### 4.1 일반 로그인

1. `/auth/login`에서 `login()` 호출
2. 응답의 `user`, `accessToken`, `refreshToken`을 `useUserStore.handleLogin()`에 저장
3. 저장된 `redirectUrl`이 있으면 해당 경로로, 없으면 홈으로 이동
4. 상태는 `localStorage`의 `user-storage`에 persist

### 4.2 소셜 로그인

1. 로그인 화면에서 OAuth 서버로 이동
2. `/oauth-redirect`로 `accessToken`, `refreshToken` query 파라미터 수신
3. 토큰을 우선 Zustand에 저장
4. `/profile/me` 조회
5. `addressSido` 또는 `birthDate`가 없으면 `/auth/social-signup`으로 이동
6. 정보가 충분하면 `handleLogin()` 완료 후 원래 `redirectUrl` 또는 `/`로 이동

### 4.3 인증 상태 복원

- `ClientComponents`에서 `useUserStore.persist.rehydrate()` 실행
- `AuthValidator`에서 `user`만 있고 토큰이 불완전한 경우 상태 초기화
- REST/GraphQL 공통으로 만료 토큰 발생 시 refresh 시도

### 4.4 토큰 재발급

- REST: `src/lib/api/api.ts`의 axios interceptor
- GraphQL: `src/lib/api/graphql.ts`의 `fetchGraphQL()`
- 공통 동작:
  - `refreshToken`으로 `/auth/refresh` 호출
  - 새 access token 저장
  - 실패 시 사용자 상태 초기화 후 로그인 페이지로 이동

## 5. 회원/비회원 접근 차이

### 5.1 비회원도 가능한 영역

- 홈, 상품 상세, 커뮤니티 목록/상세, 지도, 로그인/회원가입/비밀번호 찾기

### 5.2 로그인 필요 영역

- 마이페이지
- 프로필 수정
- 채팅 목록/채팅방
- 알림
- 사용자 프로필
- 상품 등록/수정
- 커뮤니티 글 작성/수정
- 찜, 채팅 시작, 신고, 차단, 댓글 작성 같은 상호작용

### 5.3 실제 접근 제어 방식

- 전역 미들웨어나 서버 가드가 아니라, 다수 화면에서 클라이언트 `useEffect`로 로그인 여부를 검사
- `AUTH_REQUIRED_ROUTES` 상수는 존재하지만 실제 중앙집중 게이트로 연결되어 있지는 않음
- 관리자 영역은 `AdminAuthGuard`에서 별도 검사

## 6. 화면 이동

### 6.1 주요 사용자 이동 흐름

- 홈 → 상품 상세 → 판매자 프로필 또는 채팅
- 홈 → 상품 등록
- 홈/헤더 검색 → 필터 반영된 홈 리스트
- 커뮤니티 목록 → 글 상세 → 수정/댓글
- 커뮤니티 목록 → 글쓰기
- 사용자 프로필 ↔ 상품 상세
- 헤더/하단 네비게이션 → 홈/커뮤니티/지도/채팅/마이페이지
- 알림 → 관련 화면 이동 가능 구조로 보임

### 6.2 인증 관련 이동 흐름

- 보호 화면 접근 시:
  - 현재 경로를 `redirectUrl`로 저장
  - 로그인 페이지로 이동
  - 로그인 성공 후 원래 페이지 복귀
- 소셜 로그인 미완성 사용자:
  - `/oauth-redirect` → `/auth/social-signup` → 완료 후 원래 페이지 또는 홈

### 6.3 관리자 이동 흐름

- `/admin/login` → `/admin`
- 관리자 좌측 사이드바로 관리 섹션 이동
- 각 목록에서 상세 모달 열기/액션 처리

## 7. 주요 상태 관리

### 7.1 전역 클라이언트 상태

- `src/store/userStore.ts`
  - 사용자 정보
  - access/refresh token
  - redirectUrl
  - hydration 완료 여부
- `src/store/modalStore.ts`
  - 전역 로그인/로그아웃 확인 모달 상태
- `src/store/toastStore.ts`
  - 토스트 visible/queue
- `src/store/mapStore.ts`
  - 지도 카테고리, 필터, bounds, markers, 로딩
- `src/store/chatSocketStore.ts`
  - 웹소켓 연결, 실시간 메시지, room 업데이트

### 7.2 서버 상태

- TanStack Query로 목록/상세/무한스크롤/뮤테이션 관리
- 홈, 마이페이지, 채팅, 커뮤니티, 알림, 관리자 테이블 등 대부분의 비동기 데이터가 Query 기반

### 7.3 URL 상태

- 홈 필터: query string이 사실상 single source of truth
- 커뮤니티 탭/정렬/검색: query string 기반
- 마이페이지/유저페이지 탭: query string 기반
- 일부 모바일 오버레이: URL이 아니라 `history.pushState` + local state 사용

## 8. API 호출 위치

### 8.1 공통 API 레이어

- REST 공통: `src/lib/api/api.ts`
- GraphQL 공통: `src/lib/api/graphql.ts`
- 인증 API: `src/lib/api/auth.ts`
- 관리자 API: `src/lib/api/admin.ts`
- 지도 API: `src/lib/api/places.ts`
- 상품 업로드 API: `src/lib/api/products.ts`

### 8.2 화면별 대표 API 사용 위치

- 홈: `src/features/home/Home.tsx`
  - GraphQL `products`
- 상품 상세: `src/features/product-detail/ProductDetail.tsx`
  - REST `/products/:id`
- 상품 등록/수정: `src/features/product-post/ProductPost.tsx`, `ProductPostForm.tsx`, `ProductRequestForm.tsx`
  - GraphQL 상품 조회/생성/수정
- 커뮤니티 목록: `src/features/community/CommunityPage.tsx`
  - REST `/community/posts`
- 커뮤니티 상세/댓글: `src/features/community/CommunityDetail.tsx`, `CommentList.tsx`
  - REST + GraphQL mutation 혼합
- 채팅: `src/features/chatting-page/ChattingPage.tsx`
  - GraphQL `chatRooms`, `chatMessages`
  - WebSocket STOMP 연결
- 알림: `src/app/(main)/notifications/page.tsx`, `NotificationsDropdown.tsx`
  - GraphQL `notifications`, `markAsRead`
- 마이페이지: `src/features/my-page/MyPage.tsx`
  - REST `/profile/me/*`
- 프로필 수정: `src/features/profile-update/ProfileUpdate.tsx`
  - GraphQL `myProfile`, `updateProfile`, `withdraw`
- 사용자 프로필: `src/features/UserPage.tsx`
  - REST `/profile/:id`, `/profile/:id/products`
- 지도: `src/features/map/MapContainer.tsx`
  - `getPlaces()`
- 관리자: `src/features/admin/hooks/useAdminTable.ts`, `src/lib/api/admin.ts`
  - 관리자용 REST/목업 데이터

### 8.3 서버 프리패치 위치

- 홈: `src/app/(main)/page.tsx`
- 커뮤니티 목록: `src/app/(main)/community/page.tsx`
- 상품 상세: `src/app/(main)/products/[id]/[name]/page.tsx`

## 9. 로딩·빈 상태·오류 상태

### 9.1 로딩 상태

- 전역 초기 hydration 대기:
  - 홈 `HomeLoadingState`
  - 다수 보호 페이지는 `Spinner`
- 무한스크롤/페이지네이션:
  - 홈, 커뮤니티, 채팅, 마이페이지, 알림
- 외부 스크립트 로딩:
  - 지도는 `mapReady` 전용 로딩 UI

### 9.2 빈 상태

- 공통 `EmptyState` 사용
- 예:
  - 사용자 프로필에 상품 없음
  - 마이페이지 리스트 없음
  - 일부 목록은 빈 상태 컴포넌트 없이 단순 미노출 가능성 있음

### 9.3 오류 상태

- 대체로 화면 내부에서 안내 문구 + 재시도/이동 버튼 처리
- 홈: refetch 버튼
- 커뮤니티/채팅/프로필: 새로고침 또는 홈/마이페이지 이동 버튼
- 지도: 요청 실패 시 기존 마커 유지, 별도 오류 UI는 약함
- 관리자 일부 화면은 `isError` 처리보다 빈 값 fallback 비중이 큼

## 10. 모달·토스트·알림 처리

### 10.1 모달

- 전역 모달 스토어는 로그인/로그아웃 확인 모달만 관리
- 나머지 모달은 화면별 local state + dynamic import 방식
- 주요 모달:
  - 로그인 유도 모달
  - 회원탈퇴 모달
  - 삭제 확인 모달
  - 신고 모달
  - 차단 모달
  - 관리자 상세 모달

### 10.2 토스트

- Zustand queue 기반
- 최대 동시 노출 개수 제한
- `ToastContainer`가 전역 렌더링
- 성공/경고/에러 타입 지원

### 10.3 알림

- 헤더 드롭다운 + 전용 알림 페이지 2채널
- 읽지 않음 카운트는 React Query 캐시와 연동
- 채팅방 진입 시 unread count를 수동 조정하는 로직 존재

## 11. 반응형 UI

### 11.1 구조적 특징

- 메인 레이아웃은 모바일 하단 `BottomNav`, 데스크톱 상단 `Header` 중심
- 홈/커뮤니티/상품/프로필/채팅/지도 모두 모바일과 데스크톱 레이아웃 차이가 큼

### 11.2 대표 반응형 패턴

- 모바일에서 헤더/검색/하단탭 숨김 규칙이 경로별로 다르게 적용
- 마이페이지:
  - 모바일은 오버레이 패널
  - 데스크톱은 사이드/패널 분할
- 채팅:
  - 모바일은 목록/대화 화면 분리
  - 데스크톱은 2단 분할
- 지도:
  - 목록/상세 사이드바 + 슬라이드 카드 조합
- 프로필 수정:
  - 데스크톱에서 좌측 프로필 카드 고정형 배치

## 12. 현재 코드에서 불명확하거나 충돌하는 부분

### 12.1 인증 가드가 중앙집중형이 아님

- `AUTH_REQUIRED_ROUTES`는 선언되어 있으나 실질적으로 전역 가드로 쓰이지 않음
- 보호 페이지 다수가 컴포넌트 내부 `useEffect`에서 개별 redirect 처리
- 결과적으로 SSR 시점 차단, 클라이언트 깜빡임, 누락 라우트 위험이 있음

### 12.2 REST와 GraphQL의 인증 실패 후 이동 경로가 다름

- REST 토큰 갱신 실패:
  - 관리자 경로면 `/admin/login`
  - 일반 경로면 `/auth/login`
- GraphQL 토큰 갱신 실패:
  - 항상 `/auth/login`
- 관리자 화면이 GraphQL을 쓰게 되면 경로 정책이 충돌할 수 있음

### 12.3 동일 도메인에 REST/GraphQL/서버 fetch가 혼재

- 예: 상품, 프로필, 커뮤니티가 레이어마다 다른 방식으로 조회됨
- 데이터 정합성, 에러 규약, 캐시 키 기준이 통일되어 있지 않음

### 12.4 관리자 인증이 데모 모드에서 가짜 사용자 주입 가능

- `NEXT_PUBLIC_DEMO_MODE=true`면 로그인 없이 관리자 통과
- 데모 배포에는 유용하지만, 운영/스테이징 구분 정책이 문서화돼 있지 않으면 위험

### 12.5 모달 관리 전략이 이원화됨

- 로그인/로그아웃만 전역 store
- 나머지는 local state
- 공통 우선순위, 중첩 정책, 접근성 정책이 통일돼 있지 않음

### 12.6 일부 화면은 `window.history.pushState`를 직접 사용

- 홈 필터 네비게이션과 마이페이지 모바일 오버레이에서 Next Router가 아닌 브라우저 history 직접 제어
- 빠른 UX 장점은 있지만, 라우터 상태와 analytics/복원 정책 충돌 가능성이 있음

### 12.7 `/community/[id]`와 `/community/[id]/[name]` 병행 구조가 완전히 설명되지 않음

- 상품은 `[id]`에서 slug 경로로 명시적 redirect
- 커뮤니티는 두 상세 경로가 모두 존재하는데 canonical 정책이 코드만으로는 덜 명확함

### 12.8 지도 요청의 abort controller가 실제 요청 함수에 연결되는지 불명확

- `MapContainer`에 `abortRef`는 있으나 `getPlaces()`가 signal을 실제로 쓰는지는 현재 확인 범위에서 명확하지 않음

### 12.9 사용자 프로필 페이지의 코드상 공개 구조와 실제 진입 UX가 어긋남

- `src/app/(main)/user-profile/[id]/page.tsx`와 `src/features/UserPage.tsx`만 보면 사용자 프로필 페이지 자체에는 명시적 로그인 가드가 없음
- 하지만 상품 상세의 판매자 프로필 클릭은 `src/features/product-detail/components/SellerProfileCard.tsx`에서 비로그인 사용자를 로그인 모달로 막고 있음
- 즉 "라우트 자체 보호"와 "주요 진입 경로 보호"가 분리되어 있어, 코드만 읽을 때 접근 정책을 잘못 해석하기 쉬움
- 실제 정책이 사용자 프로필 로그인 필수라면, 라우트 레벨에서도 같은 제약을 일관되게 강제하는 편이 안전함

## 13. 코드만으로 확인할 수 없는 정책 질문

1. 비회원이 허용되는 읽기 범위는 어디까지인가?
2. 커뮤니티 상세/상품 상세에서 신고, 차단, 찜, 댓글 입력 시 로그인 유도 정책은 모달 기준인가 페이지 이동 기준인가?
3. 보호 라우트는 최종적으로 클라이언트 가드만 유지할지, middleware/서버 가드로 통합할지?
4. 관리자 인증은 일반 사용자 계정의 `userRole=ADMIN`만으로 충분한지, 별도 admin session 정책이 필요한지?
5. `DEMO_MODE`는 어떤 배포 환경에서만 허용되는지?
6. 소셜 로그인 사용자가 필수로 입력해야 하는 프로필 항목의 기준은 `addressSido`, `birthDate` 두 개가 맞는지?
7. 회원탈퇴 후 데이터 보존/비식별화 정책은 무엇인지?
8. 차단한 사용자와의 상호작용 범위는 어디까지 막아야 하는지?
9. 알림 클릭 시 어떤 화면으로 이동해야 하는지, 읽음 처리 시점은 클릭 전/후 어느 쪽인지?
10. 커뮤니티 slug 정책은 상품처럼 canonical 강제 redirect가 필요한지?
11. 지도 장소 데이터는 어떤 신뢰수준과 갱신주기를 가지는지?
12. 관리자 테이블의 정렬/필터/검색 파라미터 표준은 백엔드와 완전히 합의되었는지?

## 14. 요약

- 현재 프로젝트는 사용자 서비스와 관리자 서비스를 한 Next.js 앱 안에서 운영하는 구조다.
- 핵심 상태는 Zustand, 서버 상태는 TanStack Query, 데이터 호출은 REST와 GraphQL이 혼합돼 있다.
- 사용자 경험은 비교적 풍부하지만, 인증 가드 통일, API 계층 정리, 관리자/데모 정책 문서화가 다음 정리 포인트다.
