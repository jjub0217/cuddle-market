# 링크 미리보기 이미지를 사진으로 바꾸기 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**목표:** 상품·커뮤니티 상세의 링크 미리보기 이미지를 서버가 그리지 않고, 이미 있는 사진(없으면 고정 그림 한 장)을 그대로 쓴다.

**구조:** `opengraph-image.tsx`·`twitter-image.tsx`(ImageResponse 로 PNG 를 그리는 경로) 네 개를 지운다. 대신 각 `page.tsx` 의 `generateMetadata` 가 `openGraph.images`·`twitter.images` 에 사진 주소를 직접 넣는다. 그림에서 빠지는 가격·거래 상태는 `og:description` 글자로 옮긴다.

**기술:** Next.js App Router `Metadata` API, vitest(jsdom), `@cuddle/shared` 의 `formatPrice`·`getPriceLabel`·`getTradeLabel`.

**설계 근거:** 2026-10-21 대화에서 합의(별도 설계 문서 없음). 요약:

```
상품       mainImageUrl 있음  → 그 사진 주소
           없음               → 고정 그림 /assets/images/og-default.png
커뮤니티   본문 첫 마크다운 사진(http·https) → 그 주소
           없음               → 고정 그림
설명       상품: 「34,000원 · 판매중 · 본문…」   커뮤니티: 지금 그대로
```

## 지켜야 할 것

- 브랜치는 `feature/1122--og-image-photo`(최신 `develop` 에서 땄다, 업스트림 없음). 이슈 #1122.
- 커밋·push 는 사용자가 요청할 때만. PR 대상은 `develop`.
- 웹 파일에 `npx prettier --write` 금지. 들여쓰기는 손으로.
- 고정 그림을 만드는 스크립트는 `probe/` 에 둔다(커밋 안 됨, lint 대상 아님).
- 서버 거래 상태 값은 `SELLING · RESERVED · COMPLETED` 뿐이다. `SOLD_OUT` 을 쓰지 않는다.
- 설명 길이는 지금처럼 155자 이내.

## 꼭 따로 볼 것 (시험이 못 잡는 위험)

1. **WebP 사진.** 실제 서버 상품 138개 중 46개(3분의 1)의 대표 사진이 `.webp` 다(2026-10-21 집계: jpg 80 · webp 46 · 사진 없음 12). 카카오톡이 WebP `og:image` 를 보여 주는지 확인하지 못했다. → Task 4 에서 실물로 확인하고, 안 되면 **멈추고 사용자에게 묻는다.**
2. **사진 주소가 깨졌을 때.** 지우거나 옮겨진 사진이면 미리보기에 그림이 빠지고 제목·설명만 뜬다. 서버 오류(500)는 안 난다. 받아들이는 위험으로 둔다.
3. **판매요청 글.** 가격 앞에 「희망」, 상태는 「요청중·요청완료」로 나와야 한다 → Task 1 시험에 넣었다.
4. **커뮤니티 본문 사진이 상대 주소이거나 `data:` 인 경우.** 미리보기 서버가 못 받으니 고정 그림을 쓴다 → Task 1 시험에 넣었다.
5. **이미 공유된 링크.** 카카오톡이 예전 그림을 저장해 두고 있다. 배포 뒤 공유 디버거로 저장본을 지워야 새 그림이 뜬다 → Task 4.

---

### Task 1: 미리보기 이미지·설명을 고르는 함수

**Files:**
- Create: `src/lib/og/ogMeta.ts`
- Create: `src/lib/og/ogMeta.test.ts`

**Interfaces:**
- Produces:
  - `OG_DEFAULT_IMAGE = { url: '/assets/images/og-default.png', width: 1200, height: 630 }`
  - `pickProductOgImage(mainImageUrl: string | null | undefined): { url: string; width?: number; height?: number }`
  - `pickCommunityOgImage(content: string | null | undefined): { url: string; width?: number; height?: number }`
  - `buildProductOgDescription(p: { price: number; productType: string; tradeStatus: string | null; description?: string | null }): string`

- [ ] **Step 1: 실패하는 시험 쓰기** — `ogMeta.test.ts`

```ts
describe('pickProductOgImage', () => {
  it('대표 사진이 있으면 그 주소를 쓴다', () => {
    expect(pickProductOgImage('https://cdn/a.jpg')).toEqual({ url: 'https://cdn/a.jpg' })
  })
  it('WebP 사진도 그대로 쓴다', () => {
    expect(pickProductOgImage('https://cdn/a.webp')).toEqual({ url: 'https://cdn/a.webp' })
  })
  it.each([null, undefined, ''])('사진이 없으면(%s) 고정 그림', (v) => {
    expect(pickProductOgImage(v)).toEqual(OG_DEFAULT_IMAGE)
  })
})

describe('pickCommunityOgImage', () => {
  it('본문의 첫 사진을 쓴다', () => {
    expect(pickCommunityOgImage('글 ![a](https://cdn/1.png) ![b](https://cdn/2.png)')).toEqual({ url: 'https://cdn/1.png' })
  })
  it('사진 뒤에 붙은 제목 문구는 주소에서 뺀다', () => {
    expect(pickCommunityOgImage('![a](https://cdn/1.png "제목")')).toEqual({ url: 'https://cdn/1.png' })
  })
  it('http·https 가 아닌 주소는 건너뛰고 다음 사진을 본다', () => {
    expect(pickCommunityOgImage('![a](/local.png) ![b](data:image/png;base64,xx) ![c](https://cdn/3.png)')).toEqual({ url: 'https://cdn/3.png' })
  })
  it.each([null, undefined, '', '사진 없는 글'])('사진이 없으면(%s) 고정 그림', (v) => {
    expect(pickCommunityOgImage(v)).toEqual(OG_DEFAULT_IMAGE)
  })
})

describe('buildProductOgDescription', () => {
  it('가격 · 상태 · 본문 순서', () => {
    expect(buildProductOgDescription({ price: 34000, productType: 'SELL', tradeStatus: 'SELLING', description: '여름에 시원합니다.' }))
      .toBe('34,000원 · 판매중 · 여름에 시원합니다.')
  })
  it('판매완료는 판매완료로 나온다 (예전 그림은 판매중으로 잘못 나왔다)', () => {
    expect(buildProductOgDescription({ price: 1000, productType: 'SELL', tradeStatus: 'COMPLETED', description: 'x' }))
      .toBe('1,000원 · 판매완료 · x')
  })
  it('판매요청은 희망 가격과 요청 상태', () => {
    expect(buildProductOgDescription({ price: 12000, productType: 'REQUEST', tradeStatus: null, description: 'x' }))
      .toBe('희망 12,000원 · 요청중 · x')
  })
  it('본문이 없으면 가격과 상태만', () => {
    expect(buildProductOgDescription({ price: 1000, productType: 'SELL', tradeStatus: 'SELLING', description: '' }))
      .toBe('1,000원 · 판매중')
  })
  it('155자를 넘지 않는다', () => {
    const d = buildProductOgDescription({ price: 1000, productType: 'SELL', tradeStatus: 'SELLING', description: '가'.repeat(300) })
    expect(d.length).toBeLessThanOrEqual(155)
  })
})
```

- [ ] **Step 2: 실패 확인** — `pnpm vitest run src/lib/og/ogMeta.test.ts` → 모듈이 없어 FAIL.

- [ ] **Step 3: `src/lib/og/ogMeta.ts` 구현**
  - 가격·라벨·상태는 `@cuddle/shared` 의 `formatPrice`·`getPriceLabel`·`getTradeLabel` 을 쓴다(새로 짓지 않는다).
  - 커뮤니티 사진 찾기 정규식은 `toPlainText.ts` 의 `IMAGE` 와 같은 모양에 주소만 붙잡는다: `/!\[[^\]]*\]\(\s*([^)\s]+)/g`, 그중 `/^https?:\/\//` 인 첫 것.
  - 본문은 줄바꿈을 공백으로 바꾼 뒤 붙이고, 넘치면 155자에서 자르고 `…` 을 붙인다(`toPlainText` 의 `maxLength` 를 그대로 쓸 수 있으면 그것을 쓴다).

- [ ] **Step 4: 통과 확인** — 같은 명령 → PASS.

- [ ] **Step 5: 커밋**(사용자 요청 시) — `feat(web): 링크 미리보기 이미지·설명을 고르는 함수를 더한다(#1122)`

---

### Task 2: 고정 그림 만들기

**Files:**
- Create: `public/assets/images/og-default.png` (1200x630)
- Create(커밋 안 됨): `probe/make-og-default.cjs`

- [ ] **Step 1:** `probe/make-og-default.cjs` 에서 크롬(`chromium.launch({ channel: 'chrome' })`)으로 1200x630 HTML 을 찍는다. 배경 흰색(로고 그림에 흰 바탕이 있어 연한 파랑 위에서는 네모가 드러났다), 가운데에 `public/assets/images/logo-og.png`(256px)와 「커들마켓」·「반려동물 용품 중고마켓」. **글자는 그림 가운데 60% 안에만 둔다** — 카카오톡이 위아래를 잘라도 남게.
- [ ] **Step 2: 확인** — `sips -g pixelWidth -g pixelHeight public/assets/images/og-default.png` → 1200 · 630. 파일 크기 300KB 이하. 그림을 열어 눈으로 본다.

---

### Task 3: 메타데이터를 바꾸고 그리는 코드를 지운다

**Files:**
- Modify: `src/app/(main)/products/[id]/[name]/page.tsx:20-42`
- Modify: `src/app/(main)/community/[id]/[name]/page.tsx` 의 `generateMetadata`
- Delete: 두 경로의 `opengraph-image.tsx`·`twitter-image.tsx` (4개)
- Delete: `src/lib/og/constants.ts`·`src/lib/og/fonts.ts`·`src/lib/og/fonts.test.ts`
- Delete: `public/assets/fonts/NotoSansKR-Subset.ttf`·`public/assets/images/logo-og.png` (Task 2 뒤. 지우기 전 `grep -rn` 으로 다른 쓰임이 없는지 다시 본다 — 2026-10-21 에는 미리보기 코드에서만 썼다)

**Interfaces:**
- Consumes: Task 1 의 네 가지.

- [ ] **Step 1:** 상품 `generateMetadata` — `openGraph.description` 과 `twitter.description` 을 `buildProductOgDescription(product)` 로, `openGraph.images: [pickProductOgImage(product.mainImageUrl)]`, `twitter.images` 도 같은 값. 페이지 `<meta name="description">`(검색 결과용)은 **지금 그대로 본문**을 둔다.
- [ ] **Step 2:** 커뮤니티 `generateMetadata` — `openGraph.images`·`twitter.images` 에 `pickCommunityOgImage(post.content)`. 설명은 그대로.
- [ ] **Step 3:** 위 파일들을 지운다.
- [ ] **Step 4: 게이트** — `pnpm gate` 통과. lint 경고 수가 31 보다 줄면 `lint:strict` 의 `--max-warnings` 도 같이 낮춘다.
- [ ] **Step 5: 로컬 확인** — `pnpm build && pnpm start` 뒤

```bash
for p in /products/171 /products/<webp 상품> /products/<사진 없는 상품> /community/<사진 있는 글> /community/<사진 없는 글>; do
  curl -sL "http://localhost:3000$p" | grep -oE '<meta (property|name)="(og|twitter):(image|description)[^>]*'
done
```

  기대: `og:image` 가 CloudFront 사진 주소이거나 `https://cuddle-market.vercel.app/assets/images/og-default.png`. `opengraph-image-` 가 들어간 주소는 하나도 없어야 한다. 상품 `og:description` 이 「…원 · 판매중 · …」.
  확인용 상품·글 번호는 실행할 때 서버에서 골라 이 칸에 적는다.

- [ ] **Step 6: 커밋**(사용자 요청 시) — `feat(web): 링크 미리보기에 상품 사진을 그대로 쓴다(#1122)`

---

### Task 4: 실제 앱에서 확인 (사용자와 같이)

배포된 주소가 있어야 카카오톡이 읽을 수 있다. 사용자 승인을 받아 브랜치를 push 하고 PR 을 연 뒤 Vercel 미리보기 주소로 본다.
⚠️ Vercel 미리보기 주소에 로그인 보호가 걸려 있으면 카카오 서버가 못 읽는다. 그러면 `develop` 머지 후 운영 주소로 확인한다.

- [ ] **Step 1:** 카카오 공유 디버거(developers.kakao.com → 도구 → 공유 디버거)에 Task 3 Step 5 의 다섯 주소를 넣어 본다.
- [ ] **Step 2: WebP 판정.** WebP 상품의 그림이 뜨는가.
  - 뜬다 → 계속.
  - 안 뜬다 → **멈춘다.** 사용자에게 「WebP 상품은 고정 그림으로 대신할지 / 그 상품만 서버가 그리는 방식을 남길지」를 권장안과 함께 묻는다.
- [ ] **Step 3:** 실제 카카오톡 채팅방(나와의 채팅)에 같은 주소를 보낸다. 사진이 칸을 채우는지, 그림 아래 제목·설명에 가격이 보이는지 본다. 디버거에서는 뜨는데 채팅방에서 안 뜬 사례가 보고되어 있어 둘 다 본다.
- [ ] **Step 4:** 슬랙(나에게 보내는 메시지)과 X 글쓰기 창에서도 한 번씩 본다.
- [ ] **Step 5:** 운영 배포 뒤 171번 주소를 공유 디버거에서 「캐시 초기화」한다. `/products/171` 과 `/products/171/고양이라탄숨숨집` 은 저장본이 따로일 수 있어 둘 다 한다.
