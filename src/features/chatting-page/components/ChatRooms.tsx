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
    <section className="relative flex flex-col rounded-none p-6 md:max-w-96 md:min-w-96">
      <h2 className={cn('hidden md:static md:block', Z_INDEX.HEADER)}>채팅목록</h2>
      <div className="scrollbar-hide flex-1 overflow-y-scroll py-5">
        <ul className="flex flex-col gap-2">
          {rooms &&
            rooms.map((room) => {
              const roomData = getRoomData(room)
              return (
                <li
                  key={roomData.chatRoomId}
                  className={cn(
                    'border-outline-variant/40 flex cursor-pointer flex-col gap-2 rounded-3xl border px-4 py-3.5',
                    roomData.chatRoomId === selectedRoomId && 'md:bg-[#7c571a]'
                  )}
                  onClick={() => handleSelectRoom(room)}
                >
                  <div className="flex w-full items-start gap-2.5">
                    <div className="shrink-0">
                      <ProfileAvatar imageUrl={roomData?.opponentProfileImageUrl} nickname={roomData?.opponentNickname ?? ''} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={cn(
                              'text-base leading-none font-semibold',
                              roomData.chatRoomId === selectedRoomId ? 'text-hero-surface' : 'text-gray-800'
                            )}
                          >
                            {roomData?.opponentNickname}
                          </p>
                          {roomData.lastMessageTime ? (
                            <span
                              className={cn(
                                'text-hero-surface shrink-0 text-sm leading-none',
                                roomData.chatRoomId === selectedRoomId ? 'text-hero-surface' : 'text-[#9b9387]'
                              )}
                            >
                              {getTimeAgo(roomData.lastMessageTime)}
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            'min-w-0 flex-1 truncate text-sm font-medium',
                            roomData.lastMessage == null ? 'text-blue-600' : '',
                            roomData.chatRoomId === selectedRoomId ? 'text-hero-surface' : 'text-[#9b9387]'
                          )}
                        >
                          {roomData.lastMessage == null
                            ? '채팅방에 입장해주세요'
                            : roomData.lastMessage === ''
                              ? '사진'
                              : roomData.lastMessage}
                        </p>
                      </div>
                      <div className="flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-[#9f854f] bg-[#96793f] p-2.5">
                        <ChatProductCard
                          productImageUrl={roomData?.productImageUrl}
                          productTitle={roomData?.productTitle}
                          productPrice={roomData?.productPrice}
                          size="sm"
                        />
                      </div>
                    </div>
                    {roomData.unreadCount >= 1 ? (
                      <p className="bg-danger-500 flex size-5 shrink-0 items-center justify-center rounded-full text-xs text-white">
                        {roomData.unreadCount}
                      </p>
                    ) : null}
                  </div>
                  {/* <div className="flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-[#9f854f] bg-[#96793f] p-2.5">
                    <ChatProductCard
                      productImageUrl={roomData?.productImageUrl}
                      productTitle={roomData?.productTitle}
                      productPrice={roomData?.productPrice}
                      size="sm"
                    />
                  </div> */}
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
