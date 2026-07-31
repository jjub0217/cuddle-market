import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet } from 'react-native';

// 아래에서 올라오는 시트의 껍데기. 안에 무엇을 담을지는 쓰는 쪽이 정한다.
//
// 원래 product-action-sheet.tsx 안에만 있던 것을 빼냈다. 회원가입의 거주지 선택도
// 같은 모양이어야 해서다 — 두 시트가 따로 놀면 같은 앱으로 안 보인다.
//
// 왜 Modal의 animationType="slide"를 안 쓰나:
// 그 값은 길이·곡선을 정할 수 없고, 실기기에서 올라오는 속도가 툭 튀어 보였다.
// animationType="none"으로 두고 직접 움직인다. 새 의존성 없이 내장 Animated면 된다.

/** 열 때는 조금 느긋하게, 닫을 때는 빠르게 — 닫기는 이미 결정한 동작이라 기다릴 이유가 없다. */
const OPEN_MS = 300;
const CLOSE_MS = 200;

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, children }: Props) {
  // Modal을 언제 떼어낼지. 닫는 애니메이션이 끝난 뒤에 떼어야 사라지는 모습이 보인다.
  const [mounted, setMounted] = useState(visible);
  // 시트 높이를 재서 그만큼만 움직인다. 재기 전에는 넉넉한 값으로 시작한다.
  const [sheetHeight, setSheetHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: OPEN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: CLOSE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || 320, 0],
  });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* 취소 버튼을 따로 두지 않는다. 바깥을 누르면 닫힌다. */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기">
        <Animated.View style={[styles.backdropFill, { opacity: progress }]} />
        {/* 시트 안을 눌렀을 때 닫히지 않도록 바깥 Pressable의 터치를 여기서 멈춘다. */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <Pressable
            onPress={() => {}}
            onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          >
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/** 시트 안 항목의 공용 모양. 두 시트가 같은 값을 쓴다. */
export const sheetItemStyles = StyleSheet.create({
  item: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  itemPressed: {
    backgroundColor: '#F9FAFB',
  },
  label: {
    fontSize: 16,
    color: '#111827',
  },
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  /** 덮개 색을 따로 둔 이유: 시트와 같이 서서히 짙어지게 하려고 투명도를 애니메이션한다. */
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    // 앱의 다른 모달 세 곳(로그아웃 · 탈퇴 · 삭제 확인)과 같은 값.
    // 웹 모달의 backdrop:bg-gray-900/70 과도 같다.
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    // 아래는 화면 끝에 붙으므로 위쪽 모서리만 둥글게.
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    // 위아래 여백을 두지 않는다.
    // 여백이 있으면 첫·마지막 항목만 구분선 바깥으로 더 넓어 보인다 — 실기기에서
    // "삭제 버튼만 높아 보인다"로 나타났다. 항목 높이 56이 넉넉해 여백이 따로 필요 없다.
    //
    // 안전영역(insets.bottom)도 더하지 않는다. 안드로이드에서 RN Modal은 시스템
    // 내비게이션 바 아래까지 그리지 않아, 더하면 그 높이만큼 빈 자리가 남는다.
  },
});
