# React useEffect 안의 setState, 왜 문제일까?

**Next.js 마이그레이션에서 발견한 캐스케이딩 렌더 패턴 정리**

---

React 프로젝트를 Next.js로 마이그레이션하던 중이었다. 기능 옮기는 건 순조로웠는데, 코드 리뷰를 하다 보니 같은 유형의 문제가 여러 컴포넌트에서 반복적으로 발견됐다.

- 사이드바 컴포넌트에서 메뉴가 깜빡거리는 현상
- 이미지 업로드 컴포넌트에서 초기 이미지가 한 박자 늦게 표시되는 현상
- 비밀번호 확인 필드에서 입력할 때마다 불필요한 리렌더가 발생하는 현상

증상은 제각각이었지만, 원인은 정확히 같았다.

> **다른 state에서 계산할 수 있는 값(derived value)을 별도의 state로 관리하면서, useEffect로 동기화하는 패턴.**

이 글에서는 왜 이 패턴이 위험한지, React의 렌더링 사이클을 뜯어보고, 실제 코드의 Before/After로 어떻게 해결했는지 정리해봤다.

---

## 1. useEffect + setState가 캐스케이딩 렌더를 일으키는 원리

### React의 렌더링 사이클

React의 한 번의 업데이트는 세 단계를 거친다.

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Render  │ ──> │  Commit │ ──> │  Effect │
│  Phase   │     │  Phase  │     │  Phase  │
└─────────┘     └─────────┘     └─────────┘
  JSX 생성        DOM 반영       useEffect 실행
```

1. **Render Phase**: 컴포넌트 함수를 호출해서 새로운 JSX를 만든다. 이 단계에서는 아직 화면에 아무 변화도 없다. React가 "다음에 화면에 뭘 그릴지" 설계도를 그리는 단계라고 보면 된다.
2. **Commit Phase**: 이전 DOM이랑 비교해서 바뀐 부분만 실제 DOM에 반영한다. 이때서야 사용자 눈에 화면이 바뀐다.
3. **Effect Phase**: `useEffect` 콜백을 실행한다. DOM이 이미 업데이트된 **뒤에** 실행되는 "후처리" 단계다.

이 세 단계를 직접 눈으로 확인해보자.

```tsx
function Counter() {
  // 1️⃣ Render Phase 시작 — 컴포넌트 함수가 호출된다
  const [count, setCount] = useState(0)

  // 2️⃣ 여전히 Render Phase — 아직 화면에는 아무 변화도 없다
  console.log('🎨 Render Phase: count =', count)

  // 4️⃣ Effect Phase — 화면 업데이트가 끝난 "뒤에" 실행된다
  useEffect(() => {
    console.log('⚡ Effect Phase: count =', count)
  }, [count])

  // 3️⃣ Commit Phase — React가 아래 JSX를 실제 DOM에 반영한다
  return (
    <button onClick={() => {
      console.log('🖱️ Click Handler: count =', count)
      setCount(count + 1)
    }}>
      {/* 이 텍스트가 화면에 보이는 시점 = Commit 완료 */}
      클릭: {count}
    </button>
  )
}
```

버튼을 한 번 클릭하면 이런 순서로 일어난다:

```
0️⃣ 클릭 이벤트 발생 → 이벤트 핸들러 실행
   → console.log 실행 → 콘솔에 "🖱️ Click Handler: count = 0" 출력
   → setCount(1) 호출 → React가 리렌더링을 "예약"한다
   → 이 시점에서 count는 여전히 0이다. setCount는 변수를 즉시 바꾸는 게
     아니라 "다음 렌더링에서 이 값을 써라"라는 예약이기 때문이다.
   → 핸들러 함수가 완전히 끝난 뒤, React가 리렌더링을 시작한다

1️⃣ 컴포넌트 함수 전체가 다시 실행된다 (Render Phase)
   → useState가 새 값 count=1을 반환
   → console.log 실행 → 콘솔에 "🎨 Render Phase: count = 1" 출력
   → useEffect 콜백은 실행되지 않고 "나중에 실행할 것"으로 등록만 됨
   → return문의 JSX를 생성

2️⃣ React가 JSX를 실제 DOM에 반영한다 (Commit Phase)
   → 화면의 "클릭: 0"이 "클릭: 1"로 바뀜

3️⃣ 화면 업데이트가 끝난 뒤, 등록해둔 useEffect 실행 (Effect Phase)
   → 의존성 [count]가 바뀌었으므로 콜백 실행
   → 콘솔에 "⚡ Effect Phase: count = 1" 출력
```

콘솔에 찍히는 순서:
```
🖱️ Click Handler: count = 0   ← 클릭 시점, setCount 호출 후에도 여전히 0
🎨 Render Phase: count = 1    ← 핸들러 종료 후 리렌더, 화면은 아직 "클릭: 0"
⚡ Effect Phase: count = 1    ← 화면이 "클릭: 1"로 바뀐 뒤 실행
```

**핵심: useEffect는 "의존성이 바뀌면 즉시 실행"이 아니다.** "의존성이 바뀌면 **다음 렌더링이 화면에 반영된 뒤에** 실행"이다. 이 타이밍 차이가 캐스케이딩 렌더의 원인이 된다.

#### 왜 Effect는 렌더링 "뒤에" 실행될까?

식당에 비유하면 이해하기 쉽다.

- **Render Phase** = 주방에서 요리를 만드는 단계
- **Commit Phase** = 손님 테이블에 음식을 내놓는 단계
- **Effect Phase** = 음식을 다 내놓은 뒤 하는 후처리 (테이블 정리, 재고 확인 등)

useEffect가 렌더링 "뒤에" 실행되는 이유는, 후처리는 손님에게 음식을 먼저 내놓고 나서 해야 하기 때문이다. 재고 확인(외부 시스템 동기화)을 먼저 하느라 음식 서빙(화면 업데이트)이 늦어지면 안 되니까.

그런데 만약 이 후처리 단계에서 "새 요리를 추가로 만들어야겠다(setState)"고 결정하면 어떻게 될까? 주방으로 돌아가서 처음부터 다시 시작해야 한다. **요리 → 서빙 → 후처리 → "다시 요리해야겠다!" → 요리 → 서빙 → 후처리 → ...** 이 반복이 바로 캐스케이딩 렌더다.

### useEffect 안에서 setState를 호출하면?

**캐스케이딩 렌더(Cascading Render)** 란 도미노처럼 하나의 상태 변경이 렌더링을 줄줄이 일으키는 현상이다. 위의 Counter 예제를 살짝 바꿔서 확인해보자.

```tsx
function BadCounter() {
  const [count, setCount] = useState(0)
  const [doubled, setDoubled] = useState(0)  // count * 2를 별도 state로 관리

  console.log('🎨 Render: count =', count, ', doubled =', doubled)

  // count가 바뀌면 doubled를 동기화
  useEffect(() => {
    console.log('⚡ Effect: setDoubled 호출!')
    setDoubled(count * 2)  // ← 여기서 또 setState!
  }, [count])

  return (
    <button onClick={() => {
      console.log('🖱️ Click: count =', count)
      setCount(count + 1)
    }}>
      클릭: {count}, 두 배: {doubled}
    </button>
  )
}
```

버튼을 한 번 클릭하면 콘솔에 이렇게 찍힌다:

```
🖱️ Click: count = 0           ← 핸들러 실행, setCount(1) 예약

🎨 Render: count = 1, doubled = 0   ← 1차 렌더링 (doubled는 아직 0!)
                                     ← [Commit] 화면: "클릭: 1, 두 배: 0" 😱
⚡ Effect: setDoubled 호출!          ← 1차 Effect에서 setDoubled(2) 예약

🎨 Render: count = 1, doubled = 2   ← 2차 렌더링 (이제야 doubled = 2)
                                     ← [Commit] 화면: "클릭: 1, 두 배: 2" ✅
```

**버튼 한 번 클릭에 렌더링이 2번 일어났다.** 중간에 화면이 "클릭: 1, 두 배: 0"이라는 **잘못된 상태**를 잠깐 보여준다. 이게 깜빡임의 정체다.

단계별로 정리하면:

```
0️⃣ 클릭 → setCount(1) 예약 → 핸들러 종료

[1차 사이클]
1️⃣ Render Phase: count=1, doubled=0으로 JSX 생성
2️⃣ Commit Phase: 화면에 "클릭: 1, 두 배: 0" 반영 (잘못된 중간 상태!)
3️⃣ Effect Phase: count가 바뀌었으므로 useEffect 실행 → setDoubled(2) 예약

[2차 사이클] — setDoubled(2)에 의해 또 시작됨
1️⃣ Render Phase: count=1, doubled=2로 JSX 생성
2️⃣ Commit Phase: 화면에 "클릭: 1, 두 배: 2" 반영 (이제야 올바른 상태)
3️⃣ Effect Phase: count가 안 바뀌었으므로 useEffect 스킵 → 끝
```

최선의 경우에도 **불필요한 렌더링이 최소 1회 추가**된다. 사용자는 "클릭: 1, 두 배: 0"이라는 **잘못된 화면을 순간적으로 본다.** 이 시간이 짧으면 깜빡임, 길면 눈에 보이는 버그다.

최악의 경우에는 **무한 루프**가 된다. 만약 useEffect가 자기 자신의 의존성을 변경하면 도미노가 멈추지 않는다:

```tsx
function InfiniteCounter() {
  const [count, setCount] = useState(0)

  console.log('🎨 Render: count =', count)

  useEffect(() => {
    console.log('⚡ Effect: setCount 호출!')
    setCount(count + 1)  // ← 의존성인 count를 직접 변경!
  }, [count])

  return <div>count: {count}</div>
}
```

```
🎨 Render: count = 0
                               ← [Commit] 화면: "count: 0"
⚡ Effect: setCount 호출!     ← setCount(1) 예약

🎨 Render: count = 1
                               ← [Commit] 화면: "count: 1"
⚡ Effect: setCount 호출!     ← setCount(2) 예약

🎨 Render: count = 2
                               ← [Commit] 화면: "count: 2"
⚡ Effect: setCount 호출!     ← setCount(3) 예약

... 매번 Render → Commit → Effect → setState가 반복된다
    React가 "Maximum update depth exceeded" 에러를 던진다
```

"이렇게 노골적인 코드를 누가 쓰겠어?"라고 생각할 수 있다. 하지만 위의 `doubled` 예제처럼 state를 두 개로 나누면, 무한 루프까지는 아니더라도 불필요한 렌더링이 반복된다. 그리고 의존성 배열에 **불안정한 함수 참조**가 포함되면, 이 무한 루프와 결국 같은 구조다. 이 부분은 바로 아래에서 자세히 다룬다.

그런데 `doubled`는 `count * 2`로 언제든 계산할 수 있는 값이다. 별도 state가 아니라 그냥 계산하면 된다:

```tsx
function GoodCounter() {
  const [count, setCount] = useState(0)
  const doubled = count * 2  // useEffect도 useState도 필요 없다

  return <div>count: {count}, 두 배: {doubled}</div>
}
```

```
🖱️ Click → setCount(1) 예약

[1차 사이클 — 이것으로 끝!]
1️⃣ Render: count=1, doubled=2 ← 렌더링 중에 바로 계산됨
2️⃣ Commit: 화면에 "count: 1, 두 배: 2" 반영 ✅
```

**렌더링 1회, 잘못된 중간 상태 없음, 깜빡임 없음.** 이것이 이 글 전체에서 반복적으로 다루는 핵심 해결 패턴이다.

### 의존성 배열의 함정: 불안정한 함수 참조

특히 위험한 케이스가 있다. React Hook Form의 `setError`, `clearErrors` 같은 함수를 의존성 배열에 넣는 경우다.

```tsx
// 위험한 패턴
useEffect(() => {
  if (password === passwordConfirm) {
    clearErrors('confirmPassword')     // 폼 상태 변경 → 리렌더
  } else {
    setError('confirmPassword', { ... }) // 폼 상태 변경 → 리렌더
  }
}, [password, passwordConfirm, setError, clearErrors])
//                               ^^^^^^^^  ^^^^^^^^^^^
//                               매 렌더마다 새 참조가 될 수 있음!
```

이 코드가 어떻게 불필요한 렌더링을 반복하는지, 최악의 경우 어떻게 무한 루프까지 갈 수 있는지 단계별로 따라가 보자.

**1단계**: 사용자가 비밀번호 확인 필드에 글자를 입력한다. `passwordConfirm` 값이 바뀌면서 컴포넌트가 리렌더된다.

**2단계**: 리렌더 후 useEffect가 실행된다. 의존성 배열의 `passwordConfirm`이 바뀌었으므로 Effect가 트리거된다. 비밀번호가 일치한다고 가정하면 `clearErrors('confirmPassword')`가 호출된다.

**3단계**: `clearErrors`는 React Hook Form의 내부 폼 상태를 변경한다. 폼 상태가 바뀌었으므로 컴포넌트가 또 리렌더된다.

**4단계**: 리렌더 시 React Hook Form이 새로운 `setError`, `clearErrors` 함수 참조를 생성한다. 이전 렌더의 `clearErrors`와 이번 렌더의 `clearErrors`는 하는 일은 같지만, JavaScript 입장에서는 서로 다른 객체다. (마치 `{} === {}`가 `false`인 것처럼.)

**5단계**: useEffect의 의존성 배열에 있는 `clearErrors` 참조가 바뀌었으므로, React는 "의존성이 변경됐다"고 판단하고 Effect를 다시 실행한다.

**6단계**: Effect 안에서 다시 `clearErrors`가 호출되고... 3단계로 돌아간다. 무한 반복이다.

```
password 입력
  → 리렌더
    → useEffect 실행 (clearErrors 호출)
      → 폼 상태 변경 → 리렌더
        → setError/clearErrors 참조 변경
          → useEffect 다시 실행
            → clearErrors 또 호출
              → ... 무한 반복
```

이 문제는 ESLint의 `react-hooks/exhaustive-deps` 규칙을 충실히 따랐기 때문에 발생한다는 게 아이러니하다. 린터가 "의존성에 `setError`를 추가하세요"라고 하니까 추가했는데, 그게 오히려 무한 루프의 원인이 된 것이다.

가장 확실한 해결법은 **useEffect 안에서 setState를 호출하지 않는 것**이다.

---

## 2. Vite vs Next.js -- 왜 Next.js에서 더 잘 드러나는가?

"Vite에서는 잘 됐는데 Next.js로 옮기니까 문제가 생겨요"라는 말을 많이 한다. 사실 **문제는 원래 있었다.** Next.js가 그걸 드러나게 만든 것뿐이다.

### App Router의 navigation 시 props 새 참조 전달

Vite + React Router에서는 클라이언트 사이드 라우팅이 비교적 단순하다. 컴포넌트 트리가 유지되면서 URL만 바뀌는 경우가 많다.

반면 Next.js App Router는 **서버 컴포넌트(RSC)와 클라이언트 컴포넌트가 혼합**된 구조다. 페이지 전환 시 서버 컴포넌트가 새로 렌더링되면서 클라이언트 컴포넌트에 **새로운 props 참조**를 전달한다. 이전과 값이 같더라도 참조가 다르면 useEffect의 의존성 비교에서 "변경됨"으로 판단한다.

구체적인 코드로 살펴보자. 태그 목록을 서버에서 받아와서 클라이언트 컴포넌트에 전달하는 흔한 패턴이다.

```tsx
// app/posts/[id]/page.tsx (서버 컴포넌트)
export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await fetchPost(params.id)

  // 서버 컴포넌트가 렌더링될 때마다 새 배열 객체가 생성된다
  return <TagFilter availableTags={post.tags} />
  //                               ^^^^^^^^^
  //                               매번 새 참조!
}
```

```tsx
// TagFilter.tsx (클라이언트 컴포넌트)
'use client'

export default function TagFilter({ availableTags }: { availableTags: string[] }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    if (availableTags && availableTags.length > 0) {
      setSelectedTags(availableTags)
    }
  }, [availableTags])  // <-- availableTags가 매번 새 참조이므로 매번 실행됨!
}
```

왜 같은 값인데 다른 참조가 되는 걸까? 서버 컴포넌트는 서버에서 실행된 결과를 **직렬화(serialize)** 해서 클라이언트로 보낸다. 클라이언트에서 이를 역직렬화하면, JavaScript 입장에서는 매번 **새로운 객체**가 만들어진다.

```tsx
// 서버에서 이런 데이터를 보냈다고 하자
const tags = ["React", "Next.js"]

// 사용자가 다른 페이지로 갔다가 돌아오면, 서버 컴포넌트가 다시 실행된다
const tags2 = ["React", "Next.js"]  // 값은 같지만 새 배열 객체

// JavaScript에서 배열/객체의 동일성은 참조로 비교한다
tags === tags2  // false! 값은 같지만 다른 객체
```

Vite + React Router에서는 클라이언트 사이드에서 같은 객체 참조가 유지되므로 이 문제가 드러나지 않았다. Next.js App Router의 서버 컴포넌트 → 클라이언트 컴포넌트 경계에서는 직렬화/역직렬화가 일어나므로, 항상 새 참조가 된다.

```
[Vite + React Router]
라우팅 → 같은 컴포넌트 트리 유지 → props 참조 동일 → useEffect 스킵

[Next.js App Router]
라우팅 → RSC 새 렌더링 → 직렬화/역직렬화 → 새 props 참조 전달
→ useEffect 재실행 → setState → 추가 렌더링 → 깜빡임!
```

### React 19의 변경사항

Next.js 15+는 React 19를 사용한다. React 19에서는 렌더링 처리 방식이 바뀌면서, 각 단계(render → commit(DOM 반영) → effect) 사이의 간격이 더 벌어졌다.

쉽게 말해, Vite 환경에서 "거의 동시에" 일어나서 눈에 안 보이던 깜빡임이, React 19 + Server Components 환경에서는 각 단계가 더 명확히 분리되면서 눈에 보이는 수준이 될 수 있다.

### Strict Mode와는 무관하다

혹시 "StrictMode 때문 아닌가?"라고 생각할 수 있다. StrictMode는 개발 환경에서 컴포넌트를 두 번 마운트/언마운트하는데, 이건 useEffect의 cleanup이 제대로 되는지 확인하는 용도다. 프로덕션 빌드에서는 StrictMode가 동작하지 않는다.

여기서 다루는 캐스케이딩 렌더 문제는 **StrictMode와 무관하게 프로덕션에서도 발생한다.** "render → effect → setState → re-render"라는 구조 자체가 문제이므로, 개발/프로덕션 환경을 가리지 않는다.

---

## 3. 해결 패턴 정리 -- 3가지 규칙

### 규칙 1: 계산할 수 있는 값은 state가 아니라 useMemo로

기존 state에서 계산할 수 있는 값을 별도의 state로 만들지 말자.

```tsx
// Bad: 계산 가능한 값을 state + useEffect로 동기화
const [fullName, setFullName] = useState('')

useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])
```

이렇게 하면 `firstName`이나 `lastName`이 바뀔 때마다 렌더링이 2회 발생한다. 1차 렌더링에서는 `fullName`이 아직 이전 값이고, Effect 후 2차 렌더링에서야 새 값이 반영된다.

```tsx
// Good: useMemo로 렌더링 중 계산
const fullName = useMemo(
  () => `${firstName} ${lastName}`,
  [firstName, lastName]
)
```

`useMemo`를 쓰면 렌더링 1회로 끝난다. Render Phase에서 바로 새 값이 계산되므로 추가 렌더링이 필요 없다.

```tsx
// Better: 계산이 가벼우면 useMemo도 필요 없다
const fullName = `${firstName} ${lastName}`
```

문자열 연결 같은 가벼운 계산은 `useMemo`의 의존성 비교 비용이 오히려 더 클 수 있다. 그냥 매 렌더마다 계산하는 게 낫다.

**렌더링 횟수 비교**:
| 패턴 | `firstName` 변경 시 렌더링 횟수 |
|---|---|
| `useState` + `useEffect` | 2회 (1차: 옛날 값, 2차: 새 값) |
| `useMemo` | 1회 (즉시 새 값) |
| 일반 변수 | 1회 (즉시 새 값) |

**판단 기준**: "이 값은 다른 state/props에서 100% 계산 가능한가?" -- 그렇다면 `useMemo`(또는 그냥 변수)로.

### 규칙 2: 폼 초기값은 useEffect + reset()이 아니라 defaultValues로

서버에서 데이터를 받아와서 폼을 초기화하는 흔한 패턴이다.

```tsx
// Bad: useEffect에서 폼 리셋
const { reset } = useForm<FormValues>()

useEffect(() => {
  if (userData) {
    reset({
      name: userData.name,
      email: userData.email,
    })
  }
}, [userData, reset])
```

이렇게 하면 폼이 처음에 빈 상태로 렌더된 후, Effect에서 `reset`이 호출되어 또 한 번 렌더된다. 사용자에게 빈 폼이 순간적으로 보였다가 데이터가 채워지는 현상이 발생한다.

```tsx
// Good: defaultValues에 직접 전달
const { register } = useForm<FormValues>({
  defaultValues: {
    name: userData?.name ?? '',
    email: userData?.email ?? '',
  },
})
```

첫 렌더링부터 데이터가 폼에 들어 있으므로 깜빡임이 없다.

```tsx
// Good: 비동기 데이터라면 values prop 사용 (React Hook Form v7.43+)
const { register } = useForm<FormValues>({
  values: userData, // userData가 변경되면 자동으로 폼 값 갱신
})
```

`values`는 `defaultValues`와 달리, 값이 바뀔 때마다 폼을 자동으로 업데이트해준다. React Hook Form이 내부적으로 최적화된 방식으로 처리하므로, 직접 `useEffect` + `reset`을 쓰는 것보다 안정적이다.

**렌더링 횟수 비교**:
| 패턴 | 데이터 로드 후 렌더링 횟수 |
|---|---|
| `useEffect` + `reset()` | 2회 (빈 폼 → 데이터 채움) |
| `defaultValues` | 1회 (첫 렌더부터 데이터 포함) |
| `values` | 1회 (데이터 변경 시 자동 반영) |

**판단 기준**: "이 useEffect가 하는 일이 폼 초기값 설정뿐인가?" -- `defaultValues` 또는 `values`로 대체.

### 규칙 3: URL과 State 동기화는 단방향으로 (URL = source of truth)

URL 파라미터를 기반으로 UI 상태를 관리하는 경우, URL이 유일한 진실의 원천(source of truth)이어야 한다.

```tsx
// Bad: URL → state → UI (이중 소스)
const [selectedTab, setSelectedTab] = useState('all')
const searchParams = useSearchParams()

useEffect(() => {
  const tab = searchParams.get('tab')
  if (tab) setSelectedTab(tab)
}, [searchParams])
```

URL과 `selectedTab` state, 두 곳에 같은 정보가 저장된다. useEffect로 동기화하기 전 순간에는 두 값이 다를 수 있어서 UI가 깜빡인다.

```tsx
// Good: URL → UI (단일 소스)
const searchParams = useSearchParams()
const selectedTab = searchParams.get('tab') ?? 'all'
```

URL에서 직접 읽으면 state가 필요 없다. 동기화할 대상이 없으니 틀어질 일도 없다.

```tsx
// Good: 초기값만 URL에서 가져오는 경우, lazy initializer 사용
const pathname = usePathname()
const [openMenus, setOpenMenus] = useState<Set<string>>(() => {
  // 최초 마운트 시에만 실행
  const label = getActiveParentLabel(pathname)
  return label ? new Set([label]) : new Set()
})
```

사용자가 이후에 수동으로 메뉴를 열고 닫을 수 있어서 state가 필요한 경우라면, 최소한 초기값은 URL에서 바로 계산하자.

**렌더링 횟수 비교**:
| 패턴 | 페이지 진입 시 렌더링 횟수 |
|---|---|
| `useState` + `useEffect`로 URL 동기화 | 2회 (기본값 → URL 값) |
| URL에서 직접 읽기 (state 없음) | 1회 |
| `useState` lazy initializer | 1회 |

**판단 기준**: "이 state가 URL에서 파생된 값인가?" -- URL을 직접 읽어서 쓰거나, `useState` 초기화 콜백으로.

---

## 4. 자가 진단 체크리스트

### "내 코드에도 이 문제가 있을까?"

아래 질문에 하나라도 "예"라면 리팩토링을 고려하자.

- [ ] `useEffect` 안에서 같은 컴포넌트의 `setState`를 호출하고 있는가?
- [ ] 그 state는 다른 state/props에서 계산할 수 있는 값인가?
- [ ] props를 받아서 `useState`에 복사하고, `useEffect`로 동기화하고 있는가?
- [ ] `useEffect`의 의존성 배열에 `setError`, `clearErrors`, `reset` 같은 폼 함수가 있는가?
- [ ] URL 파라미터를 `useEffect`로 읽어서 state에 저장하고 있는가?

### grep으로 위험 패턴 찾기

프로젝트 전체에서 `useEffect` 안의 `setState` 호출을 찾으려면:

```bash
# useEffect 안에서 set으로 시작하는 함수를 호출하는 패턴 탐색
grep -rn "useEffect" --include="*.tsx" --include="*.ts" -A 10 src/ \
  | grep -E "set[A-Z]\w*\("
```

```bash
# useEffect 의존성에 setError/clearErrors가 포함된 패턴
grep -rn "setError\|clearErrors" --include="*.tsx" --include="*.ts" src/ \
  | grep -v "node_modules"
```

```bash
# useState([])로 초기화 후 useEffect에서 props를 복사하는 패턴
grep -rn "useState\(\[\]\)" --include="*.tsx" --include="*.ts" -A 5 src/ \
  | grep "useEffect"
```

### ESLint 규칙으로 미리 막기

ESLint에는 이 문제를 직접 잡는 공식 규칙은 없지만, 다음 플러그인을 활용할 수 있다.

```bash
npm install -D eslint-plugin-react-perf
```

그리고 커스텀 ESLint 규칙 또는 코드 리뷰 체크리스트에 다음 항목을 추가하자:

> **"useEffect 안에서 setState를 호출하는 경우, 그 state가 다른 값에서 계산할 수 있는 건 아닌지 검토한다."**

React 공식 팀도 이 패턴의 위험성을 알고 있고, [React Compiler](https://react.dev/learn/react-compiler)가 정식으로 나오면 일부는 자동으로 잡아줄 수 있을 것 같다. 하지만 설계 문제는 도구가 대신 해결해주지 않는다.

---

같은 유형의 버그를 반복해서 고치면서 깨달은 것이 있다.

> **useEffect는 "외부 시스템과의 동기화"를 위한 도구이지, "state 간의 동기화"를 위한 도구가 아니다.**

- 서버에서 데이터를 페칭하는 것 -> 외부 시스템 동기화 (useEffect 적합)
- DOM API를 직접 조작하는 것 -> 외부 시스템 동기화 (useEffect 적합)
- WebSocket 연결을 관리하는 것 -> 외부 시스템 동기화 (useEffect 적합)
- **A라는 state가 바뀌면 B라는 state를 업데이트** -> 계산 가능한 값 (useMemo 또는 렌더링 중 계산)
- **props가 바뀌면 state를 리셋** -> 초기값 패턴 또는 key prop

이 구분만 명확히 해도, 대부분의 캐스케이딩 렌더 문제를 설계할 때 미리 막을 수 있다.

React 공식 문서의 [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)를 아직 읽지 않았다면, 꼭 한번 읽어보길 추천한다. 이 글에서 다룬 패턴들 모두 해당 문서에서 다루는 안티패턴에 딱 들어맞는다.

useEffect를 작성하기 전에 자신에게 물어보자.

> **"이 값은 렌더링 중에 계산할 수 없는가?"**

대부분의 경우, 답은 "계산할 수 있다"일 것이다.
