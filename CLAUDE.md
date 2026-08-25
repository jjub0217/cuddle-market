# Cuddle Market - Next.js 마이그레이션 프로젝트

## 프로젝트 개요

이 프로젝트는 기존 Vite + React Router 기반의 [Cuddle-Market-FE](https://github.com/ExpectedAnnualSalaryOf4TrillionWon/Cuddle-Market-FE)를 **Next.js App Router**로 마이그레이션하는 프로젝트입니다.

## 기존 프로젝트 정보

- **위치**: `~/Desktop/Cuddle-Market-FE`
- **기술 스택**: Vite, React 19, TypeScript, React Router DOM v7
- **상태 관리**: Zustand (persist)
- **데이터 페칭**: TanStack Query, Axios
- **스타일링**: Tailwind CSS v4
- **실시간**: WebSocket (STOMP), SSE

## 환경 설정

### 환경변수 (.env.local)

```
NEXT_PUBLIC_API_BASE_URL=https://cmarket-api.duckdns.org/api
NEXT_PUBLIC_WS_URL=https://cmarket-api.duckdns.org/ws-stomp
```

### Notion 연동 (Claude 명령어)

- **DAILY SCRUM DB**: `30ff2b30-7961-817e-9601-d836505c5b04`
- **Schedule List DB**: `30ff2b30-7961-8138-990e-e9ea63d1c151`
- **Trouble Shooting DB**: `30ff2b30-7961-81ef-9e09-c0b983057b31`
- **사용자 ID (강주현)**: `7c32774b-0096-4545-a9fe-7cfec90faa15`

## 게이트 (검증 명령)

**전부 저장소 루트에서 친다.**

```bash
pnpm gate:shared    # packages/shared — vitest
pnpm gate:mobile    # 앱 — tsc + expo lint + jest
pnpm gate           # 웹 — tsc + lint + vitest(unit) + next build
pnpm gate:all       # 셋 다 (shared → mobile → 웹 순)

pnpm test           # 웹 유닛 테스트만 (jsdom + RTL)
pnpm test:watch     # 고칠 때마다 다시 돈다
pnpm test:storybook # 스토리를 진짜 크로미움에서. 느리니 게이트에선 안 돈다

# 바뀐 파일만 lint (웹)
git diff --name-only develop...HEAD -- 'src/**/*.ts*' 'packages/**/*.ts' | tr '\n' '\0' | xargs -0 npx eslint
```

- ⚠️ **`cd mobile` 뒤에 루트 명령을 치면 실패한다.** `pnpm build`·`git add docs/...`가 그렇다. `gate:mobile`은 이 함정을 없애려고 만들었다 — 루트에서 앱 게이트를 돌린다.
- **`pnpm lint`는 이제 게이트다** (#788에서 오류 10건을 다 없앴다). 오류가 하나라도 생기면 `pnpm gate`가 막힌다.
- 경고는 31건에서 **더 늘지 못하게 막아 뒀다**(`lint:strict`의 `--max-warnings 31`). 경고를 줄이면 그 숫자도 같이 낮춘다. 예전에 26,271건까지 불어난 적이 있어 되돌아가지 않게 잠가 둔 것이다.
- ⚠️ **CI 는 문서만 바뀐 PR 에서 게이트를 건너뛴다**(#1075). `docs/**` 와 `*.md` 만 바뀌면 shared·앱·웹 세 잡이 곧바로 성공으로 끝난다 — 웹이 1분 53초에서 **2초**로 준다.
  - **검사 이름은 그대로 남는다.** `develop` 에 그 넷이 **필수 검사**로 걸려 있어서, 잡을 아예 안 돌리면(`paths-ignore`) 검사가 「없음」이 되고 **PR 이 영영 머지 대기에 걸린다.** 그래서 **잡은 돌리되 안에서 건너뛴다.**
  - 코드가 한 줄이라도 섞이면 다 돈다. 판별식은 `.github/workflows/gate.yml` 의 `scope` 잡에 있다.

**웹 시험(jsdom)이 못 보는 것** — 여기 걸리면 시험은 초록인데 브라우저에서만 깨진다.

```
<dialog>       jsdom 이 반쪽만 만든다. showModal()·close() 흉내가 vitest.setup.ts 에 있고
               **ESC 는 흉내가 없다.** ESC 시험은 'cancel' 사건을 직접 쏘아 연결만 지킨다
배치·스크롤     아예 없다. 「몇 픽셀로 그려졌나」·끌어서 움직이기는 눈으로 봐야 한다
setPointerCapture  없다. 그런데 이것은 **뒤따르는 click 의 대상을 바꾼다** —
               누르자마자 붙잡으면 click 이 붙잡은 쪽으로 가서 엉뚱한 것이 눌린다
IntersectionObserver  흉내는 있는데 **observe() 가 빈 함수**다(vitest.setup.ts).
               「보였다」를 스스로 만들 수가 없다 → 시험 안에서 클래스를 갈아 끼워
               콜백을 붙잡았다가 직접 쏜다. InfiniteScrollSentinel.test.tsx 를 본떠라
disabled 가 초점을 뗀다  **흉내가 없다.** 진짜 브라우저는 이미 초점이 가 있는 요소에
               `disabled` 가 붙으면 **초점을 강제로 뗀다**(2026-08-24 크롬 실측: 60ms 만에
               body 로 튕겼다). jsdom 은 그 반응을 안 한다 — 이미 disabled 인 것에
               초점을 못 주는 것까지만 흉내 낸다.
               ⚠️ 그래서 「초점이 남아 있나」로 시험을 쓰면 **회귀를 심어도 통과한다.**
               실제로 #1061 에서 `disabled` 로 되돌려 보니 그 시험은 초록이었고,
               **「`disabled` 속성이 안 붙는다」를 직접 본 시험만 잡아냈다.**
               → 「결과(초점)」가 아니라 **「원인(속성)」을 직접 보는 시험**을 써라.
               LoadMoreFocusButton.test.tsx 가 그 예다
```

⚠️ **리액트의 `onWheel` 로는 브라우저 확대를 못 막는다.** 리액트가 휠을 passive 로 달아
`preventDefault` 가 무시된다. 요소에 직접 `{ passive: false }` 로 달아야 한다.

⚠️ **브라우저에서 재야 할 때는 이미 깔린 크롬을 쓴다.** 플레이라이트 브라우저를 새로
받지 않아도 된다 — `chromium.launch({ channel: 'chrome' })`. 2026-08-13 에 이걸로
「트랙패드 확대가 먹는가」와 「뒤로가기가 기록을 몇 칸 먹는가」를 갈랐다.

⚠️ **`env(safe-area-inset-*)` 는 크롬 기기 모드로 못 잰다.** 아이폰 프로필을 씌워도 **늘 0** 이다 — 바뀌는 것은 화면 크기와 UA 뿐이다(2026-08-23 에 iPhone 14 Pro·15 Pro·Pixel 7 로 실측). **진짜 폰으로 봐야 한다.**

⚠️ **재려고 만든 스크립트는 `probe/` 안에 둔다.** 저장소 뿌리의 `.cjs` 는 켜진 규칙 41개로 검사받아서, 지우는 걸 잊으면 **반드시 lint 가 막힌다**(2026-08-23 에 실제로 깨졌다). `probe/` 는 `.gitignore` 와 eslint 양쪽에서 빠져 있어 잊어도 안 깨지고 커밋도 안 된다.
⚠️ 「뿌리에 둬야 playwright 를 찾는다」는 **틀린 말이다** — 노드가 위로 거슬러 올라가며 찾는다.

⚠️ **한국어 낱말을 훑을 때는 빈칸을 허용해라.** 2026-08-23 에 「구매 내역」과 「구매내역」을 갈라 **세 번 놓쳤다**(사람 하나, 판 둘이 각각). 좁은 grep 으로 세 번 걸렸으면 방법이 잘못된 것이다.

```bash
grep -rnE "구매\s*내역"     # 빈칸이 있든 없든 잡는다
```

⚠️ **웹 파일에 `npx prettier --write` 를 돌리지 마라.** 저장된 코드가 프리티어 설정과 조금 달라서, 고친 곳 말고 **관계없는 줄까지 다시 접힌다.** 2026-08-11 에 diff 가 세 배로 불어나 되돌렸다. 들여쓰기는 손으로 맞춘다.

**러너가 셋이다.** 어디에 시험을 쓸지는 그 코드가 사는 곳으로 정한다.

```
packages/shared/   vitest    웹·앱이 같이 쓰는 로직 → 한 번 쓰면 양쪽이 덮인다
mobile/            Jest      앱 화면·로직 (jest-expo)
src/ (웹)          vitest    웹 화면·훅 (jsdom + React Testing Library)
```

**웹에서 shared를 쓸 때는 기존 경로에 껍데기를 남긴다.** 호출부를 안 고쳐도 되게 `src/lib/utils/<이름>.ts`를 재수출 한 줄로 바꾼다. 앱은 `@cuddle/shared`를 바로 부른다.

```ts
// src/lib/utils/formatBirthDate.ts
// 원본은 packages/shared에 있다. 웹·앱이 같은 함수를 쓰게 하려고 여기서는 재수출만 한다.
export { formatBirthDate } from '@cuddle/shared'
```

지금 껍데기가 있는 것: `formatPrice` · `formatBirthDate`.

⚠️ **쓰임이 없어진 껍데기는 걷는다.** `formatJoinDate`도 껍데기가 있었는데 호출부가 전부
`@cuddle/shared`로 옮겨가 아무도 옛 경로를 안 쓰게 되어 지웠다(#1028). 껍데기는 **호출부를
안 고치려고** 두는 것이라, 호출부가 없으면 둘 이유도 없다.

⚠️ **한쪽에만 있는 함수는 같은 값을 화면마다 다르게 보이게 한다.** 18바퀴에 실제로 그랬다 — 날짜 표기가 웹에 셋, 앱에 하나였고 웹의 `formatJoinDate`는 조각 파일 안에 갇혀 있어 앱이 아예 못 썼다.

## 백엔드 저장소

이 저장소가 **아니다**.

```
~/Desktop/cmarket_api    main에 직접 커밋·푸시 (전역 규칙의 예외)
                         이 맥에서는 컴파일 불가 (JDK 11, 프로젝트는 21)
                         모듈 둘을 다 뒤져야 한다:
                           service/cmarket/          웹 계층 (컨트롤러·요청/응답 DTO)
                           service/cmarket-domain/   도메인 (enum·모델)
```

**운영 로그 보는 법** — EC2에 **도커가 아니라 `java -jar` 로** 떠 있다. `docker ps` 를 치면 `command not found` 가 난다.

```bash
tail -f -n 0 /home/ec2-user/cmarket_api/app.log      # 지금부터 새로 찍히는 것만
grep -n "찾을 말" /home/ec2-user/cmarket_api/app.log | tail -20
```

⚠️ 로그 경로가 설정(`application-prod.properties`의 `logging.file.name`)과 **다르다.** 설정은 `/var/log/cmarket/app.log` 인데 실제로는 홈 밑에 쓴다. **서버가 진짜 열고 있는 파일을 직접 물어보는 게 확실하다.**

```bash
ls -l /proc/$(pgrep -f cmarket-0.0.1)/fd/ | grep -i log
```

⚠️ 로그 시각은 **UTC** 다(한국시간 −9). 앱 실험 화면의 시각도 UTC라 그대로 견줄 수 있다.

⚠️ **그런데 DB 의 `created_at` 은 KST 다.** 로그(UTC)와 나란히 놓고 디버깅하면 **9시간 어긋난다** — 2026-08-23 에 그것 때문에 멀쩡한 것을 버그로 볼 뻔했다. KST 로 들어가는 것은 JDBC URL 의 `serverTimezone=Asia/Seoul` 덕이라, **재배포 때 그 옵션이 빠지면 두 칸이 어긋난다.** (`view_date` 처럼 날짜만 있는 칸은 안 옮겨져 그대로다.)
⚠️ `ps -ef` 에 DB 비밀번호·JWT 시크릿이 그대로 보인다(`-D` 옵션으로 넘긴다). **출력을 그대로 붙여넣지 말 것.**

### ⚠️ 백엔드 일로는 이슈를 만들지 않는다

**어느 저장소에도 만들지 않는다.** 고칠 내용은 **관련 프론트 이슈 본문**이나 **PR 본문**에 적는다. 프론트 이슈가 없으면 PR 본문에만 적는다. 백엔드 커밋 제목의 `(#번호)`는 그 프론트 이슈·PR 번호를 단다 — #862가 그 예다.

왜 그렇게 정했나:

```
cmarket_api 에 만들면   남의 저장소(jinioh88)라 이슈판을 안 쓴다.
                       2026-08-07에 모르고 만들었다가 닫았고,
                       **삭제 권한이 없어 닫는 것밖에 못 했다**

이 저장소에 만들면      이슈와 코드가 다른 저장소에 있어 GitHub 이 못 이어 준다.
                       **자동으로 안 닫혀서 손으로 닫아야 한다** — 2026-08-10 #873이 그랬다
```

⚠️ 커밋 제목의 `(#873)` 은 **닫는 말이 아니다.** 링크만 걸린다. 이슈를 닫는 것은 **PR 본문의 `Closes #번호`** 다.

⚠️ **엔티티에 필드를 더할 때는 생성자도 같이 고친다.** 이 저장소의 엔티티는 클래스가 아니라 **생성자에 `@Builder`** 를 단다(`User`·`Product`·`ChatRoom`·`ChatMessage`·`Notification` 전부). 필드만 더하면 빌더에는 안 들어가고, **이 맥에서는 컴파일을 못 해서 EC2 배포에서야 드러난다.** 2026-08-10에 실제로 배포가 한 번 깨졌다.

```java
@Builder
public Notification(Long userId, …, Long relatedEntityId, Integer groupCount) {
                                                           ↑ 필드만 더하면 여기가 빈다
```

반대로 `@Getter @Builder` 가 **클래스에** 붙은 DTO(`NotificationDto`·`NotificationCreateCommand`)는 필드만 더하면 된다. **둘이 섞여 있으니 고치기 전에 `@Builder` 가 어디 붙었는지 본다.**

**응답 DTO 찾는 법** — API를 붙일 때 「다른 API가 이러니 이것도 그렇겠지」로 추측하지 말고 직접 열어본다. 9바퀴에 이걸 안 해서 차단 목록이 늘 비어 있었다.

```bash
find ~/Desktop/cmarket_api -name "*Response.java" | grep -i <이름>
grep -nE "private |public class" <그 파일>
```

**보내는 값도 직접 열어본다.** 응답 DTO 못지않게 **서버 enum** 이 자주 어긋난다. 2026-08-11 에 웹 채팅방의 「판매완료 처리」가 `SOLD_OUT` 을 보내고 있었는데 서버 값은 `SELLING · RESERVED · COMPLETED` 뿐이어서, **누르면 반드시 실패하는데도 아무도 몰랐다** — 실패 알림이 서버 탈처럼 보였기 때문이다. GraphQL 스키마가 `String!` 이라 타입체크도 안 걸린다.

```bash
find ~/Desktop/cmarket_api -name "*.java" | xargs grep -ln "enum <이름>"
```

## 마이그레이션 가이드

자세한 가이드는 `docs/migration-guide.md` 참고

## Claude 명령어

- `/create-issue` - 이슈 생성 및 브랜치 생성
- `/commit-push` - 커밋 → 푸시 → PR 생성
- `/daily-scrum` - DAILY SCRUM 노션 페이지 생성 (기본)
- `/context-sync` - Notion + GitHub 병렬 수집 → 싱크 문서 + Daily Scrum 페이지 생성 (고급)
- `/schedule` - Schedule List 일정 등록

## 이슈·PR 템플릿

**템플릿은 기억으로 쓰지 말고 파일을 열어 그대로 따른다.**

```
.github/PULL_REQUEST_TEMPLATE.md            📌 개요 / 🔧 작업 내용 / 📎 관련 이슈 / 📸 스크린샷 / 💬 리뷰어 참고 사항
.github/ISSUE_TEMPLATE/bug_report.md        제목 [BUG] · 🐞 버그 설명 / ✅ 재현 방법 / 🎯 예상 동작 / 🖥 환경 정보
.github/ISSUE_TEMPLATE/feature_request.md   제목 feat: · ✨ 제안 개요 / 🛠 작업 내용 / 📌 참고 자료
.github/ISSUE_TEMPLATE/refactor-issue.md    제목 refactor: · ♻️ 리팩토링 대상 / 📌 개선 이유 / 🛠 기대 결과
```

⚠️ **관련 이슈는 목록 항목(`- Close #번호`)으로 적는다.** 그냥 문단으로 적으면 GitHub 가 **이슈 제목을 안 펼치고 번호만** 보여준다. 2026-08-11 에 PR 다섯을 그렇게 올려 다시 고쳤다.

⚠️ **기능 이슈 제목은 `[FEAT]` 가 아니라 `feat:` 다.** 버그의 `[BUG]` 를 보고 지어내기 쉽다 — 같은 날 이슈 셋을 그렇게 잘못 썼다.

## 머지 워크플로우

사용자가 "머지", "머지했어", "PR 머지했어" 등의 표현을 사용하면:

1. develop 브랜치를 main에 **직접 머지** (PR 생성 금지)
2. PR 생성 시 kimi 코드리뷰가 자동 트리거되어 토큰이 소진되므로, main 머지는 항상 로컬에서 직접 수행
3. 작업 브랜치 정리 (삭제)

```bash
git fetch origin
git checkout main && git pull --ff-only origin main
git merge origin/develop        # ⚠️ 로컬 develop 이 아니라 origin/develop
git push origin main
```

⚠️ **`git merge develop` 이라고 쓰면 안 된다.** 그건 **로컬** `develop` 을 본다.
`git fetch` 는 `origin/develop` 만 갱신하므로, 로컬 `develop` 이 뒤처져 있으면
**머지가 조용히 커밋을 빠뜨린다. 오류도 안 난다** — Fast-forward 로 성공해 버린다.

```
2026-08-01   23커밋을 빠뜨렸다. 푸시 전에 알아채 피해는 없었다
2026-08-07   같은 곳에서 또. 65커밋을 빠뜨린 채 「완료」로 보고하고 푸시까지 했다
```

⚠️ **PR 을 쌓아 올렸으면 위에서부터 머지한다.** 큰 일을 나눠 PR 을 겹쳐 올릴 때가 있다.

```
#906  기능-1단계  → develop
#907  기능-2단계  → 기능-1단계     ← 1단계 브랜치 위에 쌓은 것

#906 을 먼저 머지하면 develop 에는 **그 시점의 1단계만** 들어간다.
그 뒤 #907 을 머지해도 그건 1단계 **브랜치**로 갈 뿐 develop 에는 안 온다.
```

2026-08-13 에 실제로 그랬다. 깃허브가 「Merged」 라고 표시해서 다 된 줄 알았는데
develop 에 2·3단계가 없었고, 브랜치→develop PR 을 하나 더 만들어야 했다(#908).

```
쌓은 것부터 먼저   #907 → #906 브랜치로 머지 → 그다음 #906 → develop
확인               git log origin/develop 에 그 커밋이 보이는가
                   git diff --stat origin/develop origin/<브랜치> 가 비어 있는가
```

**푸시한 뒤 두 줄이 같은지 눈으로 확인한다.**

```bash
git log --oneline -1 main
git log --oneline -1 origin/develop   # 해시가 같아야 한다
```

## 기존 소스 복사 명령어

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
