'use client'

import { fetchRoomMessages, fetchRooms } from '@/lib/api/chatting'
import { useUserStore } from '@/store/userStore'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import type { fetchChatRoom } from '@/types'
import { Send, Paperclip } from 'lucide-react'
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
    queryFn: ({ pageParam }) => fetchRoomMessages(Number(chatRoomId), pageParam),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
    initialPageParam: 0,
    enabled: !!user && !!chatRoomId,
  })

  const httpMessages = roomMessages?.pages.flatMap((page) => page.data.messages) ?? []
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
    queryFn: ({ pageParam }) => fetchRooms(pageParam),
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
    router.push('/chat')
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
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
    <div className="md:pb-4xl bg-white md:h-auto md:pt-8">
      <h1 className="sr-only">채팅 페이지</h1>
      <div className="mx-auto flex h-full max-w-7xl flex-col md:h-[80vh] md:flex-row">
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
        <section className={cn('relative flex flex-1 flex-col border border-gray-300 md:flex', isChatOpen ? 'flex' : 'hidden')}>
          {selectedRoom ? (
            <>
              <div className="sticky top-16 shrink-0 md:static">
                <ChatRoomInfo data={selectedRoom} onLeaveRoom={handleLeaveRoom} onBack={handleBack} />
              </div>
              <div className="bg-primary-50 min-h-0 flex-1 p-3.5 pb-20 md:pb-3.5">
                <ChatLog
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
                />
              </div>
              <div
                className={cn(
                  'fixed right-0 bottom-0 left-0 flex items-center gap-2.5 border-t border-gray-300 bg-white p-3.5 md:relative',
                  Z_INDEX.HEADER
                )}
              >
                <input
                  type="file"
                  id="chat-file-input"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSend}
                />
                <label htmlFor="chat-file-input" className="cursor-pointer rounded p-1">
                  <Paperclip size={20} />
                </label>
                <ChatInput value={inputMessage} onChange={setInputMessage} onSubmit={handleSend} />
                <IconButton aria-label="전송" size="lg" className="bg-primary-100 aspect-square h-full" onClick={handleSend}>
                  <Send className="text-white" />
                </IconButton>
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
