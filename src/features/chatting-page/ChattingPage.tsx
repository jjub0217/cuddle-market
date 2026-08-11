'use client'

import { fetchGraphQL } from '@/lib/api/graphql'
import { useUserStore } from '@/store/userStore'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import type { fetchChatRoom } from '@/types'
import { Send, Plus, ArrowLeft } from 'lucide-react'
import IconButton from '@/components/commons/button/IconButton'
import { ChatRooms } from '@/features/chatting-page/components/ChatRooms'
import { ChatRoomInfo } from '@/features/chatting-page/components/ChatRoomInfo'
import { useEffect, useMemo, useRef, useState } from 'react'
import { chatSocketStore } from '@/store/chatSocketStore'
import { ChatLog } from '@/features/chatting-page/components/ChatLog'
import ChatInput from './components/ChatInput'
import { uploadImage } from '@/lib/api/products'
import { cn } from '@/lib/utils/cn'
import { Z_INDEX } from '@/constants/ui'
import { CHAT_BLOCKED_NOTICE } from '@/constants/constants'
import Spinner from '@/components/commons/spinner/Spinner'
import imageCompression from 'browser-image-compression'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws-stomp'

export default function ChattingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [inputMessage, setInputMessage] = useState('')
  const [imageUploadError, setImageUploadError] = useState<React.ReactNode | null>(null)

  const router = useRouter()
  const { user, _hasHydrated, accessToken } = useUserStore()
  const params = useParams()
  const chatRoomId = params.id as string | undefined
  const {
    connect,
    disconnect,
    subscribeToRoom,
    isConnected,
    sendMessage,
    messages: realtimeMessages,
    clearUnreadCount,
    clearRoomMessages,
    chatRoomUpdates,
    connectionError,
    setConnectionError,
  } = chatSocketStore()

  const {
    data: roomMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMessages,
    error: errorMessages,
    refetch: refetchMessages,
  } = useInfiniteQuery({
    queryKey: ['messages', chatRoomId],
    queryFn: async ({ pageParam }) => {
      const data = await fetchGraphQL<{ chatMessages: any }>(
        `
        query ChatMessages($chatRoomId: Int!, $page: Int!, $size: Int!) {
          chatMessages(chatRoomId: $chatRoomId, page: $page, size: $size) {
            messages { messageId senderId senderNickname content messageType imageUrl createdAt }
            currentPage hasNext
          }
        }
      `,
        { chatRoomId: Number(chatRoomId), page: pageParam, size: 50 }
      )
      return data.chatMessages
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
    initialPageParam: 0,
    enabled: !!user && !!chatRoomId,
  })

  const httpMessages = roomMessages?.pages.flatMap((page) => page.messages) ?? []
  const allMessages = [...httpMessages, ...(realtimeMessages[Number(chatRoomId)] ?? [])]

  const {
    data: rooms,
    fetchNextPage: fetchNextRooms,
    hasNextPage: hasNextRooms,
    isFetchingNextPage: isFetchingNextRooms,
    isLoading: isLoadingRooms,
    error: errorRooms,
  } = useInfiniteQuery({
    queryKey: ['chatRooms'],
    queryFn: async ({ pageParam }) => {
      const data = await fetchGraphQL<{ chatRooms: any }>(
        `
        query ChatRooms($page: Int!, $size: Int!) {
          chatRooms(page: $page, size: $size) {
            chatRooms { chatRoomId productId productTitle productPrice productImageUrl opponentId opponentNickname opponentProfileImageUrl lastMessage lastMessageTime unreadCount isOpponentBlocked }
            currentPage hasNext
          }
        }
      `,
        { page: pageParam, size: 10 }
      )
      return data.chatRooms
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
    initialPageParam: 0,
    enabled: !!user,
  })

  const allRooms = useMemo(() => {
    const roomList = rooms?.pages.flatMap((page) => page.chatRooms) ?? []
    return roomList.sort((a, b) => {
      const timeA = chatRoomUpdates[a.chatRoomId]?.lastMessageTime ?? a.lastMessageTime
      const timeB = chatRoomUpdates[b.chatRoomId]?.lastMessageTime ?? b.lastMessageTime
      return new Date(timeB).getTime() - new Date(timeA).getTime()
    })
  }, [rooms, chatRoomUpdates])

  const selectedRoom = useMemo(() => {
    if (!chatRoomId) return null
    return allRooms.find((room) => room.chatRoomId === Number(chatRoomId)) ?? null
  }, [allRooms, chatRoomId])

  const isChatOpen = !!chatRoomId
  // 내가 이 방의 상대를 차단했으면 보내는 쪽을 잠근다(#877).
  //
  // ⚠️ 이건 **화면의 판단이지 서버의 규칙이 아니다.** 서버는 「상대 → 나」 한 방향만 막는다.
  //    그래서 잠기기 전에 보낸 글은 실제로 가고, 조용히 사라지는 메시지가 없다.
  const isOpponentBlocked = selectedRoom?.isOpponentBlocked ?? false

  const handleSelectRoom = (room: fetchChatRoom) => {
    const roomUnreadCount = chatSocketStore.getState().chatRoomUpdates[room.chatRoomId]?.unreadCount ?? room.unreadCount ?? 0
    if (roomUnreadCount > 0) {
      queryClient.setQueryData<{ unreadCount: number }>(['notifications', 'unreadCount'], (prev) => ({
        unreadCount: Math.max((prev?.unreadCount ?? 0) - roomUnreadCount, 0),
      }))
    }
    clearUnreadCount(room.chatRoomId)
    router.push(`/chat/${room.chatRoomId}`)
  }

  const handleSend = () => {
    if (isOpponentBlocked) return
    if (chatRoomId && inputMessage.length > 0) {
      sendMessage(Number(chatRoomId), inputMessage, 'TEXT')
      setInputMessage('')
    }
  }

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/webp' as const,
    }
    return await imageCompression(file, options)
  }

  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !chatRoomId) return

    try {
      const compressedFiles = await Promise.all(Array.from(files).map((file) => compressImage(file)))
      const uploadResult = await uploadImage(compressedFiles)
      const imageUrl = uploadResult.mainImageUrl
      sendMessage(Number(chatRoomId), '', 'IMAGE', imageUrl)
    } catch {
      setImageUploadError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">이미지 업로드에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
    e.target.value = ''
  }

  const handleLeaveRoom = (leftRoomId: number) => {
    const remainingRooms = allRooms?.filter((room) => room.chatRoomId !== leftRoomId) ?? []

    if (remainingRooms.length > 0) {
      const nextRoom = remainingRooms.sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      )[0]
      subscribeToRoom(nextRoom.chatRoomId)
      router.replace(`/chat/${nextRoom.chatRoomId}`)
    } else {
      router.replace('/chat')
    }
  }

  const handleBack = () => {
    // 채팅방 진입은 handleSelectRoom의 router.push('/chat/[id]')로 이뤄지므로
    // 목록으로 돌아갈 때 push('/chat')를 쓰면 history에 중복 엔트리가 쌓여
    // 이후 router.back()이 떠난 채팅방으로 되돌아간다. 정상 뒤로가기로 처리.
    router.back()
  }

  useEffect(() => {
    if (accessToken) {
      connect(WS_URL, accessToken)
    }
    return () => {
      disconnect()
    }
  }, [connect, disconnect, accessToken])

  useEffect(() => {
    if (isConnected && chatRoomId) {
      clearRoomMessages(Number(chatRoomId))
      subscribeToRoom(Number(chatRoomId))
    }
  }, [isConnected, chatRoomId, subscribeToRoom, clearRoomMessages])

  useEffect(() => {
    if (_hasHydrated && !user) {
      router.push('/auth/login')
    }
  }, [_hasHydrated, router, user])

  if (isLoadingRooms && !rooms) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  if (errorRooms || !rooms) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>채팅 목록을 불러올 수 없습니다</p>
          <button onClick={() => router.push('/')} className="text-blue-600 hover:text-blue-800">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('fixed inset-0 z-50 flex flex-col bg-white md:static md:z-auto md:h-auto md:pt-8')}>
      <h1 className="sr-only">채팅 페이지</h1>
      {/* 모바일 상단 헤더 (채팅 목록에서만 표시) */}
      {!isChatOpen ? (
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 md:hidden">
          <button type="button" onClick={() => router.back()} className="cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-base font-bold">채팅</span>
        </div>
      ) : null}
      <div
        className={cn(
          'border-outline-variant/10 bg-surface relative flex h-full flex-col border shadow-2xl md:mx-auto md:h-[calc(100vh-8rem)] md:w-full md:max-w-7xl md:flex-row md:rounded-3xl',
          isChatOpen ? 'flex-1 overflow-hidden md:flex-none' : ''
        )}
      >
        <div className={cn('md:flex', isChatOpen ? 'hidden' : 'block')}>
          <ChatRooms
            rooms={allRooms ?? []}
            handleSelectRoom={handleSelectRoom}
            selectedRoomId={selectedRoom?.chatRoomId ?? null}
            hasNextPage={hasNextRooms ?? false}
            isFetchingNextPage={isFetchingNextRooms}
            fetchNextPage={fetchNextRooms}
          />
        </div>
        <section
          className={cn(
            'relative flex w-full flex-col overflow-hidden border-l border-gray-300 max-md:flex-1 md:flex md:w-224',
            isChatOpen ? 'flex' : 'hidden'
          )}
        >
          {selectedRoom ? (
            <>
              <div className="border-outline-variant/60 sticky top-0 shrink-0 border-b bg-white md:static md:top-16">
                <ChatRoomInfo data={selectedRoom} onLeaveRoom={handleLeaveRoom} onBack={handleBack} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-white px-3.5 pt-0 pb-20 md:pt-3.5 md:pb-3.5">
                <ChatLog
                  key={chatRoomId}
                  isLoadingMessages={isLoadingMessages}
                  errorMessages={errorMessages}
                  roomMessages={allMessages}
                  onLoadPrevious={() => fetchNextPage()}
                  hasMorePrevious={hasNextPage}
                  isLoadingPrevious={isFetchingNextPage}
                  onRetry={() => refetchMessages()}
                  imageUploadError={imageUploadError}
                  onClearImageUploadError={() => setImageUploadError(null)}
                  connectionError={connectionError}
                  onClearConnectionError={() => setConnectionError(null)}
                  isOpponentBlocked={isOpponentBlocked}
                />
              </div>
              <div
                className={cn(
                  'fixed right-0 bottom-0 left-0 border-t border-gray-300 bg-white px-3.5 py-3.5 md:relative',
                  Z_INDEX.HEADER
                )}
              >
                {isOpponentBlocked ? (
                  // 입력칸 묶음을 통째로 안 그린다 — 잠긴 칸을 보여주는 것보다 이유를 말하는 편이
                  // 낫다. 방과 지난 대화는 그대로 둔다(거래 이야기가 오갔을 수 있다).
                  <p className="text-center text-sm text-gray-500">{CHAT_BLOCKED_NOTICE}</p>
                ) : (
                  <div className="border-outline-variant/40 bg-surface/95 flex items-center gap-3 rounded-full border px-3 py-2">
                    <input
                      type="file"
                      id="chat-file-input"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSend}
                    />
                    <label
                      htmlFor="chat-file-input"
                      className="border-outline-variant/60 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-white hover:bg-gray-50"
                      aria-label="파일 첨부"
                    >
                      <Plus size={18} className="text-gray-500" />
                    </label>
                    <ChatInput value={inputMessage} onChange={setInputMessage} onSubmit={handleSend} />
                    <button
                      type="button"
                      aria-label="전송"
                      className="bg-primary-600 hover:bg-primary-600/90 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
                      // onClick 대신 onPointerDown + preventDefault:
                      // 모바일에서 textarea 포커스 중 버튼 탭 시 blur로 키보드가 닫히며
                      // fixed 입력창이 점프해 click이 취소되는 문제를 차단한다.
                      onPointerDown={(e) => {
                        e.preventDefault()
                        handleSend()
                      }}
                    >
                      <Send size={16} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-gray-500">
              <p className="text-lg">채팅을 시작해보세요</p>
              <p className="text-sm">상품 페이지에서 판매자에게 채팅을 보낼 수 있습니다</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
