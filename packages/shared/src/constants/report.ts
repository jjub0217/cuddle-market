// 신고 사유와 차단 안내 문구의 원본. 웹과 앱이 여기서 가져간다.
//
// 왜 shared에 두나: 웹 constants.ts에만 있으면 앱이 복사해야 하고, 복사하면
// 한쪽만 고쳐질 자리가 된다. 8바퀴에 앱 문구를 따로 지었다가 갈린 일이 있었다.
//
// POST_REPORT_REASON(커뮤니티 글)은 안 올린다 — 앱에 커뮤니티 화면이 없어 쓸 데가 없다.
// 쓰는 데가 생길 때 올린다.

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
 * 차단하면 무슨 일이 생기는지.
 *
 * 전에는 두 줄이 더 있었다 — 「상품을 볼 수 없습니다」와 「게시글과 프로필이 숨김
 * 처리됩니다」. 둘 다 사실이 아니어서 뺐다. 백엔드가 차단을 보는 곳은 채팅과
 * 프로필뿐이고 상품 조회에는 차단 참조가 아예 없다. 실물로도 확인했다(#809).
 *
 * #809가 고쳐지면 그때 두 줄을 되돌린다.
 *
 * 마지막 줄에서 위치("마이페이지 >" · "마이 >")를 뺀 이유: 웹과 앱의 메뉴 이름이
 * 달라 한 문구로 둘 다 맞출 수 없다. 위치를 빼면 두 곳에서 다 맞는 말이 된다.
 */
export const USER_BLOCK_ALERT_LIST: string[] = [
  '차단한 사용자는 회원님에게 채팅을 보낼 수 없습니다',
  '이미 진행 중인 거래는 영향을 받지 않습니다',
  '차단은 언제든 차단 목록에서 해제할 수 있습니다',
]
