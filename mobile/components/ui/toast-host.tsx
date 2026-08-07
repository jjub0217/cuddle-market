import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { TOAST_DURATION_MS, useToastStore } from '@/lib/toast';

// 토스트가 실제로 그려지는 곳. 앱 맨 바깥(_layout)에 한 번만 둔다.
//
// 화면 안에 두면 안 된다 — 신고 화면은 성공하면 스스로 닫히는데, 거기서 그리면
// 토스트도 같이 사라져 아무것도 안 보인다.
//
// 하단 탭바 위에 뜬다. pointerEvents="none"이라 뒤의 버튼을 가리지 않는다 —
// 알림일 뿐 누를 것이 없다.

const FADE_MS = 180;

/**
 * 하단 탭바를 비켜 가려고 띄우는 높이(안전영역 위로).
 *
 * 탭바 높이를 실행 중에 물어볼 방법이 없다 — `useBottomTabBarHeight()`는 탭 화면
 * **안에서만** 돌고, 이 조각은 탭 밖(루트 _layout)에 있다. 화면이 바뀌어도 살아남아야
 * 해서 거기 둔 것이라 옮길 수도 없다.
 *
 * 그래서 실측값으로 못 박는다. 실기기(411dp 폭) 스크린샷에서 잰 값이다.
 *   시스템 내비(insets.bottom) 약 44 · 탭바 본문 약 53 · 화면 바닥에서 탭바 위까지 98
 * 56(탭바) + 16(여백)이면 안전영역이 0인 기기에서도 탭바를 비킨다.
 *
 * ⚠️ 앞의 56은 `app/(tabs)/_layout.tsx` 의 `TAB_BAR_HEIGHT` 다. **거기를 바꾸면 여기도 바꾼다.**
 *
 * 탭바 모양을 바꾸면(아이콘·글자 크기 등) 이 값도 같이 봐야 한다.
 */
const TAB_BAR_CLEARANCE = 72;

export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const seq = useToastStore((state) => state.seq);
  const hide = useToastStore((state) => state.hide);
  const insets = useSafeAreaInsets();

  // 사라지는 동안에도 글자가 남아 있어야 해서 따로 들고 있는다.
  const [shown, setShown] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;

    setShown(message);
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setShown(null);
        hide();
      });
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
    // seq가 있어야 같은 문구를 연달아 띄울 때도 다시 돈다.
  }, [message, seq, opacity, hide]);

  if (!shown) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { opacity, bottom: insets.bottom + TAB_BAR_CLEARANCE }]}
    >
      <Text style={styles.label}>{shown}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    // bottom은 안전영역 + TAB_BAR_CLEARANCE로 위에서 정한다.
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    // 앱의 확인 창 덮개와 같은 먹색 계열
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.onAction,
    textAlign: 'center',
  },
});
