import { useRef, useState } from 'react';

// 앱 어디를 눌러도 **고른 글자가 풀리게** 한다(#992). 화면마다 따로 만들면 또 갈리므로
// 규칙을 여기 한 곳에 모은다.
//
// ## 왜 이렇게까지 하나
//
// RN 의 <Text selectable> 은 안드로이드의 TextView 를 그대로 쓴다. 그 선택은 **글자가
// 초점을 잃을 때** 풀리는데, RN 화면의 다른 요소(View·이미지)는 초점을 안 가져간다.
// 그래서 빈 곳을 눌러도 선택과 도구 띠가 그대로 남는다. 우리 실수가 아니라 RN 의 동작이다.
//
// ## 안 되는 방법 둘 (2026-08-20~21 실기기에서 겪었다)
//
// ```
// ① 글자를 <Pressable> 로 감싼다                → 꾹 누르기가 **통째로 죽는다**
// ② 부모 View 에 onStartShouldSetResponder      → 마찬가지로 죽는다
// ③ 배경에 <Pressable absoluteFill> 을 깐다     → 안 죽지만 **거의 안 먹는다**
//    배경은 「그 위에 아무 뷰도 없는 자리」에서만 누름을 받는데, 사진·글자가 화면의
//    대부분을 덮고 있다. 실제로 풀린 것은 「다른 글자를 눌러 선택이 옮겨간」 경우였다
// ```
//
// ## 키보드는 건드리지 않는다
//
// 여기서 `Keyboard.dismiss()` 를 부르면 **댓글칸을 탭할 때 키보드가 올라오자마자 내려간다**
// (2026-08-21 실기기에서 겪었다). 탭인지 「칸을 누른 것」인지 우리는 못 가른다.
//
// 안 불러도 된다. 우리는 누름을 **안 뺏으므로** ScrollView 의
// `keyboardShouldPersistTaps="handled"` 가 원래대로 빈 곳 누름을 받아 키보드를 내린다.
// (배경에 Pressable 을 깔았을 때는 그걸 뺏어서 우리가 대신 내려야 했다.)
//
// 셋 다 **누름을 잡으려** 했다. 잡으면 그 누름이 우리 것이 되어 네이티브 TextView 까지
// 안 간다 — 그래서 꾹 누르기가 죽는다.
//
// ## 되는 방법 — 잡지 않고 구경만 한다
//
// onTouchStart/onTouchEnd 는 responder 를 안 가져간다. 화면 어디서 시작된 누름이든
// 위로 올라오는 것을 **보기만** 한다. 짧게 눌렀다 떼면(탭) 글자를 다시 그려 선택을 풀고,
// 길게 누르면(글자를 고르는 중이다) 가만둔다.

/** 이보다 짧게 눌렀다 떼면 「탭」으로 본다. 이보다 길면 글자를 고르는 중이라 가만둔다. */
const TAP_MS = 300;

/**
 * 이 누름이 「탭」인가. 탭이면 선택을 풀고, 아니면(꾹 누름) 가만둔다.
 *
 * 훅에서 떼어 놓은 이유는 **이 판단만 시험할 수 있어서**다. 실제로 안드로이드의 선택이
 * 풀리는지는 실기기로만 볼 수 있다(mobile/AGENTS.md).
 */
export function 탭인가(누른때: number, 뗀때: number): boolean {
  return 뗀때 - 누른때 < TAP_MS;
}

export interface SelectionClear {
  /**
   * 이 값이 바뀌면 `selectable` 글자가 다시 그려지고, 그 김에 선택도 풀린다.
   * `<Text key={`이름-${열쇠}`} selectable>` 처럼 쓴다.
   */
  열쇠: number;
  /** 화면 맨 바깥 View 에 `{...누름구경}` 으로 펼쳐 단다. */
  누름구경: {
    onTouchStart: () => void;
    onTouchEnd: () => void;
  };
}

export function useSelectionClear(): SelectionClear {
  const [열쇠, set열쇠] = useState(0);
  const 누른때 = useRef(0);

  return {
    열쇠,
    누름구경: {
      onTouchStart: () => {
        누른때.current = Date.now();
      },
      onTouchEnd: () => {
        if (!탭인가(누른때.current, Date.now())) return;
        set열쇠((n) => n + 1);
      },
    },
  };
}
