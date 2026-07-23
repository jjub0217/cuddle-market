# AI 협업팀 워크플로우 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Code Agent Teams로 실제 팀의 SDLC(PM→디자인→구현→PR→리뷰→머지→QA→피드백)를 한 기능에 대해 한 바퀴 돌려, 그 과정으로 RN 앱의 첫 기능을 실제 구현한다.

**Architecture:** 네이티브 Agent Teams(in-process→tmux 분할)로 리드(메인 세션)가 PM·디자이너·프론트A/B·QA 팀원을 스폰. Sprint 0(인프라)은 단일 스레드로 먼저 깔고, Sprint 1(첫 기능)을 풀 협업 루프로 돌린다. 코드 레벨 상세는 RN 계획(`2026-07-19-rn-app-monorepo.md`)을 참조.

**Tech Stack:** Claude Code Agent Teams(실험), tmux, pnpm workspace, Expo(RN), git worktree. 백엔드는 기존 REST/GraphQL(`https://cmarket-api.duckdns.org/api`).

**설계 문서:** `docs/superpowers/specs/2026-07-20-ai-collab-team-workflow-design.md`

## Global Constraints

- **작업 브랜치에서만.** develop/main 직접 커밋 금지. 머지는 사용자가 직접 수행.
- **Agent Teams 활성화**: `settings.json`에 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` + `teammateMode: "tmux"`. 실험 기능이라 리드+사람이 감독.
- **OMC 비활성화** (팀원 5명 각각에 소음/충돌 전파 방지). 사용자가 수행.
- **PR 하이브리드**: 반복 루프는 로컬(브랜치·커밋 진짜, 리뷰·머지 로컬) → kimi 회피. 진짜 GitHub PR은 딱 1회.
- **시각 QA = 사람.** 에이전트는 폰 화면을 못 봄. 자동 테스트(Jest/Vitest/Maestro)+코드검사=QA 에이전트.
- **팀원은 리드의 대화 히스토리를 상속 안 함.** 스폰 프롬프트에 항상 참조 문서 경로(설계·RN 계획·기존 웹 파일)를 넣는다.
- **첫 기능 범위는 PM 문서가 확정.** 유력 후보 = 메인화면 얇은 슬라이스(히어로+상품 리스트).
- **API base**: `https://cmarket-api.duckdns.org/api` (앱은 `EXPO_PUBLIC_API_BASE_URL`).

---

## Phase A — 팀 실행 준비 (설정 번들 + 검증)

### Task A1: 설정 번들 (tmux + Agent Teams + OMC off)

한 번의 재시작에 모든 설정을 묶는다. **★ 이 태스크 시작 시 사용자에게 "지금 OMC 끄세요" 신호를 준다.**

**Files:**
- Modify: `~/.claude/settings.json` (env var + teammateMode)

- [ ] **Step 1: tmux 설치** (사용자가 `!`로 실행)

```bash
brew install tmux
tmux -V   # 버전 출력 확인
```

- [ ] **Step 2: `~/.claude/settings.json`에 Agent Teams 설정 추가** (리드가 편집)

기존 `settings.json`을 읽어, 최상위에 아래 키를 병합한다(기존 키 보존):
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "tmux"
}
```
> 기존에 `env` 블록이 있으면 그 안에 변수만 추가. 편집 전 원본을 백업(주석/사본).

- [ ] **Step 3: OMC 비활성화** (사용자가 수행)

`/plugin` 커맨드 → oh-my-claudecode → 비활성화(Disable). 또는 `~/.claude/settings.json`의 플러그인 활성 목록에서 omc를 끈다.
> 사용자의 자체 프로젝트 명령어(`/commit-push`·`/context-sync` 등)는 `.claude/`에 있어 영향 없음 — OMC 스킬(`team`·`ralph` 등)만 사라짐.

- [ ] **Step 4: 재시작 (이 대화 이어서)** (사용자가 실행)

```bash
claude --continue
```

**검증:** 재시작 후 `env`에 변수가 로드됐는지 다음 태스크에서 확인.

---

### Task A2: Agent Teams 활성 검증 (마커 방식)

추측 말고, 실제로 팀원이 tmux 판에 뜨는지 마커로 증명한다.

- [ ] **Step 1: 트리비얼 팀원 1명 스폰 요청** (리드가 실행)

리드에게: "Spawn one teammate named `probe` that just replies with its working directory and then goes idle." (실험 기능이 켜져야 팀원이 생성됨.)

- [ ] **Step 2: tmux 판 확인**

Expected: 터미널이 tmux 분할되고 `probe` 팀원 판이 생김. 에이전트 패널에 `probe` 표시.
> 안 뜨면: `which tmux` 확인, `teammateMode` 값 확인, env var 로드 확인(설정 번들 재점검).

- [ ] **Step 3: probe 셧다운**

리드에게: "Ask the probe teammate to shut down." → 판 정리 확인.

**검증:** `probe` 팀원이 tmux 판에 떴다 사라짐 = Agent Teams + tmux 정상.

---

## Phase B — Sprint 0: 인프라 (단일 스레드, 루프 아님)

### Task B1: 모노레포 + Expo 뼈대

디자이너·QA 시각검수가 없는 순수 인프라라 협업 루프 대상이 아니다. **RN 계획의 Task 3~6을 그대로 실행**한다(리드 또는 단일 프론트 에이전트).

**Files:** RN 계획 참조 — `pnpm-workspace.yaml`, `.npmrc`, `packages/shared/*`, `mobile/*`, `mobile/metro.config.js` 등.

- [ ] **Step 1: RN 계획 Task 3 실행** — pnpm 워크스페이스 뼈대 + `pnpm build`로 웹 무손상 검증.
- [ ] **Step 2: RN 계획 Task 4 실행** — `packages/shared`(타입 + 헬퍼 + Vitest).
- [ ] **Step 3: RN 계획 Task 5 실행** — Expo 앱 생성 + Jest 셋업 + 실기기 빈 화면.
- [ ] **Step 4: RN 계획 Task 6 실행** — Metro 설정 + `@cuddle/shared` import 검증.
- [ ] **Step 5: 커밋** (작업 브랜치)

**검증:** RN 계획 Task 3~6의 각 검증(웹 빌드 성공 · Vitest PASS · 실기기 빈 화면 · shared import 통과) 통과. **사용자 실기기 확인.**

---

## Phase C — Sprint 1: 첫 기능 풀 협업 루프 (팀 런북)

각 태스크는 팀원 스폰 → 산출물 → **게이트(리드 검수 + 사용자 승인)** 순. 스폰 프롬프트는 팀원이 히스토리를 상속 안 하므로 **참조 문서 경로를 반드시 포함**.

### Task C1: PM — 요구사항 정의서 + 플로우차트

**게이트: 사용자 승인 (첫 기능 범위 확정).**

- [ ] **Step 1: PM 팀원 스폰** (리드가 실행)

스폰 프롬프트(요지):
> "You are the PM. Read the existing Cuddle Market web app to extract requirements — start at `src/app/(main)/page.tsx`, `src/features/home/Home.tsx` and its `components/`. Produce a **requirements definition + user flowchart** for the RN app's **first feature: the main-screen browsing slice (hero + product list, viewable without login)**. Ground everything in the existing web behavior; mark mobile-first adaptation points; do NOT invent features not in the web app. Output to `docs/superpowers/specs/2026-07-20-rn-main-screen-requirements.md`. Also propose the milestone/scope for this first feature."

- [ ] **Step 2: 리드 검수** — 문서가 기존 웹에 근거하는지(추측 없는지), 범위가 얇은 슬라이스인지 확인.
- [ ] **Step 3: 사용자 승인 게이트** — 사용자가 범위·플로우차트 확인 → 승인/조정.

**검증:** `2026-07-20-rn-main-screen-requirements.md`에 요구사항 + 플로우차트 + 확정 범위가 있고, 사용자가 승인.

---

### Task C2: 디자이너 — 모바일 UI 스펙

**게이트: 사용자 승인.**

- [ ] **Step 1: 디자이너 팀원 스폰** (리드가 실행)

스폰 프롬프트(요지):
> "You are the mobile designer. Read `docs/superpowers/specs/2026-07-20-rn-main-screen-requirements.md` (PM output) and the existing web screen `src/features/home/Home.tsx`. Produce a **mobile-first UI spec** for the main-screen slice: layout, component list, mobile interaction patterns (e.g., thumb-zone, sticky elements), states (loading/empty/error). Text/markdown spec is enough; Figma MCP optional. Output to `docs/superpowers/specs/2026-07-20-rn-main-screen-ui.md`. Avoid color/font perfectionism — layout & interaction only."

- [ ] **Step 2: 리드 검수** — 요구사항과 정합, 모바일 패턴 반영 확인.
- [ ] **Step 3: 사용자 승인 게이트.**

**검증:** UI 스펙 문서 존재 + 사용자 승인.

---

### Task C3: 프론트A 구현 → 프론트B 리뷰 → 반영 → dev 로컬 머지

**게이트: 리뷰어 승인 후 로컬 머지.**

- [ ] **Step 1: 기능 브랜치 생성** (리드/프론트A)

```bash
git checkout -b feat/rn-main-screen
```

- [ ] **Step 2: 프론트A 팀원 스폰 (구현)** (리드가 실행)

스폰 프롬프트(요지):
> "You are Frontend A. Implement the RN main-screen slice per `docs/superpowers/specs/2026-07-20-rn-main-screen-ui.md` and the requirements doc. Follow RN 계획 style (`docs/superpowers/plans/2026-07-19-rn-app-monorepo.md` Task 8 for product list): `mobile/lib/products.ts` (fetch), `mobile/app/...` screen, Jest unit test for the fetch. Use `@cuddle/shared` types, `EXPO_PUBLIC_API_BASE_URL`. Commit on branch `feat/rn-main-screen`. Write the failing Jest test first, then implement."

- [ ] **Step 3: 프론트B 팀원 스폰 (코드리뷰)** (리드가 실행)

스폰 프롬프트(요지):
> "You are Frontend B, reviewing Frontend A's branch `feat/rn-main-screen`. Read the diff (`git diff dev...feat/rn-main-screen`). Review for correctness, RN idioms, the UI spec compliance, and test adequacy. Leave concrete review comments (file:line + suggested change). Do NOT edit A's files — only review."

- [ ] **Step 4: 프론트A 리뷰 반영** — A가 B의 코멘트를 반영해 커밋.
- [ ] **Step 5: 로컬 dev 머지** (리드/프론트A)

```bash
git checkout dev 2>/dev/null || git checkout -b dev
git merge --no-ff feat/rn-main-screen
```
> GitHub PR 안 올림(kimi 회피). 리뷰는 로컬 diff로 이미 수행됨.

**검증:** 프론트B 리뷰 코멘트 존재 + A가 반영 + `tsc --noEmit`·Jest 통과 + dev에 로컬 머지됨.

---

### Task C4: QA 테스트 → 피드백 → 수정 루프 + 사용자 시각 QA

**게이트: 되돌림 루프 최소 1회 + 사용자 실기기 시각 QA 통과.**

- [ ] **Step 1: QA 팀원 스폰** (리드가 실행)

스폰 프롬프트(요지):
> "You are QA. On branch `dev`, run automated checks for the main-screen slice: `cd mobile && pnpm test` (Jest), `pnpm exec tsc --noEmit`, `pnpm exec expo lint`. Inspect the code against the requirements/UI spec. Report PASS/FAIL with concrete feedback (what fails, where, why). You cannot see the running app on a device — limit to automated tests + code inspection; flag anything needing human visual QA."

- [ ] **Step 2: QA 피드백 → 프론트A 수정 (되돌림 루프)** — 실패/지적 있으면 C3 Step 2로 되돌려 A가 수정 → 재리뷰 → 재머지 → 재QA. **최소 1회 이 루프를 돈다.**

- [ ] **Step 3: 사용자 실기기 시각 QA** (사용자)

```bash
cd mobile && pnpm exec expo start
```
Expo Go로 실기기에서 메인 슬라이스가 실제 백엔드 데이터로 뜨는지, 모바일 UX가 스펙대로인지 **눈으로** 확인. 문제 있으면 리드에게 피드백 → C3/C2로 되돌림(디자인 문제면 디자이너에게).
> USB 디버깅: iOS Safari Web Inspector / Android Chrome DevTools.

**검증:** QA 자동 테스트 통과 + 되돌림 루프 1회 작동 + 사용자 시각 QA 통과.

---

### Task C5: 진짜 GitHub PR 1개 (체크포인트 경험)

**하이브리드 C의 "딱 한 번" — GitHub에서 PR·리뷰가 어떻게 보이는지 실물 경험. kimi 1회 감수.**

- [ ] **Step 1: 브랜치 푸시** (사용자 승인 후)

```bash
git push -u origin feat/rn-main-screen
```

- [ ] **Step 2: PR 생성 (base = develop)** — 프로젝트 컨벤션(feat PR 형식: 📌 개요 / 🔧 작업 내용 / 📎 관련 이슈)으로.

```bash
gh pr create --base develop --title "feat: RN 메인화면 슬라이스" --body "..."
```
> ⚠️ develop PR이라 kimi 자동리뷰가 트리거됨 — 이번 1회만 감수(경험용).

- [ ] **Step 3: 팀원 리뷰를 GitHub에도 경험** (선택) — 프론트B가 남긴 로컬 리뷰를 GitHub PR 코멘트로도 확인.

**검증:** GitHub에 PR 1개 생성됨 + 사용자가 PR·리뷰 UI를 실물로 확인. **머지는 사용자가 직접.**

---

## 완료 기준 (설계 §9 대응)

1. PM 요구사항 정의서 + 플로우차트 (C1).
2. 디자인 스펙 → 구현 → 상호 리뷰 → dev 머지 → QA 한 사이클 실제 작동 (C2~C4).
3. 피드백 → 수정 → 재검증 되돌림 루프 최소 1회 (C4 Step 2).
4. 실기기에서 실제 백엔드 데이터로 동작 + 사용자 시각 QA 통과 (C4 Step 3).
5. 진짜 GitHub PR 1개 경험 (C5).
