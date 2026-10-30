import { describe, expect, it } from 'vitest'

import { render, screen } from '@/test/render'
import type { CommunityItem } from '@/types'

import { EventPostCard } from './EventPostCard'

// 행사 소식 목록 카드(설계 7-2절). 사람이 쓴 글이 아니라서 닉네임, 등록 시각,
// 조회수, 댓글 수, 포스터를 보이지 않고 행사 칸을 보인다.

const POST: CommunityItem = {
  id: 3,
  title: '2026 서울 댕냥데이즈',
  contentPreview: '한 줄 소개: 반려견과 함께 즐기는 가을 축제 기간 | 2026.10.29 (목)',
  thumbnailImageUrl: 'https://placehold.co/600x800/png?text=POSTER',
  authorNickname: '커들소식',
  boardType: 'EVENT',
  viewCount: 12,
  commentCount: 3,
  createdAt: '2026-10-30T10:00:00',
  updatedAt: '2026-10-30T10:00:00',
  isModified: false,
  event: {
    startDate: '2026-10-29',
    endDate: '2026-11-02',
    region: '서울',
    place: '문화비축기지',
    organizer: '서울특별시',
    summary: '반려견과 함께 즐기는 가을 축제',
    target: null,
    fee: null,
    activities: [],
    checks: [],
    sourceUrl: null,
    imageUrl: null,
    hours: null,
    application: null,
  },
}

const TODAY = '2026-10-30'

describe('보이는 것', () => {
  it('상태, 제목, 한 줄 소개, 기간, 지역 · 주최', () => {
    render(<EventPostCard post={POST} today={TODAY} />)

    expect(screen.getByText('진행 중')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '2026 서울 댕냥데이즈' })).toBeInTheDocument()
    expect(screen.getByText('반려견과 함께 즐기는 가을 축제')).toBeInTheDocument()
    expect(screen.getByText('2026.10.29 (목) ~ 2026.11.02 (월)')).toBeInTheDocument()
    expect(screen.getByText('서울 · 서울특별시')).toBeInTheDocument()
  })

  it('목록에는 구체적인 장소를 보이지 않는다', () => {
    render(<EventPostCard post={POST} today={TODAY} />)
    expect(screen.queryByText(/문화비축기지/)).not.toBeInTheDocument()
  })

  it('지역이 없으면 주최만', () => {
    render(<EventPostCard post={{ ...POST, event: { ...POST.event!, region: null } }} today={TODAY} />)
    expect(screen.getByText('서울특별시')).toBeInTheDocument()
  })

  it('한 줄 소개가 없으면 그 줄이 없고 본문 미리보기로 채우지도 않는다', () => {
    render(<EventPostCard post={{ ...POST, event: { ...POST.event!, summary: null } }} today={TODAY} />)
    expect(screen.queryByText(/한 줄 소개/)).not.toBeInTheDocument()
  })
})

describe('보이지 않는 것', () => {
  it('닉네임, 조회수, 댓글 수, 포스터', () => {
    render(<EventPostCard post={POST} today={TODAY} />)

    expect(screen.queryByText('커들소식')).not.toBeInTheDocument()
    expect(screen.queryByText('12')).not.toBeInTheDocument()
    expect(screen.queryByText('3')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('상태별 모양', () => {
  it('예정이면 D-n', () => {
    render(
      <EventPostCard post={{ ...POST, event: { ...POST.event!, startDate: '2026-11-08', endDate: null } }} today={TODAY} />
    )
    expect(screen.getByText('D-9')).toBeInTheDocument()
  })

  it('종료면 카드가 흐리다', () => {
    render(
      <EventPostCard post={{ ...POST, event: { ...POST.event!, startDate: '2026-10-25', endDate: null } }} today={TODAY} />
    )
    expect(screen.getByText('종료')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('data-ended', 'true')
  })

  it('상세로 가는 링크', () => {
    render(<EventPostCard post={POST} today={TODAY} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('/community/3/'))
  })
})
