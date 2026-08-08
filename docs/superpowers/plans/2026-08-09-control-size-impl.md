# 단추·입력칸 높이·색 계획 (#847)

> **에이전트에게:** 이 계획은 superpowers:subagent-driven-development 또는
> superpowers:executing-plans 로 한 과제씩 실행한다. 단계는 체크박스(`- [ ]`)로 따라간다.

**목표:** 웹·앱 공용 조각의 단추·입력칸 높이를 한 방식으로 모으고, #786 에서 넘어온
색 둘(입력칸 테두리·주 단추)을 함께 정한다.

**방식:** 웹은 **공용 조각 셋**만 고치면 나머지가 따라온다. 그 뒤 화면마다 손으로 덮어쓴
임시 조치를 걷어낸다. 앱은 두 곳(52·44)을 48로 옮긴다.

**기술:** Next.js · Tailwind v4 · `cn`(tailwind-merge) · Expo SDK 54 · 순수 StyleSheet

**설계 문서:** `docs/superpowers/specs/2026-08-09-control-size-design.md`

## 지켜야 할 것 (모든 과제에 적용)

- **게이트는 둘이다.** 저장소 루트에서 친다.
  ```bash
  pnpm gate         웹 — tsc + lint + vitest + next build
  pnpm gate:mobile  앱 — tsc + expo lint + jest
  ```
  ⚠️ `cd mobile` 뒤에 루트 명령을 치면 실패한다.
- **브랜치는 `refactor/847--web-button-input-size`.** develop·main 에 직접 커밋하지 않는다.
- **높이 클래스는 숫자값을 쓴다** — `h-12` (48). 이 저장소는 `--spacing-md` 같은 이름
  토큰을 따로 두고 있어 `h-md` 류를 쓰면 엉뚱한 값으로 풀린다
  (`max-w-3xl` 이 48px 이 됐던 함정과 같은 것).
- **반응형 방향을 뒤집지 말 것.** Tailwind 는 모바일 우선이라 접두사 없는 값이 모바일이고
  `md:` 가 데스크탑이다. **모바일이 크고 `md:` 에서 작아지는** 것이 이 이슈의 방향이다.
- **게이트는 높이가 틀린 걸 못 잡는다.** `h-11` 과 `h-12` 를 타입체크도 lint 도 구분
  못 한다. 개발자도구로 재고 눈으로 봐야 한다.

---

### 과제 1: 웹 Button 의 크기 단계

**파일**
- 고치기: `src/components/commons/button/buttonClass.ts:14-19`

**주고받는 것**
- 내놓는 것: `size` 변형 셋(`sm`·`md`·`lg`). `xs` 는 없앤다 — 뒤 과제가 이 이름을 쓴다.

- [ ] **1단계: `xs` 를 쓰는 곳을 찾는다**

```bash
cd /Users/osejin/Desktop/cuddle-market
grep -rn 'size="xs"' --include="*.tsx" src
```

기대: 한 곳뿐이다. **`sm` 으로 바꾼다** — 지금도 값이 같아서 화면은 안 바뀐다.
두 곳 이상이면 다 바꾸고 개수를 적어 둔다.

- [ ] **2단계: 타입에서 `xs` 를 뺀다**

`src/components/commons/button/buttonClass.ts` 의 `size` 블록을 이렇게 바꾼다.

```ts
    size: {
      // 높이는 h-* 로 못 박는다. padding + 줄높이로 정하면 글자 크기를 바꿀 때마다
      // 높이가 따라 흔들려, 나란히 놓인 칸과 단추의 줄이 안 맞는다(#847).
      //
      // 모바일이 크고 데스크탑에서 작아진다 — 손가락은 44~48 이 필요하고(Apple HIG 44pt ·
      // Material 48dp) 마우스 커서는 정확해서 작아도 된다.
      sm: 'h-10 px-3 text-sm md:h-9',
      md: 'h-12 px-4 text-base md:h-10',
      lg: 'h-14 px-6 text-base md:h-12',
    },
```

⚠️ **`xs` 를 지운다.** `sm` 과 값이 똑같아 단계가 넷인 척만 하고 있었다.

- [ ] **3단계: `iconPosition: 'only'` 의 크기도 맞춘다**

같은 파일의 `compoundVariants` 가 아이콘 전용 단추의 크기를 정한다. `xs` 항목을 지우고
나머지를 새 높이에 맞춘다.

```ts
  compoundVariants: [
    {
      size: 'sm',
      iconPosition: 'only',
      className: 'h-10 w-10 p-0 md:h-9 md:w-9',
    },
    {
      size: 'md',
      iconPosition: 'only',
      className: 'h-12 w-12 p-0 md:h-10 md:w-10',
    },
    {
      size: 'lg',
      iconPosition: 'only',
      className: 'h-14 w-14 p-0 md:h-12 md:w-12',
    },
  ],
```

- [ ] **4단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate
```

기대: 종료코드 0. **`xs` 를 쓰는 곳이 남아 있으면 타입 오류로 잡힌다** — 그게 이 단계의
쓸모다.

- [ ] **5단계: 브라우저로 방향을 확인한다 ⚠️**

```
localhost:3000 → 개발자도구(F12) → 폰 모드(⇧⌘M)

  로그인 화면의 「로그인」 단추를 클릭 → Computed 탭에서 height 를 본다
    폰 모드       48 이어야 한다
    폰 모드 끔     40 이어야 한다

⚠️ 반대로 나오면 md: 방향이 뒤집힌 것이다. 클래스를 다시 본다.
```

- [ ] **6단계: 커밋**

```bash
git add src/components/commons/button/buttonClass.ts
git commit -m "refactor(web): Button 높이를 h-* 로 못 박는다 (#847)

sm 40/36 · md 48/40 · lg 56/48 (모바일/데스크탑).
padding + 줄높이로 정하던 것을 h-* 고정으로 바꾼다 — 글자 크기를 바꿔도
줄이 안 흔들린다.

xs 를 없앴다. sm 과 값이 똑같아 단계가 넷인 척만 하고 있었다."
```

---

### 과제 2: 웹 입력칸의 높이

**파일**
- 고치기: `src/components/commons/Input.tsx:59`
- 고치기: `src/components/commons/InputWithButton.tsx:58` · `:66`

**주고받는 것**
- 쓰는 것: 과제 1의 `Button` 크기 단계
- 내놓는 것: 입력칸이 `md` 단추와 같은 높이(모바일 48 · 데스크탑 40)가 된다

- [ ] **1단계: `Input` 의 높이를 칸 상자로 옮긴다**

지금은 `<input>` 자체에 `py-*` 를 줘서 높이가 정해진다. **바깥 상자에 `h-*` 를 주고
`<input>` 은 그 안을 채우게** 바꾼다.

`src/components/commons/Input.tsx` 의 바깥 상자(38행 근처)에 높이를 더한다.

```tsx
      className={cn(
        // h-12 md:h-10 — 단추 md 와 같은 값이다. 나란히 놓았을 때 줄이 맞아야 한다(#847).
        'relative flex h-12 w-full items-center overflow-hidden rounded-lg transition-colors md:h-10',
        border && 'focus-within:border-primary-500 border',
        border && borderColor,
```

⚠️ **원래 있던 `h-full` 을 지운다.** 부모 높이를 따라가던 것을 스스로 정하게 바꾸는 것이다.

- [ ] **2단계: `<input>` 의 `py-*` 를 없앤다**

같은 파일 59행.

```tsx
          // 높이는 바깥 상자가 정한다. 여기서 py-* 를 주면 두 곳이 높이를 다투게 된다.
          'h-full w-full placeholder:text-gray-400 focus:border-transparent focus:outline-none',
```

- [ ] **3단계: `InputWithButton` 의 두 자리를 고친다**

`src/components/commons/InputWithButton.tsx:58` — 입력칸에 주던 `py-*` 를 없앤다.

```tsx
        inputClass={cn(inputClass)}
```

같은 파일 66행 — 옆 단추의 높이를 입력칸과 같게 한다.

```tsx
          'bg-primary-100 text-primary hover:bg-primary-200 cursor-pointer font-semibold shrink-0 h-12 md:h-10 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100 disabled:pointer-events-none',
```

⚠️ 전에는 `h-10 md:h-11` 이라 **입력칸(42)과 2px 이 어긋났다.** 이슈 본문이 「제일 눈에
띈다」고 적은 그 자리다.

- [ ] **4단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate
```

- [ ] **5단계: 브라우저로 나란한 줄을 확인한다 ⚠️**

```
localhost:3000/signup → 개발자도구 폰 모드

  이메일 칸과 그 옆 「인증코드 전송」 단추
    → 둘의 height 가 같은가?  (전에는 42 대 44)
    → 위아래 끝이 맞는가?

  폰 모드를 끄고 데스크탑에서도 같은지 본다
```

- [ ] **6단계: 커밋**

```bash
git add src/components/commons/Input.tsx src/components/commons/InputWithButton.tsx
git commit -m "refactor(web): 입력칸 높이를 칸 상자가 정하게 한다 (#847)

py-* 로 정하던 것을 바깥 상자의 h-12 md:h-10 으로 옮긴다.
단추 md 와 같은 값이라 나란히 놓으면 줄이 맞는다.

InputWithButton 의 옆 단추도 같은 값으로. 전에는 h-10 md:h-11 이라
입력칸(42)과 2px 이 어긋났다 — 이슈가 「제일 눈에 띈다」고 적은 자리다."
```

---

### 과제 3: 화면마다 덮어쓴 임시 조치를 걷어낸다

**파일**
- 고치기: `src/features/login/components/LoginForm.tsx`
- 고치기: `src/features/login/components/SocialLoginButtons.tsx`
- 고치기: `src/features/find-password/components/FindPasswordForm.tsx`

공용 조각이 의도대로 바뀌었으니 손으로 덮어쓴 것이 필요 없어졌다.

- [ ] **1단계: 걷어낼 자리를 모두 찾는다**

```bash
cd /Users/osejin/Desktop/cuddle-market
grep -rn 'py-3 md:py-2\|inputClass="py-3"\|wrapperClassName="h-12"' --include="*.tsx" src
```

기대: 세 파일. 아래 2~4단계와 목록이 맞는지 확인한다.

- [ ] **2단계: `LoginForm.tsx`**

이메일·비밀번호 칸의 `inputClass="py-3"` 을 지운다(속성째 지운다). 로그인 단추의
`py-3 ... md:py-2` 도 지운다. **덮어쓰던 이유를 적은 주석도 함께 지운다** — 더는 사실이
아니다.

```tsx
        <Button size="sm" className="bg-primary-600 w-full cursor-pointer text-white" type="submit">
```

⚠️ `size="sm"` 은 그대로 둔다. 이 화면이 주 단추에 `sm` 을 쓰는 것은 별개 판단이다.

- [ ] **3단계: `SocialLoginButtons.tsx`**

`py-3 ... md:py-2` 와 그 위 주석을 지운다.

- [ ] **4단계: `FindPasswordForm.tsx`**

`wrapperClassName="h-12"` 네 곳을 지운다.

⚠️ **`wrapperClassName` 속성 자체는 남긴다.** 밖에서 높이를 줄 수 있는 길은 있어도 된다.
쓰던 자리만 걷어내는 것이다.

- [ ] **5단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate
```

- [ ] **6단계: 브라우저로 세 화면을 확인한다 ⚠️**

```
폰 모드에서 로그인 · 비밀번호 찾기 화면이 **전과 같아 보이는지** 본다.
덮어쓴 값(48)과 새 기본값(48)이 같으므로 안 바뀌어야 맞다.

  localhost:3000/login           칸·단추·소셜 단추 셋
  localhost:3000/find-password   칸 넷

⚠️ 여기서 높이가 줄었으면 공용 조각이 덜 바뀐 것이다. 과제 1·2를 다시 본다.
```

- [ ] **7단계: 커밋**

```bash
git add src/features/login src/features/find-password
git commit -m "refactor(web): 화면마다 덮어쓴 높이를 걷어낸다 (#847)

공용 조각이 모바일에서 크도록 바뀌어 손으로 덮어쓸 이유가 없어졌다.
커밋 9cccb171 이 「웹 전체의 높이 통일은 별도 이슈로 남긴다」고 적은 그 일이다.

wrapperClassName 속성은 남긴다 — 밖에서 높이를 줄 길은 있어도 된다."
```

---

### 과제 4: 입력칸 테두리 색을 하나로

**파일**
- 고치기: `src/components/commons/Input.tsx:23` (기본값)
- 고치기: `borderColor` 를 넘기는 화면 14곳

**주고받는 것**
- 내놓는 것: 입력칸 테두리가 `#D1D5DB` 하나가 된다 (앱과 같은 값)

- [ ] **1단계: 지금 넘기는 값을 모두 센다**

```bash
cd /Users/osejin/Desktop/cuddle-market
grep -n "borderColor =" src/components/commons/Input.tsx
grep -rn "borderColor=" --include="*.tsx" src | grep -v stories
```

⚠️ **기본값은 `border-gray-100` 이다**(Input.tsx:23). 너무 옅어서 화면마다 `gray-400`
등을 넘겨 덮어쓰고 있었다 — 색이 갈린 뿌리가 이것이다.

기대: 넘기는 값이 이 셋으로 섞여 있다.
```
border-gray-400          11곳   로그인·가입·비밀번호찾기·프로필수정
border-outline-variant    2곳   상품 등록 가격 · TitleField
border-blue-100           1곳   프로필수정 비밀번호 (⚠️ 파랑이다)
```

- [ ] **2단계: 웹 토큰에 값이 있는지 확인한다**

```bash
grep -n "D1D5DB\|d1d5db\|gray-300" src/styles/tokens.colors.css
```

없으면 `--color-gray-300` 을 그 값으로 두거나(지금 `#cbd5e0`), 새 이름을 만든다.
**앱은 `#D1D5DB` 를 쓴다**(`mobile/constants/colors.ts` 의 `outline`).

⚠️ 여기서 멈추고 어느 쪽인지 정한다 — 기존 `gray-300`(#cbd5e0)을 고치면 그걸 쓰는
다른 곳도 바뀐다.

- [ ] **3단계: `Input` 의 기본값을 바꾼다**

`src/components/commons/Input.tsx:23`

```tsx
  // 입력칸 테두리. 앱과 같은 값이다(mobile/constants/colors.ts 의 outline).
  //
  // ⚠️ WCAG 1.4.11(UI 조각 3:1)을 못 넘긴다(1.47:1). **알고 고른 값이다** —
  //    입력칸은 이름표와 안내글이 이미 「여기 쓰는 칸이다」를 말해 주므로 테두리가
  //    유일한 단서가 아니다. 기준을 넘는 #8d8d8d(3.02:1)는 눈에 익은 선보다 진해 보인다.
  borderColor = 'border-gray-300',
```

- [ ] **4단계: 화면에서 넘기던 값을 지운다**

`borderColor="border-gray-400"` 11곳과 `borderColor="border-outline-variant"` 2곳,
`borderColor="border-blue-100"` 1곳을 **속성째 지운다.** 기본값이 맡는다.

⚠️ `border-blue-100` 은 프로필 수정 비밀번호 칸이다. 파란 테두리를 일부러 준 것인지
화면을 열어 보고, 뜻이 있으면 남긴다.

- [ ] **5단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate
```

- [ ] **6단계: 브라우저로 확인한다**

```
localhost:3000/login · /signup · /find-password · /products/new

  입력칸 테두리가 다 같은 회색인가?
  전보다 옅어졌는가? (gray-400 → gray-300)
```

- [ ] **7단계: 커밋**

```bash
git add src/components/commons/Input.tsx src/features
git commit -m "refactor(web): 입력칸 테두리를 하나로 (#847)

border-gray-400(11곳) · border-outline-variant(2곳) · border-blue-100(1곳)이
섞여 있던 것을 기본값 하나로 모은다. 앱과 같은 값이다.

⚠️ WCAG 3:1 을 못 넘지만 알고 고른 값이다 — 사유는 설계 문서 4절."
```

---

### 과제 5: 웹 주 단추 색을 앱과 맞춘다

**파일**
- 고치기: `src/components/commons/button/buttonClass.ts:10`

- [ ] **1단계: `bg-primary` 를 쓰는 곳을 모두 본다**

```bash
cd /Users/osejin/Desktop/cuddle-market
grep -rnE "bg-primary(\s|'|\"|\`)" --include="*.tsx" --include="*.ts" src
```

기대: 다섯 곳이 나온다.
```
buttonClass.ts:10              Button variant="primary"   ← 이 과제가 고치는 것
chatting-page/ChattingPage.tsx  보내기 단추
community/CommunityPage.tsx     글쓰기 단추 둘
home/HomeHero.tsx               hover 색 (평소는 bg-[#825500] 을 직접 적었다)
```

⚠️ **`HomeHero.tsx` 는 평소 색을 `bg-[#825500]` 으로 직접 적어 두고 hover 에만
`bg-primary`(#633F00)를 쓴다.** 이 과제로 둘이 같은 값이 되어 **hover 가 안 보이게
된다.** 그 자리도 함께 손봐야 한다.

- [ ] **2단계: `buttonClass.ts` 의 primary 변형을 바꾼다**

```ts
      primary:
        // 앱과 같은 브랜드 갈색이다(mobile/constants/colors.ts 의 action).
        // 앱이 19바퀴(#786)에 실기기로 보며 정한 값이라 그쪽으로 모았다.
        'bg-primary-600 shadow-primary/20 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl',
```

- [ ] **3단계: `HomeHero.tsx` 의 hover 를 고친다**

평소 `#825500` 과 hover `bg-primary`(#633F00)가 이제 겹치지 않게, hover 를 한 단계
진한 값으로 둔다.

```tsx
            className="hover:bg-primary-700 mt-5 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#825500] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors md:text-base"
```

⚠️ `bg-[#825500]` 을 `bg-primary-600` 으로 바꾸는 것은 이 과제 밖이다(임의 값 정리는
별개 일). 지금은 hover 가 보이게만 한다.

- [ ] **4단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate
```

- [ ] **5단계: 브라우저로 확인한다**

```
localhost:3000 홈       HomeHero 단추에 마우스를 올려 색이 바뀌는지  ⚠️ 이번에 손댄 곳
localhost:3000/signup   「가입하기」 가 앱과 같은 갈색인지
```

- [ ] **6단계: 커밋**

```bash
git add src/components/commons/button/buttonClass.ts src/features/home/components/HomeHero.tsx
git commit -m "refactor(web): 주 단추 색을 앱과 맞춘다 (#847)

primary-700(#633F00) → primary-600(#825500).
앱이 19바퀴(#786)에 실기기로 보며 정한 값이라 그쪽으로 모았다.

곁들여 HomeHero 의 hover 를 primary-700 으로 옮겼다 — 평소 색이 #825500 이라
그대로 두면 hover 가 같은 값이 되어 안 보인다."
```

---

### 과제 6: 앱의 주 단추 높이

**파일**
- 고치기: `mobile/app/profile-edit.tsx:468`
- 고치기: `mobile/app/find-password.tsx:329`

- [ ] **1단계: 지금 값을 다시 센다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile
grep -rn "height: 5[0-9]\|height: 4[0-9]" --include="*.tsx" app components | grep -B0 -A0 "height"
```

설계 문서가 적은 것과 맞는지 본다.
```
40 댓글 등록 · 44 비밀번호찾기 · 46 확인창·로그아웃 · 48 여섯 곳 · 52 프로필수정
```

- [ ] **2단계: 프로필 수정 「저장」을 48로**

`mobile/app/profile-edit.tsx` 의 `primaryButton`.

```ts
  primaryButton: {
    // 화면을 끝내는 단추는 48 이다 — 로그인·가입·신고·상품등록과 같은 값(#847).
    height: 48,
```

- [ ] **3단계: 비밀번호 찾기 「다음」을 48로**

`mobile/app/find-password.tsx` 의 `submit`.

```ts
  submit: {
    height: 48,
```

⚠️ 같은 파일의 `secondary`(보조 단추)도 높이가 같아야 나란히 선다. 확인하고 다르면 맞춘다.

- [ ] **4단계: 창 안 단추와 댓글 등록은 그대로 둔다**

```
46   confirm-dialog · logout-modal · delete-confirm-modal · withdraw-modal
40   comment-input
```

⚠️ **손대지 않는다.** 창 안 단추를 화면 아래 단추만큼 키우면 작은 창이 답답해지고,
댓글 등록을 48로 키우면 옆 입력칸보다 커져 줄이 안 맞는다.

- [ ] **5단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

- [ ] **6단계: 실기기로 확인한다 ⚠️**

폰에서 흔들기 → Reload 부터 한다.

```
1  마이 → 프로필 수정 → 맨 아래 「저장」
   로그인 화면의 「이메일로 로그인」과 같은 높이로 보이는가?

2  로그인 → 비밀번호를 잊으셨나요 → 「다음」
   보조 단추와 나란히 섰을 때 줄이 맞는가?

3  마이 → 로그아웃 (창 안 단추 46)
   전과 같아 보이는가? ⚠️ 여기가 바뀌었으면 잘못 건드린 것이다

4  커뮤니티 글 → 댓글 「등록」 (40)
   전과 같은가? 입력칸과 줄이 맞는가?
```

- [ ] **7단계: 커밋**

```bash
git add mobile/app/profile-edit.tsx mobile/app/find-password.tsx
git commit -m "refactor(app): 화면을 끝내는 단추를 48로 모은다 (#847)

프로필 수정 「저장」 52 → 48 · 비밀번호 찾기 「다음」 44 → 48.
로그인·가입·신고·상품등록이 이미 48이라 그쪽으로 맞춘다.

창 안 단추(46)와 댓글 등록(40)은 그대로 둔다 — 자리가 다르면 크기도 다르다.
창 안 단추를 키우면 작은 창이 답답해지고, 댓글 등록을 키우면 옆 입력칸보다 커진다."
```

---

### 과제 7: 넓게 퍼진 곳을 훑는다 ⚠️

이 이슈에서 가장 위험한 단계다. **`sm` 이 36→40 으로 커져 43곳이 영향받는다.**

**파일**: 없음 (확인만 한다. 문제가 있으면 그 자리를 고친다)

- [ ] **1단계: `sm` 을 쓰는 화면을 모은다**

```bash
cd /Users/osejin/Desktop/cuddle-market
grep -rln 'size="sm"' --include="*.tsx" src | sed 's|src/||'
```

- [ ] **2단계: 줄이 좁은 곳부터 본다 ⚠️**

여러 개가 가로로 늘어선 자리는 4px 이 커지면 **줄바꿈이 생길 수 있다.**

```
localhost:3000 홈          목록 위 필터 알약 줄
localhost:3000/community   정렬·검색 줄
localhost:3000/chatting    입력줄 옆 단추
```

폰 모드와 데스크탑 둘 다에서 본다. **줄이 넘치거나 단추가 잘리면 그 자리에 `size` 를
낮춰 준다**(`sm` → 더 작은 값이 없으므로 `className` 으로 높이를 준다).

- [ ] **3단계: 모달·시트 안을 본다**

```
상품 상세 → 신고하기        모달 안 단추
마이 → 로그아웃            확인 창
상품 등록 → 지역 고르기      시트 안 단추
```

창이 작아 단추가 커지면 답답해 보일 수 있다.

- [ ] **4단계: 게이트 둘 다**

```bash
cd /Users/osejin/Desktop/cuddle-market
pnpm gate && pnpm gate:mobile
```

- [ ] **5단계: 고친 것이 있으면 커밋**

```bash
git add src
git commit -m "fix(web): sm 이 커지며 줄이 넘친 자리를 고친다 (#847)"
```

고칠 것이 없었으면 이 과제는 커밋 없이 끝난다. **확인했다는 것을 다음 과제의 커밋
메시지나 PR 본문에 적는다.**

---

### 과제 8: 마무리

- [ ] **1단계: 이슈에 결과를 남긴다**

`#847` 에 댓글로 적는다.
```
바뀐 값 (모바일/데스크탑)
  Button  sm 40/36 · md 48/40 · lg 56/48 · xs 없앰
  입력칸   48/40  (칸 상자가 h-* 로 정한다)
  테두리   #D1D5DB 하나로
  주 단추  #825500 (앱과 같은 값)
  앱      프로필수정 52→48 · 비밀번호찾기 44→48

그대로 둔 것
  앱 창 안 단추 46 · 댓글 등록 40
  wrapperClassName 속성 (쓰던 자리만 걷어냄)
```

- [ ] **2단계: PR 을 만든다**

base 는 **`develop`** 이다. 본문은 저장소 템플릿을 따르고 `Close #847` 을 넣는다 —
이 이슈는 이번에 다 끝난다.

```bash
cd /Users/osejin/Desktop/cuddle-market
git push -u origin refactor/847--web-button-input-size
gh pr create --base develop --title "refactor(web·app): 단추·입력칸 높이·색을 한 방식으로 (#847)"
```

⚠️ **커밋·푸시·PR 은 사용자가 요청할 때만 한다.** 여기까지 왔으면 물어본다.

---

## 위험한 곳 모음

| 곳 | 왜 위험한가 | 어떻게 |
|---|---|---|
| **`sm` 이 43곳에서 커진다** | 홈 필터·채팅처럼 가로로 늘어선 줄에서 4px 이 커지면 **줄바꿈이 생긴다.** `LoginForm.tsx` 주석이 「28개 파일이 같이 커진다」고 경고한 그 일이다 | 과제 7에서 폰·데스크탑 둘 다로 훑는다 |
| **반응형 방향** | Tailwind 는 모바일 우선이라 `md:` 가 데스크탑이다. 「모바일에 적용」으로 읽으면 정반대로 만든다 | 개발자도구 폰 모드를 껐다 켜며 **모바일이 큰지** 확인한다 |
| **게이트가 높이를 못 잡는다** | `h-11` 과 `h-12` 를 타입체크도 lint 도 구분 못 한다 | 개발자도구 Computed 탭에서 실제 height 를 잰다 |
| **`HomeHero` 의 hover** | 평소 `#825500` 인데 hover 가 `bg-primary`(#633F00)다. 과제 5로 둘이 같아지면 **hover 가 안 보인다** | 과제 5의 3단계에서 함께 고친다 |
| **`h-md` 류 이름 토큰** | 이 저장소는 `--spacing-md` 를 따로 둬서 엉뚱한 값으로 풀린다(`max-w-3xl` 이 48px 이 됐던 함정) | 숫자값(`h-12`)만 쓴다 |
| **앱 창 안 단추를 같이 키우기** | 46 을 48 로 올리면 작은 창이 답답해진다 | 과제 6의 4단계 — 손대지 않는다 |
