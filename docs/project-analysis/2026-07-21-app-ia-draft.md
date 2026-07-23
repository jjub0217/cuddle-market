# 커들마켓 앱 정보구조(IA) 초안

작성일: 2026-07-21  
기준 문서:

- `docs/project-analysis/2026-07-20-master-prd-draft.md`
- `docs/project-analysis/2026-07-20-screen-functional-spec.md`
- 현재 웹 라우트/화면 코드

## 1. 문서 목적

- 현재 웹 프로젝트 구조와 확정된 앱 정책 결정안을 바탕으로 앱의 정보구조(IA) 초안을 정의한다.
- 이 문서는 화면 디자인 문서가 아니라, 앱의 화면 그룹, 이동 구조, 탭 구조, 보호 영역 구조를 정리하는 문서다.
- Expo Router 기반 모바일 앱 구조를 가정해 작성한다.

## 2. IA 설계 기준

- 앱 최초 진입 화면은 `상품 목록 중심 홈`으로 유지한다.
- 앱의 1차 네비게이션은 웹 `BottomNav` 구조를 계승한다.
- 1차 탭은 `홈 / 커뮤니티 / 플레이스 / 채팅 / 마이` 5개로 유지한다.
- 인증 보호는 화면별 `useEffect` 가드가 아니라 라우트 그룹 단위 중앙집중 구조로 정리한다.
- 사용자 프로필은 로그인 필요 화면으로 취급하고, 앱에서는 주요 진입 경로 차단이 아니라 라우트 차단 기준으로 통일한다.

## 3. 앱 최상위 구조

### 3.1 최상위 라우트 그룹 제안

```text
app
├─ (public)
│  ├─ index                         # 홈
│  ├─ products/[id]
│  ├─ products/[id]/[slug]
│  ├─ community
│  ├─ community/[id]
│  ├─ community/[id]/[slug]
│  ├─ map
│  ├─ auth/login
│  ├─ auth/signup
│  ├─ auth/find-password
│  ├─ auth/social-signup
│  └─ oauth-redirect
├─ (protected)
│  ├─ chat
│  ├─ chat/[id]
│  ├─ mypage
│  ├─ profile-update
│  ├─ notifications
│  ├─ user-profile/[id]
│  ├─ product-post
│  ├─ products/[id]/edit
│  ├─ community-post
│  └─ community/[id]/edit
└─ (modals)
   └─ login-prompt / report / block / etc
```

### 3.2 구조 의도

- `(public)`:
  - 비로그인 상태에서도 접근 가능한 읽기 중심 화면
  - 인증 진입 화면 포함
- `(protected)`:
  - 로그인 필수 화면
  - 앱 정책상 라우트 차단을 적용할 화면
- `(modals)`:
  - 로그인 유도, 신고, 차단 같은 선택/유도성 액션을 바텀시트/모달로 띄우는 계층

## 4. 1차 네비게이션 구조

### 4.1 하단 탭

앱의 메인 탭은 아래 5개로 구성한다.

1. 홈
2. 커뮤니티
3. 플레이스
4. 채팅
5. 마이

### 4.2 탭별 역할

- 홈
  - 상품 탐색의 메인 허브
  - 상품 상세 및 상품 등록 흐름의 출발점
- 커뮤니티
  - 질문/정보 게시글 탐색
  - 게시글 상세, 글쓰기, 수정 흐름 포함
- 플레이스
  - 지도 기반 장소 탐색
- 채팅
  - 채팅방 목록과 채팅방 상세
  - 로그인 필수 탭
- 마이
  - 본인 계정/거래 관리 허브
  - 프로필 수정, 알림 등 개인화 기능 진입점
  - 로그인 필수 탭

### 4.3 웹 BottomNav와의 대응

웹 기준 `BottomNav` 항목:

- 홈
- 커뮤니티
- 플레이스
- 채팅
- 마이

앱도 동일한 정보구조를 유지한다.  
근거 파일:

- [src/components/bottom-nav/BottomNav.tsx](/Users/osejin/Desktop/cuddle-market/src/components/bottom-nav/BottomNav.tsx:1)

## 5. 탭별 화면 계층

### 5.1 홈 탭

```text
홈 탭
├─ 홈 상품 목록
├─ 상품 상세
├─ 판매자 프로필 진입
├─ 상품 등록
└─ 상품 수정
```

설명:

- 홈 상품 목록은 탭 루트 화면이다.
- 상품 상세는 홈에서 가장 빈번하게 진입하는 2차 상세 화면이다.
- 상품 등록/수정은 로그인 필수이며 `(protected)` 그룹에서 관리한다.
- 판매자 프로필은 상세 화면에서 진입하지만 별도 독립 화면이며 로그인 필수다.

근거 파일:

- [src/app/(main)/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/page.tsx:1)
- [src/features/home/Home.tsx](/Users/osejin/Desktop/cuddle-market/src/features/home/Home.tsx:1)
- [src/features/product-detail/ProductDetail.tsx](/Users/osejin/Desktop/cuddle-market/src/features/product-detail/ProductDetail.tsx:1)
- [src/features/product-post/ProductPost.tsx](/Users/osejin/Desktop/cuddle-market/src/features/product-post/ProductPost.tsx:1)

### 5.2 커뮤니티 탭

```text
커뮤니티 탭
├─ 커뮤니티 목록
├─ 게시글 상세
├─ 글 작성
└─ 글 수정
```

설명:

- 목록은 읽기 공개 화면이다.
- 상세도 읽기 공개 화면이다.
- 글 작성과 수정은 로그인 필수다.
- 댓글, 신고, 차단은 상세 안의 액션으로 존재한다.

근거 파일:

- [src/app/(main)/community/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/community/page.tsx:1)
- [src/features/community/CommunityPage.tsx](/Users/osejin/Desktop/cuddle-market/src/features/community/CommunityPage.tsx:1)
- [src/features/community/CommunityDetail.tsx](/Users/osejin/Desktop/cuddle-market/src/features/community/CommunityDetail.tsx:1)
- [src/features/community/components/CommunityPostForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/community/components/CommunityPostForm.tsx:1)

### 5.3 플레이스 탭

```text
플레이스 탭
├─ 지도 메인
├─ 장소 목록 패널
└─ 장소 상세 패널/카드
```

설명:

- 플레이스는 별도 상세 페이지보다는 단일 지도 화면 안에서 목록/상세가 열리는 구조다.
- 앱에서도 우선 단일 탭 루트 안에서 패널 전환 중심 구조를 유지하는 편이 자연스럽다.

근거 파일:

- [src/app/(main)/map/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/map/page.tsx:1)
- [src/features/map/MapContainer.tsx](/Users/osejin/Desktop/cuddle-market/src/features/map/MapContainer.tsx:1)

### 5.4 채팅 탭

```text
채팅 탭
├─ 채팅방 목록
└─ 채팅방 상세
```

설명:

- 채팅 탭 자체가 로그인 필수다.
- 모바일 앱에서는 탭 루트가 채팅방 목록, 스택 push로 채팅방 상세가 자연스럽다.
- 딥링크/푸시 진입도 보호 그룹을 통과해야 한다.

근거 파일:

- [src/app/(main)/chat/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/chat/page.tsx:1)
- [src/app/(main)/chat/[id]/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/chat/[id]/page.tsx:1)
- [src/features/chatting-page/ChattingPage.tsx](/Users/osejin/Desktop/cuddle-market/src/features/chatting-page/ChattingPage.tsx:1)

### 5.5 마이 탭

```text
마이 탭
├─ 마이페이지
├─ 프로필 수정
├─ 알림
└─ 회원탈퇴/계정관리 액션
```

설명:

- 마이는 본인 계정과 거래 관리 전용 허브다.
- 프로필 수정과 알림은 마이에서 파생되는 개인화 화면으로 배치하는 것이 일관적이다.
- 회원탈퇴는 별도 전체 화면이 아니라 마이/프로필 수정 하위 액션으로 유지 가능하다.

근거 파일:

- [src/app/(main)/mypage/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/mypage/page.tsx:1)
- [src/features/my-page/MyPage.tsx](/Users/osejin/Desktop/cuddle-market/src/features/my-page/MyPage.tsx:1)
- [src/app/(main)/profile-update/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/profile-update/page.tsx:1)
- [src/app/(main)/notifications/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/notifications/page.tsx:1)

## 6. 독립 화면과 횡단 흐름

### 6.1 인증 화면군

```text
인증
├─ 로그인
├─ 회원가입
├─ 비밀번호 찾기
├─ 소셜 추가정보 입력
└─ OAuth 콜백 처리
```

설명:

- 인증 화면은 하단 탭 바깥의 독립 흐름이다.
- 로그인 성공 후 `redirectUrl` 복귀 정책을 유지한다.
- 로그인 유도는 앱에서 모달 중심으로 가져가지만, 실제 인증 입력은 독립 화면으로 유지하는 편이 구현상 안전하다.

근거 파일:

- [src/app/(main)/auth/login/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/auth/login/page.tsx:1)
- [src/app/(main)/auth/signup/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/auth/signup/page.tsx:1)
- [src/app/(main)/auth/find-password/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/auth/find-password/page.tsx:1)
- [src/app/(main)/auth/social-signup/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/auth/social-signup/page.tsx:1)
- [src/app/(main)/oauth-redirect/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/oauth-redirect/page.tsx:1)

### 6.2 사용자 프로필

```text
사용자 프로필
├─ 타인 프로필 열람
├─ 판매상품/판매요청 목록
├─ 채팅 진입
├─ 신고
└─ 차단
```

설명:

- 사용자 프로필은 특정 탭 루트가 아니라 여러 화면에서 횡단적으로 진입하는 독립 화면이다.
- 홈/상품 상세/커뮤니티 등에서 진입할 수 있지만, 앱 정책상 로그인 필수 화면으로 유지한다.
- 자기 자신에 대한 `/user-profile/{me}` 진입은 마이페이지로 리다이렉트하는 방향을 기준 정책으로 둔다.

근거 파일:

- [src/app/(main)/user-profile/[id]/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/user-profile/[id]/page.tsx:1)
- [src/features/UserPage.tsx](/Users/osejin/Desktop/cuddle-market/src/features/UserPage.tsx:1)

## 7. 인증 보호 경계

### 7.1 공개 영역

- 홈
- 상품 상세
- 커뮤니티 목록
- 커뮤니티 상세
- 플레이스
- 로그인
- 회원가입
- 비밀번호 찾기
- 소셜 추가정보 입력

### 7.2 보호 영역

- 채팅 목록
- 채팅방 상세
- 마이페이지
- 프로필 수정
- 알림
- 사용자 프로필
- 상품 등록
- 상품 수정
- 커뮤니티 글 작성
- 커뮤니티 글 수정

### 7.3 보호 방식

- 앱에서는 `(protected)` 그룹 `_layout.tsx`에서 한 번에 인증 검사
- 미인증이면 `/login?redirectUrl=현재경로`로 보냄
- 로그인 성공 후 원래 화면 복귀

정책 근거:

- `docs/project-analysis/2026-07-20-master-prd-draft.md`의 5.2, 5.6 결정안

## 8. 네비게이션 패턴 제안

### 8.1 기본 원칙

- 1차 이동은 하단 탭
- 2차 이동은 스택 push
- 선택/유도성 액션은 바텀시트
- 파괴적 확인은 다이얼로그
- 액션 결과 피드백은 토스트/스낵바

### 8.2 대표 패턴

- 홈 → 상품 상세 → 판매자 프로필
- 홈 → 상품 상세 → 채팅방
- 커뮤니티 목록 → 상세 → 글 수정
- 마이페이지 → 프로필 수정
- 알림 → 대상 화면 deep link 이동
- 로그인 유도 모달 → 로그인 화면 → 원래 화면 복귀

## 9. 하단 탭 숨김이 필요한 화면

앱에서도 탭 바를 숨길 가능성이 높은 화면:

- 로그인
- 회원가입
- 비밀번호 찾기
- 소셜 추가정보 입력
- 상품 등록/수정
- 커뮤니티 글 작성/수정
- 채팅방 상세

웹 참고 근거:

- [src/components/bottom-nav/BottomNav.tsx](/Users/osejin/Desktop/cuddle-market/src/components/bottom-nav/BottomNav.tsx:1)

앱 해석:

- 웹은 경로 기준으로 `BottomNav`를 숨기지만, 앱에서는 탭 루트/스택 구조를 활용해 더 자연스럽게 숨길 수 있다.
- 예를 들어 채팅 탭 루트에서는 탭 바를 보이게 하고, 채팅방 상세에서는 숨기는 식의 화면 단위 제어가 적합하다.

## 10. 웹 라우트와 앱 IA 대응표

| 웹 경로 | 앱 IA 위치 | 보호 여부 |
| --- | --- | --- |
| `/` | 홈 탭 루트 | 공개 |
| `/products/[id]/[name]` | 홈 탭 > 상품 상세 | 공개 |
| `/product-post` | 홈 탭 파생 > 상품 등록 | 보호 |
| `/products/[id]/edit` | 홈 탭 파생 > 상품 수정 | 보호 |
| `/community` | 커뮤니티 탭 루트 | 공개 |
| `/community/[id]/[name]` | 커뮤니티 탭 > 게시글 상세 | 공개 |
| `/community-post` | 커뮤니티 탭 파생 > 글 작성 | 보호 |
| `/community/[id]/edit` | 커뮤니티 탭 파생 > 글 수정 | 보호 |
| `/map` | 플레이스 탭 루트 | 공개 |
| `/chat` | 채팅 탭 루트 | 보호 |
| `/chat/[id]` | 채팅 탭 > 채팅방 상세 | 보호 |
| `/mypage` | 마이 탭 루트 | 보호 |
| `/profile-update` | 마이 탭 > 프로필 수정 | 보호 |
| `/notifications` | 마이 탭 > 알림 | 보호 |
| `/user-profile/[id]` | 독립 보호 화면 | 보호 |
| `/auth/login` | 인증 흐름 > 로그인 | 공개 |
| `/auth/signup` | 인증 흐름 > 회원가입 | 공개 |
| `/auth/find-password` | 인증 흐름 > 비밀번호 찾기 | 공개 |
| `/auth/social-signup` | 인증 흐름 > 소셜 추가정보 입력 | 공개 |
| `/oauth-redirect` | 인증 콜백 처리 | 공개 |

## 11. 구현 시 참고 메모

- 사용자 프로필에서 자기 자신 접근 시 `무조건 리다이렉트`와 `액션 숨김만 적용` 중 어떤 구현을 최종 채택할지 상세 명세 필요
- 알림을 마이 탭 하위에 둘지, 독립 전역 인박스 개념으로 둘지 UX 관점 추가 검토 가능
- 앱에서 로그인 화면을 완전 독립 화면으로 둘지, 로그인 유도 바텀시트에서 일부 입력을 시작하게 할지 상세 UX 결정 필요
- 플레이스 상세를 별도 전체 화면으로 승격할지, 현재처럼 패널 중심 구조를 유지할지 후속 검토 가능
- 관리자 기능은 현재 사용자 앱 IA 범위에서 제외하는 것이 자연스럽지만, 운영 앱 분리 여부는 별도 정책 필요
