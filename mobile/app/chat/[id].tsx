import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatInput } from '@/components/chat/chat-input';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ErrorState, LoadingState } from '@/components/list-states';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { useMe } from '@/hooks/use-me';
import {
  ChatRoomAccessDeniedError,
  fetchChatMessages,
  leaveChatRoom,
  type ChatMessage,
} from '@/lib/chat/api';
import { appendNew, groupByDay, messageKey, prependOlder, withIsMine } from '@/lib/chat/messages';
import { chatSocket } from '@/lib/chat/socket';
// 화면 밖(이벤트 처리 함수 안)에서도 부를 수 있게 훅이 아닌 함수를 쓴다.
import { showToast } from '@/lib/toast';

// 채팅방. **루트 화면이라 탭바가 없다** — 들어오는 길이 셋(채팅 탭·상품 상세·알림)이라
// 탭 안에 두면 다른 탭에서 열 때 탭이 튄다. 알림 화면이 루트에 있는 것과 같은 이유다.
//
// ⚠️ SafeAreaView 에 edges={['top','bottom']} 을 준다. 루트 화면은 아래에 탭바가 없어
//    자기가 기기 바를 비켜야 한다.
// ⚠️ KeyboardAvoidingView 는 **안드로이드에도** behavior="padding" 을 준다.
//    app.json 의 edgeToEdgeEnabled 라 창이 저절로 안 줄어든다. 그리고 목록과 입력칸을
//    **함께** 감싼다 — 입력칸만 감싸면 목록이 안 밀려 키보드가 칸을 덮는다.

/** 붙었는지 지켜보는 간격. 소켓이 상태를 알려주지 않아 물어본다. */
const STATUS_POLL_MS = 500;

type Row =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage };

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatRoomId = Number(id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  /** null 이면 탈 없음. 'gone' 은 이미 나간 방이라 다시 시도해도 소용없다. */
  const [failure, setFailure] = useState<'gone' | 'other' | null>(null);
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const listRef = useRef<FlatList<Row>>(null);
  // 소켓으로 온 메시지에는 isMine 이 없어서 내 id 로 채워야 한다.
  const myId = useMe().data?.id;

  // 소켓을 잡는다. 화면이 사라지면 놓는다 — 목록으로 돌아가는 동안은 목록이 잡고 있어서
  // 실제로 끊기지 않는다(쓰는 곳 세기).
  useEffect(() => {
    chatSocket.acquire();
    return () => chatSocket.release();
  }, []);

  // ⚠️ 순서가 중요하다 — 붙기 → 구독 → 조회.
  //    조회를 먼저 하면 조회가 끝나고 구독하기까지의 틈에 온 메시지를 놓친다.
  //    구독을 먼저 걸면 그 틈이 없다. 겹쳐 들어오는 것은 appendNew 가 messageId 로 거른다.
  //
  // ⚠️ **통로가 둘이다.** 서버가 이렇게 갈라 보낸다(ChatWebSocketController:83~98).
  //      /topic/chat/{방번호}   일반 메시지 전부 (양쪽 다 받는다)
  //      /user/queue/chat      개인정보로 막힌 메시지 — **보낸 사람에게만** 간다
  //    하나만 들으면 조용히 반쪽이 된다. 20바퀴에 실제로 그랬다 —
  //    개인 큐만 듣고 있어서 실시간 메시지가 하나도 안 왔다.
  useEffect(() => {
    const offRoom = chatSocket.subscribe(`/topic/chat/${chatRoomId}`, (body) => {
      setMessages((prev) => appendNew(prev, body as ChatMessage));
    });
    const offBlocked = chatSocket.subscribe('/user/queue/chat', (body) => {
      const incoming = body as ChatMessage & { chatRoomId?: number };
      // 이 통로로는 내가 든 모든 방의 것이 온다. 다른 방 것은 흘려보낸다.
      if (incoming.chatRoomId !== undefined && incoming.chatRoomId !== chatRoomId) return;
      setMessages((prev) => appendNew(prev, incoming));
    });
    return () => {
      offRoom();
      offBlocked();
    };
  }, [chatRoomId]);

  // 서버가 보내는 오류(권한 없음 등)
  useEffect(() => {
    return chatSocket.subscribe('/user/queue/errors', (body) => {
      const message = (body as { message?: string }).message;
      showToast(message ?? '채팅 오류가 발생했어요');
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setConnected(chatSocket.isConnected()), STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  // 첫 조회. **이 요청이 읽음 처리도 겸한다**(서버가 마지막 읽은 시각을 갱신한다).
  useEffect(() => {
    let alive = true;
    fetchChatMessages(chatRoomId, 0)
      .then((result) => {
        if (!alive) return;
        setMessages((prev) => prependOlder(prev, result.messages));
        setHasMore(result.hasNext);
        setIsLoading(false);
      })
      .catch((error) => {
        if (!alive) return;
        // 알림 목록에는 나간 방의 알림이 그대로 남는다. 그걸 눌러 여기로 오면 403 이다.
        setFailure(error instanceof ChatRoomAccessDeniedError ? 'gone' : 'other');
        setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [chatRoomId]);

  /**
   * 맨 아래로 민다.
   *
   * ⚠️ **한 번만 밀면 모자란다.** 긴 메시지는 글자 배치가 끝나기 전에 크기 변경 알림이
   * 먼저 와서, 그때 잰 높이로 밀면 실제보다 짧다. 그리고 메시지를 보내면 입력칸이
   * 여섯 줄에서 한 줄로 줄어 목록 높이가 또 바뀐다. 그래서 한 박자 뒤에 한 번 더 민다.
   */
  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: false });
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
  }, []);

  const loadOlder = () => {
    if (!hasMore) return;
    const next = page + 1;
    fetchChatMessages(chatRoomId, next)
      .then((result) => {
        // ⚠️ 앞에 붙인다. 서버가 최신부터 페이지를 나누기 때문이다.
        setMessages((prev) => prependOlder(prev, result.messages));
        setHasMore(result.hasNext);
        setPage(next);
      })
      .catch(() => showToast('이전 메시지를 불러오지 못했어요'));
  };

  const send = () => {
    const content = draft.trim();
    if (content.length === 0) return;

    // 미리 그려두지 않는다. 서버가 개인정보를 막으면 isBlocked 를 달아 돌려주는데,
    // 미리 그리면 정상으로 보였다가 바뀌게 된다.
    const ok = chatSocket.publish('/app/chat/message', {
      chatRoomId,
      content,
      messageType: 'TEXT',
      imageUrl: null,
    });
    if (!ok) {
      // 웹 문구 그대로다.
      showToast('메시지를 전송할 수 없습니다. 채팅 서버에 연결되어 있지 않습니다.');
      return;
    }
    setDraft('');
  };

  // 나간 뒤에는 **뒤로 가지 않고** 채팅 목록으로 바꿔 놓는다.
  // 뒤로 가면 들어온 곳(알림·상품 상세)으로 돌아가는데, 거기서 같은 알림을 다시 누르면
  // 이미 없어진 방을 열게 된다.
  const handleLeave = async () => {
    try {
      await leaveChatRoom(chatRoomId);
      setIsLeaveOpen(false);
      router.replace('/(tabs)/(chat)');
    } catch {
      showToast('채팅방을 나가지 못했어요');
      // 던지지 않는다 — ConfirmDialog 가 창을 닫지 않고 다시 시도하게 둔다.
      throw new Error('leave failed');
    }
  };

  // ⚠️ 내 것인지를 **그릴 때** 정한다. 들어오는 순간에 굳히면 안 된다.
  //    소켓 메시지에는 isMine 이 없어서 내 id 로 판별해야 하는데, 그 id 는 프로필 조회가
  //    끝나야 온다. 알림에서 채팅방으로 바로 들어오면 아직 안 왔을 수 있고, 그때 굳히면
  //    내가 방금 보낸 글이 상대 것처럼 왼쪽에 붙은 채 그대로 남는다.
  //    여기서 정하면 id 가 뒤늦게 와도 useMemo 가 다시 돌아 제자리를 찾는다.
  const rows: Row[] = useMemo(
    () =>
      groupByDay(messages.map((message) => withIsMine(message, myId))).flatMap((group) => [
        { kind: 'day' as const, key: `day-${group.key}`, label: group.label },
        ...group.messages.map((message, index) => ({
          kind: 'message' as const,
          key: messageKey(message, index),
          message,
        })),
      ]),
    [messages, myId]
  );

  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    // 나간 방은 되돌릴 수 없다. 「다시 시도」를 주면 영원히 같은 403 을 누르게 된다 —
    // 그래서 여기만 목록으로 돌아가는 길을 준다.
    if (failure === 'gone') {
      return (
        <ErrorState
          onRetry={() => router.replace('/(tabs)/(chat)')}
          title="이미 나간 채팅방이에요."
          description="나간 채팅방은 다시 열 수 없어요. 상품에서 다시 채팅을 시작할 수 있어요."
          actionLabel="채팅 목록으로"
        />
      );
    }
    if (failure === 'other') {
      return (
        <ErrorState
          onRetry={() => router.replace(`/chat/${chatRoomId}`)}
          title="메시지를 불러오지 못했어요."
        />
      );
    }
    return (
      <FlatList
        ref={listRef}
        style={styles.flex}
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <View style={styles.dayWrap}>
              <Text style={styles.day}>{item.label}</Text>
            </View>
          ) : (
            <MessageBubble message={item.message} />
          )
        }
        onEndReached={loadOlder}
        onEndReachedThreshold={0.4}
        // 마지막 말풍선이 입력칸에 닿아 보이지 않게 숨통을 둔다.
        contentContainerStyle={styles.listBody}
        onContentSizeChange={scrollToBottom}
        // 키보드가 오르내리면 목록 높이가 바뀐다. 그때도 맨 아래를 지킨다.
        onLayout={scrollToBottom}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="채팅"
        onPressIcon={() => router.back()}
        right={
          <Text onPress={() => setIsLeaveOpen(true)} style={styles.leave}>
            나가기
          </Text>
        }
      />
      {/* RN 기본 Alert 대신 앱의 공용 창을 쓴다 — 차단·삭제와 같은 모양이어야 한다. */}
      <ConfirmDialog
        visible={isLeaveOpen}
        heading="채팅방을 나갈까요?"
        description="나가면 이 채팅방의 대화 내용이 사라져요."
        confirmLabel="나가기"
        tone="danger"
        onClose={() => setIsLeaveOpen(false)}
        onConfirm={handleLeave}
      />
      {/* 안 붙어 있는 동안에도 지난 메시지는 보인다(REST 로 가져왔다). 보내기만 막는다. */}
      {!connected ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>연결 중이에요…</Text>
        </View>
      ) : null}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {renderBody()}
        <ChatInput value={draft} onChange={setDraft} onSubmit={send} disabled={!connected} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  listBody: { paddingBottom: 8 },
  leave: { fontSize: 14, color: colors.onSurfaceMuted },
  banner: { alignItems: 'center', paddingVertical: 6, backgroundColor: colors.surfaceSunken },
  bannerText: { fontSize: 12, color: colors.onSurfaceMuted },
  dayWrap: { alignItems: 'center', paddingVertical: 10 },
  // 날짜 구분선은 알약이다. 웹과 같은 모양이고, 앱의 시스템 안내(「~님이 나가셨습니다」)와도
  // 같은 모양이다 — 둘 다 「시스템이 하는 말」이라 따로 놀면 안 된다.
  //
  // ⚠️ 색은 웹 값을 그대로 안 가져온다. 웹은 #eae7e7·#756652(따뜻한 회색)인데,
  //    앱은 베이지 계열을 회색으로 모으기로 이미 정했다(constants/colors.ts 의 outline 주석).
  //    모양만 맞추고 색은 앱 토큰을 쓴다.
  day: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceMuted,
    backgroundColor: colors.surfaceSunken,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
