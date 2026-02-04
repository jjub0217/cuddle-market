// ========== 커뮤니티 응답 타입 ==========
export interface CommunityItem {
  id: number
  title: string
  contentPreview?: string
  authorNickname: string
  boardType?: string
  searchType: string
  viewCount?: number
  commentCount: number
  createdAt: string
  updatedAt: string
  isModified: boolean
}

export interface CommunityResponse {
  code: {
    code: number
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

export interface CommunityDetailItem extends CommunityItem {
  authorId: number
  authorProfileImageUrl: string
  content: string
  imageUrls: string[]
}

export interface CommunityDetailItemResponse {
  code: string
  message: string
  data: CommunityDetailItem
}

// ========== 댓글 타입 ==========
export interface Comment {
  id: number
  authorId: string
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
