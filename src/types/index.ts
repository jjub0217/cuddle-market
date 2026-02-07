// ========== 공통 타입 ==========
export type { DeleteResponse } from './common'

// ========== 유저 관련 타입 ==========
export type {
  User,
  MyPageDataResponse,
  BlockedUser,
  MyBlockedUsersResponse,
  ProfileUpdateRequestData,
  ProfileUpdateResponse,
  ChangePasswordRequestData,
  ChangePasswordResponse,
  UserProfileResponse,
  UserBlockedResponse,
  UserUnBlockedResponse,
  ReportedRequestData,
  ReportedResponse,
} from './user'

// ========== 인증 관련 타입 ==========
export type {
  NicknameCheckResponse,
  EmailCheckResponse,
  SignUpRequestData,
  SignUpResponse,
  LoginRequestData,
  LoginResponse,
  ResettingPasswordResponse,
  ResettingPasswordRequestData,
  WithDrawRequest,
  WithDrawResponse,
} from './auth'

// ========== 상품 관련 타입 ==========
export type {
  Product,
  ProductResponse,
  ProductDetailItem,
  ProductDetailItemResponse,
  ProductPostRequestData,
  ProductPostResponse,
  RequestProductPostRequestData,
  ImageUploadResponse,
  MyPageProductResponse,
  UserProductResponse,
} from './product'

// ========== 커뮤니티 관련 타입 ==========
export type {
  CommunityItem,
  CommunityResponse,
  CommunityPostRequestData,
  CommunityPostResponse,
  CommunityDetailItem,
  CommunityDetailItemResponse,
  Comment,
  CommentResponse,
  CommentPostRequestData,
  CommentPostResponse,
} from './community'

// ========== 채팅 관련 타입 ==========
export type {
  CreateChatRequestData,
  ChatRoom,
  CreateChatRoomResponse,
  Message,
  ChatRoomMessagesResponse,
  fetchChatRoom,
  ChatRoomsResponse,
  ChatRoomUpdateResponse,
} from './chat'
