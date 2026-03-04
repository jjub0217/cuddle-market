import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'

export interface MockUserReport {
  id: number
  reporterNickname: string
  targetNickname: string
  reasonCode: string
  detailReason: string | null
  images: string[]
  createdAt: string
}

const REASON_LABELS = [
  '욕설, 비방, 괴롭힘',
  '사기, 허위 거래 시도',
  '음란물 또는 불건전 행위',
  '스팸/광고성 메시지',
  '불쾌한 사용자 정보 내용',
  '만 14세 미만 유저',
  '기타',
]

const REPORTER_NICKNAMES = [
  '댕댕이맘', '냥이집사', '펫러버', '동물친구', '쿠들러',
  '멍뭉이파파', '고양이왕국', '반려인생', '펫프렌즈', '해피독',
]

const TARGET_NICKNAMES = [
  '나쁜유저1', '스팸봇99', '사기꾼주의', '불량회원', '욕쟁이유저',
  '광고쟁이', '미성년자의심', '음란물게시자', '허위판매자', '괴롭힘유저',
]

const DETAIL_REASONS = [
  '채팅에서 심한 욕설을 반복적으로 사용했습니다.',
  '물건을 보내지 않고 돈만 받아갔습니다.',
  '프로필 사진이 매우 불건전합니다.',
  '같은 메시지를 하루에 수십 번 보냅니다.',
  '사용자 소개에 부적절한 내용이 있습니다.',
  '대화 중 나이를 물어봤더니 13살이라고 했습니다.',
  null,
  null,
  null,
  '거래 후 연락이 두절되었습니다.',
]

const LONG_DETAIL_REASONS: Record<number, string> = {
  1: '채팅에서 심한 욕설과 비방을 했습니다.\n해당 유저는 채팅방에서 반복적으로 심한 욕설과 비방을 하고 있으며, 다른 사용자들에게 인신공격성 발언을 지속적으로 하고 있습니다. 특히 거래 과정에서 의견이 맞지 않으면 극단적인 표현을 사용하며, 여러 사용자가 동일한 피해를 호소하고 있는 상황입니다. 해당 유저의 채팅 내역을 확인해주시면 반복적인 패턴을 확인하실 수 있을 것입니다. 빠른 조치를 부탁드립니다.',
  3: '프로필에 불건전한 콘텐츠가 포함되어 있습니다.\n해당 유저의 프로필 사진과 소개글에 매우 불건전하고 선정적인 이미지와 내용이 포함되어 있습니다. 반려동물 커뮤니티의 특성상 미성년자 이용자도 많은데, 이러한 콘텐츠가 노출되는 것은 매우 부적절합니다. 프로필 사진은 성인 콘텐츠에 해당하며, 소개글에도 부적절한 표현이 다수 포함되어 있어 즉각적인 제재가 필요하다고 판단됩니다.',
  5: '사용자 프로필에 차별적 내용이 포함되어 있습니다.\n해당 유저의 자기소개 및 프로필 정보에 다른 사용자를 비하하고 차별하는 내용이 포함되어 있습니다. 특정 견종이나 반려동물을 키우는 사람들을 비하하는 표현을 사용하고 있으며, 커뮤니티의 건전한 문화를 해치고 있습니다. 여러 사용자들이 해당 프로필을 보고 불쾌함을 느끼고 있으며, 커뮤니티 이용 규칙에 명백히 위반되는 내용입니다.',
  7: '만 14세 미만 유저로 의심됩니다.\n해당 유저와 채팅을 나누던 중 본인이 만 13세라고 밝혔으며, 부모님의 동의 없이 거래를 시도하고 있었습니다. 개인정보 보호 및 미성년자 보호 관련 법률에 따라 만 14세 미만의 유저는 서비스 이용이 제한되어야 합니다. 대화 내역에서 나이를 확인할 수 있으며, 해당 유저의 다른 활동 내역도 함께 검토해주시기 바랍니다.',
  10: '입금 후 연락이 두절된 사기 의심 거래입니다.\n해당 유저와 반려동물 용품 거래를 진행했는데, 입금 후 연락이 완전히 두절되었습니다. 여러 차례 메시지를 보냈으나 읽지도 않고 있으며, 프로필도 비공개로 전환한 상태입니다. 다른 사용자들의 후기를 확인해보니 유사한 피해 사례가 다수 존재하는 것으로 보입니다. 사기 의심 거래로 판단되어 빠른 확인과 계정 제재를 요청드립니다.',
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString()
}

function generateUserReports(count: number): MockUserReport[] {
  return Array.from({ length: count }, (_, i) => {
    const imageCount = i % 3 === 0 ? Math.floor(Math.random() * 3) + 1 : 0
    const images = Array.from({ length: imageCount }, (__, j) =>
      `https://picsum.photos/seed/ureport${i + 1}-${j + 1}/200/200`
    )

    return {
      id: i + 1,
      reporterNickname: `${REPORTER_NICKNAMES[i % REPORTER_NICKNAMES.length]}${i + 1}`,
      targetNickname: `${TARGET_NICKNAMES[i % TARGET_NICKNAMES.length]}`,
      reasonCode: REASON_LABELS[i % REASON_LABELS.length],
      detailReason: LONG_DETAIL_REASONS[i + 1] ?? DETAIL_REASONS[i % DETAIL_REASONS.length],
      images,
      createdAt: randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
    }
  })
}

const userReports = generateUserReports(25)

export function getMockUserReports(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<MockUserReport> {
  let filtered = [...userReports]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.reporterNickname.toLowerCase().includes(q) ||
        r.targetNickname.toLowerCase().includes(q)
    )
  }

  if (params.filters) {
    if (params.filters.reasonCode) {
      filtered = filtered.filter((r) => r.reasonCode === params.filters!.reasonCode)
    }
    if (params.filters.sort === '최신순') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (params.filters.sort === '오래된 순') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
  }

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const data = filtered.slice(start, start + params.pageSize)

  return { data, total, page: params.page, pageSize: params.pageSize }
}
