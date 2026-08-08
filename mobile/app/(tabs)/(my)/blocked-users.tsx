import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { colors } from '@/constants/colors';
import { fetchBlockedUsers, unblockUser, type BlockedUser } from '@/lib/reports';
import { showToast } from '@/lib/toast';

// 차단한 사람 목록. 여기서 해제한다.
//
// 이 화면이 있어야 차단 안내 문구가 참이 된다 —
// 「차단은 언제든 차단 목록에서 해제할 수 있습니다」(@cuddle/shared).

const HEADER_HEIGHT = 52;

export default function BlockedUsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['blockedUsers'],
      queryFn: ({ pageParam }) => fetchBlockedUsers(pageParam),
      initialPageParam: 0,
      getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
    });

  const users: BlockedUser[] = data?.pages.flatMap((page) => page.content) ?? [];

  // 누구를 해제할지 들고 있는다. null이면 창이 안 떠 있다.
  const [target, setTarget] = useState<BlockedUser | null>(null);

  const handleUnblock = async () => {
    if (!target) return;

    try {
      await unblockUser(target.blockedUserId);
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      // 그 사람 프로필을 열어 뒀다면 거기 「차단 유저」 배지도 사라져야 한다.
      queryClient.invalidateQueries({ queryKey: ['userProfile', target.blockedUserId] });
      setTarget(null);
      showToast('차단을 해제했습니다');
    } catch {
      setTarget(null);
      showToast('차단 해제에 실패했습니다');
    }
  };

  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title="차단 목록을 불러오지 못했어요." />;
    if (users.length === 0) {
      return (
        <EmptyState
          title="차단한 사용자가 없어요."
          description="차단하면 여기에서 확인하고 해제할 수 있어요."
        />
      );
    }

    return (
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.blockedUserId)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}>
              {item.profileImageUrl ? (
                <Image
                  source={{ uri: item.profileImageUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {item.nickname.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={styles.nickname}>{item.nickname}</Text>
            <Pressable
              onPress={() => setTarget(item)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.unblock, pressed && styles.pressed]}
            >
              <Text style={styles.unblockLabel}>차단 해제</Text>
            </Pressable>
          </View>
        )}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <ChevronLeft size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.heading}>차단 목록</Text>
      </View>

      {renderBody()}

      {/* 차단하기 창과 같은 조각이다 — 한쪽만 RN 기본 Alert이면 모양이 갈린다. */}
      <ConfirmDialog
        visible={target !== null}
        heading="차단 해제"
        description={target ? `${target.nickname}님의 차단을 해제할까요?` : undefined}
        confirmLabel="해제"
        onClose={() => setTarget(null)}
        onConfirm={handleUnblock}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceSunken,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSurface,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 16, color: colors.onSurface },
  nickname: { flex: 1, fontSize: 15, color: colors.onSurface },
  unblock: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
  },
  unblockLabel: { fontSize: 13, fontWeight: '600', color: colors.onSurface },
});
