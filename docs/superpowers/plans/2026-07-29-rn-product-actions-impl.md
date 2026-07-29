# 상품 관리 구현 계획 (거래 상태 변경 · 삭제 · 상태 필터)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 판매 내역 · 구매 내역 목록에서 거래 상태를 바꾸고, 상품을 지우고, 상태로 걸러 볼 수 있게 한다.

**Architecture:** 상태 변경 · 삭제는 카드의 ⋮ → **하단 시트**로 연다. 메뉴 규칙(어떤 항목을 보일지)은 **순수 함수 하나**로 빼서 테스트한다. 상태 필터는 **서버가 거르게** 백엔드에 선택적 파라미터를 더한다 — 지금 웹은 받아온 페이지에서만 걸러 뒤쪽 항목을 놓친다.

**Tech Stack:** Expo SDK 54 · expo-router 6 · React Native 0.81 · TanStack Query 5 · jest-expo / Next.js 16 · Spring Boot 3

**설계 문서:** `docs/superpowers/specs/2026-07-29-rn-product-actions-design.md`
**선행 바퀴:** #791 (마이 목록 3종, PR #792 머지 완료)

## Global Constraints

- **Expo SDK는 54로 고정.** 이번 계획에 새 의존성은 없다. 필요해지면 반드시 `npx expo install <pkg>`. `@latest`나 `pnpm add`로 Expo 패키지를 넣지 말 것.
- **작업 디렉터리**: 앱 명령은 `mobile/`, 웹 명령은 저장소 루트, 백엔드는 `~/Desktop/cmarket_api`.
- **앱 코드 스타일**: 세미콜론 있음, 작은따옴표, `StyleSheet.create`, import 별칭 `@/`. 주석은 한국어로 **"왜"** 를 적는다. `mobile/components/my/my-product-list.tsx`가 본보기.
- **웹 코드 스타일**: 세미콜론 없음, 작은따옴표, Tailwind v4.
- **색 리터럴**: 새 팔레트를 만들지 말 것. 이번에 쓰는 색 — 글자 `#111827`, 보조 글자 `#6B7280`, 테두리 `#E5E7EB`, 구분선 `#F3F4F6`, 배경 `#F9FAFB`, 흰색 `#FFFFFF`, 덮개 `rgba(17, 24, 39, 0.7)`, **위험 `#DC2626`**, **브랜드 브라운 `#633F00`**(칩 선택 상태 · 등록 버튼에 이미 쓰는 값).
- **모서리**: 모달·시트는 8(#791에서 통일). 카드는 12, 마이 카드류는 16.
- **문구는 동사형**: 시트 항목은 `판매중`이 아니라 **`판매중으로 변경`**.
- **완료는 종착역**: `tradeStatus === 'COMPLETED'`면 상태 변경 항목을 **하나도 보이지 않는다**.
- **낙관적 갱신 금지**: 요청이 끝난 뒤 무효화로 다시 받는다(설계 §7).
- **범위 밖**: 상품 수정(6바퀴) · 찜 목록의 필터/관리 · 웹 모바일 폭 ⋮ 하단 시트(#793) · 웹 대시보드.
- **검증 명령**
  - 앱: `cd mobile && npx tsc --noEmit` · `npx jest` · `npx expo lint`
  - 웹: `npx tsc --noEmit` (루트) · `npx eslint <변경 파일>`
  - 백엔드: 이 맥에는 JDK 11만 있어 **컴파일 확인 불가**. EC2 빌드에서 확인한다.

---

## File Structure

**백엔드 — 고치는 것** (`~/Desktop/cmarket_api`)

| 경로 | 무엇을 |
|---|---|
| `.../product/repository/ProductRepository.java` | 상태까지 거르는 조회 메서드 1개 추가 |
| `.../product/app/service/ProductService.java` | 인터페이스 2개에 `tradeStatus` 파라미터 |
| `.../product/app/service/ProductServiceImpl.java` | 구현 2개에서 분기 |
| `.../web/profile/controller/ProfileController.java` | 엔드포인트 2개에 `@RequestParam` |

**앱 — 새로 만드는 것**

| 경로 | 책임 |
|---|---|
| `mobile/lib/product-actions.ts` | 상태 변경 · 삭제 API. **이 파일만 두 주소를 안다** |
| `mobile/lib/product-actions.test.ts` | 위 테스트 |
| `mobile/lib/product-menu.ts` | 시트에 무엇을 보일지 정하는 **순수 함수** |
| `mobile/lib/product-menu.test.ts` | 위 테스트 |
| `mobile/hooks/use-product-actions.ts` | mutation + 무효화 |
| `mobile/components/my/product-action-sheet.tsx` | 하단 시트(항목 목록만 받는 dumb 컴포넌트) |
| `mobile/components/my/delete-confirm-modal.tsx` | 삭제 확인 |
| `mobile/components/my/status-filter-chips.tsx` | 칩 필터 |

**앱 — 고치는 것**

| 경로 | 무엇을 |
|---|---|
| `mobile/lib/my-lists.ts` | 조회에 선택적 `tradeStatus` |
| `mobile/lib/my-lists.test.ts` | 위 테스트 추가 |
| `mobile/components/product-card.tsx` | 선택적 ⋮ 버튼 |
| `mobile/components/my/my-product-list.tsx` | 칩 필터 · 개수 라벨 · ⋮ · 시트 · 확인 모달 연결 |
| `mobile/app/(tabs)/(my)/my-products.tsx` · `my-purchases.tsx` | 필터 칩 · 목록 종류 전달 |

**웹 — 고치는 것**

| 경로 | 무엇을 |
|---|---|
| `src/features/my-page/MyPage.tsx` | 조회에 `tradeStatus` 전달 · 쿼리 키에 포함 · 화면 필터링 제거 |

---

## Task 1: 백엔드 — 목록 조회에 상태 필터

**Files:**
- Modify: `~/Desktop/cmarket_api/.../product/repository/ProductRepository.java`
- Modify: `~/Desktop/cmarket_api/.../product/app/service/ProductService.java`
- Modify: `~/Desktop/cmarket_api/.../product/app/service/ProductServiceImpl.java`
- Modify: `~/Desktop/cmarket_api/.../web/profile/controller/ProfileController.java`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `GET /api/profile/me/products?page&size&tradeStatus` — `tradeStatus` 선택적
  - `GET /api/profile/me/purchase-requests?page&size&tradeStatus` — 선택적

> **왜 선택적인가:** 안 주면 지금처럼 전부 돌려준다. 그래서 **기존 앱·웹이 그대로 동작**하고 배포 순서에 매이지 않는다. 서버를 먼저 올려도 아무것도 깨지지 않는다.

- [ ] **Step 1: 작업 브랜치 만들기**

```bash
cd ~/Desktop/cmarket_api
git checkout main && git pull origin main
git checkout -b feat/my-list-trade-status-filter
```

- [ ] **Step 2: 리포지토리에 조회 메서드 추가**

`.../product/repository/ProductRepository.java`에서 아래 줄을 찾는다:

```java
    Page<Product> findBySellerIdAndProductTypeAndDeletedAtIsNullOrderByCreatedAtDesc(Long sellerId, ProductType productType, Pageable pageable);
```

그 **바로 아래**에 추가한다:

```java

    /**
     * 판매자 · 상품유형 · 거래상태로 거른 목록 (최신순)
     *
     * 마이페이지의 상태 필터가 쓴다. 화면에서 거르면 이미 받아온 페이지에만 적용되어
     * 뒤쪽 페이지에 있는 항목을 놓치므로, 거르는 일을 서버가 맡는다.
     */
    Page<Product> findBySellerIdAndProductTypeAndTradeStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
            Long sellerId, ProductType productType, TradeStatus tradeStatus, Pageable pageable);
```

`TradeStatus` import가 없으면 파일 상단 import 목록에 더한다:

```java
import org.cmarket.cmarket.domain.product.entity.TradeStatus;
```

> import 경로가 다르면, 같은 파일에서 `ProductType`을 어떻게 import하는지 보고 그 옆 경로를 따른다.

- [ ] **Step 3: 서비스 인터페이스에 파라미터 추가**

`.../product/app/service/ProductService.java`에서 두 메서드 선언을 아래로 바꾼다:

```java
    org.cmarket.cmarket.domain.product.app.dto.MyProductListDto getMySellProductList(
            org.springframework.data.domain.Pageable pageable,
            String email,
            org.cmarket.cmarket.domain.product.entity.TradeStatus tradeStatus
    );
```

```java
    org.cmarket.cmarket.domain.product.app.dto.MyProductListDto getMyPurchaseRequestList(
            org.springframework.data.domain.Pageable pageable,
            String email,
            org.cmarket.cmarket.domain.product.entity.TradeStatus tradeStatus
    );
```

각 메서드의 JavaDoc `@param` 목록에 한 줄씩 더한다:

```java
     * @param tradeStatus 거래 상태 필터. null이면 전체
```

- [ ] **Step 4: 구현체에서 분기**

`.../product/app/service/ProductServiceImpl.java`의 `getMySellProductList`를 아래로 바꾼다:

```java
    public MyProductListDto getMySellProductList(Pageable pageable, String email, TradeStatus tradeStatus) {
        // 사용자 조회
        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new org.cmarket.cmarket.domain.auth.app.exception.UserNotFoundException("사용자를 찾을 수 없습니다."));
        
        Long userId = user.getId();
        
        // 내가 등록한 판매 상품 목록 조회 (판매 상품만, 최신순 정렬)
        // tradeStatus가 있으면 그 상태만. null이면 전체 — 예전 호출이 그대로 동작한다.
        Page<Product> productPage = (tradeStatus == null)
                ? productRepository.findBySellerIdAndProductTypeAndDeletedAtIsNullOrderByCreatedAtDesc(
                        userId, ProductType.SELL, pageable)
                : productRepository.findBySellerIdAndProductTypeAndTradeStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                        userId, ProductType.SELL, tradeStatus, pageable);
        
        // 각 상품을 DTO로 변환 후 PageResult로 변환 (본인 상품이므로 찜 여부는 false)
        PageResult<ProductSearchItemDto> pageResult = PageResult.fromPage(
                productPage.map(product -> ProductSearchItemDto.fromEntity(product, false))
        );
        
        return new MyProductListDto(pageResult);
    }
```

같은 파일의 `getMyPurchaseRequestList`도 같은 방식으로 바꾼다. **`ProductType.SELL` 자리에 그 메서드가 원래 쓰던 값(`ProductType.REQUEST`)을 그대로 두고**, 조회 부분만 위와 같은 3항 분기로 감싼다. 나머지 줄은 건드리지 않는다.

`TradeStatus` import가 없으면 파일 상단에 더한다.

- [ ] **Step 5: 컨트롤러에 파라미터 추가**

`.../web/profile/controller/ProfileController.java`의 `getMySellProductList`를 아래로 바꾼다:

```java
    @GetMapping("/me/products")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SuccessResponse<MyProductListResponse>> getMySellProductList(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) org.cmarket.cmarket.domain.product.entity.TradeStatus tradeStatus
    ) {
        // 현재 로그인한 사용자의 이메일 추출
        String email = SecurityUtils.getCurrentUserEmail();
        
        // 앱 서비스 호출
        org.cmarket.cmarket.domain.product.app.dto.MyProductListDto myProductListDto = 
                productService.getMySellProductList(pageable, email, tradeStatus);
        
        // 앱 DTO → 웹 DTO 변환
        MyProductListResponse response = MyProductListResponse.fromDto(myProductListDto);
        
        return ResponseEntity.status(HttpStatus.OK)
                .body(new SuccessResponse<>(ResponseCode.SUCCESS, response));
    }
```

`getMyPurchaseRequestList`도 같은 방식으로 — `@RequestParam(required = false) ... TradeStatus tradeStatus` 를 더하고 서비스 호출에 넘긴다.

`@RequestParam` import가 없으면 더한다:

```java
import org.springframework.web.bind.annotation.RequestParam;
```

- [ ] **Step 6: 다른 호출부가 깨지지 않는지 확인**

서비스 시그니처가 바뀌었으므로 다른 데서 부르고 있으면 컴파일이 깨진다. 찾아서 `, null`을 더한다:

```bash
cd ~/Desktop/cmarket_api
grep -rn "getMySellProductList\|getMyPurchaseRequestList" --include=*.java . | grep -v "ProductService"
```

출력이 있으면 그 호출부에 세 번째 인자로 `null`을 넘긴다. 없으면 넘어간다.

- [ ] **Step 7: 커밋 · 푸시**

```bash
cd ~/Desktop/cmarket_api
git add -A -- '*.java'
git commit -m "$(cat <<'EOF'
마이페이지 목록 조회에 거래 상태 필터 추가

화면에서 거르면 이미 받아온 페이지에만 적용되어 뒤쪽 페이지의 항목을 놓친다.
예: 상품 50개 중 판매완료 5개가 뒤에 있으면 첫 페이지에서 "없음"으로 보인다.

tradeStatus는 선택적이라 안 주면 전과 같이 전부 돌려준다.
기존 앱·웹 호출이 그대로 동작하므로 배포 순서에 매이지 않는다.
EOF
)"
git push -u origin feat/my-list-trade-status-filter
```

- [ ] **Step 8: main 반영 · 배포 (사용자)**

이 저장소는 기본 브랜치 직접 커밋 금지 규칙이 없다. main에 올리고 EC2에서 배포한다.

```bash
cd ~/Desktop/cmarket_api
git checkout main && git pull origin main
git merge feat/my-list-trade-status-filter && git push origin main
```

**EC2에서 빌드·재시작한다.** 이 맥에는 JDK 11만 있어 컴파일 확인이 안 되므로, **EC2 빌드 로그에서 컴파일이 통과하는지 반드시 확인**한다.

- [ ] **Step 9: 배포 확인**

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://cmarket-api.duckdns.org/api/profile/me/products?tradeStatus=COMPLETED"
```

Expected: **401** (로그인 안 했으니 정상). 파라미터 때문에 **400이 나오면 안 된다** — 400이면 파라미터를 못 알아듣는 것이다.

---

## Task 2: 앱 — 상태 변경 · 삭제 API

**Files:**
- Create: `mobile/lib/product-actions.ts`
- Test: `mobile/lib/product-actions.test.ts`

**Interfaces:**
- Consumes: `apiFetch` (from `mobile/lib/auth/api.ts`)
- Produces:
  - `type TradeStatus = 'SELLING' | 'RESERVED' | 'COMPLETED'`
  - `updateTradeStatus(productId: number, tradeStatus: TradeStatus): Promise<void>`
  - `deleteProduct(productId: number): Promise<void>`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `mobile/lib/product-actions.test.ts`:

```ts
// apiFetch를 타므로 SecureStore가 딸려 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { deleteProduct, updateTradeStatus } from './product-actions';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** 요청에 실린 Authorization 헤더를 꺼낸다. */
function authHeaderOf(call: unknown[]): string | undefined {
  const init = call[1] as { headers?: Record<string, string> } | undefined;
  return init?.headers?.Authorization;
}

/** 요청 본문을 객체로 꺼낸다. */
function bodyOf(call: unknown[]): unknown {
  const init = call[1] as { body?: string } | undefined;
  return init?.body ? JSON.parse(init.body) : undefined;
}

/** 요청 메서드를 꺼낸다. */
function methodOf(call: unknown[]): string | undefined {
  const init = call[1] as { method?: string } | undefined;
  return init?.method;
}

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(reply(200));
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' });
});

describe('updateTradeStatus', () => {
  it('PATCH로 상태를 보낸다', async () => {
    await updateTradeStatus(7, 'RESERVED');

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/products/7/trade-status');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('PATCH');
    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({ tradeStatus: 'RESERVED' });
  });

  it('토큰을 붙여 보낸다', async () => {
    // 내 상품만 바꿀 수 있는 동작이라 토큰이 없으면 서버가 거부한다.
    await updateTradeStatus(7, 'COMPLETED');

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer a-token');
  });

  it('실패하면 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));

    await expect(updateTradeStatus(7, 'SELLING')).rejects.toThrow('거래 상태');
  });
});

describe('deleteProduct', () => {
  it('DELETE로 보낸다', async () => {
    await deleteProduct(9);

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/products/9');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('DELETE');
  });

  it('토큰을 붙여 보낸다', async () => {
    await deleteProduct(9);

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer a-token');
  });

  it('실패하면 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(403));

    await expect(deleteProduct(9)).rejects.toThrow('삭제');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd mobile && npx jest lib/product-actions.test.ts
```

Expected: FAIL — `Cannot find module './product-actions'`

- [ ] **Step 3: 구현**

Create `mobile/lib/product-actions.ts`:

```ts
import { apiFetch } from './auth/api';

// 내 상품을 관리하는 동작 둘. 서버가 주인만 허용하므로 토큰이 반드시 필요하다.
// apiFetch가 토큰 부착과 401 갱신을 맡는다.

/**
 * 서버 enum과 같은 값(TradeStatus.java).
 * @cuddle/shared의 Product.tradeStatus는 `string | null`이라 좁은 타입이 없어 여기서 정의한다.
 */
export type TradeStatus = 'SELLING' | 'RESERVED' | 'COMPLETED';

/** 거래 상태를 바꾼다. 내 상품에만 통한다. */
export async function updateTradeStatus(
  productId: number,
  tradeStatus: TradeStatus
): Promise<void> {
  const res = await apiFetch(`/products/${productId}/trade-status`, {
    method: 'PATCH',
    body: JSON.stringify({ tradeStatus }),
  });

  if (!res.ok) {
    throw new Error(`거래 상태를 바꾸지 못했어요 (HTTP ${res.status})`);
  }
}

/** 상품을 지운다. 되돌릴 수 없으니 부르기 전에 반드시 확인을 받는다. */
export async function deleteProduct(productId: number): Promise<void> {
  const res = await apiFetch(`/products/${productId}`, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(`상품을 삭제하지 못했어요 (HTTP ${res.status})`);
  }
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
cd mobile && npx jest lib/product-actions.test.ts
```

Expected: PASS — 6 tests

- [ ] **Step 5: 타입체크**

```bash
cd mobile && npx tsc --noEmit
```

Expected: 출력 없음

- [ ] **Step 6: 커밋**

```bash
git add mobile/lib/product-actions.ts mobile/lib/product-actions.test.ts
git commit -m "feat(mobile): 거래 상태 변경 · 삭제 API"
```

---

## Task 3: 앱 — 시트에 무엇을 보일지 정하는 규칙

메뉴 규칙은 조건이 얽혀 있고 **완료 후에 상태 변경을 막는 것이 안전에 직결**된다. 화면과 떼어 순수 함수로 만들고 테스트한다.

**Files:**
- Create: `mobile/lib/product-menu.ts`
- Test: `mobile/lib/product-menu.test.ts`

**Interfaces:**
- Consumes: Task 2의 `TradeStatus`
- Produces:
  - `type MenuKind = 'sales' | 'purchases'`
  - `interface StatusAction { label: string; next: TradeStatus }`
  - `buildStatusActions(kind: MenuKind, current: string | null): StatusAction[]`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `mobile/lib/product-menu.test.ts`:

```ts
import { buildStatusActions } from './product-menu';

describe('buildStatusActions — 판매 내역', () => {
  it('판매중이면 예약중 · 판매완료를 보여준다', () => {
    // 지금 상태를 다시 고르게 두면 눌러도 아무 일이 없는 항목이 생긴다.
    expect(buildStatusActions('sales', 'SELLING')).toEqual([
      { label: '예약중으로 변경', next: 'RESERVED' },
      { label: '판매완료로 변경', next: 'COMPLETED' },
    ]);
  });

  it('예약중이면 판매중 · 판매완료를 보여준다', () => {
    expect(buildStatusActions('sales', 'RESERVED')).toEqual([
      { label: '판매중으로 변경', next: 'SELLING' },
      { label: '판매완료로 변경', next: 'COMPLETED' },
    ]);
  });

  it('판매완료면 상태 변경 항목이 하나도 없다', () => {
    // 완료는 종착역이다. 서버가 허용하더라도 화면에서 열어주지 않는다(설계 §3).
    expect(buildStatusActions('sales', 'COMPLETED')).toEqual([]);
  });
});

describe('buildStatusActions — 구매 내역', () => {
  it('완료 전이면 구매완료만 보여준다', () => {
    expect(buildStatusActions('purchases', 'SELLING')).toEqual([
      { label: '구매완료로 변경', next: 'COMPLETED' },
    ]);
  });

  it('구매완료면 상태 변경 항목이 하나도 없다', () => {
    expect(buildStatusActions('purchases', 'COMPLETED')).toEqual([]);
  });
});

describe('buildStatusActions — 값이 이상할 때', () => {
  it('상태가 null이면 판매 내역 전체 목록을 보여준다', () => {
    // 서버가 상태를 안 준 경우. 완료가 아닌 것으로 보고 전부 열어둔다.
    expect(buildStatusActions('sales', null)).toEqual([
      { label: '판매중으로 변경', next: 'SELLING' },
      { label: '예약중으로 변경', next: 'RESERVED' },
      { label: '판매완료로 변경', next: 'COMPLETED' },
    ]);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd mobile && npx jest lib/product-menu.test.ts
```

Expected: FAIL — `Cannot find module './product-menu'`

- [ ] **Step 3: 구현**

Create `mobile/lib/product-menu.ts`:

```ts
import type { TradeStatus } from './product-actions';

// 하단 시트에 어떤 상태 변경 항목을 보일지 정한다.
//
// 화면에서 떼어 순수 함수로 둔 이유:
// 조건이 얽혀 있고(목록 종류 × 현재 상태), 특히 "완료 뒤에는 못 바꾼다"가 어긋나면
// 끝난 거래를 되돌리게 된다. 화면 없이 테스트할 수 있어야 한다.

/** 어느 목록에서 열었는가. 판매와 구매는 고를 수 있는 상태가 다르다. */
export type MenuKind = 'sales' | 'purchases';

export interface StatusAction {
  /** 시트에 그릴 문구. "판매중"이 아니라 "판매중으로 변경" — 지금 상태 표시와 헷갈리지 않게. */
  label: string;
  next: TradeStatus;
}

const SALES_ACTIONS: StatusAction[] = [
  { label: '판매중으로 변경', next: 'SELLING' },
  { label: '예약중으로 변경', next: 'RESERVED' },
  { label: '판매완료로 변경', next: 'COMPLETED' },
];

/**
 * @param current 서버가 준 지금 상태. `@cuddle/shared`의 타입이 `string | null`이라 넓게 받는다.
 */
export function buildStatusActions(kind: MenuKind, current: string | null): StatusAction[] {
  // 완료는 종착역이다(설계 §3). 웹도 isCompleted면 상태 변경 항목을 전부 감춘다.
  if (current === 'COMPLETED') return [];

  if (kind === 'purchases') {
    return [{ label: '구매완료로 변경', next: 'COMPLETED' }];
  }

  // 지금 상태를 다시 고르게 두면 눌러도 아무 일이 없는 항목이 생긴다.
  return SALES_ACTIONS.filter((action) => action.next !== current);
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
cd mobile && npx jest lib/product-menu.test.ts
```

Expected: PASS — 6 tests

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/product-menu.ts mobile/lib/product-menu.test.ts
git commit -m "feat(mobile): 하단 시트 메뉴 규칙 (완료는 종착역)"
```

---

## Task 4: 앱 — 하단 시트 + 삭제 확인 창

껍데기 둘을 만든다. 아직 아무도 부르지 않지만, 다음 Task에서 붙일 때 화면 코드가 짧아진다.

**Files:**
- Create: `mobile/components/my/product-action-sheet.tsx`
- Create: `mobile/components/my/delete-confirm-modal.tsx`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `interface SheetAction { label: string; tone?: 'default' | 'danger'; onPress: () => void }`
  - `<ProductActionSheet visible actions onClose />`
  - `<DeleteConfirmModal visible productTitle submitting onConfirm onClose />`

- [ ] **Step 1: 하단 시트 작성**

Create `mobile/components/my/product-action-sheet.tsx`:

```tsx
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 카드의 ⋮ 로 여는 하단 시트.
//
// 왜 가운데 모달이 아닌가:
// 목록 항목마다 뜨는 메뉴라 한 손으로 닿는 아래쪽이 맞고, 위험한 항목(삭제)을
// 화면 한가운데가 아니라 아래로 떨어뜨려 둘 수 있다.
//
// 이 컴포넌트는 무엇을 보일지 모른다 — 항목 목록을 받아 그리기만 한다.
// 어떤 항목을 보일지는 lib/product-menu.ts가 정한다.

export interface SheetAction {
  label: string;
  /** danger는 되돌릴 수 없는 동작(삭제)에만 쓴다. */
  tone?: 'default' | 'danger';
  onPress: () => void;
}

interface Props {
  visible: boolean;
  actions: SheetAction[];
  onClose: () => void;
}

export function ProductActionSheet({ visible, actions, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* 취소 버튼을 따로 두지 않는다. 바깥을 누르면 닫힌다. */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기">
        {/* 시트 안을 눌렀을 때 닫히지 않도록 바깥 Pressable의 터치를 여기서 멈춘다. */}
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]} onPress={() => {}}>
          {actions.map((action, index) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.item,
                index > 0 && styles.itemDivider,
                pressed && styles.itemPressed,
              ]}
            >
              <Text style={[styles.label, action.tone === 'danger' && styles.labelDanger]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    // 아래는 화면 끝에 붙으므로 위쪽 모서리만 둥글게.
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingTop: 8,
  },
  item: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  itemPressed: {
    backgroundColor: '#F9FAFB',
  },
  label: {
    fontSize: 16,
    color: '#111827',
  },
  labelDanger: {
    color: '#DC2626',
  },
});
```

- [ ] **Step 2: 삭제 확인 창 작성**

Create `mobile/components/my/delete-confirm-modal.tsx`:

```tsx
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

// 삭제 확인. 탈퇴 모달과 같은 껍데기(가운데 · 모서리 8 · 확인 버튼 빨강)를 쓴다.
//
// 상품 제목을 보여주는 이유:
// 목록에서 ⋮ 를 누른 뒤라 어느 카드였는지 헷갈리기 쉽다. 되돌릴 수 없는 동작이니
// 무엇을 지우는지 눈으로 확인시킨다. 웹도 확인 모달에 제목·가격·사진을 띄운다.

interface Props {
  visible: boolean;
  productTitle: string;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  visible,
  productTitle,
  submitting,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>상품 삭제</Text>
          <Text style={styles.title} numberOfLines={2}>
            {productTitle}
          </Text>
          <Text style={styles.description}>삭제하면 되돌릴 수 없어요. 정말 삭제할까요?</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelLabel}>취소</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={submitting}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.confirm,
                submitting && styles.confirmDisabled,
                pressed && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmLabel}>삭제</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    gap: 8,
  },
  heading: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancel: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  confirm: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
```

- [ ] **Step 3: 타입체크 + 린트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

Expected: 타입 오류 0, 린트 exit 0

- [ ] **Step 4: 커밋**

```bash
git add mobile/components/my/product-action-sheet.tsx mobile/components/my/delete-confirm-modal.tsx
git commit -m "feat(mobile): 상품 관리 하단 시트 + 삭제 확인 창"
```

---

## Task 5: 앱 — 상태 변경 · 삭제를 목록에 연결

여기서 실제로 동작한다. 카드에 ⋮ 를 붙이고, 시트를 열고, 요청을 보낸다.

**Files:**
- Create: `mobile/hooks/use-product-actions.ts`
- Modify: `mobile/components/product-card.tsx`
- Modify: `mobile/components/my/my-product-list.tsx`
- Modify: `mobile/app/(tabs)/(my)/my-products.tsx`
- Modify: `mobile/app/(tabs)/(my)/my-purchases.tsx`

**Interfaces:**
- Consumes: Task 2(`updateTradeStatus`·`deleteProduct`·`TradeStatus`), Task 3(`buildStatusActions`·`MenuKind`), Task 4(`ProductActionSheet`·`SheetAction`·`DeleteConfirmModal`)
- Produces:
  - `useProductActions(listKeyPrefix: readonly unknown[])` → `{ changeStatus, remove, isPending }`
  - `<ProductCard product favorite? onMorePress? />`
  - `<MyProductList ... listKind? />`

- [ ] **Step 1: mutation 훅 작성**

Create `mobile/hooks/use-product-actions.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { deleteProduct, updateTradeStatus, type TradeStatus } from '@/lib/product-actions';

// 상태 변경 · 삭제 mutation.
//
// 낙관적 갱신을 하지 않는다(설계 §7):
// 찜에서 "현재 값을 어디서 읽느냐"에 걸려 방향이 뒤집힌 적이 있고, 여기는 상태가 셋이라
// 더 얽힌다. 무엇보다 삭제는 되돌릴 수 없어 먼저 지운 척했다가 실패하면 되살릴 방법이 없다.
// 연타하는 성격도 아니라 결과를 기다려도 어색하지 않다.

/**
 * @param listKeyPrefix 무효화할 목록 키의 앞부분. 예: ['my','products']
 *   필터가 쿼리 키 뒤에 붙으므로 앞부분만 주면 모든 필터의 캐시가 함께 무효화된다.
 */
export function useProductActions(listKeyPrefix: readonly unknown[]) {
  const queryClient = useQueryClient();

  /** 목록과 상세를 함께 다시 받는다. 상태가 바뀌면 상세의 뱃지도 달라져야 한다. */
  const invalidate = (productId: number) => {
    queryClient.invalidateQueries({ queryKey: listKeyPrefix });
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ productId, next }: { productId: number; next: TradeStatus }) =>
      updateTradeStatus(productId, next),
    onSuccess: (_data, { productId }) => invalidate(productId),
    onError: () => {
      Alert.alert('상태를 바꾸지 못했어요', '잠시 후 다시 시도해주세요.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onSuccess: (_data, productId) => invalidate(productId),
    onError: () => {
      Alert.alert('삭제하지 못했어요', '잠시 후 다시 시도해주세요.');
    },
  });

  return {
    changeStatus: (productId: number, next: TradeStatus) =>
      statusMutation.mutate({ productId, next }),
    remove: (productId: number, onDone: () => void) =>
      deleteMutation.mutate(productId, { onSuccess: onDone }),
    isPending: statusMutation.isPending || deleteMutation.isPending,
  };
}
```

- [ ] **Step 2: 카드에 ⋮ 버튼 추가**

`mobile/components/product-card.tsx`를 고친다.

import 줄에 `Pressable`과 `IconSymbol`을 더한다:

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductThumbnail, type FavoriteControl } from '@/components/product-thumbnail';
import { IconSymbol } from '@/components/ui/icon-symbol';
```

Props와 시그니처를 고친다:

```tsx
interface Props {
  product: Product;
  /** 넘기면 썸네일에 찜 버튼이 붙는다. 카드는 그대로 전달만 한다. */
  favorite?: FavoriteControl;
  /** 넘기면 오른쪽 위에 ⋮ 가 붙는다. 관리하는 목록(판매 · 구매)만 넘긴다. */
  onMorePress?: () => void;
}

export function ProductCard({ product, favorite, onMorePress }: Props) {
```

뱃지 행(`<View style={styles.badgeRow}>`)을 감싸는 자리를 찾아, **그 위**에 ⋮ 를 얹는다. `<View style={styles.info}>` 여는 태그 **바로 다음 줄**에 넣는다:

```tsx
        {onMorePress ? (
          <Pressable
            onPress={onMorePress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="상품 관리 메뉴 열기"
            style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
          >
            <IconSymbol name="ellipsis" size={20} color="#9CA3AF" />
          </Pressable>
        ) : null}
```

`StyleSheet.create({ ... })` 안에 스타일을 더한다:

```tsx
  more: {
    // 정보 영역 오른쪽 위. 제목이 길어져도 자리를 뺏기지 않게 띄워 둔다.
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  morePressed: {
    opacity: 0.5,
  },
```

`info` 스타일에 `position: 'relative'`가 없으면 더한다(절대 배치의 기준이 된다):

```tsx
  info: {
    flex: 1,
    position: 'relative',
    // ...기존 값 그대로
  },
```

제목이 ⋮ 아래로 들어가지 않도록 `title` 스타일에 오른쪽 여백을 준다:

```tsx
  title: {
    // ...기존 값 그대로
    paddingRight: 28,
  },
```

- [ ] **Step 3: 아이콘 매핑 추가**

`mobile/components/ui/icon-symbol.tsx`의 `MAPPING`에 한 줄 더한다:

```tsx
  ellipsis: 'more-vert',
```

- [ ] **Step 4: 목록 껍데기에 시트·확인 창 연결**

`mobile/components/my/my-product-list.tsx`를 고친다.

import를 더한다:

```tsx
import { useState } from 'react';

import { DeleteConfirmModal } from '@/components/my/delete-confirm-modal';
import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import { useProductActions } from '@/hooks/use-product-actions';
import { buildStatusActions, type MenuKind } from '@/lib/product-menu';
```

Props에 한 줄 더한다:

```tsx
  /** 있으면 카드에 ⋮ 가 붙고 관리 시트를 연다. 찜한 상품은 넘기지 않는다. */
  listKind?: MenuKind;
```

`PlainRow`를 아래로 바꾼다 — ⋮ 를 받을 수 있게:

```tsx
/** 찜 버튼이 없는 줄(판매 · 구매). 관리 목록이면 ⋮ 가 붙는다. */
function PlainRow({ product, onMorePress }: { product: Product; onMorePress?: () => void }) {
  return (
    <RowShell productId={product.id}>
      <ProductCard product={product} onMorePress={onMorePress} />
    </RowShell>
  );
}
```

`MyProductList` 함수 시그니처에 `listKind`를 더하고, 본문 맨 위(다른 훅들 뒤)에 상태를 만든다:

```tsx
  // 시트를 연 상품. null이면 시트가 닫혀 있다.
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  // 삭제 확인 창을 연 상품.
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { changeStatus, remove, isPending } = useProductActions(queryKey);
```

`renderItem`을 아래로 바꾼다:

```tsx
        renderItem={({ item }) =>
          showFavorite ? (
            <FavoriteRow product={item} />
          ) : (
            <PlainRow
              product={item}
              // 요청이 도는 동안 다시 누르면 상태 변경이 겹친다. 버튼은 그대로 두되 무시한다.
              onMorePress={
                listKind
                  ? () => {
                      if (!isPending) setSheetProduct(item);
                    }
                  : undefined
              }
            />
          )
        }
```

`return (` 안, `<WithdrawModal ...>`처럼 화면 맨 아래에 시트와 확인 창을 그린다. `{renderBody()}` **바로 다음**에 넣는다:

```tsx
      <ProductActionSheet
        visible={sheetProduct !== null}
        onClose={() => setSheetProduct(null)}
        actions={buildSheetActions()}
      />

      <DeleteConfirmModal
        visible={deleteTarget !== null}
        productTitle={deleteTarget?.title ?? ''}
        submitting={isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) remove(deleteTarget.id, () => setDeleteTarget(null));
        }}
      />
```

`renderBody` **위**에 시트 항목을 만드는 함수를 둔다:

```tsx
  /** 시트에 그릴 항목. 상태 변경은 규칙 함수가 정하고, 삭제는 항상 맨 아래에 둔다. */
  const buildSheetActions = (): SheetAction[] => {
    if (!sheetProduct || !listKind) return [];

    const statusActions: SheetAction[] = buildStatusActions(
      listKind,
      sheetProduct.tradeStatus
    ).map((action) => ({
      label: action.label,
      onPress: () => {
        changeStatus(sheetProduct.id, action.next);
        setSheetProduct(null);
      },
    }));

    return [
      ...statusActions,
      {
        label: '삭제',
        tone: 'danger',
        onPress: () => {
          // 시트를 먼저 닫고 확인 창을 연다. 두 개가 겹쳐 뜨지 않게.
          const target = sheetProduct;
          setSheetProduct(null);
          setDeleteTarget(target);
        },
      },
    ];
  };
```

- [ ] **Step 5: 화면 둘에 목록 종류 넘기기**

`mobile/app/(tabs)/(my)/my-products.tsx`의 `<MyProductList ...>`에 한 줄 더한다:

```tsx
      listKind="sales"
```

`mobile/app/(tabs)/(my)/my-purchases.tsx`에도:

```tsx
      listKind="purchases"
```

- [ ] **Step 6: 타입체크 + 린트 + 전체 테스트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

Expected: 타입 오류 0, 린트 exit 0, 테스트 전부 통과

- [ ] **Step 7: 실기기 확인**

```bash
cd mobile && pnpm expo start
```

- 판매 내역 카드 오른쪽 위에 ⋮ 가 보인다. 찜한 상품에는 **없다**
- ⋮ → 시트가 아래에서 올라온다. **현재 상태 항목은 없다**
- 「예약중으로 변경」 → 카드 뱃지가 바뀐다
- 「판매완료로 변경」 → 다시 ⋮ 를 열면 **상태 변경 항목이 사라져 있다**
- 시트 바깥을 누르면 닫힌다
- 「삭제」 → 시트가 닫히고 확인 창에 **상품 제목**이 보인다. **아직 확인을 누르지 말 것** — 마무리 검증에서 버릴 상품으로 한 번만 한다

- [ ] **Step 8: 커밋**

```bash
git add mobile/hooks/use-product-actions.ts mobile/components/product-card.tsx mobile/components/ui/icon-symbol.tsx mobile/components/my/my-product-list.tsx "mobile/app/(tabs)/(my)/my-products.tsx" "mobile/app/(tabs)/(my)/my-purchases.tsx"
git commit -m "feat(mobile): 목록에서 거래 상태 변경 · 삭제"
```

---

## Task 6: 앱 — 상태 필터 칩

**Task 1이 배포된 뒤에 한다.** 서버가 `tradeStatus`를 모르면 필터가 먹지 않는다.

**Files:**
- Create: `mobile/components/my/status-filter-chips.tsx`
- Modify: `mobile/lib/my-lists.ts`
- Modify: `mobile/lib/my-lists.test.ts`
- Modify: `mobile/components/my/my-product-list.tsx`
- Modify: `mobile/app/(tabs)/(my)/my-products.tsx`
- Modify: `mobile/app/(tabs)/(my)/my-purchases.tsx`

**Interfaces:**
- Consumes: Task 2의 `TradeStatus`
- Produces:
  - `type StatusFilter = 'ALL' | TradeStatus`
  - `interface FilterChip { id: StatusFilter; label: string }`
  - `<StatusFilterChips chips activeId onChange />`
  - `fetchMyProducts(page: number, tradeStatus?: TradeStatus)` (기존 시그니처 확장)

- [ ] **Step 1: 조회 함수에 필터 테스트 추가**

`mobile/lib/my-lists.test.ts`의 `describe('내 목록 조회', ...)` 안, 마지막 `it` 다음에 더한다:

```ts
  it('tradeStatus를 주면 쿼리에 붙는다', async () => {
    await fetchMyProducts(0, 'COMPLETED');

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/me/products?page=0&size=20&tradeStatus=COMPLETED'
    );
  });

  it('tradeStatus를 안 주면 안 붙는다', async () => {
    // 전체 보기다. 서버는 파라미터가 없으면 전부 돌려준다.
    await fetchMyProducts(0);

    expect(mockFetch.mock.calls[0][0]).not.toContain('tradeStatus');
  });

  it('찜한 상품은 필터를 받지 않는다', async () => {
    // 찜 목록에는 상태 필터가 없다(설계 §1).
    await fetchMyFavorites(0);

    expect(mockFetch.mock.calls[0][0]).not.toContain('tradeStatus');
  });
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd mobile && npx jest lib/my-lists.test.ts
```

Expected: FAIL — `tradeStatus를 주면 쿼리에 붙는다`가 실패(주소에 `tradeStatus`가 없음)

- [ ] **Step 3: 조회 함수 고치기**

`mobile/lib/my-lists.ts`를 아래로 바꾼다:

```ts
import type { ProductResponse } from '@cuddle/shared';

import { apiFetch } from './auth/api';
import type { TradeStatus } from './product-actions';

// 마이페이지에서 들어가는 목록 3종의 데이터 소스.
//
// 셋 다 로그인해야 볼 수 있어서 apiFetch로 보낸다(토큰 부착 + 401 갱신).
// 서버가 주는 봉투와 항목 모양이 홈 검색과 완전히 같아서(설계 §4) 타입을 새로 만들지 않고
// ProductResponse를 그대로 쓴다.

/** 목록 한 페이지. 무한스크롤에 content와 hasNext 둘 다 필요하다. */
export type MyListPage = ProductResponse['data'];

const PAGE_SIZE = 20; // 서버 기본값(@PageableDefault)과 같은 값

/**
 * 목록 셋의 다른 점은 주소와 오류 문구뿐이라 한 함수로 모은다.
 * @param label 오류 문구에 넣을 목록 이름. "찜한 상품을 불러오지 못했어요"처럼 쓰인다.
 * @param tradeStatus 있으면 그 상태만. 없으면 전체 — 서버가 파라미터 없으면 전부 준다.
 */
async function fetchMyList(
  path: string,
  page: number,
  label: string,
  tradeStatus?: TradeStatus
): Promise<MyListPage> {
  const query = `?page=${page}&size=${PAGE_SIZE}${tradeStatus ? `&tradeStatus=${tradeStatus}` : ''}`;
  const res = await apiFetch(`${path}${query}`);

  if (!res.ok) {
    throw new Error(`${label}을 불러오지 못했어요 (HTTP ${res.status})`);
  }

  const body: ProductResponse = await res.json();
  return body.data;
}

/** 찜한 상품. 상태 필터가 없는 목록이라 파라미터를 받지 않는다. */
export function fetchMyFavorites(page: number): Promise<MyListPage> {
  return fetchMyList('/profile/me/favorites', page, '찜한 상품');
}

export function fetchMyProducts(page: number, tradeStatus?: TradeStatus): Promise<MyListPage> {
  return fetchMyList('/profile/me/products', page, '판매 내역', tradeStatus);
}

export function fetchMyPurchases(page: number, tradeStatus?: TradeStatus): Promise<MyListPage> {
  return fetchMyList('/profile/me/purchase-requests', page, '구매 내역', tradeStatus);
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
cd mobile && npx jest lib/my-lists.test.ts
```

Expected: PASS — 10 tests

- [ ] **Step 5: 칩 컴포넌트 작성**

Create `mobile/components/my/status-filter-chips.tsx`:

```tsx
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { TradeStatus } from '@/lib/product-actions';

// 목록 위 상태 필터. 웹의 Tabs variant="card-pill"과 같은 모양이다.
//
// 왜 드롭다운이 아닌가:
// 선택지가 넷뿐이라 한 줄에 다 보이고, 목록을 훑다가 바꾸는 동작이 한 번에 끝난다.
// 드롭다운은 열고 → 고르는 두 번이 든다.

export type StatusFilter = 'ALL' | TradeStatus;

export interface FilterChip {
  id: StatusFilter;
  label: string;
}

interface Props {
  chips: FilterChip[];
  activeId: StatusFilter;
  onChange: (id: StatusFilter) => void;
}

export function StatusFilterChips({ chips, activeId, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    // 웹 선택 칩과 같은 브랜드 브라운. 앱 브레드크럼 · 등록 버튼이 이미 쓰는 값이다.
    backgroundColor: '#633F00',
    borderColor: '#633F00',
  },
  chipIdle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#633F00',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelIdle: {
    color: '#633F00',
  },
  pressed: {
    opacity: 0.7,
  },
});
```

- [ ] **Step 6: 껍데기에 칩 연결**

`mobile/components/my/my-product-list.tsx`를 고친다.

import를 더한다:

```tsx
import {
  StatusFilterChips,
  type FilterChip,
  type StatusFilter,
} from '@/components/my/status-filter-chips';
```

Props에서 `fetchPage`의 모양을 바꾸고 칩 목록을 받는다:

```tsx
  fetchPage: (page: number, tradeStatus?: TradeStatus) => Promise<MyListPage>;
  /** 있으면 목록 위에 상태 필터 칩을 그린다. 찜한 상품은 넘기지 않는다. */
  filterChips?: FilterChip[];
```

`TradeStatus` import도 더한다:

```tsx
import type { TradeStatus } from '@/lib/product-actions';
```

함수 시그니처에 `filterChips`를 더하고, 본문에 필터 상태를 만든다(`sheetProduct` 선언 옆):

```tsx
  const [filter, setFilter] = useState<StatusFilter>('ALL');
```

`useInfiniteQuery`를 아래로 바꾼다:

```tsx
  } = useInfiniteQuery({
    // 필터가 키에 들어가므로 바꾸면 새 무한스크롤이 시작된다.
    // 이전 필터 결과는 캐시에 남아 되돌아오면 즉시 보인다.
    queryKey: [...queryKey, filter],
    queryFn: ({ pageParam }) => fetchPage(pageParam, filter === 'ALL' ? undefined : filter),
    initialPageParam: 0,
    // 다음 페이지 번호 = 지금까지 받은 페이지 수(0-base). hasNext=false면 종료. 홈과 같은 규칙.
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });
```

개수 라벨을 필터 이름으로 바꾼다. `<Text style={styles.count}>` 줄을 아래로 교체한다:

```tsx
          {total !== undefined ? (
            <Text style={styles.count}>
              {/* 웹과 같이 "전체 2"처럼 필터 이름 + 개수. 필터가 없는 찜 목록은 "상품 2". */}
              {`${filterChips?.find((chip) => chip.id === filter)?.label ?? '상품'} ${total}`}
            </Text>
          ) : null}
```

헤더 **바로 아래**, 제목 영역 **위**에 칩을 그린다:

```tsx
      {filterChips ? (
        <StatusFilterChips chips={filterChips} activeId={filter} onChange={setFilter} />
      ) : null}
```

- [ ] **Step 7: 화면 둘에 칩 목록 넘기기**

`mobile/app/(tabs)/(my)/my-products.tsx`의 `<MyProductList ...>`에 더한다:

```tsx
      filterChips={[
        { id: 'ALL', label: '전체' },
        { id: 'SELLING', label: '판매중' },
        { id: 'RESERVED', label: '예약중' },
        { id: 'COMPLETED', label: '판매완료' },
      ]}
```

`mobile/app/(tabs)/(my)/my-purchases.tsx`에 더한다 — **예약중이 없다**(웹 `TRADE_STATUS_LABEL`과 같음):

```tsx
      filterChips={[
        { id: 'ALL', label: '전체' },
        { id: 'SELLING', label: '요청중' },
        { id: 'COMPLETED', label: '구매완료' },
      ]}
```

- [ ] **Step 8: 타입체크 + 린트 + 전체 테스트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

Expected: 타입 오류 0, 린트 exit 0, 테스트 전부 통과

- [ ] **Step 9: 커밋**

```bash
git add mobile/components/my/status-filter-chips.tsx mobile/lib/my-lists.ts mobile/lib/my-lists.test.ts mobile/components/my/my-product-list.tsx "mobile/app/(tabs)/(my)/my-products.tsx" "mobile/app/(tabs)/(my)/my-purchases.tsx"
git commit -m "feat(mobile): 목록 상태 필터 칩 (서버 조회)"
```

---

## Task 7: 웹 — 필터를 서버 조회로

**Files:**
- Modify: `src/features/my-page/MyPage.tsx`

**Interfaces:**
- Consumes: Task 1의 `tradeStatus` 파라미터
- Produces: 없음 (동작 변경)

- [ ] **Step 1: 판매 목록 조회에 필터 넘기기**

`src/features/my-page/MyPage.tsx`에서 `'/profile/me/products'`를 부르는 `useInfiniteQuery`를 찾는다. 쿼리 키와 `queryFn`을 아래로 바꾼다:

```tsx
    queryKey: ['myProducts', user?.id, activeTradeStatus],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/profile/me/products', {
        params: {
          page: pageParam,
          size: 10,
          // 화면에서 거르면 이미 받아온 페이지에만 적용되어 뒤쪽 항목을 놓친다.
          // 서버가 거르게 맡긴다. ALL이면 파라미터를 빼서 전부 받는다.
          ...(activeTradeStatus === 'ALL' ? {} : { tradeStatus: activeTradeStatus }),
        },
      })
```

- [ ] **Step 2: 구매 목록도 같게**

같은 파일에서 `'/profile/me/purchase-requests'`를 부르는 `useInfiniteQuery`도 같은 방식으로 바꾼다:

```tsx
    queryKey: ['myRequest', user?.id, activeTradeStatus],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/profile/me/purchase-requests', {
        params: {
          page: pageParam,
          size: 10,
          ...(activeTradeStatus === 'ALL' ? {} : { tradeStatus: activeTradeStatus }),
        },
      })
```

`'/profile/me/favorites'`는 **건드리지 않는다** — 찜 목록에는 필터가 없다.

- [ ] **Step 3: 화면에서 거르던 코드 제거**

같은 파일에서 아래 두 변수를 찾는다(272~280행 부근):

```tsx
  const filteredMyProductData =
    activeMyPageTab === 'tab-sales' && activeTradeStatus !== 'ALL'
      ? myProductsData?.pages.flatMap((page) => page.content).filter((product) => product.tradeStatus === activeTradeStatus)
      : ...
```

이제 서버가 걸러 주므로 **거르는 부분이 필요 없다.** 두 변수를 아래로 바꾼다 — 페이지를 이어붙이기만 한다:

```tsx
  // 서버가 걸러 주므로 여기서는 페이지를 이어붙이기만 한다.
  const filteredMyProductData = myProductsData?.pages.flatMap((page) => page.content)
  const filteredMyRequestData = myRequestData?.pages.flatMap((page) => page.content)
```

- [ ] **Step 4: 개수도 서버 값으로**

같은 파일에서 `myRequestTotal`을 넘기는 곳(2군데)을 찾는다:

```tsx
myRequestTotal={activeTradeStatus === 'ALL' ? myRequestData?.pages[0]?.total : filteredMyRequestData?.length}
```

아래로 바꾼다 — 서버가 준 개수가 이미 걸러진 값이다:

```tsx
myRequestTotal={myRequestData?.pages[0]?.total}
```

`myProductsTotal`도 같은 방식으로 걸러낸 배열 길이를 쓰고 있으면 `myProductsData?.pages[0]?.total`로 바꾼다.

- [ ] **Step 5: 타입체크 + 린트**

```bash
npx tsc --noEmit
npx eslint src/features/my-page/MyPage.tsx
```

Expected: 타입 오류 0. eslint는 `'Link' is defined but never used` 경고 1건만(이전부터 있던 것)

- [ ] **Step 6: 웹 손 확인**

```bash
pnpm dev
```

로그인 후 `/mypage`에서:

- 판매 내역 → 필터 칩을 바꾸면 **네트워크 탭에 새 요청**이 나간다(`tradeStatus=...`)
- 개수(`전체 2` → `판매중 1`)가 서버 값으로 바뀐다
- 구매 내역도 같다
- 찜한 상품은 그대로다

- [ ] **Step 7: 커밋**

```bash
git add src/features/my-page/MyPage.tsx
git commit -m "fix(web): 상태 필터를 서버 조회로 — 뒤쪽 페이지 항목을 놓치던 문제"
```

---

## 마무리 검증

- [ ] **통합 게이트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
cd .. && npx tsc --noEmit
git diff --name-only develop...HEAD -- 'src/**/*.ts' 'src/**/*.tsx' | tr '\n' '\0' | xargs -0 npx eslint
```

Expected: 앱 타입 0 · 린트 exit 0 · 테스트 전부 통과 / 웹 타입 0 · 변경 파일 eslint 오류 0

> 웹 `useFavorite.ts:19`의 `set-state-in-effect` 오류는 **develop에도 있는 #788 보류 건**이다. 이번 변경과 무관하니 고치지 않는다.

- [ ] **실기기 손 검증 (설계 §9)**

1. 판매 내역 → ⋮ → 시트가 올라온다. **현재 상태 항목은 없다**
2. 「예약중으로 변경」 → 목록 카드의 뱃지가 바뀐다
3. 상세로 들어가면 상세 뱃지도 바뀌어 있다
4. 「판매완료로 변경」 → 다시 ⋮ 를 열면 **상태 변경 항목이 사라져 있다**
5. 필터 「판매중」 → 방금 완료한 상품이 목록에서 빠진다. 개수 라벨이 `판매중 N`으로 바뀐다
6. 구매 내역 → 시트에 `구매완료로 변경`만 있다
7. **삭제(버릴 상품으로 한 번)** → 확인 창에 제목이 보이고, 확인하면 목록에서 사라진다
8. 시트 바깥을 누르면 닫힌다
9. 찜한 상품에는 ⋮ 도 칩도 **없다**

- [ ] **잔여물 검사**

```bash
grep -rn "개발용\|TODO(\|console.log" mobile/app mobile/components mobile/lib
```

Expected: 출력 없음

- [ ] **PR 생성**

base는 `develop`, 저장소 템플릿(`.github/PULL_REQUEST_TEMPLATE.md`) 형식, 본문에 `Close #<이슈번호>`.
이슈는 착수 전에 `/create-issue`로 먼저 만든다.

---

## 이 계획이 끝나면 (다음 바퀴 준비)

- **6바퀴**: 상품 등록 · 수정 화면. 그때 시트에 「수정」을 더하고, 목록 제목 영역의 등록 버튼(지금은 흐리게 둠)을 연결한다. 착수 전에 "앱에 등록까지 정말 필요한가"부터 다시 본다 — 이미지 업로드가 딸려온다.
- **#793**: 웹 모바일 폭 ⋮ 를 하단 시트로. 모바일 웹에서 드롭다운이 불편하다는 근거가 생겼을 때, #788의 `SelectDropdown` 건과 묶어서.
