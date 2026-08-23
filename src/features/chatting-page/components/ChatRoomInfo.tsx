'use client'

import { useRef, useState } from 'react'
import { ROUTES } from '@/constants/routes'
import type { fetchChatRoom } from '@/types'
import Link from 'next/link'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import ChatProductCard from '@/components/commons/card/ChatProductCard'
import { fetchGraphQL } from '@/lib/api/graphql'
import { chatSocketStore } from '@/store/chatSocketStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, EllipsisVertical } from 'lucide-react'
import IconButton from '@/components/commons/button/IconButton'
import { DropdownMenu, DropdownMenuItem } from '@/components/commons/DropdownMenu'
import { useToastStore } from '@/store/toastStore'
import { useUserStore } from '@/store/userStore'
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
  // 상대가 회원 탈퇴하면 opponentId 가 없다(서버가 「알 수 없는 사용자」로 준다).
  // 그러면 신고·차단도, 프로필로 가는 길도 대상이 없다.
  //
  // ⚠️ 「방을 나간」 것과는 다르다. 나간 상대는 opponentId 가 그대로 있고, 그때는 신고·차단이
  //    되어야 한다 — 사기를 당하고 상대가 도망친 경우가 그렇다.
  const hasOpponent = data.opponentId != null
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // 「판매완료 처리」는 **내 상품일 때만** 보여야 한다(#894). 방 정보에는 파는 사람이 없어서
  // 상품을 따로 봐야 안다.
  //
  // 전에는 메뉴 항목 하나(「판매완료 처리」)를 위해서만 필요해서 메뉴를 열 때만 불렀다.
  // 이제는 **거래 상태 뱃지**(ChatProductCard)가 방을 열자마자 늘 보여야 하므로 방을 열 때
  // 받아온다 — 「넷 중 하나를 위해 모두가 요청을 더 낸다」던 저울이, 뱃지가 생기며 바뀌었다.
  const { user } = useUserStore()
  const { data: product } = useQuery({
    queryKey: ['product', data.productId],
    queryFn: async () => {
      const result = await fetchGraphQL<{
        product: { tradeStatus: string | null; productType: string; sellerInfo: { sellerId: number } }
      }>(
        `
        query Product($id: Int!) {
          product(id: $id) { tradeStatus productType sellerInfo { sellerId } }
        }
      `,
        { id: data.productId }
      )
      return result.product
    },
    enabled: data.productId != null,
  })
  const isMyProduct = !!user && product?.sellerInfo?.sellerId === user.id

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
        // ⚠️ **COMPLETED 다.** 서버 enum 에 SOLD_OUT 은 없다(TradeStatus.java — SELLING ·
        //    RESERVED · COMPLETED). 전에는 없는 값을 보내서 **누르면 반드시 실패**했고,
        //    「판매완료 처리에 실패했습니다」가 서버 탈처럼 보여 원인을 알기 어려웠다(#894).
        { id: data.productId, tradeStatus: 'COMPLETED' }
      )
      // 'chatRooms' 는 방 목록(마지막 메시지 등)을 새로 그리려고, 'product' 는 이 방의
      // 거래 상태 뱃지(ChatProductCard)를 새로 그리려고 — 상품 질의를 안 지우면 뱃지가
      // 그대로 남아 「눌러도 화면에 아무 변화가 없다」는 원래 버그가 재현된다.
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
      queryClient.invalidateQueries({ queryKey: ['product', data.productId] })
    } catch (error) {
      // 전에는 console.error 만 해서, 실패해도 사용자에게는 아무 일도 안 일어난 것처럼 보였다.
      console.error('거래 상태 변경 실패:', error)
      useToastStore.getState().error({
        title: '판매완료 처리에 실패했습니다.',
        content: '잠시 후 다시 시도해주세요.',
      })
    }
  }

  const menuItems: { label: string; onClick: () => void; tone?: 'default' | 'danger' }[] = [
    // 내 상품이고 아직 끝나지 않은 거래일 때만. 산 사람에게 보여 봐야 서버가 막는다.
    ...(isMyProduct && product?.tradeStatus !== 'COMPLETED'
      ? [{ label: '판매완료 처리', onClick: handleTradeStatusChange }]
      : []),
    // 신고·차단은 공용 창을 쓴다. 전에는 여기서 바로 실행했고, 신고 사유가 CHAT_ABUSE 로
    // 못 박혀 있어 사기를 당해도 「채팅 부적절」로만 신고됐다. UserReportModal 은 사유 일곱과
    // 상세 설명·사진을 받는다 — UserPage 가 이미 그렇게 쓴다.
    //
    // 상대가 없으면 아예 안 그린다 — 눌리는데 반드시 실패하는 것보다 정직하다.
    ...(hasOpponent
      ? [
          {
            label: '신고하기',
            onClick: () => {
              setIsMenuOpen(false)
              setIsReportOpen(true)
            },
            tone: 'danger' as const,
          },
          {
            label: '차단하기',
            onClick: () => {
              setIsMenuOpen(false)
              setIsBlockOpen(true)
            },
            tone: 'danger' as const,
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
      tone: 'danger' as const,
    },
  ]

  return (
    <div className="flex flex-col gap-2.5 p-3.5">
      <LeaveChatRoomModal
        isOpen={isLeaveOpen}
        onCancel={() => setIsLeaveOpen(false)}
        onConfirm={handleOutChatRoom}
      />
      {hasOpponent ? (
        <>
          <UserReportModal
            isOpen={isReportOpen}
            userId={data.opponentId}
            userNickname={data.opponentNickname}
            onCancel={() => setIsReportOpen(false)}
          />
          {/* 차단이 끝나면 방 목록을 다시 부른다 — 거기에 isOpponentBlocked 가 실려 오고,
              그 값으로 입력창이 잠긴다(#877). BlockModal 은 ['userPage'] 만 무효화해서
              이걸 안 하면 차단해도 화면이 그대로다.

              ⚠️ BlockModal 은 성공에도 취소에도 onCancel 을 부른다(성공하면 창을 닫으려고).
                 그래서 취소해도 한 번 더 부르게 되는데, 방 목록 한 쪽(10개)이라 싸다.
                 창을 고치지 않는 쪽을 골랐다 — 다른 화면 셋이 같은 창을 쓴다. */}
          <BlockModal
            isOpen={isBlockOpen}
            userId={data.opponentId}
            userNickname={data.opponentNickname}
            onCancel={() => {
              setIsBlockOpen(false)
              queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
            }}
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
          {/* 상대가 회원 탈퇴하면 opponentId 가 없다. 그때는 갈 곳이 없으니 링크를 안 건다 —
              신고·차단을 감추는 것과 같은 뿌리다. 이름(「알 수 없는 사용자」)과 기본 프로필은
              그대로 보여준다. 방과 대화 기록은 남아 있어야 하기 때문이다. */}
          {hasOpponent ? (
            <Link href={ROUTES.USER_ID(data.opponentId)} className="flex items-center gap-2 hover:opacity-80">
              <ProfileAvatar imageUrl={data?.opponentProfileImageUrl} nickname={data?.opponentNickname ?? ''} />
              <p className="font-semibold">{data?.opponentNickname}</p>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <ProfileAvatar imageUrl={data?.opponentProfileImageUrl} nickname={data?.opponentNickname ?? ''} />
              <p className="font-semibold">{data?.opponentNickname}</p>
            </div>
          )}
        </div>
        <IconButton
          ref={menuButtonRef}
          aria-label="더보기"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <EllipsisVertical size={20} className="text-gray-500" />
        </IconButton>
        <DropdownMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          triggerRef={menuButtonRef}
          label="채팅방 메뉴"
        >
          {menuItems.map((item) => (
            <DropdownMenuItem key={item.label} onClick={item.onClick} tone={item.tone}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
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
          tradeStatus={product?.tradeStatus}
          productType={product?.productType}
        />
      </Link>
    </div>
  )
}
