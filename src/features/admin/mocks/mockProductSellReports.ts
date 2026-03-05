import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'

export interface MockProductSellReport {
  id: number
  reporterNickname: string
  image: string
  productName: string
  sellerNickname: string
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

const SELLER_NICKNAMES = [
  '사기판매자', '허위상품판매', '불량셀러', '스팸셀러', '욕쟁이셀러',
  '광고봇판매자', '의심판매자', '음란물판매', '허위거래자', '나쁜판매자',
]

const PRODUCT_NAMES = [
  '강아지 사료 10kg', '고양이 캣타워', '반려동물 이동장', '강아지 간식 세트',
  '고양이 장난감 세트', '반려동물 목욕용품', '강아지 옷 겨울용', '고양이 모래 10L',
  '반려동물 자동급식기', '강아지 리드줄', '고양이 스크래처', '반려동물 건강검진 쿠폰',
  '강아지 훈련용 간식', '고양이 습식사료', '반려동물 침대',
]

const DETAIL_REASONS = [
  '상품 설명과 실제 상품이 완전히 다릅니다.',
  '돈을 보냈는데 상품을 받지 못했습니다.',
  '상품 이미지가 불건전합니다.',
  '동일한 상품을 여러 번 도배하고 있습니다.',
  '상품 설명에 부적절한 내용이 포함되어 있습니다.',
  null,
  null,
  null,
  '가격을 허위로 표기한 것 같습니다.',
  '판매자가 연락을 받지 않습니다.',
]

const LONG_DETAIL_REASONS: Record<number, string> = {
  1: '상품 설명과 실제 상품이 완전히 다릅니다.\n해당 상품의 설명에는 "새 상품, 미개봉"이라고 기재되어 있었으나, 실제로 수령한 상품은 포장이 뜯겨져 있었고 사용 흔적이 뚜렷하게 남아있었습니다. 상품 사진도 인터넷에서 가져온 것으로 보이며, 실제 상품과 전혀 일치하지 않습니다. 판매자에게 문의했으나 답변을 회피하고 있으며, 환불도 거부하고 있는 상황입니다. 허위 상품 등록에 대한 제재를 요청합니다.',
  3: '상품 이미지가 불건전합니다.\n해당 판매 게시글에 첨부된 상품 이미지 중 일부가 매우 불건전하고 선정적인 내용을 포함하고 있습니다. 반려동물 용품 거래 플랫폼에서 이러한 이미지가 노출되는 것은 부적절하며, 특히 미성년자 이용자가 접근할 수 있는 환경에서 심각한 문제가 됩니다. 해당 게시글의 이미지를 즉시 확인하시고 적절한 조치를 취해주시기 바랍니다.',
  5: '상품 설명에 부적절한 내용이 포함되어 있습니다.\n해당 상품 게시글의 설명란에 반려동물과 무관한 부적절하고 불쾌한 내용이 다수 포함되어 있습니다. 상품명은 정상적인 반려동물 용품으로 되어 있으나, 상세 설명을 읽어보면 혐오 표현과 차별적 발언이 포함되어 있어 이용자들에게 불쾌감을 주고 있습니다. 커뮤니티 가이드라인을 명백히 위반하고 있으므로 게시글 삭제 및 판매자 제재를 요청드립니다.',
  7: '만 14세 미만 판매자로 의심됩니다.\n해당 판매자와 거래를 진행하면서 채팅을 나눴는데, 대화 중 본인이 중학교 1학년이라고 밝혔습니다. 만 14세 미만으로 추정되며, 보호자의 동의 없이 고가의 반려동물 용품을 판매하고 있는 것으로 보입니다. 미성년자 보호를 위해 해당 계정의 나이 확인 및 적절한 조치가 필요하다고 판단됩니다. 관련 대화 스크린샷을 첨부합니다.',
  10: '입금 후 상품 미발송 사기 의심 거래입니다.\n해당 판매자에게 반려동물 자동급식기를 구매하고 입금까지 완료했으나, 이후 일주일이 넘도록 상품을 발송하지 않고 있습니다. 채팅으로 여러 차례 배송 일정을 문의했지만 매번 다른 핑계를 대며 발송을 미루고 있으며, 최근에는 메시지 읽기조차 하지 않고 있습니다. 다른 구매자 후기에서도 유사한 패턴이 확인되어 사기 거래로 의심됩니다.',
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString()
}

function generateProductSellReports(count: number): MockProductSellReport[] {
  return Array.from({ length: count }, (_, i) => {
    const imageCount = i % 3 === 0 ? Math.floor(Math.random() * 3) + 1 : 0
    const images = Array.from({ length: imageCount }, (__, j) =>
      `https://picsum.photos/seed/preport${i + 1}-${j + 1}/200/200`
    )

    return {
      id: i + 1,
      reporterNickname: `${REPORTER_NICKNAMES[i % REPORTER_NICKNAMES.length]}${i + 1}`,
      image: `https://picsum.photos/seed/psell${i + 1}/100/100`,
      productName: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
      sellerNickname: `${SELLER_NICKNAMES[i % SELLER_NICKNAMES.length]}`,
      reasonCode: REASON_LABELS[i % REASON_LABELS.length],
      detailReason: LONG_DETAIL_REASONS[i + 1] ?? DETAIL_REASONS[i % DETAIL_REASONS.length],
      images,
      createdAt: randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
    }
  })
}

const productSellReports = generateProductSellReports(25)

export function getMockProductSellReports(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<MockProductSellReport> {
  let filtered = [...productSellReports]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.sellerNickname.toLowerCase().includes(q) ||
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
