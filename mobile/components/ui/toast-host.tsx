import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TOAST_DURATION_MS, useToastStore } from '@/lib/toast';

// 토스트가 실제로 그려지는 곳. 앱 맨 바깥(_layout)에 한 번만 둔다.
//
// 화면 안에 두면 안 된다 — 신고 화면은 성공하면 스스로 닫히는데, 거기서 그리면
// 토스트도 같이 사라져 아무것도 안 보인다.
//
// 하단 탭바 위에 뜬다. pointerEvents="none"이라 뒤의 버튼을 가리지 않는다 —
// 알림일 뿐 누를 것이 없다.

const FADE_MS = 180;

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
      style={[styles.toast, { opacity, bottom: insets.bottom + 24 }]}
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
    // 하단 탭바(56) 위로 올린다. bottom은 안전영역까지 더해 쓰는 쪽에서 정한다.
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    // 앱의 확인 창 덮개와 같은 먹색 계열
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
