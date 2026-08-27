import { CHAT_BLOCKED_NOTICE, CHAT_EMPTY_DESCRIPTION, CHAT_EMPTY_TITLE } from '@cuddle/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatInput } from '@/components/chat/chat-input';
import { ChatRoomInfo } from '@/components/chat/chat-room-info';
import { MessageBubble } from '@/components/chat/message-bubble';
import { EmptyState, ErrorState, LoadingState } from '@/components/list-states';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import { BlockConfirm } from '@/components/report/block-confirm';
import { useMe } from '@/hooks/use-me';
import { useSelectionClear } from '@/hooks/use-selection-clear';
import { updateTradeStatus } from '@/lib/product-actions';
import { MAX_IMAGES, pickImages, shrinkImage, uploadOne } from '@/lib/product-images';
import { fetchProductDetail } from '@/lib/products';
import {
  ChatRoomAccessDeniedError,
  fetchChatMessages,
  leaveChatRoom,
  pingChatRoomRead,
  type ChatMessage,
  type ChatRoomSummary,
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

/**
 * 방을 보고 있는 동안 「여기 있다」를 다시 알리는 간격(#886).
 *
 * 서버 쪽 표시는 **5분**에 만료된다. 그보다 짧게 두지 않으면 만료와 갱신 사이에 틈이 생겨,
 * 그 틈에 온 메시지가 「안 읽음」으로 세어진다. 웹과 같은 값이다.
 */
const READ_PING_MS = 4 * 60 * 1000;

type Row =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage };

export default function ChatRoomScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  // 내가 이 방의 상대를 차단했는가(#877). 앱 채팅방에는 차단 메뉴가 없지만 상품 상세·프로필에서
  // 차단하면 이 방이 그대로 남는다 — 안 잠그면 차단해 놓고 허공에 글을 쓰게 된다.
  const [isOpponentBlocked, setIsOpponentBlocked] = useState(false);
  // 머리말에 그릴 상대·상품(#889). 메시지 조회 응답에 얹혀 온다 — 방 단건 조회 API 가 없다.
  // 서버가 아직 안 주면 값이 다 null 이고, 그러면 ChatRoomInfo 가 아무것도 안 그린다.
  const [room, setRoom] = useState<ChatRoomSummary | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const listRef = useRef<FlatList<Row>>(null);
  // 소켓으로 온 메시지에는 isMine 이 없어서 내 id 로 채워야 한다.
  const me = useMe().data;
  const myId = me?.id;
  // 고른 글자를 푸는 규칙은 훅 하나에 모여 있다(hooks/use-selection-clear.ts).
  // 말풍선은 selectable 인데(#896), 빈 곳을 눌러도 선택이 안 풀렸다(#994).
  const { 열쇠, 누름구경 } = useSelectionClear();

  // 「판매완료 처리」는 **내 상품일 때만** 보여야 한다(#894). 그런데 방 정보에는 파는 사람이
  // 없어서 상품을 따로 봐야 안다.
  //
  // 전에는 **메뉴를 열 때만** 불렀다(`enabled: isSheetOpen && …`) — 메뉴 항목 하나를 위해
  // 모두가 요청을 더 내는 것이 아까웠다. 이제는 **거래 상태 뱃지**(`ChatRoomInfo`)가 방을
  // 열자마자 늘 보여야 해서 방을 열 때 받아온다. 뱃지가 생기며 저울이 바뀐 것이다.
  // 웹도 같은 까닭으로 같은 날 바꿨다(`ChatRoomInfo.tsx` 의 상품 질의).
  const productId = room?.productId ?? null;
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductDetail(productId as number),
    enabled: productId != null,
  });
  const isMyProduct = Boolean(product && me && product.sellerInfo.sellerId === me.id);

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

  // 방을 보고 있는 동안 서버에 「여기 있다」를 되풀이해 알린다(#886).
  //
  // ⚠️ 이걸 안 하면 **읽고 있는 방에 안 읽음 수가 쌓이고 알림까지 온다.** 서버는 이 표시를
  //    첫 조회 때만 세우고 5분 뒤 지우는데, 갱신하는 곳이 없었다.
  useEffect(() => {
    const timer = setInterval(() => {
      void pingChatRoomRead(chatRoomId).catch(() => {
        // 알리기에 실패해도 화면은 그대로 둔다 — 다음 차례에 다시 알린다.
      });
    }, READ_PING_MS);
    return () => clearInterval(timer);
  }, [chatRoomId]);

  // 보고 있는 방에 새 메시지가 들어오면 바로 읽음으로 만든다.
  // 만료 직후의 틈에 온 것은 이미 안 읽음으로 세어졌을 수 있어, 이 요청이 0으로 되돌린다.
  useEffect(() => {
    if (messages.length === 0) return;
    void pingChatRoomRead(chatRoomId).catch(() => {});
  }, [chatRoomId, messages.length]);

  // 첫 조회. **이 요청이 읽음 처리도 겸한다**(서버가 마지막 읽은 시각을 갱신한다).
  useEffect(() => {
    let alive = true;
    fetchChatMessages(chatRoomId, 0)
      .then((result) => {
        if (!alive) return;
        setMessages((prev) => prependOlder(prev, result.messages));
        setHasMore(result.hasNext);
        setIsOpponentBlocked(result.isOpponentBlocked);
        setRoom(result.room);
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
    // 잠긴 방에서는 보내지 않는다. 칸도 막혀 있지만 여기서도 한 번 더 본다 —
    // 이건 **화면의 판단이지 서버의 규칙이 아니다**(서버는 「상대 → 나」만 막는다).
    if (isOpponentBlocked) return;
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

  // ⋮ 메뉴에 담을 것. 웹과 같은 차례·같은 문구다(ChatRoomInfo.tsx 의 menuItems).
  //
  // ⚠️ **상대가 탈퇴하면 신고·차단을 아예 안 그린다.** 눌리는데 반드시 실패하는 것보다 정직하다.
  // ⚠️ **판매완료는 내 상품일 때만 그린다.** 웹은 조건 없이 그려서 산 사람에게도 보이고,
  //    누르면 서버가 막아 실패 알림이 뜬다(#894 에서 웹도 같이 고친다).
  const sheetActions: SheetAction[] = [
    ...(isMyProduct && product?.tradeStatus !== 'COMPLETED'
      ? [
          {
            label: '판매완료 처리',
            onPress: async () => {
              setIsSheetOpen(false);
              try {
                // ⚠️ 값은 **COMPLETED** 다. 서버 enum 에 SOLD_OUT 은 없다(TradeStatus.java).
                //    웹은 그 없는 값을 보내고 있어 눌러도 반드시 실패한다.
                await updateTradeStatus(productId as number, 'COMPLETED');
                // 이 상품 질의를 지워야 **뱃지가 「판매완료」로 바뀐다.** 안 지우면 조금 전에
                // 받아 둔 SELLING 이 그대로 남아 「눌러도 화면에 아무 변화가 없다」로 보인다.
                // 웹도 같은 자리에서 같은 열쇠를 지운다(`ChatRoomInfo.tsx` 의
                // `handleTradeStatusChange`).
                queryClient.invalidateQueries({ queryKey: ['product', productId] });
                showToast('판매완료로 바꿨어요');
              } catch {
                showToast('판매완료 처리에 실패했어요');
              }
            },
          },
        ]
      : []),
    ...(room?.opponentId != null
      ? [
          {
            // 닉네임이 헤더 제목으로 올라가면서 눌러서 프로필로 가는 길이 사라졌다.
            // 그 길을 여기서 되살린다(#898).
            label: '프로필 보기',
            onPress: () => {
              setIsSheetOpen(false);
              router.push(`/(tabs)/(home)/users/${room.opponentId}` as Href);
            },
          },
          {
            label: '신고하기',
            onPress: () => {
              setIsSheetOpen(false);
              router.push({
                pathname: '/report',
                params: {
                  kind: 'user',
                  id: String(room.opponentId),
                  name: room.opponentNickname ?? '',
                },
              });
            },
          },
          {
            label: '차단하기',
            tone: 'danger' as const,
            onPress: () => {
              setIsSheetOpen(false);
              setIsBlockOpen(true);
            },
          },
        ]
      : []),
    {
      label: '채팅방 나가기',
      tone: 'danger' as const,
      onPress: () => {
        setIsSheetOpen(false);
        setIsLeaveOpen(true);
      },
    },
  ];

  // 사진 보내기(#900). 고르기·줄이기·올리기는 상품 등록이 쓰던 것을 그대로 쓴다.
  //
  // ⚠️ **한 장씩 보낸다.** 여러 장을 골라도 올라간 순서대로 하나씩 나간다 — 사진 하나가
  //    말풍선 하나다. 웹도 그렇다.
  // ⚠️ 폰 사진은 3~8MB라 줄이지 않으면 서버가 거절한다(한 장 5MB). shrinkImage 가 800px·webp 로
  //    줄이고, 덤으로 아이폰 HEIC 도 서버 허용 형식으로 바뀐다.
  const handlePickImage = async () => {
    const picked = await pickImages(MAX_IMAGES);
    if (picked.length === 0) return;

    setIsUploading(true);
    try {
      for (const image of picked) {
        const shrunk = await shrinkImage(image.uri);
        const url = await uploadOne(shrunk);
        const ok = chatSocket.publish('/app/chat/message', {
          chatRoomId,
          content: '',
          messageType: 'IMAGE',
          imageUrl: url,
        });
        if (!ok) {
          // 웹 문구 그대로다.
          showToast('메시지를 전송할 수 없습니다. 채팅 서버에 연결되어 있지 않습니다.');
          break;
        }
      }
    } catch {
      // 웹 문구 그대로다("이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요").
      showToast('이미지 업로드에 실패했어요. 잠시 후 다시 시도해주세요');
    } finally {
      setIsUploading(false);
    }
  };

  // 나간 뒤에는 **뒤로 가지 않고** 채팅 목록으로 바꿔 놓는다.
  // 뒤로 가면 들어온 곳(알림·상품 상세)으로 돌아가는데, 거기서 같은 알림을 다시 누르면
  // 이미 없어진 방을 열게 된다.
  const handleLeave = async () => {
    try {
      await leaveChatRoom(chatRoomId);
      setIsLeaveOpen(false);
      router.replace('/(tabs)/chat');
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
          onRetry={() => router.replace('/(tabs)/chat')}
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
    // 방만 만들어지고 아직 한 마디도 안 오간 방. 전에는 흰 화면만 보여서 「고장인가」로 보였다.
    // 문구는 웹과 한 곳(@cuddle/shared)에서 가져온다.
    //
    // ⚠️ 차단한 방에서는 설명 줄을 뺀다 — 보낼 수 없는 곳에서 「보내보세요」라고 하면 안 된다.
    if (messages.length === 0) {
      return (
        <EmptyState
          title={CHAT_EMPTY_TITLE}
          description={isOpponentBlocked ? '' : CHAT_EMPTY_DESCRIPTION}
        />
      );
    }
    return (
      <FlatList
        ref={listRef}
        style={styles.flex}
        data={rows}
        keyExtractor={(row) => row.key}
        // ⚠️ 열쇠가 바뀌면 목록도 다시 그려야 한다. FlatList 는 PureComponent 라
        //    바깥 상태만 바뀌면 못 알아챈다 — 그걸 알려주는 값이 extraData 다.
        extraData={열쇠}
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <View style={styles.dayWrap}>
              <Text style={styles.day}>{item.label}</Text>
            </View>
          ) : (
            <MessageBubble
              // 열쇠가 바뀌면 말풍선을 갈아 끼워 고른 글자를 푼다. 말풍선 조각
              // (components/chat/message-bubble.tsx)은 이 화면 몫이 아니라, 조각을 안 고치고
              // 할 수 있는 자리가 여기뿐이다.
              //
              // ⚠️ **사진 말풍선에는 안 건다.** 사진 조각은 「못 불러왔다」와 「확대창이 열렸다」를
              //    자기 상태로 들고 있어서, 갈아 끼우면 **보고 있던 확대창이 닫힌다.**
              //    사진 말풍선에는 selectable 글자도 없어 풀 것이 애초에 없다.
              //    게시글 상세도 같은 까닭으로 본문·댓글에는 안 건다
              //    (`posts/[id].tsx` 의 `PostBody`·`CommentList` — 거기에는 `key={열쇠}` 를 안 건다).
              key={item.message.messageType === 'IMAGE' ? undefined : `${item.key}-${열쇠}`}
              message={item.message}
            />
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

  // 누름 구경(누름구경)은 **맨 바깥**에 단다 — 화면 어디서 시작된 누름이든 여기로 올라온다.
  // onTouchStart/onTouchEnd 뿐이라 responder 를 안 가져간다(꾹 누르기가 산다).
  return (
    <SafeAreaView
      testID="chat-room-screen"
      style={styles.container}
      edges={['top', 'bottom']}
      {...누름구경}
    >
      {/* 「나가기」를 ⋮ 안으로 옮겼다(#894). 웹도 그 자리다 — 나가기·신고·차단·판매완료가
          한 메뉴에 모여 있어야 「이 방에서 할 수 있는 일」이 한 곳에서 보인다. */}
      {/* 제목은 **상대 닉네임**이다(#898). 「채팅」은 이미 아는 사람에게 아무것도 안 알려주고,
          그 자리를 쓰면 상대 줄이 통째로 빠져 대화가 그만큼 길어진다.
          값이 아직 안 왔을 때만 「채팅」으로 둔다 — 빈 헤더보다 낫다. */}
      <ScreenHeader
        title={room?.opponentNickname ?? '채팅'}
        align="left"
        onPressIcon={() => router.back()}
        right={
          <Text
            accessibilityRole="button"
            accessibilityLabel="더보기"
            onPress={() => setIsSheetOpen(true)}
            style={styles.more}
          >
            ⋮
          </Text>
        }
      />
      <ProductActionSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        actions={sheetActions}
      />
      {/* 상대가 탈퇴하면 opponentId 가 없어 차단할 대상이 없다 — 그때는 이 창을 아예 안 만든다. */}
      {room?.opponentId != null ? (
        <BlockConfirm
          visible={isBlockOpen}
          nickname={room.opponentNickname ?? '알 수 없는 사용자'}
          userId={room.opponentId}
          onClose={() => setIsBlockOpen(false)}
          onDone={() => {
            setIsBlockOpen(false);
            showToast('차단했습니다');
            // 차단하면 이 방의 입력칸이 잠긴다(#877). 서버가 그 값을 메시지 조회에 실어 주므로
            // 다시 불러 화면에 반영한다.
            fetchChatMessages(chatRoomId, 0)
              .then((result) => setIsOpponentBlocked(result.isOpponentBlocked))
              .catch(() => {});
          }}
        />
      ) : null}
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
      {/* 누구와 무슨 상품 이야기인지(#889). 목록이 아니라 **머리말 바로 아래**에 붙박이로 둔다 —
          웹도 같은 자리다(ChattingPage.tsx 의 sticky top-0). 조회가 실패하면 room 이 없어
          아무것도 안 그려지고, 그 자리는 아래의 오류 안내가 채운다. */}
      {room ? (
        <ChatRoomInfo
          room={room}
          tradeStatus={product?.tradeStatus}
          productType={product?.productType}
        />
      ) : null}
      {/* 안 붙어 있는 동안에도 지난 메시지는 보인다(REST 로 가져왔다). 보내기만 막는다.
          차단한 방에서는 이 띠를 안 띄운다 — 아래에 이미 안내가 있어 두 번 말하게 된다. */}
      {!connected && !isOpponentBlocked ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>연결 중이에요…</Text>
        </View>
      ) : null}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {renderBody()}
        {isOpponentBlocked ? (
          // 입력칸을 통째로 치우고 그 자리에 이유를 적는다 — **웹과 같은 방식이다.**
          // 잠긴 칸을 남겨 두면 눌러 보고 나서야 안 되는 걸 알게 된다.
          <View style={styles.blockedBar}>
            <Text style={styles.blockedText}>{CHAT_BLOCKED_NOTICE}</Text>
          </View>
        ) : (
          <ChatInput
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            disabled={!connected}
            onPickImage={handlePickImage}
            uploading={isUploading}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  listBody: { paddingBottom: 8 },
  // ⋮ 는 글자다. 아이콘을 쓰면 크기가 헤더의 다른 글자와 따로 놀아서, 웹의 EllipsisVertical
  // 과 같은 자리·같은 무게로 맞추기 어렵다. 누를 자리를 넓히려고 좌우 여백을 준다.
  more: { fontSize: 20, lineHeight: 20, paddingHorizontal: 6, color: colors.onSurfaceMuted },
  banner: { alignItems: 'center', paddingVertical: 6, backgroundColor: colors.surfaceSunken },
  bannerText: { fontSize: 12, color: colors.onSurfaceMuted },
  // 입력칸이 있던 자리. 테두리와 바탕을 ChatInput 과 맞춰 화면이 덜컹거리지 않게 한다.
  blockedBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSunken,
    backgroundColor: colors.surface,
  },
  blockedText: { fontSize: 13, color: colors.onSurfaceMuted, textAlign: 'center' },
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
