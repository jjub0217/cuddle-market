import { useInfiniteQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatRoomRow } from '@/components/chat/chat-room-row';
import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { AppHeader } from '@/components/ui/app-header';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth/store';
import { fetchChatRooms, type ChatRoomListItem } from '@/lib/chat/api';
import { chatSocket } from '@/lib/chat/socket';

// 채팅 탭 = 방 목록.
//
// ⚠️ 여기는 탭 화면이라 SafeAreaView 에 edges={['top']} 만 준다.
//    아래는 탭바가 이미 비켜 놓았다 — insets.bottom 을 또 더하면 두 번 센다.

export default function ChatRoomsScreen() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['chatRooms'],
      queryFn: ({ pageParam }) => fetchChatRooms(pageParam),
      initialPageParam: 0,
      getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
      // 'authed' 일 때만 부른다 — 게스트가 부르면 401 만 받고, 그 401 이 화면에는
      // 「채팅 목록을 불러오지 못했어요」로 보여 **서버 탈처럼 읽힌다**(#916).
      // 'restoring'(앱 켠 직후)에도 아직 안 부른다 — use-me 와 같은 방식이다.
      enabled: status === 'authed',
    });

  const rooms: ChatRoomListItem[] = data?.pages.flatMap((page) => page.rooms) ?? [];

  // 소켓을 잡는다. 화면이 사라지면 놓는다 — 방으로 들어가는 동안은 방이 잡고 있어서
  // 실제로 끊기지 않는다(쓰는 곳 세기).
  //
  // ⚠️ 로그인한 뒤에만 잡는다. 토큰 없이 붙으면 서버가 물리치는데 stompjs 가
  //    5초마다 다시 붙어서, 게스트가 이 화면에 있는 내내 헛되이 두드린다.
  useEffect(() => {
    if (status !== 'authed') return;
    chatSocket.acquire();
    return () => chatSocket.release();
  }, [status]);

  // 방 목록이 바뀌면 서버가 chat-room-list 로 알려준다. 그때 목록을 다시 가져온다.
  useEffect(() => {
    return chatSocket.subscribe('/user/queue/chat-room-list', () => {
      refetch();
    });
  }, [refetch]);

  // 방에서 돌아오면 안 읽은 개수가 달라져 있다.
  //
  // ⚠️ `refetch()` 는 enabled 를 무시하고 그냥 부른다. 게스트일 때 막지 않으면
  //    화면에 안내를 띄워 놓고 뒤에서 401 을 받아 온다.
  useFocusEffect(
    useCallback(() => {
      if (status !== 'authed') return;
      refetch();
    }, [status, refetch])
  );

  const renderBody = () => {
    // 게스트인데 이 화면이 열려 있는 건 정상 흐름이 아니다(탭 누름을 가로채므로).
    // 그런데 **앱을 껐다 켤 때 채팅 탭이 열린 채로 시작하면** 누름이 없어서 안 걸린다.
    // 마이 탭과 같은 안전망을 여기에도 둔다(#916).
    if (status === 'guest') {
      return (
        <View style={styles.center}>
          <Text style={styles.centerText}>로그인이 필요합니다.</Text>
          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
          >
            <Text style={styles.loginButtonLabel}>로그인하기</Text>
          </Pressable>
        </View>
      );
    }

    // ⚠️ 'restoring' 을 여기서 같이 잡는다. 조회를 아직 안 켰으니 isLoading 이 거짓이라,
    //    이 갈래가 없으면 토큰을 읽는 동안 빈 목록 문구가 한 번 번쩍인다.
    if (status === 'restoring' || isLoading) {
      return <LoadingState />;
    }

    if (isError) {
      return <ErrorState onRetry={refetch} title="채팅 목록을 불러오지 못했어요." />;
    }

    return (
      <FlatList
        data={rooms}
        keyExtractor={(room) => String(room.chatRoomId)}
        renderItem={({ item }) => (
          <ChatRoomRow room={item} onPress={() => router.push(`/chat/${item.chatRoomId}`)} />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          // 웹의 빈 화면 문구를 그대로 쓴다.
          <EmptyState
            title="채팅을 시작해보세요"
            description="상품 페이지에서 판매자에게 채팅을 보낼 수 있습니다"
          />
        }
        ListFooterComponent={<ListFooter loading={isFetchingNextPage} />}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader left="채팅" />
      {renderBody()}
    </SafeAreaView>
  );
}

// 로그인 안내는 마이 탭과 같은 모양이다(app/(tabs)/my/index.tsx).
// 같은 상황에 같은 말·같은 생김새여야 한다.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerText: {
    fontSize: 15,
    color: colors.onSurfaceMuted,
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.action,
  },
  loginButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onAction,
  },
  pressed: {
    opacity: 0.7,
  },
});
