'use client'

import { useRef, useState } from 'react'
import { ROUTES } from '@/constants/routes'
import type { fetchChatRoom } from '@/types'
import Link from 'next/link'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import ChatProductCard from '@/components/commons/card/ChatProductCard'
import { fetchGraphQL } from '@/lib/api/graphql'
import { chatSocketStore } from '@/store/chatSocketStore'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, EllipsisVertical } from 'lucide-react'
import IconButton from '@/components/commons/button/IconButton'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { useToastStore } from '@/store/toastStore'
import dynamic from 'next/dynamic'

// 창은 열릴 때만 받아 온다 — UserPage 가 신고·차단 창을 다루는 방식과 같다.
const LeaveChatRoomModal = dynamic(() => import('@/components/modal/LeaveChatRoomModal'))
const UserReportModal = dynamic(() => import('@/components/modal/UserReportModal'))
const BlockModal = dynamic(() => import('@/components/modal/BlockModal'))

interface ChatRoomInfoProps {
  data: fetchChatRoom
  onLeaveRoom: (leftRoomId: number) => void
  onBack?: () => void
}

export function ChatRoomInfo({ data, onLeaveRoom, onBack }: ChatRoomInfoProps) {
  const queryClient = useQueryClient()
  const { unsubscribeFromRoom } = chatSocketStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLeaveOpen, setIsLeaveOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isBlockOpen, setIsBlockOpen] = useState(false)
  // 상대가 회원 탈퇴하면 opponentId 가 없다. 그때는 신고·차단을 안 그린다.
  const canReportOrBlock = data.opponentId != null
  const menuRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isMenuOpen, [menuRef], () => setIsMenuOpen(false))

  // 여기서 잡지 않는다 — 던지면 확인창이 받아서 「나가지 못했습니다」를 띄우고 창을 닫지 않는다.
  // 전에는 console.error 만 해서, 실패해도 사용자에게는 아무 일도 안 일어난 것처럼 보였다.
  const handleOutChatRoom = async () => {
    await fetchGraphQL(
      `
        mutation LeaveChatRoom($chatRoomId: Int!) {
          leaveChatRoom(chatRoomId: $chatRoomId) { success }
        }
      `,
      { chatRoomId: data.chatRoomId }
    )
    unsubscribeFromRoom(data.chatRoomId)
    queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
    onLeaveRoom(data.chatRoomId)
  }

  const handleTradeStatusChange = async () => {
    setIsMenuOpen(false)
    try {
      await fetchGraphQL(
        `
        mutation UpdateTradeStatus($id: Int!, $tradeStatus: String!) {
          updateTradeStatus(id: $id, tradeStatus: $tradeStatus) { success }
        }
      `,
        { id: data.productId, tradeStatus: 'SOLD_OUT' }
      )
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
    } catch (error) {
      // 전에는 console.error 만 해서, 실패해도 사용자에게는 아무 일도 안 일어난 것처럼 보였다.
      console.error('거래 상태 변경 실패:', error)
      useToastStore.getState().error({
        title: '판매완료 처리에 실패했습니다.',
        content: '잠시 후 다시 시도해주세요.',
      })
    }
  }

  const menuItems = [
    { label: '판매완료 처리', onClick: handleTradeStatusChange },
    // 신고·차단은 공용 창을 쓴다. 전에는 여기서 바로 실행했고, 신고 사유가 CHAT_ABUSE 로
    // 못 박혀 있어 사기를 당해도 「채팅 부적절」로만 신고됐다. UserReportModal 은 사유 일곱과
    // 상세 설명·사진을 받는다 — UserPage 가 이미 그렇게 쓴다.
    //
    // ⚠️ 상대가 **회원 탈퇴**하면 opponentId 가 없다(서버가 「알 수 없는 사용자」로 준다).
    //    대상이 없으니 아예 안 그린다 — 눌리는데 반드시 실패하는 것보다 정직하다.
    //    「방을 나간」 것과는 다르다. 나간 상대는 opponentId 가 그대로 있고 그때는 신고·차단이
    //    되어야 한다 — 사기를 당하고 상대가 도망친 경우가 그렇다.
    ...(canReportOrBlock
      ? [
          {
            label: '신고하기',
            onClick: () => {
              setIsMenuOpen(false)
              setIsReportOpen(true)
            },
            className: 'text-danger-500',
          },
          {
            label: '차단하기',
            onClick: () => {
              setIsMenuOpen(false)
              setIsBlockOpen(true)
            },
            className: 'text-danger-500',
          },
        ]
      : []),
    // 나가기는 되돌릴 수 없다(대화가 사라지고 방을 다시 못 연다). 바로 실행하지 않고 확인창을 띄운다.
    {
      label: '채팅방 나가기',
      onClick: () => {
        setIsMenuOpen(false)
        setIsLeaveOpen(true)
      },
      className: 'text-danger-500',
    },
  ]

  return (
    <div className="flex flex-col gap-2.5 p-3.5">
      <LeaveChatRoomModal
        isOpen={isLeaveOpen}
        onCancel={() => setIsLeaveOpen(false)}
        onConfirm={handleOutChatRoom}
      />
      {canReportOrBlock ? (
        <>
          <UserReportModal
            isOpen={isReportOpen}
            userId={data.opponentId}
            userNickname={data.opponentNickname}
            onCancel={() => setIsReportOpen(false)}
          />
          <BlockModal
            isOpen={isBlockOpen}
            userId={data.opponentId}
            userNickname={data.opponentNickname}
            onCancel={() => setIsBlockOpen(false)}
          />
        </>
      ) : null}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button onClick={onBack} className="p-1 md:hidden">
              <ArrowLeft size={24} />
            </button>
          ) : null}
          <Link href={ROUTES.USER_ID(data.opponentId)} className="flex items-center gap-2 hover:opacity-80">
            <ProfileAvatar imageUrl={data?.opponentProfileImageUrl} nickname={data?.opponentNickname ?? ''} />
            <p className="font-semibold">{data?.opponentNickname}</p>
          </Link>
        </div>
        <div className="relative" ref={menuRef}>
          <IconButton aria-label="더보기" onClick={() => setIsMenuOpen((prev) => !prev)}>
            <EllipsisVertical size={20} className="text-gray-500" />
          </IconButton>
          {isMenuOpen ? (
            <div className="absolute top-8 right-0 z-50 flex flex-col rounded border border-gray-200 bg-white shadow-md">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`cursor-pointer px-4 py-2 text-left text-sm whitespace-nowrap hover:bg-gray-50 ${item.className ?? ''}`}
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <Link
        href={ROUTES.DETAIL_ID(Number(data?.productId), data?.productTitle)}
        className="bg-outline-variant/20 hover:bg-outline-variant/40 flex items-center gap-2 rounded-2xl px-2.5 py-3 transition-colors"
      >
        <ChatProductCard
          productImageUrl={data?.productImageUrl}
          productTitle={data?.productTitle}
          productPrice={data?.productPrice}
          size="md"
        />
      </Link>
    </div>
  )
}
