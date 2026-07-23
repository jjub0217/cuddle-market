# 커들마켓 화면별 기능 명세 초안

작성일: 2026-07-20  
기준 문서:

- `docs/project-analysis/2026-07-20-web-project-analysis.md`
- `docs/project-analysis/2026-07-20-master-prd-draft.md`

작성 원칙:

- 현재 웹 코드에서 확인 가능한 동작을 기준으로 정리한다.
- 앱 정책 결정안이 반영된 항목은 `모바일 전환 시 주의사항` 또는 `구현 메모`에 함께 적는다.
- 코드만으로 단정하기 어려운 항목은 구현 시 참고 메모로 남긴다.

## 1. 홈 화면

- 화면 목적: 상품 탐색의 메인 허브 역할. 반려동물 유형, 카테고리, 정렬, 상세 필터를 통해 상품을 탐색한다.
- 진입 조건: `/` 진입 시 접근 가능.
- 표시 데이터:
  - 상품 목록
  - 총 상품 수
  - 펫 유형/카테고리/상세 필터 상태
  - 로그인 여부에 따른 상품 등록 CTA
- 사용자 액션:
  - 펫 유형 탭 변경
  - 카테고리 선택
  - 상세 필터 열기/닫기 및 초기화
  - 상품 카드 클릭
  - 무한스크롤 추가 로드
  - 로그인 사용자의 상품 등록 이동
- 화면 이동:
  - 상품 상세
  - 상품 등록
  - 헤더/하단 탭을 통한 커뮤니티, 지도, 채팅, 마이페이지 이동
- 인증 여부: 비로그인 접근 가능
- 로딩 상태: hydration 전 `HomeLoadingState`, 데이터 로드 중 skeleton/스피너 사용
- 빈 상태: 검색 결과가 0건인 경우 상품 섹션 쪽 빈 목록 상태가 노출되는 구조
- 오류 상태: 상품 로드 실패 시 에러 문구와 `다시 시도` 버튼 노출
- 모바일 전환 시 주의사항:
  - 앱 최초 진입 화면도 상품 목록 중심 홈으로 유지하기로 결정됨
  - 앱 하단 탭 구조는 웹 `BottomNav` 정보 구조를 유지
  - 홈 필터는 현재 `query string` 중심인데 앱에서는 라우트 query 대신 화면 상태/URL 동기화 정책을 다시 정해야 함
- 근거 파일:
  - [src/app/(main)/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/page.tsx:1)
  - [src/features/home/Home.tsx](/Users/osejin/Desktop/cuddle-market/src/features/home/Home.tsx:1)
  - [src/components/bottom-nav/BottomNav.tsx](/Users/osejin/Desktop/cuddle-market/src/components/bottom-nav/BottomNav.tsx:1)
  - [src/components/header/Header.tsx](/Users/osejin/Desktop/cuddle-market/src/components/header/Header.tsx:1)
- 구현 메모:
  - 필터 조합 우선순위와 SEO용 URL 정책은 앱에서 그대로 유지할지 별도 정의 필요

## 2. 상품 상세 화면

- 화면 목적: 상품 정보 확인, 판매자 확인, 찜/채팅 등 거래 액션 진입
- 진입 조건: `/products/[id]/[name]` 접근. `/products/[id]`는 canonical slug 경로로 리다이렉트
- 표시 데이터:
  - 상품 제목, 가격, 설명, 상태, 조회수, 찜 수
  - 메인/서브 이미지
  - 판매자 정보
  - 판매자 다른 상품
- 사용자 액션:
  - 이미지 확인
  - 찜하기
  - 채팅 시작
  - 판매자 프로필 클릭
  - 브레드크럼 기반 목록 복귀
- 화면 이동:
  - 사용자 프로필
  - 채팅방 생성 후 채팅
  - 필터가 반영된 홈 리스트
- 인증 여부:
  - 화면 자체는 비로그인 접근 가능
  - 찜, 채팅, 판매자 프로필 진입은 로그인 필요
- 로딩 상태: 서버 초기 데이터 후 클라이언트 재조회, 보완 로딩은 query 기반
- 빈 상태: 별도 빈 상태보다는 notFound/redirect 구조
- 오류 상태: 존재하지 않는 상품은 `notFound`, slug 불일치는 redirect
- 모바일 전환 시 주의사항:
  - 앱에서도 판매자 프로필, 채팅 시작, 찜하기의 로그인 유도 방식을 통일하기로 결정됨
  - 판매자 프로필 접근은 앱에서 라우트 차단 기준으로 강화 예정
  - 긍정/빈번 액션은 하단 엄지존 배치 원칙을 따를 가능성이 높음
- 근거 파일:
  - [src/app/(main)/products/[id]/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/products/[id]/page.tsx:1)
  - [src/app/(main)/products/[id]/[name]/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/products/[id]/[name]/page.tsx:1)
  - [src/features/product-detail/ProductDetail.tsx](/Users/osejin/Desktop/cuddle-market/src/features/product-detail/ProductDetail.tsx:1)
  - [src/features/product-detail/components/SellerProfileCard.tsx](/Users/osejin/Desktop/cuddle-market/src/features/product-detail/components/SellerProfileCard.tsx:1)
  - [src/features/product-detail/components/ProductActions.tsx](/Users/osejin/Desktop/cuddle-market/src/features/product-detail/components/ProductActions.tsx:1)
- 구현 메모:
  - 비로그인 사용자가 찜/채팅/판매자 프로필 각각에서 동일한 로그인 유도 UI를 현재 완전히 쓰는지는 세부 검증 필요

## 3. 로그인 화면

- 화면 목적: 이메일 로그인과 소셜 로그인 진입 제공
- 진입 조건: `/auth/login`
- 표시 데이터:
  - 이메일/비밀번호 입력 폼
  - 소셜 로그인 버튼
  - 회원가입 링크
- 사용자 액션:
  - 이메일 로그인
  - 소셜 로그인 시작
  - 회원가입 이동
- 화면 이동:
  - 로그인 성공 시 `redirectUrl` 또는 홈
  - 소셜 로그인은 외부 OAuth로 이동 후 콜백
  - 회원가입
- 인증 여부: 비로그인 전용 성격
- 로딩 상태: Suspense 래핑, 로그인 요청 중 form 상태 존재
- 빈 상태: 해당 없음
- 오류 상태: 로그인 실패 시 폼 내 오류/안내가 발생하는 구조
- 모바일 전환 시 주의사항:
  - 앱에서는 로그인 유도 방식을 모달 중심으로 가져가기로 결정됨
  - 앱 로그인 성공 후 이전 화면 복귀 정책 유지
- 근거 파일:
  - [src/app/(main)/auth/login/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/auth/login/page.tsx:1)
  - [src/features/login/Login.tsx](/Users/osejin/Desktop/cuddle-market/src/features/login/Login.tsx:1)
  - [src/features/login/components/LoginForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/login/components/LoginForm.tsx:1)
  - [src/features/login/components/SocialLoginButtons.tsx](/Users/osejin/Desktop/cuddle-market/src/features/login/components/SocialLoginButtons.tsx:1)
- 구현 메모:
  - 앱에서 로그인 화면 자체를 전체 페이지로 둘지 바텀시트+전환 혼합으로 둘지는 후속 UX 명세 필요

## 4. 회원가입 화면

- 화면 목적: 일반 회원가입 완료
- 진입 조건: `/auth/signup`
- 표시 데이터:
  - 이름, 닉네임, 이메일, 인증코드, 비밀번호, 생년월일 등 입력 폼
- 사용자 액션:
  - 이메일 인증 요청/확인
  - 닉네임 확인
  - 회원가입 제출
- 화면 이동:
  - 가입 후 로그인 수행 뒤 `redirectUrl` 또는 홈 이동
- 인증 여부: 비로그인 접근 가능
- 로딩 상태: 폼 제출 중 pending 상태 존재
- 빈 상태: 해당 없음
- 오류 상태: 입력 검증 오류, 가입 실패 안내
- 모바일 전환 시 주의사항:
  - 앱에서도 인라인 검증 오류 원칙을 우선 적용하는 것이 정책 결정안과 맞음
- 근거 파일:
  - [src/app/(main)/auth/signup/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/auth/signup/page.tsx:1)
  - [src/features/signup/Signup.tsx](/Users/osejin/Desktop/cuddle-market/src/features/signup/Signup.tsx:1)
  - [src/features/signup/components/SignUpForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/signup/components/SignUpForm.tsx:1)
- 구현 메모:
  - 앱에서 소셜 가입과 일반 가입의 정보 수집 단계 통합 여부 미정

## 5. 소셜 추가정보 입력 화면

- 화면 목적: 소셜 로그인 후 서비스 필수 정보 보완
- 진입 조건: `/oauth-redirect` 처리 후 필수 정보 부족 시 `/auth/social-signup` 이동
- 표시 데이터:
  - 추가 입력이 필요한 사용자 프로필 필드
- 사용자 액션:
  - 필수 정보 입력
  - 가입 완료 제출
- 화면 이동:
  - 완료 후 `redirectUrl` 또는 홈
- 인증 여부: 소셜 인증 직후 사용자 대상
- 로딩 상태: callback 처리 중 대기 문구, 제출 중 pending
- 빈 상태: 해당 없음
- 오류 상태: 입력 실패/가입 실패 시 알림 또는 인라인 안내
- 모바일 전환 시 주의사항:
  - 앱에서도 소셜 로그인 후 추가 정보 수집 단계를 유지할지 현재 정책상 유지 가능성이 높음
- 근거 파일:
  - [src/app/(main)/oauth-redirect/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/oauth-redirect/page.tsx:1)
  - [src/features/SocialCallback.tsx](/Users/osejin/Desktop/cuddle-market/src/features/SocialCallback.tsx:1)
  - [src/app/(main)/auth/social-signup/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/auth/social-signup/page.tsx:1)
  - [src/features/signup/SocialSignup.tsx](/Users/osejin/Desktop/cuddle-market/src/features/signup/SocialSignup.tsx:1)
- 구현 메모:
  - 필수 입력 필드가 장기적으로 `addressSido`, `birthDate` 두 개만으로 충분한지 정책 확인 필요

## 6. 비밀번호 찾기 화면

- 화면 목적: 가입 이메일 기반 비밀번호 재설정 흐름 제공
- 진입 조건: `/auth/find-password`
- 표시 데이터:
  - 이메일 기반 재설정 폼
- 사용자 액션:
  - 이메일 입력
  - 인증 및 재설정 절차 진행
- 화면 이동: 완료 후 로그인 유도 가능
- 인증 여부: 비로그인 접근 가능
- 로딩 상태: 폼 처리 중 pending 상태
- 빈 상태: 해당 없음
- 오류 상태: 입력 오류, 인증 실패, 재설정 실패 안내
- 모바일 전환 시 주의사항:
  - 앱에서는 인라인 오류 우선 적용에 적합한 화면
- 근거 파일:
  - [src/app/(main)/auth/find-password/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/auth/find-password/page.tsx:1)
  - [src/features/find-password/FindPasswordPage.tsx](/Users/osejin/Desktop/cuddle-market/src/features/find-password/FindPasswordPage.tsx:1)
  - [src/features/find-password/components/FindPasswordForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/find-password/components/FindPasswordForm.tsx:1)
- 구현 메모:
  - 재설정 완료 후 자동 로그인 여부는 코드상 명확하지 않음

## 7. 상품 등록/수정 화면

- 화면 목적: 판매상품 등록, 판매요청 등록, 기존 상품 수정
- 진입 조건:
  - `/product-post`
  - `/products/[id]/edit`
- 표시 데이터:
  - 판매/구매 요청 탭
  - 기본 정보, 가격/상태, 이미지 업로드 필드
  - 수정 모드일 경우 기존 상품 데이터
- 사용자 액션:
  - 상품 유형 전환
  - 입력/수정
  - 이미지 업로드/정렬
  - 저장/수정 제출
- 화면 이동:
  - 비로그인 시 로그인 페이지로 이동
  - 성공 후 상세 또는 목록 복귀 추정
- 인증 여부: 로그인 필요
- 로딩 상태: 수정 모드 초기 데이터 로딩 시 스피너
- 빈 상태: 해당 없음
- 오류 상태: 상품 로드 실패 시 홈 이동, 폼 제출 실패 시 화면 내 오류 처리
- 모바일 전환 시 주의사항:
  - 앱에서는 화면별 가드가 아니라 protected 라우트 그룹으로 이동 예정
  - 폼 오류는 인라인 오류 원칙에 맞춰 세분화 가능
- 근거 파일:
  - [src/app/(main)/product-post/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/product-post/page.tsx:1)
  - [src/app/(main)/products/[id]/edit/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/products/[id]/edit/page.tsx:1)
  - [src/features/product-post/ProductPost.tsx](/Users/osejin/Desktop/cuddle-market/src/features/product-post/ProductPost.tsx:1)
  - [src/features/product-post/components/ProductPostForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/product-post/components/ProductPostForm.tsx:1)
  - [src/features/product-post/components/ProductRequestForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/product-post/components/ProductRequestForm.tsx:1)
- 구현 메모:
  - 저장 성공 후 정확한 목적지와 draft/임시저장 정책은 별도 정리 필요

## 8. 커뮤니티 목록 화면

- 화면 목적: 질문/정보 게시글 탐색, 검색, 정렬, 글쓰기 진입
- 진입 조건: `/community`
- 표시 데이터:
  - 질문/정보 탭 목록
  - 검색어
  - 정렬
  - 게시글 목록
- 사용자 액션:
  - 탭 전환
  - 검색
  - 정렬 변경
  - 게시글 클릭
  - 글쓰기
  - 무한스크롤
- 화면 이동:
  - 게시글 상세
  - 글쓰기 화면
- 인증 여부:
  - 목록 읽기는 비로그인 가능
  - 글쓰기는 로그인 필요
- 로딩 상태: 초기 fallback, 이후 infinite query 로딩
- 빈 상태: 게시글이 없으면 `EmptyState` 계열 UI 가능
- 오류 상태: 로드 실패 시 새로고침 유도
- 모바일 전환 시 주의사항:
  - 앱에서도 질문/정보를 1차 탭 구조로 유지할지 현재는 유지 가능성이 높음
  - 비로그인 글쓰기 유도 UX는 커뮤니티 상세/댓글과 통일하기로 결정됨
- 근거 파일:
  - [src/app/(main)/community/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/community/page.tsx:1)
  - [src/features/community/CommunityPage.tsx](/Users/osejin/Desktop/cuddle-market/src/features/community/CommunityPage.tsx:1)
- 구현 메모:
  - 검색 결과 0건일 때의 정확한 카피와 CTA는 앱 명세에서 별도 정의 필요

## 9. 커뮤니티 상세 화면

- 화면 목적: 게시글 본문, 댓글, 답글, 신고/수정/삭제, 댓글 작성
- 진입 조건:
  - `/community/[id]` → canonical slug 경로 redirect
  - `/community/[id]/[name]`
- 표시 데이터:
  - 게시글 본문
  - 작성자, 조회수, 생성 시각
  - 댓글/답글
- 사용자 액션:
  - 댓글 작성
  - 답글 작성
  - 신고
  - 본인 글 수정/삭제
  - 목록 복귀
- 화면 이동:
  - 커뮤니티 목록
  - 수정 화면
- 인증 여부:
  - 읽기 자체는 비로그인 가능
  - 댓글/답글/신고는 로그인 필요
- 로딩 상태: 게시글/댓글 로드 시 스피너
- 빈 상태: 댓글이 없을 때 댓글 목록 빈 상태 가능
- 오류 상태: 로드 실패 시 목록 복귀 버튼
- 모바일 전환 시 주의사항:
  - 비로그인 유도 UX는 글쓰기/댓글/신고/차단에서 통일하기로 결정됨
  - 신고 같은 선택성 액션은 앱에서 바텀시트 전환 정책과 연결됨
- 근거 파일:
  - [src/app/(main)/community/[id]/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/community/[id]/page.tsx:1)
  - [src/app/(main)/community/[id]/[name]/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/community/[id]/[name]/page.tsx:1)
  - [src/features/community/CommunityDetail.tsx](/Users/osejin/Desktop/cuddle-market/src/features/community/CommunityDetail.tsx:1)
  - [src/features/community/components/CommentList.tsx](/Users/osejin/Desktop/cuddle-market/src/features/community/components/CommentList.tsx:1)
  - [src/features/community/components/CommentForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/community/components/CommentForm.tsx:1)
- 구현 메모:
  - 작성자 프로필 클릭 정책과 사용자 프로필 접근 연결 규칙은 코드상 명시적이지 않음

## 10. 커뮤니티 글 작성/수정 화면

- 화면 목적: 질문/정보 게시글 작성 및 수정
- 진입 조건:
  - `/community-post`
  - `/community/[id]/edit`
- 표시 데이터:
  - 제목, 내용, 마크다운 도구, 이미지 업로드
  - 수정 모드일 경우 기존 글 데이터
- 사용자 액션:
  - 글 입력
  - 미리보기
  - 저장/수정 제출
- 화면 이동:
  - 비로그인 시 로그인 페이지 이동
  - 성공 후 상세 화면 이동 추정
- 인증 여부: 로그인 필요
- 로딩 상태: 수정 시 기존 글 로드
- 빈 상태: 해당 없음
- 오류 상태: 글 로드 실패, 저장 실패, 유효성 오류
- 모바일 전환 시 주의사항:
  - 앱에서는 바텀시트보다 풀스크린 편집 UX가 더 적합할 가능성이 높음
  - 폼/섹션 오류는 인라인으로 분해하기 쉬운 화면
- 근거 파일:
  - [src/app/(main)/community-post/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/community-post/page.tsx:1)
  - [src/app/(main)/community/[id]/edit/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/community/[id]/edit/page.tsx:1)
  - [src/features/community/components/CommunityPostForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/community/components/CommunityPostForm.tsx:1)
- 구현 메모:
  - 임시저장과 이탈 방지 정책은 일부 모달 컴포넌트가 보이지만 실제 연결 여부 검증 필요

## 11. 채팅 화면

- 화면 목적: 채팅방 목록과 메시지 송수신, 이미지 전송, 채팅방 정보 제공
- 진입 조건:
  - `/chat`
  - `/chat/[id]`
- 표시 데이터:
  - 채팅방 목록
  - 선택된 방 메시지 목록
  - 읽지 않음 수
  - 상품 정보 및 상대방 정보
- 사용자 액션:
  - 채팅방 선택
  - 메시지 전송
  - 이미지 전송
  - 채팅방 나가기
  - 뒤로가기
- 화면 이동:
  - 비로그인 시 로그인 페이지 이동
  - 방 선택 시 `/chat/[id]`
- 인증 여부: 로그인 필요
- 로딩 상태: 방 목록 로딩, 메시지 로딩, 웹소켓 연결 대기
- 빈 상태: 방이 없는 경우 목록 기반 빈 상태 가능
- 오류 상태: 방 로드 실패 시 홈 이동 유도, 이미지 업로드 실패 시 인라인 에러
- 모바일 전환 시 주의사항:
  - 앱에서도 채팅 진입은 로그인 필요 정책 유지
  - 채팅은 하단 탭의 1차 네비게이션 유지 결정
  - 앱에서는 로그인 후 원래 채팅방 복귀 정책을 `redirectUrl`과 함께 유지 예정
- 근거 파일:
  - [src/app/(main)/chat/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/chat/page.tsx:1)
  - [src/app/(main)/chat/[id]/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/chat/[id]/page.tsx:1)
  - [src/features/chatting-page/ChattingPage.tsx](/Users/osejin/Desktop/cuddle-market/src/features/chatting-page/ChattingPage.tsx:1)
  - [src/features/chatting-page/components/ChatRooms.tsx](/Users/osejin/Desktop/cuddle-market/src/features/chatting-page/components/ChatRooms.tsx:1)
  - [src/features/chatting-page/components/ChatLog.tsx](/Users/osejin/Desktop/cuddle-market/src/features/chatting-page/components/ChatLog.tsx:1)
  - [src/store/chatSocketStore.ts](/Users/osejin/Desktop/cuddle-market/src/store/chatSocketStore.ts:1)
- 구현 메모:
  - 네트워크 재연결, 오프라인 메시지 보관, 푸시 연동 규칙은 별도 정책 필요

## 12. 지도 화면

- 화면 목적: 현재 위치/지도 영역 기준 장소 탐색과 필터링
- 진입 조건: `/map`
- 표시 데이터:
  - 지도 SDK
  - 카테고리 탭
  - 장소 마커
  - 장소 목록/상세
- 사용자 액션:
  - 카테고리 전환
  - 현재 지도에서 재검색
  - 내 위치 이동
  - 장소 선택
- 화면 이동:
  - 지도 내부 상세 패널/카드 중심, 외부 화면 이동은 제한적
- 인증 여부: 비로그인 접근 가능
- 로딩 상태:
  - SDK 로드 대기 스피너
  - 장소 데이터 로딩 표시
- 빈 상태: 결과 없음 상태 가능
- 오류 상태:
  - 현재 웹 코드는 요청 실패 시 기존 마커 유지 중심
  - 앱 정책 결정안은 SDK 실패/첫 로드 실패/재검색 실패를 명시적 오류로 분리
- 모바일 전환 시 주의사항:
  - 앱에서도 1차 네비게이션 유지
  - 지도는 지속 사용 화면이므로 데이터 실패로 화면 전체를 덮지 않는 원칙 적용
  - 재검색은 기존 `SearchInMapButton` 흐름 재활용
- 근거 파일:
  - [src/app/(main)/map/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/map/page.tsx:1)
  - [src/features/map/MapContainer.tsx](/Users/osejin/Desktop/cuddle-market/src/features/map/MapContainer.tsx:1)
  - [src/features/map/NaverMap.tsx](/Users/osejin/Desktop/cuddle-market/src/features/map/NaverMap.tsx:1)
  - [src/store/mapStore.ts](/Users/osejin/Desktop/cuddle-market/src/store/mapStore.ts:1)
- 구현 메모:
  - 지도 API 첫 결과 0건과 실패를 현재 UI가 얼마나 구분하는지는 추가 확인 필요

## 13. 마이페이지 화면

- 화면 목적: 본인 계정과 거래 관련 데이터 관리
- 진입 조건: `/mypage`
- 표시 데이터:
  - 내 프로필 요약
  - 판매 내역
  - 구매 요청 내역
  - 찜 목록
  - 차단 사용자 목록
  - 대시보드 성격의 요약 정보
- 사용자 액션:
  - 탭 전환
  - 더보기/무한 로드
  - 상품 삭제
  - 차단 해제
  - 모바일 패널 열기
- 화면 이동:
  - 비로그인 시 로그인 페이지 이동
  - 프로필 수정
  - 관련 상품 상세
- 인증 여부: 로그인 필요
- 로딩 상태: 각 섹션별 query 로딩, 전체 초기 스피너
- 빈 상태: 탭별 `EmptyState`
- 오류 상태: 개별 액션 실패 인라인 알림, 데이터 로드 실패 화면
- 모바일 전환 시 주의사항:
  - 앱에서도 마이페이지는 본인 계정/거래 관리 전용으로 유지
  - 현재 모바일 오버레이 기반인데 앱에서는 네이티브 탭/스택 구조로 재설계 가능
- 근거 파일:
  - [src/app/(main)/mypage/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/mypage/page.tsx:1)
  - [src/features/my-page/MyPage.tsx](/Users/osejin/Desktop/cuddle-market/src/features/my-page/MyPage.tsx:1)
  - [src/components/profile/ProfileData.tsx](/Users/osejin/Desktop/cuddle-market/src/components/profile/ProfileData.tsx:1)
- 구현 메모:
  - 마이페이지 대시보드 KPI 중 어떤 값이 앱 MVP에 꼭 필요한지는 후속 우선순위 조정 필요

## 14. 프로필 수정 화면

- 화면 목적: 내 프로필 정보 수정, 비밀번호 변경, 회원탈퇴
- 진입 조건: `/profile-update`
- 표시 데이터:
  - 내 프로필 정보
  - 프로필 수정 폼
  - 비밀번호 변경 폼
  - 회원탈퇴 모달
- 사용자 액션:
  - 기본 정보 수정
  - 닉네임 확인
  - 비밀번호 변경
  - 회원탈퇴
- 화면 이동:
  - 비로그인 시 로그인 페이지 이동
  - 탈퇴 성공 시 홈
- 인증 여부: 로그인 필요
- 로딩 상태: 내 프로필 로드 중 스피너
- 빈 상태: 해당 없음
- 오류 상태: 프로필 로드 실패 시 마이페이지 복귀, 탈퇴/수정 실패 시 인라인 오류
- 모바일 전환 시 주의사항:
  - 앱에서는 내 프로필 수정이 마이페이지 관리 영역으로 명확히 연결돼야 함
  - 파괴적 확인은 다이얼로그 유지 정책 적용
- 근거 파일:
  - [src/app/(main)/profile-update/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/profile-update/page.tsx:1)
  - [src/features/profile-update/ProfileUpdate.tsx](/Users/osejin/Desktop/cuddle-market/src/features/profile-update/ProfileUpdate.tsx:1)
  - [src/features/profile-update/components/ProfileUpdateBaseForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/profile-update/components/ProfileUpdateBaseForm.tsx:1)
  - [src/features/profile-update/components/ProfileUpdatePasswordForm.tsx](/Users/osejin/Desktop/cuddle-market/src/features/profile-update/components/ProfileUpdatePasswordForm.tsx:1)
- 구현 메모:
  - 소셜 로그인 사용자의 수정 가능 범위는 provider별로 추가 정리 필요

## 15. 사용자 프로필 화면

- 화면 목적: 다른 사용자 정보 열람과 대인 액션(채팅, 차단, 신고) 제공
- 진입 조건: `/user-profile/[id]`
- 표시 데이터:
  - 상대 프로필 정보
  - 판매상품/판매요청 목록
  - 차단 여부 등 상태
- 사용자 액션:
  - 탭 전환
  - 상품 클릭
  - 신고
  - 차단/차단 해제
- 화면 이동:
  - 상품 상세
  - 앱 정책 결정안 기준 본인 접근 시 마이페이지 리다이렉트 고려
- 인증 여부:
  - 최종 분석 문서 기준 로그인 필요 영역
  - 현재 웹 코드에는 라우트 레벨 가드가 명시적이지 않음
- 로딩 상태: 프로필 및 상품 목록 로딩 시 스피너
- 빈 상태: 판매상품/판매요청이 없을 때 `EmptyState`
- 오류 상태: 사용자 정보 로드 실패 시 홈 복귀 버튼
- 모바일 전환 시 주의사항:
  - 앱에서는 로그인 필요 화면으로 유지
  - 접근 제어는 주요 진입 경로 차단이 아니라 라우트 차단 기준으로 강화
  - 채팅은 하단 sticky CTA로 승격
  - 차단/신고는 상단 케밥 뒤 바텀시트로 전환
- 근거 파일:
  - [src/app/(main)/user-profile/[id]/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/user-profile/[id]/page.tsx:1)
  - [src/features/UserPage.tsx](/Users/osejin/Desktop/cuddle-market/src/features/UserPage.tsx:1)
  - [src/components/profile/ProfileData.tsx](/Users/osejin/Desktop/cuddle-market/src/components/profile/ProfileData.tsx:1)
  - [src/features/product-detail/components/SellerProfileCard.tsx](/Users/osejin/Desktop/cuddle-market/src/features/product-detail/components/SellerProfileCard.tsx:1)
- 구현 메모:
  - 현재 웹에서 직접 URL 진입까지 완전히 차단하는지는 코드상 불명확

## 16. 알림 화면

- 화면 목적: 알림 목록 조회, 읽음 처리, 관련 화면 이동
- 진입 조건: `/notifications`
- 표시 데이터:
  - 알림 목록
  - 읽음 여부
  - 관련 엔티티 정보
- 사용자 액션:
  - 개별 알림 읽기
  - 모두 읽음
  - 무한스크롤
  - 알림을 통한 대상 화면 이동
- 화면 이동:
  - 알림 타입에 따라 상품/커뮤니티/채팅 등 관련 화면으로 이동
- 인증 여부: 로그인 필요
- 로딩 상태: skeleton 사용
- 빈 상태: `표시할 알림이 없습니다.`
- 오류 상태: 명시적 전면 오류 UI는 약하고 query 기반 재시도 의존
- 모바일 전환 시 주의사항:
  - 앱에서도 알림은 protected 영역 유지
  - 액션 결과 알림은 토스트/스낵바 기준과 충돌하지 않게 정리 필요
- 근거 파일:
  - [src/app/(main)/notifications/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(main)/notifications/page.tsx:1)
  - [src/components/header/components/notification-section/NotificationsDropdown.tsx](/Users/osejin/Desktop/cuddle-market/src/components/header/components/notification-section/NotificationsDropdown.tsx:1)
  - [src/lib/utils/getNavigationPath.ts](/Users/osejin/Desktop/cuddle-market/src/lib/utils/getNavigationPath.ts:1)
- 구현 메모:
  - 알림 타입별 최종 이동 정책과 읽음 처리 시점의 세부 명세는 별도 필요

## 17. 관리자 로그인 화면

- 화면 목적: 관리자 전용 진입
- 진입 조건: `/admin/login`
- 표시 데이터:
  - 관리자 이메일/비밀번호 폼
- 사용자 액션:
  - 로그인 제출
- 화면 이동:
  - 성공 시 `/admin`
- 인증 여부: 관리자 권한 필요
- 로딩 상태: 로그인 제출 중 pending
- 빈 상태: 해당 없음
- 오류 상태: 관리자 권한 미충족 시 실패 처리
- 모바일 전환 시 주의사항:
  - 현재 앱 범위가 사용자 앱 중심이면 우선순위에서 제외 가능
- 근거 파일:
  - [src/app/(admin-auth)/admin/login/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(admin-auth)/admin/login/page.tsx:1)
  - [src/features/admin/components/auth/AdminLogin.tsx](/Users/osejin/Desktop/cuddle-market/src/features/admin/components/auth/AdminLogin.tsx:1)
- 구현 메모:
  - 앱에서 관리자 기능을 별도 앱/웹으로 분리할지 정책 필요

## 18. 관리자 대시보드 및 관리 목록 화면군

- 화면 목적: 관리자 관점의 상품, 회원, 탈퇴, 커뮤니티, 신고 관리
- 진입 조건:
  - `/admin`
  - `/admin/products`
  - `/admin/community`
  - `/admin/members`
  - `/admin/members/users`
  - `/admin/members/withdrawals`
  - `/admin/reports/*`
- 표시 데이터:
  - 통계 카드
  - 테이블 목록
  - 상세 모달
  - 필터/검색/정렬/페이지네이션
- 사용자 액션:
  - 목록 탐색
  - 검색/정렬/필터
  - 상세 모달 열기
  - 관리 액션 수행
- 화면 이동:
  - 관리자 사이드바 기반 각 섹션 이동
- 인증 여부: 관리자 권한 필요
- 로딩 상태: query 로딩, 테이블 placeholderData 유지
- 빈 상태: 테이블 빈 상태 가능
- 오류 상태: `useAdminTable`의 `isError` 기반 화면별 처리
- 모바일 전환 시 주의사항:
  - 현재 사용자 앱 전환 작업 범위라면 관리자 화면은 후순위로 두는 것이 적절
- 근거 파일:
  - [src/app/(admin)/admin/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(admin)/admin/page.tsx:1)
  - [src/app/(admin)/admin/products/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(admin)/admin/products/page.tsx:1)
  - [src/app/(admin)/admin/community/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(admin)/admin/community/page.tsx:1)
  - [src/app/(admin)/admin/members/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(admin)/admin/members/page.tsx:1)
  - [src/app/(admin)/admin/members/users/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(admin)/admin/members/users/page.tsx:1)
  - [src/app/(admin)/admin/members/withdrawals/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(admin)/admin/members/withdrawals/page.tsx:1)
  - [src/app/(admin)/admin/reports/user/page.tsx](/Users/osejin/Desktop/cuddle-market/src/app/(admin)/admin/reports/user/page.tsx:1)
  - [src/features/admin/hooks/useAdminTable.ts](/Users/osejin/Desktop/cuddle-market/src/features/admin/hooks/useAdminTable.ts:1)
  - [src/lib/api/admin.ts](/Users/osejin/Desktop/cuddle-market/src/lib/api/admin.ts:1)
- 구현 메모:
  - 앱 프로젝트 범위에 관리자 기능을 포함할지 자체가 아직 불명확
