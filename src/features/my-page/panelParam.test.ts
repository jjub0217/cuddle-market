import { describe, expect, it } from 'vitest'

import { MY_PAGE_TABS } from '@/constants/constants'

import { resolvePanel } from './panelParam'

// 모바일 패널이 주소에 담긴다는 것이 #819의 고침이다.
// 여기서는 「주소가 이 값이면 어떤 패널인가」만 못 박는다.
//
// ⚠️ 이 시험이 안 덮는 것: 상세·수정으로 갔다 돌아왔을 때 실제로 복구되는가.
//    그건 브라우저의 뒤로가기 동작이라 눈으로 봐야 한다.
//    다만 주소에 담겨 있으면 그 복구는 브라우저가 알아서 한다.

describe('resolvePanel', () => {
  it('값이 없으면 닫힘이다', () => {
    expect(resolvePanel(null)).toBeNull()
    expect(resolvePanel('')).toBeNull()
  })

  it('마이 탭 아이디를 그대로 알아본다', () => {
    for (const tab of MY_PAGE_TABS) {
      expect(resolvePanel(tab.id)).toBe(tab.id)
    }
  })

  it('판매내역을 알아본다', () => {
    // #819에서 실제로 잃어버리던 화면이다
    expect(resolvePanel('tab-sales')).toBe('tab-sales')
  })

  it('활동과 프로필도 패널이다', () => {
    expect(resolvePanel('activity')).toBe('activity')
    expect(resolvePanel('profile')).toBe('profile')
  })

  it('모르는 값은 닫힘으로 본다', () => {
    // 주소는 사용자가 손으로 고칠 수 있다. 그냥 통과시키면
    // 빈 패널이 열려 나갈 길이 없어진다
    expect(resolvePanel('tab-없는것')).toBeNull()
    expect(resolvePanel('PROFILE')).toBeNull()
    expect(resolvePanel('1')).toBeNull()
  })
})
