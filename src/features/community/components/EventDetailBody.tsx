import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { formatJoinDate } from '@cuddle/shared'
import Badge from '@/components/commons/badge/Badge'
import { cn } from '@/lib/utils/cn'
import { formatEventPeriod, formatEventPlace, getEventStatus } from '@/lib/utils/eventStatus'
import { PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import type { CommunityEvent } from '@/types'
import { EventStatusChip } from './EventStatusChip'

const CHECK_OFFICIAL = '공식 안내 확인'

interface EventDetailBodyProps {
  title: string
  createdAt: string
  event: CommunityEvent
  /** 출처 이름(공공누리 출처 표시) */
  sourceName: string | null
  /** 한국 날짜 'YYYY-MM-DD'. 상태 칩을 이 날 기준으로 정한다 */
  today: string
  /** 운영 계정에게만 보이는 수정·삭제 단추 */
  actions?: ReactNode
}

/**
 * 행사 소식 상세 (설계 7-2절)
 *
 * 픽케어 상세의 **배치와 정보 정리 방식만** 참고했다(색·글꼴은 커들마켓 것).
 * 본문 글자(마크다운) 대신 행사 칸으로 그린다 — 언제·어디·누가·누구 대상·얼마를 표로 한눈에.
 * 원문 문장을 옮기는 「상세 안내」는 두지 않는다(공공누리 조건).
 */
export function EventDetailBody({ title, createdAt, event, sourceName, today, actions }: EventDetailBodyProps) {
  const status = getEventStatus(event.startDate, event.endDate, today)
  const rows: [string, string | null][] = [
    ['기간', formatEventPeriod(event.startDate, event.endDate)],
    ['장소', formatEventPlace(event.region, event.place)],
    ['주최', event.organizer],
    ['대상', event.target],
    ['참가비', event.fee],
  ]

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {event.imageUrl ? (
          <div className="w-full shrink-0 overflow-hidden rounded-2xl bg-[#f4efe7] md:w-75">
            {/* 기관 서버의 원래 주소를 그대로 쓴다(복사하지 않는다). next/image 를 쓰지 않는 까닭도 같다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt={`${title} 포스터`}
              className="h-auto w-full object-contain"
              onError={(e) => {
                const img = e.currentTarget
                if (!img.src.endsWith(PLACEHOLDER_IMAGES[800])) img.src = PLACEHOLDER_IMAGES[800]
              }}
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center gap-1.5">
            <Badge className="bg-primary-400 w-fit rounded-full text-xs text-white md:font-semibold">행사 소식</Badge>
            <EventStatusChip status={status} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl leading-snug font-bold text-[#1c1b1b] md:text-2xl">{title}</h1>
            {event.summary ? <p className="text-on-surface-muted text-sm md:text-base">{event.summary}</p> : null}
          </div>

          <dl className="border-outline-variant/40 divide-outline-variant/40 divide-y rounded-2xl border px-4">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-3 text-sm md:text-base">
                <dt className="text-[#827565]">{label}</dt>
                <dd className={cn('break-keep text-[#1c1b1b]', !value && 'text-[#827565]')}>{value || CHECK_OFFICIAL}</dd>
              </div>
            ))}
          </dl>

          {event.sourceUrl ? (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-600 flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 md:text-base"
            >
              공식 안내 보기
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      <EventList title="이런 걸 할 수 있어요" items={event.activities} />
      <EventList title="가기 전에 확인하세요" items={event.checks} />

      <footer className="border-outline-variant/40 flex flex-col gap-3 border-t pt-4">
        <p className="text-xs leading-relaxed text-[#827565]">
          이 글은 주최 기관이 공개한 자료를 바탕으로 정리한 안내입니다. 일정과 참가 조건은 바뀔 수 있으니 공식
          안내에서 다시 확인해주세요.
          <br />
          {sourceName ? `출처: ${sourceName} · ` : null}
          {formatJoinDate(createdAt)} 등록
        </p>
        {actions}
      </footer>
    </article>
  )
}

function EventList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-[#1c1b1b] md:text-lg">{title}</h2>
      <ul className="ml-5 list-disc text-sm leading-relaxed text-[#1c1b1b] md:text-base">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
