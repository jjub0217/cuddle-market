import { describe, expect, it } from 'vitest'

import { USER_BLOCK_ALERT_LIST } from './report'

// 차단 안내 문구 (#809).
//
// 이 이슈의 뿌리는 「안내가 서버가 안 하는 일을 약속한 것」이었다.
// 그래서 여기서는 **아직 안 되는 것을 다시 약속하지 않았는지**를 본다.
//
// 새 줄을 더할 때는 서버가 실제로 그 일을 하는지 먼저 확인해야 한다.

describe('USER_BLOCK_ALERT_LIST', () => {
  it('상품이 목록에서 빠진다고 알린다', () => {
    // 백엔드 상품 검색 쿼리에서 차단한 판매자를 뺐다 (cmarket_api, 2026-08-02)
    expect(USER_BLOCK_ALERT_LIST).toContain('차단한 사용자의 상품은 목록에 보이지 않습니다')
  })

  it('커뮤니티 글·프로필 숨김은 약속하지 않는다', () => {
    // 아직 안 된다. 백엔드가 커뮤니티 조회에서 차단을 안 본다.
    const joined = USER_BLOCK_ALERT_LIST.join(' ')
    expect(joined).not.toContain('게시글')
    expect(joined).not.toContain('프로필이 숨김')
  })

  it('상품을 「볼 수 없다」고까지는 안 한다', () => {
    // 목록에서 빠질 뿐, 주소를 직접 열면 상세는 보인다.
    // 예전 문구가 「상품을 볼 수 없습니다」였는데 그건 지금도 사실이 아니다.
    expect(USER_BLOCK_ALERT_LIST.join(' ')).not.toContain('상품을 볼 수 없습니다')
  })

  it('위치 이름을 안 쓴다 — 웹과 앱의 메뉴 이름이 다르다', () => {
    const joined = USER_BLOCK_ALERT_LIST.join(' ')
    expect(joined).not.toContain('마이페이지 >')
    expect(joined).not.toContain('마이 >')
  })

  it('빈 줄이 없다', () => {
    for (const line of USER_BLOCK_ALERT_LIST) {
      expect(line.trim().length).toBeGreaterThan(0)
    }
  })
})
