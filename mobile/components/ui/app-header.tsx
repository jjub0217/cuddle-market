import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// 웹과 같은 Lucide를 쓴다(같은 판 0.563.0).
// Feather를 쓰던 때는 종의 치마 끝이 뾰족하고(Lucide는 반지름 1로 굴린다)
// 햄버거 세 줄이 더 좁았다(Feather y=6/12/18 · Lucide y=5/12/19).
// 아이콘 세트는 「매체 관행」이 아니라 「통일할 규칙」 쪽이다.
import { Bell, Menu } from 'lucide-react-native';

import { AppMenuOverlay } from '@/components/ui/app-menu-overlay';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth/store';
import { fetchUnreadCount } from '@/lib/notifications';

// 홈·마이가 함께 쓰는 헤더. 왼쪽만 다르고 오른쪽(알림 벨·햄버거)은 같다.
// 9바퀴에 커뮤니티 탭이 생겨도 이 조각을 그대로 쓴다.
//
// 높이는 로그인·회원가입 화면과 같은 52다. 앱 안에서 헤더 높이가 갈리면 안 된다.
// 아래 선과 글자 크기(20)는 홈·마이가 각자 갖고 있던 헤더에서 그대로 가져왔다 —
// 이 조각으로 바꾸면서 보이는 모습이 달라지면 안 된다.

const HEADER_HEIGHT = 52;

/**
 * logo.png의 실제 비율(826 x 357). 파일을 갈면 이 값도 같이 고쳐야 한다.
 * 로그인 화면(app/login.tsx)도 같은 그림을 크게 그려서 이 값을 함께 쓴다 —
 * 두 곳에 각자 적어 두면 파일을 갈 때 한쪽만 고치게 된다.
 */
export const LOGO_ASPECT_RATIO = 826 / 357;

/**
 * 헤더 아이콘 색.
 *
 * 웹의 `--color-header-icon`과 같은 값이다(src/styles/tokens.colors.css).
 * 전에는 웹이 브라운(`text-primary`), 앱이 먹색으로 갈려 있었는데 먹색으로 모았다.
 * 웹의 검색·알림·메뉴 아이콘도 같이 바꿨다 — 한쪽만 바꾸면 다시 갈린다.
 */
const ICON_COLOR = colors.onSurface;

interface Props {
  /** 문자열이면 제목으로, 아니면 그대로 그린다(홈은 로고 이미지) */
  left: ReactNode | string;
  /**
   * 오른쪽 아이콘 줄의 **맨 앞**에 끼워 넣을 것. 알림 벨·메뉴 앞에 온다.
   *
   * 홈의 검색 돋보기가 여기 들어온다. 세 탭이 이 헤더를 함께 쓰는데 검색은 상품에만
   * 있는 것이라, 헤더에 박아 두면 커뮤니티·마이에도 생긴다.
   */
  right?: ReactNode;
}

export function AppHeader({ left, right }: Props) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const isAuthed = status === 'authed';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 안 읽은 개수. 화면에 들어올 때마다 다시 조회한다(SSE는 안 쓴다 — 설계 §3).
  // 실패해도 0을 돌려주므로 여기서 오류를 다루지 않는다.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: fetchUnreadCount,
    enabled: isAuthed,
    refetchOnMount: 'always',
  });

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {typeof left === 'string' ? <Text style={styles.title}>{left}</Text> : left}
      </View>

      <View style={styles.right}>
        {right}

        {/* 비로그인이면 벨을 아예 안 보여준다. 눌러서 로그인으로 보내는 것보다 정직하다. */}
        {isAuthed ? (
          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? '알림 (읽지 않은 알림 있음)' : '알림'}
            style={({ pressed }) => (pressed ? styles.iconPressed : undefined)}
          >
            <Bell size={24} color={ICON_COLOR} />
            {unreadCount > 0 ? <View style={styles.dot} /> : null}
          </Pressable>
        ) : null}

        {/* 햄버거는 벨과 달리 로그인 여부를 안 본다.
            안에 든 개인정보처리방침·계정 삭제 안내는 로그인 없이도 닿아야 하기 때문이다
            (Play 정책). 마이 탭은 로그인해야 열리므로 거기 두면 로그아웃한 사람은
            방침에 닿을 길이 아예 없어진다 — 8바퀴 전까지 실제로 그랬다. */}
        <Pressable
          onPress={() => setIsMenuOpen(true)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="메뉴"
          style={({ pressed }) => (pressed ? styles.iconPressed : undefined)}
        >
          <Menu size={24} color={ICON_COLOR} />
        </Pressable>
      </View>

      <AppMenuOverlay visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </View>
  );
}

/** 홈이 쓰는 로고. 눌러도 아무 데도 안 간다 — 이미 홈이다. */
export function HeaderLogo({ onPress }: { onPress?: () => void }) {
  const logo = (
    <Image
      source={require('@/assets/images/logo.png')}
      style={styles.logo}
      contentFit="contain"
      accessibilityLabel="커들마켓"
    />
  );

  // 누를 일이 없으면 그냥 그림이다. 홈만 누를 거리를 준다 —
  // 웹도 로고를 누르면 홈(맨 주소)으로 간다(Header.tsx:165).
  if (!onPress) return logo;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="홈으로"
      style={({ pressed }) => (pressed ? styles.iconPressed : undefined)}
    >
      {logo}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // 웹과 같은 16. 한때 왼쪽만 8로 줄여뒀는데, 그건 로고 상자가 만든
    // 빈칸(아래 logo 주석)을 로고 탓으로 잘못 보고 증상만 덮은 것이었다.
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  left: { flexShrink: 1 },
  // 벨과 햄버거 사이. hitSlop이 12라 이보다 좁으면 두 누름 영역이 겹친다.
  right: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  // 폭을 직접 정하지 않고 비율로 맡긴다.
  //
  // 전에는 120x32 상자에 contentFit:'contain'을 걸었는데, 로고 그림 비율(2.31)이
  // 상자 비율(3.75)보다 좁아서 그림이 높이에 맞춰지고 남은 46px이 좌우 23px씩
  // 빈칸으로 깔렸다. 그 빈칸이 「로고 왼쪽만 더 뜬다」로 보였다.
  // 상자 비율을 그림 비율과 같게 두면 빈칸이 아예 안 생긴다.
  //
  // 높이 36은 웹과 같은 값이다(Logo.tsx의 h-9). 앱 로고만 작아 보이면 안 된다.
  logo: { height: 36, aspectRatio: LOGO_ASPECT_RATIO },
  iconPressed: { opacity: 0.5 },
  dot: {
    position: 'absolute',
    // ⚖️ 실기기로 비교하며 고르는 중인 값이다. 지나온 자리:
    //   top -4 / right -4  종 밖으로 나감 (웹과 같은 자리 — 웹은 40x40 버튼 안
    //                      top-1 right-1이라 24x24 종 기준으로는 밖으로 4씩 나간다)
    //   top  0 / right  0  종 모서리에 딱 붙음 (처음 값 — 어깨와 겹쳐 보였다)
    //   top  1 / right  1  종 안쪽으로 들어옴
    //   top  1 / right  3  ← 지금 이것
    top: 1,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    // 웹과 같은 값(--color-danger-500)
    backgroundColor: colors.danger,
  },
});
