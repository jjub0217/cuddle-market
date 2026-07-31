import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, ListFooter } from '@/components/list-states';
import { NotificationSkeleton } from '@/components/notifications/notification-skeleton';
import { NotificationRow } from '@/components/notifications/notification-row';
import { ChevronLeft } from 'lucide-react-native';
import { apiBaseUrl } from '@/lib/auth/api';
import {
  fetchNotifications,
  markAllAsRead,
  markAsRead,
  resolveTarget,
  type NotificationItem,
} from '@/lib/notifications';

// 알림 목록. 헤더는 화면이 직접 그린다(login·signup과 같은 이유 —
// native-stack 헤더에는 상단 인셋 옵션이 없어 실기기에서 상태바와 붙어 보인다).

const HEADER_HEIGHT = 52;

/** 웹 주소. API base에서 /api를 떼면 웹 도메인이 된다. */
function webUrl(path: string): string {
  return `${apiBaseUrl().replace(/\/api$/, '')}${path}`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['notifications'],
      queryFn: ({ pageParam }) => fetchNotifications(pageParam),
      initialPageParam: 0,
      getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
    });

  const items: NotificationItem[] = data?.pages.flatMap((page) => page.content) ?? [];

  /** 목록과 헤더의 점을 함께 새로 고친다. */
  const refresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
  };

  const handlePress = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item.notificationId);
      refresh();
    }

    const target = resolveTarget(item);

    if (target.kind === 'app') {
      router.push(target.path as never);
      return;
    }

    // 앱에 아직 그 화면이 없다(채팅 12바퀴 · 커뮤니티 9바퀴).
    // 웹에는 있으므로 앱 안 브라우저로 연다. 다만 웹 세션은 폰 브라우저 쪽에 있어서
    // 앱만 쓴 사람은 로그인 화면을 만난다 — 그래서 미리 알려준다(설계 §5).
    Alert.alert(
      '웹에서 열려요',
      '앱에는 아직 이 화면이 없어 웹으로 보여드립니다. 로그인이 필요할 수 있어요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '열기', onPress: () => WebBrowser.openBrowserAsync(webUrl(target.path)) },
      ]
    );
  };

  const handleReadAll = async () => {
    await markAllAsRead();
    refresh();
  };

  const renderBody = () => {
    if (isLoading) return <NotificationSkeleton />;
    if (isError) return <ErrorState onRetry={() => refetch()} title="알림을 불러오지 못했어요." />;
    if (items.length === 0)
      return (
        <EmptyState
          title="아직 받은 알림이 없어요."
          description="찜한 상품이나 내 글에 소식이 생기면 여기에 보여드릴게요."
        />
      );

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.notificationId)}
        renderItem={({ item }) => <NotificationRow item={item} onPress={handlePress} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={<ListFooter loading={isFetchingNextPage} />}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <Text style={styles.heading}>알림</Text>
        <Pressable onPress={handleReadAll} hitSlop={8} accessibilityRole="button">
          <Text style={styles.readAll}>모두 읽음</Text>
        </Pressable>
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  heading: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' },
  readAll: { fontSize: 14, color: '#825500' },
  pressed: { opacity: 0.5 },
});
