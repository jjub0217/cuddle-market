'use client'

import { useState, useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
// 시각·날짜 포맷터의 원본은 @cuddle/shared에 있다(앱도 같은 것을 쓴다).
import { chatDateKey, formatChatDate, formatChatTime } from '@cuddle/shared'
// 빈 방 안내 문구도 원본은 @cuddle/shared에 있다(앱이 같은 것을 쓴다).
import { CHAT_EMPTY_TITLE, CHAT_EMPTY_DESCRIPTION } from '@/constants/constants'
import type { Message } from '@/types'
import { cn } from '@/lib/utils/cn'
import { useUserStore } from '@/store/userStore'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import Spinner from '@/components/commons/spinner/Spinner'
import { MessageCircleMore } from 'lucide-react'

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
  /** 내가 이 방의 상대를 차단했는가(#877). 빈 방 안내에서 「보내보세요」를 뺄 때 쓴다. */
  isOpponentBlocked?: boolean
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
    <div className="relative aspect-square w-48 shrink-0 overflow-hidden rounded-lg md:w-72">
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

const groupMessagesByDate = (messages: Message[]) => {
  const groups: Record<string, Message[]> = {}
  messages.forEach((message) => {
    const dateKey = chatDateKey(message.createdAt)
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
  isOpponentBlocked = false,
}: ChatLogProps) {
  const { user } = useUserStore()
  const groupedMessages = groupMessagesByDate(roomMessages)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const prevScrollHeightRef = useRef(0)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      setIsNearBottom(scrollHeight - scrollTop - clientHeight < 50)

      if (scrollTop === 0 && hasMorePrevious && !isLoadingPrevious) {
        prevScrollHeightRef.current = scrollHeight
        onLoadPrevious?.()
      }
    }
  }

  // 자동 스크롤 조건 — 실제 새 메시지가 추가된 경우에만 실행:
  // 1) 사용자가 맨 아래 근처에 있거나
  // 2) 마지막 메시지가 내가 보낸 메시지일 때 (스크롤이 위에 있어도 강제로 내림)
  const prevLengthRef = useRef(0)
  useLayoutEffect(() => {
    if (!scrollRef.current) return
    const isNewMessage = roomMessages.length > prevLengthRef.current
    prevLengthRef.current = roomMessages.length
    if (!isNewMessage) return
    const lastMessage = roomMessages[roomMessages.length - 1]
    const isLastFromMe = lastMessage ? getIsMine(lastMessage, user?.id) : false
    if (isLastFromMe || isNearBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [roomMessages, isNearBottom, user?.id])

  // 이전 메시지 로드 후 스크롤 위치 복원 (페인트 전에 실행하여 플리커 방지)
  useLayoutEffect(() => {
    if (scrollRef.current && prevScrollHeightRef.current > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = 0
    }
  }, [roomMessages])

  if (isLoadingMessages && !roomMessages) {
    return (
      <div className="px-lg py-md tablet:py-xl mx-auto max-w-7xl">
        <div className="flex items-center justify-center py-20">
          <Spinner size="md" label="상품 로딩 중" />
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

  // 메시지가 한 번도 오간 적 없는 빈 채팅방 — 빈 상태 안내로 영역을 채워
  // 휑함과 배경색 경계 노출을 함께 해소한다.
  if (!isLoadingMessages && roomMessages.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-[#1c1b1b] md:text-base">{CHAT_EMPTY_TITLE}</p>
          {/* 차단한 방에서는 안 그린다 — 보낼 수 없는 곳에서 보내라고 하면 안 된다. */}
          {isOpponentBlocked ? null : (
            <p className="text-xs text-gray-500 md:text-sm">{CHAT_EMPTY_DESCRIPTION}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex h-full flex-col gap-4 overflow-y-auto">
      <AnimatePresence>
        {connectionError ? (
          <div className="sticky top-5 z-10 mx-auto w-80 max-w-[calc(100%-1.5rem)] md:top-0">
            <InlineNotification type="error" onClose={() => onClearConnectionError?.()}>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold md:text-base">채팅 서버 연결에 문제가 발생했습니다.</p>
                <p>{connectionError}</p>
              </div>
            </InlineNotification>
          </div>
        ) : null}
        {imageUploadError ? (
          <div className="sticky top-0 z-10 mx-auto w-80 max-w-[calc(100%-1.5rem)]">
            <InlineNotification type="error" onClose={() => onClearImageUploadError?.()}>
              {imageUploadError}
            </InlineNotification>
          </div>
        ) : null}
      </AnimatePresence>
      {Object.entries(groupedMessages).map(([dateKey, messages]) => (
        <div key={dateKey} className="flex flex-col gap-3">
          <div className="mt-3.5 flex justify-center">
            {/* 날짜 알약. 예전에는 찬 회색(#eae7e7)이라 따뜻한 베이지 화면에서 혼자 튀었다(#891). */}
            <span className="bg-chip-surface text-on-surface-muted rounded-full px-3 py-1 text-xs font-semibold">
              {formatChatDate(messages[0].createdAt)}
            </span>
          </div>
          <ul className="flex flex-col">
            {messages.map((message, idx) => {
              const isMine = getIsMine(message, user?.id)
              const prevMessage = idx > 0 ? messages[idx - 1] : null
              const isSenderChanged = prevMessage ? getIsMine(prevMessage, user?.id) !== isMine : false
              return message.messageType === 'SYSTEM' ? (
                <li
                  key={message.messageId}
                  className="bg-primary-100 m-6 mx-auto w-fit rounded-full px-3 py-1 text-center text-sm"
                >
                  {message.content}
                </li>
              ) : message.isBlocked ? (
                <li key={message.messageId} className="ml-auto flex w-fit max-w-64 min-w-60 flex-col rounded-full px-3 py-1">
                  <span className="rounded-t-lg rounded-bl-lg bg-gray-900 px-3 py-2 text-sm text-white">{message.content}</span>
                  <span className="text-sm">개인정보 포함으로 상대방에게 전송되지 않았습니다.</span>
                </li>
              ) : (
                <li
                  key={message.messageId}
                  className={cn(
                    'flex w-fit items-end gap-1 px-3 py-1',
                    isMine ? 'ml-auto flex-row-reverse' : 'mr-auto',
                    isSenderChanged && 'mt-5'
                  )}
                >
                  {message.messageType === 'IMAGE' ? (
                    <ChatImageMessage imageUrl={message.imageUrl ?? undefined} alt={message.senderNickname} />
                  ) : (
                    /* 한 줄에 한글 40자에서 꺾는다. 그보다 길면 줄 끝에서 다음 줄 앞으로 눈이 못 돌아온다.
                       ⚠️ ch 는 「0」 글자 폭이라 한글 폭과 다르다 — 2026-08-10에 재서 정한 값이다.
                       text-sm(14px) · 실제 글꼴 체인 기준: 1ch = 8.34px, 한글 1자 = 12.10px (한글이 1.45배).
                       그래서 62ch = 517px = 한글 40자. 상한이 없던 지금은 한 줄에 69자까지 갔다.
                       ⚠️ 62ch 에는 px-3(좌우 24px)이 포함된다 — 박스가 border-box 라서 그렇다.
                       앱은 maxWidth: '72%' 를 쓴다(폭이 좁아 비율로 충분하다). */
                    <span
                      className={cn(
                        'max-w-[62ch] rounded-b-2xl px-3 py-2 text-sm whitespace-pre-wrap',
                        // primary-700 은 #633f00 — 색은 그대로고 토큰으로만 바꿨다(#891).
                        isMine ? 'bg-primary-700 rounded-tl-2xl text-white' : 'bg-surface-container-low rounded-tr-2xl'
                      )}
                    >
                      {message.content}
                    </span>
                  )}
                  <span className={cn('shrink-0 text-xs text-gray-500')}>{formatChatTime(message.createdAt)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
