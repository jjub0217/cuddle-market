import { describe, expect, it } from 'vitest'

import { COMMUNITY_SORT_TYPE, COMMUNITY_TABS, COMMUNITY_WRITE_BOARDS, getCommunitySortTypes } from './constants'

// 행사 소식은 크롤러가 수집 주소로만 올린다. 서버도 일반 글쓰기를 거절한다.
// 글쓰기 화면 선택지에 섞이면 누를 수는 있는데 반드시 실패하는 단추가 된다.

describe('커뮤니티 탭', () => {
  it('질문, 정보, 행사 소식 세 개', () => {
    expect(COMMUNITY_TABS.map((tab) => tab.id)).toEqual(['tab-question', 'tab-info', 'tab-event'])
    expect(COMMUNITY_TABS.find((tab) => tab.id === 'tab-event')).toEqual({
      id: 'tab-event',
      label: '행사 소식',
      code: 'EVENT',
    })
  })

  it('글쓰기 선택지에는 행사 소식이 없다', () => {
    expect(COMMUNITY_WRITE_BOARDS.map((board) => board.code)).toEqual(['QUESTION', 'INFO'])
  })
})

describe('정렬', () => {
  it('행사 소식에는 댓글순이 없다', () => {
    expect(getCommunitySortTypes('tab-event').map((sort) => sort.id)).toEqual(['latest', 'views'])
  })

  it('질문, 정보는 그대로 세 개', () => {
    expect(getCommunitySortTypes('tab-question')).toEqual(COMMUNITY_SORT_TYPE)
    expect(getCommunitySortTypes('tab-info')).toEqual(COMMUNITY_SORT_TYPE)
  })
})
