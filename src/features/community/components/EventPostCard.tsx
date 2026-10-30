import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils/cn'
import { formatEventPeriod, getEventStatus } from '@/lib/utils/eventStatus'
import type { CommunityItem } from '@/types'
import { EventStatusChip } from './EventStatusChip'

interface EventPostCardProps {
  post: CommunityItem
  /** 한국 날짜 'YYYY-MM-DD'. 상태(D-n, 진행 중, 종료)를 이 날 기준으로 정한다 */
  today: string
}

/**
 * 행사 소식 목록 카드 (설계 7-2절)
 *
 * 질문·정보 카드와 겉모양(테두리, 여백)은 같고 안에 든 것이 다르다.
 * 사람이 쓴 글이 아니라서 닉네임·등록 시각·조회수·댓글 수·포스터를 빼고,
 * 그 자리에 기간과 「지역 · 주최」를 보인다. 구체적인 장소는 상세에서만 보인다.
 */
export function EventPostCard({ post, today }: EventPostCardProps) {
  const event = post.event
  const status = event ? getEventStatus(event.startDate, event.endDate, today) : null
  const isEnded = status?.kind === 'ended'
  const where = [event?.region, event?.organizer].filter(Boolean).join(' · ')

  return (
    <Link
      href={ROUTES.COMMUNITY_DETAIL_ID(post.id, post.title)}
      data-ended={isEnded ? 'true' : undefined}
      className={cn(
        'group border-outline-variant/40 block rounded-2xl border bg-white p-3 shadow-sm transition-all hover:shadow-md md:p-4',
        // 종료된 행사는 훑어볼 때 저절로 건너뛰게 카드 전체를 흐리게 한다
        isEnded && 'opacity-60'
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {status ? <EventStatusChip status={status} /> : null}

        <h3 className="group-hover:text-primary line-clamp-2 text-base leading-snug font-semibold text-[#1c1b1b] transition-colors md:text-lg">
          {post.title}
        </h3>

        {event?.summary ? <p className="text-on-surface-muted line-clamp-1 text-sm">{event.summary}</p> : null}

        {event ? (
          <div className="mt-1 flex flex-col gap-0.5 text-xs text-[#827565] md:text-sm">
            <p>{formatEventPeriod(event.startDate, event.endDate)}</p>
            {where ? <p>{where}</p> : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}
