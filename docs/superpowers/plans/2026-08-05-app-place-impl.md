# 앱 「플레이스」 구현 계획 (#852)

> 설계: `docs/superpowers/specs/2026-08-05-app-place-design.md`
> 브랜치: `feature/852--app-place`

## 어디까지 됐나

### 1·2층 — 폰에서 끝냄 (커밋 `d815d793`)

- [x] **타입 못 박기** `mobile/lib/places/types.ts` — 서버 DTO 를 직접 열어 맞췄다. `CATEGORIES`·`DEFAULT_CENTER` 도 여기 있다
- [x] **서버 붙이기** `mobile/lib/places/api.ts` + 시험 8 — `getPlaces` · `getPlaceDetail`
- [x] **목록 항목** `mobile/components/places/place-list-item.tsx` + 시험
- [x] **카테고리 알약** `mobile/components/places/category-tabs.tsx` + 시험 (둘 합쳐 10)
- [x] **상세 훅** `mobile/lib/places/use-place-detail.ts` + 시험 6
- [x] **상세 화면** `mobile/app/places/[id].tsx`
- [x] 게이트 `pnpm gate:mobile` 초록 — 336시험 (312 → 336)
- [x] 마커 검증 — 조회 좌표 망가뜨리기 · 실패 시 옛 값 지우는 줄 지우기 → 정확히 2개만 실패

### 3층 — 폰에서 이어감 (2026-08-06 새벽)

리모트 컨트롤로 여기까지 왔다. **맥 앞에 앉을 필요가 없었다** — EAS 는 클라우드에서
빌드하고, Metro 는 맥이 켜져 있기만 하면 된다.

- [x] Task 1 지도 모듈 + 키 숨기기 (`app.config.js` · EAS 환경변수)
- [x] Task 2 플레이스 화면 (탭 · 지도 · 시트 · 상세 자리)
- [x] **실기기 확인 6건** — 게이트 343개가 초록인 상태에서 나왔다:
  - [x] 앱이 아예 안 열림 → 화면 하나가 앱 전체를 죽이는 구조였다
  - [x] 탭 누르면 오류 → 그물이 못 받는 자리였다(require + try/catch 로)
  - [x] 헤더에 「장소」 → 라우팅이 깨져 상세가 탭 자리를 차지했다
  - [x] 인디케이터가 영영 돎 → 시작값을 지도 유무로 정한다
  - [x] 시트가 안 끌림 → 끌 수 있는 자리가 손가락보다 작았다
  - [x] 시트가 통통 튐 / 덜커덕 → 용수철·높이 애니메이션 → 시간·곡선·옮기기
- [ ] **개발 빌드 설치** — 줄 서는 중(무료 등급). 끝나면 폰에서 설치 링크
- [ ] **지도 확인** — 아래 목록. 빌드를 깔아야 볼 수 있다
- [ ] PR (지도까지 보고 한 번에 — 지금 올리면 지도 없는 플레이스가 머지된다)

빌드: https://expo.dev/accounts/jjub/projects/cuddle-market/builds/f70eada8-aab7-48c9-9bd0-8841c5765954

**집 안이면 맥 앞에 갈 필요 없다** — 같은 와이파이면 폰이 Metro(192.168.45.230:8081)에
바로 붙는다. 맥은 켜져 있기만 하면 된다.

---

## 3층 — 맥 앞에서 할 일

### Task 1: 지도 모듈 넣기 + 키를 설정에서 뺀다

**파일**
- 고침: `mobile/package.json` (설치로 저절로)
- **바꿈: `mobile/app.json` → `mobile/app.config.js`**

- [ ] **1-1.** 설치. ⚠️ `npm i` 로 최신을 받지 마라 — SDK 54 가 깨진다

```bash
cd mobile && npx expo install @mj-studio/react-native-naver-map
```

- [ ] **1-2.** `app.json` 을 `app.config.js` 로 바꾼다. **키를 커밋하지 않으려는 것이다.**

```js
// mobile/app.config.js
// app.json 이었던 것. 네이버 지도 키를 저장소에 박지 않으려고 js 로 바꿨다 —
// json 에는 process.env 를 못 쓴다.
export default {
  expo: {
    /* app.json 에 있던 내용을 **그대로** 옮긴다 */
    plugins: [
      'expo-router',
      ['expo-splash-screen', { /* 그대로 */ }],
      'expo-secure-store',
      [
        '@mj-studio/react-native-naver-map',
        { client_id: process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID },
      ],
    ],
  },
};
```

⚠️ **원본 `app.json` 을 지우기 전에 백업해 둔다.** 둘이 같이 있으면 Expo 가 헷갈린다.
⚠️ 키는 `mobile/.env` 의 `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` 에 이미 있다(웹과 같은 등록, 안드로이드 패키지 `com.cuddlemarket.app` 추가 완료).

- [ ] **1-3.** 확인: `npx expo config --type public` 이 오류 없이 나오고, 플러그인 목록에 네이버가 있다.

- [ ] **1-4.** 개발 빌드를 다시 만들어 **폰에 다시 깐다.** 여기부터는 폰이 있어야 한다.

```bash
cd mobile && npx eas build --profile development --platform android
```

- [ ] **1-5.** 커밋

---

### Task 2: 플레이스 화면

**파일**
- 만듦: `mobile/app/(tabs)/(place)/index.tsx`
- 만듦: `mobile/app/(tabs)/(place)/_layout.tsx`
- 고침: `mobile/app/(tabs)/_layout.tsx` (탭 추가)

**쓰는 것** — 1·2층에서 만든 것들
```
getPlaces(params)                       lib/places/api
CATEGORIES · DEFAULT_CENTER             lib/places/types
<CategoryTabs selected onSelect />      components/places/category-tabs
<PlaceListItem place onPress />         components/places/place-list-item
```

- [ ] **2-1.** 탭을 더한다. **자리는 커뮤니티와 마이 사이**, 이름은 **「플레이스」**, 아이콘은 `MapPin`.
      ⚠️ 웹 하단 바(`src/components/bottom-nav/BottomNav.tsx`)와 순서·이름을 맞춘다.

- [ ] **2-2.** 지도를 깐다. 시작 자리는 `DEFAULT_CENTER`(서울시청).

- [ ] **2-3.** 지도가 멈추면 그때 보이는 네 귀퉁이로 `getPlaces` 를 부른다.
      ⚠️ **움직일 때마다 부르면 안 된다** — 손가락 한 번에 수십 번 나간다. 멈춘 뒤 한 번만.

- [ ] **2-4.** 핀을 찍는다. 핀을 누르면 그 장소로 상세 화면(`/places/[id]`)을 연다.

- [ ] **2-5.** 위에 `CategoryTabs`, 아래에 끌어올리는 목록.
      ⚠️ 목록이 탭바를 덮는다. `insets.bottom` 은 **측정되는 상자**에 준다(#843에서 겪었다).

- [ ] **2-6.** 게이트: `pnpm gate:mobile`

- [ ] **2-7.** 커밋

---

### Task 3: 실기기 확인

게이트가 초록이어도 **이건 따로 봐야 한다.** 지도는 그려지는 것이라 시험이 못 잡는다.

- [ ] 지도가 실제로 뜬다 (키가 틀리면 회색 판만 나온다)
- [ ] 카테고리를 바꾸면 핀이 바뀐다
- [ ] 지도를 옮기면 목록이 바뀐다
- [ ] 목록을 끌어올릴 수 있고, 눌러 상세로 간다
- [ ] **목록이 탭바에 안 가린다**
- [ ] 상세에서 뒤로 오면 보던 자리로 돌아온다

## 함정 (설계 §8 요약)

```
판 고정        npx expo install 로 넣는다. npm i 는 SDK 57 을 끌어온다
키 자리        app.config.js 로 바꿔 process.env 에서 읽는다
지도 안 뜸      회색 판만 보이면 키나 패키지 이름 등록을 의심한다
다시 조회       멈춘 뒤에 한 번만
아래 여백       insets.bottom 은 측정되는 상자에
```
