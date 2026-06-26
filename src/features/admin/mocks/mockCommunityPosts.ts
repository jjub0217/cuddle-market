import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'

export interface MockCommunityComment {
  id: number
  nickname: string
  content: string
  depth: number
  parentId: number | null
  createdAt: string
}

export interface MockCommunityPost {
  id: number
  boardType: string
  title: string
  nickname: string
  content: string
  image: string
  subImages: string[]
  comments: MockCommunityComment[]
  createdAt: string
  updatedAt: string
}

const COMMENT_CONTENTS = [
  '좋은 정보 감사합니다!',
  '저도 같은 경험이 있어요. 공감합니다.',
  '혹시 추천하시는 브랜드가 있나요?',
  '우리 강아지도 비슷한 증상이 있었는데 병원에서 검사받아보세요.',
  '정말 도움이 되는 글이네요. 북마크합니다!',
  '저는 다른 방법을 사용했는데 효과가 좋았어요.',
  '댓글 남겨요~ 저도 궁금했던 부분이에요.',
  '경험담 공유 감사합니다. 참고할게요!',
]
const REPLY_CONTENTS = [
  '맞아요! 저도 그렇게 생각해요.',
  '감사합니다~ 도움이 많이 됐어요!',
  '추가 정보 감사합니다.',
  '저도 궁금했는데 알려주셔서 감사해요.',
  '좋은 답변이네요!',
]
const COMMENT_NICKNAMES = [
  '댕댕이맘', '냥이집사', '펫러버', '동물친구', '쿠들러',
  '멍뭉이파파', '고양이왕국', '반려인생',
]

const BOARD_TYPES = ['질문있어요', '정보공유']
const NICKNAMES = [
  '댕댕이맘', '냥이집사', '펫러버', '동물친구', '쿠들러',
  '멍뭉이파파', '고양이왕국', '반려인생', '펫프렌즈', '해피독',
]
const POST_TITLES = [
  '강아지 산책 시간 궁금해요',
  '고양이 사료 추천',
  '반려동물 보험 정보 공유',
  '강아지 예방접종 주기 질문',
  '고양이 화장실 교육 방법',
  '반려동물 이동장 추천해주세요',
  '강아지 분리불안 해결 방법',
  '고양이 스크래처 어디서 사나요',
  '반려동물 건강검진 주기 공유',
  '강아지 훈련 팁 공유합니다',
  '고양이 구토 원인 질문',
  '반려동물 미용실 추천',
  '강아지 발바닥 관리법',
  '고양이 합사 경험 공유',
  '반려동물 겨울 옷 추천',
]
const POST_CONTENTS = [
  '강아지 산책은 하루에 몇 번이 적당할까요? 저는 1일 2회 30분씩 하고 있는데 부족한 건지 걱정돼서요.',
  '고양이 사료를 바꾸려고 하는데 어떤 사료가 좋을지 추천해주시면 감사하겠습니다. 현재 2살 성묘입니다.',
  '반려동물 보험에 가입했는데 정말 도움이 많이 됐어요. 보험료 대비 혜택이 좋아서 공유합니다.',
  '강아지 첫 예방접종을 맞혔는데 다음 접종은 언제 해야 하나요? 수의사 선생님이 설명해주셨는데 헷갈려서요.',
  '고양이 화장실 교육 처음에 힘드셨던 분들 계신가요? 저만의 교육 방법을 공유해볼게요.',
  '출장이 잦아서 이동장이 필요한데 어떤 제품이 좋을까요? 소형견 기준으로 추천 부탁드려요.',
  '강아지가 혼자 있으면 짖고 물건을 물어뜯어요. 분리불안 해결에 효과적인 방법이 있으신가요?',
  '고양이 스크래처 종류가 너무 많아서 뭘 사야 할지 모르겠어요. 추천해주세요!',
  '매년 건강검진을 받았더니 초기에 질병을 발견할 수 있었어요. 건강검진 주기에 대해 공유해요.',
  '강아지 기본 훈련 팁을 공유합니다. 앉아, 기다려, 이리와 등 기본 명령어 교육 방법입니다.',
  '고양이가 갑자기 구토를 자주 하는데 원인이 뭘까요? 사료를 바꿔야 할지 병원에 가야 할지 궁금해요.',
  '동네에 좋은 반려동물 미용실을 찾고 있어요. 강남 쪽으로 추천해주실 수 있나요?',
  '강아지 발바닥이 갈라지고 건조해졌어요. 관리하는 좋은 방법이 있으시면 공유 부탁드립니다.',
  '고양이 합사 성공했습니다! 2주 걸렸는데 그 과정을 공유해드릴게요.',
  '겨울이 다가오니 반려동물 옷이 필요한데 어떤 브랜드가 따뜻하고 활동하기 좋을까요?',
]

const LONG_POST_CONTENTS: Record<number, string> = {
  1: '강아지 산책은 하루에 몇 번이 적당할까요? 저는 현재 1일 2회 30분씩 하고 있는데, 주변에서는 부족하다는 의견도 있고 충분하다는 의견도 있어서 혼란스럽습니다.\n\n저희 강아지는 3살 된 중형견(코카스파니엘)인데, 에너지가 상당히 넘치는 편이에요. 아침에 30분, 저녁에 30분 산책을 하고 있는데 집에 돌아오면 여전히 활발하게 뛰어다녀요.\n\n수의사 선생님께서는 견종마다 다르지만, 중형견 기준 하루 1시간~1시간 30분 정도가 적당하다고 하셨어요. 그래서 점심시간에 짧게 15분이라도 추가 산책을 해주면 좋을 것 같다는 조언도 받았습니다.\n\n혹시 비슷한 견종 키우시는 분들은 하루에 산책을 얼마나 하시나요? 산책 외에 실내에서 할 수 있는 놀이도 추천해주시면 정말 감사하겠습니다. 노즈워크나 터그놀이 같은 것도 효과가 있다고 들었는데, 직접 해보신 분들의 경험이 궁금해요.\n\n그리고 산책 시 하네스와 목줄 중 어떤 게 더 좋을까요? 현재는 목줄을 사용 중인데, 하네스로 바꾸는 게 낫다는 이야기를 많이 들어서 고민 중입니다.',
  3: '반려동물 보험에 가입한 지 6개월 정도 됐는데, 정말 가입하길 잘했다는 생각이 들어서 경험을 공유합니다.\n\n저희 고양이가 갑자기 구토를 하면서 식욕이 떨어져서 급하게 동물병원에 갔는데, 초음파 검사와 혈액 검사를 받았어요. 다행히 큰 문제는 아니었지만 검사비만 30만 원이 넘게 나왔습니다.\n\n보험 덕분에 70%를 보상받아서 실제 부담은 10만 원 정도였어요. 월 보험료가 3만 원 정도인데, 이번 한 번으로 거의 반 년치 보험료를 건진 셈이에요.\n\n보험 선택할 때 주의할 점을 정리해보면:\n1. 가입 전 이미 있는 질병은 보상 제외되니 어릴 때 가입하는 게 유리해요\n2. 보험사마다 보상 비율이 다르니 꼼꼼히 비교해야 해요\n3. 연간 보상 한도를 확인하세요 (저는 연 200만 원 한도)\n4. 치과 치료는 별도 특약인 경우가 많으니 확인하세요\n5. 예방접종이나 정기검진은 대부분 보상 대상이 아니에요\n\n어떤 보험사를 선택할지 고민이시라면 댓글로 물어봐주세요. 제가 가입 전에 비교했던 3개 보험사 정보를 공유해드릴게요!',
  5: '고양이 화장실 교육, 처음에 정말 힘드셨던 분들 계신가요? 저도 처음에 많이 애먹었는데, 나름의 방법을 찾아서 공유해볼게요.\n\n저희 고양이는 3개월 때 입양했는데, 처음에는 화장실 위치를 전혀 모르더라고요. 소파 밑이나 침대 밑에서 실수를 하는 바람에 스트레스를 많이 받았어요.\n\n제가 시도했던 방법들:\n1. 화장실을 조용하고 접근하기 쉬운 곳에 배치했어요\n2. 식사 직후와 낮잠에서 깨어난 직후에 화장실로 데려갔어요\n3. 실수한 곳은 효소 클리너로 완벽하게 냄새를 제거했어요\n4. 화장실에서 볼일을 보면 간식으로 칭찬해줬어요\n5. 모래 종류를 여러 가지 시도해봤어요 (두부모래가 가장 반응이 좋았음)\n\n약 2주 정도 꾸준히 반복하니까 스스로 화장실을 찾아가기 시작했어요. 중요한 건 절대 혼내지 않는 거예요. 실수해도 조용히 치우고, 잘했을 때만 칭찬해주세요.\n\n화장실 개수도 중요한데, 고양이 수 + 1개가 적당하다고 해요. 저는 1마리인데 2개를 놓아뒀더니 훨씬 편안해하더라고요.\n\n혹시 다른 좋은 방법이 있으시면 댓글로 알려주세요!',
  7: '강아지 분리불안 때문에 정말 고민이 많았는데, 여러 방법을 시도한 끝에 많이 나아져서 경험을 공유합니다.\n\n저희 강아지(비숑프리제, 2살)는 제가 출근하면 짖고, 문을 긁고, 가구를 물어뜯는 등 심한 분리불안 증상이 있었어요. 이웃에서 민원이 들어올 정도였습니다.\n\n시도했던 방법들:\n1. 외출 전 30분 정도 충분히 산책하고 놀아줬어요\n2. 외출 시 특별 간식(콩을 채운 장난감)을 줬어요\n3. 처음에는 5분, 10분, 30분씩 점진적으로 혼자 있는 시간을 늘렸어요\n4. 외출할 때 과도한 인사를 하지 않았어요 (담담하게 나가기)\n5. CCTV를 설치해서 행동 패턴을 관찰했어요\n\n가장 효과적이었던 것은 점진적 둔감화 훈련이었어요. 현관문을 열었다 닫는 것부터 시작해서, 나갔다 바로 들어오기, 5분 후 돌아오기... 이런 식으로 서서히 시간을 늘려갔어요.\n\n약 한 달 정도 꾸준히 훈련하니 많이 나아졌습니다. 물론 완전히 없어진 건 아니지만, 이전처럼 가구를 물어뜯거나 하진 않아요.\n\n심한 경우에는 전문 트레이너의 도움을 받는 것도 추천합니다. 저도 초기에 상담을 받았는데 많은 도움이 됐어요.',
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString()
}

function randomSubImages(seed: number): string[] {
  const count = seed % 4 // 0~3개
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/community${seed}sub${i}/400/300`)
}

function generateComments(postSeed: number, postCreatedAt: string): MockCommunityComment[] {
  const parentCount = (postSeed % 4) + 1 // 1~4개 부모 댓글
  const comments: MockCommunityComment[] = []
  let idCounter = postSeed * 100

  for (let i = 0; i < parentCount; i++) {
    const parentId = ++idCounter
    const parentCreatedAt = randomDate(new Date(postCreatedAt), new Date('2026-03-01'))
    comments.push({
      id: parentId,
      nickname: `${COMMENT_NICKNAMES[(postSeed + i) % COMMENT_NICKNAMES.length]}${postSeed + i}`,
      content: COMMENT_CONTENTS[(postSeed + i) % COMMENT_CONTENTS.length],
      depth: 1,
      parentId: null,
      createdAt: parentCreatedAt,
    })

    // 일부 부모 댓글에 대댓글 추가 (짝수 인덱스)
    if (i % 2 === 0) {
      const replyCount = (postSeed + i) % 3 + 1 // 1~3개 대댓글
      for (let j = 0; j < replyCount; j++) {
        comments.push({
          id: ++idCounter,
          nickname: `${COMMENT_NICKNAMES[(postSeed + i + j + 3) % COMMENT_NICKNAMES.length]}${postSeed + i + j + 3}`,
          content: REPLY_CONTENTS[(postSeed + i + j) % REPLY_CONTENTS.length],
          depth: 2,
          parentId,
          createdAt: randomDate(new Date(parentCreatedAt), new Date('2026-03-01')),
        })
      }
    }
  }

  return comments
}

function generateCommunityPosts(count: number): MockCommunityPost[] {
  return Array.from({ length: count }, (_, i) => {
    const createdAt = randomDate(new Date('2024-01-01'), new Date('2025-12-31'))
    return {
      id: i + 1,
      boardType: BOARD_TYPES[i % BOARD_TYPES.length],
      title: POST_TITLES[i % POST_TITLES.length],
      nickname: `${NICKNAMES[i % NICKNAMES.length]}${i + 1}`,
      content: LONG_POST_CONTENTS[i + 1] ?? POST_CONTENTS[i % POST_CONTENTS.length],
      image: `https://picsum.photos/seed/community${i + 1}/400/300`,
      subImages: randomSubImages(i + 1),
      comments: generateComments(i + 1, createdAt),
      createdAt,
      updatedAt: randomDate(new Date(createdAt), new Date('2026-03-01')),
    }
  })
}

const communityPosts = generateCommunityPosts(30)

export function getMockCommunityPosts(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<MockCommunityPost> {
  let filtered = [...communityPosts]

  // 검색
  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(q))
  }

  // 필터
  if (params.filters) {
    if (params.filters.boardType) {
      filtered = filtered.filter((p) => p.boardType === params.filters!.boardType)
    }
  }

  // sortOrder 필터 적용 (최신순 / 오래된 순)
  if (params.filters?.sortOrder) {
    const order = params.filters.sortOrder
    if (order === '최신순') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (order === '오래된 순') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
  }

  // 정렬
  if (params.sort?.direction) {
    const { key, direction } = params.sort
    filtered.sort((a, b) => {
      const aVal = a[key as keyof MockCommunityPost]
      const bVal = b[key as keyof MockCommunityPost]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const data = filtered.slice(start, start + params.pageSize)

  return { data, total, page: params.page, pageSize: params.pageSize }
}
