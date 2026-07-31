import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/lib/auth/store';
import { fetchUnreadCount } from '@/lib/notifications';

// 홈·마이가 함께 쓰는 헤더. 왼쪽만 다르고 오른쪽(알림 벨)은 같다.
// 9바퀴에 커뮤니티 탭이 생겨도 이 조각을 그대로 쓴다.
//
// 높이는 로그인·회원가입 화면과 같은 52다. 앱 안에서 헤더 높이가 갈리면 안 된다.
// 아래 선과 글자 크기(20)는 홈·마이가 각자 갖고 있던 헤더에서 그대로 가져왔다 —
// 이 조각으로 바꾸면서 보이는 모습이 달라지면 안 된다.

const HEADER_HEIGHT = 52;

interface Props {
  /** 문자열이면 제목으로, 아니면 그대로 그린다(홈은 로고 이미지) */
  left: ReactNode | string;
}

export function AppHeader({ left }: Props) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const isAuthed = status === 'authed';

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

      {/* 비로그인이면 벨을 아예 안 보여준다. 눌러서 로그인으로 보내는 것보다 정직하다. */}
      {isAuthed ? (
        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? '알림 (읽지 않은 알림 있음)' : '알림'}
          style={({ pressed }) => (pressed ? styles.bellPressed : undefined)}
        >
          <IconSymbol name="bell" size={26} color="#111827" />
          {unreadCount > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

/** 홈이 쓰는 로고. 눌러도 아무 데도 안 간다 — 이미 홈이다. */
export function HeaderLogo() {
  return (
    <Image
      source={require('@/assets/images/logo.png')}
      style={styles.logo}
      contentFit="contain"
      accessibilityLabel="커들마켓"
    />
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  left: { flexShrink: 1 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  logo: { width: 120, height: 32 },
  bellPressed: { opacity: 0.5 },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    // 웹과 같은 값(--color-danger-500)
    backgroundColor: '#C91D1D',
  },
});
