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
| `useBottomTabBarHeight()` | **탭 화면 안에서만** 돈다. 루트 화면에서 부르면 못 쓴다 | 루트에 그리는 것(토스트 등)은 값을 재서 못 박는다 (`insets.bottom + 72`) |
| `textShadow` | **글자 기반 아이콘**(MaterialIcons)에만 먹는다. SVG 아이콘(Lucide)엔 안 먹는다 | 그림자용 아이콘을 뒤에 깐다. **타입체크도 린트도 안 잡아준다** — 실기기로 봐야 안다 |
| 화면을 한 스택에만 두기 | 다른 탭에서 그 화면으로 가면 탭이 튄다 | 두 스택에 같은 화면을 두고, `useSegments()`로 지금 그룹을 읽어 경로를 만든다 |
| `(home)` 스택의 `headerShown` | 화면마다 적으면 새 화면을 더할 때 빠뜨린다 | `screenOptions`로 통째로 끈다 |
| 팬(병렬 에이전트) 동시 커밋 | `.git/index.lock`에서 부딪힌다 | 팬은 구현·게이트만. 커밋은 리드가 한다 |
| Expo Go에서 됨 ≠ 독립 빌드에서 됨 | EAS가 `pnpm install`을 새로 돌린다 | 의존성을 바꿨으면 EAS 빌드로 한 번 확인한다 |

## API를 붙일 때

**응답 DTO를 직접 열어본다.** 「다른 API가 이러니 이것도 그렇겠지」는 추측이다. 9바퀴에 이걸 안 해서 차단 목록이 늘 비어 있었고, **테스트까지 같은 가정으로 써서 틀린 모양을 통과시켰다.**

```
가정   { data: { content } }        · userId
실제   { data: { blockedUsers } }   · blockedUserId
```

찾는 법은 저장소 루트 `CLAUDE.md`의 「백엔드 저장소」 항목에 있다.
