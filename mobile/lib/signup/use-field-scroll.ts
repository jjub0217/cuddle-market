import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, type LayoutChangeEvent, type ScrollView } from 'react-native';

// 포커스한 칸이 키보드에 가리지 않게 스크롤한다. A안·B안이 같이 쓴다.
//
// 왜 손으로 만드나: ScrollView는 포커스를 자동으로 따라가지 않는다. 특히 안드로이드에서
// app.json의 android.edgeToEdgeEnabled가 켜져 있으면 OS의 기본 「창 줄이기」도
// 예전처럼 안 먹는 것으로 알려져 있다.
//
// react-native-keyboard-controller 같은 전용 라이브러리가 더 매끄럽지만 새 네이티브
// 모듈이라 Expo Go에서 안 돈다. 그러면 A·B를 Expo Go로 비교하는 계획이 깨진다.

/** 칸 아래에 이만큼 여유를 두고 멈춘다. 다음 칸이 살짝 보여 흐름이 끊기지 않는다. */
const BOTTOM_GAP = 24;

export function useFieldScroll() {
  const scrollRef = useRef<ScrollView>(null);

  // 칸마다 "스크롤 안에서의 세로 위치와 높이"를 적어 둔다.
  const positions = useRef<Record<string, { y: number; height: number }>>({});
  const viewportHeight = useRef(0);
  const scrollOffset = useRef(0);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const onScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    viewportHeight.current = event.nativeEvent.layout.height;
  }, []);

  const onScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  }, []);

  /** 각 칸을 감싼 View에 붙인다. 위치를 적어 두는 일만 한다. */
  const registerField = useCallback(
    (key: string) => (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      positions.current[key] = { y, height };
    },
    []
  );

  /**
   * 칸에 포커스가 갔을 때 부른다. 가려질 때만 스크롤한다 —
   * 이미 잘 보이는 칸까지 위로 끌어올리면 화면이 튄다.
   */
  const focusField = useCallback(
    (key: string) => () => {
      // 키보드가 올라오는 애니메이션이 끝난 뒤에 재야 위치가 맞는다.
      setTimeout(() => {
        const field = positions.current[key];
        if (!field || viewportHeight.current === 0) return;

        const visibleBottom = viewportHeight.current - keyboardHeight;
        const fieldBottomOnScreen = field.y + field.height - scrollOffset.current;
        if (fieldBottomOnScreen <= visibleBottom - BOTTOM_GAP) return;

        const target = field.y + field.height - visibleBottom + BOTTOM_GAP;
        scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
      }, 180);
    },
    [keyboardHeight]
  );

  return { scrollRef, onScrollViewLayout, onScroll, registerField, focusField, keyboardHeight };
}
