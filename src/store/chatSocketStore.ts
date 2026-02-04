import { create } from 'zustand'
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import type { ChatRoomUpdateResponse, Message } from '@/types'
import SockJS from 'sockjs-client'

interface ChatSocketState {
  //---
  // socket: WebSocket | null
  socket: Client | null
  //---
  messages: Record<string, Message[]> // roomId -> 메시지 배열
  //---
  currentRoomId: number | null
  /* retryCount: number
  -> reconnectDelay : 옵션이 자동 재연결을 처리합니다. interface에 불필요
  reconnectDelay: 5000을 설정하면, 연결이 끊어졌을 때 5초 후 자동으로 재연결을 시도합니다. 수동으로 retryCount를 관리할 필요가 없습니다.*/
  //---
  // connect: (url: string) => void
  /** 백엔드에서 STOMP 연결 시 인증 토큰이 필요합니다. connectHeaders에 Authorization: Bearer ${accessToken}을 전달해야 합니다. */
  connect: (url: string, accessToken: string) => void
  //---
  //---
  // reconnect: (url: string) => void // ✅ 새로 추가
  /** reconnectDelay 옵션으로 자동 재연결을 처리합니다. */
  disconnect: () => void
  //---
  // joinRoom: (roomId: number) => void
  subscribeToRoom: (chatRoomId: number) => void
  /** joinRoom은 단순히 currentRoomId 상태만 변경했습니다. 실제로 서버에 구독 요청을 보내지 않았습니다.
   * STOMP에서는 특정 채팅방의 메시지를 받으려면 해당 destination을 **구독(SUBSCRIBE)**해야 합니다
   * client.subscribe('/sub/chat/room/{chatRoomId}', callback)을 호출
   * 해당 destination으로 오는 메시지를 callback에서 처리
   * 구독 객체를 subscriptions 상태에 저장 (나중에 구독 해제용)
   */
  //---
  sendMessage: (chatRoomId: number, content: string, messageType?: 'TEXT' | 'IMAGE', imageUrl?: string | null) => void
  //---
  subscriptions: Record<number, StompSubscription> // 구독한 채팅방들의 구독 객체를 저장합니다. 나중에 unsubscribeFromRoom에서 특정 채팅방 구독을 해제할 때 사용합니다.
  unsubscribeFromRoom: (chatRoomId: number) => void // 채팅방을 나갈 때 해당 채팅방의 구독을 해제해야 합니다. subscriptions[chatRoomId].unsubscribe()를 호출합니다.
  clearRoomMessages: (chatRoomId: number) => void // 채팅방의 실시간 메시지를 초기화합니다. (중복 방지)
  isConnected: boolean // STOMP 연결 상태를 UI에서 확인할 수 있도록 합니다. onConnect 시 true, onDisconnect 시 false로 설정됩니다.
  // 채팅방별 업데이트 정보
  chatRoomUpdates: Record<number, ChatRoomUpdateResponse>
  updateChatRoomInList: (updatedChatRoom: ChatRoomUpdateResponse) => void
  clearUnreadCount: (chatRoomId: number) => void
  // 연결 에러 상태
  connectionError: string | null
  setConnectionError: (error: string | null) => void
}

export const chatSocketStore = create<ChatSocketState>((set, get) => ({
  socket: null,
  messages: {},
  currentRoomId: null,
  subscriptions: {}, // 채팅방별 구독 객체 저장
  isConnected: false, // 연결 상태
  chatRoomUpdates: {},
  connectionError: null, // 연결 에러 상태
  setConnectionError: (error: string | null) => set({ connectionError: error }),

  connect: (url: string, accessToken: string) => {
    // TOMP Client는 active 속성으로 연결 상태 확인
    if (get().socket?.active) return

    // STOMP Client 생성
    const socket = new Client({
      webSocketFactory: () => new SockJS(url, null, { transports: ['websocket'] }),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000, // 5초 후 자동 재연결
      // STOMP 연결 완료 시 호출
      onConnect: () => {
        // [필수] 에러 구독 - 디버깅에 필수!
        socket.subscribe('/user/queue/errors', (message) => {
          const error = JSON.parse(message.body)
          alert(`에러: ${error.message}`)
        })
        // 채팅방 목록 실시간 업데이트 이벤트
        socket.subscribe('/user/queue/chat-room-list', (message) => {
          const updatedChatRoom = JSON.parse(message.body)
          get().updateChatRoomInList(updatedChatRoom) // 목록 업데이트
        })
        socket.subscribe('/user/queue/chat', (message) => {
          const data = JSON.parse(message.body)
          // 차단된 메시지를 해당 채팅방 메시지에 추가
          set((state) => ({
            messages: {
              ...state.messages,
              [data.chatRoomId]: [...(state.messages[data.chatRoomId] || []), data],
            },
          }))
        })
        set({ socket, isConnected: true })
      },
      onDisconnect: () => {
        set({ isConnected: false })
      },
      // STOMP 에러 발생 시 호출
      onStompError: (frame) => {
        set({ connectionError: frame.headers['message'] || '채팅 서버 연결에 문제가 발생했습니다.' })
      },
    })
    // 연결 시작
    socket.activate()
    set({ socket })
  },
  updateChatRoomInList: (updatedChatRoom: ChatRoomUpdateResponse) => {
    set((state) => ({
      chatRoomUpdates: {
        ...state.chatRoomUpdates,
        [updatedChatRoom.chatRoomId]: updatedChatRoom,
      },
    }))
  },
  clearUnreadCount: (chatRoomId: number) => {
    set((state) => ({
      chatRoomUpdates: {
        ...state.chatRoomUpdates,
        [chatRoomId]: {
          ...(state.chatRoomUpdates[chatRoomId] || {}),
          unreadCount: 0,
        },
      },
    }))
  },
  disconnect: () => {
    // socket 가져오기
    const socket = get().socket
    if (socket) {
      socket.deactivate()
      set({ socket: null, isConnected: false, subscriptions: {} })
    }
  },

  subscribeToRoom: (chatRoomId: number) => {
    // socket 가져오기
    const socket = get().socket
    // 연결 상태 확인
    if (!socket?.active) return

    // 이미 구독 중이면 중복 구독 방지
    if (get().subscriptions[chatRoomId]) return

    // 구독 실행
    // 반환값인 subscription 객체는 나중에 구독 해제(unsubscribe)할 때 사용합니다.
    const subscription = socket.subscribe(
      // 구독 destination
      `/topic/chat/${chatRoomId}`,
      // 메시지 수신 콜백
      // 내가 보낸 메시지도 서버로부터 다시 받아서 UI에 반영합니다.
      (message: IMessage) => {
        // 메시지 파싱
        const data = JSON.parse(message.body)
        // 메시지 상태 업데이트
        set((state) => ({
          messages: {
            ...state.messages,
            [chatRoomId]: [...(state.messages[chatRoomId] || []), data],
          },
        }))
      }
    )
    //  상태 업데이트 (currentRoomId + subscriptions)
    set((state) => ({
      currentRoomId: chatRoomId,
      subscriptions: { ...state.subscriptions, [chatRoomId]: subscription },
    }))
  },

  subscribeToUnreadCount: (chatRoomId: number) => {
    // socket 가져오기
    const socket = get().socket
    // 연결 상태 확인
    if (!socket?.active) return

    // 이미 구독 중이면 중복 구독 방지
    if (get().subscriptions[chatRoomId]) return

    // 구독 실행
    const subscription = socket.subscribe(
      // 구독 destination
      `/user/queue/chat-room-list`,
      (message: IMessage) => {
        // 메시지 파싱
        const data = JSON.parse(message.body)
        // 메시지 상태 업데이트
        set((state) => ({
          messages: {
            ...state.messages,
            [chatRoomId]: [...(state.messages[chatRoomId] || []), data],
          },
        }))
      }
    )
    //  상태 업데이트 (currentRoomId + subscriptions)
    set((state) => ({
      currentRoomId: chatRoomId,
      subscriptions: { ...state.subscriptions, [chatRoomId]: subscription },
    }))
  },

  sendMessage: (chatRoomId: number, content: string, messageType: 'TEXT' | 'IMAGE' = 'TEXT', imageUrl: string | null = null) => {
    const socket = get().socket
    if (!socket?.active) {
      set({ connectionError: '메시지를 전송할 수 없습니다. 채팅 서버에 연결되어 있지 않습니다.' })
      return
    }

    const message = {
      chatRoomId,
      content,
      messageType,
      imageUrl,
    }
    socket.publish({
      destination: '/app/chat/message',
      body: JSON.stringify(message),
    })

    // 채팅방 목록의 lastMessage 즉시 업데이트 (UI 반영)
    const lastMessageText = messageType === 'IMAGE' ? '사진을 보냈습니다' : content
    set((state) => ({
      chatRoomUpdates: {
        ...state.chatRoomUpdates,
        [chatRoomId]: {
          ...(state.chatRoomUpdates[chatRoomId] || {}),
          chatRoomId,
          lastMessage: lastMessageText,
          lastMessageTime: new Date().toISOString(),
        },
      },
    }))
  },

  unsubscribeFromRoom: (chatRoomId: number) => {
    const subscription = get().subscriptions[chatRoomId]
    if (subscription) {
      subscription.unsubscribe()

      set((state) => {
        const { [chatRoomId]: _, ...rest } = state.subscriptions
        return { subscriptions: rest }
      })
    }
  },
  clearRoomMessages: (chatRoomId: number) => {
    set((state) => {
      const { [chatRoomId]: _, ...rest } = state.messages
      return { messages: rest }
    })
  },
}))
