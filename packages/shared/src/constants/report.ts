// 신고 사유와 차단 안내 문구의 원본. 웹과 앱이 여기서 가져간다.
//
// 왜 shared에 두나: 웹 constants.ts에만 있으면 앱이 복사해야 하고, 복사하면
// 한쪽만 고쳐질 자리가 된다. 8바퀴에 앱 문구를 따로 지었다가 갈린 일이 있었다.

export interface ReportReason {
  /** 서버 enum 이름. 그대로 보낸다 */
  id: string
  label: string
}

export const PRODUCT_REPORT_REASON: ReportReason[] = [
  { id: 'FALSE_OR_SCAM', label: '허위/사기성 상품' },
  { id: 'ILLEGAL_ITEM', label: '불법 또는 금지 품목' },
  { id: 'INAPPROPRIATE_IMAGE', label: '부적절한 이미지' },
  { id: 'DUPLICATE_POST', label: '중복 게시물' },
  { id: 'SPAM_OR_AD', label: '스팸/광고성 게시물' },
  { id: 'PROXY_PAYMENT_OR_TRADE', label: '대리 결제/구매/판매 행위' },
  { id: 'PROFESSIONAL_SELLER', label: '전문 판매 업자' },
  { id: 'ETC', label: '기타' },
]

export const USER_REPORT_REASON: ReportReason[] = [
  { id: 'HARASSMENT', label: '욕설, 비방, 괴롭힘' },
  { id: 'FRAUD', label: '사기, 허위 거래 시도' },
  { id: 'INAPPROPRIATE_CONTENT', label: '음란물 또는 불건전 행위' },
  { id: 'SPAM', label: '스팸/광고성 메시지' },
  { id: 'OFFENSIVE_PROFILE', label: '불쾌한 사용자 정보 내용' },
  { id: 'UNDERAGE', label: '만 14세 미만 유저' },
  { id: 'OTHER', label: '기타' },
]

/**
 * 커뮤니티 게시글 신고 사유.
 *
 * 서버 enum: CommunityReportReason (service/cmarket-domain/.../report/model/)
 * 보내는 곳: POST /api/reports/community-posts/{postId}   { reasonCode, detailReason? }
 *
 * ⚠️ 상품 신고만 reasonCodes(배열)다. 게시글·사용자는 reasonCode(문자열)다.
 *
 * ⚠️ 「기타」의 값이 갈린다 — 게시글·상품은 `ETC`, 사용자는 `OTHER`다.
 *    웹 constants.ts의 POST_REPORT_REASON은 게시글인데도 `OTHER`를 보내고 있어
 *    「기타」를 고르면 서버가 못 알아본다. 웹을 이 상수로 옮기면서 같이 고친다.
 *
 * 라벨은 **웹에 있던 문구를 그대로** 옮겼다. 새로 짓지 않는다 —
 * 같은 화면의 문구가 웹과 앱에서 갈리면 안 된다.
 */
export const COMMUNITY_REPORT_REASON: ReportReason[] = [
  { id: 'ABUSE_OR_HATE', label: '욕설, 비방, 혐오 표현' },
  { id: 'REPETITIVE_POST', label: '도배 게시물' },
  { id: 'INAPPROPRIATE_CONTENT', label: '음란물/불건전 콘텐츠' },
  { id: 'SPAM_OR_AD', label: '스팸/광고성 메시지' },
  { id: 'SELF_HARM_OR_SUICIDE', label: '자해 또는 자살 의도를 포함' },
  { id: 'ETC', label: '기타' },
]

/**
 * 차단하면 무슨 일이 생기는지.
 *
 * **여기 적은 것은 전부 실제로 되는 것만이다.** 안내가 약속한 것을 서버가 안 하면
 * 사용자는 차단이 안 먹은 줄 안다.
 *
 * 전에는 두 줄이 더 있었다 — 「상품을 볼 수 없습니다」와 「게시글과 프로필이 숨김
 * 처리됩니다」. 둘 다 사실이 아니어서 뺐다(#809).
 *
 * 이제 상품과 게시글은 실제로 걸러진다 — 백엔드가 상품 목록·상세와 커뮤니티 글
 * 조회에서 차단을 본다(cmarket_api, 2026-08-02 · 10바퀴 Task 0). 그래서 상품 줄은
 * 「볼 수 없습니다」로 되돌리고, 게시글 줄을 새로 넣었다.
 *
 * **프로필은 안 적는다.** 차단한 사람 프로필은 「차단 유저」 배지를 붙여 그대로
 * 보여준다 — 거기에 「차단 해제」가 있어서다(9바퀴).
 *
 * 마지막 줄에서 위치("마이페이지 >" · "마이 >")를 뺀 이유: 웹과 앱의 메뉴 이름이
 * 달라 한 문구로 둘 다 맞출 수 없다. 위치를 빼면 두 곳에서 다 맞는 말이 된다.
 */
export const USER_BLOCK_ALERT_LIST: string[] = [
  '차단한 사용자는 회원님에게 채팅을 보낼 수 없습니다',
  '차단한 사용자의 상품은 볼 수 없습니다',
  '차단한 사용자의 게시글은 목록에 보이지 않습니다',
  '이미 진행 중인 거래는 영향을 받지 않습니다',
  '차단은 언제든 차단 목록에서 해제할 수 있습니다',
]
