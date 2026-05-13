import type { fetchChatRoom } from '@/types'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import ChatProductCard from '@/components/commons/card/ChatProductCard'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { cn } from '@/lib/utils/cn'
import { chatSocketStore } from '@/store/chatSocketStore'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { Z_INDEX } from '@/constants/ui'
import Spinner from '@/components/commons/spinner/Spinner'

interface ChatRoomsProps {
  rooms: fetchChatRoom[]
  handleSelectRoom: (room: fetchChatRoom) => void
  selectedRoomId: number | null
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

export function ChatRooms({
  rooms,
  handleSelectRoom,
  selectedRoomId,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: ChatRoomsProps) {
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
        lastMessage: update.lastMessage ?? room.lastMessage,
        lastMessageTime: update.lastMessageTime ?? room.lastMessageTime,
        unreadCount: update.unreadCount ?? room.unreadCount,
      }
    }
    return room
  }

  return (
    <section className="relative flex flex-col rounded-none border-gray-300 md:max-w-112 md:min-w-112 md:border-t md:border-b md:border-l">
      <h2 className={cn('hidden border-b border-gray-300 bg-white p-5 md:static md:block', Z_INDEX.HEADER)}>채팅목록</h2>
      <div className="scrollbar-hide flex-1 overflow-y-scroll">
        <ul className="flex flex-col gap-2">
          {rooms &&
            rooms.map((room) => {
              const roomData = getRoomData(room)
              return (
                <li
                  key={roomData.chatRoomId}
                  className={cn(
                    'flex cursor-pointer flex-col gap-2 p-4 md:p-3',
                    roomData.chatRoomId === selectedRoomId && 'md:bg-[#E5E7EB]/50'
                  )}
                  onClick={() => handleSelectRoom(room)}
                >
                  <div className="flex w-full items-center gap-2.5">
                    <div className="shrink-0">
                      <ProfileAvatar imageUrl={roomData?.opponentProfileImageUrl} nickname={roomData?.opponentNickname ?? ''} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="leading-none font-semibold">{roomData?.opponentNickname}</p>
                      <div className="flex items-center gap-1">
                        <p className={cn('min-w-0 flex-1 truncate text-xs', roomData.lastMessage == null ? 'text-blue-600' : '')}>
                          {roomData.lastMessage == null
                            ? '채팅방에 입장해주세요'
                            : roomData.lastMessage === ''
                              ? '사진'
                              : roomData.lastMessage}
                        </p>
                        {roomData.lastMessageTime ? (
                          <span className="shrink-0 text-xs leading-none font-medium text-gray-500">
                            {getTimeAgo(roomData.lastMessageTime)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {roomData.unreadCount >= 1 ? (
                      <p className="bg-danger-500 flex size-5 shrink-0 items-center justify-center rounded-full text-xs text-white">
                        {roomData.unreadCount}
                      </p>
                    ) : null}
                  </div>
                  <div className="border-primary-100 bg-primary-50 flex w-full items-center gap-2 overflow-hidden rounded-lg border p-1.5">
                    <ChatProductCard
                      productImageUrl={roomData?.productImageUrl}
                      productTitle={roomData?.productTitle}
                      productPrice={roomData?.productPrice}
                      size="sm"
                    />
                  </div>
                </li>
              )
            })}
        </ul>
        <div ref={targetRef} className="h-10" aria-hidden="true" />
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" label="채팅방 로딩 중" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
