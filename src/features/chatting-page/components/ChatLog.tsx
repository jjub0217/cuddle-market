'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Message } from '@/types'
import { cn } from '@/lib/utils/cn'
import { useUserStore } from '@/store/userStore'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'

interface ChatLogProps {
  isLoadingMessages: boolean
  errorMessages: Error | null
  roomMessages: Message[]
  onLoadPrevious?: () => void
  hasMorePrevious?: boolean
  isLoadingPrevious?: boolean
  onRetry?: () => void
  connectionError?: React.ReactNode
  onClearConnectionError?: () => void
  imageUploadError?: React.ReactNode
  onClearImageUploadError?: () => void
}

function ChatImageMessage({ imageUrl, alt }: { imageUrl?: string; alt: string }) {
  const [imgError, setImgError] = useState(false)
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  const handleImageError = () => {
    if (!imgError && imageUrl) {
      setImgError(true)
    } else {
      setUsePlaceholder(true)
    }
  }

  const getImageSrc = () => {
    if (usePlaceholder || !imageUrl) return PLACEHOLDER_IMAGES[400]
    if (imgError) return imageUrl
    return toResizedWebpUrl(imageUrl, 400)
  }

  return (
    <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg md:static">
      <Image
        src={getImageSrc()}
        loader={imgError || usePlaceholder || !imageUrl ? undefined : imageLoader}
        sizes={IMAGE_SIZES.smallThumbnail}
        alt={alt}
        fill
        className="object-cover"
        onError={handleImageError}
        unoptimized={imgError || usePlaceholder || !imageUrl}
      />
    </div>
  )
}

const getIsMine = (message: Message, userId?: number): boolean => {
  if (typeof message.isMine === 'boolean') {
    return message.isMine
  }
  return message.senderId === userId
}

const chatFormatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours < 12 ? '오전' : '오후'
  const hour12 = hours % 12 || 12
  return `${period} ${hour12}:${minutes}`
}

const chatFormatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = days[date.getDay()]
  return `${year}년 ${month}월 ${day}일 ${dayOfWeek}`
}

const groupMessagesByDate = (messages: Message[]) => {
  const groups: Record<string, Message[]> = {}
  messages.forEach((message) => {
    const dateKey = new Date(message.createdAt).toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(message)
  })
  return groups
}

export function ChatLog({
  isLoadingMessages,
  errorMessages,
  roomMessages,
  onLoadPrevious,
  hasMorePrevious,
  isLoadingPrevious,
  onRetry,
  connectionError,
  onClearConnectionError,
  imageUploadError,
  onClearImageUploadError,
}: ChatLogProps) {
  const { user } = useUserStore()
  const groupedMessages = groupMessagesByDate(roomMessages)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (scrollRef.current) {
      if (scrollRef.current.scrollTop === 0 && hasMorePrevious && !isLoadingPrevious) {
        onLoadPrevious?.()
      }
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [roomMessages])

  if (isLoadingMessages && !roomMessages) {
    return (
      <div className="px-lg py-md tablet:py-xl mx-auto max-w-7xl">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" role="status" aria-label="상품 로딩 중"></div>
        </div>
      </div>
    )
  }

  if (errorMessages) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>메세지를 불러올 수 없습니다</p>
          <button onClick={onRetry} className="text-blue-600 hover:text-blue-800">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex h-full flex-col gap-4 overflow-y-auto">
      <AnimatePresence>
        {connectionError && (
          <div className="sticky top-0 left-1/2 z-10 w-fit -translate-x-1/2">
            <InlineNotification type="error" onClose={() => onClearConnectionError?.()}>
              <div className="flex flex-col gap-0.5">
                <p className="text-base font-semibold">채팅 서버 연결에 문제가 발생했습니다.</p>
                <p>{connectionError}</p>
              </div>
            </InlineNotification>
          </div>
        )}
        {imageUploadError && (
          <div className="sticky top-0 left-1/2 z-10 w-fit -translate-x-1/2">
            <InlineNotification type="error" onClose={() => onClearImageUploadError?.()}>
              {imageUploadError}
            </InlineNotification>
          </div>
        )}
      </AnimatePresence>
      {Object.entries(groupedMessages).map(([dateKey, messages]) => (
        <div key={dateKey} className="flex flex-col gap-2">
          <div className="flex justify-center">
            <span className="rounded-full bg-[#8d99a3] px-3 py-2 text-sm font-semibold text-[#f0f9ff]">{chatFormatDate(messages[0].createdAt)}</span>
          </div>
          <ul>
            {messages.map((message) => {
              const isMine = getIsMine(message, user?.id)
              return message.messageType === 'SYSTEM' ? (
                <li key={message.messageId} className="bg-primary-100 m-6 mx-auto w-fit rounded-full px-3 py-1 text-center">
                  {message.content}
                </li>
              ) : message.isBlocked ? (
                <li key={message.messageId} className="ml-auto flex w-fit max-w-64 min-w-60 flex-col rounded-full px-3 py-1">
                  <span className="rounded-t-lg rounded-bl-lg bg-gray-900 px-3 py-2 text-white">{message.content}</span>
                  <span className="text-sm">개인정보 포함으로 상대방에게 전송되지 않았습니다.</span>
                </li>
              ) : (
                <li
                  key={message.messageId}
                  className={cn('flex max-w-64 min-w-60 flex-col gap-1 rounded-lg px-3 py-2', isMine ? 'ml-auto' : 'mr-auto')}
                >
                  {!isMine && <p className="text-sm text-gray-600">{message.senderNickname}</p>}
                  {message.messageType === 'IMAGE' ? (
                    <ChatImageMessage imageUrl={message.imageUrl ?? undefined} alt={message.senderNickname} />
                  ) : (
                    <span
                      className={cn(
                        'rounded-t-lg px-3 py-2 whitespace-pre-wrap',
                        isMine ? 'rounded-bl-lg bg-gray-900 text-white' : 'rounded-br-lg border border-gray-300 bg-white'
                      )}
                    >
                      {message.content}
                    </span>
                  )}
                  <span className={cn('text-xs text-gray-500', isMine ? 'text-right' : 'text-left')}>{chatFormatTime(message.createdAt)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
