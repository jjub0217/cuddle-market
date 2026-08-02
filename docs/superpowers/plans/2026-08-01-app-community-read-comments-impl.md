# 앱 커뮤니티 읽기 + 댓글 구현 계획 (#812)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에 커뮤니티 탭을 만들어 글을 읽고 댓글·답글을 달 수 있게 하고, 웹 모바일의 댓글 화면을 같은 모양으로 맞춘다.

**Architecture:** 웹을 먼저 끝내고 커밋한 뒤 앱으로 넘어간다. 웹·앱이 함께 쓰는 것(멘션 떼기, 신고 사유)은 `@cuddle/shared`에 두고 shared의 vitest로 덮는다. 앱은 `mobile/lib/community.ts` 한 곳에서 서버를 부르고, 화면은 그것만 쓴다.

**Tech Stack:** Expo SDK 54 · React Native 0.81.5 · React 19.1.0 · expo-router · TanStack Query v5 · react-native-marked · Next.js(웹) · Tailwind v4 · vitest(shared) · Jest(앱)

## Global Constraints

- 앱은 **Expo SDK 54 · RN 0.81.5 · React 19.1.0**에 고정이다. `@latest`로 올리지 않는다 (사용자 Expo Go가 54).
- 모든 게이트 명령은 **저장소 루트에서** 친다. `cd mobile` 뒤 루트 명령은 실패한다.
- **웹 `lint`는 이제 게이트다** (#788에서 오류 10건을 다 없앴다). `pnpm gate`가 `tsc → lint → vitest → build` 순으로 돈다. 오류가 하나라도 생기면 막힌다.
- 웹 경고는 **36건에서 더 못 늘게 잠겨 있다**(`lint:strict --max-warnings 36`). 새 파일에서 경고가 하나 나면 게이트가 막히므로, 안 쓰는 import 같은 것을 남기지 않는다.
- 웹 Tailwind v4에서 `max-w-3xl` 같은 티셔츠 크기는 48px로 풀린다. 쓰지 않는다.
- 서버 응답 필드는 **DTO 실물 기준**이다. 추측해서 쓰지 않는다.
- `commentCount`는 **부모 댓글 + 답글 합계**다.
- 답글은 서버가 **깊이 구분 없이 한 목록으로 평평하게** 준다.
- 댓글 신고 API·좋아요 API는 **없다**. ⋮ 는 내 것=삭제 / 남의 것=작성자 신고.
- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- 팬(병렬 에이전트)에게 git 명령을 주지 않는다 — `.git/index.lock`에서 부딪힌다. 커밋은 리드가 한다.
- 게이트 명령은 저장소 루트에서 친다 (#813에서 넣었다, 머지됨).
  ```bash
  pnpm gate:shared    # packages/shared — vitest
  pnpm gate:mobile    # 앱 — tsc + expo lint + jest
  pnpm gate           # 웹 — tsc + lint + vitest(unit) + build
  pnpm gate:all       # 셋 다
  ```

## 실제 값을 확인한 것 (추측 금지)

계획을 쓰면서 파일을 열어 확인한 값이다. 이대로 쓴다.

```
색 (src/styles/tokens.colors.css)
  --color-surface-container-low   #f6f3f2    답글 상자 배경
  --color-primary-container       #825500    멘션·「답글 달기」 글자
  --color-primary-200             #ecc88e    「내 댓글」 표 배경 (글자는 흰색)

ConfirmDialog (mobile/components/ui/confirm-dialog.tsx)
  { visible, heading, description?, notes?, confirmLabel, tone?, onClose, onConfirm }
  ⚠️ title이 아니라 heading · onCancel이 아니라 onClose · cancelLabel은 없다
  ⚠️ onConfirm은 () => Promise<void>다. 던지면 창이 안 닫힌다

SheetAction (mobile/components/my/product-action-sheet.tsx)
  { label, tone?: 'default' | 'danger', onPress }

AppHeader (mobile/components/ui/app-header.tsx)
  { left: ReactNode | string }   문자열이면 제목으로 그린다

EmptyState (mobile/components/list-states.tsx)
  { title?, description? }   둘 다 선택. 안 넘기면 홈 문구가 나온다

웹 CommentForm
  { id, placeholder, legendText, value, onChangeValue, onSubmit, textareaRef?, variant? }
  값을 부모가 들고 있다 (react-hook-form)

웹 CommentList
  { comments, postId }

웹 댓글 조회
  api.get(`/community/posts/${id}/comments`, { params: { page: 0, size: 100 } })
  ← 서버가 페이지를 안 나눠 주므로 웹은 100을 달라고 한다
```

---

## 스펙과 달라지는 것 하나

스펙 §4-1은 댓글 화면을 `(tabs)/(community)/posts/[id]/comments`에 두고 **탭바를 숨긴다**고 했다.
계획에서는 **루트 스택 `app/post-comments.tsx`** 로 바꾼다.

```
왜   9바퀴 신고 화면이 이미 같은 판단을 했다 (app/report.tsx 주석):
       "루트 스택에 둔다 — 탭바까지 덮어야 한다"
     루트에 두면 탭바를 숨겼다 되돌리는 장치가 아예 필요 없다.
     화면이 뜨는 모양(탭바 안 보임 · 하단 전체가 입력창)은 합의한 그대로다.
```

## 계획서를 쓴 뒤에 바뀐 것 (2026-08-02 검토)

계획서를 쓴 날과 착수하는 날 사이에 이슈 여섯이 머지됐다. **전제가 바뀌었으니 그대로 따르지 말 것.**

| 머지된 것 | 계획에 미치는 영향 |
|---|---|
| `#799` 웹 테스트 러너 (vitest + RTL) | **웹 과제(Task 2~5)에도 시험을 쓴다.** 계획서를 쓸 때는 웹에 러너가 없어 「눈으로 확인」만 적혀 있었다 |
| `#813` 게이트 스크립트 | `pnpm gate:*`를 그냥 쓰면 된다 (대체 명령 안내는 지웠다) |
| `#788` lint 게이트 승격 | **웹 경고가 36건에서 못 늘어난다.** 안 쓰는 import 하나가 게이트를 막는다 |
| `#793` `BottomSheet` 신설 | 웹 모바일에서 「아래에서 올라오는 시트」가 필요하면 새로 만들지 말고 이걸 쓴다 |
| `#808` `reportErrors.ts` 신설 | 웹에서 「이미 신고했다」를 가려낼 때 `isAlreadyReported(error)`(409 기준)를 쓴다. 게시글 신고에도 그대로 |
| `#809` 백엔드 차단 필터 | 상품 목록은 이미 걸러진다. Task 0은 **커뮤니티 글과 상품 상세**만 하면 된다 |

**바로 쓸 수 있게 된 도구**

```
src/test/render.tsx        QueryClient 감싸개. 웹 조각 시험은 여기서 render를 가져온다
vitest.setup.ts            <dialog>.showModal() 흉내 · matchMedia · ResizeObserver가 이미 들어 있다
src/lib/api/reportErrors.ts  isAlreadyReported(error) — 409를 본다
src/components/commons/BottomSheet.tsx  BottomSheet · BottomSheetItem
```

**웹 시험을 쓸 때 걸렸던 것 (그대로 밟지 말 것)**

```
next/link            시험에서 <a href="/products/1">을 쓰면 @next/next/no-html-link-for-pages가
                     오류로 잡혀 게이트가 막힌다. next/link를 쓴다
portal + 이벤트       createPortal은 DOM에서만 body로 나간다. React 이벤트는 React 트리를 따라
                     올라간다 — 바깥 <Link> 안에서 열리는 조각은 눌림을 멈춰야 한다
키 이벤트            그렇다고 onKeyDown까지 막으면 ESC가 document에 못 닿아 안 닫힌다
```

---

## File Structure

### 공통 (`packages/shared`)

| 파일 | 책임 |
|---|---|
| `src/lib/mention.ts` | 답글 본문 맨 앞의 `@닉네임`을 떼어낸다. 웹·앱이 같이 쓴다 |
| `src/lib/mention.test.ts` | 위의 시험 (vitest) |
| `src/constants/report.ts` | `COMMUNITY_REPORT_REASON` 추가 (기존 파일 수정) |
| `src/index.ts` | 둘 다 내보내기 (기존 파일 수정) |

### 웹 (`src/`)

| 파일 | 책임 |
|---|---|
| `types/community.ts` | 타입을 서버 DTO와 맞춘다 (수정) |
| `features/community/components/CommentItem.tsx` | 멘션을 shared에서 가져다 쓴다 · 스타일 통일 (수정) |
| `features/community/components/CommentList.tsx` | 답글을 처음부터 펼친다 · 오버레이 분기 제거 (수정) |
| `features/community/components/ReplyOverlay.tsx` | **삭제** |
| `features/community/components/CommentSection.tsx` | 댓글 목록 + 입력 폼 + 등록 처리를 한 덩어리로 (신설). 상세(데스크톱)와 댓글 페이지(모바일)가 같이 쓴다 |
| `features/community/CommunityDetail.tsx` | 모바일은 「댓글 N ›」 줄만, 데스크톱은 `CommentSection` (수정) |
| `app/(main)/community/[id]/[name]/comments/page.tsx` | 모바일 전용 댓글 페이지 (신설) |
| `features/community/CommunityComments.tsx` | 그 페이지의 알맹이 — 헤더 + `CommentSection` (신설) |

### 앱 (`mobile/`)

| 파일 | 책임 |
|---|---|
| `lib/community.ts` | 커뮤니티 서버 호출 + 타입 (신설) |
| `lib/community.test.ts` | 위의 시험 (Jest, 신설) |
| `app/(tabs)/(community)/_layout.tsx` | 커뮤니티 스택 (신설) |
| `app/(tabs)/(community)/index.tsx` | 목록 (신설) |
| `app/(tabs)/(community)/posts/[id].tsx` | 상세 (신설) |
| `app/(tabs)/(community)/users/[id].tsx` | 작성자 프로필 재수출 (신설) |
| `app/post-comments.tsx` | 댓글 화면 — 루트 스택 (신설) |
| `components/community/post-card.tsx` | 목록 한 줄 (신설) |
| `components/community/post-body.tsx` | 마크다운 본문 (신설) |
| `components/community/comment-row.tsx` | 댓글·답글 한 줄 (신설) |
| `components/community/comment-input.tsx` | 하단 입력창 + 답글 띠 (신설) |
| `app/(tabs)/_layout.tsx` | 커뮤니티 탭 추가 (수정) |
| `lib/notifications.ts` | POST 갈래를 앱 화면으로 (수정) |

---

# Task 0: 백엔드 — 차단이 커뮤니티 글과 상품 상세에도 먹게

**저장소가 다르다.** `~/Desktop/cmarket_api` (main에 직접 커밋)

**Files:**
- Modify: `service/cmarket-domain/.../community/repository/PostRepositoryCustom.java`
- Modify: `service/cmarket-domain/.../community/repository/PostRepositoryCustomImpl.java`
- Modify: `service/cmarket-domain/.../community/app/service/CommunityService.java`
- Modify: `service/cmarket-domain/.../community/app/service/CommunityServiceImpl.java`
- Modify: `service/cmarket/.../web/community/controller/CommunityController.java`
- Modify: `service/cmarket-domain/.../product/app/service/ProductServiceImpl.java`

**Interfaces:**
- Consumes: `UserBlockRepository.findBlockedUserIdsByBlockerId(Long)` (2026-08-02 #809에서 추가함)
- Produces: 커뮤니티 목록이 차단한 작성자의 글을 안 준다 · 차단한 판매자의 상품 상세가 막힌다

**왜 이 바퀴에 넣나**

차단 안내가 약속한 것 중 둘이 아직 거짓이다.

```
✅ 차단한 사용자의 상품은 목록에 보이지 않습니다   #809에서 참이 됐다
❌ 게시글이 숨김 처리됩니다                       커뮤니티 조회가 차단을 안 본다
❌ 상품을 볼 수 없습니다                          목록에서 빠질 뿐, 주소를 직접 열면 상세가 보인다
```

10바퀴에서 앱에 커뮤니티가 생기므로, 차단한 사람의 글이 그대로 보이면 바로 눈에 띈다. 지금 같이 고친다.

> **프로필은 안 막는다.** 차단한 사람 프로필에 「차단 해제」가 있다(9바퀴). 못 열게 하면 해제 경로가 마이 ▸ 차단 목록 하나만 남는다. 그래서 문구에서 프로필을 뺀다.

- [ ] **Step 1: 컴파일이 되는 상태인지 먼저 확인한다**

이 맥에는 Java 11만 있다. 저장소의 `Dockerfile`이 쓰는 Java 21 이미지로 컨테이너에서 빌드한다 — 맥에는 아무것도 안 깐다.

```bash
cd ~/Desktop/cmarket_api
docker run --rm -v "$PWD":/app -w /app -v cmarket-gradle-cache:/root/.gradle \
  eclipse-temurin:21.0.9_10-jdk-jammy ./gradlew compileJava --console=plain
```

Expected: `BUILD SUCCESSFUL`

> 도커 데몬이 꺼져 있으면 `open -a Docker`로 켠다. 처음 한 번은 이미지·Gradle을 받느라 몇 분 걸린다.

- [ ] **Step 2: 글 목록 쿼리가 작성자를 걸러내게 한다**

`PostRepositoryCustom.java`

```java
    Page<Post> findPosts(String sortBy, String sortOrder, BoardType boardType, String searchType, String keyword,
                         java.util.List<Long> excludedAuthorIds, Pageable pageable);
```

`PostRepositoryCustomImpl.java` — 시그니처를 같게 바꾸고, 기본 조건 아래에 더한다.

```java
    public Page<Post> findPosts(String sortBy, String sortOrder, BoardType boardType, String searchType, String keyword,
                                java.util.List<Long> excludedAuthorIds, Pageable pageable) {
        // 기본 조건: 소프트 삭제되지 않은 게시글만
        BooleanExpression whereCondition = post.deletedAt.isNull();

        // 차단한 사용자의 글 제외
        //
        // 차단 안내가 「게시글이 숨김 처리됩니다」라고 약속한다. 상품은 #809에서
        // 걸러지게 했고, 글은 여기서 한다.
        //
        // 화면에 다 받아 온 뒤 걸러내면 안 된다 — 한 페이지에 10개를 달라고 했는데
        // 8개만 남는 식이 되어 페이지 수와 무한스크롤이 어긋난다. 쿼리에서 뺀다.
        if (excludedAuthorIds != null && !excludedAuthorIds.isEmpty()) {
            whereCondition = whereCondition.and(post.authorId.notIn(excludedAuthorIds));
        }
```

> `post.authorId`는 `Post` 엔티티의 필드다. `CommunityServiceImpl`이 `post.getAuthorId()`를 쓰는 것으로 확인했다.

- [ ] **Step 3: 서비스가 차단 목록을 넘기게 한다**

`CommunityService.java` — `getPostList`에 `email`을 더한다.

```java
    PostListDto getPostList(String sortBy, BoardType boardType, String searchType, String keyword,
                            Integer page, Integer size, String email);
```

`CommunityServiceImpl.java`

```java
    public PostListDto getPostList(String sortBy, BoardType boardType, String searchType, String keyword,
                                   Integer page, Integer size, String email) {
        …

        // 내가 차단한 사람의 글은 목록에서 뺀다.
        // 비회원이면 차단이 있을 수 없으므로 빈 목록이다.
        final Long viewerId = email != null
                ? userRepository.findByEmailAndDeletedAtIsNull(email).map(User::getId).orElse(null)
                : null;
        final java.util.List<Long> blockedAuthorIds = viewerId != null
                ? userBlockRepository.findBlockedUserIdsByBlockerId(viewerId)
                : java.util.List.of();

        Page<Post> postPage = postRepository.findPosts(
                sortBy, sortOrder, boardType, searchType, keyword, blockedAuthorIds, pageable);
```

`UserBlockRepository`를 생성자에 더한다 (`SearchServiceImpl`이 같은 방식으로 받는다 — 그걸 그대로 따른다).

- [ ] **Step 4: 컨트롤러가 로그인 사용자를 넘기게 한다**

`CommunityController.java`의 `getPostList`

```java
    @GetMapping("/posts")
    public ResponseEntity<SuccessResponse<PostListResponse>> getPostList(
            …기존 파라미터 그대로…
    ) {
        // 비회원도 볼 수 있는 주소다. 로그인 안 했으면 null이 온다.
        String email = SecurityUtils.getCurrentUserEmailOrNull();

        PostListDto postListDto = communityService.getPostList(
                sortBy, boardType, searchType, keyword, page, size, email);
```

> ⚠️ **`SecurityUtils`에 「없으면 null」을 주는 메서드가 있는지 먼저 확인한다.**
> `grep -n "public static" service/cmarket/src/main/java/org/cmarket/cmarket/web/common/util/SecurityUtils.java`
> `getCurrentUserEmail()`이 로그인 안 했을 때 던진다면 그대로 쓰면 안 된다.
> 없으면 `SearchController`가 비회원을 어떻게 다루는지 보고 같은 방식을 쓴다 — 그쪽도 `/api/products/search`가 비회원 허용이다.

- [ ] **Step 5: 상품 상세를 차단한 판매자면 막는다**

`ProductServiceImpl.java`의 `getProductDetail(Long productId, String email)` — email을 이미 받는다.

```java
        // 판매자 정보 조회
        User seller = userRepository.findById(product.getSellerId())
                .orElseThrow(() -> new UserNotFoundException("판매자를 찾을 수 없습니다."));

        // 차단한 판매자의 상품은 상세도 못 본다.
        //
        // 목록에서 빼는 것만으로는 부족하다 — 주소를 직접 열거나, 차단 전에 눌러 둔
        // 링크로 들어오면 그대로 보였다. 차단 안내가 「상품을 볼 수 없습니다」라고
        // 약속하므로 여기서도 막는다.
        if (email != null) {
            Long viewerId = userRepository.findByEmailAndDeletedAtIsNull(email)
                    .map(User::getId).orElse(null);
            if (viewerId != null
                    && userBlockRepository.existsByBlockerIdAndBlockedUserId(viewerId, seller.getId())) {
                throw new ProductNotFoundException("차단한 사용자의 상품입니다.");
            }
        }
```

> `existsByBlockerIdAndBlockedUserId`는 `UserBlockRepository`에 이미 있다.
> `ProductNotFoundException`을 쓰는 이유: 새 예외를 만들면 핸들러·에러코드까지 늘어난다. 화면에는 「상품을 찾을 수 없습니다」와 같은 자리에 뜨면 된다.
> `UserBlockRepository`를 `ProductServiceImpl` 생성자에 더한다.

- [ ] **Step 6: 컴파일해서 다른 호출부가 없는지 본다**

```bash
cd ~/Desktop/cmarket_api
docker run --rm -v "$PWD":/app -w /app -v cmarket-gradle-cache:/root/.gradle \
  eclipse-temurin:21.0.9_10-jdk-jammy ./gradlew compileJava --console=plain
```

⚠️ **여기서 실패하면 그게 소득이다.** #809에서 `searchProducts`를 고쳤을 때 `AdminProductQueryService`가 같은 쿼리를 쓰고 있는 것을 컴파일러가 찾아 줬다. `findPosts`·`getPostList`도 다른 데서 부를 수 있다. 나온 곳을 다 고친다.

- [ ] **Step 7: 테스트**

```bash
docker run --rm -v "$PWD":/app -w /app -v cmarket-gradle-cache:/root/.gradle \
  eclipse-temurin:21.0.9_10-jdk-jammy ./gradlew test --console=plain
```

Expected: `BUILD SUCCESSFUL` — 스프링 컨텍스트가 뜬다는 뜻이고, 새로 넣은 의존성 주입까지 확인된다.

- [ ] **Step 8: 커밋**

```bash
cd ~/Desktop/cmarket_api
git add -A
git commit -m "차단이 커뮤니티 글과 상품 상세에도 먹게

차단 안내가 약속한 것 중 둘이 거짓이었다.
  게시글이 숨김 처리됩니다   커뮤니티 조회가 차단을 안 봤다
  상품을 볼 수 없습니다      목록에서 빠질 뿐 주소를 직접 열면 상세가 보였다

글 목록은 쿼리에서 작성자를 뺀다(화면에서 걸러내면 페이지 수가 어긋난다).
상품 상세는 차단한 판매자면 못 찾은 것으로 다룬다.

프로필은 안 막는다 — 거기 「차단 해제」가 있어서 못 열면 해제 경로가 줄어든다.

Java 21 컨테이너에서 compileJava·test 통과를 확인했다."
```

> 푸시는 사용자에게 확인받고 한다. 배포해야 효과가 난다.

- [ ] **Step 9: 배포 후 실물 확인 (사용자)**

```
□ A를 차단한 상태로 커뮤니티 목록에 A의 글이 안 보인다
□ 차단을 풀면 다시 보인다
□ 로그아웃 상태에서는 아무것도 안 걸러진다
□ 차단한 사람의 상품 상세 주소를 직접 열면 「상품을 찾을 수 없습니다」가 뜬다
□ 차단 안 한 사람의 상품은 그대로 열린다
□ 페이지를 넘겨도 개수가 안 어긋난다
```

---

# Task 1: 멘션 떼기와 커뮤니티 신고 사유를 shared로

**Files:**
- Create: `packages/shared/src/lib/mention.ts`
- Create: `packages/shared/src/lib/mention.test.ts`
- Modify: `packages/shared/src/constants/report.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: 없음 (첫 과제)
- Produces:
  - `splitMention(content: string): { mention: string | null; rest: string }`
  - `COMMUNITY_REPORT_REASON: ReportReason[]`

- [ ] **Step 1: 실패하는 시험을 쓴다**

`packages/shared/src/lib/mention.test.ts`

```ts
import { describe, expect, it } from 'vitest'

import { splitMention } from './mention'

// 답글 본문은 서버에 "@협주 내용" 꼴로 저장된다. 멘션 필드가 따로 없어서다.
// 서버가 답글을 깊이 구분 없이 평평하게 주기 때문에, 이 @표시가 없으면
// 누구에게 단 답글인지 알 방법이 없다.

describe('splitMention', () => {
  it('맨 앞의 @닉네임을 떼어낸다', () => {
    expect(splitMention('@협주 ㅇㅇㅇㅇㅇㅇ')).toEqual({
      mention: '@협주',
      rest: ' ㅇㅇㅇㅇㅇㅇ',
    })
  })

  it('@가 없으면 그대로 둔다', () => {
    expect(splitMention('ddd')).toEqual({ mention: null, rest: 'ddd' })
  })

  it('본문 중간의 @는 안 뗀다', () => {
    expect(splitMention('메일은 a@b.com 이에요')).toEqual({
      mention: null,
      rest: '메일은 a@b.com 이에요',
    })
  })

  it('@만 있고 닉네임이 없으면 안 뗀다', () => {
    expect(splitMention('@ 안녕')).toEqual({ mention: null, rest: '@ 안녕' })
  })

  it('멘션만 있고 내용이 없어도 된다', () => {
    expect(splitMention('@협주')).toEqual({ mention: '@협주', rest: '' })
  })

  it('빈 글은 그대로', () => {
    expect(splitMention('')).toEqual({ mention: null, rest: '' })
  })

  it('앞에 공백이 있으면 멘션으로 보지 않는다', () => {
    expect(splitMention(' @협주 안녕')).toEqual({ mention: null, rest: ' @협주 안녕' })
  })
})
```

- [ ] **Step 2: 시험이 실패하는지 본다**

Run: `pnpm --filter @cuddle/shared test`
Expected: FAIL — `Failed to resolve import "./mention"`

- [ ] **Step 3: 구현한다**

`packages/shared/src/lib/mention.ts`

```ts
// 답글 본문 맨 앞의 @닉네임을 떼어낸다. 웹·앱이 같이 쓴다.
//
// 왜 이게 필요한가:
// 서버는 부모 댓글 하나 아래의 답글을 깊이 구분 없이 한 목록으로 평평하게 준다.
// (GET /community/comments/{id}/replies 가 depth 2와 3을 같이 준다)
// 그래서 화면에서 답글은 전부 같은 들여쓰기이고, 누구에게 단 답글인지는
// 본문에 박힌 @표시로만 알 수 있다.
//
// 멘션 필드가 서버에 따로 없어서 글자에 섞여 저장된다. 웹이 예전부터 그렇게 해왔고,
// 오늘의집도 같은 방식이다(입력칸에 @닉네임을 미리 채우고 지울 수 있게 둔다).

/** 웹 CommentItem이 쓰던 정규식과 같다. 맨 앞의 `@`+공백없는 글자 덩어리만 본다. */
const MENTION_AT_START = /^(@\S+)([\s\S]*)$/

export interface SplitMention {
  /** 맨 앞 멘션. 없으면 null */
  mention: string | null
  /** 멘션을 뗀 나머지. 멘션이 없으면 원본 그대로 */
  rest: string
}

export function splitMention(content: string): SplitMention {
  const match = content.match(MENTION_AT_START)
  if (!match) return { mention: null, rest: content }

  const [, mention, rest] = match
  return { mention, rest }
}
```

- [ ] **Step 4: 시험이 통과하는지 본다**

Run: `pnpm --filter @cuddle/shared test`
Expected: PASS — 7개 추가 (기존 20 → 27)

> `@ 안녕`이 안 떼어지는 이유: `@\S+`는 `@` 뒤에 공백 아닌 글자가 **하나 이상** 있어야 한다. `@` 다음이 공백이면 안 맞는다.

- [ ] **Step 5: 커뮤니티 신고 사유를 더한다**

`packages/shared/src/constants/report.ts` — 파일 맨 위 주석에서 「안 올린다」는 문단을 지우고, `USER_REPORT_REASON` 아래에 더한다.

지울 주석 (파일 상단):

```
// POST_REPORT_REASON(커뮤니티 글)은 안 올린다 — 앱에 커뮤니티 화면이 없어 쓸 데가 없다.
// 쓰는 데가 생길 때 올린다.
```

더할 상수:

```ts
/**
 * 커뮤니티 게시글 신고 사유.
 *
 * 서버 enum: CommunityReportReason (service/cmarket-domain/.../report/model/)
 * 보내는 곳: POST /api/reports/community-posts/{postId}   { reasonCode, detailReason? }
 *
 * ⚠️ 상품 신고만 reasonCodes(배열)다. 게시글·사용자는 reasonCode(문자열)다.
 */
export const COMMUNITY_REPORT_REASON: ReportReason[] = [
  { id: 'ABUSE_OR_HATE', label: '욕설/혐오 표현' },
  { id: 'SPAM_OR_AD', label: '스팸/광고성 게시물' },
  { id: 'INAPPROPRIATE_CONTENT', label: '부적절한 내용' },
  { id: 'REPETITIVE_POST', label: '도배성 게시물' },
  { id: 'SELF_HARM_OR_SUICIDE', label: '자해/자살 관련' },
]
```

- [ ] **Step 6: 사유가 서버 enum과 같은지 시험한다**

`packages/shared/src/constants/report.test.ts` (신설)

```ts
import { describe, expect, it } from 'vitest'

import { COMMUNITY_REPORT_REASON } from './report'

// 서버 enum 이름을 그대로 보낸다. 하나라도 어긋나면 신고가 조용히 실패한다.
// 원본: service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/report/model/
//       CommunityReportReason.java
const SERVER_ENUM = [
  'ABUSE_OR_HATE',
  'SPAM_OR_AD',
  'INAPPROPRIATE_CONTENT',
  'REPETITIVE_POST',
  'SELF_HARM_OR_SUICIDE',
]

describe('COMMUNITY_REPORT_REASON', () => {
  it('서버 enum과 이름·개수가 같다', () => {
    expect(COMMUNITY_REPORT_REASON.map((reason) => reason.id)).toEqual(SERVER_ENUM)
  })

  it('라벨이 비어 있지 않다', () => {
    for (const reason of COMMUNITY_REPORT_REASON) {
      expect(reason.label.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 6-1: 차단 안내에 되살릴 줄을 더한다 (Task 0 뒤에)**

Task 0에서 백엔드가 커뮤니티 글과 상품 상세도 막게 했으므로, 안내에서 뺐던 줄을 되살린다.

`packages/shared/src/constants/report.ts`

```ts
export const USER_BLOCK_ALERT_LIST: string[] = [
  '차단한 사용자는 회원님에게 채팅을 보낼 수 없습니다',
  '차단한 사용자의 상품은 볼 수 없습니다',
  '차단한 사용자의 게시글은 목록에 보이지 않습니다',
  '이미 진행 중인 거래는 영향을 받지 않습니다',
  '차단은 언제든 차단 목록에서 해제할 수 있습니다',
]
```

바뀌는 것 둘:

```
「상품은 목록에 보이지 않습니다」 → 「상품은 볼 수 없습니다」
   Task 0에서 상세도 막았으므로 이제 「볼 수 없다」가 참이다
새로   「게시글은 목록에 보이지 않습니다」
```

> **프로필은 안 적는다.** 차단한 사람 프로필은 「차단 유저」 배지를 붙여 그대로 보여준다 — 거기 「차단 해제」가 있어서다(9바퀴).

시험(`packages/shared/src/constants/blockAlert.test.ts`)도 같이 고친다.

```ts
  it('상품과 게시글을 둘 다 막는다고 알린다', () => {
    expect(USER_BLOCK_ALERT_LIST).toContain('차단한 사용자의 상품은 볼 수 없습니다')
    expect(USER_BLOCK_ALERT_LIST).toContain('차단한 사용자의 게시글은 목록에 보이지 않습니다')
  })

  it('프로필 숨김은 여전히 약속하지 않는다', () => {
    // 프로필은 「차단 유저」 배지를 붙여 그대로 보여준다 — 거기 「차단 해제」가 있다
    expect(USER_BLOCK_ALERT_LIST.join(' ')).not.toContain('프로필')
  })
```

⚠️ **이 단계는 Task 0이 배포된 뒤에 머지해야 한다.** 안 그러면 안내는 「못 본다」고 하는데 실제로는 보이는 상태가 생긴다.

- [ ] **Step 7: 내보낸다**

`packages/shared/src/index.ts` — `export * from './lib/timeAgo'` 아래 줄에 더한다.

```ts
export * from './lib/mention'
```

> `constants/report`는 이미 내보내고 있으므로 `COMMUNITY_REPORT_REASON`은 자동으로 따라온다.

- [ ] **Step 8: 게이트**

Run: `pnpm gate:shared`
Expected: PASS — 7 files · 29 tests

- [ ] **Step 9: 커밋**

```bash
git add packages/shared/src/lib/mention.ts packages/shared/src/lib/mention.test.ts \
        packages/shared/src/constants/report.ts packages/shared/src/constants/report.test.ts \
        packages/shared/src/index.ts
git commit -m "feat(shared): 멘션 떼기와 커뮤니티 신고 사유 (#812)

답글은 서버가 깊이 구분 없이 평평하게 주므로, 누구에게 단 답글인지는
본문 맨 앞의 @표시로만 알 수 있다. 그 판별을 웹·앱이 같이 쓰도록 올린다.

COMMUNITY_REPORT_REASON은 9바퀴에 「앱에 화면이 없어서」 미뤘던 것이다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 2: 웹 타입을 서버 DTO와 맞춘다

**Files:**
- Modify: `src/types/community.ts`
- Modify: `src/features/community/components/CommentItem.tsx:48,83`

**Interfaces:**
- Consumes: 없음
- Produces: `Comment.authorId: number` (Task 3·5가 이 타입을 쓴다)

- [ ] **Step 1: 타입을 고친다**

`src/types/community.ts` — 세 곳.

**① `CommunityItem`에서 `searchType`을 지운다** (9번째 줄)

```ts
export interface CommunityItem {
  id: number
  title: string
  contentPreview?: string
  thumbnailImageUrl?: string | null
  authorNickname: string
  boardType?: string
  // searchType 삭제 — 이건 검색할 때 보내는 값("title"·"title_content"·"writer")이지
  // 게시글의 속성이 아니다. 서버 PostListItemResponse에 없다.
  viewCount?: number
  commentCount: number
  createdAt: string
  updatedAt: string
  isModified: boolean
}
```

**② `CommunityDetailItem`에서 목록에만 있는 필드를 뺀다**

```ts
/**
 * 상세는 목록과 필드가 다르다. 서버 DTO 둘을 그대로 옮긴 것이다.
 *   PostListItemResponse   contentPreview · thumbnailImageUrl · isModified 가 있다
 *   PostDetailResponse     authorId · authorProfileImageUrl · content · imageUrls 가 있다
 * 그래서 extends로 묶지 않고 따로 적는다.
 */
export interface CommunityDetailItem {
  id: number
  authorId: number
  authorNickname: string
  authorProfileImageUrl: string
  title: string
  content: string
  imageUrls: string[]
  boardType?: string
  viewCount?: number
  commentCount: number
  createdAt: string
  updatedAt: string
}
```

**③ `Comment.authorId`를 number로**

```ts
export interface Comment {
  id: number
  /** 서버는 Long이다. 예전에 string으로 적혀 있어 화면이 Number()로 되돌리고 있었다 */
  authorId: number
  authorNickname: string
  authorProfileImageUrl: string
  content: string
  createdAt: string
  depth: number
  parentId: number
  hasChildren: boolean
  childrenCount: number
}
```

- [ ] **Step 2: `Number()` 되돌리기를 없앤다**

`src/features/community/components/CommentItem.tsx`

```tsx
// 48번째 줄
const isMyComment = user?.id === comment.authorId

// 83번째 줄
{comment.authorId === user?.id ? (
```

- [ ] **Step 3: 타입체크로 나머지 자리를 찾는다**

Run: `npx tsc --noEmit`
Expected: `searchType`·`isModified`·`authorId`를 쓰던 곳이 있으면 오류로 나온다. 나오면 그 자리를 고친다. 오류가 없으면 그대로 넘어간다.

> `CommunityDetailItem`이 `extends CommunityItem`을 그만두면서 `contentPreview` 등을 읽던 곳이 있으면 여기서 잡힌다.

- [ ] **Step 4: 게이트**

```bash
pnpm gate
git diff --name-only develop...HEAD -- 'src/**/*.ts*' | tr '\n' '\0' | xargs -0 npx eslint
```
Expected: 둘 다 오류 0

- [ ] **Step 5: 커밋**

```bash
git add src/types/community.ts src/features/community/components/CommentItem.tsx
git commit -m "fix(web): 커뮤니티 타입을 서버 DTO와 맞춤 (#812)

세 곳이 어긋나 있었다.
- CommunityItem.searchType  검색할 때 보내는 값인데 게시글 속성으로 들어가 있었다
- CommunityDetailItem       목록 전용 필드(contentPreview 등)를 상속받고 있었다
- Comment.authorId          서버는 Long인데 string이라 화면이 Number()로 되돌렸다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 2-1: 웹 게시글 신고 사유를 shared로 (스펙 W-5)

**Files:**
- Modify: `src/constants/constants.ts` (`POST_REPORT_REASON` 제거)
- Modify: `src/components/modal/PostReportModal.tsx` (또는 그 상수를 쓰는 곳)

**Interfaces:**
- Consumes: `COMMUNITY_REPORT_REASON` (Task 1)
- Produces: 없음

**왜 필요한가 — 지금 「기타」 신고가 실패한다**

```
서버 CommunityReportReason   ABUSE_OR_HATE · SPAM_OR_AD · INAPPROPRIATE_CONTENT
                             REPETITIVE_POST · SELF_HARM_OR_SUICIDE · ETC
웹 POST_REPORT_REASON        … 'OTHER'   ← 서버에 없는 값
```

`OTHER`는 **사용자 신고**(`UserReportReason`)의 값이다. 게시글 신고에서 「기타」를 고르면 서버가 못 알아본다. 상수를 옮기면서 같이 고친다.

- [ ] **Step 1: 쓰는 곳을 찾는다**

```bash
grep -rn "POST_REPORT_REASON" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: shared 것으로 바꾼다**

`src/constants/constants.ts`에서 `POST_REPORT_REASON`을 지우고, 쓰던 곳이 이렇게 가져가게 한다.

```ts
import { COMMUNITY_REPORT_REASON } from '@cuddle/shared'
```

`ReportModalBase`가 받는 `reasons` 모양(`{ id, label }[]`)이 `ReportReason`과 같으므로 그대로 넘어간다. 다르면 그 자리에 맞춘다.

> 라벨과 차례는 이미 웹 것을 그대로 옮겨 뒀다(Task 1). 화면 글자는 안 바뀌고 **「기타」가 보내는 값만** `OTHER` → `ETC`로 바뀐다.

- [ ] **Step 3: 게시글 신고도 409로 중복을 가려낸다**

`PostReportModal`이 오류를 문구로 가려내고 있으면 `isAlreadyReported`(`src/lib/api/reportErrors.ts`, #808에서 만들었다)로 바꾼다.

```ts
import { isAlreadyReported } from '@/lib/api/reportErrors'

const isDuplicate = isAlreadyReported(error)
```

- [ ] **Step 4: 시험**

`src/components/modal/PostReportModal.test.tsx` — `ProductReportModal.test.tsx`를 본떠 쓴다.

```
□ 「기타」를 고르면 ETC를 보낸다 (OTHER가 아니다)
□ 409면 「이미 신고한 게시글입니다」가 뜬다
```

- [ ] **Step 5: 게이트**

```bash
pnpm gate
```

- [ ] **Step 6: 커밋**

```bash
git add src/constants/constants.ts src/components/modal/
git commit -m "fix(web): 게시글 신고 사유를 shared로 · 「기타」가 서버 값과 안 맞던 것 (#812)

웹 POST_REPORT_REASON의 「기타」가 OTHER였는데 서버 CommunityReportReason에는
그 값이 없다(사용자 신고만 OTHER다). 「기타」로 낸 신고가 조용히 실패하고 있었다.

@cuddle/shared의 COMMUNITY_REPORT_REASON으로 옮긴다. 라벨과 차례는 웹 것을
그대로 가져갔으므로 화면 글자는 안 바뀌고 보내는 값만 ETC로 바뀐다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 3: 웹 답글을 처음부터 펼치고 오버레이를 없앤다

**Files:**
- Modify: `src/features/community/components/CommentList.tsx`
- Modify: `src/features/community/components/CommentItem.tsx`
- Delete: `src/features/community/components/ReplyOverlay.tsx`

**Interfaces:**
- Consumes: `Comment.authorId: number` (Task 2)
- Produces: `CommentList`의 겉모습은 그대로 (`comments`, `postId` props). 안쪽만 바뀐다

- [ ] **Step 1: 지금 동작을 확인한다**

Run: `pnpm dev` 뒤 `http://localhost:3000/community/36` 을 좁은 폭(개발자도구 모바일)으로 연다.
확인: 「답글 4개」를 눌러야 답글이 보인다 · 「답글 달기」를 누르면 전체 화면이 덮인다.

이 둘이 바뀌는 것이 이 과제다.

- [ ] **Step 2: `CommentItem`에서 접기 버튼을 없앤다**

`src/features/community/components/CommentItem.tsx`

**① props에서 뺀다** (`CommentItemProps`)

```tsx
interface CommentItemProps {
  comment: Comment
  isReply?: boolean
  showBorder?: boolean
  onHandleReply?: () => void
  onDelete?: (commentId: number) => Promise<void>
}
```

`hasChildren` · `childrenCount` · `onToggleReplies` · `isRepliesOpen` 넷을 지운다.

**② 함수 인자에서도 뺀다**

```tsx
export function CommentItem({
  comment,
  isReply = false,
  showBorder = true,
  onHandleReply,
  onDelete,
}: CommentItemProps) {
```

**③ 접기 버튼 블록을 통째로 지운다** (107~121번째 줄)

```tsx
{/* 답글 버튼 (대댓글이 아니고, hasChildren이 있을 때만) */}
{!isReply && hasChildren ? (
  … 이 블록 전체를 지운다
) : null}
```

**④ 상자 여백 계산에서 `isRepliesOpen`을 뺀다** (68번째 줄)

```tsx
className={cn(
  'flex items-start gap-3.5',
  isReply
    ? 'bg-surface-container-low rounded-lg p-[14px]'
    : cn(showBorder && 'border-t border-gray-300 pt-3.5', 'pb-3.5')
)}
```

> `!isRepliesOpen && 'pb-3.5'` 였던 것을 `'pb-3.5'`로 바꾼다. 답글이 늘 펼쳐지므로 조건이 없어진다.
> `px-2 py-3 md:px-4.5 md:py-4.5` → `p-[14px]`는 Task 4의 스타일 통일을 여기서 같이 반영한 것이다.

**⑤ 멘션을 shared에서 가져온다** — 파일 위쪽의 `renderContentWithMention`을 이렇게 바꾼다.

```tsx
import { getTimeAgo, splitMention } from '@cuddle/shared'

function renderContentWithMention(content: string) {
  const { mention, rest } = splitMention(content)
  if (!mention) return content
  return (
    <>
      <span className="text-primary-container text-sm">{mention}</span>
      {rest}
    </>
  )
}
```

- [ ] **Step 3: `CommentList`에서 답글을 처음부터 부른다**

`src/features/community/components/CommentList.tsx`

**① 답글 조회를 여러 개로 바꾼다.** 지금은 `openRepliesCommentId` 하나에 `useQuery` 하나다. `useQueries`로 답글 있는 부모마다 건다.

```tsx
import { useQueries, useQueryClient } from '@tanstack/react-query'

// 답글은 부모 댓글마다 따로 부른다 — 서버가 목록에 답글을 안 담아 준다.
//
// 왜 처음부터 다 부르나 (2026-08-01 실측):
//   글 28개 중 댓글이 달린 글이 5개, 가장 많은 글도 부모 2개 + 답글 5개다.
//   답글 있는 부모는 글당 1~2개라 요청이 최대 3번이고, 나란히 쏘면 +50ms다.
//   눌러야 펼쳐지면 글 36에서는 대화의 70%가 처음에 안 보인다.
//
// 정말 커지면 앱에서 감출 게 아니라 백엔드에 「목록에 답글도 담아 달라」고 요청한다.
const parentsWithReplies = comments.filter((comment) => comment.hasChildren)

const replyQueries = useQueries({
  queries: parentsWithReplies.map((comment) => ({
    queryKey: ['community', postId, 'replies', comment.id],
    queryFn: async () => {
      const response = await api.get(`/community/comments/${comment.id}/replies`)
      return response.data.data as { comments: Comment[] }
    },
  })),
})

/** 부모 댓글 id → 답글 목록. 아직 안 온 것은 빈 배열이다 */
const repliesByParent = new Map<number, Comment[]>(
  parentsWithReplies.map((comment, index) => [
    comment.id,
    replyQueries[index]?.data?.comments ?? [],
  ])
)

/** 답글을 못 불러온 부모 id. 그 자리에만 한 줄 안내를 그린다 */
const failedParents = new Set<number>(
  parentsWithReplies
    .filter((_, index) => replyQueries[index]?.isError)
    .map((comment) => comment.id)
)
```

**② `openRepliesCommentId` 상태와 `handleToggleReplies`를 지운다.** 이제 열고 닫는 것이 없다.

**③ 답글 목록을 늘 그린다.** 168~196번째 줄의 `grid transition-all` 접힘 상자를 이렇게 바꾼다.

```tsx
{/* 답글 — 늘 펼쳐져 있다 */}
{comment.hasChildren ? (
  <div className="mt-3.5">
    {failedParents.has(comment.id) ? (
      <p className="pb-3.5 pl-10 text-xs text-gray-500">답글을 불러오지 못했어요.</p>
    ) : (
      <ul className="flex flex-col gap-2 pb-3.5 pl-10">
        {(repliesByParent.get(comment.id) ?? []).map((reply, index) => (
          <li key={reply.id}>
            <CommentItem
              comment={reply}
              isReply
              showBorder={index !== 0}
              onDelete={handleDeleteComment}
              onHandleReply={() =>
                openReplyForm({
                  commentId: reply.id,
                  threadId: comment.id,
                  mention: reply.authorNickname,
                })
              }
            />
          </li>
        ))}
      </ul>
    )}
  </div>
) : null}
```

**④ `CommentItem` 호출에서 없앤 props를 뺀다** (150~165번째 줄)

```tsx
<CommentItem
  comment={comment}
  showBorder={index !== 0}
  onHandleReply={() =>
    openReplyForm({
      commentId: comment.id,
      threadId: comment.id,
      mention: comment.authorNickname,
    })
  }
  onDelete={handleDeleteComment}
/>
```

**⑤ 답글을 새로 받는 자리를 고친다.** 지금 `invalidateQueries`가 `openRepliesCommentId`를 쓰던 두 곳(68·90번째 줄)을 `threadId` 기준으로 바꾼다.

```tsx
queryClient.invalidateQueries({ queryKey: ['community', postId, 'replies', threadId] })
```

- [ ] **Step 4: 오버레이를 지운다**

**① `CommentList.tsx` 222~246번째 줄의 「모바일: 답글 오버레이」 블록을 통째로 지운다.**

**② `import { ReplyOverlay } from './ReplyOverlay'` (10번째 줄)를 지운다.**

**③ 인라인 답글 폼에서 `hidden … md:block`을 없앤다** (199번째 줄)

```tsx
{activeThreadId === comment.id ? (
  <div className="pb-3.5 pl-10">
```

**④ 파일을 지운다**

```bash
rm src/features/community/components/ReplyOverlay.tsx
```

- [ ] **Step 5: 게이트**

```bash
pnpm gate
git diff --name-only develop...HEAD -- 'src/**/*.ts*' | tr '\n' '\0' | xargs -0 npx eslint
```
Expected: 둘 다 오류 0. `ReplyOverlay`를 아직 부르는 곳이 있으면 tsc가 잡는다.

- [ ] **Step 5-1: 시험을 쓴다 (#799로 러너가 생겼다)**

`src/features/community/components/CommentItem.test.tsx`

```tsx
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import { CommentItem } from './CommentItem'

// 답글 접기 버튼을 없애고 멘션을 shared에서 가져오게 바꿨다.
// 눈으로만 보면 「답글 4개」 버튼이 슬그머니 되살아나도 모른다.

vi.mock('@/store/userStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => selector({ user: { id: 7 } }),
}))

const COMMENT = {
  id: 34,
  authorId: 8,
  authorNickname: '협주',
  authorProfileImageUrl: '',
  content: '좀만 더 줘봐요',
  createdAt: '2026-04-01T10:00:00',
  depth: 1,
  parentId: 0,
  hasChildren: true,
  childrenCount: 4,
}

describe('접기 버튼', () => {
  it('답글이 있어도 「답글 N개」 버튼이 없다', () => {
    // 답글은 처음부터 펼쳐지므로 여닫는 단추가 필요 없다
    render(<CommentItem comment={COMMENT} />)

    expect(screen.queryByRole('button', { name: /답글 \d+개/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '답글 접기' })).not.toBeInTheDocument()
  })
})

describe('멘션', () => {
  it('맨 앞 @닉네임만 색을 다르게 한다', () => {
    render(<CommentItem comment={{ ...COMMENT, content: '@협주 ㅇㅇㅇ' }} isReply />)

    expect(screen.getByText('@협주')).toHaveClass('text-primary-container')
  })

  it('@가 없으면 그대로 그린다', () => {
    render(<CommentItem comment={{ ...COMMENT, content: 'ddd' }} isReply />)

    expect(screen.getByText('ddd')).toBeInTheDocument()
  })

  it('본문 중간의 @는 안 뗀다', () => {
    render(<CommentItem comment={{ ...COMMENT, content: '메일은 a@b.com 이에요' }} isReply />)

    expect(screen.getByText(/메일은 a@b.com 이에요/)).toBeInTheDocument()
  })
})

describe('내 댓글', () => {
  it('내 것이면 표가 붙고 삭제가 보인다', () => {
    render(<CommentItem comment={{ ...COMMENT, authorId: 7 }} onDelete={vi.fn()} />)

    expect(screen.getByText('내 댓글')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('남의 것이면 둘 다 없다', () => {
    render(<CommentItem comment={COMMENT} onDelete={vi.fn()} />)

    expect(screen.queryByText('내 댓글')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })
})
```

> `useUserStore`를 가짜로 두는 모양은 실제 파일이 그것을 어떻게 쓰는지(`useUserStore((state) => state.user)`) 보고 맞춘다. 위 코드가 안 맞으면 그 파일에 맞춘다.

Run: `pnpm test src/features/community/components/CommentItem.test.tsx`
Expected: 통과

- [ ] **Step 5-2: 시험이 정말 잡는지 본다**

접기 버튼을 되살려 보고 그 시험만 빨개지는지 확인한다. 확인했으면 되돌린다.

> **통과 개수만 세지 않는다.** 새로 쓴 시험이 첫 실행에 다 통과하면 오히려 의심한다.

- [ ] **Step 6: 눈으로 확인한다**

Run: `pnpm dev` → `http://localhost:3000/community/36`
확인:
```
□ 좁은 폭 · 넓은 폭 둘 다에서 답글이 처음부터 보인다
□ 「답글 4개」/「답글 접기」 버튼이 없다
□ 「답글 달기」를 누르면 화면이 안 덮이고 그 자리에 폼이 열린다
□ 답글 본문 맨 앞의 @닉네임이 색이 다르다
□ 답글을 등록하면 목록에 바로 보인다
```

- [ ] **Step 7: 커밋**

```bash
git add src/features/community/components/
git commit -m "feat(web): 답글을 처음부터 펼치고 오버레이 제거 (#812)

모바일에서 「답글 달기」가 전체 화면을 덮던 것을 없앤다. 데스크톱이 이미
쓰던 인라인 폼을 폭 상관없이 쓴다 — 화면 폭 분기와 뒤로가기용
history.pushState 장치가 같이 사라진다.

답글은 눌러야 펼쳐지던 것을 처음부터 보이게 한다. 실측 근거:
글 28개 중 댓글 달린 글 5개, 최대가 부모 2 + 답글 5. 요청 최대 3번 · +50ms.
글 36은 눌러야 펼쳐지면 대화의 70%가 처음에 안 보였다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 4: 웹 댓글 스타일 통일

**Files:**
- Modify: `src/features/community/components/CommentItem.tsx`

**Interfaces:**
- Consumes: Task 3이 정리한 `CommentItem`
- Produces: 앱이 옮겨 쓸 숫자 (닉네임 14px · 본문 15px · 멘션 14px · 답글 상자 패딩 14px)

`md:` 분기를 없애 모바일·데스크톱을 한 벌로 둔다. 앱에 옮길 숫자가 하나로 정해진다.

- [ ] **Step 1: 네 자리를 고친다**

`src/features/community/components/CommentItem.tsx`

**① 닉네임** (82번째 줄)

```tsx
<p className="text-sm font-semibold leading-none">{comment.authorNickname}</p>
```

**② 본문** (87번째 줄)

```tsx
<p className="whitespace-pre-wrap text-[15px] leading-snug">
  {renderContentWithMention(comment.content)}
</p>
```

> `leading-none`(줄 간격 1)을 본문에 쓰지 않는다. 개발자도구로 시험한 답글이 한 줄이라 표가 안 났을 뿐, 두 줄로 넘어가면 줄끼리 붙어 읽기 어렵다. `leading-snug`(1.375)가 지금보다 좁으면서 안 붙는다.

**③ 멘션** (Task 3 Step 2-⑤에서 이미 `text-sm`으로 바꿨다. 확인만 한다)

```tsx
<span className="text-primary-container text-sm">{mention}</span>
```

**④ 답글 상자** (Task 3 Step 2-④에서 이미 `p-[14px]`로 바꿨다. 확인만 한다)

- [ ] **Step 2: 시간·버튼 줄의 `md:` 도 정리한다**

`md:font-medium`이 붙은 네 곳(90·98·114·129번째 줄 근처)에서 `md:`를 뗀다. 폭에 따라 굵기가 달라질 이유가 없다.

```tsx
<p className="text-xs font-medium text-gray-500">{getTimeAgo(comment.createdAt)}</p>
…
<button className="text-primary-container cursor-pointer text-xs font-medium hover:underline" type="button" onClick={onHandleReply}>
  답글 달기
</button>
```

> 접기 버튼은 Task 3에서 이미 지웠으므로 여기 없다.

- [ ] **Step 3: 게이트**

```bash
pnpm gate
git diff --name-only develop...HEAD -- 'src/**/*.ts*' | tr '\n' '\0' | xargs -0 npx eslint
```

- [ ] **Step 4: 눈으로 확인한다**

Run: `pnpm dev` → `/community/36`
확인:
```
□ 넓은 폭에서 닉네임이 작아졌다 (16 → 14px)
□ 본문이 15px이다
□ 답글 상자 여백이 사방 14px로 같다
□ 좁은 폭에서도 같은 크기다
□ 두 줄 넘는 답글의 줄이 붙지 않는다 (긴 답글로 확인)
```

- [ ] **Step 5: 커밋**

```bash
git add src/features/community/components/CommentItem.tsx
git commit -m "style(web): 댓글 글자·여백을 한 벌로 통일 (#812)

md: 분기를 없애 모바일·데스크톱이 같은 값을 쓴다. 앱이 옮겨 쓸 숫자가
하나로 정해진다.

  닉네임    13 / 16px  →  14px
  본문      상속 16px  →  15px
  멘션      14 / 16px  →  14px
  답글 상자  8·12 / 18px →  14px 균일

본문 줄 간격은 leading-snug로 둔다. leading-none은 두 줄 넘는 답글에서
줄이 붙는다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 5: 웹 모바일에서 댓글을 별도 페이지로

**Files:**
- Create: `src/features/community/CommunityComments.tsx`
- Create: `src/app/(main)/community/[id]/[name]/comments/page.tsx`
- Modify: `src/features/community/CommunityDetail.tsx`

**Interfaces:**
- Consumes: `CommentList` · `CommentForm` (Task 3이 정리한 것)
- Produces: 없음 (웹 마지막 과제)

- [ ] **Step 1: 댓글 덩어리를 조각으로 뺀다**

지금 `CommunityDetail.tsx`에 흩어져 있는 것(폼 상태 · 등록 mutation · 목록 · 입력창)을 한 조각으로 모은다. 그래야 상세와 새 댓글 페이지가 **같은 것**을 쓴다. 베껴 쓰면 한쪽만 고쳐질 자리가 된다.

`src/features/community/components/CommentSection.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { MessageSquareText } from 'lucide-react'

import { api } from '@/lib/api/api'
import InlineNotification from '@/components/commons/InlineNotification'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import type { Comment, CommentPostRequestData } from '@/types'
import { CommentForm } from './CommentForm'
import { CommentList, type ReplyRequestFormValues } from './CommentList'

// 댓글 목록 + 입력창 + 등록 처리를 한 덩어리로 모은 것.
//
// 상세(데스크톱)와 댓글 페이지(모바일)가 같이 쓴다. 예전에는 이게 CommunityDetail
// 안에 흩어져 있었는데, 모바일이 별도 페이지로 나가면서 두 곳이 필요해졌다.
// 베껴 쓰면 한쪽만 고쳐질 자리가 되므로 조각으로 뺀다.

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  /** 입력칸 id. 한 페이지에 둘이 있으면(데스크톱 상세) 겹치면 안 된다 */
  inputId: string
}

export function CommentSection({ postId, comments, inputId }: CommentSectionProps) {
  const queryClient = useQueryClient()
  const [postError, setPostError] = useState<React.ReactNode>(null)

  const user = useUserStore((state) => state.user)
  const setRedirectUrl = useUserStore((state) => state.setRedirectUrl)
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { handleSubmit, control, setValue, reset } = useForm<ReplyRequestFormValues>({
    mode: 'onChange',
    defaultValues: { content: '' },
  })
  const content = useWatch({ control, name: 'content' }) ?? ''

  const mutation = useMutation({
    mutationFn: (data: CommentPostRequestData) =>
      api.post(`/community/posts/${postId}/comments`, { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['community', postId] })
      reset()
    },
    onError: () => {
      setPostError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">댓글 등록에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    },
  })

  const onSubmit = (data: ReplyRequestFormValues) => {
    if (!data.content.trim()) return
    if (!user) {
      setRedirectUrl(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
      openLoginModal()
      return
    }
    mutation.mutate({ content: data.content })
  }

  return (
    <div className="flex flex-col gap-3.5">
      {comments.length > 0 ? (
        <CommentList comments={comments} postId={postId} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-6">
          <MessageSquareText size={32} className="text-gray-300" />
          <p className="text-sm text-gray-400">첫 댓글을 남겨보세요</p>
        </div>
      )}

      <AnimatePresence>
        {postError ? (
          <InlineNotification type="error" onClose={() => setPostError(null)}>
            {postError}
          </InlineNotification>
        ) : null}
      </AnimatePresence>

      <CommentForm
        id={inputId}
        placeholder="댓글을 입력하세요"
        legendText="댓글 작성폼"
        value={content}
        onChangeValue={(v) => setValue('content', v)}
        onSubmit={handleSubmit(onSubmit)}
      />
    </div>
  )
}
```

> 「댓글 쓰기」 단추(지금 빈 상태에 있는 것)는 없앤다. 그 단추는 화면 아래 고정 입력칸에 초점을 옮기려고 있었는데, 모바일 입력칸이 댓글 페이지로 옮겨 가면서 할 일이 없어진다.

- [ ] **Step 2: 댓글 페이지 알맹이를 만든다**

`src/features/community/CommunityComments.tsx`

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { api } from '@/lib/api/api'
import type { Comment, CommunityDetailItem } from '@/types'
import { CommentSection } from './components/CommentSection'

// 모바일 전용 댓글 페이지.
//
// 왜 페이지를 나누나: 앱이 그렇게 한다. 앱은 하단 입력창과 탭바가 겹쳐서 댓글을
// 별도 화면으로 뺐고, 웹 모바일도 같은 모양으로 맞춘다.
// 데스크톱은 상세 안에 댓글이 그대로 있다 — 넓은 화면에서 페이지를 옮길 이유가 없다.

interface CommunityCommentsProps {
  post: CommunityDetailItem
  initialComments: Comment[]
}

export default function CommunityComments({ post, initialComments }: CommunityCommentsProps) {
  const router = useRouter()
  const postId = String(post.id)

  // 상세와 같은 키를 쓴다 — 상세에서 등록한 것이 여기에도 바로 보인다.
  const { data } = useQuery({
    queryKey: ['community', postId, 'comments'],
    queryFn: async () => {
      const response = await api.get(`/community/posts/${postId}/comments`, {
        params: { page: 0, size: 100 },
      })
      return response.data.data as { comments: Comment[] }
    },
    initialData: { comments: initialComments },
  })

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-13 items-center gap-2 border-b border-gray-200 px-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="cursor-pointer"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        {/* commentCount는 부모 댓글 + 답글 합계다 */}
        <h1 className="text-base font-semibold">댓글 {post.commentCount}</h1>
      </header>

      <div className="flex-1 px-4 py-3">
        <CommentSection
          postId={postId}
          comments={data?.comments ?? []}
          inputId="comment-input-page"
        />
      </div>
    </div>
  )
}
```

> 서버가 댓글을 페이지로 안 나눠 주므로 웹은 `size: 100`을 달라고 한다. 지금 `CommunityDetail`이 쓰는 값과 같게 맞춘다.

- [ ] **Step 3: 페이지를 만든다**

`src/app/(main)/community/[id]/[name]/comments/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import CommunityComments from '@/features/community/CommunityComments'
import { fetchCommunityComments, fetchCommunityDetail } from '@/lib/api/server/community'

interface CommentsRouteProps {
  params: Promise<{ id: string; name: string }>
}

export default async function CommentsRoute({ params }: CommentsRouteProps) {
  const { id } = await params

  const [post, comments] = await Promise.all([
    fetchCommunityDetail(id),
    fetchCommunityComments(id),
  ])

  if (!post) notFound()

  return <CommunityComments post={post} initialComments={comments?.comments ?? []} />
}
```

> 데스크톱 폭에서 이 주소로 바로 들어와도 막지 않는다. 막으면 만들 것만 늘어난다.

- [ ] **Step 4: 상세에서 폭에 따라 갈라준다**

`src/features/community/CommunityDetail.tsx`

**① `<section aria-label="댓글">` 블록(245~285번째 줄)을 이렇게 바꾼다.**

```tsx
{/* 데스크톱: 상세 안에 댓글이 그대로 */}
<section
  aria-label="댓글"
  className="border-outline-variant/40 hidden flex-col gap-3.5 border-t py-5 md:flex md:border-t-0"
>
  <div className="md:text-md flex items-center gap-1 text-sm font-semibold">
    <span>댓글</span>
    <span className="text-primary-container font-semibold">{data.commentCount}</span>
  </div>

  <CommentSection
    postId={id!}
    comments={commentData?.comments ?? []}
    inputId="comment-input-desktop"
  />
</section>

{/* 모바일: 줄 하나만. 누르면 댓글 페이지로 */}
<Link
  href={`/community/${data.id}/${toUrlName(data.title)}/comments`}
  className="flex items-center justify-between border-t border-gray-200 py-4 md:hidden"
>
  <span className="text-base font-semibold">
    댓글 <span className="text-primary-container">{data.commentCount}</span>
  </span>
  <ChevronRight className="h-5 w-5 text-gray-400" />
</Link>
```

> `hidden … md:flex`를 쓴다(`md:block`이 아니라). 원래 `flex flex-col`이라 `block`으로 바꾸면 세로 간격(`gap-3.5`)이 죽는다.

**② 모바일 고정 입력창 블록(288~303번째 줄)을 통째로 지운다.** 이제 댓글 페이지에 있다.

**③ 안 쓰게 된 것을 지운다** — `useForm`·`useWatch`·`commentContent`·`replyMutation`·`onSubmit`·`commentPostError`·`mobileInputRef`·`CommentForm`/`CommentList` import.

> ⚠️ `handlePostDelete`·`handlePostEdit`은 그대로 둔다. 댓글과 무관하다.
> 타입체크가 남은 것을 잡아 준다.

**④ 필요한 import를 더한다**

```tsx
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { toUrlName } from '@/lib/utils/toUrlName'
import { CommentSection } from './components/CommentSection'
```

- [ ] **Step 5: 게이트**

```bash
pnpm gate
git diff --name-only develop...HEAD -- 'src/**/*.ts*' | tr '\n' '\0' | xargs -0 npx eslint
```

- [ ] **Step 5-1: 시험을 쓴다**

`src/features/community/components/CommentSection.test.tsx`

```tsx
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import { CommentSection } from './CommentSection'

// 댓글 덩어리를 조각으로 뺐다(상세 데스크톱 · 댓글 페이지 모바일이 같이 쓴다).
// 한쪽만 고쳐질 자리가 안 되게 여기서 묶는다.

vi.mock('@/lib/api/api', () => ({ api: { post: vi.fn() } }))
vi.mock('@/store/userStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { id: 7 }, setRedirectUrl: vi.fn() }),
}))
vi.mock('@/store/modalStore', () => ({
  useLoginModalStore: (selector: (s: unknown) => unknown) =>
    selector({ openLoginModal: vi.fn() }),
}))
vi.mock('next/navigation', () => ({
  usePathname: () => '/community/36',
  useSearchParams: () => new URLSearchParams(),
}))

const COMMENT = {
  id: 34,
  authorId: 8,
  authorNickname: '협주',
  authorProfileImageUrl: '',
  content: '좀만 더 줘봐요',
  createdAt: '2026-04-01T10:00:00',
  depth: 1,
  parentId: 0,
  hasChildren: false,
  childrenCount: 0,
}

describe('빈 상태', () => {
  it('댓글이 없으면 첫 댓글을 남기라고 한다', () => {
    render(<CommentSection postId="36" comments={[]} inputId="t" />)

    expect(screen.getByText('첫 댓글을 남겨보세요')).toBeInTheDocument()
  })

  it('빈 상태에서도 입력칸은 있다', () => {
    // 예전에는 「댓글 쓰기」 단추로 아래 고정 입력칸에 초점을 옮겼다.
    // 그 입력칸이 댓글 페이지로 옮겨 가면서 단추가 할 일이 없어졌다
    render(<CommentSection postId="36" comments={[]} inputId="t" />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '댓글 쓰기' })).not.toBeInTheDocument()
  })
})

describe('목록', () => {
  it('댓글이 있으면 그린다', () => {
    render(<CommentSection postId="36" comments={[COMMENT]} inputId="t" />)

    expect(screen.getByText('좀만 더 줘봐요')).toBeInTheDocument()
    expect(screen.queryByText('첫 댓글을 남겨보세요')).not.toBeInTheDocument()
  })
})
```

> 가짜로 두는 store의 모양은 실제 파일이 쓰는 방식에 맞춘다. 위가 안 맞으면 그 파일을 보고 고친다.

Run: `pnpm test src/features/community/components/CommentSection.test.tsx`

- [ ] **Step 6: 눈으로 확인한다**

Run: `pnpm dev`
```
□ 넓은 폭 /community/36/... → 상세 안에 댓글이 다 있다 (지금과 같다)
□ 좁은 폭 → 「댓글 7 ›」 줄만 보인다
□ 그 줄을 누르면 /comments 로 가고 「← 댓글 7」 헤더가 뜬다
□ 댓글 페이지에서 답글이 펼쳐져 있고, 답글 달기가 그 자리에서 열린다
□ 뒤로가기로 상세로 돌아온다
```

- [ ] **Step 7: 커밋**

```bash
git add src/features/community/ src/app/\(main\)/community/
git commit -m "feat(web): 모바일에서 댓글을 별도 페이지로 (#812)

앱과 같은 배치로 맞춘다. 데스크톱은 상세 안에 댓글이 그대로 있고,
모바일만 「댓글 N ›」 줄에서 /comments 로 넘어간다.

데스크톱 폭에서 그 주소로 바로 들어와도 막지 않는다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 6: 앱 커뮤니티 API

**Files:**
- Create: `mobile/lib/community.ts`
- Create: `mobile/lib/community.test.ts`

**Interfaces:**
- Consumes: `apiFetch` (`mobile/lib/auth/api.ts`)
- Produces:
  - `type BoardType = 'QUESTION' | 'INFO'`
  - `interface PostListItem { id, title, contentPreview, thumbnailImageUrl, authorNickname, viewCount, commentCount, createdAt }`
  - `interface PostDetail { id, authorId, authorNickname, authorProfileImageUrl, title, content, imageUrls, viewCount, commentCount, createdAt }`
  - `interface CommentItem { id, authorId, authorNickname, authorProfileImageUrl, content, createdAt, depth, parentId, hasChildren, childrenCount }`
  - `interface PostPage { content: PostListItem[]; hasNext: boolean }`
  - `fetchPosts(boardType, page): Promise<PostPage>`
  - `fetchPostDetail(postId): Promise<PostDetail>`
  - `fetchComments(postId): Promise<CommentItem[]>`
  - `fetchReplies(commentId): Promise<CommentItem[]>`
  - `createComment(postId, content, parentId?): Promise<void>`
  - `deleteComment(commentId): Promise<void>`
  - `reportPost(postId, reasonCode, detailReason?): Promise<void>`

- [ ] **Step 1: 실패하는 시험을 쓴다**

`mobile/lib/community.test.ts`

```ts
import {
  createComment,
  deleteComment,
  fetchComments,
  fetchPostDetail,
  fetchPosts,
  fetchReplies,
  reportPost,
  totalCommentCount,
} from './community';

// 서버 응답을 그대로 붙여넣어 만든다.
// 9바퀴에 「다른 API가 이러니 이것도 그렇겠지」로 가정해 쓴 테스트가 틀린 모양을
// 통과시킨 일이 있었다. 아래 덩어리는 2026-08-01에 실제 서버에서 받은 것이다.

jest.mock('./auth/api', () => ({
  apiFetch: jest.fn(),
}));

const { apiFetch } = jest.requireMock('./auth/api') as { apiFetch: jest.Mock };

function okJson(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function errJson(status: number, message?: string) {
  return { ok: false, status, json: async () => ({ message }) } as unknown as Response;
}

beforeEach(() => {
  apiFetch.mockReset();
});

describe('fetchPosts', () => {
  it('data 안의 content와 hasNext를 꺼낸다', async () => {
    apiFetch.mockResolvedValue(
      okJson({
        data: {
          page: 0,
          size: 10,
          content: [
            {
              id: 36,
              title: '강아지 사료 바꿨더니 안 먹어요',
              contentPreview: '수의사 추천으로…',
              thumbnailImageUrl: null,
              authorNickname: '협주',
              viewCount: 12,
              commentCount: 7,
              createdAt: '2026-04-01T10:00:00',
              updatedAt: '2026-04-01T10:00:00',
              isModified: false,
            },
          ],
          hasNext: true,
        },
      })
    );

    const page = await fetchPosts('QUESTION', 0);

    expect(page.content).toHaveLength(1);
    expect(page.content[0].id).toBe(36);
    expect(page.content[0].commentCount).toBe(7);
    expect(page.hasNext).toBe(true);
  });

  it('boardType과 page를 주소에 담는다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { content: [], hasNext: false } }));

    await fetchPosts('INFO', 2);

    expect(apiFetch).toHaveBeenCalledWith('/community/posts?boardType=INFO&page=2&size=10');
  });

  it('data가 비어도 빈 목록을 돌려준다', async () => {
    apiFetch.mockResolvedValue(okJson({}));

    const page = await fetchPosts('QUESTION', 0);

    expect(page.content).toEqual([]);
    expect(page.hasNext).toBe(false);
  });

  it('실패하면 던진다', async () => {
    apiFetch.mockResolvedValue(errJson(500));

    await expect(fetchPosts('QUESTION', 0)).rejects.toThrow('글 목록을 불러오지 못했어요');
  });
});

describe('fetchPostDetail', () => {
  it('상세 필드를 꺼낸다', async () => {
    apiFetch.mockResolvedValue(
      okJson({
        data: {
          id: 36,
          authorId: 42,
          authorNickname: '협주',
          authorProfileImageUrl: 'https://cdn/x.webp',
          title: '강아지 사료',
          content: '수의사 추천으로 바꿨는데…',
          imageUrls: ['https://cdn/a.webp'],
          viewCount: 12,
          commentCount: 7,
          createdAt: '2026-04-01T10:00:00',
          updatedAt: '2026-04-01T10:00:00',
        },
      })
    );

    const post = await fetchPostDetail(36);

    expect(post.authorId).toBe(42);
    expect(post.content).toContain('수의사');
    expect(post.imageUrls).toEqual(['https://cdn/a.webp']);
  });

  it('imageUrls가 없으면 빈 배열이다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { id: 1, title: 'x', content: 'y' } }));

    const post = await fetchPostDetail(1);

    expect(post.imageUrls).toEqual([]);
  });
});

describe('fetchComments', () => {
  // ⚠️ 껍질이 { data: { comments } }다. content가 아니다.
  it('data.comments를 꺼낸다', async () => {
    apiFetch.mockResolvedValue(
      okJson({
        data: {
          comments: [
            {
              id: 34,
              authorId: 7,
              authorNickname: 'jjub0217',
              authorProfileImageUrl: '',
              content: '좀만 더 줘봐요',
              createdAt: '2026-04-01T10:00:00',
              depth: 1,
              parentId: null,
              hasChildren: true,
              childrenCount: 4,
            },
          ],
        },
      })
    );

    const comments = await fetchComments(36);

    expect(comments).toHaveLength(1);
    expect(comments[0].hasChildren).toBe(true);
    expect(comments[0].childrenCount).toBe(4);
  });

  it('comments가 없으면 빈 배열이다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: {} }));

    expect(await fetchComments(1)).toEqual([]);
  });
});

describe('fetchReplies', () => {
  // ⚠️ 서버가 깊이를 안 나누고 평평하게 준다. depth 2와 3이 같이 온다.
  it('깊이가 섞여 와도 그대로 돌려준다', async () => {
    apiFetch.mockResolvedValue(
      okJson({
        data: {
          comments: [
            { id: 54, authorId: 8, authorNickname: '협주', authorProfileImageUrl: '', content: 'ddd', createdAt: '2026-06-01T10:00:00', depth: 2, parentId: 34, hasChildren: true, childrenCount: 2 },
            { id: 55, authorId: 8, authorNickname: '협주', authorProfileImageUrl: '', content: '@협주 ㅇㅇㅇ', createdAt: '2026-06-01T11:00:00', depth: 3, parentId: 54, hasChildren: false, childrenCount: 0 },
          ],
        },
      })
    );

    const replies = await fetchReplies(34);

    expect(replies.map((reply) => reply.depth)).toEqual([2, 3]);
    expect(apiFetch).toHaveBeenCalledWith('/community/comments/34/replies');
  });
});

describe('totalCommentCount', () => {
  // commentCount = 부모 + 답글 합계. 글 36은 부모 2개인데 7이다.
  it('부모와 답글을 합친다', () => {
    expect(totalCommentCount(2, [4, 1])).toBe(7);
  });

  it('답글이 없으면 부모 수 그대로', () => {
    expect(totalCommentCount(3, [])).toBe(3);
  });
});

describe('createComment', () => {
  it('부모 댓글은 parentId를 안 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { id: 1 } }));

    await createComment(36, '안녕하세요');

    expect(apiFetch).toHaveBeenCalledWith('/community/posts/36/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '안녕하세요' }),
    });
  });

  it('답글은 parentId를 같이 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { id: 2 } }));

    await createComment(36, '@협주 네', 34);

    expect(apiFetch).toHaveBeenCalledWith('/community/posts/36/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '@협주 네', parentId: 34 }),
    });
  });

  it('앞뒤 공백은 떼고 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { id: 3 } }));

    await createComment(36, '  안녕  ');

    expect(apiFetch).toHaveBeenCalledWith('/community/posts/36/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '안녕' }),
    });
  });

  it('서버 문구를 그대로 살린다', async () => {
    apiFetch.mockResolvedValue(errJson(400, '차단한 사용자입니다'));

    await expect(createComment(36, 'x')).rejects.toThrow('차단한 사용자입니다');
  });
});

describe('deleteComment', () => {
  it('DELETE로 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({}));

    await deleteComment(55);

    expect(apiFetch).toHaveBeenCalledWith('/community/comments/55', { method: 'DELETE' });
  });
});

describe('reportPost', () => {
  // ⚠️ 게시글은 reasonCode(문자열)다. 상품만 reasonCodes(배열)다.
  it('reasonCode를 문자열로 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({}));

    await reportPost(36, 'SPAM_OR_AD');

    expect(apiFetch).toHaveBeenCalledWith('/reports/community-posts/36', {
      method: 'POST',
      body: JSON.stringify({ reasonCode: 'SPAM_OR_AD' }),
    });
  });

  it('상세 사유가 공백뿐이면 안 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({}));

    await reportPost(36, 'SPAM_OR_AD', '   ');

    expect(apiFetch).toHaveBeenCalledWith('/reports/community-posts/36', {
      method: 'POST',
      body: JSON.stringify({ reasonCode: 'SPAM_OR_AD' }),
    });
  });
});
```

- [ ] **Step 2: 시험이 실패하는지 본다**

Run: `cd mobile && npx jest lib/community.test.ts`
Expected: FAIL — `Cannot find module './community'`

- [ ] **Step 3: 구현한다**

`mobile/lib/community.ts`

```ts
import { apiFetch } from './auth/api';

// 커뮤니티 서버 호출을 한 곳에 모은다.
//
// 서버를 실물로 열어 확인한 것 넷 (2026-08-01):
//   1) commentCount는 부모 + 답글 합계다. 글 36은 7인데 부모 댓글은 2개다
//   2) 답글은 깊이를 안 나누고 평평하게 온다 (depth 2와 3이 한 목록에)
//   3) 댓글 목록에는 페이지가 없다. 한 번에 전부 온다
//   4) 댓글 신고·좋아요 API가 없다
//
// 응답 껍질이 API마다 다르다. 여기서 벗겨서 화면에는 알맹이만 준다.
//   글 목록   { data: { content, hasNext } }
//   댓글      { data: { comments } }        ← content가 아니다

/** 웹과 같은 두 갈래. 서버 BoardType enum이다 */
export type BoardType = 'QUESTION' | 'INFO';

const PAGE_SIZE = 10; // 웹 fetchInitialQuestionCommunity와 같은 값

export interface PostListItem {
  id: number;
  title: string;
  /** 내용 미리보기. 서버가 최대 100자로 잘라 준다 */
  contentPreview: string;
  thumbnailImageUrl: string | null;
  authorNickname: string;
  viewCount: number;
  /** ⚠️ 부모 댓글 + 답글 합계다 */
  commentCount: number;
  createdAt: string;
}

export interface PostDetail {
  id: number;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  title: string;
  /** 마크다운이다. 이미지도 이 안에 ![](url)로 들어 있다 */
  content: string;
  /**
   * ⚠️ 본문 마크다운에 들어 있는 것과 같은 사진들이다.
   * 본문을 그리면서 이것까지 따로 그리면 같은 사진이 두 번 나온다.
   */
  imageUrls: string[];
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

export interface CommentItem {
  id: number;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  /** 답글이면 "@닉네임 내용" 꼴일 수 있다. splitMention으로 가른다 */
  content: string;
  createdAt: string;
  /** 1=부모 댓글, 2 이상=답글 */
  depth: number;
  parentId: number | null;
  hasChildren: boolean;
  childrenCount: number;
}

export interface PostPage {
  content: PostListItem[];
  hasNext: boolean;
}

/** 오류 응답의 message를 꺼낸다. 못 읽으면 null. (lib/reports.ts와 같은 방식) */
async function readMessage(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { message?: string };
    return body?.message ?? null;
  } catch {
    return null;
  }
}

export async function fetchPosts(boardType: BoardType, page: number): Promise<PostPage> {
  const res = await apiFetch(`/community/posts?boardType=${boardType}&page=${page}&size=${PAGE_SIZE}`);
  if (!res.ok) throw new Error(`글 목록을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: { content?: PostListItem[]; hasNext?: boolean } };

  return {
    content: body.data?.content ?? [],
    hasNext: body.data?.hasNext ?? false,
  };
}

export async function fetchPostDetail(postId: number): Promise<PostDetail> {
  const res = await apiFetch(`/community/posts/${postId}`);
  if (!res.ok) throw new Error(`글을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data: Partial<PostDetail> & { id: number } };
  const data = body.data;

  return {
    id: data.id,
    authorId: data.authorId ?? 0,
    authorNickname: data.authorNickname ?? '',
    authorProfileImageUrl: data.authorProfileImageUrl ?? null,
    title: data.title ?? '',
    content: data.content ?? '',
    imageUrls: data.imageUrls ?? [],
    viewCount: data.viewCount ?? 0,
    commentCount: data.commentCount ?? 0,
    createdAt: data.createdAt ?? '',
  };
}

/** 부모 댓글만 온다. 답글은 fetchReplies로 따로 부른다 */
export async function fetchComments(postId: number): Promise<CommentItem[]> {
  const res = await apiFetch(`/community/posts/${postId}/comments`);
  if (!res.ok) throw new Error(`댓글을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: { comments?: CommentItem[] } };
  return body.data?.comments ?? [];
}

/**
 * 부모 댓글 하나 아래의 답글 전부.
 * ⚠️ 깊이를 안 나눈다 — depth 2(부모에 단 것)와 3(답글에 단 것)이 같이 온다.
 *    화면에서도 들여쓰기는 한 겹뿐이고, 대상은 본문의 @표시로 구분한다.
 */
export async function fetchReplies(commentId: number): Promise<CommentItem[]> {
  const res = await apiFetch(`/community/comments/${commentId}/replies`);
  if (!res.ok) throw new Error(`답글을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: { comments?: CommentItem[] } };
  return body.data?.comments ?? [];
}

/**
 * 헤더에 쓸 댓글 수.
 * 서버 commentCount와 같은 뜻이지만, 등록·삭제 직후에는 서버 값이 아직 옛것이라
 * 지금 화면에 있는 것으로 센다.
 */
export function totalCommentCount(parentCount: number, replyCounts: number[]): number {
  return parentCount + replyCounts.reduce((sum, count) => sum + count, 0);
}

export async function createComment(
  postId: number,
  content: string,
  parentId?: number
): Promise<void> {
  const trimmed = content.trim();
  const res = await apiFetch(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content: trimmed, ...(parentId ? { parentId } : {}) }),
  });

  if (!res.ok) {
    // 서버 문구를 그대로 살린다 — 차단·권한 같은 것을 화면이 구별해야 한다.
    const message = await readMessage(res);
    throw new Error(message ?? `댓글 등록에 실패했어요 (HTTP ${res.status})`);
  }
}

export async function deleteComment(commentId: number): Promise<void> {
  const res = await apiFetch(`/community/comments/${commentId}`, { method: 'DELETE' });
  if (!res.ok) {
    const message = await readMessage(res);
    throw new Error(message ?? `댓글 삭제에 실패했어요 (HTTP ${res.status})`);
  }
}

/**
 * 게시글 신고.
 * ⚠️ reasonCode(문자열)다. 상품 신고만 reasonCodes(배열)다 — lib/reports.ts 참고.
 */
export async function reportPost(
  postId: number,
  reasonCode: string,
  detailReason?: string
): Promise<void> {
  const detail = detailReason?.trim();
  const res = await apiFetch(`/reports/community-posts/${postId}`, {
    method: 'POST',
    body: JSON.stringify({ reasonCode, ...(detail ? { detailReason: detail } : {}) }),
  });

  if (!res.ok) {
    const message = await readMessage(res);
    throw new Error(message ?? `게시글 신고에 실패했어요 (HTTP ${res.status})`);
  }
}
```

- [ ] **Step 4: 시험이 통과하는지 본다**

Run: `cd mobile && npx jest lib/community.test.ts`
Expected: PASS — 19개

- [ ] **Step 4-1: 앱의 「이미 신고했다」 판별을 고친다 (#817)**

9바퀴에 넣은 판별이 서버가 주는 문구와 안 맞아 **한 번도 안 맞았다.**

```
mobile/lib/reports.ts:128   message.includes('이미 신고한')
서버 실제                    409 { "message": "이미 신고된 대상입니다." }
                            (ReportServiceImpl은 대상 이름을 담아 던지지만
                             GlobalExceptionHandler가 ErrorCode 문구로 갈아친다)
```

문구 대신 **상태 코드**를 본다. 지금 `postReport`가 `Response`를 `Error`로 바꾸며 상태를 잃으므로 함께 실어 보낸다.

`mobile/lib/reports.ts`

```ts
/** 서버가 준 상태 코드를 잃지 않으려고 따로 둔다 */
export class ReportError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ReportError';
  }
}
```

`postReport`의 throw를 바꾼다.

```ts
  if (!res.ok) {
    const message = await readMessage(res);
    throw new ReportError(message ?? `${label}에 실패했어요 (HTTP ${res.status})`, res.status);
  }
```

`blockUser`·`unblockUser`도 같은 식으로 바꾼다(상태가 필요해질 자리다).

그리고 판별을 상태 코드로.

```ts
/** ErrorCode.ALREADY_REPORTED(409) */
const ALREADY_REPORTED_STATUS = 409;

/**
 * 「이미 신고했다」인지 가려낸다.
 *
 * 문구로 가려내면 안 된다 — 서버는 대상 이름을 담아 던지지만
 * GlobalExceptionHandler가 그 문구를 버리고 ErrorCode의 한 줄만 준다.
 *
 *   ReportServiceImpl        "이미 신고된 " + targetName + "입니다."
 *   GlobalExceptionHandler   new ErrorResponse(e.getErrorCode(), traceId)   ← 위 문구를 버린다
 *   실제 응답                 409 { "message": "이미 신고된 대상입니다." }
 *
 * 9바퀴에는 '이미 신고한'을 찾고 있어서 한 번도 안 맞았다 (#817).
 * 웹도 같은 문제를 #808에서 409 기준으로 고쳤다(src/lib/api/reportErrors.ts).
 */
export function isAlreadyReported(error: unknown): boolean {
  return error instanceof ReportError && error.status === ALREADY_REPORTED_STATUS;
}
```

`lib/community.ts`의 `reportPost`도 같은 `ReportError`를 던지게 한다 — 게시글 신고에서도 중복 판별이 필요하다.

**시험을 더한다** (`mobile/lib/reports.test.ts`)

```ts
describe('isAlreadyReported', () => {
  it('409면 참이다', () => {
    expect(isAlreadyReported(new ReportError('이미 신고된 대상입니다.', 409))).toBe(true);
  });

  it('다른 상태면 거짓이다', () => {
    expect(isAlreadyReported(new ReportError('서버 오류', 500))).toBe(false);
  });

  it('문구만 비슷한 보통 오류는 거짓이다', () => {
    // 예전에는 문구로 가려내서 이런 것도 참이 될 수 있었다
    expect(isAlreadyReported(new Error('이미 신고한 상품입니다'))).toBe(false);
  });

  it('서버가 실제로 주는 문구로도 참이다', () => {
    // 「이미 신고한」이 아니라 「이미 신고된」이다. 문구 판별이 안 맞던 이유
    expect(isAlreadyReported(new ReportError('이미 신고된 대상입니다.', 409))).toBe(true);
  });
});
```

기존 신고 시험 중 오류를 `new Error(...)`로 만들던 것이 있으면 `ReportError`로 바꾼다. 타입체크가 잡아 준다.

- [ ] **Step 5: 게이트**

Run: `pnpm gate:mobile` (저장소 루트에서)
Expected: 154 + 19 + 4 = 177개 통과 · tsc·lint 오류 0

- [ ] **Step 6: 커밋**

```bash
git add mobile/lib/community.ts mobile/lib/community.test.ts
git commit -m "feat(mobile): 커뮤니티 API (#812)

서버를 실물로 열어 확인한 것을 시험에 못 박았다.
- 댓글 껍질이 { data: { comments } }다 (content가 아니다)
- 답글은 깊이를 안 나누고 평평하게 온다 (depth 2와 3이 한 목록에)
- commentCount는 부모 + 답글 합계다
- 게시글 신고는 reasonCode(문자열)다. 상품만 배열이다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 7: 마크다운 라이브러리를 설치하고 실제로 그려본다

**Files:**
- Modify: `mobile/package.json`
- Create: `mobile/components/community/post-body.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `PostBody({ content }: { content: string })`

**이 과제는 갈림길이다.** 라이브러리가 안 돌면 여기서 바로 갈아탄다. 뒤 과제로 끌고 가지 않는다.

- [ ] **Step 1: 설치한다**

```bash
cd mobile && npx expo install react-native-marked
```

> `npx expo install`을 쓴다(`pnpm add`가 아니라). Expo가 SDK 54에 맞는 버전을 골라 준다.
> 조건은 맞다 — peer가 `react-native >= 0.76`(우리는 0.81.5) · `react-native-svg >= 12.3`(우리는 15.12.1, 이미 있다).

- [ ] **Step 2: 본문 조각을 만든다**

`mobile/components/community/post-body.tsx`

```tsx
import Markdown from 'react-native-marked';
import { Linking } from 'react-native';

// 게시글 본문. 서버가 마크다운으로 준다.
//
// 웹 MdPreview.tsx가 정한 모양을 그대로 옮긴다. 웹과 앱이 같은 글을 다르게
// 보여주면 안 된다.
//
// ⚠️ 이미지는 본문 안에 ![](url)로 들어 있다. 상세 응답의 imageUrls에도 같은 것이
//    오는데, 그것까지 따로 그리면 같은 사진이 두 번 나온다. 본문만 그린다.

interface PostBodyProps {
  content: string;
}

export function PostBody({ content }: PostBodyProps) {
  return (
    <Markdown
      value={content}
      flatListProps={{
        // 상세 화면이 이미 ScrollView 안이라 스스로 스크롤하면 안 된다
        scrollEnabled: false,
        contentContainerStyle: { paddingHorizontal: 16 },
      }}
      styles={{
        h1: { fontSize: 24, fontWeight: '600', marginTop: 8, marginBottom: 8, color: '#111827' },
        h2: { fontSize: 20, fontWeight: '600', marginTop: 8, marginBottom: 8, color: '#111827' },
        h3: { fontSize: 18, fontWeight: '600', marginTop: 8, marginBottom: 4, color: '#111827' },
        paragraph: { fontSize: 15, lineHeight: 22, marginVertical: 6, color: '#111827' },
        li: { fontSize: 15, lineHeight: 22, color: '#111827' },
        link: { color: '#2563EB', textDecorationLine: 'underline' },
        code: { backgroundColor: '#F3F4F6', borderRadius: 4, paddingHorizontal: 4 },
        blockquote: { borderLeftWidth: 4, borderLeftColor: '#D1D5DB', paddingLeft: 12 },
        image: { width: '100%', borderRadius: 8, marginVertical: 8 },
      }}
      // 링크는 앱 밖 브라우저로 연다 (웹도 target="_blank"다)
      onLinkPress={(url) => {
        Linking.openURL(url);
        return true;
      }}
    />
  );
}
```

> `react-native-marked`의 정확한 prop 이름(`styles` 키 이름 등)은 **설치된 버전의 타입 정의를 열어 확인한다**:
> `cat mobile/node_modules/react-native-marked/dist/index.d.ts | head -60`
> 위 코드의 키가 다르면 타입에 있는 이름으로 맞춘다. 타입체크가 잡아 준다.

- [ ] **Step 3: 실기기에서 실제로 그려본다**

임시로 홈 화면(`mobile/app/(tabs)/(home)/index.tsx`) 맨 위에 넣어 본다.

```tsx
import { PostBody } from '@/components/community/post-body';

// 임시 확인용 — 확인 뒤 지운다
const SAMPLE = `# 제목

**굵게** 와 *기울임* 과 \`코드\`.

- 목록 하나
- 목록 둘

[링크](https://cuddle-market.vercel.app)

![사진](https://picsum.photos/400/200)

> 인용문
`;

// 화면 맨 위에: <PostBody content={SAMPLE} />
```

Run: `cd mobile && pnpm expo start` → 실기기 Expo Go로 확인

```
□ 제목·굵게·기울임·코드가 각각 다르게 보인다
□ 목록에 점이 붙는다
□ 링크를 누르면 브라우저가 열린다
□ 사진이 폭에 맞게 보인다
□ 인용문에 왼쪽 선이 있다
□ 앱이 튕기지 않는다
```

- [ ] **Step 4: 갈림길 판단**

**돌면** → 임시 코드를 지우고 Step 5로.

**안 돌면** (설치 실패 · 화면 튕김 · React 19 오류) → 라이브러리를 지우고 직접 만든다.

```bash
cd mobile && pnpm remove react-native-marked
```

직접 만드는 안: `post-body.tsx`를 아래로 바꾼다. 웹 도구모음이 만드는 것만 처리한다(제목·굵게·기울임·코드·링크·목록·이미지). 표·인용문은 기호가 그대로 보인다 — 그건 받아들인다.

```tsx
import { Image } from 'expo-image';
import { Linking, StyleSheet, Text, View } from 'react-native';

// 직접 만든 마크다운 그리기. react-native-marked가 안 돌아서 만든 것이다.
// 웹 편집기 도구모음(useMdCommands.ts)이 만드는 것만 처리한다.

interface PostBodyProps {
  content: string;
}

const IMAGE = /^!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)$/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^(\d+)\.\s+(.*)$/;

export function PostBody({ content }: PostBodyProps) {
  const lines = content.split('\n');

  return (
    <View style={styles.body}>
      {lines.map((line, index) => {
        const image = line.match(IMAGE);
        if (image) {
          return (
            <Image
              key={index}
              source={{ uri: image[1] }}
              style={styles.image}
              contentFit="cover"
            />
          );
        }

        const heading = line.match(HEADING);
        if (heading) {
          const level = heading[1].length;
          return (
            <Text key={index} style={[styles.heading, HEADING_SIZE[level]]}>
              {heading[2]}
            </Text>
          );
        }

        const bullet = line.match(BULLET);
        if (bullet) {
          return (
            <Text key={index} style={styles.listItem}>
              {'•  '}
              {renderInline(bullet[1])}
            </Text>
          );
        }

        const numbered = line.match(NUMBERED);
        if (numbered) {
          return (
            <Text key={index} style={styles.listItem}>
              {numbered[1]}.  {renderInline(numbered[2])}
            </Text>
          );
        }

        if (line.trim() === '') return <View key={index} style={styles.gap} />;

        return (
          <Text key={index} style={styles.paragraph}>
            {renderInline(line)}
          </Text>
        );
      })}
    </View>
  );
}

const HEADING_SIZE: Record<number, { fontSize: number }> = {
  1: { fontSize: 24 },
  2: { fontSize: 20 },
  3: { fontSize: 18 },
};

/** 한 줄 안의 **굵게** · *기울임* · `코드` · [링크](주소) */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={index} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <Text key={index} style={styles.italic}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Text key={index} style={styles.code}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <Text key={index} style={styles.link} onPress={() => Linking.openURL(link[2])}>
          {link[1]}
        </Text>
      );
    }
    return part;
  });
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, gap: 2 },
  heading: { fontWeight: '600', color: '#111827', marginTop: 8, marginBottom: 4 },
  paragraph: { fontSize: 15, lineHeight: 22, color: '#111827' },
  listItem: { fontSize: 15, lineHeight: 22, color: '#111827', paddingLeft: 8 },
  gap: { height: 8 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  code: { backgroundColor: '#F3F4F6', fontFamily: 'monospace' },
  link: { color: '#2563EB', textDecorationLine: 'underline' },
  image: { width: '100%', height: 200, borderRadius: 8, marginVertical: 8 },
});
```

- [ ] **Step 5: 임시 코드를 지운다**

`mobile/app/(tabs)/(home)/index.tsx`에서 `SAMPLE`과 `<PostBody …>`를 지운다.

- [ ] **Step 6: 게이트**

Run: `pnpm gate:mobile`
Expected: 173개 통과 · 오류 0

- [ ] **Step 7: 커밋**

```bash
git add mobile/package.json mobile/components/community/post-body.tsx
# 라이브러리를 썼다면 잠금 파일도
git add pnpm-lock.yaml
git commit -m "feat(mobile): 마크다운 본문 조각 (#812)

웹 MdPreview가 정한 모양을 그대로 옮겼다. 실기기에서 제목·굵게·목록·링크·
사진·인용문을 실제로 그려 확인했다.

이미지는 본문 마크다운 안에 있는 것만 그린다. 상세 응답의 imageUrls에도
같은 사진이 오는데 둘 다 그리면 두 번 나온다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 8: 커뮤니티 탭과 목록 화면

**Files:**
- Create: `mobile/app/(tabs)/(community)/_layout.tsx`
- Create: `mobile/app/(tabs)/(community)/index.tsx`
- Create: `mobile/components/community/post-card.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `fetchPosts` · `PostListItem` · `BoardType` (Task 6)
- Produces: `/(tabs)/(community)` 경로 · `PostCard({ post }: { post: PostListItem })`

- [ ] **Step 1: 탭을 더한다**

`mobile/app/(tabs)/_layout.tsx`

**① import에 `Users`를 더한다** (5번째 줄)

```tsx
import { Home, Users, UserRound } from 'lucide-react-native';
```

**② `(home)`과 `(my)` 사이에 넣는다**

```tsx
<Tabs.Screen
  name="(community)"
  options={{
    title: '커뮤니티',
    tabBarIcon: ({ color }) => (
      <Users size={TAB_ICON_SIZE} color={color} strokeWidth={TAB_ICON_STROKE} />
    ),
  }}
/>
```

> 순서가 웹 BottomNav과 같다 — 홈 → 커뮤니티 → (플레이스·채팅은 13·14바퀴) → 마이.
> 아이콘도 웹과 같은 Lucide `Users`다.
> 게스트를 막지 않는다. 읽기는 로그인 없이 된다.

- [ ] **Step 2: 스택을 만든다**

`mobile/app/(tabs)/(community)/_layout.tsx`

```tsx
import { Stack } from 'expo-router';

// 화면마다 headerShown을 적지 않는다 — 새 화면을 더할 때 빠뜨린다.
// (home) 스택도 8바퀴에 같은 이유로 screenOptions로 바꿨다.
export default function CommunityLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: 목록 한 줄을 만든다**

`mobile/components/community/post-card.tsx`

```tsx
import { getTimeAgo } from '@cuddle/shared';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { PostListItem } from '@/lib/community';

// 목록 한 줄. 웹 커뮤니티 목록과 같은 재료를 쓴다 —
// 제목 · 내용 미리보기 · 작성자 · 시간 · 조회 · 댓글 수 · 오른쪽 썸네일.

interface PostCardProps {
  post: PostListItem;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        {post.contentPreview ? (
          <Text style={styles.preview} numberOfLines={2}>
            {post.contentPreview}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          {post.authorNickname} · {getTimeAgo(post.createdAt)} · 조회 {post.viewCount} · 댓글{' '}
          {post.commentCount}
        </Text>
      </View>

      {/* CDN 이미지라 expo-image를 쓴다. 없으면 자리도 안 만든다 */}
      {post.thumbnailImageUrl ? (
        <Image source={{ uri: post.thumbnailImageUrl }} style={styles.thumb} contentFit="cover" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  text: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  preview: { fontSize: 14, lineHeight: 20, color: '#6B7280' },
  meta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  thumb: { width: 76, height: 76, borderRadius: 8, backgroundColor: '#F3F4F6' },
});
```

- [ ] **Step 4: 목록 화면을 만든다**

`mobile/app/(tabs)/(community)/index.tsx`

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/community/post-card';
import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { StatusFilterChips, type FilterChip } from '@/components/my/status-filter-chips';
import { AppHeader } from '@/components/ui/app-header';
import { fetchPosts, type BoardType, type PostListItem } from '@/lib/community';

// 커뮤니티 목록.
//
// 검색·정렬은 이번 바퀴에서 뺐다(설계 §2). 서버는 받지만 읽기+댓글이 목표다.

/**
 * 질문/정보 두 갈래. 웹 커뮤니티 탭과 같다.
 * 마이 목록·판매자 프로필과 같은 칩 조각을 쓴다 — 앱 안에서 「목록 위에서 고르는 줄」이
 * 두 모양이면 안 된다.
 */
const BOARD_CHIPS: FilterChip<BoardType>[] = [
  { id: 'QUESTION', label: '질문' },
  { id: 'INFO', label: '정보' },
];

export default function CommunityListScreen() {
  const router = useRouter();
  const [boardType, setBoardType] = useState<BoardType>('QUESTION');

  const {
    data: pages,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['communityPosts', boardType],
    queryFn: ({ pageParam }) => fetchPosts(boardType, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  const posts: PostListItem[] = pages?.pages.flatMap((page) => page.content) ?? [];

  const renderList = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title="글을 불러오지 못했어요." />;
    if (posts.length === 0) {
      return <EmptyState title="아직 글이 없어요." description="첫 글을 기다리고 있어요." />;
    }

    return (
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/(community)/posts/${item.id}`)}
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            <PostCard post={item} />
          </Pressable>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={<ListFooter loading={isFetchingNextPage} />}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* AppHeader는 left를 받는다. 문자열이면 제목으로 그린다(홈은 로고 이미지를 넘긴다) */}
      <AppHeader left="커뮤니티" />
      <StatusFilterChips chips={BOARD_CHIPS} activeId={boardType} onChange={setBoardType} />
      {renderList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  list: { paddingHorizontal: 16 },
  pressed: { opacity: 0.6 },
});
```

> `AppHeader`는 8바퀴에 만든 것이고 주석에 「커뮤니티 탭이 생겨도 이 조각을 그대로 쓴다」고 적혀 있다. 햄버거·알림 종·안 읽은 개수를 스스로 그린다 — 여기서는 `left`만 넘긴다.

- [ ] **Step 5: 게이트**

Run: `pnpm gate:mobile`
Expected: 오류 0

- [ ] **Step 6: 실기기로 확인한다**

```
□ 하단 탭이 홈 · 커뮤니티 · 마이 셋이다
□ 커뮤니티를 누르면 목록이 뜬다
□ 질문/정보를 바꾸면 목록이 바뀐다
□ 아래로 내리면 더 불러온다 (질문 28개)
□ 로그아웃 상태에서도 목록이 보인다
□ 글을 누르면 (아직 화면이 없어) 빈 화면이 뜬다 — Task 9에서 만든다
```

- [ ] **Step 7: 커밋**

```bash
git add mobile/app/\(tabs\)/ mobile/components/community/post-card.tsx
git commit -m "feat(mobile): 커뮤니티 탭과 목록 (#812)

탭 순서와 아이콘을 웹 BottomNav과 같게 뒀다 (홈 → 커뮤니티 → 마이,
Lucide Users). 13·14바퀴에 플레이스·채팅이 그 사이에 끼면 웹과 똑같은
다섯이 된다.

질문/정보 칩은 마이 목록·판매자 프로필과 같은 조각을 쓴다.
게스트도 읽을 수 있다 — 서버가 비회원 조회를 허용한다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 9: 상세 화면과 게시글 신고

**Files:**
- Create: `mobile/app/(tabs)/(community)/posts/[id].tsx`
- Create: `mobile/app/(tabs)/(community)/users/[id].tsx`
- Modify: `mobile/app/report.tsx`

**Interfaces:**
- Consumes: `fetchPostDetail` · `PostDetail` (Task 6) · `PostBody` (Task 7) · `ProductActionSheet` · `SheetAction`
- Produces: `/(tabs)/(community)/posts/[id]` 경로

- [ ] **Step 1: 신고 화면이 게시글도 받게 한다**

`mobile/app/report.tsx`

**① import에 사유를 더한다** (1번째 줄)

```tsx
import { COMMUNITY_REPORT_REASON, PRODUCT_REPORT_REASON, USER_REPORT_REASON } from '@cuddle/shared';
```

**② `reportPost`를 가져온다**

```tsx
import { reportPost } from '@/lib/community';
```

**③ kind에 'post'를 더한다** (35~43번째 줄)

```tsx
const { kind, id, name } = useLocalSearchParams<{
  kind: 'product' | 'user' | 'post';
  id: string;
  name?: string;
}>();

const targetId = Number(id);
const reasons =
  kind === 'product'
    ? PRODUCT_REPORT_REASON
    : kind === 'post'
      ? COMMUNITY_REPORT_REASON
      : USER_REPORT_REASON;
```

`const isProduct = kind === 'product';`는 그대로 둔다 — 아래에서 아직 쓴다.

**④ 보내는 곳을 늘린다** (53~58번째 줄)

```tsx
if (kind === 'product') {
  await reportProduct(targetId, reasonCode, detail);
} else if (kind === 'post') {
  await reportPost(targetId, reasonCode, detail);
} else {
  await reportUser(targetId, reasonCode, detail);
}
```

**⑤ 제목과 안내 문구를 늘린다** (93·97~101번째 줄)

```tsx
<Text style={styles.heading}>
  {kind === 'product' ? '상품 신고하기' : kind === 'post' ? '게시글 신고하기' : '사용자 신고하기'}
</Text>
```

```tsx
{name ? (
  <Text style={styles.description}>
    {kind === 'product'
      ? `"${name}" 상품을 신고합니다.`
      : kind === 'post'
        ? `"${name}" 게시글을 신고합니다.`
        : `${name}님을 신고합니다.`}
  </Text>
) : null}
```

**⑥ 「이미 신고했다」 문구를 늘린다** (69~75번째 줄)

```tsx
showToast(
  already
    ? kind === 'product'
      ? '이미 신고한 상품입니다'
      : kind === 'post'
        ? '이미 신고한 게시글입니다'
        : '이미 신고한 사용자입니다'
    : '신고에 실패했습니다'
);
```

- [ ] **Step 2: 작성자 프로필을 커뮤니티 스택에도 둔다**

`mobile/app/(tabs)/(community)/users/[id].tsx`

```tsx
// 판매자 프로필 화면을 커뮤니티 스택에도 둔다.
//
// 화면을 한 스택에만 두면 다른 탭에서 갈 때 탭이 튄다(9바퀴에 겪었다).
// (home)·(my)에 이어 세 번째 사본이다. 알맹이는 (home) 것 하나뿐이다.
export { default } from '../../(home)/users/[id]';
```

**그리고 원본이 커뮤니티 그룹도 알게 한다.** `mobile/app/(tabs)/(home)/users/[id].tsx`의 54~55번째 줄:

```tsx
const segments = useSegments() as string[];
const group = segments.includes('(my)')
  ? '(my)'
  : segments.includes('(community)')
    ? '(community)'
    : '(home)';
```

> ⚠️ 커뮤니티 그룹에는 `posts/[id]`는 있어도 `products/[id]`가 없다. 프로필 화면이 상품을 누를 때 `/(tabs)/(community)/products/…`로 가면 경로가 없다.
> 그래서 **상품으로 갈 때는 커뮤니티에서 왔어도 `(home)`으로 보낸다.** 목록 렌더 부분(160번째 줄)을 이렇게 바꾼다:
>
> ```tsx
> onPress={() => {
>   // 커뮤니티 스택에는 상품 상세가 없다. 홈 스택으로 보낸다.
>   const target = group === '(community)' ? '(home)' : group;
>   router.push(`/(tabs)/${target}/products/${item.id}`);
> }}
> ```

- [ ] **Step 3: 상세 화면을 만든다**

`mobile/app/(tabs)/(community)/posts/[id].tsx`

```tsx
import { getTimeAgo } from '@cuddle/shared';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, EllipsisVertical, MessageSquare } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostBody } from '@/components/community/post-body';
import { ErrorState, LoadingState } from '@/components/list-states';
import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import { useMe } from '@/hooks/use-me';
import { fetchPostDetail } from '@/lib/community';

// 게시글 상세. 읽기만 한다 — 고치기·지우기는 12바퀴다.
//
// 댓글은 여기 안 그린다. 「댓글 7 ›」 줄만 두고 루트 스택의 댓글 화면으로 보낸다.
// 하단 입력창과 탭바가 겹쳐서다(설계 §4-2).

const HEADER_HEIGHT = 52; // 앱의 다른 헤더와 같은 값

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);

  const { data: me } = useMe();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const {
    data: post,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['communityPost', postId],
    queryFn: () => fetchPostDetail(postId),
  });

  const isMine = Boolean(me && post && me.id === post.authorId);

  /** ⋮ 는 신고 하나뿐이다. 차단은 프로필 쪽에 있고, 글 지우기는 12바퀴다 */
  const sheetActions: SheetAction[] = post
    ? [
        {
          label: '게시글 신고하기',
          onPress: () => {
            setIsSheetOpen(false);
            router.push({
              pathname: '/report',
              params: { kind: 'post', id: String(postId), name: post.title },
            });
          },
        },
      ]
    : [];

  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError || !post) {
      return <ErrorState onRetry={() => refetch()} title="글을 불러오지 못했어요." />;
    }

    return (
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{post.title}</Text>

        <Pressable
          style={({ pressed }) => [styles.author, pressed && styles.pressed]}
          onPress={() => router.push(`/(tabs)/(community)/users/${post.authorId}`)}
          accessibilityRole="button"
          accessibilityLabel={`${post.authorNickname}님의 프로필`}
        >
          {post.authorProfileImageUrl ? (
            <Image source={{ uri: post.authorProfileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{post.authorNickname.slice(0, 1)}</Text>
            </View>
          )}
          <Text style={styles.meta}>
            {post.authorNickname} · {getTimeAgo(post.createdAt)} · 조회 {post.viewCount}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        {/* 이미지는 본문 안에 있다. imageUrls를 또 그리면 두 번 나온다 */}
        <PostBody content={post.content} />

        <Pressable
          style={({ pressed }) => [styles.commentsRow, pressed && styles.pressed]}
          onPress={() =>
            router.push({ pathname: '/post-comments', params: { postId: String(postId) } })
          }
          accessibilityRole="button"
        >
          <View style={styles.commentsLabel}>
            <MessageSquare size={18} color="#111827" />
            <Text style={styles.commentsText}>댓글 {post.commentCount}</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </Pressable>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <ChevronLeft size={26} color="#111827" />
        </Pressable>

        {/* 내 글에는 ⋮ 를 안 그린다 — 나를 신고할 이유가 없다 */}
        {post && !isMine ? (
          <Pressable
            onPress={() => setIsSheetOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="더보기"
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            <EllipsisVertical size={24} color="#111827" />
          </Pressable>
        ) : null}
      </View>

      {renderBody()}

      <ProductActionSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        actions={sheetActions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  body: { paddingBottom: 32 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  author: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 14, color: '#6B7280' },
  meta: { fontSize: 13, color: '#6B7280' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginBottom: 16 },
  commentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  commentsLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentsText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  pressed: { opacity: 0.6 },
});
```

- [ ] **Step 4: 게이트**

Run: `pnpm gate:mobile`

- [ ] **Step 5: 실기기로 확인한다**

```
□ 글을 누르면 상세가 뜬다 (제목 · 작성자 · 본문 · 사진)
□ 본문 사진이 한 번만 나온다
□ 작성자를 누르면 프로필로 간다 · 뒤로가기로 돌아온다 · 탭이 안 튄다
□ 프로필에서 상품을 누르면 홈 스택 상세로 간다 (빈 화면이 아니다)
□ ⋮ → 게시글 신고하기 → 사유 5개가 나온다 → 제출하면 접수된다
□ 내 글에는 ⋮ 가 없다
□ 「댓글 7 ›」은 아직 눌러도 빈 화면이다 — Task 10에서 만든다
```

- [ ] **Step 6: 커밋**

```bash
git add mobile/app/ mobile/components/
git commit -m "feat(mobile): 커뮤니티 상세와 게시글 신고 (#812)

상세는 읽기만 한다. 댓글은 「댓글 N ›」 줄만 두고 루트 스택 화면으로 보낸다 —
하단 입력창과 탭바가 겹쳐서다.

신고 화면(9바퀴)이 게시글도 받게 넓혔다. 사유는 COMMUNITY_REPORT_REASON이고
게시글은 reasonCode(문자열)다.

작성자 프로필 화면을 커뮤니티 스택에도 뒀다 — 한 스택에만 두면 탭이 튄다.
단 커뮤니티 스택에는 상품 상세가 없어서, 프로필에서 상품을 누르면 홈으로 보낸다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 10: 댓글 화면 (읽기)

**Files:**
- Create: `mobile/app/post-comments.tsx`
- Create: `mobile/components/community/comment-row.tsx`

**Interfaces:**
- Consumes: `fetchComments` · `fetchReplies` · `totalCommentCount` · `CommentItem` (Task 6) · `splitMention` (Task 1)
- Produces: `/post-comments?postId=36` 경로 · `CommentRow({ comment, isReply, onReply, onMenu })`

- [ ] **Step 1: 댓글 한 줄을 만든다**

`mobile/components/community/comment-row.tsx`

```tsx
import { getTimeAgo, splitMention } from '@cuddle/shared';
import { Image } from 'expo-image';
import { EllipsisVertical } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CommentItem } from '@/lib/community';

// 댓글·답글 한 줄. 웹 CommentItem과 같은 재료·같은 숫자를 쓴다.
//   닉네임 14 · 본문 15 · 멘션 14 · 답글 상자 패딩 14
//
// 답글은 들여쓰기 + 옅은 상자로만 구분한다. 서버가 깊이를 안 나누고 평평하게 주므로
// 들여쓰기도 한 겹뿐이다 — 답글의 답글도 같은 자리에 온다.

interface CommentRowProps {
  comment: CommentItem;
  isReply?: boolean;
  /** 내 댓글이면 ⋮ 에 삭제, 남의 것이면 신고가 뜬다 */
  onMenu: () => void;
  onReply: () => void;
  isMine: boolean;
}

export function CommentRow({ comment, isReply = false, onMenu, onReply, isMine }: CommentRowProps) {
  const { mention, rest } = splitMention(comment.content);

  return (
    <View style={[styles.row, isReply && styles.replyRow]}>
      {comment.authorProfileImageUrl ? (
        <Image source={{ uri: comment.authorProfileImageUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>{comment.authorNickname.slice(0, 1)}</Text>
        </View>
      )}

      <View style={styles.main}>
        <View style={styles.nameLine}>
          <Text style={styles.name}>{comment.authorNickname}</Text>
          {isMine ? <Text style={styles.mineBadge}>내 댓글</Text> : null}
        </View>

        <Text style={styles.content}>
          {mention ? <Text style={styles.mention}>{mention}</Text> : null}
          {rest}
        </Text>

        <View style={styles.metaLine}>
          <Text style={styles.time}>{getTimeAgo(comment.createdAt)}</Text>
          <Text style={styles.dot}>·</Text>
          <Pressable onPress={onReply} hitSlop={8} accessibilityRole="button">
            <Text style={styles.action}>답글 달기</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={onMenu}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="더보기"
        style={({ pressed }) => (pressed ? styles.pressed : undefined)}
      >
        <EllipsisVertical size={18} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
  },
  replyRow: {
    marginLeft: 40,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f6f3f2', // 웹 --color-surface-container-low
  },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 14, color: '#6B7280' },
  main: { flex: 1, gap: 4 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  mineBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#ecc88e', // 웹 --color-primary-200
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  content: { fontSize: 15, lineHeight: 21, color: '#111827' }, // 웹 leading-snug(1.375)와 같은 비율
  mention: { fontSize: 14, color: '#825500' }, // 웹 --color-primary-container
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontSize: 12, color: '#9CA3AF' },
  dot: { fontSize: 12, color: '#9CA3AF' },
  action: { fontSize: 12, fontWeight: '500', color: '#825500' },
  pressed: { opacity: 0.5 },
});
```

> 색 값은 `src/styles/tokens.colors.css`에서 확인한 실제 값이다(`globals.css`가 아니다).
> 앱 색 토큰 체계는 #786에서 따로 다룬다. 지금은 웹 값을 그대로 적는다.

- [ ] **Step 2: 댓글 화면을 만든다 (읽기까지만)**

`mobile/app/post-comments.tsx`

```tsx
import { useQueries, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommentRow } from '@/components/community/comment-row';
import { EmptyState, ErrorState, LoadingState } from '@/components/list-states';
import { useMe } from '@/hooks/use-me';
import {
  fetchComments,
  fetchReplies,
  totalCommentCount,
  type CommentItem,
} from '@/lib/community';

// 댓글 화면.
//
// 왜 루트 스택인가 (탭 안이 아니라):
// 하단에 입력창을 고정해야 하는데 탭 안에 두면 탭바와 두 겹이 된다.
// 9바퀴 신고 화면이 같은 이유로 루트에 있다 — "루트 스택에 둔다, 탭바까지 덮어야 한다".
// 탭 안에 두고 탭바를 숨겼다 되돌리는 것보다 이쪽이 함정이 없다.
//
// 답글은 처음부터 펼친다. 실측 근거는 설계 §3-2에 있다 (요청 최대 3번 · +50ms).

const HEADER_HEIGHT = 52;

/** 화면에 그릴 줄. 부모와 답글을 한 줄기로 편다 */
interface Row {
  comment: CommentItem;
  isReply: boolean;
}

export default function PostCommentsScreen() {
  const router = useRouter();
  const { postId: postIdParam } = useLocalSearchParams<{ postId: string }>();
  const postId = Number(postIdParam);

  const { data: me } = useMe();

  const {
    data: parents,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  });

  // 답글 있는 부모마다 따로 부른다. 서버가 목록에 답글을 안 담아 준다.
  const parentsWithReplies = (parents ?? []).filter((comment) => comment.hasChildren);

  const replyQueries = useQueries({
    queries: parentsWithReplies.map((comment) => ({
      queryKey: ['replies', comment.id],
      queryFn: () => fetchReplies(comment.id),
    })),
  });

  const repliesByParent = new Map<number, CommentItem[]>(
    parentsWithReplies.map((comment, index) => [comment.id, replyQueries[index]?.data ?? []])
  );

  const failedParents = new Set<number>(
    parentsWithReplies
      .filter((_, index) => replyQueries[index]?.isError)
      .map((comment) => comment.id)
  );

  /** 부모 → 그 답글들 → 다음 부모 … 순으로 편다 */
  const rows: Row[] = (parents ?? []).flatMap((parent) => [
    { comment: parent, isReply: false },
    ...(repliesByParent.get(parent.id) ?? []).map((reply) => ({ comment: reply, isReply: true })),
  ]);

  const count = totalCommentCount(
    parents?.length ?? 0,
    [...repliesByParent.values()].map((replies) => replies.length)
  );

  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title="댓글을 불러오지 못했어요." />;
    if (rows.length === 0) {
      return <EmptyState title="첫 댓글을 남겨보세요." description="" />;
    }

    return (
      <FlatList
        data={rows}
        keyExtractor={(row) => String(row.comment.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <>
            <CommentRow
              comment={item.comment}
              isReply={item.isReply}
              isMine={Boolean(me && me.id === item.comment.authorId)}
              onMenu={() => {}}
              onReply={() => {}}
            />
            {/* 답글을 못 불러온 부모 아래에만 한 줄. 나머지 댓글은 그대로 보인다 */}
            {!item.isReply && failedParents.has(item.comment.id) ? (
              <Text style={styles.replyError}>답글을 불러오지 못했어요.</Text>
            ) : null}
          </>
        )}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <ChevronLeft size={26} color="#111827" />
        </Pressable>
        <Text style={styles.heading}>댓글 {count}</Text>
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  heading: { fontSize: 18, fontWeight: '700', color: '#111827' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  replyError: { marginLeft: 40, marginBottom: 8, fontSize: 12, color: '#9CA3AF' },
  pressed: { opacity: 0.5 },
});
```

> `onMenu`·`onReply`는 지금 빈 함수다. Task 11·12에서 채운다. 이 과제는 **읽기까지**다.

- [ ] **Step 3: 게이트**

Run: `pnpm gate:mobile`

- [ ] **Step 4: 실기기로 확인한다**

```
□ 「댓글 7 ›」을 누르면 「← 댓글 7」 화면이 뜬다
□ 탭바가 안 보인다
□ 답글이 처음부터 펼쳐져 있다 (들여쓰기 + 옅은 상자)
□ 답글 본문 맨 앞 @닉네임이 색이 다르다
□ 내 댓글에 「내 댓글」 표가 붙는다
□ 헤더 숫자가 부모+답글 합계다 (글 36이면 7)
□ 댓글이 없는 글은 "첫 댓글을 남겨보세요."가 뜬다
□ 뒤로가기로 상세로 돌아온다
```

- [ ] **Step 5: 커밋**

```bash
git add mobile/app/post-comments.tsx mobile/components/community/comment-row.tsx
git commit -m "feat(mobile): 댓글 화면 읽기 (#812)

루트 스택에 뒀다 — 하단 입력창과 탭바가 겹치지 않게. 9바퀴 신고 화면과
같은 판단이다.

답글은 처음부터 펼친다. 부모 → 그 답글들 → 다음 부모 순으로 한 줄기로 펴서
FlatList 하나로 그린다. 서버가 답글을 깊이 구분 없이 주므로 들여쓰기도 한 겹이다.

답글만 못 불러오면 그 부모 아래에 한 줄만 안내하고 나머지 댓글은 그대로 둔다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 11: 댓글·답글 쓰기

**Files:**
- Create: `mobile/components/community/comment-input.tsx`
- Modify: `mobile/app/post-comments.tsx`

**Interfaces:**
- Consumes: `createComment` (Task 6) · `CommentRow` (Task 10)
- Produces: `CommentInput({ replyTo, onCancelReply, onSubmit, submitting })`

- [ ] **Step 1: 입력창 조각을 만든다**

`mobile/components/community/comment-input.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// 화면 맨 아래 입력창. 댓글도 답글도 여기서 쓴다.
//
// 답글을 달 때 화면을 바꾸지 않는다(오늘의집 방식). 당근은 답글 전용 화면으로
// 넘어가고 우리 웹 모바일도 그랬는데, 그러면 방금 읽던 답글이 눈에서 사라진다.
// 여기서는 위에 「협주님에게 답글 남기는 중 · 취소」 띠만 뜬다.
//
// @닉네임은 입력칸에 미리 채우고 지울 수 있게 둔다 — 웹·오늘의집과 같다.
// 서버에 멘션 필드가 없어 글자에 섞여 저장되기 때문에, 사용자가 손댈 수 있어야 한다.

export interface ReplyTarget {
  /** 답글이 붙을 댓글 id (parentId로 보낸다) */
  commentId: number;
  nickname: string;
}

interface CommentInputProps {
  replyTo: ReplyTarget | null;
  onCancelReply: () => void;
  onSubmit: (content: string, parentId?: number) => Promise<void>;
  submitting: boolean;
}

export function CommentInput({ replyTo, onCancelReply, onSubmit, submitting }: CommentInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  // 답글 대상이 바뀌면 @닉네임을 채우고 바로 칠 수 있게 한다.
  useEffect(() => {
    if (!replyTo) return;
    setValue(`@${replyTo.nickname} `);
    inputRef.current?.focus();
  }, [replyTo]);

  const handleSubmit = async () => {
    const content = value.trim();
    if (!content || submitting) return;

    await onSubmit(content, replyTo?.commentId);
    setValue('');
  };

  return (
    <KeyboardAvoidingView
      // iOS는 'padding', 안드로이드는 창 크기가 저절로 줄어 'height'가 맞다.
      // Expo 54 문서: https://docs.expo.dev/versions/v54.0.0/ (KeyboardAvoidingView는 RN 것)
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {replyTo ? (
        <View style={styles.replyBar}>
          <Text style={styles.replyLabel}>{replyTo.nickname}님에게 답글 남기는 중</Text>
          <Pressable onPress={onCancelReply} hitSlop={8} accessibilityRole="button">
            <Text style={styles.cancel}>취소</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.bar}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          placeholder={replyTo ? '답글을 입력해주세요' : '댓글을 입력해주세요'}
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          multiline
          maxLength={1000}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={!value.trim() || submitting}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.submit,
            (!value.trim() || submitting) && styles.submitDisabled,
            pressed && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitLabel}>등록</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  replyLabel: { fontSize: 13, color: '#6B7280' },
  cancel: { fontSize: 13, fontWeight: '600', color: '#8B6F47' },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#111827',
  },
  submit: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
});
```

- [ ] **Step 2: 댓글 화면에 붙인다**

`mobile/app/post-comments.tsx`

**① import를 더한다**

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { CommentInput, type ReplyTarget } from '@/components/community/comment-input';
import { useAuthStore } from '@/lib/auth/store';
import { createComment } from '@/lib/community';
import { showToast } from '@/lib/toast';
```

**② 상태와 등록 처리를 더한다** (`useMe` 아래)

```tsx
const queryClient = useQueryClient();
const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (content: string, parentId?: number) => {
  // 게스트는 못 쓴다. 마이 탭과 같은 방식으로 로그인 화면만 띄운다.
  if (useAuthStore.getState().status === 'guest') {
    router.push('/login');
    return;
  }

  setSubmitting(true);
  try {
    await createComment(postId, content, parentId);
    setReplyTo(null);
    // 부모 목록과 그 답글을 같이 새로 받는다.
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    if (parentId) queryClient.invalidateQueries({ queryKey: ['replies', parentId] });
    // 상세 화면의 댓글 수도 옛것이 된다.
    queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });
  } catch (error) {
    // 서버 문구를 그대로 보여준다 — 차단 같은 것을 사용자가 알아야 한다.
    showToast(error instanceof Error ? error.message : '댓글 등록에 실패했습니다');
  } finally {
    setSubmitting(false);
  }
};
```

**③ `onReply`를 채운다** (`CommentRow` 호출)

```tsx
onReply={() =>
  setReplyTo({ commentId: item.comment.id, nickname: item.comment.authorNickname })
}
```

> 답글에 답글을 달면 `parentId`가 **그 답글**을 가리킨다(웹과 같다). 서버가 평평하게 돌려주므로 화면 자리는 같다.

**④ 입력창을 화면 맨 아래에 둔다** (`{renderBody()}` 아래)

```tsx
{renderBody()}

<CommentInput
  replyTo={replyTo}
  onCancelReply={() => setReplyTo(null)}
  onSubmit={handleSubmit}
  submitting={submitting}
/>
```

- [ ] **Step 3: 토스트가 입력창을 안 덮는지 본다**

토스트는 루트 `_layout`의 `ToastHost`가 그리고, 높이가 `insets.bottom + 72`로 못 박혀 있다(탭바 기준). 이 화면에는 탭바 대신 입력창이 있다.

실기기에서 등록을 일부러 실패시켜(비행기 모드) 토스트를 띄우고 확인한다.

```
□ 토스트가 입력창을 가리지 않는다
```

가린다면 `mobile/components/ui/toast-host.tsx`를 고치지 말고 **이 화면에서만** 올린다 — 다른 화면의 토스트 위치를 건드리면 9바퀴에 맞춰 놓은 것이 어긋난다. 방법은 실기기에서 본 뒤 정한다.

- [ ] **Step 4: 게이트**

Run: `pnpm gate:mobile`

- [ ] **Step 5: 실기기로 확인한다**

```
□ 하단에 입력창이 있다
□ 입력칸을 누르면 키보드가 올라오고 입력창이 키보드 위에 붙는다
□ 댓글을 쓰고 등록하면 목록에 바로 보인다
□ 「답글 달기」를 누르면 화면이 안 바뀌고 띠가 뜬다
□ 입력칸에 @닉네임이 채워져 있고 지울 수 있다
□ 「취소」를 누르면 띠가 사라지고 안내 문구가 "댓글을 입력해주세요"로 돌아온다
□ 답글을 등록하면 그 부모 아래에 보인다
□ 답글에 답글을 달면 같은 자리에 @표시와 함께 보인다
□ 게스트가 등록을 누르면 로그인 화면이 뜬다
□ 헤더 숫자가 늘어난다
```

- [ ] **Step 6: 커밋**

```bash
git add mobile/app/post-comments.tsx mobile/components/community/comment-input.tsx
git commit -m "feat(mobile): 댓글·답글 쓰기 (#812)

답글을 달 때 화면을 바꾸지 않는다(오늘의집 방식). 당근과 우리 웹 모바일은
전용 화면으로 넘어가는데, 그러면 방금 읽던 답글이 눈에서 사라진다.
여기서는 위에 「협주님에게 답글 남기는 중 · 취소」 띠만 뜬다.

@닉네임은 입력칸에 미리 채우고 지울 수 있게 뒀다. 서버에 멘션 필드가 없어
글자에 섞여 저장되므로 사용자가 손댈 수 있어야 한다.

게스트는 등록을 누르면 로그인 화면으로 보낸다. 읽기는 그대로 된다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 12: 댓글 ⋮ — 삭제와 작성자 신고

**Files:**
- Modify: `mobile/app/post-comments.tsx`

**Interfaces:**
- Consumes: `deleteComment` (Task 6) · `ProductActionSheet` · `SheetAction` · `ConfirmDialog`
- Produces: 없음 (앱 마지막 기능 과제)

- [ ] **Step 1: ⋮ 를 채운다**

`mobile/app/post-comments.tsx`

**① import를 더한다**

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import { deleteComment } from '@/lib/community';
```

**② 상태를 더한다**

```tsx
/** ⋮ 를 연 댓글. 시트와 확인 창이 같이 쓴다 */
const [menuTarget, setMenuTarget] = useState<CommentItem | null>(null);
const [deleteTarget, setDeleteTarget] = useState<CommentItem | null>(null);
```

**③ 시트 항목을 만든다**

```tsx
// 댓글 신고 API가 서버에 없다(신고는 사용자·상품·게시글 셋뿐).
// 그래서 남의 댓글은 「작성자 신고」로 보낸다 — 9바퀴 사용자 신고 화면을 그대로 쓴다.
const menuActions: SheetAction[] = menuTarget
  ? me && me.id === menuTarget.authorId
    ? [
        {
          label: '삭제',
          tone: 'danger',
          onPress: () => {
            const target = menuTarget;
            setMenuTarget(null);
            setDeleteTarget(target);
          },
        },
      ]
    : [
        {
          label: '이 사람 신고하기',
          onPress: () => {
            const target = menuTarget;
            setMenuTarget(null);
            router.push({
              pathname: '/report',
              params: {
                kind: 'user',
                id: String(target.authorId),
                name: target.authorNickname,
              },
            });
          },
        },
      ]
  : [];
```

**④ 삭제 처리를 더한다**

```tsx
const handleDelete = async (comment: CommentItem) => {
  try {
    await deleteComment(comment.id);
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    // 답글 조회 전체를 새로 받는다.
    //
    // ⚠️ comment.parentId만 보면 안 된다. 서버가 답글을 깊이 구분 없이 평평하게 주므로,
    //    「답글의 답글」을 지우면 parentId가 답글을 가리킨다. 그 키로 새로 받아 봐야
    //    화면에 있는 목록(부모 기준)은 안 바뀐다.
    //    답글 조회가 글당 1~2개뿐이라 전체를 다시 받아도 비용이 없다.
    queryClient.invalidateQueries({ queryKey: ['replies'] });
    queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });
    showToast('댓글이 삭제되었어요');
  } catch (error) {
    // 여기서 삼킨다. ConfirmDialog의 onConfirm이 던지면 창이 안 닫혀 사용자가 갇힌다.
    showToast(error instanceof Error ? error.message : '댓글 삭제에 실패했습니다');
  }
};
```

**⑤ `onMenu`를 채운다** (`CommentRow` 호출)

```tsx
onMenu={() => setMenuTarget(item.comment)}
```

**⑥ 시트와 확인 창을 화면에 둔다** (`CommentInput` 아래)

```tsx
<ProductActionSheet
  visible={menuTarget !== null}
  onClose={() => setMenuTarget(null)}
  actions={menuActions}
/>

<ConfirmDialog
  visible={deleteTarget !== null}
  heading="댓글을 삭제하시겠어요?"
  description="삭제하면 다시 복구할 수 없어요."
  confirmLabel="삭제"
  tone="danger"
  onClose={() => setDeleteTarget(null)}
  onConfirm={async () => {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget);
    setDeleteTarget(null);
  }}
/>
```

> ⚠️ prop 이름을 확인했다 — `title`이 아니라 **`heading`**, `onCancel`이 아니라 **`onClose`**, **`cancelLabel`은 없다**(취소 단추 문구가 조각 안에 박혀 있다).
> `onConfirm`은 `() => Promise<void>`다. **던지면 창이 안 닫힌다** — 그래서 `handleDelete`가 오류를 안에서 토스트로 삼키고, 성공·실패 모두 창을 닫는다. 실패해도 창이 남으면 사용자가 갇힌다.
> 문구는 오늘의집과 같다 — 「댓글을 삭제하시겠어요? / 삭제하면 다시 복구할 수 없어요.」

- [ ] **Step 2: 게이트**

Run: `pnpm gate:mobile`

- [ ] **Step 3: 실기기로 확인한다**

```
□ 내 댓글 ⋮ → 「삭제」만 뜬다
□ 삭제를 누르면 확인 창이 뜬다 → 취소하면 안 지워진다
□ 삭제하면 목록에서 사라지고 토스트 "댓글이 삭제되었어요"가 뜬다
□ 헤더 숫자가 줄어든다
□ 남의 댓글 ⋮ → 「이 사람 신고하기」만 뜬다
□ 누르면 9바퀴 사용자 신고 화면이 뜬다 (사유 목록이 사용자용이다)
□ 답글을 지워도 목록이 제대로 바뀐다
□ 답글이 달린 부모 댓글을 지우면 답글은 남는다 (서버가 그렇게 동작한다)
```

- [ ] **Step 4: 커밋**

```bash
git add mobile/app/post-comments.tsx
git commit -m "feat(mobile): 댓글 삭제와 작성자 신고 (#812)

⋮ 는 내 것이면 「삭제」, 남의 것이면 「이 사람 신고하기」다.
댓글 신고 API가 서버에 없어서(신고는 사용자·상품·게시글 셋뿐) 작성자 신고로
보낸다 — 9바퀴 사용자 신고 화면을 그대로 쓴다.

삭제는 확인 창 → 토스트다. 문구는 오늘의집과 같게 뒀다.

답글을 지울 때는 답글 조회 전체를 새로 받는다. 서버가 답글을 평평하게 주므로
parentId만으로는 어느 목록이 바뀌었는지 못 가린다. 글당 1~2개뿐이라 비용이 없다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 13: 알림의 커뮤니티 갈래를 앱 화면으로

**Files:**
- Modify: `mobile/lib/notifications.ts:127-153`
- Modify: `mobile/lib/notifications.test.ts`

**Interfaces:**
- Consumes: `/(tabs)/(community)` 경로 (Task 8) · `/(tabs)/(community)/posts/[id]` (Task 9)
- Produces: 없음

- [ ] **Step 1: 시험을 먼저 고친다**

`mobile/lib/notifications.test.ts`에서 `resolveTarget`을 다루는 부분을 찾는다.

Run: `grep -n "resolveTarget\|POST\|community" mobile/lib/notifications.test.ts`

`POST`가 `{ kind: 'web' }`을 기대하는 시험을 이렇게 바꾼다.

```ts
it('게시글 알림은 앱 커뮤니티 상세로 간다', () => {
  const target = resolveTarget({
    ...BASE,
    relatedEntityType: 'POST',
    relatedEntityId: 36,
  });

  expect(target).toEqual({ kind: 'app', path: '/(tabs)/(community)/posts/36' });
});

it('글이 지워졌다는 알림은 앱 커뮤니티 목록으로 간다', () => {
  const target = resolveTarget({
    ...BASE,
    notificationType: 'POST_DELETED',
    relatedEntityId: null,
  });

  expect(target).toEqual({ kind: 'app', path: '/(tabs)/(community)' });
});
```

> `BASE`는 그 파일에 이미 있는 시험용 알림 덩어리다. 이름이 다르면 거기 있는 것을 쓴다.

- [ ] **Step 2: 시험이 실패하는지 본다**

Run: `cd mobile && npx jest lib/notifications.test.ts`
Expected: FAIL — `kind: 'web'`이 왔다고 나온다

- [ ] **Step 3: 구현한다**

`mobile/lib/notifications.ts`

```ts
/**
 * 알림을 눌렀을 때 갈 곳.
 *
 * kind가 'app'이면 앱 화면으로 옮기고, 'web'이면 앱 안 브라우저로 웹 주소를 연다.
 * 이제 웹으로 나가는 것은 채팅뿐이다 — 커뮤니티는 10바퀴에 앱 화면이 생겼다.
 * 채팅 화면이 생기는 14바퀴에 여기만 고치면 웹 갈래가 없어진다.
 *
 * 규칙은 웹 src/lib/utils/getNavigationPath.ts와 같다.
 */
export function resolveTarget(
  item: NotificationItem
): { kind: 'app'; path: string } | { kind: 'web'; path: string } {
  const { relatedEntityType, relatedEntityId, notificationType } = item;

  if (relatedEntityId !== null) {
    if (relatedEntityType === 'PRODUCT')
      return { kind: 'app', path: `/products/${relatedEntityId}` };
    if (relatedEntityType === 'CHAT_ROOM') return { kind: 'web', path: `/chat/${relatedEntityId}` };
    if (relatedEntityType === 'POST')
      return { kind: 'app', path: `/(tabs)/(community)/posts/${relatedEntityId}` };
  }

  if (notificationType === 'ADMIN_SANCTION') return { kind: 'app', path: '/(tabs)/(my)' };
  if (notificationType === 'POST_DELETED') return { kind: 'app', path: '/(tabs)/(community)' };

  return { kind: 'app', path: '/(tabs)/(home)' };
}
```

- [ ] **Step 4: 시험이 통과하는지 본다**

Run: `cd mobile && npx jest lib/notifications.test.ts`
Expected: PASS

- [ ] **Step 5: 알림 화면의 주석도 고친다**

`mobile/app/notifications.tsx:63` 근처의 「앱에 아직 그 화면이 없다(채팅 12바퀴 · 커뮤니티 9바퀴)」를 고친다.

```tsx
// 앱에 아직 그 화면이 없다(채팅 14바퀴). 커뮤니티는 10바퀴에 생겼다.
```

- [ ] **Step 6: 게이트**

Run: `pnpm gate:mobile`

- [ ] **Step 7: 실기기로 확인한다**

```
□ 커뮤니티 댓글 알림을 누르면 앱 안 브라우저가 아니라 앱 상세가 뜬다
□ 뒤로가기로 알림 목록으로 돌아온다
□ 채팅 알림은 아직 웹으로 열린다 (14바퀴까지 그대로)
```

- [ ] **Step 8: 커밋**

```bash
git add mobile/lib/notifications.ts mobile/lib/notifications.test.ts mobile/app/notifications.tsx
git commit -m "feat(mobile): 알림의 커뮤니티 갈래를 앱 화면으로 (#812)

지금까지 커뮤니티 알림은 앱 안 브라우저로 웹을 열었다. 10바퀴에 앱 화면이
생겼으므로 앱 안에서 푼다. 웹으로 나가는 것은 채팅뿐이고, 14바퀴에 없어진다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

# Task 14: 실기기 확인 (사용자)

**Files:** 없음 (확인만)

- [ ] **Step 1: 웹부터 본다**

```bash
pnpm dev
```

브라우저 개발자도구로 폭을 바꿔 가며 확인한다 (완료 기준은 스펙 §9).

- [ ] **Step 2: 앱을 띄운다**

```bash
cd mobile && pnpm expo start
# 폰이 다른 네트워크면
cd mobile && pnpm expo start --tunnel
```

시험 계정: `devel.jjub+gate798@gmail.com` / `Abcdef1!xy`

- [ ] **Step 3: 완료 기준을 하나씩 본다**

스펙 §9의 앱 항목 15개를 순서대로 확인한다. **게스트 상태와 로그인 상태를 둘 다** 본다.

- [ ] **Step 4: 게이트 전부**

```bash
pnpm gate:all
```

`pnpm gate`에 lint가 들어 있으므로 따로 돌릴 필요가 없다 (#788). 경고가 36건을 넘으면 여기서 막힌다.

- [ ] **Step 5: 스펙에 실기기 결과를 적는다**

`docs/superpowers/specs/2026-08-01-app-community-read-comments-design.md`에 §11을 더해 실기기에서 드러난 것을 남긴다. 없으면 「확인 완료」만 적는다.

- [ ] **Step 6: PR**

`/commit-push`로 PR을 만든다. **base는 `develop`이다.** 본문에 `Close #812`를 넣는다.

> `#799`(웹 테스트 러너)는 별도 PR이다. 여기서 닫지 않는다.

---

## 순서와 나눌 수 있는 것

```
Task 0        백엔드           ← 가장 먼저. 저장소가 다르고 배포까지 시간이 걸린다
Task 1        shared          ← Task 2·3이 이걸 쓴다
                                단 Step 6-1(차단 문구)은 Task 0이 배포된 뒤 머지
Task 2~5      웹              ← 순서대로. 3이 4·5의 바탕이다
Task 6        앱 API          ← Task 1과 나란히 해도 된다 (#817도 여기서 고친다)
Task 7        마크다운         ← 갈림길. 여기서 막히면 바로 갈아탄다
Task 8~9      앱 목록·상세     ← 6·7 뒤
Task 10~12    앱 댓글          ← 8·9 뒤. 10 → 11 → 12 순서를 지킨다
Task 13       알림            ← 8·9 뒤면 언제든
Task 14       실기기          ← 마지막
```

**Task 0을 먼저 하는 이유**: 백엔드는 배포해야 효과가 나고, 배포는 사용자가 한다. 앱·웹 작업을 하는 동안 배포가 돌아가면 마지막에 한꺼번에 확인할 수 있다. 반대로 뒤로 미루면 차단 문구(Task 1 Step 6-1)가 배포를 기다리느라 걸린다.

**닫는 이슈**: `#812`(10바퀴) · `#817`(앱 중복 신고 판별) · `#809`의 남은 절반(게시글·상품 상세)

**팬(병렬 에이전트)에게 줄 때**: git 명령을 주지 않는다(`.git/index.lock` 충돌). 커밋은 리드가 한다. 명령을 이을 때 `;` 대신 `&&`를 쓴다. 계획서의 해당 Task만 준다.

**리드가 할 일**: 매 묶음마다 직접 게이트를 돌리고, 계획이 「⚠️」로 경고한 자리를 눈으로 확인한다. 팬은 계획을 의심하지 않는다 — 9바퀴에 계획서의 틀린 가정(DTO 모양)이 그대로 재현됐다.
