# oh-my-claudecode (OMC) 학습 가이드

## 한줄 요약

Claude Code를 위한 **다중 에이전트 오케스트레이션 플러그인**. 여러 AI 에이전트에게 역할을 분배하고 병렬로 작업시키는 도구.

---

## 핵심 기능

### 1. 실행 모드

| 모드 | 설명 | 사용 예 |
|------|------|---------|
| **Team** | 단계별 파이프라인 (plan→prd→exec→verify→fix) | `/team 3:executor "fix all TS errors"` |
| **omc-teams** | tmux 기반 CLI 워커 (Codex/Gemini 연동) | `/omc-teams 2:codex "security review"` |
| **ccg** | 트라이-모델 병렬 (Claude+Codex+Gemini) | `/ccg review this PR` |
| **autopilot** | 완전 자율 실행 | `autopilot: build a todo app` |
| **ultrawork** | 최대 병렬화 | `ulw fix all errors` |
| **ralph** | 지속 모드 (완전 완료 보장) | `ralph: refactor auth` |

### 2. 32개 전문 에이전트

architect, executor, reviewer, designer, tester 등 역할별 에이전트 자동 배정

### 3. 스킬 학습

세션에서 문제 해결 패턴을 자동 추출하고 재사용 (`/omc-skills list`)

### 4. 비용 최적화

간단한 작업은 Haiku, 복잡한 추론은 Opus로 자동 라우팅 (토큰 30-50% 절약 주장)

---

## 설치 방법 (3단계)

```bash
# 1. 마켓플레이스 등록
/plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode

# 2. 플러그인 설치
/plugin install oh-my-claudecode

# 3. 초기 설정
/omc-setup
```

---

## 실행 모드 상세 설명

### 기본 개념: 일반 Claude Code vs OMC

일반 Claude Code는 **개발자 1명**이 혼자 일하는 것입니다.

```
Claude 1명 → 파일A 에러 수정 → 파일B 에러 수정 → 파일C 에러 수정 (순차)
```

OMC는 **여러 에이전트를 동시에 투입**하는 것입니다.

```
executor 1 → 파일A 에러 수정 ─┐
executor 2 → 파일B 에러 수정 ─┼→ 결과 합침 → 검증
executor 3 → 파일C 에러 수정 ─┘
```

---

### 1. Team 모드 (기본 권장)

**역할별 에이전트를 N명 투입**해서 파이프라인(plan→prd→exec→verify→fix)으로 돌림.

```
/team  3:executor  "fix all TS errors"
  │      │  │         │
  │      │  │         └─ 작업 내용
  │      │  └─ 역할 (executor, architect, reviewer 등)
  │      └─ 에이전트 수 (3명)
  └─ 모드

→ "executor 역할 3명을 뽑아서 병렬로 TS 에러 수정시켜"
```

실제 실행 흐름 (자동 파이프라인):

```
1. plan     → "TS 에러가 어디에 몇 개 있는지" 분석
2. prd      → "어떤 순서로 뭘 고칠지" 요구사항 정리
3. exec     → executor 3명이 병렬로 에러 수정 (핵심 단계)
4. verify   → 수정 결과 검증 (빌드 통과하는지 등)
5. fix      → 검증 실패 시 다시 수정 (반복)
```

---

### 2. omc-teams 모드 (멀티 AI)

Team 모드와 비슷하지만, **Claude가 아닌 다른 AI CLI를 워커로 사용**하는 것.

```
/omc-teams  2:codex  "review auth module for security issues"
    │        │  │         │
    │        │  │         └─ 작업 내용
    │        │  └─ AI 종류 (codex, gemini, claude 중 택)
    │        └─ 워커 수 (2개)
    └─ 모드

→ "OpenAI Codex 2개를 터미널에 띄워서 보안 리뷰시켜"
```

Team은 Claude 에이전트를 쓰는 거고, omc-teams는 **다른 회사 AI CLI**를 쓰는 것. 그래서 Codex나 Gemini가 별도 설치되어 있어야 함.

```
/omc-teams 2:codex  → OpenAI의 Codex CLI 2개가 작업
/omc-teams 2:gemini → Google의 Gemini CLI 2개가 작업
/omc-teams 1:claude → Claude CLI 1개가 작업
```

tmux(터미널 분할 도구)로 실제 별도 프로세스를 띄워서 돌림.

---

### 3. ccg 모드 (트라이-모델)

**C**laude + **C**odex + **G**emini, 세 AI를 **동시에** 같은 작업에 투입.

```
/ccg  review this PR
  │        │
  │        └─ 작업 내용
  └─ Claude + Codex + Gemini 동시 실행

→ "Claude, Codex, Gemini 세 AI한테 동시에 이 PR 리뷰시켜"
```

수나 역할 지정 없음. 무조건 **3개 AI가 동시에** 같은 일을 하고 결과를 합침.

```
Claude  → 종합 판단 ─┐
Codex   → 아키텍처 검증 ─┼→ 결과 통합
Gemini  → UI/대용량 분석 ─┘
```

같은 문제를 세 관점에서 보게 하는 것. 코드 리뷰처럼 **다양한 시각이 필요한 작업**에 적합.

---

### 4. autopilot 모드 (완전 자율)

사람 개입 없이 **처음부터 끝까지 알아서** 하는 모드.

```
autopilot:  build a REST API with Node.js
    │              │
    │              └─ 작업 내용
    └─ 모드

→ "처음부터 끝까지 알아서 다 만들어. 중간에 나한테 묻지 마"
```

수도 역할도 없음. 알아서 필요한 에이전트를 **자동 배정**하고 plan→구현→테스트→검증까지 혼자 돌림.

```
자동으로 plan → 설계 → 구현 → 테스트 → 리뷰 → 수정 반복
```

중간에 질문 안 함. "다 만들어놓을 테니 기다려"라는 느낌. 새 기능을 통째로 만들 때 사용.

---

### 5. ultrawork (ulw) 모드 (최대 병렬화)

autopilot과 비슷하지만 **병렬화를 극대화**한 모드.

```
ulw  fix all errors
 │        │
 │        └─ 작업 내용
 └─ 모드 (ultrawork 약자)

→ "에러 전부 고쳐. 최대한 많이 동시에 병렬로 빠르게"
```

파일 여러 개를 동시에 수정하거나, 대규모 리팩토링처럼 **양이 많고 독립적인 작업**에 적합.

```
autopilot: 한 에이전트가 순차적으로 꼼꼼하게
ultrawork: 여러 에이전트가 동시에 빠르게
```

---

### 6. ralph 모드 (지속 모드)

**끝날 때까지 절대 멈추지 않는** 모드.

```
ralph:  refactor auth
  │          │
  │          └─ 작업 내용
  └─ 모드

→ "auth 리팩토링해. 성공할 때까지 절대 멈추지 마"
```

일반적으로 Claude Code는 중간에 멈추거나 확인을 요청할 수 있는데, ralph는 검증이 완전히 통과할 때까지 스스로 반복.

```
실행 → 실패 → 다시 시도 → 실패 → 다시 시도 → ... → 성공할 때까지
```

다른 모드는 실패하면 멈추고 보고할 수 있음. ralph는 **검증 통과할 때까지 무한 반복**. 끝장을 보는 모드.

---

### 7. pipeline 모드 (순차 처리)

병렬이 아니라 **정해진 순서대로 하나씩** 실행.

```
pipeline:  lint → format → test → build
    │              │
    │              └─ 단계들 (순서대로)
    └─ 모드

→ "lint 먼저 하고, 끝나면 format, 끝나면 test, 끝나면 build. 순서 지켜"
```

앞 단계가 끝나야 다음 단계로 넘어감. 빌드 파이프라인처럼 **순서가 중요한 작업**에 사용. 다른 모드들은 병렬이 핵심인데, pipeline은 반대로 **순서가 핵심**.

---

## 모드 비교 요약

### 한눈에 비교

| 모드 | 지정하는 것 | 핵심 한마디 |
|------|------------|-----------|
| `/team 3:executor` | 역할 + 수 | "이 역할 N명 투입" |
| `/omc-teams 2:codex` | AI종류 + 수 | "다른 AI N개 투입" |
| `/ccg` | 없음 (고정) | "3개 AI 전부 투입" |
| `autopilot:` | 없음 (자동) | "알아서 다 해" |
| `ulw` | 없음 (자동) | "알아서 빠르게 다 해" |
| `ralph:` | 없음 (자동) | "끝날 때까지 해" |
| `pipeline:` | 단계 순서 | "이 순서대로 해" |

### 특징별 비교

| 모드 | 핵심 특징 | 비유 |
|------|----------|------|
| **team** | 역할 분배 + 파이프라인 | 팀 프로젝트 |
| **omc-teams** | 다른 AI CLI 사용 | 외주 업체 투입 |
| **ccg** | 3개 AI 동시 투입 | 3명에게 같은 과제 시키고 비교 |
| **autopilot** | 완전 자율 순차 | "알아서 다 해놔" |
| **ultrawork** | 최대 병렬 자율 | "빠르게 알아서 다 해놔" |
| **ralph** | 성공할 때까지 반복 | "끝장 봐" |
| **pipeline** | 순차 단계 실행 | 공장 컨베이어 벨트 |

---

## 추천 학습 순서

1. 설치 후 `/omc-setup`으로 초기화
2. **Team 모드**부터 시작 — 가장 기본적인 오케스트레이션
3. **autopilot** 모드로 GraphQL + Next.js API Route 생성 시도
4. 같은 작업을 기본 Claude Code로도 해보고 **비교 기록** → 블로그 소재
