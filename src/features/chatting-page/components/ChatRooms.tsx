import type { fetchChatRoom } from '@/types'
import { SellerAvatar } from '@/components/commons/avatar/SellerAvatar'
import ChatProductCard from '@/components/commons/card/ChatProductCard'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { cn } from '@/lib/utils/cn'
import { chatSocketStore } from '@/store/chatSocketStore'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { Z_INDEX } from '@/constants/ui'

interface ChatRoomsProps {
  rooms: fetchChatRoom[]
  handleSelectRoom: (room: fetchChatRoom) => void
  selectedRoomId: number | null
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

export function ChatRooms({ rooms, handleSelectRoom, selectedRoomId, hasNextPage, isFetchingNextPage, fetchNextPage }: ChatRoomsProps) {
  const { chatRoomUpdates } = chatSocketStore()
  const targetRef = useIntersectionObserver({
    enabled: rooms.length > 0,
    hasNextPage,
    isFetchingNextPage,
    onIntersect: fetchNextPage,
    threshold: 0.5,
  })

  const getRoomData = (room: fetchChatRoom) => {
    const update = chatRoomUpdates[room.chatRoomId]
    if (update) {
      return {
        ...room,
        lastMessage: update.lastMessage,
        lastMessageTime: update.lastMessageTime,
        unreadCount: update.unreadCount,
      }
    }
    return room
  }

  return (
    <section className="relative flex flex-col rounded-none border-t border-l border-gray-300 md:max-w-96 md:min-w-96 md:border-b">
      <h2 className={cn('sticky top-16 border-b border-gray-300 bg-white p-5 md:static', Z_INDEX.HEADER)}>채팅목록</h2>
      <div className="scrollbar-hide flex-1 overflow-y-scroll px-3 py-3">
        <ul className="flex flex-col gap-2">
          {rooms &&
            rooms.map((room) => {
              const roomData = getRoomData(room)
              return (
                <li
                  key={roomData.chatRoomId}
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded-lg p-3',
                    roomData.chatRoomId === selectedRoomId ? 'border-gray-300 md:border md:bg-[#E5E7EB]/50' : 'border border-transparent'
                  )}
                  onClick={() => handleSelectRoom(room)}
                >
                  <div className="shrink-0">
                    <SellerAvatar profileImageUrl={roomData?.opponentProfileImageUrl} nickname={roomData?.opponentNickname} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex w-full items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="leading-none font-semibold">{roomData?.opponentNickname}</p>
                        <p className={cn('text-sm', roomData.lastMessage ? '' : 'text-blue-600')}>
                          {roomData.lastMessage ? roomData.lastMessage : '채팅방에 입장해주세요'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {roomData.lastMessageTime && (
                          <span className="text-sm leading-none font-medium text-gray-500">{getTimeAgo(roomData.lastMessageTime)}</span>
                        )}
                        {roomData.unreadCount >= 1 && (
                          <p className="bg-danger-500 tex-sm flex size-5 items-center justify-center rounded-full text-white">
                            {roomData.unreadCount}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="border-primary-100 bg-primary-50 flex items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-3">
                      <ChatProductCard
                        productImageUrl={roomData?.productImageUrl}
                        productTitle={roomData?.productTitle}
                        productPrice={roomData?.productPrice}
                        size="sm"
                      />
                    </div>
                  </div>
                </li>
              )
            })}
        </ul>
        <div ref={targetRef} className="h-10" aria-hidden="true" />
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" aria-label="채팅방 로딩 중" role="status" />
          </div>
        )}
      </div>
    </section>
  )
}
