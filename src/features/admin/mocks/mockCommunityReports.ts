import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'

export interface MockCommunityReport {
  id: number
  boardType: string
  reporterNickname: string
  postTitle: string
  authorNickname: string
  reasonCode: string
  postContent: string
  detailReason: string | null
  images: string[]
  createdAt: string
}

const REASON_LABELS = [
  '욕설, 비방, 혐오 표현',
  '도배 게시물',
  '음란물/불건전 콘텐츠',
  '스팸/광고성 메시지',
  '자해 또는 자살 의도를 포함',
  '기타',
]

const BOARD_TYPES = ['질문있어요', '정보공유']

const REPORTER_NICKNAMES = [
  '댕댕이맘', '냥이집사', '펫러버', '동물친구', '쿠들러',
  '멍뭉이파파', '고양이왕국', '반려인생', '펫프렌즈', '해피독',
]

const AUTHOR_NICKNAMES = [
  '나쁜작성자', '스팸봇', '도배충', '광고쟁이', '혐오발언자',
  '불량유저', '욕쟁이작성자', '음란물작성자', '자해언급자', '기타신고자',
]

const POST_TITLES = [
  '강아지 사료 추천해주세요',
  '고양이 털 빠짐 심한데 어떻게 하나요',
  '반려동물 병원 추천 부탁드립니다',
  '강아지 산책 얼마나 해야 할까요',
  '고양이 화장실 냄새 제거 방법',
  '반려동물 보험 가입하신 분 계신가요',
  '강아지 훈련 팁 공유합니다',
  '고양이 간식 추천 목록',
  '반려동물 이동장 구매 후기',
  '강아지 발바닥 관리법 공유',
  '고양이 스크래처 DIY 방법',
  '반려동물 목욕 주기 질문',
  '강아지 예방접종 일정 공유',
  '고양이 중성화 수술 후기',
  '반려동물 여행 팁 모음',
]

const POST_CONTENTS = [
  '안녕하세요. 강아지 사료를 바꾸려고 하는데 추천해주실 분 계신가요?',
  '저희 고양이가 요즘 털이 너무 많이 빠지는데 혹시 좋은 방법 있나요?',
  '근처에 좋은 동물병원을 찾고 있습니다. 추천 부탁드립니다.',
  '강아지 산책은 하루에 몇 번, 얼마나 해야 할까요?',
  '고양이 화장실 냄새가 너무 심한데 효과적인 제거 방법을 알고 싶습니다.',
  '반려동물 보험 가입을 고민 중인데 어떤 상품이 좋을까요?',
  '강아지 훈련 시 효과적인 방법들을 공유해 드립니다.',
  '제가 먹여본 고양이 간식 중에서 좋았던 것들을 정리해봤습니다.',
  '이동장을 구매했는데 사용 후기를 공유합니다.',
  '강아지 발바닥 관리하는 방법을 공유합니다.',
]

const DETAIL_REASONS = [
  '욕설 및 비방 내용이 포함되어 있습니다.',
  '동일한 게시물을 여러 번 반복 게시하고 있습니다.',
  '불건전한 이미지가 첨부되어 있습니다.',
  '광고성 링크가 포함되어 있습니다.',
  '자해를 암시하는 내용이 있습니다.',
  null,
  null,
  null,
  '기타 사유로 신고합니다.',
  '혐오 표현이 포함되어 있습니다.',
]

const LONG_DETAIL_REASONS: Record<number, string> = {
  1: '욕설 및 비방 내용이 포함되어 있습니다.\n해당 게시글에는 다른 사용자를 향한 심한 욕설과 비방이 포함되어 있으며, 특정 사용자의 닉네임을 직접 거론하면서 인신공격을 하고 있습니다. 게시글 본문뿐만 아니라 댓글에서도 지속적으로 욕설을 사용하고 있어 다른 사용자들이 심각한 불쾌감을 느끼고 있습니다. 해당 작성자의 이전 게시글을 확인해보면 유사한 패턴이 반복되고 있으며, 커뮤니티 분위기를 심각하게 해치고 있습니다.',
  3: '불건전한 이미지가 첨부되어 있습니다.\n해당 게시글에 첨부된 이미지들이 매우 불건전하고 선정적인 내용을 담고 있습니다. 반려동물 관련 커뮤니티에서 이러한 이미지가 게시되는 것은 전혀 적절하지 않으며, 미성년자 이용자들이 접할 수 있다는 점에서 더욱 심각한 문제입니다. 이미지 3장 모두 성인 콘텐츠에 해당하는 것으로 판단되며, 게시글의 즉각적인 삭제와 작성자에 대한 강력한 제재를 요청드립니다.',
  5: '자해를 암시하는 내용이 있습니다.\n해당 게시글의 내용에 자해 및 자살을 암시하는 표현이 다수 포함되어 있어 매우 우려됩니다. 구체적인 방법을 언급하고 있으며, 다른 사용자들에게도 부정적인 영향을 미칠 수 있는 내용입니다. 반려동물 커뮤니티의 특성상 정서적으로 취약한 이용자들도 있을 수 있으므로, 해당 게시글의 즉각적인 비공개 처리와 함께 작성자에게 적절한 안내가 필요하다고 판단됩니다.',
  7: '혐오 표현이 포함되어 있습니다.\n해당 게시글의 제목과 내용에 특정 인종, 성별, 지역을 비하하고 차별하는 혐오 표현이 다수 포함되어 있습니다. 반려동물과 전혀 관련 없는 정치적이고 사회적으로 민감한 주제를 다루면서 극단적인 혐오 발언을 하고 있으며, 댓글에서 이를 지적하는 다른 사용자들에게도 추가적인 혐오 표현을 사용하고 있습니다. 커뮤니티 가이드라인 위반으로 즉각적인 조치를 요청합니다.',
  10: '광고성 링크가 포함되어 있습니다.\n해당 게시글에 외부 쇼핑몰 링크와 함께 특정 상품을 홍보하는 광고성 내용이 포함되어 있습니다. 게시글 제목은 정보 공유인 것처럼 위장하고 있으나, 실제 내용은 특정 업체의 상품을 홍보하기 위한 목적으로 작성된 것이 명백합니다. 해당 작성자의 이전 게시글들을 확인해보면 모두 유사한 패턴의 광고성 게시글이며, 조직적인 스팸 활동으로 의심됩니다.',
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString()
}

function generateCommunityReports(count: number): MockCommunityReport[] {
  return Array.from({ length: count }, (_, i) => {
    const imageCount = i % 3 === 0 ? Math.floor(Math.random() * 3) + 1 : 0
    const images = Array.from({ length: imageCount }, (__, j) =>
      `https://picsum.photos/seed/creport${i + 1}-${j + 1}/200/200`
    )

    return {
      id: i + 1,
      boardType: BOARD_TYPES[i % BOARD_TYPES.length],
      reporterNickname: `${REPORTER_NICKNAMES[i % REPORTER_NICKNAMES.length]}${i + 1}`,
      postTitle: POST_TITLES[i % POST_TITLES.length],
      authorNickname: `${AUTHOR_NICKNAMES[i % AUTHOR_NICKNAMES.length]}`,
      reasonCode: REASON_LABELS[i % REASON_LABELS.length],
      postContent: POST_CONTENTS[i % POST_CONTENTS.length],
      detailReason: LONG_DETAIL_REASONS[i + 1] ?? DETAIL_REASONS[i % DETAIL_REASONS.length],
      images,
      createdAt: randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
    }
  })
}

const communityReports = generateCommunityReports(25)

export function getMockCommunityReports(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<MockCommunityReport> {
  let filtered = [...communityReports]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.postTitle.toLowerCase().includes(q) ||
        r.authorNickname.toLowerCase().includes(q) ||
        r.reporterNickname.toLowerCase().includes(q)
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
