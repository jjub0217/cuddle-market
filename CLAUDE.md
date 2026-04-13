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

## 마이그레이션 가이드

자세한 가이드는 `docs/migration-guide.md` 참고

## Claude 명령어

- `/create-issue` - 이슈 생성 및 브랜치 생성
- `/commit-push` - 커밋 → 푸시 → PR 생성
- `/daily-scrum` - DAILY SCRUM 노션 페이지 생성 (기본)
- `/context-sync` - Notion + GitHub 병렬 수집 → 싱크 문서 + Daily Scrum 페이지 생성 (고급)
- `/schedule` - Schedule List 일정 등록

## 머지 워크플로우

사용자가 "머지", "머지했어", "PR 머지했어" 등의 표현을 사용하면:

1. develop 브랜치를 main에 **직접 머지** (PR 생성 금지)
2. PR 생성 시 kimi 코드리뷰가 자동 트리거되어 토큰이 소진되므로, main 머지는 항상 로컬에서 직접 수행
3. 작업 브랜치 정리 (삭제)

```bash
git checkout main && git pull origin main && git merge develop && git push origin main
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
