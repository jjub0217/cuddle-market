# 지도 마커 그림 (`map-marker*.png`)

지도 위 장소 마커다. **웹과 같은 그림**이어야 한다 — 원본은 웹 코드에 있는 SVG 다
(`src/features/map/NaverMap.tsx` 의 `createMarkerIcon`).

```
map-marker.png      36×44     @1x
map-marker@2x.png   72×88
map-marker@3x.png  108×132
```

## 왜 PNG 인가

라이브러리(`@mj-studio/react-native-naver-map`)가 커스텀 뷰 대신 **이미지를 권한다.**
커스텀 뷰는 이미지 캐싱이 안 되고 마커 하나당 자원을 많이 먹는데, 이 화면은
마커가 100개까지 나온다(동물병원).

그래서 웹은 SVG 를 인라인으로 쓰고, 앱은 그 SVG 를 **PNG 로 구워** 쓴다.

## ⚠️ 색이나 모양을 바꿀 때

**웹 SVG 와 이 PNG 를 함께 고쳐야 한다.** 한쪽만 고치면 두 화면이 갈린다.
색 값은 세 곳에 있다.

```
src/styles/tokens.colors.css        --color-map-marker
src/features/map/NaverMap.tsx       MARKER_COLOR   ← 웹이 실제로 쓰는 값
mobile/constants/colors.ts          mapMarker      ← 「이 PNG 가 무슨 색인지」 기록용
```

## 다시 굽는 법

저장소 루트에서 아래를 파일로 만들어 `node` 로 돌린다. Playwright 가 이미 깔려 있다.

```js
import pw from 'playwright'
const COLOR = '#6B5C4B'                    // ← 바꿀 색
const OUT = 'mobile/assets/images/'
const SVG = (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="-2 -2 36 44"><path d="M16 38.5C16 38.5 2.5 24 2.5 14.5a13.5 13.5 0 1 1 27 0C29.5 24 16 38.5 16 38.5z" fill="${COLOR}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="16" cy="14.5" r="5" fill="#fff"/></svg>`

const browser = await pw.chromium.launch({ channel: 'chrome' })
for (const [suffix, scale] of [['', 1], ['@2x', 2], ['@3x', 3]]) {
  const w = 36 * scale, h = 44 * scale
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.setContent(`<body style="margin:0;background:transparent">${SVG(w, h)}</body>`)
  await page.screenshot({ path: `${OUT}map-marker${suffix}.png`, omitBackground: true })
  await page.close()
}
await browser.close()
```

⚠️ `omitBackground: true` 를 빼면 **흰 사각형이 배경으로 들어간다.** 지도 위에 얹히므로
투명해야 한다.

⚠️ `viewBox` 를 `-2 -2 36 44` 로 두는 것은 흰 테두리(`stroke-width` 2.5)가 바깥으로
1.25 나가기 때문이다. 여백 없이 `0 0 32 40` 으로 구우면 **위쪽 테두리가 잘린다** —
실제로 잘려서 고쳤다.

굽고 나면 맨 윗줄이 투명한지 확인한다.

```bash
python3 -c "
from PIL import Image
im = Image.open('mobile/assets/images/map-marker@3x.png').convert('RGBA')
print(len([p for p in [im.getpixel((x,0)) for x in range(im.size[0])] if p[3] > 200]), '개 (0이어야 한다)')
"
```
