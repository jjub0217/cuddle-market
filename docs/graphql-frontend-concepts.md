# GraphQL - 프론트엔드가 알아야 할 개념 정리

> 이 문서는 GraphQL + Next.js BFF 과제를 진행하면서 프론트엔드 관점에서 알아야 할 개념들을 정리한 문서입니다.
> 과제 진행 중 수시로 업데이트됩니다.

---

## 과제 배경

### 이번주 과제 (3회차 멘토링)

1. **oh-my-claudecode 플러그인** 학습 및 적용 — 기본 Claude Code 운영 방식과 비교 체험
2. **GraphQL + Next.js 백엔드 API 구축** — 기존 REST API 위에 GraphQL BFF 레이어를 만들어보기. 핵심은 AI(Claude Code + 플러그인)로 모르는 기술을 빠르게 학습/적용할 수 있는지 검증
3. **블로그 글 작성** — 기본 Claude Code 운영 개념 + 플러그인 활용 경험 비교

### 과제 진행 방향

- **1단계**: 기본 Claude Code로 GraphQL BFF 일부 구현 (Products 도메인)
- **2단계**: oh-my-claudecode 플러그인으로 나머지 부분 구현 (Community + Profile 도메인)
- 같은 성격의 작업을 각각 다른 방식으로 해보면서 비교 포인트 확보

---

## 1. GraphQL이란?

**API를 호출하는 방식(쿼리 언어)**이다. REST API와 같은 목적이지만 방식이 다르다.

### REST API (기존 방식)

서버가 정해놓은 URL마다 정해진 데이터를 줌.

```
GET /api/products        → 상품 목록 전체
GET /api/products/1      → 1번 상품 전체 정보
GET /api/users/5         → 5번 유저 전체 정보
```

상품 이름만 필요해도 **전체 정보가 다 옴** → 불필요한 데이터 전송 (Over-fetching)

### GraphQL 방식

클라이언트가 **필요한 필드만 지정**해서 요청.

```graphql
{
  products {
    name
    price
  }
}
```

→ 이름과 가격만 응답으로 옴. 나머지 필드는 전송되지 않음.

### 핵심 차이

| | REST API | GraphQL |
|---|---|---|
| 엔드포인트 | URL마다 하나씩 (`/products`, `/users`) | **단일 엔드포인트** (`/api/graphql`) |
| 응답 데이터 | 서버가 정한 고정 구조 | **클라이언트가 필요한 필드만 선택** |
| 여러 데이터 조합 | 여러 번 호출 필요 | **한 번의 쿼리로 조합 가능** |

---

## 2. GraphQL 서버는 어디서 실행되나?

### 이번 과제의 구조 (BFF 패턴)

```
프론트(Next.js) → Next.js API Route(GraphQL 서버) → 기존 Spring Boot REST API → DB
                  ──────── 여기만 새로 만듦 ────────
```

- GraphQL 서버가 **프론트와 백엔드 사이의 중간 레이어** 역할
- 이것을 **BFF (Backend For Frontend)** 패턴이라고 함
- 기존 Spring Boot, JPA, MySQL은 **전혀 건드리지 않음**

### GraphQL 서버가 하는 일

```
1. 프론트가 GraphQL 서버에 요청    → "이름, 가격만 줘"
2. GraphQL 서버가 백엔드 REST 호출  → Spring Boot에서 전체 데이터 받음
3. GraphQL 서버가 필터링            → 이름, 가격만 골라서 프론트에 응답
```

---

## 3. GraphQL이 진짜 힘을 발휘하는 경우

### 이번 과제 구조의 한계

```
프론트 → "이름만 줘" → GraphQL 서버 → 백엔드에서 전체 데이터 받음 (느림) → 이름만 골라서 응답
```

백엔드에서 전체 데이터를 받아오는 시간은 그대로 걸린다. 필터링은 이미 다 받아온 후에 하는 거라 **백엔드↔GraphQL 구간의 네트워크 비용은 절감되지 않음**.

### GraphQL이 이상적으로 동작하는 경우

**GraphQL 서버가 DB에 직접 연결된 경우:**

```
프론트 → "이름만 줘" → GraphQL 서버 → SELECT name FROM products (필요한 것만 조회)
```

이 경우 DB에서부터 필요한 데이터만 가져오므로 진정한 효율 개선이 됨.

### 그렇다면 이번 과제(BFF)의 가치는?

REST API를 감싸는 BFF 패턴에서도 GraphQL은 가치가 있다:

1. **여러 REST 호출을 한 번의 쿼리로 조합** — 프론트가 여러 번 호출할 것을 GraphQL 서버에서 한 번에 처리
2. **프론트에 맞는 데이터 구조로 가공** — 백엔드 응답 구조에 종속되지 않음
3. **타입 안정성** — GraphQL 스키마가 곧 API 문서이자 타입 정의

---

## 4. GraphQL 도입 시 아키텍처 옵션들

| 방식 | 구조 | 특징 |
|------|------|------|
| **A. BFF 레이어 (이번 과제)** | Next.js GraphQL → Spring Boot REST → DB | 기존 백엔드 유지. 프론트 전용 중간 레이어 |
| B. 백엔드에 GraphQL 추가 | Next.js → Spring Boot GraphQL → DB | 백엔드 팀이 GraphQL 엔드포인트를 제공 |
| C. GraphQL이 DB 직접 연결 | Next.js GraphQL → DB | 기존 백엔드 제거. 비현실적 (인증/권한/비즈니스 로직 재구현 필요) |

**이번 과제에서 A를 선택한 이유:**
- 프론트엔드 개발자 입장에서 백엔드를 건드릴 수 없음
- 1주일 과제 기간
- 목적이 "GraphQL 마스터"가 아니라 "AI로 빠르게 배워서 적용하는 과정" 자체

---

## 6. Schema & Type 정의 (SDL)

GraphQL에서 스키마는 **SDL(Schema Definition Language)**로 작성한다. 이것은 "이 API에서 어떤 데이터를 주고받을 수 있는지"를 정의하는 설계도다.

### 타입 정의 예시
```graphql
type Product {
  id: Int!
  title: String!
  price: Int!
  petType: String    # nullable (느낌표 없음)
}
```

### `!` (느낌표) 의미 — Non-null

GraphQL에서 `!`는 **"이 필드는 반드시 값이 있다 (null이 아니다)"**를 의미한다.

| 표기 | 의미 | 예시 |
|------|------|------|
| `String!` | 반드시 문자열이 옴. null 불가 | `"제목입니다"` |
| `String` | 문자열이 오거나 null이 올 수 있음 | `"제목입니다"` 또는 `null` |
| `[String!]!` | 배열 자체도 null 불가, 배열 안의 요소도 null 불가 | `["a", "b"]` |
| `[String]` | 배열이 null일 수도, 요소가 null일 수도 있음 | `null` 또는 `["a", null]` |

TypeScript로 비유하면:
```typescript
// GraphQL: title: String!
title: string           // 항상 값이 있음

// GraphQL: petType: String
petType?: string | null  // 없을 수도 있음
```

프론트엔드 관점에서 `!`가 붙은 필드는 **null 체크 없이 바로 사용 가능**하므로 코드가 간결해진다.

### 스칼라 타입 (기본 제공 타입)

| GraphQL 타입 | TypeScript 대응 | 설명 |
|---|---|---|
| `Int` | `number` | 정수 |
| `Float` | `number` | 실수 |
| `String` | `string` | 문자열 |
| `Boolean` | `boolean` | 참/거짓 |
| `ID` | `string` | 고유 식별자 (문자열로 직렬화) |

### 커스텀 타입과 중첩

```graphql
type SellerInfo {
  sellerId: Int!
  sellerNickname: String!
}

type ProductDetail {
  title: String!
  sellerInfo: SellerInfo!    # 다른 타입을 필드로 사용 (중첩)
  sellerOtherProducts: [Product!]!  # 배열 타입
}
```

REST API에서는 응답 JSON 구조가 문서에만 존재하지만, GraphQL에서는 **스키마 자체가 곧 API 문서이자 타입 정의**다.

---

## 7. Query — 데이터 조회 요청

Query는 GraphQL에서 **데이터를 읽을 때** 사용하는 타입이다. REST API의 GET 요청에 해당.

```graphql
type Query {
  products(page: Int = 0, size: Int = 20, keyword: String): ProductConnection!
  product(id: Int!): ProductDetail
}
```

### 인자 (Arguments)
- `(page: Int = 0)` → `= 0`은 기본값. 프론트가 안 보내면 0이 사용됨
- `(id: Int!)` → `!` 붙었으므로 반드시 보내야 함
- `(keyword: String)` → 느낌표 없으므로 선택적 (보내지 않아도 됨)

### 프론트에서 호출하는 방법
```graphql
# 필요한 필드만 선택해서 요청
{
  products(page: 0, size: 10, keyword: "강아지") {
    content {
      id
      title
      price
    }
    totalElements
    hasNext
  }
}
```

REST API였다면 `/products/search?page=0&size=10&keyword=강아지`로 호출하고 **전체 필드가 다 오지만**, GraphQL에서는 `id`, `title`, `price`만 응답으로 받는다.

---

## 8. Resolver — 데이터를 실제로 가져오는 함수

스키마가 "어떤 데이터가 있는지" 정의하는 **설계도**라면, 리졸버는 "그 데이터를 **어디서 어떻게 가져오는지**" 구현하는 **실행 코드**다.

### 비유

```
스키마(SDL):  "이 식당에는 파스타, 스테이크, 샐러드가 있습니다" (메뉴판)
리졸버:      "파스타 주문이 들어오면 → 주방에서 이렇게 만드세요" (조리법)
```

### 리졸버 구조

```typescript
const resolvers = {
  Query: {
    // products 쿼리가 호출되면 이 함수가 실행됨
    products: async (parent, args, context) => {
      // args: 프론트가 보낸 인자 (page, size, keyword 등)
      // parent: 상위 리졸버의 반환값 (최상위 Query에서는 사용 안 함)
      // context: 요청 전체에서 공유되는 값 (인증 토큰 등)

      const res = await fetch(`${API_URL}/products/search?page=${args.page}`);
      const json = await res.json();
      return json.data;
    },
  },
};
```

### 리졸버의 4가지 인자

| 인자 | 이름 | 설명 | 사용 빈도 |
|------|------|------|-----------|
| 1번째 | `parent` | 상위 필드의 반환값. 중첩 리졸버에서 사용 | 중첩 시 필수 |
| 2번째 | `args` | 프론트가 보낸 쿼리 인자 (`page`, `id` 등) | 거의 항상 |
| 3번째 | `context` | 요청 전체에서 공유되는 값 (인증 정보 등) | 인증 필요 시 |
| 4번째 | `info` | 쿼리 실행에 대한 메타 정보 | 거의 안 씀 |

### BFF에서의 리졸버 역할

이번 과제(BFF 패턴)에서 리졸버가 하는 일:

```
프론트 → GraphQL 쿼리 → 리졸버 실행 → REST API 호출 → 응답 가공 → 프론트에 반환
                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                         리졸버가 담당하는 영역
```

리졸버 안에서 기존 Spring Boot REST API를 `fetch`로 호출하고, 그 결과를 GraphQL 스키마에 맞게 반환한다. 프론트는 REST API의 존재를 몰라도 되고, GraphQL 스키마만 보면 된다.

### 프론트엔드가 알아야 할 포인트

프론트엔드 개발자가 리졸버를 직접 작성할 일은 적지만, 알아야 하는 이유:

1. **에러 디버깅**: GraphQL 에러가 나면 리졸버에서 발생한 것. 어떤 REST API가 실패했는지 추적 가능
2. **성능 이해**: 하나의 GraphQL 쿼리가 내부적으로 몇 개의 REST 호출을 하는지 알아야 성능 예측 가능
3. **BFF 직접 구축**: Next.js API Route에 GraphQL 서버를 두는 경우 프론트엔드가 리졸버를 작성하게 됨

---

## 9. Apollo Server — GraphQL 서버 엔진

Apollo Server는 GraphQL 스펙을 구현한 **서버 라이브러리**다. 쿼리 파싱, 스키마 검증, 리졸버 실행 등을 대신 처리해준다.

### 이번 과제에서의 역할

```
Next.js API Route (/api/graphql)
    └── Apollo Server ← 여기가 엔진
          ├── 스키마(SDL) 로드
          ├── 쿼리 파싱 & 검증
          ├── 리졸버 실행
          └── 응답 반환
```

### 우리가 한 일 vs Apollo Server가 해준 일

| 우리가 작성한 것 | Apollo Server가 처리한 것 |
|---|---|
| 스키마 정의 (SDL) | 쿼리 문자열 파싱 |
| 리졸버 함수 | 타입 검증 (잘못된 필드 요청 시 에러) |
| API Route 연결 | 리졸버 실행 엔진 |
| | 에러 포맷팅 |

---

## 10. Apollo Client — 프론트에서 GraphQL 호출

Apollo Client는 **프론트엔드에서 GraphQL 서버에 쿼리를 보내는 라이브러리**다. `fetch`로 직접 호출할 수도 있지만, Apollo Client는 캐싱, 로딩 상태 관리, 에러 처리 등을 자동으로 해준다.

### TanStack Query와의 비교

이 프로젝트에서는 REST API 호출에 TanStack Query를 쓰고 있다. Apollo Client는 **GraphQL 전용 TanStack Query**라고 이해하면 된다.

| | TanStack Query (기존) | Apollo Client (GraphQL) |
|---|---|---|
| 대상 | REST API | GraphQL API |
| 데이터 호출 | `useQuery(key, fetchFn)` | `useQuery(GQL_QUERY, { variables })` |
| 캐싱 | 쿼리 키 기반 | 타입 + id 기반 (정규화 캐시) |
| 로딩/에러 | `{ data, isLoading, error }` | `{ data, loading, error }` |

### 사용 패턴

```tsx
// 1. 쿼리 정의 (gql 태그)
const GET_PRODUCTS = gql\`
  query GetProducts($page: Int, $size: Int) {
    products(page: $page, size: $size) {
      content { id title price }
      totalElements
    }
  }
\`;

// 2. 컴포넌트에서 useQuery 호출
const { data, loading, error } = useQuery<GetProductsData>(GET_PRODUCTS, {
  variables: { page: 0, size: 5 },
});

// 3. data가 오면 바로 사용 (타입 안전)
data.products.content.map(p => p.title)
```

### Variables — 쿼리에 값 전달

GraphQL에서 동적 값을 전달할 때 **Variables**를 사용한다. 쿼리 문자열에 직접 값을 넣지 않고, `$변수명`으로 선언하고 `variables` 객체로 전달한다.

```graphql
# $page, $size가 변수 (Variables)
query GetProducts($page: Int, $size: Int) {
  products(page: $page, size: $size) { ... }
}
```

```typescript
// variables로 실제 값 전달
useQuery(GET_PRODUCTS, {
  variables: { page: 0, size: 10 },
});
```

REST API에서 쿼리 파라미터(`?page=0&size=10`)에 해당하는 개념이다.

### Next.js App Router에서의 설정

```
layout.tsx
  └── Providers
        └── QueryClientProvider (TanStack Query)
              └── ApolloWrapper (Apollo Client)   ← 추가됨
                    └── 페이지 컴포넌트
```

`ApolloWrapper`가 하위 모든 컴포넌트에 Apollo Client 인스턴스를 제공하므로, 어떤 페이지에서든 `useQuery`를 바로 사용할 수 있다.

---

## 11. 점진적 마이그레이션 — REST → GraphQL 공존 전략

실제 프로젝트에서 GraphQL을 도입할 때, 모든 API 호출을 한 번에 전환하지 않는다. **읽기(Query)부터 전환하고, 쓰기(Mutation)는 나중에** 하는 것이 안전한 전략이다.

### 이번 과제에서 적용한 패턴

```
CommunityDetail.tsx:
  ✅ 게시글 조회 (useQuery)     → Apollo Client (GraphQL)
  ✅ 댓글 조회 (useQuery)       → Apollo Client (GraphQL)
  ❌ 댓글 작성 (useMutation)    → TanStack Query + REST (유지)
  ❌ 게시글 삭제 (useMutation)  → TanStack Query + REST (유지)
```

### 왜 이렇게 하나?

1. **읽기는 리스크가 낮음** — 데이터를 보여주기만 하므로, 전환해도 부작용이 없음
2. **쓰기는 리스크가 높음** — 인증 토큰 전달, 에러 처리, 캐시 무효화 등 복잡한 요소가 많음
3. **BFF에서 인증 전달이 어려움** — GraphQL 서버가 중간에 있으므로 인증 토큰을 한 단계 더 전달해야 함

### 같은 컴포넌트에서 두 라이브러리 공존

```typescript
// Apollo Client — GraphQL 읽기
import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'

// TanStack Query — REST 쓰기 (기존 유지)
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deletePost, postReply } from '@/lib/api/community'
```

이 패턴은 마이그레이션 과도기에 자연스럽게 발생하며, **두 라이브러리가 충돌하지 않는다**. 각자 독립적으로 상태를 관리하기 때문이다.

---

## 12. initialData 패턴 — SSR 데이터를 Apollo 폴백으로 활용

Next.js App Router에서는 서버 컴포넌트가 SEO용 데이터를 미리 가져온다. 이 데이터를 Apollo Client의 **폴백(fallback)**으로 사용하면 화면 깜빡임 없이 부드러운 UX를 제공할 수 있다.

### 구조

```
서버 컴포넌트 (page.tsx)
  └── REST API로 데이터 미리 fetch (SSR)
        └── initialData로 클라이언트 컴포넌트에 전달

클라이언트 컴포넌트 (ProductDetail.tsx)
  └── Apollo useQuery 실행 (GraphQL)
        └── 로딩 중에는 initialData 사용
        └── 응답 오면 Apollo 데이터로 교체
```

### 코드 패턴

```typescript
// 클라이언트 컴포넌트
function ProductDetail({ initialData }: { initialData: ProductDetailItem }) {
  const { id } = useParams()

  // Apollo로 GraphQL 조회
  const { data: apolloData, loading } = useQuery<GetProductData>(GET_PRODUCT, {
    variables: { id: Number(id) },
    skip: !id,
  })

  // Apollo 데이터가 있으면 사용, 없으면 SSR 데이터를 폴백
  const data = apolloData?.product ?? initialData

  return <div>{data.title}</div>
}
```

### `skip` 옵션

`skip: !id`는 **조건부 쿼리 실행**이다. `id`가 없으면 쿼리를 실행하지 않는다.

| 옵션 | 설명 | 예시 |
|------|------|------|
| `skip: true` | 쿼리 실행하지 않음 | 아직 필요한 값이 없을 때 |
| `skip: false` | 쿼리 정상 실행 | 기본값 |

TanStack Query의 `enabled` 옵션과 같은 역할이다:
```typescript
// TanStack Query
useQuery({ queryKey: ['product', id], queryFn: ..., enabled: !!id })

// Apollo Client
useQuery(GET_PRODUCT, { variables: { id }, skip: !id })
```

---

## 13. Nested Query — 중첩 쿼리

GraphQL의 핵심 강점 중 하나는 **한 번의 쿼리로 관련 데이터를 중첩해서 가져올 수 있는 것**이다.

### REST API에서의 문제

상품 상세 + 판매자 정보 + 판매자의 다른 상품을 보여주려면:

```
GET /products/1           → 상품 상세
GET /users/5              → 판매자 정보
GET /products?sellerId=5  → 판매자의 다른 상품
```

3번의 API 호출이 필요하다.

### GraphQL의 해결

```graphql
query GetProduct($id: Int!) {
  product(id: $id) {
    title
    price
    sellerInfo {           # 중첩된 객체
      sellerId
      sellerNickname
      sellerProfileImageUrl
    }
    sellerOtherProducts {  # 중첩된 배열
      id
      title
      price
      mainImageUrl
    }
  }
}
```

**한 번의 쿼리로** 상품 + 판매자 + 다른 상품을 모두 가져온다.

### 스키마에서의 중첩 정의

```graphql
type ProductDetail {
  title: String!
  price: Int!
  sellerInfo: SellerInfo        # 다른 타입을 필드로 참조
  sellerOtherProducts: [Product!]  # 배열 타입으로 참조
}

type SellerInfo {
  sellerId: Int!
  sellerNickname: String!
  sellerProfileImageUrl: String
}
```

리졸버에서는 REST API가 이미 중첩 데이터를 반환하면 그대로 전달하면 된다. BFF 패턴에서는 리졸버 내부에서 여러 REST 호출을 조합할 수도 있다.

---

## 14. BFF에서의 인증 전달 문제

BFF 패턴에서 가장 까다로운 부분은 **인증 토큰 전달**이다.

### 문제 상황

```
프론트 (쿠키에 토큰 보유)
  → GraphQL 서버 (Next.js API Route)
    → Spring Boot REST API (토큰이 필요!)
```

프론트의 인증 토큰이 GraphQL 서버를 거쳐 백엔드까지 전달되어야 한다.

### 해결 방향 (context 활용)

Apollo Server의 `context` 함수에서 요청 헤더의 토큰을 추출하고, 리졸버에서 이를 사용한다:

```typescript
// API Route
const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => ({
    token: req.headers.get('authorization'),  // 토큰 추출
  }),
})

// 리졸버
userProfile: async (_parent, args, context) => {
  const res = await fetch(`${API_URL}/profile/${args.userId}`, {
    headers: { Authorization: context.token },  // 토큰 전달
  })
  return (await res.json()).data
}
```

이번 과제에서는 인증이 필요한 API(프로필 조회 등)의 완전 전환은 보류하고, **인증 불필요 API만 GraphQL로 전환**했다. 인증 전달은 추후 과제로 남겨둔 상태다.

---

## 5. 앞으로 추가될 개념들

> 구현 진행하면서 아래 개념들이 순차적으로 추가됩니다.

- [x] Schema & Type 정의 (SDL)
- [x] Query vs Mutation (Query 부분만)
- [x] Resolver 패턴
- [x] Apollo Server / Apollo Client
- [x] Field Selection & Projection
- [x] Variables & Arguments
- [x] Nested Query (중첩 쿼리)
- [x] 점진적 마이그레이션 전략 (REST + GraphQL 공존)
- [x] initialData 패턴 (SSR + Apollo 폴백)
- [x] skip 옵션 (조건부 쿼리)
- [x] BFF 인증 전달 문제
- [ ] Mutation (데이터 변경)
- [ ] Fragment
- [ ] Error Handling
- [ ] Caching 전략
- [ ] DataLoader (N+1 문제)

---

*마지막 업데이트: 2026-02-26*
