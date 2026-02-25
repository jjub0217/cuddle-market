# Claude Code 7가지 핵심 기능 가이드

> AI Native Camp 1기 학습 내용 정리 (camp-1 기반)
> 작성일: 2026-02-25

---

## 전체 구조

```
┌─ CLAUDE.md ─── 항상 읽히는 영구 기억 (회사 규칙서)
│
├─ Skill ─────── 필요할 때 꺼내는 레시피 (업무 매뉴얼)
│   └─ MCP ───── 외부 도구 연결 표준 (USB 포트)
│
├─ Subagent ──── 독립 공간에서 전담 처리 (부하 직원 1명)
│   └─ Agent Teams ── 여러 에이전트가 동시 협업 (프로젝트 팀)
│
├─ Hook ──────── 이벤트 발생 시 자동 실행 (자동 체크리스트)
│
└─ Plugin ────── 위의 모든 것을 묶어서 공유 (앱스토어 앱)
```

| # | 기능 | 한 마디 | 로딩 시점 |
|---|------|---------|----------|
| 1 | CLAUDE.md | 항상 읽히는 영구 기억 | 매 세션 시작 시 자동 |
| 2 | Skill | 필요할 때 꺼내는 레시피 | `/명령어` 호출 시 |
| 3 | MCP | 외부 도구 연결 표준 | 설정 후 항상 |
| 4 | Subagent | 독립 공간에서 전담 처리 | Task 도구 호출 시 |
| 5 | Agent Teams | 여러 에이전트가 소통하며 협업 | 복잡한 멀티스텝 작업 시 |
| 6 | Hook | 이벤트 발생 시 자동 실행 | 이벤트 발생 시 |
| 7 | Plugin | 모든 것을 묶어서 공유 | 설치 시 |

---

## 1. CLAUDE.md — 영구 기억

### 개념

| 항목 | 설명 |
|------|------|
| 근본 원리 | **시스템 프롬프트** — AI가 대화를 시작할 때 가장 먼저 읽는 지시문 |
| 해결하는 문제 | AI의 기억은 세션이 끝나면 사라짐 → CLAUDE.md를 매번 읽게 해서 "영구 기억"으로 |
| 비유 | 새 인턴이 출근할 때마다 읽는 **회사 규칙서** |

### 작동 방식

```
세션 시작
  └→ CLAUDE.md 자동 로딩
       └→ "이 프로젝트는 Next.js고, PR은 develop에 올려야 해"
            └→ Claude가 이 규칙을 따름
```

### 계층 구조

CLAUDE.md는 3개 위치에 둘 수 있다. 아래로 갈수록 구체적이다:

| 위치 | 범위 | 예시 내용 |
|------|------|----------|
| `~/.claude/CLAUDE.md` | 모든 프로젝트 | "한국어로 대답해줘" |
| `프로젝트/CLAUDE.md` | 해당 프로젝트 | "PR은 develop에 올려" |
| `프로젝트/src/CLAUDE.md` | 해당 폴더 | "이 폴더는 컴포넌트 전용" |

### 작성 팁

- **짧게 쓴다** — 매 세션마다 전부 읽히므로 길면 컨텍스트 낭비
- **규칙/컨벤션 위주** — 구체적인 워크플로우는 Skill로 분리
- **변하지 않는 것만** — 자주 바뀌는 내용은 적합하지 않음

### cuddle-market 적용 현황

```markdown
# 현재 CLAUDE.md에 들어있는 것
- 프로젝트 개요 (Vite → Next.js 마이그레이션)
- 기존 프로젝트 정보 (위치, 기술 스택)
- 환경변수 설정
- Notion 연동 정보 (DB ID, 사용자 ID)
- Claude 명령어 목록
- 머지 워크플로우 (develop → main 직접 머지)
```

---

## 2. Skill — 필요할 때 꺼내는 레시피

### 개념

| 항목 | 설명 |
|------|------|
| 근본 원리 | **점진적 로딩(Progressive Disclosure)** — 컨텍스트 윈도우는 유한하므로, 필요한 순간에 필요한 지식만 로딩 |
| 해결하는 문제 | 반복 작업의 품질 일관성 + CLAUDE.md 비대화 방지 |
| 비유 | 서랍에 넣어둔 **요리 레시피** — 파스타 만들 때만 파스타 레시피를 꺼냄 |

### CLAUDE.md vs Skill

| | CLAUDE.md | Skill |
|-|-----------|-------|
| 로딩 | 항상 전부 읽힘 | 필요할 때만 |
| 분량 | 짧게 (항상 읽히니까) | 길어도 OK |
| 용도 | 규칙, 컨벤션 | 구체적 워크플로우 |
| 수정 빈도 | 드물게 | 자주 개선 |

### 파일 구조

```
.claude/skills/
├── my-skill-name/
│   ├── SKILL.md          ← 필수 (1,500~2,000 단어 권장, 최대 5,000)
│   ├── references/       ← 상세 문서 (필요할 때 추가 로딩)
│   ├── templates/        ← 출력 템플릿
│   └── scripts/          ← 실행 스크립트
```

### SKILL.md 작성법

```markdown
---
name: my-skill-name
description: 이 스킬이 하는 일을 한 문장으로. "트윗 번역", "싱크" 등 트리거 키워드 포함.
---

# 스킬 이름

## Step 1: 첫 번째 단계
(구체적인 실행 지시)

## Step 2: 두 번째 단계
(구체적인 실행 지시)
```

### 호출 방법

| 방법 | 예시 | 설명 |
|------|------|------|
| `/명령어` | `/context-sync` | 직접 호출 |
| 자연어 | "싱크해줘" | description의 트리거 키워드에 매칭되면 자동 발동 |

### cuddle-market 적용 현황

| 스킬 | 명령어 | 하는 일 |
|------|--------|--------|
| context-sync | `/context-sync` | Notion + GitHub 병렬 수집 → 싱크 문서 + Daily Scrum |
| session-wrap | `/wrap` | 세션 마무리 (4개 에이전트 병렬 분석) |
| commit-push | `/commit-push` | 커밋 → 푸시 → PR 생성 |
| create-issue | `/create-issue` | GitHub 이슈 생성 + 브랜치 생성 |
| daily-scrum | `/daily-scrum` | Notion Daily Scrum 페이지 생성 |
| schedule | `/schedule` | Schedule List 일정 등록 |

---

## 3. MCP — 외부 도구 연결

### 개념

| 항목 | 설명 |
|------|------|
| 근본 원리 | **Tool Calling** — AI가 "이 함수를 이 파라미터로 호출해"라고 구조화된 요청을 보냄. MCP는 이걸 외부 서비스까지 확장하는 **오픈 표준 프로토콜** |
| 해결하는 문제 | Claude가 텍스트만 생성하는 게 아니라 외부 도구를 직접 조작 |
| 비유 | 컴퓨터의 **USB 포트** — 규격만 맞으면 어떤 기기든 꽂아서 사용 |

### 작동 방식

```
사용자: "Notion에서 태스크 목록 가져와"
  │
  ▼ Claude가 판단
"notion-fetch 도구를 DB ID와 함께 호출해야겠다"
  │
  ▼ Tool Calling (MCP 프로토콜)
┌──────────┐    표준 규격    ┌──────────┐
│ Claude   │ ◀════════════▶ │ Notion   │
│ Code     │                │ MCP 서버 │
└──────────┘                └──────────┘
  │
  ▼
"태스크 15개를 가져왔습니다. 진행 중인 건 3개..."
```

### 연결 방식 2가지

| 방식 | 비유 | 특징 | 예시 |
|------|------|------|------|
| **HTTP** | 웹사이트 접속 | 클라우드 서비스에 연결 | Notion, Slack, GitHub |
| **stdio** | 앱 설치 | 내 컴퓨터에서 프로그램 실행 | Context7, Fetch, Filesystem |

### 설치 명령어

```bash
# HTTP 방식 (클라우드 서비스)
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
claude mcp add --transport http slack https://api.slack.com/mcp
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
claude mcp add --transport http linear https://mcp.linear.app/sse

# stdio 방식 (로컬 실행)
claude mcp add --transport stdio context7 -- npx -y @upstash/context7-mcp@latest
claude mcp add --transport stdio fetch -- npx -y @anthropic-ai/mcp-fetch@latest
claude mcp add --transport stdio fs -- npx -y @modelcontextprotocol/server-filesystem /path
claude mcp add --transport stdio memory -- npx -y @modelcontextprotocol/server-memory

# 모든 프로젝트에서 사용 (user scope)
claude mcp add --transport http --scope user notion https://mcp.notion.com/mcp
```

### 관리 명령어

| 명령어 | 하는 일 |
|--------|---------|
| `/mcp` | Claude Code 안에서 연결 상태 확인 |
| `claude mcp list` | 터미널에서 설치된 서버 목록 |
| `claude mcp get [이름]` | 특정 서버 상세 정보 |
| `claude mcp remove [이름]` | 서버 제거 |

### MCP 도구 이름 규칙

```
mcp__서버이름__도구이름

예시:
  mcp__claude_ai_Notion__notion-fetch
  mcp__context7__query-docs
```

> 이름이 길지만 직접 외울 필요 없음. "Notion에서 태스크 가져와"라고 하면 Claude가 알아서 호출

### 웹 브라우저에서 쉽게 연결하기

터미널 명령어 없이 클릭으로 연결:

```
1. https://claude.ai/settings/connectors 접속
2. 연결하고 싶은 서비스 선택 (Slack, Notion 등)
3. 로그인 후 연결 승인
4. Claude Code에서 /mcp → "claude.ai" 섹션에 자동 등록
```

### MCP 서버 찾는 곳

| 출처 | URL |
|------|-----|
| Claude Code 공식 문서 | https://code.claude.com/docs/ko/mcp |
| MCP 서버 GitHub | https://github.com/modelcontextprotocol/servers |
| MCP Registry | https://registry.modelcontextprotocol.io |

### 설정 파일 방식 (.mcp.json)

프로젝트 루트에 `.mcp.json`을 두면 해당 프로젝트에서 자동으로 MCP 서버가 연결된다:

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer ntn_xxx\"}"
      }
    }
  }
}
```

### cuddle-market 적용 현황

| MCP 서버 | 연결 방식 | 용도 |
|---------|----------|------|
| Notion | `.mcp.json` + claude.ai Connector | 태스크/스크럼/일정 관리 |
| Context7 | stdio (로컬) | Next.js, React 등 공식 문서 실시간 검색 |

---

## 4. Subagent — 독립 실행 부하 직원

### 개념

| 항목 | 설명 |
|------|------|
| 근본 원리 | **프로세스 격리 + Blank Slate** — 새 Claude 프로세스를 띄워서, 메인 대화의 컨텍스트 없이 빈 상태에서 시작 |
| 해결하는 문제 | 1) 긴 조사 결과가 메인 대화를 오염시키는 것 방지, 2) 여러 작업을 동시에 처리 |
| 비유 | "이거 조사해와"라고 시키는 **부하 직원** — 자기 방에서 일하고 보고서만 올림 |

### 작동 방식

```
메인 Claude (나와 대화 중)
  │
  ├── Task("Notion 태스크 수집해") ──→ Subagent A (독립 공간)
  │                                       │
  │                                  Notion API 호출
  │                                  데이터 정리
  │                                       │
  │                                  결과 요약만 반환 ──→ 메인에 합류
  │
  └── Task("GitHub PR 조회해") ──→ Subagent B (독립 공간)
                                       │
                                  gh CLI 실행
                                  데이터 정리
                                       │
                                  결과 요약만 반환 ──→ 메인에 합류
```

### 핵심 특징

| 특징 | 설명 |
|------|------|
| **Blank Slate** | 메인의 대화 기록을 모름. prompt에 필요한 정보를 명시적으로 전달해야 함 |
| **병렬 실행** | 여러 Task를 동시에 보내면 동시에 실행됨 |
| **컨텍스트 보호** | 100페이지짜리 조사 결과가 메인 대화를 차지하지 않음 |
| **결과만 반환** | 중간 과정은 사라지고 최종 결과만 돌아옴 |

### 사용할 때 주의점

```
# 좋은 예 — 충분한 컨텍스트 전달
Task(prompt="
  오늘 날짜: 2026-02-25.
  대상 레포: jjub0217/cuddle-market.
  gh CLI로 열린 PR 목록을 조회해.
  명령어: gh pr list --repo jjub0217/cuddle-market --state open
")

# 나쁜 예 — 컨텍스트 없이 모호한 지시
Task(prompt="PR 목록 조회해")
# → Subagent는 어떤 레포인지, 어떤 도구를 쓰는지 모름
```

### cuddle-market 적용 현황

- **context-sync**: Notion 수집 에이전트 + GitHub 수집 에이전트 병렬 실행
- **session-wrap**: doc-updater, automation-scout, learning-extractor, followup-suggester 4개 에이전트 병렬 실행

---

## 5. Agent Teams — 여러 에이전트 협업

### 개념

| 항목 | 설명 |
|------|------|
| 근본 원리 | **멀티 에이전트 협업** — 각 에이전트가 독립된 컨텍스트 윈도우를 갖고, 서로 메시지를 주고받으며 협업 |
| 해결하는 문제 | 하나의 에이전트로는 감당하기 어려운 대규모, 복잡한 작업 |
| 비유 | **프로젝트 팀** — PM이 칸반보드에 할 일을 올리면 각 팀원이 맡아서 처리, 서로 결과를 공유 |

### Subagent vs Agent Teams

| | Subagent | Agent Teams |
|-|----------|-------------|
| 인원 | 1명 | 여러 명 |
| 소통 | 결과만 반환 (일방향) | 서로 메시지 주고받음 (양방향) |
| 조율 | 없음 | 공유 태스크 리스트로 조율 |
| 적합한 작업 | 독립적인 단일 작업 | 상호 의존적인 복합 작업 |

### 작동 방식

```
┌──────────────────────────────────────────┐
│              공유 태스크 리스트              │
│  [ ] API 엔드포인트 설계                   │
│  [ ] 프론트엔드 컴포넌트 구현               │
│  [ ] 테스트 작성                           │
└──────────┬───────────┬───────────┬───────┘
           │           │           │
     ┌─────┴─────┐ ┌──┴──────┐ ┌─┴───────┐
     │ Agent A   │ │ Agent B │ │ Agent C │
     │ (백엔드)   │ │(프론트) │ │ (테스트) │
     └───────────┘ └─────────┘ └─────────┘
           │           │           │
           └─── 메시지 주고받음 ───┘
```

### 언제 쓰면 좋은가?

| 상황 | Subagent로 충분 | Agent Teams 필요 |
|------|:---:|:---:|
| Notion + GitHub 병렬 수집 | O | |
| 4개 분석 에이전트 병렬 실행 | O | |
| 대규모 리팩터링 (10+ 파일) | | O |
| 프론트+백엔드 동시 개발 | | O |
| 복잡한 마이그레이션 | | O |

### cuddle-market 적용 현황

현재 미사용. Subagent(병렬 Task)로 현재 작업 규모에는 충분하다. 향후 대규모 마이그레이션이나 멀티파일 리팩터링 시 도입 검토.

---

## 6. Hook — 자동 체크리스트

### 개념

| 항목 | 설명 |
|------|------|
| 근본 원리 | **결정론적 프로그래밍** — AI는 확률적(대부분 맞지만 100%는 아님). Hook은 코드(셸 스크립트)가 실행되므로 **100% 확실하게** 동작 |
| 해결하는 문제 | "린트 돌려줘"를 매번 말하는 대신 파일 수정할 때 자동으로 실행 |
| 비유 | 퇴근할 때 자동으로 체크되는 **자동 체크리스트** |

### 사용 가능한 이벤트

| 이벤트 | 발동 시점 | 활용 예시 |
|--------|----------|----------|
| **PreToolUse** | 도구 실행 **직전** | 위험한 명령어 차단, 특정 파일 수정 차단 |
| **PostToolUse** | 도구 실행 **직후** | 린터 자동 실행, 포맷터 실행 |
| **Stop** | Claude 응답 **완료** 시 | 완료 알림, 시간 기록 |
| **Notification** | 알림 발생 시 | 소리 알림, 슬랙 전송 |

### 설정 방법

`.claude/settings.local.json`에 추가:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[완료] $(date +%H:%M:%S)\""
          }
        ]
      }
    ]
  }
}
```

### matcher로 조건 지정

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx eslint --fix $CLAUDE_FILE_PATH"
          }
        ]
      }
    ]
  }
}
```

> `matcher`에 도구 이름을 지정하면 해당 도구가 사용될 때만 발동. 빈 문자열이면 항상 발동.

### AI에게 시키기 vs Hook

| | AI에게 "린트 돌려" | Hook으로 자동 실행 |
|-|-------------------|--------------------|
| 실행 확률 | 높지만 100%는 아님 | 100% |
| 매번 말해야? | 말해야 함 | 자동 |
| 커스텀 | 자유로움 | 셸 명령어로 제한 |
| 적합한 용도 | 복잡한 판단이 필요할 때 | 단순하고 반복적인 체크 |

### cuddle-market 적용 현황

현재 미사용. 린트 자동 실행, 완료 알림 등의 Hook을 추가하면 작업 효율을 높일 수 있다.

---

## 7. Plugin — 앱스토어 앱

### 개념

| 항목 | 설명 |
|------|------|
| 근본 원리 | **패키징과 배포** — Skill + MCP + Hook + Agent를 하나의 설치 단위로 묶음 |
| 해결하는 문제 | 개별 파일을 일일이 복사/설정하는 수고 → `/plugin install` 한 줄로 해결 |
| 비유 | **앱스토어 앱** — 앱 하나 설치하면 필요한 기능이 다 들어있음 |

### Plugin 구조

```
┌─────────────────────────────────┐
│         My Plugin               │
│                                 │
│  ┌─────────┐  ┌──────────────┐  │
│  │ Skills  │  │ MCP Servers  │  │
│  └─────────┘  └──────────────┘  │
│  ┌─────────┐  ┌──────────────┐  │
│  │ Hooks   │  │ Agents       │  │
│  └─────────┘  └──────────────┘  │
└─────────────────────────────────┘
```

### Official vs Community Plugin

| | Official | Community |
|-|----------|-----------|
| 만든 사람 | Anthropic | 커뮤니티 개발자 |
| 설치 방법 | `/plugin` → 목록에서 선택 | 마켓플레이스 등록 후 설치 |
| 검증 | Anthropic이 검증 | 다양하고 창의적 |
| 비유 | iPhone 기본 앱 | App Store 앱 |

### 설치 명령어

```bash
# 공식 플러그인 (목록에서 선택)
/plugin

# 커뮤니티 마켓플레이스 등록
/plugin marketplace add obra/superpowers-marketplace

# 마켓플레이스에서 플러그인 설치
/plugin install superpowers@superpowers-marketplace
```

### Plugin 안의 Skill 작동 방식

**자동 발동** — 상황에 맞으면 Claude가 알아서 적절한 스킬을 사용:

```
나: "이 코드에서 에러가 나는데 고쳐줘"
     ↓
Claude 판단: "버그 상황이네? systematic-debugging 스킬 쓰자"
     ↓
자동으로 체계적 디버깅 워크플로우 시작
```

**직접 호출** — `/스킬이름`으로 강제 지정:

| 스킬 | 자동 발동 조건 | 직접 호출 |
|------|---------------|----------|
| brainstorming | 새 기능 만들기, 설계 | `/brainstorming` |
| systematic-debugging | 버그, 에러 발생 | `/systematic-debugging` |
| test-driven-development | 기능 구현 전 | `/test-driven-development` |
| writing-plans | 복잡한 멀티스텝 작업 | `/writing-plans` |
| frontend-design | UI 컴포넌트 생성 | `/frontend-design` |
| code-simplifier | 코드 간결화 | `/code-simplifier` |

### cuddle-market 적용 현황

| 플러그인 | 버전 | 포함된 스킬 |
|---------|------|-----------|
| superpowers | v4.3.1 | brainstorming, TDD, debugging, writing-plans, code-review 등 |
| frontend-design | latest | 고퀄리티 프론트엔드 UI 생성 |
| code-simplifier | v1.0.0 | 코드 간결화 및 불필요한 복잡성 제거 |

---

## 부가 기능: MEMORY.md와 History Insight

7가지 핵심 기능 외에 Claude Code에 내장된 **기억/분석 기능** 2가지가 있다.

### 한눈에 비교

| | MEMORY.md | History Insight |
|-|-----------|-----------------|
| **정체** | 메모장 — 기억할 결론만 적어둠 | 일기장 분석기 — 과거 대화 전체를 읽고 패턴을 찾음 |
| **저장 내용** | "PR은 develop에 올려야 해" (결론만) | 과거 세션의 모든 대화 원문 |
| **데이터 크기** | 짧음 (200줄 이내) | 거대함 (세션 파일 수십~수백 개) |
| **작동 방식** | 매 세션 시작 시 **자동 로딩** | `/history-insight`로 **직접 호출** |
| **비유** | 냉장고에 붙인 **포스트잇** | 한 달치 일기장을 펼쳐서 **패턴 분석** |

### 비유로 이해하기

```
매일 일기를 쓴다 (= 세션 대화 기록이 자동 저장됨)
       │
       ├─ MEMORY.md = 냉장고에 붙인 포스트잇
       │    "우유는 매일유업만 사기"
       │    "수요일은 분리수거 날"
       │    → 매일 아침 눈에 보임 (자동 로딩)
       │
       └─ History Insight = 한 달치 일기장을 펼쳐서 분석
            "이번 달에 가장 많이 한 일은?"
            "반복되는 실수 패턴이 있을까?"
            "가장 오래 걸린 작업은?"
            → 필요할 때 직접 요청해야 봄 (/history-insight)
```

### MEMORY.md 상세

#### 저장 위치

프로젝트 디렉토리 안이 아니라, Claude Code의 글로벌 설정 폴더에 저장된다:

```
프로젝트 (보이는 곳)
~/Desktop/cuddle-market/
├── CLAUDE.md              ← git에 포함

메모리 (숨겨진 곳)
~/.claude/projects/-Users-osejin-Desktop-cuddle-market/memory/
└── MEMORY.md              ← 프로젝트 밖, 로컬에만 존재
```

> Finder에서 보려면 `Cmd + Shift + .` (숨김 파일 표시)를 눌러야 한다.

#### 기록되는 방식

MEMORY.md는 사용자가 직접 만드는 것이 아니라, **Claude가 알아서 만들고 업데이트**한다.

| 방법 | 예시 | 설명 |
|------|------|------|
| **자동 감지** | 작업 중 패턴 발견 시 | Claude가 "이건 다음에도 필요하겠다"고 판단하면 알아서 기록 |
| **명시적 지시** | "이거 기억해둬: npm만 써" | 확실하게 기억시키고 싶을 때 |
| **삭제 요청** | "PR 규칙 더 이상 기억하지 마" | 잘못된 기억을 지우고 싶을 때 |

자동 감지 예시:

```
나: "아 PR base가 main이 아니라 develop이야"
Claude: (수정하면서 스스로 판단)
        "이거 중요한 패턴이네, 기록해두자"
        → MEMORY.md에 자동 저장
```

> "기억해둬"라고 명시하지 않아도, 작업 중 수정해준 것을 Claude가 알아서 기록하는 경우가 많다. 다만 확실하게 기억시키고 싶으면 "기억해둘" 같은 표현을 쓰는 게 더 확실하다.

#### CLAUDE.md vs MEMORY.md

| | CLAUDE.md | MEMORY.md |
|-|-----------|-----------|
| 누가 쓰는가 | 사용자가 직접 작성 | Claude가 알아서 기록 |
| 저장 위치 | 프로젝트 루트 (git에 포함) | `~/.claude/projects/...` (git 밖) |
| 목적 | 프로젝트 규칙/설정 | 세션 간 학습한 패턴 기억 |
| 팀 공유 | 가능 (git에 있으니까) | 불가능 (내 로컬에만) |
| 비유 | 회사 규칙서 (공식) | 개인 업무 노트 (비공식) |

### History Insight 상세

#### 세션 히스토리란?

Claude Code와 대화할 때마다 기록이 자동으로 남는다:

- 위치: `~/.claude/projects/` 폴더 안에 자동 저장
- 프로젝트별로 폴더가 나뉘어 있음
- 하나의 세션(대화) = 하나의 파일
- 실제 대화는 전체 파일의 약 **6%**만 차지 (나머지 94%는 파일 변경 이력 등 부속 자료)

#### History Insight가 하는 일

이 세션 기록 파일들을 읽어서 유용한 패턴을 찾아준다:

```
세션 대화 기록 (파일)
    │
history-insight 스킬이 읽기
    │
불필요한 부분 제거 (94%의 부속 자료)
    │
실제 대화만 추출 (6%)
    │
인사이트 분석 + 리포트
```

#### 활용 예시

| 질문 | History Insight가 해주는 것 |
|------|---------------------------|
| "이번 주에 가장 많이 한 작업이 뭐였지?" | 세션별 작업 내용을 분류하고 빈도순 정리 |
| "내가 자주 하는 실수 패턴이 있을까?" | 반복되는 오류, 재시도 패턴 추출 |
| "가장 긴 세션은 어떤 작업이었어?" | 세션별 길이와 작업 내용 비교 |
| "프로젝트별로 어떤 작업을 했는지 정리해줘" | 프로젝트 폴더별 세션 분류 및 요약 |

#### 둘의 관계 — 보완적

```
History Insight로 패턴 발견
  "나는 PR base를 자주 틀리네"
       │
       ▼
MEMORY.md에 결론 저장
  "PR base: 항상 develop"
       │
       ▼
다음 세션부터 자동 적용
```

History Insight가 발견한 인사이트 중 중요한 것을 MEMORY.md에 기록하면, 매번 분석하지 않아도 Claude가 기억한다.

---

## MCP vs Skill — 언제 뭘 쓸까?

MCP 서버는 **남이 만들어둔 범용 도구**이고, Skill은 **내 워크플로우에 맞춘 레시피**이다.

```
MCP 서버 (남이 만든 것)              나만의 Skill (직접 만든 것)
  ├─ 설치 즉시 사용 가능              ├─ 내 워크플로우에 딱 맞게 설계
  ├─ 범용적 기능 제공                 ├─ 필요한 기능만 조합
  ├─ 커스텀이 어려움                  ├─ 자유롭게 수정 가능
  └─ 모든 기능이 다 필요한 건 아님     └─ 진짜 효율적인 자동화
```

예시: Notion MCP를 설치하면 페이지를 읽고 쓸 수 있다. 하지만 **"매일 아침 Notion 태스크 + GitHub PR을 수집해서 Daily Scrum 페이지를 자동 생성해줘"** 같은 나만의 워크플로우는 MCP만으로는 안 된다 → **Skill로 만들어야 한다** (= context-sync 스킬).

> **결론: MCP로 도구를 연결하고, Skill로 워크플로우를 자동화한다.**

---

## camp-1에서 만든 커스텀 스킬 목록

### my-context-sync — 정보 수집 + 통합

```
Notion + GitHub에서 병렬 수집 → 하나의 마크다운 문서로 통합 → Daily Scrum 페이지 자동 생성
```

- 트리거: `/context-sync`, "싱크", "sync"
- Subagent 2개 병렬 실행 (Notion 수집 + GitHub 수집)
- 출력: `sync/YYYY-MM-DD-context-sync.md` + Notion Daily Scrum 페이지

### my-session-wrap — 세션 마무리

```
Git 상태 확인 → 4개 분석 에이전트 병렬 실행 → 중복 검증 → 사용자 선택 → 실행
```

- 트리거: `/wrap`, "세션 정리", "마무리"
- 4개 에이전트: doc-updater, automation-scout, learning-extractor, followup-suggester
- 사용자가 실행할 작업을 선택 (커밋, 문서 업데이트, 자동화 생성, 건너뛰기)

### my-fetch-tweet — 트윗 번역

```
트윗 URL → FxEmbed API로 원문 가져오기 → 요약 → 인사이트 3개 → 전체 한국어 번역
```

- 트리거: "트윗 번역", "트윗 가져와", "X 게시글"
- FxEmbed API: `https://api.fxtwitter.com/{screen_name}/status/{status_id}`
- 3단계 출력: 요약(3-5문장) → 인사이트(핵심/시사점/적용점) → 전체 번역

### my-fetch-youtube — 유튜브 번역

```
유튜브 URL → yt-dlp로 자막 추출 → Web Search로 용어 보정 → 요약 → 인사이트 → 전체 번역
```

- 트리거: "유튜브 번역", "영상 정리", "YouTube 요약"
- 자막 언어 우선순위: 한국어 수동 > 영어 수동 > 한국어 자동 > 영어 자동
- 핵심: Web Search로 고유명사/전문용어 보정 (예: "Cloud" → "Claude")
- 10분 이상 영상은 Subagent(Task)로 처리

### my-content-digest — 퀴즈 기반 학습

```
콘텐츠 입력 → Pre-Quiz 3문제 → 학습 방식 선택 → 본 퀴즈 9문제 (기본3+중급3+심화3) → 최종 결과
```

- 트리거: "콘텐츠 소화", "퀴즈", "학습", "digest"
- Quiz-First 방식: 퀴즈를 먼저 풀어서 틀린 부분에 호기심 유발 → 학습 효과 9-12% 향상
- 4지선다 × 12문제 (Pre-Quiz 3 + 본 퀴즈 9)

---

## 부록: camp-1 커리큘럼 구조

| Day | 주제 | 배우는 것 |
|-----|------|----------|
| 1 | 온보딩 | Claude Code 7가지 핵심 기능 (이 문서 내용) |
| 2 | MCP 딥다이브 | MCP 서버 추가/관리 + context-sync 스킬 만들기 |
| 4 | 분석과 정리 | session-wrap 스킬 만들기 + 세션 히스토리 분석 |
| 5 | 콘텐츠 소화 | fetch-tweet + fetch-youtube + content-digest 만들기 |
| 6 | PRD 제출 | 학습 결과물을 PRD로 정리하여 제출 |
