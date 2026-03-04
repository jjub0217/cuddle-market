# Context Sync (컨텍스트 싱크)

흩어진 정보를 한곳에 모아 정리하는 명령어.
Notion, GitHub에서 최근 정보를 수집하고, 하나의 마크다운 문서로 통합한 뒤 Notion Daily Scrum 페이지를 생성한다.

## 소스 정의

### 소스 1: Notion

| 항목 | 값 |
|------|-----|
| MCP 도구 | `claude.ai Notion Connector` |
| 수집 범위 | 커들마켓(단독) 워크스페이스 |
| 메인 페이지 | `30ff2b30-7961-8198-bbd5-fbfba975ed5d` |

```yaml
databases:
  - name: "TASK DISTRIBUTION (커들마켓 | To do List)"
    id: "30ff2b30-7961-81f3-92a4-e9ac6a1dbb86"
    data_source: "collection://30ff2b30-7961-81a5-b511-000b5ad5df72"
    상태옵션: [시작 전, 개발 진행 중, 개발 완료, 배포 완료]
    속성: [이름, 상태, 담당자, 마감기한, 역할, PR Link]

  - name: "DAILY SCRUM (커들마켓 | Daily Scrum)"
    id: "30ff2b30-7961-817e-9601-d836505c5b04"
    data_source: "collection://30ff2b30-7961-8188-b8e3-000b2e8ee8aa"
    속성: [이름, 구분, 작성일시, 참여자]

  - name: "Team Schedule Calendar (커들마켓 | Schedule List)"
    id: "30ff2b30-7961-8138-990e-e9ea63d1c151"
    data_source: "collection://30ff2b30-7961-814b-81ed-000b7173558e"
```

수집 방법:
```
[도구 로딩 — ToolSearch 키워드]
  - Connector 도구: ToolSearch(query="+notion fetch search create") → notion-fetch, notion-search, notion-create-pages 등
  - API 도구: ToolSearch(query="+notion post-search update") → API-post-search, notion-update-page 등

[정상 작동하는 도구]
  - mcp__claude_ai_Notion__notion-fetch: DB/페이지 상세 조회 (⚠️ 페이지 ID 또는 DB ID만 사용. view://, collection:// 등의 URL은 전달 불가)
  - mcp__claude_ai_Notion__notion-search: 텍스트 유사도 기반 검색만 가능
  - mcp__claude_ai_Notion__notion-create-pages: 페이지 생성
  - mcp__notion__API-post-search: 전체 페이지 목록 조회 (아래 올바른 사용법 참조)

[절대 사용 금지 — MCP 서버 버그]
  - mcp__notion__API-query-data-source ❌ 절대 호출하지 마라. ToolSearch로 로딩도 하지 마라.
  - mcp__notion__API-retrieve-a-data-source ❌ 동일한 버그.

[notion-search 제한사항 — 상태/속성 필터링 불가]
  ⚠️ notion-search는 semantic search(텍스트 유사도)만 지원한다.
  "시작 전", "개발 진행 중" 등 상태값으로 필터링하는 것은 불가능하다.
  상태/속성 기반 필터링이 필요하면 다음 전략을 사용할 것:
    1. API-post-search로 전체 페이지 목록 조회
    2. notion-fetch로 각 DB의 페이지 목록 조회
    3. 조회된 결과를 코드(Bash + Python/jq)로 필터링

[API-post-search 올바른 사용법]
  ⚠️ filter.property 값은 반드시 "object"를 사용할 것. "page"는 value에만 사용 가능.
  올바른 예시:
    mcp__notion__API-post-search(
      query: "",
      filter: { "property": "object", "value": "page" },
      page_size: 100
    )
  잘못된 예시 (400 에러 발생):
    filter: { "property": "page", "value": "page" }  ❌

[Daily Scrum 페이지 본문 조회 필수]
  ⚠️ 최근 Daily Scrum 내용을 보고할 때, 반드시 notion-fetch로 해당 페이지의 실제 본문을 조회할 것.
  다른 날짜의 "금일 예정"을 전용하지 마라. 실제 페이지 ID로 fetch하여 확인할 것.

[병렬 호출 주의]
  실패 가능성이 있는 도구(notion-fetch 등)와 다른 도구를 병렬 호출하면,
  하나가 실패할 때 나머지도 연쇄 취소된다. 확실한 호출만 병렬로 묶을 것.
```

추출할 정보:
- TASK DISTRIBUTION: 진행 중인 태스크 (상태: "시작 전", "개발 진행 중"), 기한 초과 태스크 (마감기한 < 오늘 & 상태 ≠ "배포 완료"), 기한 임박 태스크 (마감기한이 3일 이내)
- DAILY SCRUM: 가장 최근 Daily Scrum 내용 (전일 업무, 금일 예정)
- Schedule List: 최근 등록된 개발 일정
- 최근 업데이트된 페이지

### 소스 2: GitHub

| 항목 | 값 |
|------|-----|
| 도구 | `gh` CLI |
| 수집 범위 | 최근 7일 |
| 대상 레포 | `jjub0217/cuddle-market` |

수집 방법:
```
gh CLI를 사용하여 커들마켓 레포에서 PR, 이슈, 커밋 정보를 수집한다.

호출 예시:
  gh pr list --repo jjub0217/cuddle-market --state open --json title,url,createdAt,author,reviewDecision
  gh pr list --repo jjub0217/cuddle-market --state merged --json title,url,mergedAt,author --limit 20
  gh issue list --repo jjub0217/cuddle-market --state open --json title,url,labels,assignees
  gh api repos/jjub0217/cuddle-market/commits --jq '.[0:10] | .[] | {message: .commit.message, date: .commit.author.date, sha: .sha[0:7]}'
```

추출할 정보:
- 열린 PR 목록 및 리뷰 상태
- 최근 머지된 PR (7일 이내)
- 나에게 할당된 이슈
- 최근 커밋 내역
- 어제/오늘 커밋 내역 (Daily Scrum 전일/금일 업무용)

## 실행 흐름

### 1단계: 병렬 수집

2개 소스를 **동시에** 수집한다. 서로 의존성이 없으므로 병렬 실행이 가능하다.

```
수집 시작
  ├── [소스 1] Notion 태스크/스크럼 수집     ─┐
  └── [소스 2] GitHub PR/이슈/커밋 수집     ─┘ 병렬 실행 (Task 도구 사용)
수집 완료
```

각 소스 수집은 subagent(Task 도구)로 실행한다.
subagent prompt에는 반드시 위 "수집 방법"의 도구 제한사항을 포함해야 한다:

```
Task(description="Notion 수집", prompt="
  오늘 날짜: {오늘}. 어제: {어제}.

  ## 도구 제한사항 (필수 준수)
  [금지] mcp__notion__API-query-data-source, mcp__notion__API-retrieve-a-data-source는 절대 호출하지 마라. ToolSearch로 로딩도 하지 마라.
  [금지] mcp__claude_ai_Notion__notion-fetch에 view://, collection:// URL을 전달하지 마라. 페이지/DB ID만 사용.
  [금지] notion-search로 상태/속성 필터링을 시도하지 마라. semantic search는 텍스트 유사도만 지원한다.
  [제한] 실패 가능성이 있는 도구를 다른 도구와 병렬 호출하지 마라.

  ## 도구 로딩
  [ToolSearch 1] ToolSearch(query='+notion fetch search create') → notion-fetch, notion-search 등
  [ToolSearch 2] ToolSearch(query='+notion post-search update') → API-post-search, notion-update-page 등

  ## 수집 전략 (이 순서대로 실행)
  1단계: notion-fetch로 3개 DB 스키마 조회 (순차 호출, 병렬 금지)
    - TASK DISTRIBUTION: 30ff2b30-7961-81f3-92a4-e9ac6a1dbb86
    - DAILY SCRUM: 30ff2b30-7961-817e-9601-d836505c5b04
    - Schedule List: 30ff2b30-7961-8138-990e-e9ea63d1c151
  2단계: API-post-search로 전체 페이지 목록 조회
    ⚠️ filter는 반드시 { 'property': 'object', 'value': 'page' } 사용. 'property': 'page'는 400 에러 발생.
  3단계: Bash + Python으로 DB별 페이지 분류 및 속성 필터링
  4단계: 최근 Daily Scrum 페이지 본문을 notion-fetch로 실제 조회
    ⚠️ 다른 날짜의 '금일 예정'을 전용하지 마라. 반드시 해당 페이지 ID로 fetch할 것.

  ## 수집 대상
  ... (수집할 내용)
")

Task(description="GitHub 수집", prompt="
  오늘 날짜: {오늘}. 어제: {어제}.

  ## 필수 규칙
  [금지] 명령어를 실행하지 않고 결과를 추론/추정하지 마라. 반드시 모든 명령어를 Bash로 실행할 것.
  [필수] 아래 6개 명령어를 모두 실행해야 한다. 하나도 빠뜨리지 마라.
  [검증] 최종 결과에 포함된 모든 데이터는 실제 명령어 실행 결과여야 한다.

  ## 실행할 명령어 (6개 전부 필수)
  1. gh pr list --repo jjub0217/cuddle-market --state open --json title,url,createdAt,author,reviewDecision
  2. gh pr list --repo jjub0217/cuddle-market --state merged --json title,url,mergedAt,author --limit 20
  3. gh issue list --repo jjub0217/cuddle-market --state open --json title,url,labels,assignees
  4. gh api repos/jjub0217/cuddle-market/commits --jq '.[0:10] | .[] | {message: .commit.message, date: .commit.author.date, sha: .sha[0:7]}'
  5. gh api 'repos/jjub0217/cuddle-market/commits?since={어제}T00:00:00Z&until={오늘}T00:00:00Z' --jq '.[] | {message: .commit.message, date: .commit.author.date, sha: .sha[0:7]}'
  6. gh api 'repos/jjub0217/cuddle-market/commits?since={오늘}T00:00:00Z&until={내일}T00:00:00Z' --jq '.[] | {message: .commit.message, date: .commit.author.date, sha: .sha[0:7]}'

  ## 실행 방식
  - 명령어 1~3은 서로 독립적이므로 병렬 실행 가능
  - 명령어 4~6은 서로 독립적이므로 병렬 실행 가능
  - 총 2번의 병렬 호출로 6개 명령어를 모두 실행할 것
")
```

### 2단계: 결과 통합

수집된 정보를 하나의 문서로 합친다.

통합 규칙:
- 소스별 섹션으로 구분
- 각 섹션에서 "하이라이트" (중요 항목 3개 이내)를 선별
- 액션 아이템을 문서 하단에 모아서 정리
- 수집 실패한 소스는 "수집 실패" 표시와 함께 사유 기록

### 3단계: 문서 저장

결과 파일을 현재 프로젝트에 저장한다.

```
저장 위치: sync/YYYY-MM-DD-context-sync.md
```

### 4단계: Notion Daily Scrum 페이지 생성

대상 DB: `커들마켓 | Daily Scrum` (data_source: `30ff2b30-7961-8188-b8e3-000b2e8ee8aa`)

**Notion 마크다운 스펙 확인 필수**: 페이지 생성 전에 반드시 `ReadMcpResourceTool(server="claude.ai Notion", uri="notion://docs/enhanced-markdown-spec")`으로 스펙을 확인할 것.

#### 사실 기반 원칙 (필수 준수)

Daily Scrum 페이지 내용은 **검증 가능한 사실만** 기재한다.

```
[허용되는 소스 — 사실]
  ✅ GitHub 커밋 (SHA, 메시지, 날짜)
  ✅ GitHub PR (머지 여부, 번호, 제목)
  ✅ GitHub 이슈 (열림/닫힘 상태)
  ✅ Notion TASK DISTRIBUTION에 실제 등록된 태스크 (상태 확인 필수)

[금지 — 추정/추론]
  ❌ 커밋 없는 날에 "학습 진행", "준비 중" 등 활동 추정
  ❌ 이전 Daily Scrum의 "금일 예정"을 다음 날 "전일 업무"로 전용
  ❌ TASK DISTRIBUTION에 등록되지 않은 태스크를 예정 업무로 기재
  ❌ "멘토 피드백 대기", "블로그 검토" 등 커밋/PR로 확인 불가능한 활동

[전일 업무 작성 규칙]
  1. 해당 날짜의 전일(또는 마지막 근무일) GitHub 커밋을 조회한다
  2. 커밋이 있으면: 커밋 메시지 기반으로 작업 내용을 요약한다
  3. 커밋이 없으면: "개발 커밋 없음"으로 기재한다
  4. 머지된 PR이 있으면: PR 번호와 제목을 포함한다

[금일 예정 작성 규칙]
  1. 해당 날짜의 GitHub 커밋을 조회한다 (이미 지난 날짜인 경우)
  2. 커밋이 있으면: 실제 커밋 내용 기반으로 작성한다
  3. 커밋이 없으면: "개발 커밋 없음"으로 기재한다
  4. 오늘 날짜인 경우만: 열린 이슈 + TASK DISTRIBUTION "개발 진행 중" 태스크로 작성 가능
```

페이지 속성:
```yaml
이름: "YYYY년 M월 D일"          # 예: "2026년 2월 24일"
구분: "개발"
date:작성일시:start: "YYYY-MM-DD"
date:작성일시:is_datetime: 0
참여자: '["7c32774b-0096-4545-a9fe-7cfec90faa15"]'  # 강주현
```

페이지 내용 (Notion-flavored Markdown):
```markdown
## 전일 업무 진행상황 보고 {color="purple_bg"}
---
<table>
	<tr>
		<td>강주현</td>
		<td>(GitHub 전일 커밋 기반으로만 작성. 커밋 없으면 "개발 커밋 없음")</td>
	</tr>
</table>
## 금일 예정 업무 보고 {color="purple_bg"}
---
<table>
	<tr>
		<td>강주현</td>
		<td>(과거 날짜: 해당일 실제 커밋 기반. 오늘: 열린 이슈 + TASK DISTRIBUTION 진행 중 태스크. 없으면 "개발 커밋 없음")</td>
	</tr>
</table>
## 회의 안건 {color="purple_bg"}
---
- \-
## 추가 논의사항 (ex. 이슈, 휴가 사용 예정 공유) {color="purple_bg"}
---
- \-
```

Notion 페이지 생성 도구:
```
mcp__claude_ai_Notion__notion-create-pages(
  parent={"data_source_id": "30ff2b30-7961-8188-b8e3-000b2e8ee8aa"},
  pages=[{properties: {...}, content: "..."}]
)
```

참여자 속성은 페이지 생성 후 별도로 업데이트:
```
mcp__claude_ai_Notion__notion-update-page(
  page_id="생성된 페이지 ID",
  command="update_properties",
  properties={"참여자": '["7c32774b-0096-4545-a9fe-7cfec90faa15"]'}
)
```

### 5단계: 리포트

실행 결과를 사용자에게 보고한다.

```
싱크 완료!

수집 결과:
  Notion: N개 태스크, N개 스크럼
  GitHub: N개 PR, N개 이슈

하이라이트 3건:
  1. ...
  2. ...
  3. ...

액션 아이템 N건:
  - [ ] ...

출력:
  싱크 문서: sync/YYYY-MM-DD-context-sync.md
  Notion Daily Scrum: (페이지 URL)
```
