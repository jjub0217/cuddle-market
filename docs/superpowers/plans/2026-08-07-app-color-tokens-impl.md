# 앱 색 토큰 도입 계획 (#786)

> **에이전트에게:** 이 계획은 superpowers:subagent-driven-development 또는
> superpowers:executing-plans 로 한 과제씩 실행한다. 단계는 체크박스(`- [ ]`)로 따라간다.

**목표:** `mobile/` 곳곳에 흩어진 색 값 599개(56색·86파일) 가운데 **567개**를
`constants/colors.ts` 의 역할 이름 뒤로 모으고, 다시 새지 않게 lint 로 잠근다.
나머지 32개는 일부러 남긴다(아래 「지켜야 할 것」의 예외 넷).

```
①  71  공용 UI + 최상위        ②  94  상품          ③ 128  마이·커뮤니티
④ 140  앱 화면                ⑤ 134  남은 컴포넌트   합 567
예외 32 = 카카오 7 · 구글로고 5 · 알림색 16 + 시험 4
```

**방식:** 값이 안 바뀌는 **치환**(다섯 묶음)을 먼저 끝내고, 값이 바뀌는 **통일**(15곳)을
맨 뒤에 따로 뺀다. 섞으면 화면이 이상할 때 치환 실수인지 통일 결과인지 구분이 안 된다.
치환이 정말 무변화인지는 사람 눈이 아니라 스크립트로 증명한다.

**기술:** Expo SDK 54 · React Native 0.81.5 · React 19.1.0 · 순수 `StyleSheet`
(NativeWind 없음) · ESLint(eslint-config-expo/flat) · Jest(jest-expo)

**설계 문서:** `docs/superpowers/specs/2026-08-07-app-color-tokens-design.md`

## 지켜야 할 것 (모든 과제에 적용)

- **저장소 루트에서 명령을 친다.** `cd mobile` 뒤에 루트 명령을 치면 실패한다.
  게이트는 `pnpm gate:mobile` 하나다(`tsc --noEmit` + `expo lint` + `jest`).
- **브랜치는 `refactor/786--app-color-tokens`.** develop·main 에 직접 커밋하지 않는다.
- **치환 과제(2~6)에서는 색 값을 단 하나도 바꾸지 않는다.** 값을 바꾸고 싶은 자리를
  발견하면 고치지 말고 과제 7 목록에 적어 둔다.
- **아래 네 곳은 손대지 않는다.** 사유는 설계 문서 3절에 있다.
  ```
  constants/colors.ts                       토큰 원본
  components/auth/social-login-buttons.tsx  카카오 #FEE500 · 구글 #747775 #1F1F1F
  components/auth/social-logos.tsx          구글 로고 SVG 네 색
  lib/notifications.ts (+ .test.ts)         NOTIFICATION_COLORS 로 이미 모여 있다
  ```
  따라서 **「색 리터럴 0」이 목표가 아니다** — 이 넷 밖에서 0이면 된다.
- **토큰 이름을 새로 짓지 않는다.** 과제 1의 `colors.ts` 에 있는 이름만 쓴다. 마땅한
  이름이 없으면 멈추고 물어본다.
- 색 값은 표기를 통일한다 — **대문자 6자리**(`#fff` → `#FFFFFF`).

---

### 과제 1: 토큰 파일과 검증 장치 만들기

이 과제가 끝나면 색 하나도 안 바뀐 채로 토큰 파일과 「무변화 증명 스크립트」가 생긴다.

**파일**
- 만들기: `mobile/constants/colors.ts`
- 만들기: `mobile/__tests__/colors.test.ts`
- 만들기: `<스크래치패드>/verify-color-swap.mjs` (저장소에 커밋하지 않는다 — 치환이
  끝나면 쓸모가 없다)

**주고받는 것**
- 내놓는 것: `import { colors } from '@/constants/colors'` — 평평한 객체 하나.
  뒤의 모든 과제가 이 이름들을 쓴다. 아래 목록이 전부이고, 여기 없는 이름은 없다.

- [ ] **1단계: 실패하는 시험을 쓴다**

`mobile/__tests__/colors.test.ts`:

```ts
import { colors } from '@/constants/colors';

describe('색 토큰', () => {
  // 웹 tokens.colors.css 와 같은 값이어야 하는 것들.
  // 웹을 고치면 여기가 깨져서 「양쪽이 어긋났다」를 알려준다.
  it('웹에서 가져온 값이 웹과 같다', () => {
    expect(colors.selected).toBe('#825500'); // 웹 --color-primary-container
    expect(colors.brandText).toBe('#633F00'); // 웹 --color-primary-700
    expect(colors.brandSurface).toBe('#FAF3E6'); // 웹 --color-primary-50
    expect(colors.danger).toBe('#C91D1D'); // 웹 --color-danger-500
    expect(colors.favorite).toBe('#FC8181'); // 웹 --color-heart-red
    expect(colors.badgeSell).toBe('#2563EB'); // 웹 --color-badge-sell-fg
    expect(colors.badgeRequest).toBe('#EA580C'); // 웹 --color-badge-request-fg
  });

  it('모든 값이 대문자 6자리 표기다', () => {
    // 표기가 섞이면(#fff / #FFFFFF) 같은 색인데 다른 색처럼 보인다.
    for (const value of Object.values(colors)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('한 색에 이름이 둘이지 않다', () => {
    // 같은 값에 이름이 둘이면 어느 쪽을 써야 할지 매번 헷갈린다.
    // 일부러 겹쳐 둔 짝만 예외로 둔다 — 뜻이 달라 따로 부르는 것이 맞다.
    const 겹쳐도_되는_값 = ['#111827', '#FFFFFF']; // onSurface=action, surface=onAction=onSelected
    const 본_값 = new Map<string, string>();
    for (const [name, value] of Object.entries(colors)) {
      if (겹쳐도_되는_값.includes(value)) continue;
      expect(본_값.get(value)).toBeUndefined();
      본_값.set(value, name);
    }
  });
});
```

- [ ] **2단계: 시험이 실패하는지 본다**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm --filter cuddle-market-mobile exec jest __tests__/colors.test.ts
```

기대: `Cannot find module '@/constants/colors'` 로 실패.

⚠️ 위 명령이 안 먹으면 `pnpm gate:mobile` 로 대신 확인한다(느리지만 확실하다).

- [ ] **3단계: `constants/colors.ts` 를 쓴다**

```ts
/**
 * 앱 색 토큰.
 *
 * 이름은 웹 `src/styles/tokens.colors.css` 의 체계를 따른다 —
 * 두 저장소를 오갈 때 말이 통하게 하려는 것이다.
 * `on-` 은 「이 바탕 위에 올라가는 색」이라는 뜻이다.
 *
 * ⚠️ 여기 밖에서 색을 직접 적지 않는다. eslint 가 막는다.
 *    19바퀴(#786)에 화면에 흩어진 599개를 걷어냈다.
 *
 * 어두운 모드는 아직 없다. 화면들이 흰 바탕을 못 박고 있어 토큰만 갈라도
 * 닿는 데가 없다. 나중에 붙일 때를 위해 평평한 객체 하나로 둔다.
 */
export const colors = {
  // ── 바탕
  surface: '#FFFFFF', // 화면·카드 바탕
  surfaceMuted: '#F9FAFB', // 한 단계 눈치채운 바탕
  surfaceSunken: '#F3F4F6', // 움패인 바탕 (입력칸·구역)
  surfaceCream: '#FAF8F3', // 크림 바탕 (프로필 수정)

  // ── 글자 (진한 것부터 다섯 단. Tailwind gray 900·700·600·500·400 자리다)
  onSurface: '#111827', // 본문·제목
  onSurfaceStrong: '#374151', // 진한 보조 글자
  onSurfaceMedium: '#4B5563', // 중간 글자
  onSurfaceMuted: '#6B7280', // 보조 글자
  onSurfaceSubtle: '#9CA3AF', // 안내글·비활성

  // ── 선
  outline: '#D1D5DB', // 칸 테두리
  outlineVariant: '#E5E7EB', // 구분선
  outlineBrand: '#D4C4B2', // 칩·툴바·검색칸 테두리 (웹 --color-outline-variant)

  // ── 단추·고른 것
  // 「끝내는 단추」와 「여럿 중 고른 것」은 뜻이 달라 색도 다르다.
  action: '#111827', // 로그인·가입·신고·확인대화·저장
  onAction: '#FFFFFF',
  selected: '#825500', // 필터 칩·탭·툴바·상태 칩 (웹 primary-600)
  onSelected: '#FFFFFF',

  // ── 알림 계열
  // #DC2626 이 아니다 — 웹이 「흰 바탕 4.5:1 borderline」이라며 뺀 값이라
  // 앱만 붙들고 있을 이유가 없다 (tokens.colors.css:110).
  danger: '#C91D1D',
  onDanger: '#FFFFFF',
  dangerSurface: '#FEE2E2',
  success: '#15803D', // 확인 통과 (웹 --color-success-500)
  warningSurface: '#FFF5E0', // 빈 목록 아이콘 바탕 (웹 --color-warning-container)

  // ── 그 밖
  favorite: '#FC8181', // 찜 하트 (웹 --color-heart-red)
  rating: '#FBBF24', // 별점
  black: '#000000', // 사진 뒷바탕·그림자

  // ── 브랜드
  brandSurface: '#FAF3E6', // 판매자 카드 바탕 (웹 primary-50)
  brandText: '#633F00', // 브랜드 글자 (웹 primary-700)
  badgeSell: '#2563EB',
  badgeSellBg: '#EFF6FF',
  badgeRequest: '#EA580C',
  badgeRequestBg: '#FFF7ED',

  // 브랜드 갈색 스케일. 웹 primary-* 와 단계 이름을 맞췄다.
  //
  // 넷 다 한 군데씩만 쓰이는데, 쓰이는 자리의 역할이 저마다 달라(사진 자리·댓글
  // 표시·빈 목록·알림 줄) 넷을 묶을 역할 이름이 없다. 억지로 지으면 그 한 줄
  // 전용 이름이 되어, 다음에 다른 화면이 같은 갈색을 쓸 때 또 지어야 한다.
  // 「값 이름은 이점이 없다」는 말은 역할이 하나뿐일 때 맞는 말이다.
  //
  // brand50 은 만들지 않았다 — brandSurface 와 값이 같아 한 색에 이름이 둘이 된다.
  brand100: '#F4E3BF', // 프로필 사진 자리 바탕
  brand200: '#ECC88E', // 댓글 작성자 표시 바탕
  brand300: '#E2A958', // 빈 목록 아이콘
  brand500: '#B06F15', // 알림 줄 바탕
} as const;
```

- [ ] **4단계: 시험이 지나는지 본다**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

기대: 전부 초록.

- [ ] **5단계: 무변화 증명 스크립트를 쓴다**

스크래치패드에 `verify-color-swap.mjs` 를 만든다. 하는 일은 이렇다.

```
치환 전 파일(git)   ──▶  색 값 목록  ┐
                                    ├─▶  같은가?
치환 후 파일        ──▶  colors.X 를 실제 값으로 되돌린 뒤  ──▶  색 값 목록  ┘
```

```js
// 쓰는 법 (mobile/ 안에서):
//   node <경로>/verify-color-swap.mjs <치환전-커밋> <파일…>
// 하는 일: 치환이 정말 「값은 그대로, 이름만」인지 증명한다.
//   타입체크도 lint 도 색이 틀린 걸 못 잡아서 이 장치가 필요하다.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [baseRef, ...files] = process.argv.slice(2);
if (!baseRef || files.length === 0) {
  console.error('쓰는 법: node verify-color-swap.mjs <치환전-커밋> <파일…>');
  process.exit(2);
}

// #FFF 처럼 3자리로 적힌 것을 6자리로 편다. 안 그러면 표기만 바꿔도 다르다고 나온다.
const norm = (h) =>
  (h.length === 4
    ? '#' + [...h.slice(1)].map((c) => c + c).join('')
    : h
  ).toUpperCase();

// 따옴표 안의 색만 센다 — 주석의 `#786` 같은 이슈 번호를 안 세려는 것이다.
const hexes = (src) =>
  [...src.matchAll(/['"](#[0-9a-fA-F]{3,8})['"]/g)].map((m) => norm(m[1])).sort();

// constants/colors.ts 에서 토큰 이름 → 값 표를 만든다
const token2hex = new Map();
for (const m of readFileSync('constants/colors.ts', 'utf8').matchAll(
  /(\w+):\s*['"](#[0-9a-fA-F]{3,8})['"]/g,
)) {
  token2hex.set(m[1], norm(m[2]));
}

let bad = 0;
for (const f of files) {
  const before = hexes(execSync(`git show ${baseRef}:mobile/${f}`, { encoding: 'utf8' }));

  let missing = false;
  const restored = readFileSync(f, 'utf8').replace(/colors\.(\w+)/g, (all, name) => {
    const hex = token2hex.get(name);
    if (!hex) {
      console.error(`  ✗ ${f}: colors.${name} 는 colors.ts 에 없다`);
      missing = true;
      return all;
    }
    return `'${hex}'`;
  });
  const after = hexes(restored);

  if (missing) { bad++; continue; }

  if (before.join(',') !== after.join(',')) {
    bad++;
    // 어느 색이 몇 개 늘고 줄었는지 보여준다
    const tally = (list) => list.reduce((m, h) => m.set(h, (m.get(h) ?? 0) + 1), new Map());
    const [b, a] = [tally(before), tally(after)];
    console.error(`  ✗ ${f}`);
    for (const h of new Set([...b.keys(), ...a.keys()])) {
      const [x, y] = [b.get(h) ?? 0, a.get(h) ?? 0];
      if (x !== y) console.error(`      ${h}  치환전 ${x}개 → 치환후 ${y}개`);
    }
  } else {
    console.log(`  ✓ ${f}  (${before.length}개 그대로)`);
  }
}

console.log(bad === 0 ? '\n전부 무변화 ✅' : `\n어긋난 파일 ${bad}개 ❌`);
process.exit(bad ? 1 : 0);
```

- [ ] **6단계: 스크립트가 진짜 잡는지 시험한다 (마커 확인)**

스크립트를 믿기 전에, **일부러 틀린 치환을 넣어 보고 잡는지** 본다. 안 잡으면 뒤의
다섯 묶음이 전부 헛수고가 된다.

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
# 아무 파일이나 하나 골라 색 하나를 일부러 다른 값으로 바꾼다
sed -i '' "s/'#6B7280'/'#123456'/" components/ui/field-label.tsx
node <스크래치패드>/verify-color-swap.mjs HEAD components/ui/field-label.tsx
```

기대: `✗ components/ui/field-label.tsx` 와 함께 `#6B7280 치환전 N개 → 치환후 N-1개`
같은 줄이 나오고 종료 코드가 1.

확인했으면 되돌린다.

```bash
git checkout components/ui/field-label.tsx
```

- [ ] **7단계: 커밋**

```bash
cd /Users/osejin/Desktop/cuddle-market
git add mobile/constants/colors.ts mobile/__tests__/colors.test.ts
git commit -m "feat(app): 색 토큰 파일을 만든다 (#786)

이름은 웹 tokens.colors.css 의 surface/on-surface/outline 체계를 따른다.
아직 아무 화면도 이걸 쓰지 않는다 — 치환은 다음 커밋부터."
```

---

### 과제 2: 치환 묶음 ① — 공용 UI + 최상위 (10파일 · 71회)

가장 여러 화면이 함께 쓰는 것부터 한다. 여기가 흔들리면 앱 전체가 흔들려서, 먼저
바꿔 두면 뒤 묶음에서 어긋난 게 빨리 드러난다.

**파일** (전부 고치기)
```
components/ui/field-label.tsx        components/ui/confirm-dialog.tsx
components/ui/toast-host.tsx         components/ui/bottom-sheet.tsx
components/ui/screen-header.tsx      components/ui/app-menu-overlay.tsx
components/ui/app-header.tsx         components/product-thumbnail.tsx
components/product-card.tsx          components/list-states.tsx
```

**주고받는 것**
- 쓰는 것: 과제 1의 `colors`
- 내놓는 것: 없음 (화면 코드일 뿐이다)

- [ ] **1단계: 치환 전 커밋을 적어 둔다**

```bash
cd /Users/osejin/Desktop/cuddle-market && git rev-parse --short HEAD
```

이 값을 아래에서 `<BASE>` 로 쓴다.

- [ ] **2단계: 파일마다 색을 토큰으로 바꾼다**

각 파일 맨 위에 `import { colors } from '@/constants/colors';` 를 더하고(다른 `@/`
import 들 사이 알파벳 순서에 맞춰 넣는다), 색 값을 이름으로 바꾼다.

어떤 이름을 고를지는 **그 색이 무슨 속성에 쓰였는지**로 정한다.

**이 표가 전부다.** 599곳 전체를 세어서 만든 것이라 여기 없는 색은 아래 「손대지 않는 것」
뿐이다.

```
[글자]
color: '#111827'            → colors.onSurface
color: '#374151'            → colors.onSurfaceStrong
color: '#4B5563'            → colors.onSurfaceMedium
color: '#6B7280'            → colors.onSurfaceMuted
color: '#9CA3AF'            → colors.onSurfaceSubtle
color: '#FFFFFF'            → 진한 바탕 위 글자다. 어느 바탕 위인지 보고 고른다
                              action 단추 위면 colors.onAction
                              selected 칩·탭 위면 colors.onSelected
                              danger 단추 위면 colors.onDanger
color: '#15803D'            → colors.success        (가입 확인 통과)
color: '#633F00'            → colors.brandText

[바탕]
backgroundColor: '#FFFFFF'  → colors.surface
backgroundColor: '#F9FAFB'  → colors.surfaceMuted
backgroundColor: '#F3F4F6'  → colors.surfaceSunken
backgroundColor: '#FAF8F3'  → colors.surfaceCream
backgroundColor: '#E5E7EB'  → colors.outlineVariant  (회색 바탕으로 쓰인 자리)
backgroundColor: '#111827'  → colors.action
backgroundColor: '#825500'  → colors.selected
backgroundColor: '#FEE2E2'  → colors.dangerSurface
backgroundColor: '#FFF5E0'  → colors.warningSurface
backgroundColor: '#FAF3E6'  → colors.brandSurface
backgroundColor: '#F4E3BF'  → colors.brand100
backgroundColor: '#ECC88E'  → colors.brand200
backgroundColor: '#B06F15'  → colors.brand500

[선]
borderColor: '#D1D5DB'                       → colors.outline
borderColor: '#D4C4B2'                       → colors.outlineBrand
borderBottomColor/borderTopColor: '#E5E7EB'  → colors.outlineVariant

[그 밖]
'#C91D1D'   → colors.danger
'#FC8181'   → colors.favorite
'#FBBF24'   → colors.rating        (별점. STAR_COLOR 상수도 없앤다)
'#E2A958'   → colors.brand300      (빈 목록 아이콘)
'#000000' / '#000'   → colors.black
'#FFF'               → colors.surface
'#2563EB' / '#EFF6FF' → colors.badgeSell / colors.badgeSellBg
'#EA580C' / '#FFF7ED' → colors.badgeRequest / colors.badgeRequestBg
```

⚠️ **`#DC2626` 은 아직 바꾸지 않는다.** 값이 달라지는 일이라 과제 7에서 한다. 이 묶음에서
만나면 그대로 두고 과제 7 목록에 파일:줄 을 적어 둔다.

⚠️ **표에 없는 색을 만나면 멈추고 물어본다.** 임의로 이름을 짓지 않는다.

**손대지 않는 것 — lint 예외 넷**

```
constants/colors.ts                       토큰 원본
components/auth/social-login-buttons.tsx  카카오 #FEE500 · 구글 #747775 #1F1F1F
components/auth/social-logos.tsx          구글 로고 SVG #4285F4 #34A853 #FBBC05 #EA4335
lib/notifications.ts (+ .test.ts)         알림 종류별 색 짝 6쌍
```

`lib/notifications.ts` 를 남기는 이유는 **이미 `NOTIFICATION_COLORS` 로 한곳에 모여
있고 이름도 뜻이 드러나기 때문이다**(`CHAT_NEW_ROOM` · `COMMENT_REPLY` …). 이슈가 말한
「화면마다 흩어짐」 문제가 없다. 옮기면 그 파일 밖에서는 안 쓰이는 토큰 12개만 는다.

- [ ] **3단계: 무변화를 증명한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
node <스크래치패드>/verify-color-swap.mjs <BASE> \
  components/ui/field-label.tsx components/ui/confirm-dialog.tsx \
  components/ui/toast-host.tsx components/ui/bottom-sheet.tsx \
  components/ui/screen-header.tsx components/ui/app-menu-overlay.tsx \
  components/ui/app-header.tsx components/product-thumbnail.tsx \
  components/product-card.tsx components/list-states.tsx
```

기대: `전부 무변화 ✅`

⚠️ `#DC2626` 을 남겨 뒀으므로 그 파일도 무변화로 나와야 맞다(안 건드렸으니).

- [ ] **4단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

기대: 전부 초록.

- [ ] **5단계: 커밋**

```bash
git add mobile/components/ui mobile/components/product-thumbnail.tsx \
        mobile/components/product-card.tsx mobile/components/list-states.tsx
git commit -m "refactor(app): 공용 UI 색을 토큰으로 (#786)

값은 그대로, 이름만 바꿨다. 화면은 안 바뀐다 —
verify-color-swap 으로 71개 값이 그대로임을 확인했다."
```

---

### 과제 3: 치환 묶음 ② — 상품 (11파일 · 94회)

**파일**
```
components/products/image-field.tsx          components/products/search-bar-header.tsx
components/products/product-list-toolbar.tsx components/products/picker-field.tsx
components/products/product-form.tsx         components/products/chip-field.tsx
components/products/region-field.tsx         components/products/product-filter-row.tsx
components/products/detail-filter-sheet.tsx
components/products/product-pet-type-tabs.test.tsx
components/products/product-filter-row.test.tsx
```

⚠️ **시험 파일 둘도 대상이다.** 시험이 색 값을 못 박고 있으면 토큰을 고칠 때마다 시험이
깨진다. 시험도 `colors.X` 를 보게 바꾼다.

- [ ] **1단계: 치환 전 커밋을 적어 둔다**

```bash
cd /Users/osejin/Desktop/cuddle-market && git rev-parse --short HEAD
```

- [ ] **2단계: 과제 2의 2단계와 같은 표대로 바꾼다**

표는 과제 2에 있다. 여기서도 `#DC2626` 은 남긴다.

⚠️ **`chip-field.tsx:75` 는 이 묶음에서 특히 조심한다.**

```ts
chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
```

값이 `#111827` 이니 표대로면 `colors.action` 이다. **지금은 그렇게 둔다.** 「칩인데 왜
action 이지?」가 눈에 걸리는 게 맞고, 그 어긋남을 과제 7에서 고친다. 여기서 미리
`colors.selected` 로 바꾸면 값이 달라져 3단계 증명이 실패한다.

- [ ] **3단계: 무변화를 증명한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
node <스크래치패드>/verify-color-swap.mjs <BASE> \
  components/products/image-field.tsx components/products/search-bar-header.tsx \
  components/products/product-list-toolbar.tsx components/products/picker-field.tsx \
  components/products/product-form.tsx components/products/chip-field.tsx \
  components/products/region-field.tsx components/products/product-filter-row.tsx \
  components/products/detail-filter-sheet.tsx \
  components/products/product-pet-type-tabs.test.tsx \
  components/products/product-filter-row.test.tsx
```

기대: `전부 무변화 ✅`

- [ ] **4단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

기대: 전부 초록. 시험 파일을 고쳤으니 jest 가 특히 중요하다.

- [ ] **5단계: 커밋**

```bash
git add mobile/components/products
git commit -m "refactor(app): 상품 화면 색을 토큰으로 (#786)

값은 그대로, 이름만. 94개 값이 그대로임을 확인했다.
시험 파일 둘도 색 값 대신 토큰을 보게 바꿨다."
```

---

### 과제 4: 치환 묶음 ③ — 마이 + 커뮤니티 (17파일 · 128회)

**파일**
```
components/my/status-filter-chips.tsx    components/my/my-list-empty.tsx
components/my/section-card.tsx           components/my/logout-modal.tsx
components/my/delete-confirm-modal.tsx   components/my/profile-image-field.tsx
components/my/product-action-sheet.tsx   components/my/withdraw-modal.tsx
components/my/my-product-list.tsx
components/community/post-body.tsx       components/community/comment-row.tsx
components/community/post-card.tsx       components/community/comment-list.tsx
components/community/community-sort-row.tsx
components/community/comment-input.tsx   components/community/post-search-input.tsx
components/community/comment-input.test.tsx
```

⚠️ `components/my/section-card.tsx:16` 에 `const DANGER = '#DC2626';` 라는 **자기만의
토큰**이 이미 있다. 이것도 과제 7 대상이다 — 이 묶음에서는 그대로 둔다.

- [ ] **1단계: 치환 전 커밋을 적어 둔다**

```bash
cd /Users/osejin/Desktop/cuddle-market && git rev-parse --short HEAD
```

- [ ] **2단계: 과제 2의 표대로 바꾼다**

- [ ] **3단계: 무변화를 증명한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
node <스크래치패드>/verify-color-swap.mjs <BASE> \
  $(git diff --name-only <BASE> -- 'components/my/*' 'components/community/*' | sed 's|^mobile/||')
```

기대: `전부 무변화 ✅`

- [ ] **4단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

- [ ] **5단계: 커밋**

```bash
git add mobile/components/my mobile/components/community
git commit -m "refactor(app): 마이·커뮤니티 색을 토큰으로 (#786)

값은 그대로, 이름만. 128개 값이 그대로임을 확인했다."
```

---

### 과제 5: 치환 묶음 ④ — 앱 화면 (22파일 · 140회)

**파일**
```
app/login.tsx                    app/email-login.tsx
app/signup.tsx                   app/social-signup.tsx
app/oauth.tsx                    app/find-password.tsx
app/profile-edit.tsx             app/search.tsx
app/search-result.tsx            app/notifications.tsx
app/report.tsx                   app/comment-thread.tsx
app/products/new.tsx             app/products/[id]/edit.tsx
app/(tabs)/(home)/index.tsx      app/(tabs)/(home)/products/[id].tsx
app/(tabs)/(home)/users/[id].tsx app/(tabs)/(my)/index.tsx
app/(tabs)/(my)/blocked-users.tsx
app/(tabs)/(community)/index.tsx app/(tabs)/(community)/posts/[id].tsx
app/(tabs)/(place)/places/[id].tsx
```

⚠️ **`app/` 안에 시험 파일을 만들지 않는다.** expo-router 는 `app/` 의 모든 파일을 화면으로
보기 때문에 시험 파일을 넣으면 **실기기가 아예 안 뜬다**. 타입체크도 lint 도 안 잡아준다.

⚠️ `app/profile-edit.tsx:469` 의 `backgroundColor: '#825500'` 은 저장 단추다. 표대로면
`colors.selected` 지만 **뜻으로는 「끝내는 단추」**다. 여기서는 값을 지켜 `colors.selected`
로 두고 과제 7 목록에 적는다.

- [ ] **1단계: 치환 전 커밋을 적어 둔다**

```bash
cd /Users/osejin/Desktop/cuddle-market && git rev-parse --short HEAD
```

- [ ] **2단계: 과제 2의 표대로 바꾼다**

- [ ] **3단계: 무변화를 증명한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
node <스크래치패드>/verify-color-swap.mjs <BASE> \
  $(git diff --name-only <BASE> -- 'app/*' | sed 's|^mobile/||')
```

기대: `전부 무변화 ✅`

- [ ] **4단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

- [ ] **5단계: 커밋**

```bash
git add mobile/app
git commit -m "refactor(app): 앱 화면 색을 토큰으로 (#786)

값은 그대로, 이름만. 140개 값이 그대로임을 확인했다."
```

---

### 과제 6: 치환 묶음 ⑤ — 남은 컴포넌트 + constants (22파일 · 134회)

**파일**
```
components/auth/login-form.tsx
components/signup/field.tsx               components/signup/birth-date-field.tsx
components/signup/email-verification.tsx
components/places/map-fallback.tsx        components/places/place-map.tsx
components/places/place-list-item.tsx     components/places/search-in-map-button.tsx
components/places/place-sheet.tsx         components/places/category-tabs.tsx
components/product-detail/breadcrumb.tsx  components/product-detail/detail-header.tsx
components/product-detail/favorite-button.tsx
components/product-detail/detail-states.tsx
components/product-detail/image-carousel.tsx
components/product-detail/seller-card.tsx
components/product-detail/product-summary.tsx
components/user-profile/profile-head.tsx
components/notifications/notification-row.tsx
components/notifications/notification-skeleton.tsx
components/find-password/step-indicator.tsx
constants/theme.ts
```

⚠️ **아래 셋은 목록에 없다. 손대지 않는다.**

```
components/auth/social-login-buttons.tsx  카카오·구글이 정한 색
components/auth/social-logos.tsx          구글 로고 SVG 네 색
lib/notifications.ts (+ .test.ts)         이미 NOTIFICATION_COLORS 로 모여 있다
```

⚠️ **`constants/theme.ts` 는 값만 토큰으로 바꾼다.** 안 쓰이는 팔레트를 지우는 것은
과제 8이다. 여기서 지우면 무변화 증명이 실패한다.

- [ ] **1단계: 치환 전 커밋을 적어 둔다**

```bash
cd /Users/osejin/Desktop/cuddle-market && git rev-parse --short HEAD
```

- [ ] **2단계: 과제 2의 표대로 바꾼다**

`components/product-detail/seller-card.tsx` 의 `#FAF3E6` 은 `colors.brandSurface`,
`#633F00` 은 `colors.brandText` 다. 판매·판매요청 알약은 `colors.badgeSell` /
`colors.badgeSellBg` / `colors.badgeRequest` / `colors.badgeRequestBg` 를 쓴다.

- [ ] **3단계: 무변화를 증명한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
node <스크래치패드>/verify-color-swap.mjs <BASE> \
  $(git diff --name-only <BASE> | sed 's|^mobile/||')
```

기대: `전부 무변화 ✅`

- [ ] **4단계: 남은 색 리터럴을 센다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
grep -rnE "['\"]#[0-9a-fA-F]{3,8}['\"]" --include="*.ts" --include="*.tsx" \
  app components constants hooks lib \
  | grep -vE "constants/colors.ts|social-login-buttons|social-logos|lib/notifications"
```

기대: 남는 것은 **`#DC2626` 을 쓰는 자리들뿐이다**(과제 7에서 처리).
`components/my/section-card.tsx:16` 의 `const DANGER = '#DC2626';` 도 여기 포함된다.

다른 게 남아 있으면 빠뜨린 것이니 지금 마저 바꾼다.

- [ ] **5단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

- [ ] **6단계: 커밋**

```bash
git add mobile/components mobile/constants/theme.ts
git commit -m "refactor(app): 남은 컴포넌트 색을 토큰으로 (#786)

값은 그대로, 이름만. 값이 그대로임을 확인했다.

셋은 일부러 남겼다.
- social-login-buttons · social-logos: 카카오·구글이 정한 색
- lib/notifications.ts: NOTIFICATION_COLORS 로 이미 한곳에 모여 있다"
```

---

### 과제 7: 값 통일 — 여기서만 화면이 바뀐다 ⚠️

앞의 다섯 과제는 화면이 1픽셀도 안 바뀌었다. **이 과제부터는 실제로 달라진다.**

**파일**
- 고치기: `mobile/components/products/chip-field.tsx:75`
- 고치기: `mobile/app/profile-edit.tsx:469`
- 고치기: `#DC2626` 을 쓰는 모든 파일 (과제 2~6에서 적어 둔 목록)
- 고치기: `mobile/components/my/section-card.tsx:16`

- [ ] **1단계: 고칠 자리를 다시 센다**

과제 2~6을 지나면 어긋난 자리가 이름으로 드러나 있다. 목록이 맞는지 확인한다.

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
echo "=== 칩인데 action 을 쓰는 곳 ==="
grep -rn "chipActive\|colors.action" --include="*.tsx" components/products
echo "=== 남은 #DC2626 ==="
grep -rn "'#DC2626'" --include="*.ts" --include="*.tsx" app components lib
```

기대: 설계 문서가 적어 둔 15곳(칩 2 · 저장 1 · 위험색 12)과 맞는지 본다. **다르면
숫자를 고쳐 적고 그대로 간다** — 설계는 조사 시점의 값일 뿐이다.

- [ ] **2단계: 고른 칩을 갈색으로**

`components/products/chip-field.tsx:75`:

```ts
// 전
chipActive: { backgroundColor: colors.action, borderColor: colors.action },
// 후
chipActive: { backgroundColor: colors.selected, borderColor: colors.selected },
```

같은 파일에서 고른 칩의 **글자**가 `colors.onAction` 이면 `colors.onSelected` 로 함께
바꾼다(값은 둘 다 `#FFFFFF` 라 화면은 그대로지만 뜻을 맞춘다).

- [ ] **3단계: 프로필 수정 저장 단추를 먹색으로**

`app/profile-edit.tsx:469`:

```ts
// 전
primaryButton: { …, backgroundColor: colors.selected },
// 후
primaryButton: { …, backgroundColor: colors.action },
```

`primaryLabel` 의 색도 `colors.onSelected` → `colors.onAction` 으로 맞춘다.

- [ ] **4단계: 위험색을 하나로**

남은 `'#DC2626'` 을 전부 `colors.danger`(`#C91D1D`)로 바꾼다.
`components/my/section-card.tsx:16` 의 `const DANGER = '#DC2626';` 은 **줄째 지우고**
쓰던 자리를 `colors.danger` 로 바꾼다.

- [ ] **5단계: 리터럴이 정말 다 없어졌는지 센다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
grep -rnE "['\"]#[0-9a-fA-F]{3,8}['\"]" --include="*.ts" --include="*.tsx" \
  app components constants hooks lib \
  | grep -vE "constants/colors.ts|social-login-buttons|social-logos|lib/notifications"
```

기대: **아무것도 안 나온다.**

⚠️ 「리터럴 0」이 아니라 **「예외 넷 밖에서 0」**이다. 예외 안에는 색이 그대로 남아 있고,
그건 일부러 남긴 것이다.

- [ ] **6단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

- [ ] **7단계: 실기기로 눈 확인 ⚠️**

⚠️ **게이트는 색이 틀린 걸 못 잡는다.** `colors.onSurface` 자리에 `colors.onSurfaceMuted`
를 써도 타입도 lint 도 초록이다. 여기는 사람이 봐야 한다.

⚠️ **코드가 맞는데 폰이 옛 화면일 수 있다.** 코드를 뒤지기 전에 폰에서 흔들기 → Reload
부터 한다.

사용자에게 이 순서로 봐 달라고 요청한다.

```
1  상품 목록 → 필터 칩을 고른다        고른 칩이 갈색인가 (먹색이면 안 된다)
2  마이 → 프로필 수정 → 저장 단추       먹색인가 (갈색이면 안 된다)
3  가입 화면에서 일부러 틀리게 입력      오류 글자가 붉은가, 너무 흐리지 않은가
4  마이 → 탈퇴 화면                   붉은 단추가 제대로 보이는가
5  홈 · 상품 상세 · 커뮤니티 · 플레이스   글자·선 색이 전과 같아 보이는가
```

- [ ] **8단계: 커밋**

```bash
git add mobile
git commit -m "refactor(app): 어긋난 색 셋을 뜻에 맞게 모은다 (#786)

여기서만 화면이 바뀐다.

- 고른 칩: 먹색 → 갈색 (여럿 중 고른 것이므로 selected)
- 프로필 수정 저장: 갈색 → 먹색 (끝내는 단추이므로 action)
- 위험색: #DC2626 → #C91D1D
  웹이 「흰 바탕 4.5:1 borderline」이라며 뺀 값을 앱만 쓰고 있었다

앱 화면의 색 리터럴 567개가 0개가 됐다.
남은 32개(카카오·구글 색, 알림 색 짝)는 일부러 남긴 것이다 — 사유는 설계 문서 3절"
```

---

### 과제 8: 잔재 정리 + 다시 안 새게 잠그기

**파일**
- 고치기: `mobile/constants/theme.ts`
- 고치기: `mobile/eslint.config.js`

- [ ] **1단계: `theme.ts` 에서 안 쓰이는 팔레트를 지운다**

먼저 정말 안 쓰이는지 확인한다.

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
grep -rn "Colors\[" --include="*.tsx" --include="*.ts" app components hooks
```

기대: `app/(tabs)/_layout.tsx:46` 한 줄뿐이고 `.tint` 만 읽는다.

그러면 `Colors` 를 탭바가 쓰는 것만 남긴다.

```ts
import { colors } from '@/constants/colors'; // 과제 6에서 이미 들어와 있을 것이다

// 탭바에서 고른 탭의 색. 웹 하단 탭바와 같은 값이다.
//
// #0a7ea4(Expo 템플릿 기본 파랑)는 걷어냈다 — 우리 색이 아니었다.
// 웹이 쓰던 #ecc88e도 안 쓴다: 흰 바탕 대비가 1.59:1이라 비활성 회색(2.54:1)보다
// 더 흐려서, 고른 탭이 가장 안 보였다. 그 값은 바탕으로 쓰라고 만든 색이다.
//
// 어두운 모드 팔레트는 지웠다(#786) — 아무 데서도 안 읽었고, 화면들이 흰 바탕을
// 못 박고 있어 있으나 마나였다. 어두운 모드를 할 때 colors.ts 에서 새로 만든다.
export const Colors = {
  light: { tint: colors.selected },
  dark: { tint: colors.surface },
};
```

⚠️ `app/(tabs)/_layout.tsx:46` 이 `Colors[colorScheme ?? 'light'].tint` 로 읽으므로
`light`·`dark` 두 열쇠는 남겨야 한다. 지우면 앱이 죽는다.

- [ ] **2단계: 게이트로 안 깨졌는지 본다**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

- [ ] **3단계: lint 규칙을 더한다**

`mobile/eslint.config.js`:

```js
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // 색은 constants/colors.ts 에만 적는다.
    // 화면에 직접 적으면 같은 색이 화면마다 조금씩 달라진다 —
    // 19바퀴(#786)에 그렇게 흩어진 599개를 걷어냈다.
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}', 'constants/**/*.{ts,tsx}'],
    ignores: [
      'constants/colors.ts', // 토큰 원본
      'components/auth/social-login-buttons.tsx', // 카카오가 정한 색
      'components/auth/social-logos.tsx', // 구글 로고 SVG 네 색
      'lib/notifications.ts', // NOTIFICATION_COLORS 로 이미 한곳에 모여 있다
      'lib/notifications.test.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: '색 리터럴 금지 — @/constants/colors 의 토큰을 쓸 것',
        },
      ],
    },
  },
]);
```

- [ ] **4단계: 규칙이 진짜 잡는지 시험한다 (마커 확인)**

규칙을 믿기 전에 **일부러 색을 적어 보고 잡는지** 본다.

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
printf "\nconst 임시 = '#123456';\n" >> components/list-states.tsx
npx expo lint components/list-states.tsx
```

기대: `색 리터럴 금지 — @/constants/colors 의 토큰을 쓸 것` 이 나온다.

⚠️ **안 나오면 selector 문법이 안 먹은 것이다.** 그때는 `Literal[value=/…/]` 대신
`eslint-plugin-no-restricted-syntax` 없이 되는지 확인하거나, 정규식 대신
`selector: "Literal[raw=/^['\"]#/]"` 를 시도한다. 규칙이 안 먹으면 잠금이 없는 것이니
**동작을 확인하기 전에는 초록이라고 보고하지 않는다.**

확인했으면 되돌린다.

```bash
git checkout components/list-states.tsx
```

- [ ] **5단계: 예외 파일이 정말 통과하는지 본다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
npx expo lint constants/colors.ts components/auth/social-login-buttons.tsx \
              components/auth/social-logos.tsx lib/notifications.ts
```

기대: 오류 없음. 네 파일 모두 색이 그대로 들어 있는데도 통과해야 맞다.

- [ ] **6단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

기대: 전부 초록. **`expo lint` 가 여기서 새 규칙과 함께 돈다.**

- [ ] **7단계: 커밋**

```bash
git add mobile/constants/theme.ts mobile/eslint.config.js
git commit -m "chore(app): 색 리터럴을 lint 로 잠근다 (#786)

토큰을 만들어도 다음 바퀴에 '#6B7280' 을 또 적으면 원래대로 돌아간다.
일부러 색을 적어 보고 규칙이 잡는 것까지 확인했다.

theme.ts 의 안 쓰이는 어두운 모드 팔레트도 지웠다 —
아무 데서도 안 읽었고 화면들이 흰 바탕을 못 박고 있어 있으나 마나였다."
```

---

### 과제 9: 마무리

- [ ] **1단계: 이슈 본문의 낡은 곳을 바로잡는다**

이슈 #786 에 댓글을 단다. 본문의 실측치(138회·19파일)가 낡았다는 것과 `#0a7ea4` 는
이미 정리돼 있었다는 것을 적는다.

- [ ] **2단계: 남긴 것을 이슈에 남긴다**

이번에 안 한 둘을 이슈에 분명히 적는다.

```
지도 마커 색·이미지     #786 「추가(2026-08-06)」 항목 — 다음 차례
웹 입력칸 경계 색       #786 「함께 정할 것」 항목 — 그다음
                       토큰이 생겼으므로 값이 정해지면 colors.outline 한 줄만 고치면 된다
```

- [ ] **3단계: PR 을 만든다**

base 는 **`develop`** 이다(`main` 이 아니다). 본문은 저장소 템플릿
(`.github/PULL_REQUEST_TEMPLATE.md`)을 따르고 `Close #786` 을 넣지 **않는다** —
지도 마커와 웹 입력칸이 아직 남아 있어 이슈를 닫으면 안 된다.

```bash
cd /Users/osejin/Desktop/cuddle-market
git push -u origin refactor/786--app-color-tokens
gh pr create --base develop --title "refactor(app): 색 토큰 체계를 들인다 (#786)"
```

⚠️ **커밋·푸시·PR 은 사용자가 요청할 때만 한다.** 여기까지 왔으면 물어본다.

---

## 위험한 곳 모음

| 곳 | 왜 위험한가 | 어떻게 |
|---|---|---|
| 게이트가 색을 못 잡는다 | `onSurface` 자리에 `onSurfaceMuted` 를 써도 초록이다 | 묶음마다 `verify-color-swap.mjs` 로 값 보존을 증명한다. 스크립트 자체도 일부러 틀린 값을 넣어 잡는지 먼저 본다 |
| `app/` 안에 시험 파일 | expo-router 가 화면으로 보려다 **실기기가 안 뜬다.** 타입체크도 lint 도 안 잡는다 | 시험은 `mobile/__tests__/` 에 두고 `@/app/...` 로 부른다 |
| 폰이 옛 화면을 보여준다 | Metro 를 다시 띄워도 Expo Go 는 저절로 안 붙는다 | 코드를 뒤지기 전에 흔들기 → Reload |
| `theme.ts` 의 `light`/`dark` 열쇠 | `_layout.tsx:46` 이 `Colors[colorScheme ?? 'light']` 로 읽는다 | 값은 줄여도 두 열쇠는 남긴다 |
| lint 규칙이 안 먹을 수 있다 | `Literal[value=/…/]` selector 가 안 통할 가능성 | 일부러 색을 적어 보고 잡는지 확인하기 전에는 「됐다」고 하지 않는다 |
| 치환 중 값을 고치고 싶어진다 | 과제 2~6에서 값을 바꾸면 무변화 증명이 깨진다 | 고치지 말고 과제 7 목록에 적는다 |
