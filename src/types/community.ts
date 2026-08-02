// ========== 커뮤니티 응답 타입 ==========
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
