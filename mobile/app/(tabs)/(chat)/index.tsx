import { useInfiniteQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatRoomRow } from '@/components/chat/chat-room-row';
import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { AppHeader } from '@/components/ui/app-header';
import { colors } from '@/constants/colors';
import { fetchChatRooms, type ChatRoomListItem } from '@/lib/chat/api';
import { chatSocket } from '@/lib/chat/socket';

// 채팅 탭 = 방 목록.
//
// ⚠️ 여기는 탭 화면이라 SafeAreaView 에 edges={['top']} 만 준다.
//    아래는 탭바가 이미 비켜 놓았다 — insets.bottom 을 또 더하면 두 번 센다.

export default function ChatRoomsScreen() {
  const router = useRouter();

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['chatRooms'],
      queryFn: ({ pageParam }) => fetchChatRooms(pageParam),
      initialPageParam: 0,
      getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
    });

  const rooms: ChatRoomListItem[] = data?.pages.flatMap((page) => page.rooms) ?? [];

  // 소켓을 잡는다. 화면이 사라지면 놓는다 — 방으로 들어가는 동안은 방이 잡고 있어서
  // 실제로 끊기지 않는다(쓰는 곳 세기).
  useEffect(() => {
    chatSocket.acquire();
    return () => chatSocket.release();
  }, []);

  // 방 목록이 바뀌면 서버가 chat-room-list 로 알려준다. 그때 목록을 다시 가져온다.
  useEffect(() => {
    return chatSocket.subscribe('/user/queue/chat-room-list', () => {
      refetch();
    });
  }, [refetch]);

  // 방에서 돌아오면 안 읽은 개수가 달라져 있다.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader left="채팅" />
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={refetch} title="채팅 목록을 불러오지 못했어요." />
      ) : (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
});
