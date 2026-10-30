// ========== 커뮤니티 응답 타입 ==========
/**
 * 행사 소식 글의 행사 칸. 서버 EventInfoResponse 를 그대로 옮긴 것이다.
 * 행사 글이 아니면 응답에 null 로 온다.
 */
export interface CommunityEvent {
  startDate: string // YYYY-MM-DD
  endDate: string | null
  region: string | null // 목록에 보이는 넓은 지역 (서울, 제주 등)
  place: string | null // 구체적인 장소 (상세 본문에 지역과 같이 보인다)
  organizer: string | null
  summary: string | null // 한 줄 소개
  // 아래는 상세 화면의 표와 목록(설계 7-2절)
  target: string | null
  fee: string | null
  activities: string[] // 이런 걸 할 수 있어요
  checks: string[] // 가기 전에 확인하세요
  sourceUrl: string | null // 원문 주소 (「공식 안내 보기」)
  imageUrl: string | null // 포스터 원래 주소
  hours: string | null // 운영시간
  application: string | null // 신청 방법 (사전 신청, 현장 접수 등)
}

export interface CommunityItem {
  id: number
  title: string
  contentPreview?: string
  thumbnailImageUrl?: string | null
  authorNickname: string
  boardType?: string
  // searchType 삭제 — 이건 검색할 때 보내는 값("title"·"title_content"·"writer")이지
  // 게시글의 속성이 아니다. 서버 PostListItemResponse에 없다.
  viewCount?: number
  commentCount: number
  createdAt: string
  updatedAt: string
  isModified: boolean
  event?: CommunityEvent | null
}

export interface CommunityResponse {
  code: {
    code: string
    message: string
  }
  message: string
  data: {
    page: number
    size: number
    total: number
    content: CommunityItem[]
    hasNext: boolean
    hasPrevious: boolean
    totalElements: number
    numberOfElements: number
  }
}

// ========== 커뮤니티 등록 요청 타입 ==========
export interface CommunityPostRequestData {
  boardType: string
  title: string
  content: string
  imageUrls: string[]
}

export interface CommunityPostResponse {
  code: string
  message: string
  data: {
    id: number
  }
}

/**
 * 상세는 목록과 필드가 다르다. 서버 DTO 둘을 그대로 옮긴 것이다.
 *   PostListItemResponse   contentPreview · thumbnailImageUrl · isModified 가 있다
 *   PostDetailResponse     authorId · authorProfileImageUrl · content · imageUrls 가 있다
 * 그래서 extends로 묶지 않고 따로 적는다.
 */
export interface CommunityDetailItem {
  id: number
  authorId: number
  authorNickname: string
  authorProfileImageUrl: string
  title: string
  content: string
  imageUrls: string[]
  boardType?: string
  viewCount?: number
  commentCount: number
  createdAt: string
  updatedAt: string
  event?: CommunityEvent | null
}

export interface CommunityDetailItemResponse {
  code: string
  message: string
  data: CommunityDetailItem
}

// ========== 댓글 타입 ==========
export interface Comment {
  id: number
  /** 서버는 Long이다. 예전에 string으로 적혀 있어 화면이 Number()로 되돌리고 있었다 */
  authorId: number
  authorNickname: string
  authorProfileImageUrl: string
  content: string
  createdAt: string
  depth: number
  parentId: number
  hasChildren: boolean
  childrenCount: number
}

export interface CommentResponse {
  code: string
  message: string
  data: {
    comments: Comment[]
  }
}

export interface CommentPostRequestData {
  content: string
  parentId?: number
}

export interface CommentPostResponse {
  code: string
  message: string
  data: {
    id: number
    postId: number
    authorId: number
    authorNickname: string
    authorProfileImageUrl: string
    parentId: number
    content: string
    depth: number
    createdAt: string
    updatedAt: string
  }
}
