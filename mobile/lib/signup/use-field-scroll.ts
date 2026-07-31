import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, type LayoutChangeEvent, type ScrollView } from 'react-native';

// 포커스한 칸이 키보드에 가리지 않게 스크롤한다. A안·B안이 같이 쓴다.
//
// 왜 손으로 만드나: ScrollView는 포커스를 자동으로 따라가지 않는다. 특히 안드로이드에서
// app.json의 android.edgeToEdgeEnabled가 켜져 있으면 OS의 기본 「창 줄이기」도
// 예전처럼 안 먹는다(실기기로 확인했다 — 생년월일에 포커스해도 그 칸이 키보드 아래 남았다).
//
// react-native-keyboard-controller 같은 전용 라이브러리가 더 매끄럽지만 새 네이티브
// 모듈이라 Expo Go에서 안 돈다. 그러면 A·B를 Expo Go로 비교하는 계획이 깨진다.
//
// ⚠️ 순서 함정: 포커스가 먼저 오고 키보드는 그 뒤에 올라온다. 포커스 시점의 키보드
// 높이는 아직 0이라, 그 값으로 계산하면 "안 가려짐"으로 잘못 판단한다. 그래서 높이를
// ref에 담아 두고, 키보드가 올라온 뒤에도 한 번 더 맞춘다.

/** 칸 아래에 이만큼 여유를 두고 멈춘다. 다음 칸이 살짝 보여 흐름이 끊기지 않는다. */
const BOTTOM_GAP = 24;

export function useFieldScroll() {
  const scrollRef = useRef<ScrollView>(null);

  // 칸마다 "스크롤 안에서의 세로 위치와 높이"를 적어 둔다.
  const positions = useRef<Record<string, { y: number; height: number }>>({});
  const viewportHeight = useRef(0);
  const scrollOffset = useRef(0);
  const focusedKey = useRef<string | null>(null);

  // 화면 여백에는 state가, 계산에는 ref가 필요하다.
  // state만 쓰면 setTimeout 안에서 옛 값을 보게 된다.
  const keyboardHeightRef = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /** 지금 포커스된 칸이 가려졌으면 보이게 스크롤한다. 잘 보이면 아무것도 안 한다. */
  const ensureVisible = useCallback(() => {
    const key = focusedKey.current;
    if (!key) return;

    const field = positions.current[key];
    if (!field || viewportHeight.current === 0) return;

    const visibleBottom = viewportHeight.current - keyboardHeightRef.current;
    const fieldBottomOnScreen = field.y + field.height - scrollOffset.current;
    // 이미 잘 보이는 칸까지 위로 끌어올리면 화면이 튄다.
    if (fieldBottomOnScreen <= visibleBottom - BOTTOM_GAP) return;

    const target = field.y + field.height - visibleBottom + BOTTOM_GAP;
    scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardHeightRef.current = event.endCoordinates.height;
      setKeyboardHeight(event.endCoordinates.height);
      // 키보드 높이를 알게 된 지금이 진짜 계산 시점이다.
      ensureVisible();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [ensureVisible]);

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
   * 칸에 포커스가 갔을 때 부른다.
   * 키보드가 이미 떠 있으면 여기서 맞고, 아직이면 keyboardDidShow에서 다시 맞춘다.
   */
  const focusField = useCallback(
    (key: string) => () => {
      focusedKey.current = key;
      setTimeout(ensureVisible, 120);
    },
    [ensureVisible]
  );

  /** 입력칸이 아닌 것(거주지 선택 등)을 누를 때. 키보드를 내리고 그 자리를 비운다. */
  const blurFields = useCallback(() => {
    focusedKey.current = null;
    Keyboard.dismiss();
  }, []);

  return {
    scrollRef,
    onScrollViewLayout,
    onScroll,
    registerField,
    focusField,
    blurFields,
    keyboardHeight,
  };
}
