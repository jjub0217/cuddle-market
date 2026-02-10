# 코드 컨벤션(Code Convention)

## 1. 경로(Path)

- 같은 폴더 내 파일을 import할 경우 → **상대경로 사용**
- 그 외 경로 → **절대경로 사용**

```ts
// 같은 폴더 내
import Button from './Button'

// 다른 폴더
import Header from 'components/Header'
```

---

## 2. Export

컴포넌트 생성 시 → Default Export 사용

```ts
// Default Export
export default function MyComponent() {
  return <div>MyComponent</div>
}
```

constants 등 → Named Export 사용

```ts
// Named Export
export const API_URL = 'https://example.com/api'
```

아이콘 import 시 → X as XIcon 형태 사용

```ts
import { Home as HomeIcon } from 'lucide-react'
```

---

## 3. 함수 생성

모든 함수는 화살표 함수(Arrow Function) 사용

```ts
const sum = (a: number, b: number) => a + b
```

---

## 4. 타입 vs 인터페이스

**인터페이스(Interface)**로 통일

```ts
interface User {
  id: number
  name: string
}
```
