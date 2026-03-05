import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'

export interface MockProductRequestReport {
  id: number
  reporterNickname: string
  image: string
  productName: string
  requesterNickname: string
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

const REQUESTER_NICKNAMES = [
  '의심요청자', '허위요청자', '스팸요청자', '불량요청자', '사기요청자',
  '욕쟁이요청자', '광고봇요청자', '음란요청자', '미성년요청자', '나쁜요청자',
]

const PRODUCT_NAMES = [
  '강아지 사료 10kg', '고양이 캣타워', '반려동물 이동장', '강아지 간식 세트',
  '고양이 장난감 세트', '반려동물 목욕용품', '강아지 옷 겨울용', '고양이 모래 10L',
  '반려동물 자동급식기', '강아지 리드줄', '고양이 스크래처', '반려동물 건강검진 쿠폰',
  '강아지 훈련용 간식', '고양이 습식사료', '반려동물 침대',
]

const DETAIL_REASONS = [
  '요청 내용에 부적절한 언어가 포함되어 있습니다.',
  '허위로 상품을 요청하는 것으로 의심됩니다.',
  '요청 이미지가 불건전합니다.',
  '동일한 요청을 반복적으로 도배하고 있습니다.',
  '요청자의 프로필 정보가 불쾌합니다.',
  null,
  null,
  null,
  '만 14세 미만인 것으로 의심됩니다.',
  '기타 사유로 신고합니다.',
]

const LONG_DETAIL_REASONS: Record<number, string> = {
  1: '요청 내용에 부적절한 언어가 포함되어 있습니다.\n해당 요청자는 상품 요청 게시글에서 반복적으로 부적절한 언어와 비속어를 사용하고 있습니다. 요청 내용 자체도 정상적인 거래 목적이 아닌 다른 사용자들을 자극하고 분란을 일으키기 위한 목적으로 보이며, 댓글에서도 다른 사용자들에게 욕설과 비방을 일삼고 있습니다. 해당 요청자의 최근 활동 이력을 확인해보면 유사한 패턴이 반복되고 있어 강력한 제재가 필요합니다.',
  3: '요청 이미지가 불건전합니다.\n해당 상품 요청 게시글에 첨부된 이미지가 매우 선정적이고 불건전한 내용을 포함하고 있습니다. 반려동물 용품 요청과 전혀 관련 없는 부적절한 이미지를 업로드하여 다른 사용자들에게 불쾌감을 주고 있습니다. 특히 미성년자가 이용할 수 있는 플랫폼에서 이러한 콘텐츠가 노출되는 것은 심각한 문제이므로 즉각적인 게시글 삭제와 계정 제재를 요청합니다.',
  5: '요청자의 프로필 정보가 불쾌합니다.\n해당 요청자의 프로필에 인종차별적이고 혐오적인 내용이 포함되어 있으며, 자기소개란에 다른 반려동물 종을 비하하는 표현을 사용하고 있습니다. 또한 요청 게시글의 내용에서도 특정 지역 출신 사용자들을 차별하는 발언을 하고 있어 커뮤니티의 건전한 문화를 심각하게 훼손하고 있습니다. 이용약관 및 커뮤니티 가이드라인 위반으로 적절한 조치를 부탁드립니다.',
  7: '만 14세 미만인 것으로 의심됩니다.\n해당 요청자와 채팅으로 대화를 나누다가 본인이 초등학교 6학년이라고 말했습니다. 만 14세 미만의 미성년자가 보호자 동의 없이 서비스를 이용하고 상품 요청 거래를 시도하는 것은 관련 법률에 위반됩니다. 대화 내역을 캡처하여 첨부하오니 확인 부탁드리며, 미성년자 보호 차원에서 해당 계정에 대한 연령 확인 절차를 진행해주시기 바랍니다.',
  10: '동일한 요청을 반복적으로 도배하고 있습니다.\n해당 요청자가 동일한 상품 요청 게시글을 하루에 20건 이상 반복적으로 등록하고 있으며, 제목과 내용을 미세하게 변경하여 필터를 우회하고 있습니다. 이러한 도배 행위로 인해 다른 정상적인 요청 게시글이 묻히고 있으며, 여러 사용자들이 불편을 호소하고 있습니다. 해당 요청자의 게시 이력을 확인하시면 패턴이 명확하게 드러날 것이며, 반복적인 도배 행위에 대한 제재를 요청드립니다.',
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString()
}

function generateProductRequestReports(count: number): MockProductRequestReport[] {
  return Array.from({ length: count }, (_, i) => {
    const imageCount = i % 3 === 0 ? Math.floor(Math.random() * 3) + 1 : 0
    const images = Array.from({ length: imageCount }, (__, j) =>
      `https://picsum.photos/seed/prreport${i + 1}-${j + 1}/200/200`
    )

    return {
      id: i + 1,
      reporterNickname: `${REPORTER_NICKNAMES[i % REPORTER_NICKNAMES.length]}${i + 1}`,
      image: `https://picsum.photos/seed/prproduct${i + 1}/100/100`,
      productName: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
      requesterNickname: `${REQUESTER_NICKNAMES[i % REQUESTER_NICKNAMES.length]}`,
      reasonCode: REASON_LABELS[i % REASON_LABELS.length],
      detailReason: LONG_DETAIL_REASONS[i + 1] ?? DETAIL_REASONS[i % DETAIL_REASONS.length],
      images,
      createdAt: randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
    }
  })
}

const productRequestReports = generateProductRequestReports(25)

export function getMockProductRequestReports(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<MockProductRequestReport> {
  let filtered = [...productRequestReports]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.requesterNickname.toLowerCase().includes(q) ||
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
