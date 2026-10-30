# 반려동물 행사 소식 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공공기관 게시판 4곳 크롤링과 관광공사 축제 API로 반려동물 행사를 모아, 커뮤니티 "행사 소식" 게시판에 정해진 틀로 하루 한 번 자동으로 올린다.

**Architecture:** 크롤러(Python)는 `cuddle-market/crawler/`에 두고 GitHub Actions로 하루 한 번 돈다. 출처별 파서가 목록과 상세를 읽고, Gemini가 본문에서 행사 여부와 칸 값을 정해진 JSON으로 뽑고, 틀은 코드가 채운다. 서버(cmarket_api)는 전용 키로 여는 수집 주소 두 개와 수집 기록 테이블을 더하고, 웹은 탭, 헤더, 메타 설명, 외부 이미지 처리를 고친다.

**Tech Stack:** Python 3.9 이상(Actions는 3.12), requests, beautifulsoup4, google-genai, pytest / Spring Boot 3.2, Java 21, JPA, JUnit 5, Mockito / Next.js 16, Vitest

**Spec:** `docs/superpowers/specs/2026-10-30-pet-event-feed-design.md`

## 진행 순서 (2026-10-30 사용자 결정으로 바꿈)

**Task 1~3(서버) → Task 3-1(서버, 행사 칸) → Task 10~12(웹) → Task 12-1(상태로 걸러 보기) → Task 12-2(행사 상세 화면) → Task 12-3(운영시간, 길찾기) → Task 12-4(칸 값 먼저, 포스터 자리, 검색어) → Task 12-5(실제 실행 뒤 고칠 것) → Task 12-6(신청 칸) → Task 12-7(쇼알라) → Task 4~9(크롤러) → Task 13.** 웹을 먼저 해서 로컬 화면(`localhost:3000`)에서 행사 소식을 눈으로 확인한 뒤 크롤러로 넘어간다. 웹은 서버만 있으면 되고 크롤러와는 주고받는 것이 없어 순서를 바꿔도 된다. 웹 확인용 예시 행사 글은 로컬 DB에만 넣는다.

## 진행 기록

- 이슈 #1124. 브랜치 `feature/1124--pet-event-feed`.
- Task 1~3, 3-1 완료(cmarket_api `c61ba61`, `708727f`, `ce1879b`, `c677141`, 수정 `5e87284`. 로컬 `main`에만 있고 push 전). 서버 시험 24개 통과.
- 계획과 달라진 점:
  - Task 2: 배포 전 DB 칸 고치기 SQL `scripts/alter-board-type-column.sql`을 더했다(설계 7절).
  - Task 3: `service/cmarket` 모듈에 JUnit 5 설정이 없어 시험이 「찾지 못함」으로 돌지 않았다. 설정을 더하고, 운영 설정 없이는 늘 실패하는 `CmarketApiApplicationTests`는 실행에서 뺐다. 503 응답용으로 `ResponseCode.SERVICE_UNAVAILABLE`을 더했다.
  - 포스터는 본문 맨 위 사진 표시로 넣는다(설계 9절). Task 7, 8에 반영했다.
  - Task 10: 계획 Task 1의 「수정 명령이 EVENT면 거절」은 설계 7-1절(운영 계정은 자기 행사 글을 고칠 수 있다)과 어긋났다. 서버는 **다른 글을 EVENT로 옮기는 것만** 거절하게 고쳤다(cmarket_api `5e87284`).
  - 행사 소식 화면을 정했다(설계 7-2절): 목록은 상태 칩, 제목, 한 줄 소개, 기간, 「지역 · 주최」. 프로필, 닉네임, 포스터, 댓글순 없음. 그래서 서버가 행사 칸을 따로 저장해 내려 주는 Task 3-1을 더했고, Task 6, 7, 8, 10을 고쳤다.

## Global Constraints

- 접속 이름: `CuddleEventBot/0.1 (+https://cuddle-market.vercel.app)`. 모든 요청에 쓴다(노원구는 기본 이름이면 400).
- 요청 사이 1초 이상 쉰다. robots.txt가 막은 주소는 요청하지 않는다(`urllib.robotparser`).
- 크롤링 출처는 목록 등록일이 오늘 기준 90일 안인 글만 상세를 읽는다.
- 끝나는 날(없으면 시작일)이 오늘보다 앞이면 올리지 않는다. 날짜를 하나도 못 뽑으면 올리지 않는다.
- 본문 글자가 50자 미만이면 AI에 보내지 않고 건너뛴다.
- 글 제목 50자, 본문 1,000자 이하(`Post.java`). 넘으면 AI 칸부터 줄인다.
- 틀과 끝 문구는 설계 4절 그대로. 끝 문구: "이 글은 주최 기관이 공개한 자료를 바탕으로 정리한 안내입니다." / "일정과 참가 조건은 바뀔 수 있으니 공식 안내에서 다시 확인해주세요."
- 본문에 없는 값은 비우고 "공식 안내 확인"으로 쓴다.
- 포스터는 원래 주소만 저장한다(복사 금지). 글당 1장. 본문 맨 위에 `![포스터](원래 주소)`로 넣고 `imageUrl`로도 보낸다(설계 9절).
- 게시판 코드 `EVENT`, 웹 탭 이름 "행사 소식", 탭 id `tab-event`.
- 일반 글쓰기와 수정에서 `EVENT`로 만들거나 옮기는 것을 거절한다.
- 헤더: "질문·정보"를 "커뮤니티", "펫지도"를 "플레이스". 커뮤니티 메타 설명: "반려동물 질문과 정보를 나누고, 가까운 행사 소식도 확인해 보세요".
- GitHub Secrets 이름: `GEMINI_API_KEY`, `PUBLIC_DATA_SERVICE_KEY`, `INGEST_API_KEY`, `DISCORD_WEBHOOK_URL`. 서버 환경 변수: `INGEST_API_KEY`, `INGEST_AUTHOR_USER_ID`(=52).
- 백엔드 빌드: `JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew ...`
- 저장소 규칙: cuddle-market은 최신 develop에서 브랜치를 따서 develop으로 PR. cmarket_api는 main에 바로 커밋(`cuddle-market/CLAUDE.md`). push는 사용자가 허락할 때만.

## Review Focus

1. 연도 없는 날짜("10월 31일(토)")는 글 등록일의 연도로 채운다. 12월에 올라온 글의 1월 행사는 다음 해로 본다. → Task 4 시험
2. 사이트 구조가 바뀌어 목록에서 0건이 나오는 것은 "검색 결과 0건"과 다르다. 페이지에 결과 수 표시가 있는데 파싱이 0이면 실패로 알린다. → Task 5, Task 8 시험
3. AI가 본문에 없는 날짜나 참가비를 만들어 낼 수 있다. 뽑은 날짜의 월과 일 숫자가 본문에 없으면 그 값을 버린다. → Task 7 시험
4. 서울시와 노원구가 같은 축제를 다룬 경우, 연도와 기호만 다른 행사명은 같은 행사로 본다. → Task 2 시험
5. 외부 포스터 주소가 깨지면 기본 이미지를 보여 준다. → Task 11 시험

---

## 서버 (cmarket_api)

### Task 1: EVENT 게시판과 일반 글쓰기 막기, 전체 목록에서 빼기

**Files:**
- Modify: `service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/community/model/BoardType.java`
- Modify: `service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/community/app/service/CommunityServiceImpl.java` (`createPost` 57행, `updatePost` 134행 맨 앞)
- Modify: `service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/community/repository/PostRepositoryCustomImpl.java:50-53`
- Create: `service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/community/app/exception/EventBoardWriteNotAllowedException.java`
- Test: `service/cmarket-domain/src/test/java/org/cmarket/cmarket/domain/community/app/service/CommunityServiceEventGuardTest.java`

**Interfaces:**
- Produces: `BoardType.EVENT`, `EventBoardWriteNotAllowedException extends RuntimeException`

- [x] **Step 1: 실패하는 시험 작성** (Mockito로 `CommunityServiceImpl`의 저장소를 가짜로)
  - `createPost_withEventBoard_throws`: `PostCreateCommand.builder().boardType(BoardType.EVENT)` → `EventBoardWriteNotAllowedException`, `postRepository.save` 호출 없음
  - `updatePost_toEventBoard_throws`: 수정 명령의 boardType이 EVENT면 같은 예외
- [x] **Step 2: 시험 실행해 실패 확인** — `JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew :service:cmarket-domain:test --tests '*CommunityServiceEventGuardTest'` → 컴파일 실패(EVENT 없음)
- [x] **Step 3: 구현** — `BoardType`에 `EVENT`(주석 "행사 소식, 수집 주소로만 만든다") 추가. 두 메서드 맨 앞에서 boardType이 EVENT면 예외. 예외는 기존 `PostAccessDeniedException`과 같은 방식으로 전역 예외 처리에 400으로 연결(전역 처리기를 찾아 같은 형식으로 추가).
- [x] **Step 4: 목록 조건** — `boardType == null`이면 `post.boardType.ne(BoardType.EVENT)` 조건을 더한다.
- [x] **Step 5: 시험과 전체 컴파일 통과 확인** — 위 시험 PASS, `./gradlew compileJava` 성공
- [x] **Step 6: 커밋** — `feat: 커뮤니티에 행사 소식(EVENT) 게시판을 더하고 일반 글쓰기에서는 막는다`

### Task 2: 수집 기록 테이블과 수집 서비스

**Files:**
- Create: `service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/eventfeed/model/EventIngestRecord.java`
- Create: `.../domain/eventfeed/model/EventIngestStatus.java`
- Create: `.../domain/eventfeed/repository/EventIngestRecordRepository.java`
- Create: `.../domain/eventfeed/app/EventTitleKey.java`
- Create: `.../domain/eventfeed/app/dto/EventIngestCommand.java`, `EventIngestResult.java`
- Create: `.../domain/eventfeed/app/EventIngestService.java`
- Test: `service/cmarket-domain/src/test/java/org/cmarket/cmarket/domain/eventfeed/app/EventTitleKeyTest.java`, `EventIngestServiceTest.java`

**Interfaces:**
- Consumes: `BoardType.EVENT`, `PostRepository`, `UserRepository`
- Produces:
  - `enum EventIngestStatus { POSTED, SKIPPED_NOT_EVENT, SKIPPED_ENDED, SKIPPED_NO_DATE, SKIPPED_NO_TEXT, SKIPPED_DUPLICATE }`
  - 엔티티 `EventIngestRecord`(테이블 `event_ingest_record`): `id`, `sourceCode`(30), `externalId`(100), `status`, `postId`(null 가능), `sourceUrl`(500), `titleKey`(100, null 가능), `eventStartDate`(LocalDate, null 가능), `collectedAt`. 유니크 `(source_code, external_id)`. 생성자에 `@Builder`.
  - `EventIngestRecordRepository`: `List<EventIngestRecord> findBySourceCodeAndExternalIdIn(String, Collection<String>)`, `boolean existsBySourceCodeAndExternalId(String, String)`, `boolean existsByStatusAndTitleKeyAndEventStartDate(EventIngestStatus, String, LocalDate)`
  - `EventTitleKey.normalize(String title) -> String`
  - `EventIngestCommand`(클래스에 `@Getter @Builder`): `sourceCode, externalId, sourceUrl, status, title, content, imageUrl(null 가능), eventStartDate(null 가능)`
  - `EventIngestResult`: `status`(`CREATED | ALREADY_EXISTS | RECORDED_SKIP | DUPLICATE`), `postId`(null 가능)
  - `EventIngestService`: `List<String> findUnseen(String sourceCode, List<String> externalIds)`, `EventIngestResult ingest(EventIngestCommand command)`. 생성자에서 `@Value("${ingest.author-user-id:}") String authorUserId`를 받는다.

- [x] **Step 1: `EventTitleKeyTest` 작성**
  - `normalize("2026 서울 댕냥데이즈")` == `normalize("서울 댕냥데이즈(2026)")` == `"서울댕냥데이즈"`
  - `normalize("[2026년 노원 반려동물 문화축제] 10월 31일(토) 10시 개최")`에서 대괄호, 연도(`20\d\d년?`), 공백, 기호가 빠진다
  - 결과 길이는 100자 이하
- [x] **Step 2: `EventIngestServiceTest` 작성** (저장소 가짜)
  - 같은 (출처, 번호)가 있으면 `ALREADY_EXISTS`, `postRepository.save` 호출 없음
  - `status=SKIPPED_ENDED` 명령은 기록만 저장하고 `RECORDED_SKIP`
  - `POSTED` 명령인데 같은 `titleKey`와 `eventStartDate`의 POSTED 기록이 있으면 `SKIPPED_DUPLICATE`로 기록하고 `DUPLICATE`
  - 정상 `POSTED`면 `Post`가 `boardType=EVENT`, 작성자 52번의 닉네임, `imageUrls=[imageUrl]`(없으면 빈 목록)로 저장되고 기록의 `postId`가 채워진다
  - 제목이 50자를 넘거나 본문이 1,000자를 넘으면 `IllegalArgumentException`
  - `findUnseen("SEOUL", ["1","2"])`에서 "1"만 기록에 있으면 `["2"]`
- [x] **Step 3: 실패 확인** — `./gradlew :service:cmarket-domain:test --tests '*eventfeed*'`
- [x] **Step 4: 구현** — 정규화: 대괄호와 괄호 안 연도 제거 → `20\d\d년?` 제거 → 한글, 영문, 숫자만 남기고 소문자 → 100자로 자름. `ingest`는 `@Transactional`. `authorUserId`가 비어 있으면 `IllegalStateException`.
- [x] **Step 5: 통과 확인** — 위 시험 PASS
- [x] **Step 6: 커밋** — `feat: 행사 수집 기록 테이블과 중복을 막는 수집 서비스를 더한다`

### Task 3: 전용 키로 여는 수집 주소

**Files:**
- Create: `service/cmarket/src/main/java/org/cmarket/cmarket/web/eventfeed/IngestKeyVerifier.java`
- Create: `.../web/eventfeed/EventIngestController.java`
- Create: `.../web/eventfeed/dto/UnseenRequest.java`, `UnseenResponse.java`, `EventIngestRequest.java`
- Modify: `service/cmarket/src/main/java/org/cmarket/cmarket/web/common/security/SecurityConfig.java` (permitAll 목록, 349행 근처)
- Modify: `service/cmarket/src/main/resources/application-prod.properties` (끝에 두 줄)
- Test: `service/cmarket/src/test/java/org/cmarket/cmarket/web/eventfeed/IngestKeyVerifierTest.java`

**Interfaces:**
- Consumes: `EventIngestService`
- Produces (크롤러가 그대로 부른다):
  - `POST /api/ingest/events/unseen` 머리글 `X-Ingest-Key`, 본문 `{"sourceCode":"SEOUL","externalIds":["468820"]}` → `{"code":"SUCCESS","data":{"unseen":["468820"]}}`
  - `POST /api/ingest/events` 본문 `{"sourceCode","externalId","sourceUrl","status","title","content","imageUrl","eventStartDate":"2026-10-31"}` → `{"code":"SUCCESS","data":{"status":"CREATED","postId":123}}`
  - 키가 없거나 틀리면 401, 서버에 키가 설정되지 않았으면 503
  - `IngestKeyVerifier.verify(String presented) -> boolean` (`@Value("${ingest.api-key:}")`, `MessageDigest.isEqual`)

- [x] **Step 1: `IngestKeyVerifierTest`** — 같은 키 true, 다른 키 false, null false, 서버 키가 빈 문자열이면 무엇이든 false
- [x] **Step 2: 실패 확인** — `./gradlew :service:cmarket:test --tests '*IngestKeyVerifierTest'`
- [x] **Step 3: 구현** — 컨트롤러는 기존 응답 형식(`SuccessResponse`)을 따른다. `SecurityConfig`에 `.requestMatchers(HttpMethod.POST, "/api/ingest/**").permitAll()`. properties에 `ingest.api-key=${INGEST_API_KEY:}`, `ingest.author-user-id=${INGEST_AUTHOR_USER_ID:}`.
- [x] **Step 4: 통과와 전체 빌드 확인** — `./gradlew build -x test` 성공, 위 시험 PASS
- [x] **Step 5: 커밋** — `feat: 전용 키로만 여는 행사 수집 주소 두 개를 더한다`

### Task 3-1: 행사 칸 저장과 커뮤니티 응답에 붙이기 (2026-10-30 추가, 설계 7-2절)

**Files:**
- Modify: `EventIngestRecord`(칸 `eventEndDate`, `region`(20), `place`(100), `organizer`(100), `summary`(100) 추가, 생성자 `@Builder`도), `EventIngestCommand`, `EventIngestService`, `EventIngestRequest`
- Create: `.../domain/eventfeed/app/dto/EventInfoDto.java`
- Modify: `EventIngestRecordRepository`(`List<EventIngestRecord> findByStatusAndPostIdIn(EventIngestStatus, Collection<Long>)`)
- Modify: `service/cmarket/.../web/community/controller/CommunityController.java`(목록, 상세), `PostListItemResponse.java`, `PostDetailResponse.java`(`event` 칸, 행사 글이 아니면 null)
- Test: `EventIngestServiceTest`에 더한다

**Interfaces:**
- Produces: `EventIngestService.findEventInfo(Collection<Long> postIds) -> Map<Long, EventInfoDto>`, `EventInfoDto(startDate, endDate, region, place, organizer, summary)`
- 응답(JSON): 목록 항목과 상세에 `"event": {"startDate":"2026-10-31","endDate":"2026-11-02","region":"서울","place":"문화비축기지","organizer":"서울특별시","summary":"…"}`, 행사 글이 아니면 `"event": null`
- 요청(크롤러 → 서버): `POST /api/ingest/events` 본문에 `eventEndDate`, `region`, `place`, `organizer`, `summary` 추가(모두 null 가능)

- [x] **Step 1: 시험** — 정상 POSTED면 기록에 다섯 칸이 저장된다. `findEventInfo([1, 2])`에서 1번만 POSTED 기록이 있으면 `{1: …}`만 돌려준다. 빈 목록이면 저장소를 부르지 않고 빈 Map.
- [x] **Step 2: 실패 확인** — `./gradlew :service:cmarket-domain:test --tests '*eventfeed*'`
- [x] **Step 3: 구현** — 컨트롤러가 목록, 상세 결과의 글 번호로 `findEventInfo`를 한 번 불러 붙인다(커뮤니티 도메인이 행사 수집을 모르게).
- [x] **Step 4: 확인** — 서버 시험 전체 통과, `./gradlew build -x test`, 로컬 서버에서 `GET /api/community/posts?boardType=EVENT`와 상세에 `event`가 붙는지 curl
- [x] **Step 5: 커밋** — `feat: 행사 기간·지역·주최·한 줄 소개를 저장해 커뮤니티 응답에 붙인다`

### Task 12-1: 행사 상태로 걸러 보기 (2026-10-30 추가, 설계 7-2절)

**서버 (cmarket_api)**
- Create: `.../domain/eventfeed/model/EventPeriodStatus.java`(`UPCOMING, ONGOING, ENDED`, `static of(start, end, today)`)
- Modify: `EventIngestService`(`List<Long> findPostIdsByPeriodStatus(EventPeriodStatus, LocalDate today)`), `EventIngestRecordRepository`(`findByStatus`)
- Modify: `CommunityService(Impl).getPostList`에 `Collection<Long> onlyPostIds`(null이면 거르지 않음, 비면 빈 페이지), `PostRepositoryCustom(Impl).findPosts`에 같은 인자
- Modify: `CommunityController.getPostList`에 `@RequestParam(required = false) EventPeriodStatus eventStatus`. `boardType=EVENT`일 때만 `today = LocalDate.now(Asia/Seoul)`로 글 번호를 구해 넘긴다
- Test: `EventPeriodStatusTest`, `EventIngestServiceTest`, `CommunityServiceEventGuardTest`(빈 목록이면 저장소를 부르지 않고 빈 페이지)

**웹**
- Modify: `src/features/community/CommunityPage.tsx`(행사 소식 탭: 왼쪽 드롭다운, 오른쪽 정렬, 주소 `eventStatus`, 목록 요청에 `eventStatus` 대문자로), `src/app/(main)/community/page.tsx`, `src/lib/api/server/community.ts`(첫 목록에도 같은 값)
- Modify: `src/lib/utils/eventStatus.ts`의 `EVENT_STATUS_FILTERS`(전체, 예정, 진행 중, 종료), `toEventStatusParam` (상태 규칙과 한 파일에 두려고 constants 대신 여기에 뒀다)
- Test: `src/lib/utils/eventStatus.test.ts`에 선택지 시험, 화면은 3000 스크린샷

- [x] **Step 1: 서버 시험** — 상태 규칙(웹 `getEventStatus`와 같은 경계), 걸러진 글 번호, 빈 목록이면 빈 페이지
- [x] **Step 2: 서버 구현과 확인** — 서버 시험 전체, 로컬 서버에서 `eventStatus` 셋을 curl
- [x] **Step 3: 웹 시험과 구현** — `pnpm test`, `tsc`, `lint:strict`
- [x] **Step 4: 3000 화면 확인** — 드롭다운 위치와 고를 때마다 바뀌는 목록
- [x] **Step 5: 커밋** — 서버 `feat: 행사 소식 목록을 진행 상태로 거를 수 있게 한다(#1124)`, 웹 `feat(web): 행사 소식 목록에 상태 드롭다운을 더하고 정렬을 오른쪽으로 옮긴다(#1124)`

### Task 12-2: 행사 상세 화면(픽케어 배치 참고), 댓글·신고 없애기, 드롭다운 모양 (2026-10-30 추가, 설계 7-1·7-2절)

**서버 (cmarket_api)**
- `CommunityServiceImpl.createComment`: 글이 EVENT면 `EventBoardWriteNotAllowedException`(시험 먼저)
- `EventIngestRecord`에 `target`(100), `fee`(100), `activities`(1000, 줄바꿈으로 이음), `checks`(500, 줄바꿈으로 이음), `imageUrl`(500) 칸, 생성자 `@Builder`도. `EventIngestCommand`, `EventIngestRequest`, `EventInfoDto`, `EventInfoResponse`에 `target, fee, activities(List), checks(List), sourceUrl, imageUrl`

**크롤러**
- 보내는 값에 `target, fee, activities, checks` 추가(관광공사는 비어 있다)

**웹**
- `src/types/community.ts`의 `CommunityEvent`에 같은 칸
- Create: `src/features/community/components/EventDetailBody.tsx`(포스터 + 배지·상태 + 제목 + 한 줄 소개 + 표 + 공식 안내 보기 + 목록 + 끝 문구). `src/lib/utils/eventStatus.ts`에 `formatEventPlace(region, place)`
- Modify: `CommunityDetail.tsx` — EVENT이고 `event`가 있으면 `EventDetailBody`, 댓글 영역과 신고하기 단추 없음
- Modify: `CommunityPage.tsx` — 상태 드롭다운을 홈 상세 필터(`LocationFilter` `card-chip`)와 같은 모양으로
- Test: `EventDetailBody.test.tsx`(표 칸, 없는 값은 「공식 안내 확인」, 포스터 없으면 그림 없음, 공식 안내 보기 링크가 원문 주소·새 창, AI 칸 없으면 그 칸째 없음), `CommunityDetail` 쪽은 3000 화면

- [x] **Step 1: 서버 시험과 구현** — 댓글 거절, 새 칸 저장과 응답. `gradlew test`
- [x] **Step 2: 크롤러** — 보내는 값 시험 고치고 통과
- [x] **Step 3: 웹 시험과 구현** — `pnpm test`, `tsc`, `lint:strict`
- [x] **Step 4: 로컬 서버를 새 코드로 띄우고 예시 글을 새 칸까지 넣어 3000 화면 확인(데스크탑, 휴대폰 폭)**
- [x] **Step 5: 커밋** — 서버, 크롤러, 웹 각각

### Task 12-3: 운영시간 칸과 길찾기 링크 (2026-10-30 추가, 설계 4절·7-2절)

- 서버: `EventIngestRecord.hours`(100), `EventIngestCommand`, `EventIngestRequest`(@Size 100), `EventInfoDto`, `EventInfoResponse`
- 크롤러: `EventFields.hours`, AI 스키마 `hours`, `guard_against_invented`(본문에 시각 숫자가 없으면 버림), 본문 틀 「운영시간 | …」(기간 아래), 보내는 값 `hours`
- 웹: `CommunityEvent.hours`, 표에 운영시간 줄, 장소 줄에 길찾기 링크(`getNaverMapSearchUrl`)

- [x] **Step 1: 서버 시험과 구현**
- [x] **Step 2: 크롤러 시험과 구현**
- [x] **Step 3: 웹 시험과 구현**
- [x] **Step 4: 3000 화면 확인**
- [x] **Step 5: 커밋**

### Task 12-4: 출처의 칸 값 먼저, 포스터 실패 시 자리 비우기, 길찾기 검색어 다듬기 (2026-10-30 추가, 설계 7-2절)

- 크롤러: Create `crawler/pet_events/labelled.py`(`labelled_fields(text, ref) -> dict`: 「개최기간」→start/end/hours, 「축제장소」→place, 「요금」→fee, 「주최/주관기관」→organizer, 「연령제한」→target). `run._handle`이 AI 값 위에 덮어쓴다. Test: `crawler/tests/test_labelled.py`, `test_run.py`
- 웹: `EventDetailBody` 포스터 `onError` → 포스터 자리 숨김. `getNaverMapSearchUrl` 검색어 다듬기. Test: `EventDetailBody.test.tsx`, `eventStatus.test.ts`

- [x] **Step 1: 크롤러 시험과 구현** (진짜 문체부 상세 원본으로도 확인)
- [x] **Step 2: 웹 시험과 구현**
- [x] **Step 3: 로컬 예시 글을 실제 문체부 원문 값으로 다시 만들고 3000 화면 확인**
- [x] **Step 4: 커밋**

### Task 12-5: 실제 실행 뒤 고칠 것 네 가지 (2026-10-30 추가, 설계 6절·7-2절)

로컬에서 실제 사이트·Gemini·관광공사 키로 돌린 결과(새 글 5, 문제 4)를 보고 정했다.

- `extract.py`: AI 실패 까닭을 돌려준다(`ExtractError`), 429·500·503 은 기다렸다 두 번까지 다시, AI 요청 사이 4초. 지시문에 반려동물 행사만, 운영시간 합치지 말 것
- `extract.guard_against_invented`: 운영시간 속 숫자가 모두 본문에 따로 있어야 한다
- `run.py`: 제목에 「반려식물」이 있으면 AI 전에 `SKIPPED_NOT_EVENT`. 실패 까닭을 문제 목록에. 관광공사는 소개 글을 받아 AI 에 넣고 API 칸 값을 먼저 쓴다
- `tourapi.py`: `fetch_overview(service_key, content_id, client) -> str | None` (`detailCommon2`, HTML 태그 제거)
- Test: `test_extract.py`, `test_run.py`, `test_tourapi.py`

- [x] **Step 1: 시험** (실패 확인)
- [x] **Step 2: 구현과 통과 확인**
- [x] **Step 3: 사용자가 로컬에서 한 번 더 실행해 결과 확인**
- [x] **Step 4: 커밋**

### Task 12-6: 신청 칸 (2026-10-30 추가, 설계 4절·7-2절)

- 서버: `EventIngestRecord.application`(100) 과 명령·요청·응답 DTO
- 크롤러: `EventFields.application`, AI 스키마, 검사(신청·접수·예약·등록 낱말, 날짜 근거), 본문 틀 「신청 | …」(참가비 아래), 보내는 값
- 웹: `CommunityEvent.application`, 표에 신청 줄(참가비 아래)

- [x] **Step 1: 서버 시험과 구현**
- [x] **Step 2: 크롤러 시험과 구현**
- [x] **Step 3: 웹 시험과 구현**
- [ ] **Step 4: 3000 화면 확인(사용자가 직접 보고, 로컬 실행으로 실제 값 확인)**
- [x] **Step 5: 커밋**

### Task 12-7: 쇼알라(반려동물 박람회) 출처 (2026-10-30 추가, 설계 6절)

- Create: `crawler/pet_events/parsers/showala.py`(`parse_list`: 첫 화면 메뉴 「취미|기호|반려동물」 아래 상세 링크. 메뉴 제목이 없으면 `reported_total=1`로 구조 변경 알림 / `parse_detail`: 칸 값을 「칸: 값」 줄로, 「상세정보」 글자, 배경 그림 포스터, 문의처 제외)
- Modify: `sources.json`(SHOWALA), `labelled.py`(전시기간·관람시간·개최장소(+세부장소)·입장료안내·주최, 전시장→지역), `extract.py` 지시문(파충류·관상어·조류 등 포함)
- Test: `tests/fixtures/showala_main.html`, `showala_detail.html`(구조만 옮기고 문장은 예시), `test_parsers.py`, `test_parsers_real.py`(원본 `probe/event-feed-fixtures/showala/`), `test_labelled.py`

- [ ] **Step 1: 시험** (실패 확인)
- [ ] **Step 2: 구현과 통과 확인**
- [ ] **Step 3: 마른 실행으로 실제 첫 화면과 상세를 읽는지 확인**
- [ ] **Step 4: 사용자 로컬 실행으로 AI 결과 확인**
- [ ] **Step 5: 커밋**

---

## 크롤러 (cuddle-market/crawler)

### Task 4: 공통 뼈대, 날짜 정리, 예의 지키는 요청기

**Files:**
- Create: `crawler/requirements.txt` (`requests`, `beautifulsoup4`, `google-genai`, `pytest`)
- Create: `crawler/pet_events/__init__.py`, `models.py`, `dates.py`, `http.py`
- Test: `crawler/tests/test_dates.py`, `crawler/tests/test_http.py`

**Interfaces:**
- Produces:
  - `models.ListItem(source_code: str, external_id: str, title: str, url: str, posted_on: date | None)`
  - `models.DetailPage(text: str, image_url: str | None)`
  - `models.EventFields(is_event: bool, title: str, start: date | None, end: date | None, region: str | None, place: str | None, organizer: str | None, target: str | None, fee: str | None, one_line: str | None, activities: list[str], checks: list[str])`
  - `dates.parse_range(text: str, ref: date) -> tuple[date | None, date | None]`
  - `http.PoliteClient(delay_sec: float = 1.0).get(url: str, params: dict | None = None) -> str`, robots가 막으면 `http.BlockedByRobots`

- [x] **Step 1: `test_dates.py`**
  - `"2026. 11. 6. ~ 11. 8."` → (2026-11-06, 2026-11-08)
  - `"2026.10.31"` → (2026-10-31, 2026-10-31)
  - `"10월 31일(토)"`, ref 2026-10-12 → (2026-10-31, 2026-10-31)
  - `"1월 10일"`, ref 2026-12-20 → (2027-01-10, 2027-01-10)
  - `"2026-10-30 ~ 2026-11-01"` → (2026-10-30, 2026-11-01)
  - 날짜 없는 글자 → (None, None)
- [x] **Step 2: `test_http.py`** — `robots.txt`가 `Disallow: /board`인 가짜 응답에서 `/board/1` 요청은 `BlockedByRobots`, 요청 머리글 User-Agent가 Global Constraints 값, 연속 요청 사이 1초 이상(시간 함수를 가짜로)
- [x] **Step 3: 실패 확인** — `cd crawler && python3 -m pytest -q` → import 오류
- [x] **Step 4: 구현** — `from __future__ import annotations`로 3.9에서도 돈다. 요청 시간 제한 20초.
- [x] **Step 5: 통과 확인** — 같은 명령 PASS
- [x] **Step 6: 커밋** (cuddle-market 작업 브랜치) — `feat(crawler): 날짜 정리와 robots.txt를 지키는 요청기를 더한다`

### Task 5: 출처 설정과 출처별 파서 4개

**Files:**
- Create: `crawler/sources.json`
- Create: `crawler/pet_events/parsers/__init__.py`(파서 이름 → 함수 등록), `mcst.py`, `seoul.py`, `gangnam.py`, `qbbs.py`
- Create: `crawler/tests/fixtures/` (실제 페이지 저장본: 목록과 상세 각 1개씩. 2026-10-30 조사 때 받은 원본이 `probe/event-feed-fixtures/`에 있다(git 무시 폴더). `mcst/list.html`, `sources-research/d13564.html`(문체부 상세), `gu/seoul_report.html`, `gu/seoul_d.html`, `gu/gn_s_B_000031.html`, `gu/gn_d.html`, `gu/nw_s_1027.html`, `gu/nw_s_1001.html`, `gu/nw_d.html`. 필요한 것만 fixtures로 복사하고, 없으면 Global Constraints의 접속 이름으로 한 번 받아 저장)
- Test: `crawler/tests/test_parsers.py`

**Interfaces:**
- Consumes: `ListItem`, `DetailPage`
- Produces:
  - `sources.json`: 출처마다 `{"code","name","parser","list_url","params","detail_url","default_region","enabled"}`. `default_region`은 서울시, 강남구, 노원구가 `"서울"`, 문체부는 `null`. 코드: `MCST`, `SEOUL`, `GANGNAM`, `NOWON_PRESS`, `NOWON_NOTICE`. 주소와 검색 인자는 설계 6절 표 그대로.
  - 각 파서 모듈: `parse_list(html: str, source: dict) -> ListResult(items: list[ListItem], reported_total: int | None)`, `parse_detail(html: str, source: dict) -> DetailPage`
  - `qbbs.py`는 노원구용이지만 `q_bbsCode`, `q_bbscttSn` 계열 게시판 공통으로 쓴다.

- [x] **Step 1: `test_parsers.py`** — 저장본마다
  - 목록: 항목이 1개 이상, 저장본에 보이는 제목 하나가 들어 있음(예: 문체부 "제주 반려동물 문화산업 한마당", 노원 "[2026년 노원 반려동물 문화축제]"), 상세 주소가 설계 6절 모양
  - 서울시: `fnTbbsView('468820')`에서 번호를 뽑아 `nttNo=468820` 주소를 만든다
  - `reported_total`: 페이지의 "총 N건"을 읽는다
  - 상세: 본문 글자가 비어 있지 않고, 이미지가 있으면 절대 주소
  - 빈 HTML(`"<html></html>"`)이면 `items=[]`, `reported_total=None`
- [x] **Step 2: 실패 확인** — `python3 -m pytest tests/test_parsers.py -q`
- [x] **Step 3: 구현** — BeautifulSoup. 상세 본문은 스크립트와 메뉴를 빼고 본문 영역만.
- [x] **Step 4: 통과 확인**
- [x] **Step 5: 커밋** — `feat(crawler): 출처 설정과 구조가 다른 게시판 파서 4개를 더한다`

### Task 6: 관광공사 축제 API

**Files:**
- Create: `crawler/pet_events/tourapi.py`
- Test: `crawler/tests/test_tourapi.py`, `crawler/tests/fixtures/tourapi_festival.json`

**Interfaces:**
- Produces: `fetch_festivals(service_key: str, today: date, client) -> list[TourItem]`, `TourItem(external_id, title, start, end, region, place, image_url, url)` (`region`은 `addr1` 첫 낱말을 설계 7-2절의 짧은 시·도 이름으로), `PET_WORDS = ("반려", "펫", "댕", "냥", "입양", "강아지", "고양이")`
- 요청: `https://apis.data.go.kr/B551011/KorService2/searchFestival2`, 인자 `serviceKey, MobileOS=ETC, MobileApp=CuddleMarket, _type=json, eventStartDate=오늘(YYYYMMDD), numOfRows=100, pageNo`. 응답 칸: `contentid, title, eventstartdate, eventenddate, addr1, firstimage`. 원문 주소는 `https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid={contentid}` 형식(만들면서 실제로 열리는지 확인).

- [x] **Step 1: 시험** — 고정 응답에서 제목에 PET_WORDS가 있는 것만 남고, 날짜가 date로 바뀌고, `firstimage`가 비면 `image_url=None`. 응답 `resultCode`가 정상 아니면 예외.
- [x] **Step 2~4: 실패 확인, 구현, 통과 확인**
- [x] **Step 5: 키가 생기면 실제로 한 번 호출해 고정 응답 모양이 맞는지 확인** — 2026-10-30 사용자가 로컬에서 실제 키로 두 번 실행: `searchFestival2`, `detailCommon2` 응답 모양 맞음(포천펫스타). **남은 것: 원문 주소 `ms_detail.do?cotid=`가 「서비스 지연 안내」로 열려 맞는 주소인지 못 가림 → Task 13 전에 다시 본다.** 원래 적혀 있던 내용: (`PUBLIC_DATA_SERVICE_KEY`가 로컬에 없으면 Actions의 손 실행으로 확인) — 2026-10-30 로컬에 키가 없어 Task 13 손 실행으로 미뤘다. 원문 주소(`ms_detail.do?cotid=`)가 실제로 열리는지도 그때 본다
- [x] **Step 6: 커밋** — `feat(crawler): 관광공사 축제 API로 반려동물 축제를 보완한다`

### Task 7: Gemini 추출과 틀 채우기

**Files:**
- Create: `crawler/pet_events/extract.py`, `crawler/pet_events/render.py`
- Test: `crawler/tests/test_extract.py`, `crawler/tests/test_render.py`

**Interfaces:**
- Consumes: `EventFields`, `dates.parse_range`
- Produces:
  - `extract.extract_event(text: str, title: str, posted_on: date | None, client) -> EventFields | None` (모델 `gemini-3.1-flash-lite`, 응답은 JSON 스키마로 강제. 실패나 형식 오류면 None)
  - `extract.guard_against_invented(fields: EventFields, text: str) -> EventFields`
  - `render.render_post(fields: EventFields, source_name: str, source_url: str, image_url: str | None = None) -> tuple[str, str]` (제목, 본문)

- [x] **Step 1: `test_render.py`**
  - 포스터 주소가 있으면 본문 첫 줄이 `![포스터](주소)`, 없으면 그 줄이 없다
  - AI 칸이 모두 있으면 설계 4절 순서와 칸 이름 그대로(한 줄 소개, 기간, 장소, 주최, 대상, 참가비, "이런 걸 할 수 있어요", "가기 전에 확인하세요", 끝 문구 두 줄, "원문 보기: …", "출처: …")
  - `fee=None`이면 "참가비 | 공식 안내 확인"
  - AI 칸(one_line, activities, checks)이 비면 그 줄과 제목 줄이 빠지고 나머지 모양은 같다
  - 제목 60자 입력 → 50자 이하, 본문은 어떤 입력에도 1,000자 이하(넘으면 activities, checks, one_line 순으로 줄인다)
  - 장소 줄은 `장소 | {지역} {장소}`(예: `장소 | 서울 문화비축기지`). 둘 다 없으면 `장소 | 공식 안내 확인`
  - 끝 줄은 `[원문 보기]({원문 주소})`와 `출처: {출처 이름}`
  - 기간은 시작과 끝이 같으면 `2026.10.31 (토)`, 다르면 `2026.11.06 (금) ~ 2026.11.08 (일)`
- [x] **Step 2: `test_extract.py`** (가짜 client)
  - 정상 JSON → EventFields
  - 깨진 JSON이나 예외 → None
  - `guard_against_invented`: 본문에 "11월 6일"이 없는데 start가 11-06이면 start, end를 None으로. 본문에 "무료"나 "원"이 없는데 fee가 있으면 fee를 None으로.
- [x] **Step 3~4: 실패 확인, 구현** — 지시문에 "본문에 있는 사실만, 없으면 null, 행사(축제, 행사, 교육, 놀이터 운영, 입양 행사)가 아니면 is_event=false"를 넣는다.
- [x] **Step 5: 통과 확인**
- [x] **Step 6: 커밋** — `feat(crawler): Gemini로 행사 칸을 뽑고 정해진 틀로 글을 만든다`

### Task 8: 실행 흐름, Cuddle 서버 연결, 디스코드 알림

**Files:**
- Create: `crawler/pet_events/cuddle_client.py`, `crawler/pet_events/report.py`, `crawler/run.py`
- Test: `crawler/tests/test_run.py`

**Interfaces:**
- Consumes: 앞 Task의 모든 것, Task 3의 두 주소
- Produces:
  - `CuddleClient(base_url: str, ingest_key: str).unseen(source_code, ids) -> list[str]`, `.ingest(payload: dict) -> dict`
  - `run.run_once(today: date, sources: list[dict], deps) -> RunSummary(per_source: dict[str, SourceStat], errors: list[str])`
  - 실행: `python3 -m run` (환경 변수 `CUDDLE_API_BASE`, `INGEST_API_KEY`, `GEMINI_API_KEY`, `PUBLIC_DATA_SERVICE_KEY`, `DISCORD_WEBHOOK_URL`). `--dry-run`이면 서버에 보내지 않고 만든 글을 출력만.

- [x] **Step 1: `test_run.py`** (가짜 요청기, 가짜 AI, 가짜 서버)
  - 90일보다 오래된 목록 항목은 상세를 읽지 않는다
  - 서버가 이미 본 번호는 상세를 읽지 않는다
  - 본문 50자 미만 → `SKIPPED_NO_TEXT` 기록, AI 호출 없음
  - AI가 is_event=false → `SKIPPED_NOT_EVENT`
  - 끝난 행사 → `SKIPPED_ENDED`, 날짜 없음 → `SKIPPED_NO_DATE`
  - 정상 → `POSTED`, payload에 title, content, imageUrl, eventStartDate, eventEndDate, region, place, organizer, summary(=one_line)
  - 지역은 설계 7-2절 순서로 정한다(관광공사 주소 → 문체부 장소 칸 → AI 값 → `sources.json`의 `default_region`). 주최가 없으면 출처 이름
  - 한 출처가 robots 차단이나 오류여도 다른 출처는 계속하고 `errors`에 남는다
  - `reported_total > 0`인데 items가 0이면 `errors`에 "구조 변경 의심: {출처}"
- [x] **Step 2~4: 실패 확인, 구현, 통과 확인** — 알림은 `errors`가 있거나 새 글이 1개 이상일 때만 디스코드로 한 번 보낸다.
- [x] **Step 5: 로컬 마른 실행** — `GEMINI_API_KEY` 없이 `python3 -m run --dry-run` → 출처별 목록 건수가 찍히고 서버 요청은 없다
- [x] **Step 6: 커밋** — `feat(crawler): 수집 흐름과 서버 연결, 실패 알림을 묶는다`

### Task 9: GitHub Actions 예약 실행

**Files:**
- Create: `.github/workflows/event-crawler.yml`

- [x] **Step 1: 작성** — `schedule: cron "0 0 * * *"`(매일 09:00 KST), `workflow_dispatch`(입력 `dry_run` 참/거짓). Python 3.12, `pip install -r crawler/requirements.txt`, `pytest crawler/tests -q`, 그다음 `python -m run`. 환경 변수는 Global Constraints의 Secrets와 `CUDDLE_API_BASE=https://cmarket-api.duckdns.org/api`.
- [x] **Step 2: 확인** — `actionlint`가 있으면 통과, 없으면 YAML 문법 검사(`python3 -c "import yaml…"`)
- [x] **Step 3: 커밋** — `ci: 행사 수집을 매일 아침 돌리는 워크플로를 더한다`

---

## 웹 (cuddle-market/src)

### Task 10: 행사 소식 탭, 글쓰기 선택지 분리, 행사 화면 (설계 7-2절)

**Files:**
- Modify: `src/constants/constants.ts:150-155`
- Modify: `src/features/community/components/CommunityPostForm.tsx` (9, 60, 241행)
- Modify: `src/features/community/CommunityPage.tsx` (45-46행, 목록 불러오기 125-175행에 EVENT 하나 더)
- Modify: `src/app/(main)/community/page.tsx:40-51`, `src/lib/api/server/community.ts`(EVENT 첫 목록 함수)
- Modify: `src/lib/utils/getBoardType.ts`, `src/features/community/CommunityDetail.tsx:134`, `src/app/(main)/community/[id]/[name]/page.tsx:82`, `src/features/admin/configs/communityTableConfig.ts:25-26`, `src/app/sitemap.xml/route.ts:21-22`
- Modify: `src/graphql/schema.ts`, `src/graphql/resolvers.ts`(`CommunityPost`, `CommunityPostDetail`에 `event: CommunityEvent`), `src/types/community.ts`
- Create: `src/lib/utils/eventStatus.ts`(`getEventStatus(start, end, today) -> { kind: 'upcoming' | 'ongoing' | 'ended', label: string }`), `src/features/community/components/EventStatusChip.tsx`, `src/features/community/components/EventPostCard.tsx`
- Test: `src/lib/utils/getBoardType.test.ts`, `src/constants/communityTabs.test.ts`, `src/lib/utils/eventStatus.test.ts`, `src/features/community/components/EventPostCard.test.tsx`

**Interfaces:**
- Produces: `COMMUNITY_TABS`에 `{ id: 'tab-event', label: '행사 소식', code: 'EVENT' }`, 새 상수 `COMMUNITY_WRITE_BOARDS`(QUESTION, INFO만), `fetchInitialEventCommunity(page, size, searchType, keyword, sortBy)`

- [x] **Step 1: 시험** — `getBoardType('EVENT') === '행사 소식'`, `COMMUNITY_WRITE_BOARDS`에 EVENT가 없음, `COMMUNITY_TABS`의 id 세 개
  - `getEventStatus`: 시작 전 `D-n`(내일이면 D-1), 시작일~종료일 `진행 중`(종료일 없으면 시작일 하루), 지난 뒤 `종료`. 오늘은 한국 날짜로 계산
  - `EventPostCard`: 상태 칩, 제목, 한 줄 소개(없으면 줄째 없음), 기간, 「지역 · 주최」(지역 없으면 주최만). 닉네임, 조회수, 포스터를 그리지 않는다. 종료면 흐린 모양 클래스
- [x] **Step 2: 실패 확인** — `npx vitest run --project unit src/lib/utils/getBoardType.test.ts src/constants/communityTabs.test.ts`
- [x] **Step 3: 구현** — 글쓰기 화면은 `COMMUNITY_WRITE_BOARDS`만 쓴다. `?tab=tab-event`로 들어오면 글쓰기 기본값은 INFO. 상세의 `articleSection`은 EVENT면 '행사'.
  - 목록: 행사 소식 탭은 `EventPostCard`로 그린다. 정렬에서 댓글순을 빼고, 글쓰기 단추 두 곳을 숨기고, 빈 화면 문구를 설계 7-2절대로.
  - 상세: EVENT면 배지 옆에 상태 칩, 프로필 사진과 닉네임 대신 「YYYY.MM.DD 등록」, 「목록으로 돌아가기」는 `?tab=tab-event`.
- [x] **Step 4: 확인** — 시험 PASS, `npx tsc --noEmit`, 바뀐 파일 eslint(`CLAUDE.md` 47행 명령)
- [x] **Step 5: 커밋** — `feat: 커뮤니티에 행사 소식 탭을 더하고 글쓰기 선택지에서는 뺀다`

### Task 11: 외부 이미지 주소는 그대로 쓰기

**Files:**
- Modify: `src/lib/utils/imageUrl.ts`
- Modify: 상세와 썸네일에서 이미지 실패 처리(`src/features/community/components/CommunityPostThumbnail.tsx`, 상세 이미지 표시 부분)
- Test: `src/lib/utils/imageUrl.test.ts`

**Interfaces:**
- Produces: `isOwnImageUrl(url: string) -> boolean` (호스트가 `df1xl13ui5mlo.cloudfront.net`이면 true). 외부 주소면 `toResizedWebpUrl`는 원래 주소, `getImageSrcSet`는 `''`.

- [x] **Step 1: 시험** — 우리 주소는 기존대로 `_150.webp`, 외부 주소(`https://www.nowon.kr/math/attach/x.png`)는 그대로, 외부 주소의 srcset은 빈 문자열, 잘못된 주소 문자열은 그대로
- [x] **Step 2~4: 실패 확인, 구현, 통과 확인** — 이미지 `onError`에서 기본 이미지(`PLACEHOLDER_IMAGES`)로 바꾼다. `next/image`를 쓰는 곳이 있으면 `next.config.ts`의 `remotePatterns` 때문에 막히는지 확인하고, 행사 글 이미지는 `<img>`로 그린다.
- [x] **Step 5: 커밋** — `feat: 우리 이미지 서버가 아닌 주소는 크기 변환 없이 그대로 보여 준다`

### Task 12: 헤더 이름과 메타 설명

**Files:**
- Modify: `src/components/header/Header.tsx:158`, 같은 파일의 "펫지도"
- Modify: `src/app/(main)/community/page.tsx:9,15,24`

- [x] **Step 1: 고치기** — Global Constraints의 문구 그대로. 이 문구를 단언하는 기존 시험이 있으면(`grep -rn "질문·정보\|펫지도" src`) 함께 고친다.
- [x] **Step 2: 확인** — `npm test`, `npx tsc --noEmit`
- [x] **Step 3: 커밋** — `fix: 헤더 메뉴 이름을 하단 메뉴와 같은 커뮤니티, 플레이스로 맞춘다`

---

### Task 13: 배포와 끝까지 확인 (사용자와 함께)

- [ ] **Step 0:** 운영 DB 백업 → `SHOW COLUMNS FROM posts LIKE 'board_type'` → `enum(...)`이면 cmarket_api의 `scripts/alter-board-type-column.sql` 실행(사용자가 직접. 설계 7절)
- [ ] **Step 1:** cmarket_api 커밋 push (사용자 허락). 사용자가 `openssl rand -hex 32`로 키를 만들어 GitHub Secrets `INGEST_API_KEY`에 넣고, EC2 실행 명령에 `-Dingest.api-key=… -Dingest.author-user-id=52`를 더해 재배포
- [ ] **Step 2:** `curl -X POST …/api/ingest/events/unseen` 키 없이 401, 키 있으면 200 확인
- [ ] **Step 3:** cuddle-market 브랜치 push, develop으로 PR (사용자 허락). 머지는 사용자
- [ ] **Step 4:** Actions에서 `event-crawler`를 `dry_run=true`로 손 실행 → 출처별 건수 확인 → `dry_run=false`로 한 번 더
- [ ] **Step 5:** 웹 "행사 소식" 탭에서 글이 틀대로 보이는지, 포스터가 보이거나 기본 이미지로 바뀌는지 화면 확인. 글쓰기 화면에 행사 소식이 없는지 확인
