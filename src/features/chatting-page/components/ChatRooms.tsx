import type { fetchChatRoom } from '@/types'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import ChatProductCard from '@/components/commons/card/ChatProductCard'
import { getTimeAgo } from '@cuddle/shared'
import { cn } from '@/lib/utils/cn'
import { chatSocketStore } from '@/store/chatSocketStore'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { Z_INDEX } from '@/constants/ui'
import Spinner from '@/components/commons/spinner/Spinner'
import LoadMoreFocusButton from '@/components/commons/LoadMoreFocusButton'
import SkipToLoadMoreLink from '@/components/commons/SkipToLoadMoreLink'

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
    <section className="relative flex flex-col rounded-none py-3 md:max-w-96 md:min-w-96 md:p-6">
      <h2 className={cn('hidden md:static md:block', Z_INDEX.HEADER)}>채팅목록</h2>
      <div className="scrollbar-hide flex-1 overflow-y-scroll md:py-5">
        <SkipToLoadMoreLink targetId="chat-rooms-load-more" hasNextPage={hasNextPage} />
        <ul className="flex flex-col md:gap-2">
          {rooms &&
            rooms.map((room) => {
              const roomData = getRoomData(room)
              return (
                <li
                  key={roomData.chatRoomId}
                  className={cn(
                    // 방 카드에 테두리를 안 두른다(#891). 고른 방은 연베이지 바탕이 알려 주고,
                    // 안 고른 방은 그 안 상품칸이 이미 자기 테두리를 갖고 있다.
                    'flex cursor-pointer flex-col gap-2 px-4 py-3.5 md:rounded-3xl',
                    // 보고 있는 방은 **연베이지**로 표시한다(#891). 예전에는 진한 갈색(#7c571a)이라
                    // 목록이 화면에서 가장 무거웠고, 그 위에 또 갈색 카드를 얹어 경계가 안 읽혔다.
                    // 화면에서 진한 색은 내 말풍선 하나면 된다.
                    roomData.chatRoomId === selectedRoomId && 'md:bg-primary-50'
                  )}
                  onClick={() => handleSelectRoom(room)}
                >
                  <div className="flex w-full items-start gap-2.5">
                    <div className="shrink-0">
                      <ProfileAvatar imageUrl={roomData?.opponentProfileImageUrl} nickname={roomData?.opponentNickname ?? ''} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex flex-col gap-0.5 md:gap-2">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={cn(
                              'text-[15px] leading-none font-semibold md:text-base',
                              roomData.chatRoomId === selectedRoomId ? 'text-on-surface' : 'text-gray-800'
                            )}
                          >
                            {roomData?.opponentNickname}
                          </p>
                          {roomData.lastMessageTime ? (
                            <span
                              // 보조 글자는 고른 방이든 아니든 on-surface-muted 다(#891).
                              // 예전 #9b9387 은 흰 바탕에서 3.04:1 로 AA(4.5:1)에 못 미쳤다.
                              className="text-on-surface-muted shrink-0 text-sm leading-none"
                            >
                              {getTimeAgo(roomData.lastMessageTime)}
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            'min-w-0 flex-1 truncate text-sm font-medium',
                            roomData.lastMessage == null ? 'text-blue-600' : '',
                            // 위 파랑보다 **뒤에** 둔다 — 앞으로 옮기면 twMerge 가 파랑을 살려
                            // 「채팅방에 입장해주세요」만 색이 튄다(지금은 안 그렇다).
                            'text-on-surface-muted'
                          )}
                        >
                          {roomData.lastMessage == null
                            ? '채팅방에 입장해주세요'
                            : roomData.lastMessage === ''
                              ? '사진'
                              : roomData.lastMessage}
                        </p>
                      </div>
                      <div
                        className={cn(
                          // 테두리는 토큰의 옅은 쪽을 쓴다(#901). 손으로 적은 #ebe5e0 은 토큰에 없는
                          // 값이었고, 이 화면만 색 체계 밖에 두면 다음에 색을 손볼 때 여기만 빠진다.
                          //
                          // ⚠️ 선을 아예 없애지는 않는다. 이 칸의 바탕(surface-container-low)은 흰 판
                          //    위에서 1.10:1 밖에 안 돼, 선이 없으면 칸이 있는지 없는지 흐릿해진다.
                          //    고른 방에서는 칸이 흰색이 되므로 그쪽은 진한 쪽(outline-variant)을 쓴다.
                          'bg-surface-container-low border-outline-variant/40 flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-2.5',
                          // 고른 방 안의 상품카드는 **흰색**이다(#891). 예전에는 진한 카키(#96793f)라
                          // 갈색 방 위의 갈색 카드였다 — 색상이 같고 밝기만 다르면 경계가 안 읽힌다(#786).
                          // 이 자리에서 알려야 할 것은 「어느 방을 보고 있는가」이지 「무슨 상품인가」가 아니다.
                          roomData.chatRoomId === selectedRoomId && 'border-outline-variant bg-surface-container-lowest'
                        )}
                      >
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
                </li>
              )
            })}
        </ul>
        <div ref={targetRef} className="h-10" aria-hidden="true" />
        <LoadMoreFocusButton
          id="chat-rooms-load-more"
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          label="채팅방 더 불러오기"
        />
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" label="채팅방 로딩 중" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
