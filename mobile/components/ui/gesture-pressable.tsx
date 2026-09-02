import { Pressable, type PressableProps } from 'react-native-gesture-handler';
import type { AccessibilityActionEvent } from 'react-native';

// gesture-handler 누름판 + **화면 낭독기로도 눌리게** 한 것(#1115).
//
// ## 왜 이 조각이 있나
//
// 목록에 **붙는 줄**(sticky header)의 단추는 RN 의 `Pressable` 로는 안 눌린다.
// 붙은 줄은 원래 자리를 위에 둔 채 아래로 밀어서 그리는데, RN 은 손을 뗄 때
// 「아직 단추 안인가」를 **원래 자리**로 재고 손가락은 **보이는 자리**에 있다.
// 그래서 「밖으로 나갔다」로 보고 `onPress` 를 버린다(#935, RN 0.79.2 회귀).
// → gesture-handler 것은 네이티브 제스처로 판정해서 이 재기를 안 한다.
//
// ⚠️ **그런데 그것만 쓰면 화면 낭독기로 못 누른다.**
//
// ```
// react-native-gesture-handler 2.28.0 — Pressable.tsx
//   <GestureDetector gesture={gesture}>   ← onPress 는 여기서만 처리된다
//     <NativeButton accessible={…}>       ← 접근성 클릭을 받을 곳이 없다
// ```
//
// `onPress` 가 `GestureDetector` 에만 걸려 있는데, 그것은 **손가락이 실제로 화면에
// 닿는 것**을 본다. TalkBack 의 두 번 탭은 터치가 아니라 **「이 요소를 눌러라」는
// 접근성 명령**이라 그 판정을 안 거친다. 받을 곳이 없으니 그냥 사라진다.
//
// ⚠️ 그런데 `accessible` 은 그대로라 **「버튼. 활성화하려면 두 번 탭하세요」라고
//    안내까지 한다.** 안내는 하는데 눌리지는 않으니 **사용자는 자기가 잘못한 줄 안다.**
//    2026-09-01 에 실기기에서 확인했다 — 홈의 갈래·정렬·필터가 다 그랬다.
//
// → 그래서 **접근성 클릭을 따로 받아 `onPress` 로 잇는다.** 손가락 쪽은 그대로 두므로
//   #935 도 안 되살아난다. 둘 다 된다.
//
// ⚠️ **`onAccessibilityTap` 은 답이 아니다.** RN 0.81.5 타입에 **`@platform ios`** 로
//    적혀 있다(`ViewAccessibility.d.ts`). 안드로이드에서는 안 불린다.
//    ⇒ 양쪽에서 도는 `accessibilityActions` + `onAccessibilityAction` 을 쓴다.
//
// ## ⚠️ jest 로는 「진짜 눌리는가」를 못 잡는다
//
// 접근성 클릭은 네이티브가 보내는 것이라 실기기에서만 드러난다. 그래서 시험은
// **「결과」가 아니라 「원인」을 본다** — `activate` 액션이 달려 있는가, 그것을 쏘면
// `onPress` 가 불리는가. (저장소 CLAUDE.md 의 「원인을 직접 보는 시험을 써라」 참고.)

/** 낭독기가 「누르기」로 쓰는 표준 액션 이름. RN 의 `AccessibilityActionName` 값이다. */
const ACTIVATE = 'activate';

interface Props extends Omit<PressableProps, 'onPress'> {
  /**
   * 눌렀을 때 할 일.
   *
   * ⚠️ **인자를 안 받는다.** 원본은 누름 사건을 넘겨주지만, 접근성 클릭에는 그런 사건이
   *    아예 없어서 양쪽을 같은 함수로 이을 수가 없다. 지금 쓰는 곳이 넷인데 아무도
   *    사건을 안 봐서 이렇게 좁혔다 — 사건이 필요한 자리가 생기면 그때 다시 본다.
   */
  onPress?: () => void;
}

export function GesturePressable({
  onPress,
  accessibilityActions,
  onAccessibilityAction,
  ...rest
}: Props) {
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      // 쓰는 쪽이 자기 액션을 줬으면 그것도 살리고 `activate` 만 보탠다.
      // 지금은 아무도 안 주지만, 나중에 「지우기」 같은 것을 더할 때 이 조각을
      // 고치지 않아도 되게 해 둔다.
      accessibilityActions={
        accessibilityActions?.some((action) => action.name === ACTIVATE)
          ? accessibilityActions
          : [...(accessibilityActions ?? []), { name: ACTIVATE }]
      }
      onAccessibilityAction={(event: AccessibilityActionEvent) => {
        if (event.nativeEvent.actionName === ACTIVATE) onPress?.();
        // 쓰는 쪽이 다른 액션을 다뤄야 할 수도 있으니 그대로 넘겨준다
        onAccessibilityAction?.(event);
      }}
    />
  );
}
