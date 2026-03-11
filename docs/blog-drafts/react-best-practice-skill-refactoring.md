# Vercel의 React Best Practice Skill로 어드민 코드를 리팩토링하고, 그 과정을 자동화한 이야기

> 작성 상태: 1~2단계 완성 / 3~6단계 placeholder (작업 진행 후 업데이트 예정)

---

## 1. 우연히 만난 "React 성능 최적화 58개 규칙"

리팩토링을 하다 보면 항상 비슷한 질문에 부딪힌다.

"이 코드, 뭔가 이상한 것 같은데... 정확히 어디가 문제인 거지?"

useEffect 안에서 setState 연달아 쓰는 게 문제라는 건 알겠는데, 왜 문제인지 명확히 설명하기 어려울 때가 있다. `Promise.all` 대신 개별 `await`를 쓰는 것도 직감적으로 나쁘다는 건 알지만, 이게 규칙으로 정리된 문서가 어딘가에 있다면 훨씬 설득력 있는 리팩토링이 될 것이다.

그런 문서가 있었다. Vercel Labs가 공개한 [agent-skills](https://github.com/vercel-labs/agent-skills) 리포지토리의 **React Best Practices Skill**이다.

---

## 2. Vercel React Best Practice Skill이란 무엇인가

### 배경: Vercel 엔지니어링 지식을 AI 에이전트가 쓸 수 있게

Vercel Labs는 10년 이상 React/Next.js 생태계를 운영하면서 쌓아온 성능 최적화 노하우를 정리해서 오픈소스로 공개했다. 특이한 점은 이게 단순한 문서가 아니라 **AI 코딩 에이전트가 참조할 수 있는 "Skill" 형태**라는 것이다.

Claude Code, Cursor, GitHub Copilot 같은 AI 도구들이 이 Skill을 컨텍스트로 가져가면, "이 코드에서 성능 문제를 찾아줘"라는 요청을 받았을 때 단순한 추론이 아니라 검증된 규칙에 근거해서 답변하게 된다.

설치는 간단하다:

```bash
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices
```

실행하면 `.agents/skills/vercel-react-best-practices/` 폴더에 실제 파일(`SKILL.md`, `AGENTS.md`, `rules/` 등)이 설치되고, `.claude/skills/vercel-react-best-practices`에 **symlink**(심볼릭 링크)가 생성된다.

symlink는 파일의 "바로가기"다. 실제 파일을 복사하는 게 아니라 "저기 있는 걸 참조해"라고 연결만 해둔 것이다. Claude Code는 `.claude/skills/` 폴더를 읽기 때문에, symlink를 통해 실제 스킬 파일에 접근하는 구조다. 원본이 업데이트되면 자동으로 반영되고, 용량도 차지하지 않는다.

### 58개 규칙, 8개 카테고리

규칙들은 우선순위에 따라 8개 카테고리로 구분된다:

| 카테고리 | 우선순위 | 설명 |
|---|---|---|
| Eliminating Waterfalls | CRITICAL | 직렬 데이터 fetching 제거 |
| Bundle Size | CRITICAL | 번들 크기 최적화 |
| Server-Side | HIGH | SSR/RSC 활용 |
| Client-Side Data Fetching | MEDIUM-HIGH | 클라이언트 데이터 패칭 최적화 |
| Re-render | MEDIUM | 불필요한 리렌더링 방지 |
| Rendering | MEDIUM | 렌더링 패턴 개선 |
| JS Performance | LOW-MEDIUM | JavaScript 실행 성능 |
| Advanced | LOW | 고급 최적화 기법 |

CRITICAL부터 시작하는 게 맞다. Waterfall과 Bundle Size 문제는 체감 성능에 직접적으로 영향을 주기 때문이다.

### 핵심 규칙 몇 가지를 직접 살펴보면

**`rerender-derived-state-no-effect`** (Re-render 카테고리)

다른 state에서 계산할 수 있는 값을 useEffect + setState로 동기화하는 패턴을 금지한다.

```tsx
// Bad: 파생 상태를 useEffect로 동기화
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(items.length); // items가 바뀔 때마다 추가 렌더링 발생
}, [items]);

// Good: 렌더링 중에 직접 계산
const [items, setItems] = useState([]);
const count = items.length; // 파생 상태는 계산으로
```

useEffect + setState 조합은 렌더링을 두 번 유발한다. 첫 번째는 `items`가 바뀔 때, 두 번째는 그로 인해 `count`가 바뀔 때. 계산 가능한 값이라면 그냥 계산하면 된다.

**`async-parallel`** (Eliminating Waterfalls 카테고리)

독립적인 비동기 작업들을 직렬 `await`로 처리하는 것을 금지한다.

```tsx
// Bad: 직렬 실행 (총 시간 = A + B + C)
const users = await fetchUsers();
const products = await fetchProducts();
const stats = await fetchStats();

// Good: 병렬 실행 (총 시간 = max(A, B, C))
const [users, products, stats] = await Promise.all([
  fetchUsers(),
  fetchProducts(),
  fetchStats(),
]);
```

이 규칙은 특히 어드민 대시보드처럼 여러 API를 동시에 호출해야 하는 페이지에서 체감 차이가 크다.

**`bundle-dynamic-imports`** (Bundle Size 카테고리)

초기 번들에 포함될 필요가 없는 무거운 컴포넌트는 dynamic import로 지연 로딩한다.

```tsx
// Bad: 모달이 열리지 않아도 번들에 포함
import HeavyModal from './HeavyModal';

// Good: 실제로 필요할 때만 로드
import dynamic from 'next/dynamic';
const HeavyModal = dynamic(() => import('./HeavyModal'));
```

### 흥미로운 발견: 이미 고쳤던 버그들

이 Skill을 조사하면서 흥미로운 사실을 발견했다. 지난주에 이미 수정했던 버그들이 이 Skill의 규칙에 정확히 해당하는 것들이었다.

- useEffect + setState cascading render 제거 → `rerender-derived-state-no-effect`
- 개별 `await`를 `Promise.all`로 통합 → `async-parallel`

규칙을 모르고도 직관적으로 같은 결론에 도달했다는 게 흥미롭기도 하고, 반대로 생각하면 이런 규칙을 먼저 알고 있었다면 더 빨리, 더 자신 있게 고칠 수 있었을 것이다.

---

## 3. 실제 프로젝트에 적용해보기

### 설치 및 스캔

스킬을 설치한 뒤, Claude Code에게 "어드민 코드를 58개 규칙 기준으로 스캔해줘"라고 요청했다. AI가 `useEffect`, `&&` 렌더링, `await` 패턴 등을 regex와 파일 탐색으로 훑으면서 규칙 위반을 찾아냈다.

**스캔 방법**: 어드민 코드 70여 개 파일을 대상으로, 규칙별 안티패턴을 정규식으로 검색했다. `useEffect` 내부의 `setState` 호출, 직렬 `await`, `&&` 조건부 렌더링 등 주요 패턴을 병렬로 탐색한 뒤, 의심 파일을 직접 읽어 실제 위반인지 확인했다.

### 발견된 위반 목록

총 3가지 이슈, 8개 파일에서 위반이 발견됐다.

#### 이슈 1: `async-parallel` + `client-swr-dedup` (CRITICAL / MEDIUM-HIGH)

**파일**: `MembersDashboard.tsx`

```tsx
// Bad: 3개의 독립적 fetch를 useEffect+setState로 처리
useEffect(() => {
  fetchMemberStats().then((statsData) => setStats(statsData))
  fetchWithdrawalReasons().then((reasonsData) => setReasons(reasonsData))
  import('@/features/admin/mocks/mockMemberStats').then(...)
}, [])
```

두 가지 규칙을 동시에 위반하고 있었다:
- **`async-parallel`**: 3개의 독립적인 fetch를 병렬화하지 않음 (Promise.all 미사용)
- **`client-swr-dedup`**: 다른 어드민 컴포넌트(AdminDashboard, useAdminTable)는 모두 `useQuery`를 사용하는데, 이 컴포넌트만 raw `useEffect`+`setState` 사용

흥미로운 점은, `useQuery`로 전환하면 두 규칙이 한번에 해결된다는 것이다. TanStack Query는 각 쿼리를 자동으로 병렬 실행하고, 요청 중복 제거와 캐싱까지 제공한다.

#### 이슈 2: `rendering-conditional-render` (MEDIUM)

**파일**: 모달 컴포넌트 6개 + MembersDashboard (총 7개 파일)

```tsx
// Bad: && 연산자로 조건부 렌더링
{report && (
  <div>...</div>
)}

// Good: 삼항 연산자 사용
{report ? (
  <div>...</div>
) : null}
```

`&&` 연산자는 좌항이 `0`이나 빈 문자열일 때 그 값이 화면에 렌더링되는 버그를 유발할 수 있다. 이번 프로젝트에서는 대부분 boolean/object 좌항이라 실제 버그 위험은 낮았지만, 일관성을 위해 삼항 연산자로 통일하기로 했다.

#### 이슈 3: 중복 컴포넌트 (코드 품질)

**파일**: `ProductDetailModal.tsx`

`DeleteConfirmDialog`가 파일 내부에 로컬로 중복 정의되어 있었다. `common/DeleteConfirmDialog.tsx`에 이미 공유 컴포넌트가 존재하는데도 사용하지 않고 있었다.

### 잘 되어 있던 부분

스캔하면서 이미 규칙을 잘 지키고 있는 코드도 발견했다:
- `useAdminTable.ts`: `useMemo`, `useCallback`, functional setState 올바르게 사용 (`rerender-functional-setstate` ✅)
- `AdminDashboard.tsx`: `useQuery` 올바르게 사용 (`client-swr-dedup` ✅)
- `useAdminTable.ts`의 `totalPages`: 렌더링 중 직접 계산 (`rerender-derived-state-no-effect` ✅)

### 리팩토링 과정

```
TODO: 각 이슈별 수정 과정 상세 기술
```

---

## 4. 리팩토링 전/후 비교

```
TODO: 구체적인 before/after 코드 예시
TODO: 변경된 파일 목록
```

---

## 5. 이 과정을 자동화한 방법

> 작업 진행 후 업데이트 예정

### 워크플로우 스킬 설계

```
TODO: 자동화 스킬의 구조 설명
TODO: Skill 파일 코드 예시
TODO: 어떤 단계들을 자동화했는지 (스캔 → 리팩토링 → PR 생성 → Notion 정리)
```

---

## 6. 마무리

> 작업 진행 후 업데이트 예정

```
TODO: 배운 점 정리
TODO: React Best Practice Skill 활용 추천 상황
TODO: AI 에이전트 + 검증된 규칙 조합의 가능성
```

---

*이 글은 커들마켓 프로젝트의 어드민 코드를 리팩토링하면서 작성된 개발 기록입니다. 작업이 완료되는 순서대로 업데이트됩니다.*
