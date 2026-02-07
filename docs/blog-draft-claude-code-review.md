# GitHub PR에 Claude 봇으로 자동 코드 리뷰 받기

> Claude Code GitHub Action을 활용하여 PR에 자동으로 AI 코드 리뷰를 받는 방법을 소개합니다.

## 📌 들어가며

코드 리뷰는 소프트웨어 품질을 높이는 핵심 활동이지만, 팀원이 부족하거나 리뷰어의 시간이 제한적일 때 병목이 되기도 합니다. 이런 상황에서 AI를 활용한 자동 코드 리뷰가 좋은 보조 수단이 될 수 있습니다.

이 글에서는 **Anthropic의 Claude Code GitHub Action**을 사용하여 PR이 생성될 때마다 자동으로 코드 리뷰를 받는 방법을 단계별로 설명합니다.

## 🎯 최종 결과물

설정이 완료되면, PR을 생성할 때마다 `claude` 봇이 자동으로 다음과 같은 리뷰를 작성합니다:

![Claude 코드 리뷰 예시](./images/claude-review-example.png)

- ✅ 코드 품질 및 가독성 분석
- ✅ 잠재적 버그 및 보안 취약점 검토
- ✅ 개선 제안 및 모범 사례 안내
- ✅ 한국어로 상세한 피드백 제공

---

## 🛠 설정 방법

### 1단계: Anthropic API 키 발급

1. [Anthropic Console](https://console.anthropic.com/)에 접속
2. API Keys 메뉴에서 새 API 키 생성
3. 생성된 키를 안전하게 보관

### 2단계: GitHub Repository Secrets 설정

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. Name: `ANTHROPIC_API_KEY`
4. Secret: 1단계에서 발급받은 API 키 입력
5. **Add secret** 클릭

![GitHub Secrets 설정](./images/github-secrets.png)

### 3단계: GitHub Workflow 파일 생성

`.github/workflows/claude-review.yml` 파일을 생성합니다:

```yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, ready_for_review]
  issue_comment:
    types: [created]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    if: |
      github.event_name == 'pull_request' ||
      (github.event_name == 'issue_comment' &&
       github.event.issue.pull_request &&
       contains(github.event.comment.body, '@claude re-review'))
    permissions:
      contents: read
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 1
          ref: ${{ github.event_name == 'issue_comment' && format('refs/pull/{0}/head', github.event.issue.number) || github.ref }}

      - name: Run Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            이 PR의 코드를 리뷰해주세요. 한국어로 답변해주세요.

            다음 항목들을 확인해주세요:
            - 코드 품질 및 가독성
            - 잠재적인 버그나 에러
            - 성능 이슈
            - 보안 취약점
            - 모범 사례 준수 여부

            발견된 문제점과 개선 제안을 구체적으로 설명해주세요.
```

### 4단계: Workflow 파일 커밋 및 푸시

```bash
git add .github/workflows/claude-review.yml
git commit -m "chore: Claude Code Review 워크플로우 추가"
git push origin main
```

---

## ⚙️ 설정 상세 설명

### 트리거 이벤트

```yaml
on:
  pull_request:
    types: [opened, ready_for_review]
  issue_comment:
    types: [created]
```

| 이벤트 | 설명 |
|--------|------|
| `opened` | 새 PR이 생성될 때 |
| `ready_for_review` | Draft PR이 리뷰 준비 상태로 변경될 때 |
| `issue_comment` | `@claude re-review` 코멘트로 재리뷰 요청 |

> **💡 Tip:** `synchronize` 이벤트를 추가하면 커밋이 푸시될 때마다 리뷰가 실행되지만, API 비용이 증가할 수 있습니다. 필요에 따라 추가하세요.

### 권한 설정

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
  id-token: write
```

| 권한 | 용도 |
|------|------|
| `contents: read` | 코드 읽기 |
| `pull-requests: write` | PR에 코멘트 작성 |
| `issues: write` | 이슈 코멘트 작성 (재리뷰용) |
| `id-token: write` | OIDC 토큰 인증 |

### 프롬프트 커스터마이징

프로젝트 특성에 맞게 프롬프트를 수정할 수 있습니다:

```yaml
prompt: |
  이 PR의 코드를 리뷰해주세요. 한국어로 답변해주세요.

  우리 프로젝트는 Next.js + TypeScript 기반입니다.
  다음 항목들을 중점적으로 확인해주세요:
  - React 컴포넌트 설계 패턴
  - TypeScript 타입 안정성
  - Next.js App Router 규칙 준수
  - 접근성(a11y) 고려 여부
```

---

## 🔄 재리뷰 요청하기

코드를 수정한 후 다시 리뷰를 받고 싶다면, PR에 다음과 같이 코멘트를 남기세요:

```
@claude re-review
```

Claude가 변경된 코드를 다시 분석하고 새로운 리뷰를 작성합니다.

---

## 💰 비용 안내

Claude Code Review는 Anthropic API를 사용하므로 비용이 발생합니다.

| 항목 | 예상 비용 |
|------|-----------|
| 일반적인 PR 1회 리뷰 | $0.10 ~ $0.20 |
| 대규모 PR 리뷰 | $0.20 ~ $0.50 |

> **비용 절감 팁:**
> - `synchronize` 이벤트 제외 (매 커밋마다 실행 방지)
> - Draft PR에서는 리뷰 생략
> - 필요시에만 `@claude re-review`로 재리뷰

---

## 🔧 Vercel과 함께 사용하기

Vercel을 사용하는 프로젝트에서는 PR 프리뷰 빌드와 함께 Claude 리뷰를 받을 수 있습니다.

### Vercel Ignored Build Step 설정

Vercel 대시보드 → Settings → Git → Ignored Build Step에서:

```bash
if [ "$VERCEL_GIT_COMMIT_REF" == "main" ] || [ "$VERCEL_GIT_COMMIT_REF" == "develop" ] || [ "$VERCEL_GIT_PULL_REQUEST_ID" != "" ]; then exit 1; else exit 0; fi
```

이 설정으로:
- `main`, `develop` 브랜치 → 배포 빌드 실행
- PR 브랜치 → 프리뷰 빌드 실행 (빌드 검증)
- 기타 브랜치 → 빌드 스킵

---

## ⚠️ 주의사항 및 트러블슈팅

### 1. Workflow 파일이 main 브랜치에 있어야 함

Claude Code Action은 **main(또는 default) 브랜치에 있는 워크플로우 파일**을 기준으로 실행됩니다. 새 브랜치에서 워크플로우를 수정해도 즉시 반영되지 않습니다.

### 2. OIDC 토큰 에러

```
Error: Workflow validation failed
```

이 에러가 발생하면:
1. `id-token: write` 권한이 있는지 확인
2. 워크플로우 파일이 main 브랜치에 푸시되었는지 확인
3. GitHub Actions 인덱싱을 위해 몇 분 대기 후 재시도

### 3. API 키 에러

```
Error: Invalid API key
```

- GitHub Secrets에 `ANTHROPIC_API_KEY`가 올바르게 설정되었는지 확인
- API 키에 공백이나 줄바꿈이 포함되지 않았는지 확인

---

## 🎉 마무리

Claude Code Review를 설정하면 다음과 같은 이점이 있습니다:

1. **일관된 코드 리뷰** - 모든 PR에 동일한 기준으로 리뷰
2. **빠른 피드백** - PR 생성 즉시 리뷰 시작
3. **학습 기회** - AI의 제안을 통해 새로운 패턴 학습
4. **리뷰어 부담 감소** - 기본적인 검토를 AI가 수행

물론 AI 리뷰가 인간 리뷰어를 완전히 대체할 수는 없습니다. 비즈니스 로직 검토, 아키텍처 결정 등은 여전히 팀원의 리뷰가 필요합니다. Claude는 **보조 도구**로 활용하는 것이 좋습니다.

---

## 📚 참고 자료

- [Claude Code GitHub Action 공식 문서](https://github.com/anthropics/claude-code-action)
- [Anthropic API 문서](https://docs.anthropic.com/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)

---

*이 글이 도움이 되셨다면 ⭐ 스타와 공유 부탁드립니다!*
