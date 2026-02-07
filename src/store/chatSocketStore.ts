import { create } from 'zustand'
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import type { ChatRoomUpdateResponse, Message } from '@/types'
import SockJS from 'sockjs-client'

interface ChatSocketState {
  socket: Client | null
  messages: Record<string, Message[]>
  currentRoomId: number | null
  subscriptions: Record<number, StompSubscription>
  isConnected: boolean
  chatRoomUpdates: Record<number, ChatRoomUpdateResponse>
  connectionError: string | null

  connect: (url: string, accessToken: string) => void
  disconnect: () => void
  subscribeToRoom: (chatRoomId: number) => void
  sendMessage: (chatRoomId: number, content: string, messageType?: 'TEXT' | 'IMAGE', imageUrl?: string | null) => void
  unsubscribeFromRoom: (chatRoomId: number) => void
  clearRoomMessages: (chatRoomId: number) => void
  updateChatRoomInList: (updatedChatRoom: ChatRoomUpdateResponse) => void
  clearUnreadCount: (chatRoomId: number) => void
  setConnectionError: (error: string | null) => void
}

export const chatSocketStore = create<ChatSocketState>((set, get) => ({
  socket: null,
  messages: {},
  currentRoomId: null,
  subscriptions: {},
  isConnected: false,
  chatRoomUpdates: {},
  connectionError: null,

  setConnectionError: (error: string | null) => set({ connectionError: error }),

  connect: (url: string, accessToken: string) => {
    if (get().socket?.active) return

    const socket = new Client({
      webSocketFactory: () => new SockJS(url, null, { transports: ['websocket'] }),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        socket.subscribe('/user/queue/errors', (message) => {
          const error = JSON.parse(message.body)
          alert(`에러: ${error.message}`)
        })
        socket.subscribe('/user/queue/chat-room-list', (message) => {
          const updatedChatRoom = JSON.parse(message.body)
          get().updateChatRoomInList(updatedChatRoom)
        })
        socket.subscribe('/user/queue/chat', (message) => {
          const data = JSON.parse(message.body)
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
      onStompError: (frame) => {
        set({ connectionError: frame.headers['message'] || '채팅 서버 연결에 문제가 발생했습니다.' })
      },
    })

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
    const socket = get().socket
    if (socket) {
      socket.deactivate()
      set({ socket: null, isConnected: false, subscriptions: {} })
    }
  },

  subscribeToRoom: (chatRoomId: number) => {
    const socket = get().socket
    if (!socket?.active) return
    if (get().subscriptions[chatRoomId]) return

    const subscription = socket.subscribe(`/topic/chat/${chatRoomId}`, (message: IMessage) => {
      const data = JSON.parse(message.body)
      set((state) => ({
        messages: {
          ...state.messages,
          [chatRoomId]: [...(state.messages[chatRoomId] || []), data],
        },
      }))
    })

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

    const message = { chatRoomId, content, messageType, imageUrl }
    socket.publish({
      destination: '/app/chat/message',
      body: JSON.stringify(message),
    })

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
