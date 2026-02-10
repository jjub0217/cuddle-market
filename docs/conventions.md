# 컨벤션(Convention)

## 1. 브랜치 컨벤션

- 브랜치 네이밍은 전부 소문자(종류/이슈번호--브랜치 이름)
  `ex) feature/24--modal-ui`

| 종류     | 설명                                       | 예시                          |
| -------- | ------------------------------------------ | ----------------------------- |
| main     | 메인 브랜치                                | main                          |
| develop  | 배포 전 개발 브랜치                        | develop                       |
| feature  | 새로운 기능 개발                           | feature/32--login-ui          |
| hotfix   | 긴급 수정                                  | hotfix/101--critical-bug      |
| release  | 배포용 브랜치                              | release/v1.2.0                |
| fix      | 버그 수정 (이미 개발된 컴포넌트 기능 개선) | fix/45--button-click-bug      |
| refactor | 코드 구조/네이밍 변경 (기능 유지)          | refactor/51--file-cleanup     |
| chore    | 빌드, 환경, 설정, 정리 작업                | chore/12--update-dependencies |
| test     | 테스트 코드 작성/수정                      | test/22--login-unit-test      |
| docs     | 문서 작업만                                | docs/3--readme-update         |

---

## 2. 커밋 컨벤션

- 커밋 타입(소문자): 한글로 된 내용
- 타입: 커밋 내용(#이슈번호)
  `ex) feat: 로그인 ui 작업(#32)`
- 세부내용 필요하면 - 를 사용하면서 vim 으로 적기

| Type     | 설명                                            |
| -------- | ----------------------------------------------- |
| feat     | 새로운 기능 추가                                |
| fix      | 버그 수정                                       |
| refactor | 리팩토링 (동작 변경 없음, 구조 개선)            |
| design   | CSS 및 UI 디자인 변경                           |
| style    | 코드 포맷팅, 세미콜론 누락 등 기능 변경 없음    |
| test     | 테스트 코드 추가/수정/삭제                      |
| chore    | 기타 변경사항 (빌드 스크립트, 패키지 매니저 등) |
| init     | 프로젝트 초기 생성                              |
| rename   | 파일/폴더명 수정 또는 이동                      |
| remove   | 파일 삭제                                       |
| docs     | 문서 작성/수정                                  |

---

## 3. PR 컨벤션

- 타입: 이슈 내용
  `ex) feat: 로그인 ui 작업`

### 📌 개요

- 내용

### 🔧 작업 내용

- 작업 내용

### 📎 관련 이슈

- Close #이슈번호

### 📸 스크린샷 (선택)

| 변경 전 | 변경 후 |
| ------- | ------- |
| 이미지  | 이미지  |

### 💬 리뷰어 참고 사항

- 리뷰어가 중점적으로 봐주었으면 하는 부분
- 추가 논의가 필요한 부분

---

## 4. 코드 네이밍 컨벤션

| 타입            | 예시                                      |
| --------------- | ----------------------------------------- |
| 상수(Constant)  | SCREAMING_SNAKE_CASE (MAX_VALUE, API_URL) |
| Boolean 변수    | is접두사 사용 (isActive)                  |
| 일반 변수       | camelCase 사용 (userName, itemList)       |
| 배열            | 복수형 사용 (users, items)                |
| 객체            | 단수형 사용 (user, item)                  |
| 이벤트 핸들러   | handle 접두사 (handleSubmit)              |
| 비동기 함수     | fetch 접두사 (fetchData)                  |
| TypeScript 타입 | Interface/Type (interface User {})        |

- 폴더 네이밍: 전부 소문자

---

## 5. 파일 네이밍 컨벤션

| 파일 타입 | 네이밍                                               |
| --------- | ---------------------------------------------------- |
| conponent | PascalCase (UserCard.tsx, LoginForm.tsx)             |
| image     | kebab-case (logo-icon.png, user-avatar.jpg)          |
| util      | camelCase (fetchUser.ts, calculateSum.ts)            |
| style     | dot notation (tokens.colors.css, tokens.spacing.css) |
| type      | camelCase (user.ts, productType.ts)                  |
| constant  | kebab-case (ui-constants.ts, api-constants.ts)       |

---

## 6. Git 워크플로우

### 브랜치 전략

- 모든 기능 브랜치는 `develop`에서 분기하고 `develop`으로 머지
- `main` 브랜치는 분기별로 `develop`에서 머지

### 작업 시작 전 체크리스트

1. **이슈 먼저 생성** (브랜치 생성 전 반드시 GitHub 이슈 생성)
2. **이슈 번호로 브랜치 생성** (예: `feature/123--기능명`)

### commit-push 전 체크리스트

1. **현재 브랜치가 이미 머지되었는지 확인**
   ```bash
   git log --oneline origin/develop | grep "현재 브랜치명"
   ```
2. **이미 머지된 브랜치라면 `develop`으로 전환 후 새 브랜치 생성**
   ```bash
   git checkout develop && git pull
   git checkout -b 새브랜치명
   ```
3. **작업 완료 후 PR은 `develop` 브랜치를 base로 생성**
4. **PR 생성은 Claude Code가 수행** (`.github/PULL_REQUEST_TEMPLATE.md` 템플릿 사용)
5. **머지는 사용자가 직접 수행**
