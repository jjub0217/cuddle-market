# 모바일 웹 더보기 메뉴를 드롭다운으로 — 설계

> 2026-08-23(일). 마이페이지 ⋮ 의 「아래에서 올라오는 시트」를 드롭다운으로 바꾼다. 이슈 #1030.

## 왜 하나

**모바일 웹은 모바일 앱이 아니라 데스크탑 웹의 반응형이다.** 아래에서 올라오는 시트는 앱에 맞는 모양이고, 웹에서 「이 항목에 대한 할 일」을 고르는 메뉴는 **단추에 붙는 드롭다운**이 맞다.

웹의 더보기 메뉴는 세 곳인데 **여기만 다르다.**

```
채팅방 ⋮            ChatRoomInfo.tsx:206     드롭다운
남의 프로필 ⋮        ProfileData.tsx:206      드롭다운
마이페이지 상품 ⋮     MyList.tsx:178           시트     ← 이것만
```

### 지도의 시트는 안 건드린다 — 다른 물건이다

```
MobilePlaceListOverlay.tsx · PlaceDetailSlideCard.tsx
   = 「목록」과 「상세」. 좁은 폭에서 놓을 자리가 없어 아래로 뺀 **화면**이다
   = 메뉴가 아니다. BottomSheet.tsx 를 쓰지도 않는다 — 각자 따로 짰다
```

「화면을 놓을 자리가 없어 아래로 뺀 것」과 「메뉴를 아래에서 올린 것」은 다른 물건이다. 코드도 실제로 갈라져 있어서, 시트 조각을 지워도 지도는 멀쩡하다.

## 무엇을 만드나

**공통 조각 하나를 새로 만들고, `MyList` 의 시트 자리만 갈아 끼운다.**

```
새로   src/components/commons/DropdownMenu.tsx
고침   MyList.tsx:184~227          BottomSheet → DropdownMenu
지움   src/components/commons/BottomSheet.tsx        145줄
       src/app/globals.css:110~132                  bottom-sheet-rise
옮김   BottomSheet.test.tsx 18개 중 드롭다운에도 해당하는 것
```

`BottomSheet` 를 쓰는 곳은 `MyList` **하나뿐**이라 지워도 된다(전수 grep 확인). ⚠️ 앱의 `mobile/components/ui/bottom-sheet.tsx` 는 **완전히 다른 파일**이고 앱 5곳이 쓴다 — 무관하다.

### 왜 공통 조각인가

지금 드롭다운 셋이 다 따로 짜여 있고 각자 구멍이 다르다.

```
ChatRoomInfo   role=menu 없음 · aria 전무 · z-50 을 손으로 박음 · 시험 없음
               ⚠️ 자르는 조상 두 겹 안에 있다(ChattingPage.tsx:304,319 의 overflow-hidden)
ProfileData    낱말은 완비 · 자리잡기 없음 · 메뉴 시험 없음
```

공통 조각을 만들어 두면 나중에 저 둘도 옮겨 붙일 수 있다. **다만 이번엔 `MyList` 만 갈아 끼운다** — 한 번에 셋을 건드리면 무엇이 깨졌는지 못 가린다.

## 새 조각이 갖춰야 할 것

세 본보기에서 좋은 것만 모으고, **아무도 안 갖고 있는 것 하나를 손으로 더한다.**

```
낱말·항목모양   ProfileData      role="menu" · menuitem · aria-haspopup · aria-expanded
여닫기         useOutsideClick   바깥 누르기 + ESC 를 한 훅이 한다
자리잡기        SelectDropdown   portal + fixed + getBoundingClientRect + scroll/resize 재계산
표식           ★ 직접           data-overlay-above  ← 셋 중 아무도 안 단다
```

### ① 잘림 — portal 로 나가야 한다

`absolute` 로 두면 자르는 조상이 **둘**이다.

```
MyPagePanel.tsx:203   productCount > 1  →  'scrollbar-hide max-h-[60vh] overflow-y-auto'
                      productCount <= 1 →  'overflow-visible'   ← 상품 1개로 시험하면 안 걸린다
MyPage.tsx:807        모바일 패널의 overflow-y-auto
```

지금 시트는 `createPortal(document.body)` 로 둘 다 넘고 있다. 드롭다운도 같은 길로 가되, 자리는 `getBoundingClientRect` 로 잡는다(`SelectDropdown.tsx:184~205` 가 본). 오른쪽 정렬이므로 `left` 가 아니라 **`right` 로 재는 것**이 맞다.

### ② ESC — 표식을 손으로 달아야 한다

마이페이지에서는 오버레이가 **세 겹**까지 쌓인다.

```
패널  →  상품 메뉴  →  삭제 모달
셋이 다 ESC 를 듣는다. 안 가르면 한 번 눌러서 패널까지 닫힌다 (#1003)
```

바깥(패널)이 자기 ESC 처리 앞에서 묻는다.

```js
// MyPage.tsx:476
if (document.querySelector(`dialog[open], [${OVERLAY_ABOVE_ATTR}]`)) return
```

지켜야 할 것 다섯:

```
1  열려 있는 동안 뿌리에 data-overlay-above 를 단다
2  닫히면 그 노드가 DOM 에서 사라져야 한다 — `isOpen && …` 조건부 렌더
   ⚠️ `hidden` 으로 숨기기만 하면 표식이 남아 **패널이 영영 ESC 로 안 닫힌다**
3  안쪽에서 preventDefault() 로 「내가 먹었다」 표시 금지 (ui.ts:83~84)
   그 위 네이티브 모달이 ESC 로 안 닫히게 된다
4  ESC 리스너는 **버블**로. 패널이 캡처를 쓰므로(MyPage.tsx:479) 캡처끼리 붙으면 차례가 뒤집힌다
5  ESC 는 메뉴만 닫고 카드 링크 이동을 일으키지 않는다
```

⚠️ **저장소에서 이 표식을 다는 곳은 `BottomSheet.tsx:82` 하나뿐이다.** 기존 드롭다운 셋은 아무도 안 단다 — **본보기를 베끼는 것만으로는 절대 안 따라온다.**

⚠️ 지금 넓은 폭 상태 드롭다운(`MyList.tsx:248`)이 표식 없이도 무사한 것은, 그것이 `isMd`(≥768)에서만 그려지고 패널 가드는 `isMobile`(≤767)에서만 켜져 **둘이 절대 같이 안 뜨기** 때문이다. ⋮ 를 좁은 폭 드롭다운으로 바꾸는 순간 **그 우연한 안전장치가 사라진다.**

### ③ fixed 의 기준점

```jsx
// MyList.tsx:145
<Link className="… transition-all duration-500 hover:-translate-y-1 …">
                                      ↑ 마우스를 올리면 transform 이 생긴다
```

**`transform` 이 걸린 조상은 `position: fixed` 의 기준점이 된다.** `<Link>` 안에 두고 `fixed` 를 쓰면 마우스를 올렸다 뗄 때마다 메뉴가 튄다. portal 로 `body` 에 내보내면 안전하다.

⚠️ 마우스가 없는 실기기에서는 안 나타나 **데스크탑에서만 걸릴 수 있다.**

### ④ 링크 안이라는 사실은 안 바뀐다

카드가 통째로 `<Link>`(`MyList.tsx:143`, 닫는 곳 `:268`)다. **portal 을 써도 리액트 사건은 리액트 트리를 탄다.** 안 막으면 항목을 눌렀는데 상세로 넘어간다(#793).

```
onClick      stopPropagation + preventDefault   그대로 옮긴다
onMouseDown  stopPropagation                    그대로 옮긴다
키 이벤트     ⚠️ **막지 않는다** — 막으면 ESC 가 document 까지 못 올라간다
```

### ⑤ z-index — 새 토큰이 필요 없다

```
모바일 패널   Z_INDEX.MODAL  z-[100]
시트          Z_INDEX.MODAL  z-[100]   ← 같은 값인데 body 에 나중에 붙어서 이긴다
```

드롭다운도 같은 방법을 쓴다. 이 자리에서 이미 검증된 방식이다.

⚠️ **portal 감싸개에도 z 를 준다.** `position` 이 있고 `z-index` 가 `auto` 면 감싸개가 「z-index 0」 자리에 놓여, **안쪽이 아무리 큰 z 를 가져도 그 자리를 못 벗어난다.** `z-1` 상품 카드가 목록을 덮은 적이 있다(#869).

### ⑥ 초점

가둠(`useFocusTrap`)은 **뺀다** — 드롭다운은 모달이 아니고, 「탭 하면 닫히고 다음으로」가 표준이다. 다만 **닫을 때 ⋮ 로 초점 되돌리기**는 남긴다. 지금 시트가 해 주던 일이라 빼면 뒷걸음질이다.

## 메뉴 항목은 그대로

`MyList` 가 도는 탭은 **판매·구매 둘뿐**이다. 찜은 `ProductCard` 격자라 ⋮ 가 없다(`MyPagePanel.tsx:191`).

| 탭 | 거래 상태 | 보이는 항목 |
|---|---|---|
| 판매 | `SELLING` | 예약중으로 · 판매완료로 · 수정하기 · **삭제** |
| 판매 | `RESERVED` | 판매중으로 · 판매완료로 · 수정하기 · **삭제** |
| 판매 | `COMPLETED` | **삭제** 하나뿐 |
| 구매 | `SELLING`·`RESERVED` | 구매완료로 · 수정하기 · **삭제** |
| 구매 | `COMPLETED` | **삭제** 하나뿐 |

⚠️ **완료 상태에서는 「삭제」 한 줄뿐이다.** 한 줄짜리 작은 상자가 되므로 **눌림 자리가 너무 작아지지 않게** 최소 높이를 챙긴다.

⚠️ 항목 글자는 **왼쪽 정렬**로 바꾼다. 시트가 가운데 정렬이던 까닭은 「바닥 시트라 줄 끝이 들쭉날쭉」이었고(`BottomSheet.tsx:136~137`), 드롭다운에는 해당하지 않는다. `text-danger-500` 은 유지한다.

## 시험

`BottomSheet.test.tsx` 18개 중 **드롭다운에도 해당하는 것**을 새 조각으로 옮긴다. 특히 이 둘은 **저장소에서 #1003 규약을 지키는 유일한 시험**이라 빠뜨리면 안 된다.

```
'열려 있는 동안 「내가 위에 있다」는 표식을 단다'   :76~80
'닫히면 표식도 같이 사라진다'                    :82~86
```

같이 옮길 것: 바깥 누르면 닫힘 · ESC 로 닫힘 · **링크 안에서 항목을 눌러도 바깥 링크가 안 눌린다**(2개) · 닫으면 원래 자리로 초점 되돌림 · danger 색.

옮기지 않을 것: 뒤 화면 스크롤 잠금 · 초점 가둠(탭 순환) · 글자 가운데 정렬 — 드롭다운에는 해당 없음.

⚠️ `MyPage` 쪽 가드에는 **시험이 아예 없다**(`MyPage.tsx`·`MyList.tsx` 는 시험 파일 자체가 없다). 이번에 새로 만들지는 않는다 — 범위를 넘는다.

## 눈으로 확인할 것 셋 — jsdom 이 못 잡는다

```
1  상품 **2개 이상**인 목록에서 마지막 카드의 ⋮ 를 열어 메뉴가 안 잘리는지
   ⚠️ 상품 1개로 시험하면 안 걸린다 (MyPagePanel.tsx:204 가 overflow-visible)
2  ⋮ 열고 ESC → 메뉴만 닫히고 마이페이지 패널은 남는지
   ★ 마커 검증: data-overlay-above 한 줄만 빼고 다시 재서 **패널이 같이 닫히는 것**을
     확인한 뒤 되돌린다. 「고쳤다」가 아니라 「이것 때문이다」를 증명한다
3  카드에 마우스를 올린 채 ⋮ 를 열었다 떼기 → 메뉴가 튀지 않는지 (③ transform 함정)
```

재는 법은 이미 깔린 크롬을 쓴다 — `chromium.launch({ channel: 'chrome' })`.

## 이번에 안 하는 것

```
ChatRoomInfo · ProfileData 이관   다음 단계. 한 번에 셋을 건드리면 무엇이 깨졌는지 못 가린다
                                 ⚠️ ChatRoomInfo 는 자르는 조상 두 겹 안이라 같은 위험이 잠재해 있다
넓은 폭(768+)                     원래 ⋮ 가 없다. 붙박이 단추 열이 그대로다
                                 → isMd 분기(MyList.tsx:81)는 남는다
지도의 시트 둘                     위에 적은 대로 다른 물건이다
MyPage ESC 가드 시험 새로 만들기    범위 밖
```

## 관련

- #1003 ESC 세 겹 · #869 portal 감싸개 z · #793 링크 안에서 눌림 · #981 초점
- 조사 근거는 이슈 #1030 본문에 있다
