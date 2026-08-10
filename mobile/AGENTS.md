# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

앱은 **Expo SDK 54 · React Native 0.81.5 · React 19.1.0**에 고정돼 있다. 사용자 폰의 Expo Go가 54라서다 — `@latest`로 올리면 실기기에서 안 뜬다.

## 게이트

저장소 루트에서 친다. `cd mobile` 뒤에 루트 명령을 치면 실패한다.

```bash
pnpm gate:mobile     # tsc --noEmit + expo lint + jest
```

## 걸렸던 함정

실제로 시간을 잡아먹은 것만 적는다. 추측은 안 적는다.

| 함정 | 왜 | 어떻게 |
|---|---|---|
| `Modal` 의 `animationType="slide"` | **아래에서만** 올라온다. 옆에서 미는 건 없는 값이다 | 옆에서 넣으려면 `animationType="none"` + Reanimated로 직접 |
| `useSegments()` | 튜플 유니온을 돌려줘서 `includes()`가 타입 오류가 난다 | `as string[]`로 넓혀서 쓴다 |
| **Expo Go에서 맞춘 아래쪽 여백** | `app.json`의 `edgeToEdgeEnabled: true`가 **Expo Go에는 안 먹는다.** 그래서 Expo Go에서는 `insets.bottom = 0`이고, 개발·출시 빌드에서는 24~48이 들어온다 | 탭 화면 안(탭바가 보이는 화면)에서는 `insets.bottom`을 **더하지 마라** — 탭바가 이미 제스처 바를 비켜 놓아 두 번 세게 된다. 루트에 그리는 것(토스트)만 자기가 더한다. **여백은 개발 빌드로 맞춰라** — Expo Go에서 맞추면 진짜 빌드에서 어긋난다 |
| **루트 화면에서 목록 끝이 기기 바에 가림** | 탭 화면은 탭바가 기기 바를 비켜 주지만, **루트에 뜨는 화면은 아래에 탭바가 없다.** 자기가 비켜야 한다 | `SafeAreaView`에 **`edges={['top', 'bottom']}`**. 알림·답글·검색 결과가 다 그렇다. `['top']`만 주면 마지막 항목이 3버튼 바에 깔린다 (2026-08-06 검색 결과에서 또 걸렸다) |
| **코드는 맞는데 폰 화면이 옛날 것** | Metro가 죽었다 다시 떠도 **폰은 저절로 안 붙는다.** Expo Go는 이미 받아 둔 화면을 계속 보여줘서 「코드가 원복됐다」로 보인다 | 코드를 뒤지기 전에 **폰에서 Reload부터**(흔들기 → Reload). 그래도 옛날 것이면 그때 코드를 본다. 11바퀴에 이걸로 한 바퀴 돌았다 |
| `useBottomTabBarHeight()` | **탭 화면 안에서만** 돈다. 루트 화면에서 부르면 못 쓴다 | 루트에 그리는 것(토스트 등)은 값을 재서 못 박는다 (`insets.bottom + 72`) |
| `textShadow` | **글자 기반 아이콘**(MaterialIcons)에만 먹는다. SVG 아이콘(Lucide)엔 안 먹는다 | 그림자용 아이콘을 뒤에 깐다. **타입체크도 린트도 안 잡아준다** — 실기기로 봐야 안다 |
| 화면을 한 스택에만 두기 | 다른 탭에서 그 화면으로 가면 탭이 튄다 | 두 스택에 같은 화면을 두고, `useSegments()`로 지금 그룹을 읽어 경로를 만든다 |
| `(home)` 스택의 `headerShown` | 화면마다 적으면 새 화면을 더할 때 빠뜨린다 | `screenOptions`로 통째로 끈다 |
| 팬(병렬 에이전트) 동시 커밋 | `.git/index.lock`에서 부딪힌다 | 팬은 구현·게이트만. 커밋은 리드가 한다 |
| Expo Go에서 됨 ≠ 독립 빌드에서 됨 | EAS가 `pnpm install`을 새로 돌린다 | 의존성을 바꿨으면 EAS 빌드로 한 번 확인한다 |
| `setNativeProps` | 새 아키텍처(`newArchEnabled: true`)에서는 못 믿는다 | `TextInput`의 커서는 `selection` **prop**으로 옮기고, 그 자리에 닿으면 `undefined`로 놓는다. 계속 붙잡으면 사용자가 커서를 못 옮긴다 |
| 「안드로이드는 창이 저절로 줄어든다」 | **옛말이다.** `app.json`의 `edgeToEdgeEnabled: true`라 창이 안 줄고 앱이 키보드 뒤까지 그린다 | `KeyboardAvoidingView`에 **양쪽 다** `behavior="padding"`을 준다. `Platform.OS === 'ios' ? 'padding' : undefined`로 두면 안드로이드에서 아무 일도 안 일어난다 |
| `KeyboardAvoidingView`로 입력칸만 감싸기 | 위쪽 목록이 안 밀려서 키보드가 칸을 덮는다 | 화면이 **목록과 칸을 함께** 감싼다. 그리고 칸에 초점이 가면 쓸 자리로 스크롤한다 — 창이 좁아지면 아래 내용이 밀려난다 |
| `@testing-library/react-native` 14의 `render`·`rerender`·`fireEvent` | **셋 다 기다려야** 한다 | `await` 없이 쓰면 render는 «render function has not been called», **fireEvent·rerender는 오류 없이 옛 값을 준다** — 시험이 조용히 틀린 것을 통과시킨다 |
| `TextInput` 글자 일부에만 색 주기 | `value`로는 못 한다. 통째로 한 덩어리다 | 값을 **children**으로 준다: `<TextInput>{<Text style={…}>@닉</Text>}{<Text>나머지</Text>}</TextInput>`. 맨 글자를 그냥 두면 «Text strings must be rendered within a `<Text>`»가 난다. **한글 입력과 부딪힐 수 있어 실기기로 봐야 한다** |
| `react-native-marked`의 `<Markdown>` | 속이 `FlatList`라 `ScrollView` 안에 넣으면 경고가 난다. `MDImage`는 `useEffect` 의존성 배열이 없어 끝없이 다시 그린다(8.1.1) | `useMarkdown` 훅으로 조각만 받고, `Renderer`를 상속해 `image()`만 우리 것으로 바꾼다 |
| **`formatBirthDate` 가 둘** | **하는 일이 다른데 이름이 같다.** `@cuddle/shared` 것은 **보여줄 모양**으로 바꾸고(인자 하나), `mobile/lib/signup/validation.ts` 것은 **서버에 보낼 값을 조립**한다(인자 셋). 7월에 겪은 `formatPrice` 시맨틱 충돌과 같은 종류다 | 화면에 그릴 때는 `@cuddle/shared`, 가입·수정에서 보낼 때는 `@/lib/signup/validation`. **자동완성이 집어 온 쪽을 그냥 쓰지 말고 인자 개수로 확인한다** |
| **`app/` 안에 시험 파일** | expo-router는 `app/`의 **모든 파일을 화면으로 본다.** 시험 파일도 앱 번들에 끼워 넣으려다 `@testing-library/react-native`를 못 찾아 **실기기가 아예 안 뜬다**(`UnableToResolveError`). ⚠️ **타입체크도 린트도 안 잡아준다** — 게이트가 초록인데 폰만 죽는다 (2026-08-07) | 화면 시험은 `mobile/__tests__/`에 두고 `@/app/...`로 불러온다 |
| **앱을 다시 불러오면 엉뚱한 탭이 열린다** | expo-router는 `/`에 맞는 **첫 `index.tsx`** 를 찾는데, 괄호로 감싼 폴더는 URL에 안 들어가서 `(home)`·`(community)`·`(my)`·`(place)`가 **넷 다 `/`에 걸린다.** 그래서 알파벳순으로 `(community)`가 이겼다. ⚠️ `<Tabs.Screen>` 차례는 **탭바에 보이는 순서**만 정하고, `unstable_settings`의 `initialRouteName`은 **딥링크로 들어왔을 때 스택 아래에 뭘 깔지**를 정한다 — **둘 다 첫 화면을 못 정한다** (19바퀴에 이걸 몰라 두 번 헛짚었다) | `app/index.tsx`에서 `<Redirect href="/(tabs)/(home)" />` |
| **`row-reverse` 인데 오른쪽에 안 붙는다** | `row-reverse`는 **가로축의 방향을 뒤집는다.** 「시작」이 오른쪽, 「끝」이 왼쪽이다. 그래서 `justifyContent: 'flex-end'`는 **왼쪽으로** 몬다. 안쪽 차례는 맞는데 줄만 왼쪽에 몰려서 「값 판별을 못 하나」로 잘못 보인다 — 20바퀴 채팅 말풍선에서 한 바퀴 헛돌았다 | 오른쪽에 붙이려면 **`justifyContent: 'flex-start'`**. 줄에 `width: '100%'`도 준다. ⚠️ **웹 코드를 옮길 때 특히 걸린다** — 웹은 `ml-auto`라 방향과 무관하게 오른쪽에 붙어서, 웹이 멀쩡한 걸 보고 「같은 뜻」이라 여기게 된다 |
| **STOMP 가 아무 응답도 없다** | RN의 WebSocket이 STOMP 프레임 끝의 **NULL 문자를 흘린다.** 서버(Spring)는 「메시지가 아직 안 끝났다」고 보고 버퍼에 담아 둔 채 기다린다 — **오류도, 서버 로그도, 연결 끊김도 없다.** 밖에서는 완전한 침묵으로만 보여서 20바퀴에 토큰 만료로 오해했다 | `Client` 에 **`forceBinaryWSFrames: true`** (받는 쪽은 `appendMissingNULLonIncoming: true`). ⚠️ **폰만 보면 절대 못 가른다** — 맥에서 같은 서버로 셋을 직접 보내 갈랐다: 텍스트+NULL ✅찍힘 · **NULL없음 ❌침묵** · 바이너리+NULL ✅찍힘 |

## 색을 고를 때

**대비 수치를 넘겨도 안 읽힐 수 있다.** 19바퀴(#786)에 칩 색을 여덟 번 바꾸며 알아낸 것이다.

| 함정 | 왜 | 어떻게 |
|---|---|---|
| **WCAG 4.5:1을 넘겼는데 안 읽힌다** | 기준은 **절대값**이라 주변을 안 본다. 같은 화면의 다른 글자가 7.8:1인데 이것만 5.3:1이면 **상대적으로 흐려 보인다** | 재려면 **같은 화면의 잘 읽히는 글자와 견준다.** 스크린샷에서 픽셀을 뽑아 나란히 놓으면 바로 보인다 |
| **명도 대비는 충분한데 경계가 흐리다** | **색상(hue)이 같으면** 「같은 색의 밝기 차이」로 보인다. `#CA9B2B` 바탕에 `#2A1A00` 글자는 6.61:1인데 색상 차이가 5°뿐이라 안 읽혔다 | 무채색(먹색·흰색)을 얹거나 색상을 벌린다. 노란 표지판에 갈색 대신 **검정**을 쓰는 이유다 |
| **같은 계열 안에서 두 요소를 밝기로만 가르기** | 벗어날 수 없는 맞교환이 생긴다 — **밝게 하면 그 위 글자가 안 읽히고, 어둡게 하면 서로 비슷해진다.** `#A68564`는 순검정을 얹어도 6.16:1이 한계였다 | 색으로 가르려 하지 말 것. **모양·크기·자리**가 이미 갈라 준다(칩은 알약·목록 위, 단추는 네모·화면 아래). 19바퀴는 결국 칩과 단추를 **같은 색**으로 두었다 |
| **스크린샷에서 글자색 판별** | 작은 글자(13px)는 안티앨리어싱으로 **순수한 글자 픽셀이 거의 없다.** 「가장 어두운 픽셀 하나」를 뽑으면 배경과 섞인 값이 나오고, JPEG는 **파란 성분을 깎아** 먹색을 갈색으로 보이게 한다 | **두 스크린샷의 같은 자리를 견준다.** 픽셀 하나가 아니라 어두운 쪽 10~15%의 평균을 본다 |

## API를 붙일 때

**응답 DTO를 직접 열어본다.** 「다른 API가 이러니 이것도 그렇겠지」는 추측이다. 9바퀴에 이걸 안 해서 차단 목록이 늘 비어 있었고, **테스트까지 같은 가정으로 써서 틀린 모양을 통과시켰다.**

```
가정   { data: { content } }        · userId
실제   { data: { blockedUsers } }   · blockedUserId
```

**같은 도메인이라도 응답이 갈릴 수 있다.** 프로필이 그렇다 — 18바퀴(#862)에 둘로 쪼갰다.

```
GET /profile/me      MyProfileResponse       + provider · name · birthDate · email
GET /profile/{id}    PublicProfileResponse   + isBlocked · isReported
```

남의 프로필에는 **실명·생년월일·이메일이 아예 안 온다**(개인정보라 서버가 뺐다). 남의 화면에서 그 값을 쓰면 늘 비어 있는데, **타입만 보면 있는 것처럼 보인다.**

찾는 법은 저장소 루트 `CLAUDE.md`의 「백엔드 저장소」 항목에 있다.
