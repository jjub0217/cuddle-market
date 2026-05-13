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

interface ChatRoomInfoProps {
  data: fetchChatRoom
  onLeaveRoom: (leftRoomId: number) => void
  onBack?: () => void
}

export function ChatRoomInfo({ data, onLeaveRoom, onBack }: ChatRoomInfoProps) {
  const queryClient = useQueryClient()
  const { unsubscribeFromRoom } = chatSocketStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isMenuOpen, [menuRef], () => setIsMenuOpen(false))

  const handleOutChatRoom = async () => {
    try {
      await fetchGraphQL(`
        mutation LeaveChatRoom($chatRoomId: Int!) {
          leaveChatRoom(chatRoomId: $chatRoomId) { success }
        }
      `, { chatRoomId: data.chatRoomId })
      unsubscribeFromRoom(data.chatRoomId)
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
      onLeaveRoom(data.chatRoomId)
    } catch (error) {
      console.error('채팅방 나가기 실패:', error)
    }
  }

  const handleTradeStatusChange = async () => {
    setIsMenuOpen(false)
    try {
      await fetchGraphQL(`
        mutation UpdateTradeStatus($id: Int!, $tradeStatus: String!) {
          updateTradeStatus(id: $id, tradeStatus: $tradeStatus) { success }
        }
      `, { id: data.productId, tradeStatus: 'SOLD_OUT' })
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
    } catch (error) {
      console.error('거래 상태 변경 실패:', error)
    }
  }

  const handleReportUser = async () => {
    setIsMenuOpen(false)
    try {
      await fetchGraphQL(`
        mutation ReportUser($userId: Int!, $reasonCode: String!) {
          reportUser(userId: $userId, reasonCode: $reasonCode) { success }
        }
      `, { userId: data.opponentId, reasonCode: 'CHAT_ABUSE' })
      alert('신고가 접수되었습니다.')
    } catch (error) {
      if (error instanceof Error && error.message.includes('이미 신고한')) {
        alert('이미 신고한 사용자입니다.')
      } else {
        console.error('신고 실패:', error)
        alert('신고에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    }
  }

  const handleBlockUser = async () => {
    setIsMenuOpen(false)
    try {
      await fetchGraphQL(`
        mutation BlockUser($userId: Int!) {
          blockUser(userId: $userId) { success }
        }
      `, { userId: data.opponentId })
      alert('차단되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
    } catch (error) {
      console.error('차단 실패:', error)
      alert('차단에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const menuItems = [
    { label: '판매완료 처리', onClick: handleTradeStatusChange },
    { label: '신고하기', onClick: handleReportUser, className: 'text-danger-500' },
    { label: '차단하기', onClick: handleBlockUser, className: 'text-danger-500' },
    { label: '채팅방 나가기', onClick: handleOutChatRoom, className: 'text-danger-500' },
  ]

  return (
    <div className="flex flex-col gap-2.5 bg-white p-3.5">
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
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-3 hover:bg-gray-50"
      >
        <ChatProductCard productImageUrl={data?.productImageUrl} productTitle={data?.productTitle} productPrice={data?.productPrice} size="md" />
      </Link>
    </div>
  )
}
