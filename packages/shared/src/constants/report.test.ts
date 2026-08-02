import { describe, expect, it } from 'vitest'

import { COMMUNITY_REPORT_REASON } from './report'

// 서버 enum 이름을 그대로 보낸다. 하나라도 어긋나면 신고가 조용히 실패한다.
// 원본: service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/report/model/
//       CommunityReportReason.java
const SERVER_ENUM = [
  'ABUSE_OR_HATE',
  'SPAM_OR_AD',
  'INAPPROPRIATE_CONTENT',
  'REPETITIVE_POST',
  'SELF_HARM_OR_SUICIDE',
  'ETC',
]

describe('COMMUNITY_REPORT_REASON', () => {
  it('서버 enum과 이름·개수가 같다', () => {
    // 순서는 안 본다 — 화면에 보이는 차례이지 서버와 맞출 이유가 없다.
    // 라벨과 차례는 웹 POST_REPORT_REASON을 그대로 따랐다.
    expect([...COMMUNITY_REPORT_REASON.map((reason) => reason.id)].sort()).toEqual(
      [...SERVER_ENUM].sort()
    )
  })

  it('라벨이 비어 있지 않다', () => {
    for (const reason of COMMUNITY_REPORT_REASON) {
      expect(reason.label.length).toBeGreaterThan(0)
    }
  })

  it('「기타」는 OTHER가 아니라 ETC다', () => {
    // 웹 constants.ts의 POST_REPORT_REASON은 'OTHER'로 보내고 있었다.
    // 서버 CommunityReportReason에는 OTHER가 없다 — 사용자 신고(UserReportReason)만
    // OTHER를 쓴다. 둘을 헷갈리면 「기타」로 낸 신고만 조용히 실패한다.
    expect(COMMUNITY_REPORT_REASON.map((reason) => reason.id)).not.toContain('OTHER')
  })
})
