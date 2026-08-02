import { describe, expect, it } from 'vitest'

import { USER_BLOCK_ALERT_LIST } from './report'

// 차단 안내 문구 (#809).
//
// 이 이슈의 뿌리는 「안내가 서버가 안 하는 일을 약속한 것」이었다.
// 그래서 여기서는 **아직 안 되는 것을 다시 약속하지 않았는지**를 본다.
//
// 새 줄을 더할 때는 서버가 실제로 그 일을 하는지 먼저 확인해야 한다.

describe('USER_BLOCK_ALERT_LIST', () => {
  it('상품과 게시글을 둘 다 막는다고 알린다', () => {
    // 백엔드가 상품 상세·목록과 커뮤니티 글 조회에서 차단을 본다
    // (cmarket_api, 2026-08-02 — 10바퀴 Task 0)
    expect(USER_BLOCK_ALERT_LIST).toContain('차단한 사용자의 상품은 볼 수 없습니다')
    expect(USER_BLOCK_ALERT_LIST).toContain('차단한 사용자의 게시글은 목록에 보이지 않습니다')
  })

  it('프로필 숨김은 여전히 약속하지 않는다', () => {
    // 프로필은 「차단 유저」 배지를 붙여 그대로 보여준다 — 거기 「차단 해제」가 있다
    expect(USER_BLOCK_ALERT_LIST.join(' ')).not.toContain('프로필')
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
