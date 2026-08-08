# 앱 색 토큰 설계 (#786)

> 19바퀴. 앱 곳곳에 흩어진 색 값 599개를 뜻이 드러나는 이름 뒤로 모은다.

---

## ⚠️ 실제는 이렇게 끝났다 (2026-08-08 · PR #865)

**아래 본문은 착수 시점(2026-08-07)의 판단이다.** 실기기로 보며 여러 번 바뀌었다.
지금 앱이 쓰는 값은 `mobile/constants/colors.ts` 를 보는 것이 맞다.

```
설계에 적은 것                        실제로 끝난 것
action  #111827 먹색               action = selected = accent = #825500
selected #825500 갈색               ├ 칩과 단추를 색으로 가르려던 시도를 되돌렸다
「둘은 뜻이 달라 색도 다르다」           └ 색이 같아도 모양·크기·자리로 갈린다

(없음)                              control #111827 이 새로 생겼다
                                   라디오·체크박스가 켜졌을 때. 브랜드 색을 안 쓴다

outlineBrand #D4C4B2               삭제. 테두리를 outline #D1D5DB 하나로 모았다
                                   굵기도 hairlineWidth 가 섞이던 것을 1 로

constants/theme.ts 「값만 줄인다」     **파일을 지웠다.** 열두 값 중 읽히는 건 탭바
                                   .tint 하나뿐이었고 Fonts 는 미사용이었다

selectedSurface #F4E3BF            만들었다가 지웠다 (연한 칩을 되돌리면서)
brand700 #633F00                   만들었다가 지웠다 (등록 단추를 통일하면서)
```

**왜 바뀌었나 — 칩 색을 여덟 번 바꿔 보고 알아낸 것**

「칩이 단추와 헷갈린다」에서 출발해 갈색 계열 안에서 밝기를 바꿔 봤다
(`#F4E3BF` · `#CA7F41` · `#CA9B2B` · `#D8BDA0` · `#CAB095` · `#A68564` …).
매번 같은 벽에 부딪혔다.

```
밝게   두 색이 잘 갈림 ✅   그 위 글자가 안 읽힘 ❌
어둡게  글자가 읽힘 ✅      단추와 다시 비슷해짐 ❌
```

`#A68564` 는 **순검정을 얹어도 6.16:1** 이라, 같은 화면의 다른 글자(7.83:1)에 못 미쳤다.
**WCAG 기준(4.5:1)을 넘겨도 주변보다 낮으면 흐려 보인다** — 수치만 보고 판단한 것이 실수였다.

이 함정들은 `mobile/AGENTS.md` 의 「색을 고를 때」에 옮겨 두었다.

**범위도 바뀌었다.** 웹 입력칸 경계 색과 웹·앱 주 단추 색 통일은 **#847 로 옮겼다** —
`Input.tsx` · `buttonClass.ts` 를 색 때문에 한 번, 높이 때문에 또 한 번 열 이유가 없어서다.
이 이슈(#786)에 남은 것은 **지도 마커**뿐이다.

---

## 1. 지금 어떤가 — 실측 (2026-08-07)

`mobile/` 안에서 따옴표로 감싼 색 값만 셌다. 주석에 적힌 이슈 번호(`#786` 같은 것)가
같은 모양이라 그냥 세면 섞인다.

```bash
grep -rhoE "['\"]#[0-9a-fA-F]{3,8}['\"]" --include="*.ts" --include="*.tsx" \
  app components constants hooks lib | wc -l
```

```
색 값 쓰인 횟수   599회
서로 다른 색       56개
파일               86개
```

**이슈 본문의 숫자(138회 · 21색 · 19파일)는 낡았다.** 그건 화면이 넷이던 #784 시절 것이라
지금은 네 배가 넘는다. 이슈를 읽을 때 그 표를 그대로 믿으면 안 된다.

### 이슈가 적어 둔 착수 계기가 왔다

이슈는 「같은 색을 화면마다 다른 뜻으로 쓰기 시작할 때」 착수하라고 적어 뒀다. 그 일이
이미 벌어져 있다.

```
같은 「끝내는 단추」인데 색도 높이도 다르다
  app/login.tsx:176         backgroundColor: '#111827'   먹색, 높이 48
  app/profile-edit.tsx:469  backgroundColor: '#825500'   갈색, 높이 52

같은 「칩」인데 고른 상태 색이 다르다
  components/products/chip-field.tsx:75          #111827  먹색
  components/products/product-filter-row.tsx:557 #825500  갈색
```

### 주 버튼 색이 세 갈래다

```
웹    Button variant="primary" → bg-primary   #633F00   (buttonClass.ts:10)
앱    로그인·가입·신고·확인대화·칩 활성          #111827   먹색   15곳
앱    프로필수정 저장·홈·필터·탭·툴바            #825500   갈색   10곳
```

### 위험색이 두 개다

```
#DC2626   12곳
#C91D1D    9곳   ← 웹 --color-danger-500
```

`#DC2626`은 **웹이 이미 탈락시킨 값**이다. `src/styles/tokens.colors.css:110`에
「이전 #dc2626는 4.5:1 borderline」이라 적고 danger-600을 `#b91d1d`로 바꾼 기록이 있다.
앱만 탈락한 값을 붙들고 있을 이유가 없다.

### 회색조는 역할이 꽤 깔끔하게 갈려 있다

어떤 속성에 쓰였는지로 셌다.

```
글자(color)          #111827 본문·제목    #374151 진한 보조(5)  #4B5563 중간(17)
                    #6B7280 보조(47)     #9CA3AF 안내글·비활성(20)
바탕(backgroundColor) #FFFFFF 화면·카드(70)  #F9FAFB 연함(15)  #F3F4F6 더 연함(11)
테두리(border*)       #D1D5DB 칸 테두리(23)  #E5E7EB 구분선(24)  #D4C4B2 칩·툴바(7)
```

`#E5E7EB` 하나만 역할이 둘이다 — 구분선(24회)이면서 회색 바탕(18회)이기도 하다.

⚠️ **회색 다섯 단은 Tailwind gray 스케일 그대로다**(900·700·600·500·400). 웹이
`--color-gray-*` 를 그대로 둔 것과 같은 자리에 있다.

### 이슈 본문에서 이미 해결된 항목

이슈는 `constants/theme.ts`의 `#0a7ea4`(Expo 템플릿 기본 파랑)를 정리하라고 적었지만
**이미 `#825500`으로 고쳐져 있다**(`theme.ts:13`, 주석까지 남아 있다). 체크박스가 낡았다.

남은 잔재는 **아무 데서도 안 쓰이는** light/dark 팔레트 값들이다.

```
#11181C · #687076 · #151718 · #ECEDEE · #9BA1A6
```

`Colors`를 실제로 부르는 곳은 탭바 한 군데뿐이다(`app/(tabs)/_layout.tsx:46`, `.tint`만).

## 2. 이번 바퀴의 범위

이슈 #786에는 성격이 다른 세 갈래가 들어와 있다. **앱 토큰만** 이번에 하고 나머지 둘은
뒤로 뺀다.

```
이번(19바퀴)   앱 색 토큰 도입
다음           지도 마커 색·이미지 (#786 「추가(2026-08-06)」 항목)
그다음         웹 입력칸 경계 색 (#786 「함께 정할 것」 항목)
```

⚠️ 이슈 본문은 「웹 값이 먼저 정해져야 앱이 베낄 기준이 생긴다」며 웹 입력칸을 앞에
두라고 적어 뒀다. **그 순서를 일부러 뒤집었다.** 입력칸 경계 색은 앱 토큰 56개 중
하나(`outline`)일 뿐이라, 그 하나 때문에 나머지 55개를 붙들고 있을 이유가 없다.
웹 값이 정해지면 그때 `outline` 한 줄만 고치면 된다 — 토큰이 있어서 한 줄로 끝난다.

**다크모드는 안 한다.** 화면 86개가 흰 배경을 못 박고 있어(`backgroundColor: '#FFFFFF'`
70회) 토큰만 두 벌로 갈라 봐야 어디에도 안 닿는다. 지금 다크에 반응하는 것은 내비게이션
테마뿐이다(`app/_layout.tsx:37`). 다만 파일 모양은 나중에 `light`/`dark` 두 벌로
감쌀 수 있게 평평한 객체 하나로 둔다.

## 3. 무엇을 만드나

`mobile/constants/colors.ts` 파일 하나. 순수 TypeScript 상수 객체다.

앱에는 NativeWind 같은 스타일 라이브러리가 없고 `StyleSheet`만 쓴다(`package.json` 확인).
그래서 웹의 CSS 변수를 그대로 가져올 수 없다. 상수 객체면 지금 `StyleSheet`에 그대로
꽂히고 새 도구도 안 는다.

```ts
const styles = StyleSheet.create({
  button: { backgroundColor: colors.action },
  label: { color: colors.onAction },
})
```

### 이름은 웹 체계를 따른다

웹 `src/styles/tokens.colors.css`가 쓰는 `surface` / `on-surface` / `outline` 체계를
앱도 그대로 쓴다. 두 저장소를 오갈 때 말이 통하게 하려는 것이다.

`on-`은 **「이 바탕 위에 올라가는 색」**이라는 뜻이다. `surface` 위에 얹는 글자가
`onSurface`, `action` 단추 위에 얹는 글자가 `onAction`이다.

```
[바탕]
surface           #FFFFFF   화면·카드 바탕
surfaceMuted      #F9FAFB   한 단계 눈치채운 바탕
surfaceSunken     #F3F4F6   움패인 바탕 (입력칸·구역)
surfaceCream      #FAF8F3   크림 바탕 (프로필 수정)

[글자 — 진한 것부터 다섯 단]
onSurface         #111827   본문·제목
onSurfaceStrong   #374151   진한 보조 글자
onSurfaceMedium   #4B5563   중간 글자
onSurfaceMuted    #6B7280   보조 글자
onSurfaceSubtle   #9CA3AF   안내글·비활성

[선]
outline           #D1D5DB   칸 테두리
outlineVariant    #E5E7EB   구분선
outlineBrand      #D4C4B2   칩·툴바·검색칸 테두리 (웹 --color-outline-variant)

[앱에만 있는 역할 — 새로 지은 이름]
action / onAction       #111827 / #FFFFFF   끝내는 단추
selected / onSelected   #825500 / #FFFFFF   여럿 중 고른 것 (웹 primary-600)
danger / onDanger       #C91D1D / #FFFFFF   위험
dangerSurface           #FEE2E2             위험 바탕
success                 #15803D             확인 통과 (웹 --color-success-500)
warningSurface          #FFF5E0             빈 목록 아이콘 바탕 (웹 --color-warning-container)
favorite                #FC8181             찜 하트
rating                  #FBBF24             별점
black                   #000000             사진 뒷바탕·그림자

[웹에서 그대로 가져오는 것]
brandSurface            #FAF3E6   웹 primary-50    판매자 카드 바탕
brandText               #633F00   웹 primary-700   브랜드 글자
badgeSell / badgeSellBg          #2563EB / #EFF6FF
badgeRequest / badgeRequestBg    #EA580C / #FFF7ED

[브랜드 갈색 스케일 — 웹 단계 이름 그대로]
brand100  #F4E3BF   프로필 사진 자리 바탕
brand200  #ECC88E   댓글 작성자 표시 바탕
brand300  #E2A958   빈 목록 아이콘
brand500  #B06F15   알림 줄 바탕
```

### ⚠️ 「값 이름 금지」 규칙은 실물 앞에서 접었다

처음에는 이슈 본문을 그대로 옮겨 **`brand700` 같은 값 이름을 쓰지 않는다**고 적었다.
그런데 색 56개를 끝까지 세어 보니 **지킬 수 없는 규칙이었다.**

브랜드 갈색이 스케일째 흩어져 있는데, 가운데 넷은 **각각 딱 한 번씩, 서로 다른 화면의
서로 다른 역할**에 쓰인다.

```
#F4E3BF  프로필 사진 자리 바탕      1회
#ECC88E  댓글 작성자 표시 바탕      1회
#E2A958  빈 목록 아이콘            1회
#B06F15  알림 줄 바탕              1회
```

넷을 묶을 역할 이름이 없다. 억지로 지으면 `avatarSurface` 처럼 **그 한 줄 전용 이름**이
되어, 다음에 다른 화면이 같은 갈색을 쓰려 할 때 이름을 또 지어야 한다.

「값 이름은 이점이 없다」는 말은 **역할이 하나뿐일 때** 맞는 말이다. 한 색이 화면마다
다른 일을 할 때는 단계 이름이 오히려 정직하고, 웹 `primary-50~900`과 1대 1로 맞아떨어져
양쪽을 견주기도 쉽다.

여러 곳에서 쓰이거나 뜻이 분명한 셋은 그대로 역할 이름으로 둔다 — `selected`(#825500,
10곳) · `brandText`(#633F00) · `brandSurface`(#FAF3E6).

⚠️ `brand50`은 만들지 않는다. `brandSurface`와 값이 같아(`#FAF3E6`) 한 색에 이름이 둘이
되면 어느 쪽을 써야 할지 매번 헷갈린다.

### 토큰으로 안 만드는 것 — lint 예외 네 곳

```
constants/colors.ts                      토큰 원본

components/auth/social-login-buttons.tsx  카카오 #FEE500 · 구글 #747775 #1F1F1F
components/auth/social-logos.tsx          구글 로고 SVG #4285F4 #34A853 #FBBC05 #EA4335
  → 남의 브랜드가 정한 색이라 우리가 못 바꾼다

lib/notifications.ts                      알림 종류별 색 짝 6쌍(12색)
  → NOTIFICATION_COLORS 로 **이미 한곳에 모여 있고** 이름도 뜻이 드러난다
    (CHAT_NEW_ROOM · COMMENT_REPLY …). 이슈가 말한 「화면마다 흩어짐」 문제가 없어
    지금 옮길 값어치가 없다. colors.ts 로 올리면 notifyChatBg 같은 토큰 12개가 느는데
    하나같이 그 파일 밖에서는 안 쓰인다
```

⚠️ 예외를 넷 두었으므로 **「리터럴 0」은 목표가 아니다.** 이 넷 밖에서 0이면 된다.

### 주 버튼 색은 역할로 가른다

먹색·갈색 중 하나로 몰지 않는다. **지금 쓰임새가 이미 둘로 갈려 있어** 그걸 이름으로 굳힌다.

```
action    #111827   이 화면에서 끝내는 단추   로그인·가입·신고·확인대화·저장
selected  #825500   여럿 중 고른 것          필터 칩·탭·툴바·상태 칩
```

이 기준으로 보면 어긋난 자리가 셋 나온다 — 4절 3단계에서 고친다.

### 위험색은 `#C91D1D` 하나로

지금 더 많이 쓰인 `#DC2626`(12곳)이 아니라 적은 쪽(9곳)으로 모은다. 1절에 적었듯
`#DC2626`은 웹이 대비 때문에 이미 버린 값이다.

## 4. 어떻게 쪼개나

599곳을 한 번에 손대면 리뷰도 되돌리기도 안 된다. 그런데 **쪼개는 기준이 파일 개수가 아니다.**

```
치환   값은 그대로, 이름만 토큰으로     화면이 1픽셀도 안 바뀐다 → 게이트만 초록이면 끝
통일   값 자체를 바꾼다 (15곳)        화면이 실제로 달라진다  → 실기기 눈 확인이 필요하다
```

이 둘을 한 커밋에 섞으면 「색이 이상한데?」 할 때 **치환 실수인지 통일 결과인지 구분이
안 간다.** 그래서 통일을 맨 뒤로 뺀다.

```
1단계  constants/colors.ts 만들기                          화면 무변화
2단계  순수 치환 — 값 그대로, 이름만                        화면 무변화 · 다섯 묶음
       ① components/ui + components 최상위 3개    71회  10파일
       ② components/products                     94회  11파일
       ③ components/my + components/community   128회  17파일
       ④ app 화면들                             140회  22파일
       ⑤ 남은 컴포넌트 + constants/theme.ts      134회  22파일
                                          합계  567회
3단계  값 통일 — 여기서만 화면이 바뀐다                      실기기 확인 ⚠️
       chip-field 고른 칩      먹색 → 갈색         2곳
       profile-edit 저장 단추   갈색 → 먹색         1곳
       위험색                 #DC2626 → #C91D1D   12곳
4단계  theme.ts 잔재 정리 + 리터럴 재유입 차단
```

전체 599회 중 **32회는 예외 넷에 들어 있어 손대지 않는다**(카카오 7 · 구글 로고 5 ·
알림 색 16 + 그 시험 4). 그래서 치환 대상은 567회다.

**3단계를 맨 뒤에 두는 이유가 하나 더 있다.** 2단계를 끝내면 어긋난 자리가 **이름으로**
드러난다. 지금은 `chipActive: { backgroundColor: '#111827' }`이라 눈에 안 띄지만,
치환 뒤에는 `backgroundColor: colors.action`이 되어 「칩인데 왜 action이지?」가 코드에서
바로 읽힌다. 통일 대상이 정말 그 15곳뿐인지도 그때 다시 셀 수 있다.

## 5. 다시 안 새게 막는 법

토큰을 도입해도 다음 바퀴에 `'#6B7280'`을 또 적으면 원래대로 돌아간다. 웹이 lint 경고를
36건에서 못 늘게 잠가 둔 것과 같은 장치가 필요하다.

`mobile/eslint.config.js`에 규칙을 더한다.

```js
// 색은 constants/colors.ts 에만 적는다.
// 화면에 직접 적으면 같은 색이 화면마다 조금씩 달라진다 — 19바퀴에 599회를 걷어냈다.
'no-restricted-syntax': ['error', {
  selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
  message: '색 리터럴 금지 — @/constants/colors 의 토큰을 쓸 것',
}]
```

예외는 3절에 적은 네 파일이다 — `constants/colors.ts` · `social-login-buttons.tsx` ·
`social-logos.tsx` · `lib/notifications.ts`.

⚠️ **이 규칙이 진짜 도는지 먼저 확인해야 한다.** `Literal[value=/…/]` 라는 selector 문법이
안 먹을 수 있다. 일부러 색을 한 줄 적어 보고 lint 가 잡는 것을 눈으로 본 다음에야
「잠갔다」고 말한다.

## 6. 어떻게 확인하나

```
매 단계    pnpm gate:mobile          tsc --noEmit + expo lint + jest
2단계 끝   리터럴 세기                위 grep 명령으로 숫자가 0에 가까운지
3단계 끝   실기기 눈 확인 ⚠️          칩 · 저장 단추 · 오류 글자 세 곳
```

### ⚠️ 게이트는 색이 틀린 걸 못 잡는다

`colors.onSurface`를 써야 할 자리에 `colors.onSurfaceMuted`를 써도 **타입도 lint도
초록이다.** 599곳이라 사람 눈으로 전부 보기도 어렵다.

그래서 2단계는 묶음마다 `git diff`에서 색 값이 보존됐는지를 눈으로 확인하고, 3단계 뒤에
실기기로 주요 화면을 훑는다. 이것이 이번 바퀴에서 가장 약한 고리다 — 감출 것 없이 적어 둔다.

## 7. 관련

- 이슈 #786 (이 문서가 다루는 것은 「기대 결과」 네 항목 중 앞의 셋)
- 웹 토큰: `src/styles/tokens.colors.css`
- 웹 버튼: `src/components/commons/button/buttonClass.ts`
- 남긴 것: 지도 마커(#786 추가 항목) · 웹 입력칸 경계(#786 「함께 정할 것」)
