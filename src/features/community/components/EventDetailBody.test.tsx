import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/react'

import { render, screen, within } from '@/test/render'
import { PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import type { CommunityEvent } from '@/types'

import { EventDetailBody } from './EventDetailBody'

// 행사 소식 상세(설계 7-2절). 픽케어 상세의 배치를 참고해 본문 글자 대신 행사 칸으로 그린다.

const EVENT: CommunityEvent = {
  startDate: '2026-10-29',
  endDate: '2026-11-02',
  region: '서울',
  place: '문화비축기지',
  organizer: '서울특별시',
  summary: '반려견과 함께 즐기는 가을 축제',
  target: '반려견, 반려묘',
  fee: '무료',
  activities: ['반려견 놀이터와 어질리티 체험', '수의사 건강 상담'],
  checks: ['목줄과 배변 봉투를 챙기세요'],
  sourceUrl: 'https://www.seoul.go.kr/news/news_report.do?bbsNo=158&nttNo=468820',
  imageUrl: 'https://www.seoul.go.kr/poster.jpg',
  hours: '오전 11시~오후 7시',
  application: 'QR 사전 신청 또는 현장 접수',
}

const PROPS = {
  title: '2026 서울 댕냥데이즈',
  createdAt: '2026-10-30T10:00:00',
  sourceName: '서울특별시',
  today: '2026-10-30',
}

function rowValue(label: string) {
  const term = screen.getByText(label, { selector: 'dt' })
  return term.nextElementSibling?.textContent
}

describe('위쪽', () => {
  it('배지, 상태, 제목, 한 줄 소개', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)

    expect(screen.getByText('행사 소식')).toBeInTheDocument()
    expect(screen.getByText('진행 중')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '2026 서울 댕냥데이즈' })).toBeInTheDocument()
    expect(screen.getByText('반려견과 함께 즐기는 가을 축제')).toBeInTheDocument()
  })

  it('포스터는 원래 주소 그대로', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)
    expect(screen.getByRole('img', { name: '2026 서울 댕냥데이즈 포스터' })).toHaveAttribute('src', EVENT.imageUrl)
  })

  it('포스터를 못 불러오면 자리를 비운다(행사와 상관없는 기본 그림을 보이지 않는다)', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)
    fireEvent.error(screen.getByRole('img', { name: '2026 서울 댕냥데이즈 포스터' }))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector(`img[src="${PLACEHOLDER_IMAGES[800]}"]`)).toBeNull()
  })

  it('포스터가 없으면 그림이 없다', () => {
    render(<EventDetailBody {...PROPS} event={{ ...EVENT, imageUrl: null }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('표', () => {
  it('기간, 운영시간, 장소(지역 + 장소), 대상, 참가비, 신청, 주최', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)

    expect(rowValue('기간')).toBe('2026.10.29 (목) ~ 2026.11.02 (월)')
    expect(rowValue('운영시간')).toBe('오전 11시~오후 7시')
    expect(rowValue('장소')).toMatch(/^서울 문화비축기지/)
    expect(rowValue('주최')).toBe('서울특별시')
    expect(rowValue('대상')).toBe('반려견, 반려묘')
    expect(rowValue('참가비')).toBe('무료')
    expect(rowValue('신청')).toBe('QR 사전 신청 또는 현장 접수')
  })

  it('반려인이 판단하는 순서: 기간, 운영시간, 장소, 대상, 참가비, 신청, 주최', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)
    expect(screen.getAllByRole('term').map((dt) => dt.textContent)).toEqual([
      '기간',
      '운영시간',
      '장소',
      '대상',
      '참가비',
      '신청',
      '주최',
    ])
  })

  it('없는 값은 「공식 안내 확인」', () => {
    render(
      <EventDetailBody
        {...PROPS}
        event={{
          ...EVENT,
          place: null,
          region: null,
          organizer: null,
          target: null,
          fee: null,
          hours: null,
          application: null,
        }}
      />
    )
    for (const label of ['운영시간', '장소', '주최', '대상', '참가비', '신청']) {
      expect(rowValue(label)).toBe('공식 안내 확인')
    }
  })

  it('장소가 이미 시·도로 시작하면 지역을 또 붙이지 않는다', () => {
    render(<EventDetailBody {...PROPS} event={{ ...EVENT, region: '제주', place: '제주특별자치도 제주시 서광로' }} />)
    expect(rowValue('장소')).toMatch(/^제주특별자치도 제주시 서광로/)
  })
})

describe('길찾기', () => {
  it('장소 옆 링크가 네이버 지도에서 「지역 장소」를 찾는다(새 창)', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)
    const link = screen.getByRole('link', { name: '서울 문화비축기지 길찾기' })
    expect(link).toHaveAttribute('href', 'https://map.naver.com/p/search/' + encodeURIComponent('서울 문화비축기지'))
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('장소가 여러 곳이면 첫 번째 장소로 찾고, 표에는 모두 보인다', () => {
    render(<EventDetailBody {...PROPS} event={{ ...EVENT, place: '개포동근린공원, 강남세곡체육공원' }} />)
    expect(rowValue('장소')).toMatch(/^서울 개포동근린공원, 강남세곡체육공원/)
    const link = screen.getByRole('link', { name: '서울 개포동근린공원 길찾기' })
    expect(link).toHaveAttribute('href', 'https://map.naver.com/p/search/' + encodeURIComponent('서울 개포동근린공원'))
  })

  it('장소가 없거나 온라인이면 길찾기가 없다', () => {
    const { unmount } = render(<EventDetailBody {...PROPS} event={{ ...EVENT, place: null, region: null }} />)
    expect(screen.queryByRole('link', { name: /길찾기/ })).not.toBeInTheDocument()
    unmount()
    render(<EventDetailBody {...PROPS} event={{ ...EVENT, place: '온라인', region: null }} />)
    expect(screen.queryByRole('link', { name: /길찾기/ })).not.toBeInTheDocument()
  })
})

describe('공식 안내 보기', () => {
  it('원문 주소를 새 창으로 연다', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)
    const link = screen.getByRole('link', { name: /공식 안내 보기/ })
    expect(link).toHaveAttribute('href', EVENT.sourceUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})

describe('목록과 끝 문구', () => {
  it('할 수 있는 것과 확인할 것', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)

    const activities = screen.getByRole('region', { name: '이런 걸 할 수 있어요' })
    expect(within(activities).getAllByRole('listitem').map((li) => li.textContent)).toEqual(EVENT.activities)
    const checks = screen.getByRole('region', { name: '가기 전에 확인하세요' })
    expect(within(checks).getAllByRole('listitem').map((li) => li.textContent)).toEqual(EVENT.checks)
  })

  it('AI 칸이 없으면 그 칸째 없다', () => {
    render(<EventDetailBody {...PROPS} event={{ ...EVENT, summary: null, activities: [], checks: [] }} />)
    expect(screen.queryByRole('region', { name: '이런 걸 할 수 있어요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '가기 전에 확인하세요' })).not.toBeInTheDocument()
  })

  it('출처와 등록일, 공공 자료 안내', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)
    expect(screen.getByText(/주최 기관이 공개한 자료를 바탕으로 정리한 안내입니다/)).toBeInTheDocument()
    expect(screen.getByText(/2026\.10\.30 등록/)).toBeInTheDocument()
  })

  it('출처 이름은 원문으로 가는 링크(새 창)', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)
    const source = screen.getByRole('link', { name: '서울특별시' })
    expect(source).toHaveAttribute('href', EVENT.sourceUrl)
    expect(source).toHaveAttribute('target', '_blank')
    expect(source.closest('p')?.textContent).toBe('출처: 서울특별시')
  })

  it('등록일은 출처 아래 줄에 따로', () => {
    render(<EventDetailBody {...PROPS} event={EVENT} />)
    const sourceLine = screen.getByRole('link', { name: '서울특별시' }).closest('p')!
    const dateLine = screen.getByText('2026.10.30 등록')
    expect(dateLine.tagName).toBe('P')
    expect(sourceLine.nextElementSibling).toBe(dateLine)
  })

  it('원문 주소가 없으면 출처 이름만 글자로', () => {
    render(<EventDetailBody {...PROPS} event={{ ...EVENT, sourceUrl: null }} />)
    expect(screen.queryByRole('link', { name: '서울특별시' })).not.toBeInTheDocument()
    expect(screen.getByText(/출처: 서울특별시/)).toBeInTheDocument()
  })
})
