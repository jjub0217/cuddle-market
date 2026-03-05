# Claude Code로 모르는 기술(GraphQL) 빠르게 학습하고 적용하기

> 기본 Claude Code와 oh-my-claudecode 플러그인을 비교하며, AI로 GraphQL BFF를 구축한 경험을 공유합니다.

## 📌 들어가며

프론트엔드 개발자가 GraphQL을 한 번도 써본 적 없는 상태에서, **1주일 안에 학습하고 프로젝트에 적용**해야 한다면 어떻게 해야 할까요?

이번 멘토링 과제의 핵심은 "AI(Claude Code)로 모르는 기술을 얼마나 빠르게 학습하고 적용할 수 있는지"를 검증하는 것이었습니다. 추가로, 기본 Claude Code와 **oh-my-claudecode 플러그인**을 각각 사용해보면서 차이를 비교했습니다.

### 과제 내용

1. **oh-my-claudecode 플러그인** 학습 및 적용
2. **GraphQL + Next.js BFF** 구축 — 기존 REST API 위에 GraphQL 레이어 추가
3. **블로그 작성** — 기본 Claude Code vs 플러그인 활용 비교 (이 글)

---

## 🏗 무엇을 만들었나 — GraphQL BFF

### BFF(Backend For Frontend) 패턴이란?

기존 Spring Boot REST API를 그대로 두고, 프론트엔드와 백엔드 사이에 **GraphQL 중간 레이어**를 추가하는 구조입니다.

```
기존:  Next.js  →  Spring Boot REST API  →  DB

변경:  Next.js  →  Next.js GraphQL (BFF)  →  Spring Boot REST API  →  DB
                   ─────── 새로 만든 부분 ───────
```

### 만든 파일들

| 파일 | 역할 |
|------|------|
| `src/graphql/schema.ts` | GraphQL 스키마 정의 (16 Query + 18 Mutation) |
| `src/graphql/resolvers.ts` | REST API 호출 리졸버 (인증 헤더 전달) |
| `src/app/api/graphql/route.ts` | Apollo Server + Next.js API Route |
| `src/lib/api/graphql.ts` | fetchGraphQL 유틸리티 (인증 토큰 자동 전달) |

### 전환한 기존 페이지들

**거의 모든 서비스 페이지**를 GraphQL로 전환했습니다 (~25개 파일, 39파일 변경):

- **Home** — 상품 목록 (무한 스크롤 포함)
- **ProductDetail** — 상품 상세 + 판매자 정보 (Nested Query)
- **CommunityPage / CommunityDetail** — 커뮤니티 목록 + 상세 + 댓글
- **MyPage** — 마이페이지 (판매/구매/찜 목록)
- **ChattingPage** — 채팅 목록
- **ProfileUpdate** — 프로필 수정
- **ProductPost** — 상품 등록/수정
- **UserPage** — 유저 프로필 페이지
- **기타** — 알림, 신고/차단 모달, 찜 기능 등

> **REST 유지 항목**: 로그인/회원가입, 이미지 업로드(FormData), WebSocket 채팅, 비밀번호 찾기

### 핵심 전환 — Apollo Client에서 fetchGraphQL로

처음에는 **Apollo Client**를 사용해서 GraphQL을 연결했습니다. 하지만 문제가 생겼습니다.

| 방법 | 설명 | 무한 스크롤 문제 |
|---|---|---|
| **A. TanStack Query + fetchGraphQL** | `queryFn`에서 GraphQL 요청 | **없음** — `useInfiniteQuery` 그대로 사용 |
| **B. Apollo Client로 교체** | Apollo의 `useQuery`로 전부 교체 | **있음** — `fetchMore` + 캐시 병합으로 방식이 다름 |

처음에 B 방법(Apollo Client)을 선택했더니, Home이나 CommunityPage처럼 `useInfiniteQuery`로 무한 스크롤을 구현한 페이지는 전환이 어려웠습니다. Apollo Client의 무한 스크롤 방식(`fetchMore` + 캐시 병합)은 설계 자체를 다시 해야 했기 때문입니다.

그래서 **A 방법(TanStack Query + fetchGraphQL)**으로 전환했습니다. `queryFn` 안의 호출만 바꾸면 되니까, 무한 스크롤이든 일반 쿼리든 **기존 TanStack Query 코드를 그대로 유지**하면서 GraphQL을 적용할 수 있었습니다. 이 결정 덕분에 **전체 페이지 전환**이 가능해졌습니다.

### BFF 패턴의 솔직한 한계

BFF는 만능이 아닙니다. 이번 구조에서 GraphQL 서버는 결국 백엔드 REST API를 `fetch`로 호출합니다.

```
프론트 → "이름만 줘" → GraphQL 서버 → 백엔드에서 전체 데이터 받음 → 이름만 골라서 응답
```

**백엔드에서 전체 데이터를 받아오는 네트워크 비용은 그대로** 입니다. 필터링은 이미 다 받아온 후에 하는 거라, GraphQL이 DB에 직접 연결된 구조(`SELECT name FROM products`)와는 효율이 다릅니다.

그럼에도 BFF가 가치 있는 이유는:

1. **여러 REST 호출을 한 번의 쿼리로 조합** — 상품 상세에서 상품 + 판매자 + 다른 상품을 한 번에 요청
2. **프론트에 맞는 데이터 구조로 가공** — 백엔드 응답 구조에 종속되지 않음
3. **타입 안정성** — GraphQL 스키마가 곧 API 문서이자 타입 정의

### Nested Query — GraphQL이 빛나는 순간

실제로 ProductDetail 페이지에서 이 장점을 체감했습니다.

**REST라면 3번 호출:**
```
GET /products/1           → 상품 상세
GET /users/5              → 판매자 정보
GET /products?sellerId=5  → 판매자의 다른 상품
```

**GraphQL이면 1번 호출:**
```graphql
query GetProduct($id: Int!) {
  product(id: $id) {
    title
    price
    sellerInfo {              # 판매자 정보 (중첩)
      sellerNickname
      sellerProfileImageUrl
    }
    sellerOtherProducts {     # 판매자의 다른 상품 (중첩 배열)
      id
      title
      price
    }
  }
}
```

한 번의 쿼리로 상품 + 판매자 + 다른 상품을 모두 가져옵니다. 이게 바로 **Nested Query(중첩 쿼리)**이고, BFF 패턴에서도 실질적인 효율 개선이 되는 부분입니다.

---

## 🧪 비교 실험 설계

같은 범위의 작업(Community + Profile 도메인 GraphQL BFF)을 **두 가지 방식**으로 각각 수행했습니다.

| | Phase 1: 기본 Claude Code | Phase 2: oh-my-claudecode |
|---|---|---|
| 도구 | Claude Code CLI (기본) | Claude Code + oh-my-claudecode 플러그인 |
| 실행 방식 | 순차적 대화 | ultrawork 모드 (병렬 에이전트) |
| 범위 | Community + Profile BFF | Community + Profile BFF (동일) |

### Phase 1을 먼저 수행한 후 코드를 삭제하고, Phase 2를 처음부터 다시 수행했습니다.

---

## 📊 비교 결과

### 수치 비교

| 항목 | Phase 1 (기본) | Phase 2 (플러그인) |
|------|---|---|
| **소요 시간** | 2분 34초 | ~26분 37초 |
| **에러 수** | 2 | 2 |
| **생성 파일** | 7개 | 7개 |
| **코드 라인** | ~310줄 | ~359줄 |
| **병렬 처리** | 없음 (순차) | 5개 에이전트 동시 |
| **수동 개입** | 1회 | 1회 |

### "어라? 플러그인이 더 느린데?"

맞습니다. 숫자만 보면 **기본 Claude Code가 압도적으로 빨랐습니다**. 하지만 이 결과에는 맥락이 있습니다.

#### Phase 2가 느렸던 이유

1. **에이전트 이상치**: 5개 병렬 에이전트 중 1개가 **10분 45초** 소요 (나머지 4개는 평균 15초)
2. **API 스펙 불일치 디버깅**: 에이전트가 생성한 코드의 API 엔드포인트/필드명이 실제 백엔드와 달라서 디버깅에 **~15분** 소요
3. **플러그인 세팅 시간**: omc-setup 초기 설정 과정이 포함됨

#### Phase 1이 빨랐던 이유

1. Claude Code가 **단일 컨텍스트에서 직접 작성**하므로 에이전트 오버헤드가 없음
2. 7개 파일을 순차적이지만 **빠르게 연속 생성**
3. 같은 대화 안에서 즉각 수정 가능

---

## 🔍 실질적 비교 — 숫자 너머의 차이

### 1. 작업 방식의 차이

**기본 Claude Code:**
```
나: "GraphQL BFF 만들어줘"
Claude: schema.ts 작성 → resolvers.ts 작성 → route.ts 작성 → ... (순차)
나: "에러 수정해줘"
Claude: 수정
```

한 번에 하나씩, 대화하듯 진행합니다. **컨텍스트가 하나**이므로 일관성이 높고, 내가 흐름을 쉽게 따라갈 수 있습니다.

**oh-my-claudecode (ultrawork):**
```
나: "Community + Profile GraphQL BFF 구현해줘"
플러그인: 작업 분석 → 5개 에이전트 동시 발사
  ├─ Agent 1 (Sonnet): schema.ts + resolvers.ts
  ├─ Agent 2 (Sonnet): route.ts
  ├─ Agent 3 (Haiku): graphql.ts (fetchGraphQL 유틸리티)
  ├─ Agent 4 (Sonnet): 기존 페이지 GraphQL 전환
  └─ Agent 5 (Haiku): providers.tsx + 기존 페이지 import 수정
```

**병렬 실행**이므로 이론적으로 빠르지만, 각 에이전트가 독립적이라 **에이전트 간 일관성 보장이 어렵습니다**.

### 2. 에러 패턴의 차이

**기본 Claude Code의 에러:**
- API 엔드포인트 URL 오타 → 즉시 발견, 즉시 수정
- 같은 컨텍스트에서 대화하므로 "아까 그 부분" 이라고 하면 바로 이해

**oh-my-claudecode의 에러:**
- 에이전트 A가 만든 스키마와 에이전트 B가 만든 페이지의 필드명이 불일치
- 각 에이전트가 독립적으로 API 스펙을 "추측"하므로 불일치 발생 가능
- 디버깅 시 여러 파일을 교차 확인해야 함

### 3. 모델 라우팅 — 비용 최적화

oh-my-claudecode의 진짜 강점은 **모델 티어링**입니다:

| 작업 | 모델 | 이유 |
|------|------|------|
| schema + resolvers | Sonnet (중간) | 설계 판단 필요 |
| API route | Sonnet (중간) | 프레임워크 호환성 중요 |
| fetchGraphQL 유틸리티 | **Haiku (저가)** | 보일러플레이트 코드 |
| 기존 페이지 전환 | Sonnet (중간) | UI + 로직 조합 |
| providers + import 수정 | **Haiku (저가)** | 단순 수정 작업 |

단순한 작업에는 저렴한 모델을, 복잡한 작업에는 고급 모델을 자동 배정합니다. 대규모 프로젝트에서 **토큰 비용을 절감**할 수 있는 구조입니다.

---

## 🤔 그래서 어떤 걸 써야 하나?

### 기본 Claude Code가 더 나은 경우

- **소규모 작업** (파일 7개 이하, 30분 내 완료)
- **처음 배우는 기술** — 대화하면서 배워야 할 때
- **일관성이 중요한 작업** — 파일 간 의존성이 강할 때
- **빠른 프로토타이핑** — "일단 돌아가게 만들어줘"

### oh-my-claudecode가 더 나은 경우

- **대규모 작업** (10개 이상 파일, 여러 도메인)
- **독립적인 작업이 많을 때** — 테스트 작성, 리팩토링 등
- **비용 최적화가 중요할 때** — 모델 티어링으로 토큰 절약
- **반복 패턴이 많을 때** — 비슷한 구조의 파일을 여러 개 생성

### 이번 과제에서의 결론

**이번 규모(7개 파일, BFF 구축)에서는 기본 Claude Code가 더 효율적이었습니다.**

하지만 Products 도메인을 추가할 때(이미 패턴이 확립된 후) oh-my-claudecode로 **1분 24초, 에러 0**으로 완료한 것을 보면, **패턴이 명확하고 작업이 독립적일수록** 플러그인의 병렬 처리가 빛을 발합니다.

---

## 🔄 실제 전환 — REST 직접 호출 vs GraphQL BFF

기존 코드와 전환 후 코드를 나란히 비교하면, GraphQL 전환이 실제로 "뭐가 바뀌는지" 더 직관적으로 보입니다.

### Before: REST API 직접 호출 (Axios)

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchProductById } from '@/lib/api/product'

const { data, isLoading, error } = useQuery({
  queryKey: ['product', id],
  queryFn: () => fetchProductById(Number(id)),
  enabled: !!id,
})

// data에 뭐가 들어있는지 → API 문서를 봐야 알 수 있음
```

### After: TanStack Query + fetchGraphQL

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchGraphQL } from '@/lib/api/graphql'

const GET_PRODUCT = `
  query GetProduct($id: Int!) {
    product(id: $id) {
      title          # ← 필요한 필드만 명시적으로 선택
      price
      sellerInfo {
        sellerNickname
        sellerProfileImageUrl
      }
    }
  }
`

const { data, isLoading, error } = useQuery({
  queryKey: ['product', id],
  queryFn: () => fetchGraphQL<GetProductData>(GET_PRODUCT, { id: Number(id) }),
  enabled: !!id,
})

// data에 뭐가 들어있는지 → 쿼리 자체가 문서
```

**핵심 포인트**: TanStack Query는 그대로 유지하고, `queryFn` 안의 호출만 Axios → fetchGraphQL로 바꿨습니다. 이 덕분에 `useInfiniteQuery`(무한 스크롤)도 동일한 방식으로 전환할 수 있었습니다.

### 달라진 점 정리

| | REST (Axios 직접 호출) | GraphQL BFF (fetchGraphQL) |
|---|---|---|
| **데이터 페칭** | `queryFn: () => axiosFn(...)` | `queryFn: () => fetchGraphQL(query, vars)` |
| **필드 선택** | 서버가 정한 전체 응답 | 클라이언트가 필요한 필드만 |
| **조건부 실행** | `enabled: !!id` | `enabled: !!id` (동일) |
| **로딩 상태** | `isLoading` | `isLoading` (동일) |
| **타입 정보** | 별도 인터페이스 정의 필요 | 쿼리 자체가 타입 문서 역할 |
| **캐싱** | 쿼리 키 기반 | 쿼리 키 기반 (동일) |
| **데이터 조합** | N번 호출 후 클라이언트 조합 | 1번 호출 (Nested Query) |

가장 큰 체감 차이는 **쿼리가 곧 문서**라는 점입니다. REST에서는 `fetchProductById`가 어떤 데이터를 반환하는지 API 문서나 타입 정의를 따로 봐야 하지만, GraphQL에서는 쿼리 자체에 응답 구조가 보입니다.

그리고 TanStack Query를 그대로 유지했기 때문에, **기존 코드 구조를 최소한으로 바꾸면서도 GraphQL의 장점을 취할 수 있었습니다**.

---

## 💡 AI로 모르는 기술 배우기 — 실전 팁

### 1. "개념 정리 문서"를 먼저 만들어라

코드 작성 전에 Claude에게 **"프론트엔드 관점에서 알아야 할 GraphQL 개념을 정리해줘"**라고 요청했습니다. 이 문서가 이후 작업의 기준점이 되었습니다.

```
docs/graphql-frontend-concepts.md
├── GraphQL이란?
├── BFF 패턴
├── Schema & Type 정의
├── Query, Resolver
├── Apollo Server / Client
├── 점진적 마이그레이션 전략
└── ... (15개 섹션)
```

### 2. "비교 실험"으로 도구를 이해해라

같은 작업을 다른 방식으로 해보면, 각 도구의 장단점을 **체감**할 수 있습니다. 블로그 소재도 됩니다.

### 3. API 스펙을 먼저 검증해라

AI에게 코드를 작성시킬 때 가장 흔한 문제는 **API 스펙 불일치**입니다. 실제 API를 `curl`로 한 번 호출해서 응답 구조를 확인한 후 AI에게 제공하면 에러를 크게 줄일 수 있습니다.

```bash
# 이렇게 먼저 확인
curl https://api.example.com/community/posts?page=0&size=1 | jq
```

---

## 📝 마치며

### AI로 기술을 배운다는 것

GraphQL을 한 번도 써본 적 없는 상태에서, Claude Code와 함께 **하루 만에 BFF를 구축하고 기존 페이지를 전환**했습니다. 이것이 가능했던 이유는:

1. **Claude가 보일러플레이트를 처리** → 내가 "무엇을" 만들지에 집중
2. **실시간 개념 설명** → 코드와 함께 "왜 이렇게 하는지" 학습
3. **즉각적인 에러 수정** → 디버깅하면서 실전 지식 습득

### 플러그인의 가치

oh-my-claudecode는 **"처음 배울 때"보다 "이미 알고 반복할 때"** 더 빛납니다:

| 상황 | 추천 |
|------|------|
| 처음 배우는 기술 | 기본 Claude Code (대화형 학습) |
| 패턴이 확립된 후 확장 | oh-my-claudecode (병렬 처리) |
| 대규모 리팩토링 | oh-my-claudecode (독립 작업 분배) |
| 빠른 프로토타입 | 기본 Claude Code (즉각 반응) |

### 핵심 교훈

> **AI는 "대신 해주는 도구"가 아니라 "함께 배우는 파트너"다.**

코드를 생성하는 것보다, 그 과정에서 **왜 이런 구조인지, 어떤 트레이드오프가 있는지** 이해하는 것이 진짜 학습입니다. Claude Code는 그 학습 과정을 **압축**해줍니다.

---

*작성일: 2026-02-28 | 최종 수정: 2026-03-02*
*프로젝트: [Cuddle Market](https://github.com/ExpectedAnnualSalaryOf4TrillionWon/cuddle-market) Next.js 마이그레이션*
