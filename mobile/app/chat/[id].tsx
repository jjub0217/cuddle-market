import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatInput } from '@/components/chat/chat-input';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ErrorState, LoadingState } from '@/components/list-states';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { fetchChatMessages, leaveChatRoom, type ChatMessage } from '@/lib/chat/api';
import { appendNew, groupByDay, prependOlder } from '@/lib/chat/messages';
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
  const [isError, setIsError] = useState(false);
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const listRef = useRef<FlatList<Row>>(null);

  // 소켓을 잡는다. 화면이 사라지면 놓는다 — 목록으로 돌아가는 동안은 목록이 잡고 있어서
  // 실제로 끊기지 않는다(쓰는 곳 세기).
  useEffect(() => {
    chatSocket.acquire();
    return () => chatSocket.release();
  }, []);

  // ⚠️ 순서가 중요하다 — 붙기 → 구독 → 조회.
  //    조회를 먼저 하면 조회가 끝나고 구독하기까지의 틈에 온 메시지를 놓친다.
  //    구독을 먼저 걸면 그 틈이 없다. 겹쳐 들어오는 것은 appendNew 가 messageId 로 거른다.
  useEffect(() => {
    return chatSocket.subscribe('/user/queue/chat', (body) => {
      const incoming = body as ChatMessage & { chatRoomId?: number };
      // 이 통로로는 내가 든 모든 방의 메시지가 온다. 다른 방 것은 흘려보낸다.
      if (incoming.chatRoomId !== undefined && incoming.chatRoomId !== chatRoomId) return;
      setMessages((prev) => appendNew(prev, incoming));
    });
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
      .catch(() => {
        if (!alive) return;
        setIsError(true);
        setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [chatRoomId]);

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

  const handleLeave = () => {
    Alert.alert('채팅방 나가기', '나가면 대화 내용이 사라져요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveChatRoom(chatRoomId);
            router.back();
          } catch {
            showToast('채팅방을 나가지 못했어요');
          }
        },
      },
    ]);
  };

  // 날짜 구분선과 말풍선을 한 줄짜리 목록으로 편다.
  const rows: Row[] = useMemo(
    () =>
      groupByDay(messages).flatMap((group) => [
        { kind: 'day' as const, key: `day-${group.key}`, label: group.label },
        ...group.messages.map((message) => ({
          kind: 'message' as const,
          key: `m-${message.messageId}`,
          message,
        })),
      ]),
    [messages]
  );

  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError) {
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
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="채팅"
        onPressIcon={() => router.back()}
        right={
          <Text onPress={handleLeave} style={styles.leave}>
            나가기
          </Text>
        }
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
  leave: { fontSize: 14, color: colors.onSurfaceMuted },
  banner: { alignItems: 'center', paddingVertical: 6, backgroundColor: colors.surfaceSunken },
  bannerText: { fontSize: 12, color: colors.onSurfaceMuted },
  dayWrap: { alignItems: 'center', paddingVertical: 10 },
  day: { fontSize: 12, color: colors.onSurfaceSubtle },
});
