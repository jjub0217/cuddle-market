import { useRouter } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoutModal } from '@/components/my/logout-modal';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth/store';
import { ACCOUNT_DELETION_URL, PRIVACY_URL, SUPPORT_MAIL_URL } from '@/lib/support-links';

// 헤더 햄버거(☰)로 여는 전체 화면 메뉴.
//
// 왜 하단 시트가 아니라 오버레이인가:
// 웹 모바일이 전체 화면 오버레이를 쓴다(MobileNavigation). 같은 버튼을 눌렀는데
// 웹과 앱이 다른 모양으로 열리면 같은 서비스로 안 보인다.
// (한때 시트로 만들었다가 되돌렸다 — 항목 수가 적다는 이유였는데, 통일이 먼저다.)
//
// 왜 여기 셋뿐인가:
// 로그인 없이도 닿아야 하는 것은 햄버거, 로그인해야 의미 있는 것은 마이 —
// 가 웹과 앱의 공통 기준이다. 셋 다 로그인과 무관한 안내라 여기 있다.
// 그래서 헤더의 햄버거는 벨과 달리 로그아웃 상태에서도 늘 보인다.
//
// 마이 탭에도 같은 항목이 있다. 웹이 푸터와 모바일 내비 양쪽에 두고 있어 그것을 따랐다 —
// 찾는 사람이 어느 쪽으로 가든 닿아야 한다.

const HEADER_HEIGHT = 52;

/** 웹 MobileNavigation의 `duration-300`과 같은 값. */
const SLIDE_MS = 300;

// 위쪽 버튼 두 개는 앱의 다른 「끝내는 단추」와 같은 브랜드 갈색이다(#786에서 정했다).
//
// ⚠️ 웹은 여기 `--color-primary-200`(#ECC88E)을 쓰는데 **그 값은 안 가져온다.**
//    흰 글자 대비가 1.59:1 로 WCAG AA(본문 4.5:1)에 한참 못 미친다.
//    지금 값(#633F00)은 9.37:1 이다. 웹의 그 자리를 고치는 일은 아직 남아 있다.
//
// 로그아웃 확인 창(logout-modal.tsx)도 같은 값을 쓴다 — 두 창이 나란히 뜨므로
// 색이 갈리면 어색하다.
const BUTTON_FILL = colors.action;
const BUTTON_BORDER = colors.outlineStrong;

interface MenuItem {
  label: string;
  url: string;
}

const ITEMS: MenuItem[] = [
  { label: '고객센터', url: SUPPORT_MAIL_URL },
  { label: '개인정보처리방침', url: PRIVACY_URL },
  { label: '계정 삭제 안내', url: ACCOUNT_DELETION_URL },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AppMenuOverlay({ visible, onClose }: Props) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isAuthed = useAuthStore((state) => state.status) === 'authed';
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // 나갈 때도 미끄러지려면 애니메이션이 끝난 뒤에 Modal을 내려야 한다.
  // visible이 false가 되자마자 내리면 그냥 사라진다.
  const [mounted, setMounted] = useState(visible);
  const translateX = useSharedValue(width);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateX.value = withTiming(0, { duration: SLIDE_MS });
      return;
    }
    translateX.value = withTiming(width, { duration: SLIDE_MS }, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
  }, [visible, width, translateX]);

  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  // 열고 나서 오버레이를 닫는다. 앱으로 돌아왔을 때 그대로 떠 있으면
  // 「눌렸나?」 싶어 한 번 더 누르게 된다.
  const open = (url: string) => {
    onClose();
    Linking.openURL(url);
  };

  /** 앱 화면으로 옮길 때도 먼저 닫는다 — 뒤로 오면 메뉴가 덮고 있으면 안 된다. */
  const go = (path: '/login' | '/signup' | '/(tabs)/(my)') => {
    onClose();
    router.navigate(path);
  };

  /** 메뉴를 먼저 닫고 확인 창을 띄운다. 두 창이 겹쳐 뜨지 않게. */
  const askLogout = () => {
    onClose();
    setIsLogoutOpen(true);
  };

  // 왜 animationType이 'none'인가:
  // RN Modal이 주는 애니메이션은 slide·fade·none 셋뿐이고, slide는 문서상
  // 「slides in from the bottom」 — 아래에서 올라오는 것 하나뿐이다. 옆에서 들어오는
  // 선택지가 아예 없다. 웹 MobileNavigation은 오른쪽 밖(translate-x-full)에서
  // 제자리로 들어오므로, 같은 움직임을 만들려면 Modal의 애니메이션을 끄고
  // Reanimated로 직접 밀어 넣어야 한다.
  //
  // transparent를 켜는 이유: 미끄러지는 동안 뒤에 있던 화면이 보여야 웹처럼 읽힌다.
  return (
    <>
    <Modal visible={mounted} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.panel, slideStyle]}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="메뉴 닫기"
              style={({ pressed }) => (pressed ? styles.pressed : undefined)}
            >
              <X size={24} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.heading}>메뉴</Text>
          </View>

          {/* 웹 MobileNavigation의 위쪽 버튼 두 줄을 그대로 옮긴 것이다.
              왼쪽은 테두리형, 오른쪽은 채움형 — 로그인 여부에 따라 글자만 바뀐다.
              탭바에도 「마이」가 있어 중복이지만, 웹도 탭바(BottomNav)와 여기 둘 다에
              두고 있다. 찾는 사람이 어느 쪽으로 가든 닿아야 한다는 같은 이유다. */}
          <View style={styles.authRow}>
            <Pressable
              onPress={isAuthed ? askLogout : () => go('/login')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.authOutline, pressed && styles.pressed]}
            >
              <Text style={styles.authOutlineLabel}>{isAuthed ? '로그아웃' : '로그인'}</Text>
            </Pressable>

            <Pressable
              onPress={isAuthed ? () => go('/(tabs)/(my)') : () => go('/signup')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.authFilled, pressed && styles.pressed]}
            >
              <Text style={styles.authFilledLabel}>{isAuthed ? '마이페이지' : '회원가입'}</Text>
            </Pressable>
          </View>

          <View>
            {ITEMS.map((menuItem, index) => (
              <Pressable
                key={menuItem.label}
                onPress={() => open(menuItem.url)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.rowDivider,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.rowLabel}>{menuItem.label}</Text>
                <ChevronRight size={20} color={colors.onSurfaceSubtle} />
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>

    {/* 메뉴 Modal 안이 아니라 형제로 둔다 — 안드로이드에서 Modal을 겹쳐 띄우면
        뒤엣것이 안 보이는 일이 있다. 로그아웃을 누르면 메뉴가 먼저 닫히고
        이 창만 남는다. */}
    <LogoutModal
      visible={isLogoutOpen}
      onClose={() => setIsLogoutOpen(false)}
      onDone={() => {
        setIsLogoutOpen(false);
        router.navigate('/(tabs)/(home)');
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  /** 미끄러져 들어오는 판. 화면을 다 덮는다(웹도 w-full이다). */
  panel: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  heading: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  pressed: { opacity: 0.5 },
  // 웹은 두 버튼이 gap-2(8)로 붙고 각각 flex-1로 반씩 나눠 갖는다.
  authRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  authOutline: {
    flex: 1,
    height: 42,
    // 8은 앱의 다른 버튼·창과 같은 값이다(로그아웃 확인 창도 8).
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BUTTON_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authOutlineLabel: { fontSize: 14, fontWeight: '600', color: BUTTON_FILL },
  authFilled: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: BUTTON_FILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authFilledLabel: { fontSize: 14, fontWeight: '600', color: colors.onAction },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceSunken,
  },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  rowLabel: { fontSize: 16, color: colors.onSurface },
});
