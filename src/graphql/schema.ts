import gql from 'graphql-tag'

export const typeDefs = gql`
  # ─── Community ───

  type CommunityPost {
    id: Int!
    title: String!
    contentPreview: String
    thumbnailImageUrl: String
    authorNickname: String!
    boardType: String!
    viewCount: Int!
    commentCount: Int!
    createdAt: String!
    updatedAt: String!
    isModified: Boolean
  }

  type CommunityPostDetail {
    id: Int!
    title: String!
    content: String!
    authorNickname: String!
    authorProfileImageUrl: String
    authorId: Int!
    boardType: String!
    viewCount: Int!
    commentCount: Int!
    createdAt: String!
    updatedAt: String!
    imageUrls: [String!]
  }

  type Comment {
    id: Int!
    content: String!
    authorId: Int
    authorNickname: String!
    authorProfileImageUrl: String
    createdAt: String!
    depth: Int
    parentId: Int
    hasChildren: Boolean
    childrenCount: Int
    isModified: Boolean
  }

  type CommunityPostConnection {
    content: [CommunityPost!]!
    page: Int!
    size: Int
    total: Int!
    totalElements: Int!
    hasNext: Boolean!
    hasPrevious: Boolean!
    numberOfElements: Int
  }

  type CommentConnection {
    comments: [Comment!]!
  }

  input CommunityPostInput {
    boardType: String!
    title: String!
    content: String!
    imageUrls: [String!]
  }

  # ─── User / Profile ───

  type UserProfile {
    id: Int
    nickname: String!
    profileImageUrl: String
    introduction: String
    rating: Float
    isBlocked: Boolean
  }

  type MyProfile {
    id: Int!
    email: String!
    name: String!
    nickname: String!
    birthDate: String
    profileImageUrl: String
    introduction: String
    addressSido: String
    addressGugun: String
    createdAt: String!
    rating: Float
    provider: String
  }

  type BlockedUser {
    blockedUserId: Int!
    blockedUserNickname: String!
    blockedAt: String
  }

  type BlockedUserConnection {
    content: [BlockedUser!]!
    page: Int!
    hasNext: Boolean!
    total: Int
  }

  type NicknameCheckResponse {
    available: Boolean!
    message: String!
  }

  input ProfileUpdateInput {
    nickname: String
    birthDate: String
    profileImageUrl: String
    introduction: String
    addressSido: String
    addressGugun: String
  }

  # ─── Products ───

  type Product {
    id: Int!
    title: String!
    price: Int!
    mainImageUrl: String
    petType: String
    petDetailType: String!
    productStatus: String!
    productType: String!
    tradeStatus: String
    createdAt: String!
    viewCount: Int!
    favoriteCount: Int!
    isFavorite: Boolean
    addressSido: String
    addressGugun: String
  }

  type SellerInfo {
    sellerId: Int!
    sellerNickname: String!
    sellerProfileImageUrl: String
  }

  type ProductDetail {
    id: Int!
    title: String!
    description: String!
    price: Int!
    mainImageUrl: String
    subImageUrls: [String!]
    productType: String!
    tradeStatus: String
    petType: String!
    petDetailType: String!
    category: String!
    productStatus: String!
    addressSido: String
    addressGugun: String
    createdAt: String!
    viewCount: Int!
    favoriteCount: Int!
    isFavorite: Boolean
    sellerInfo: SellerInfo
    sellerOtherProducts: [Product!]
  }

  type ProductConnection {
    content: [Product!]!
    page: Int
    total: Int
    totalPages: Int
    totalElements: Int!
    hasNext: Boolean!
    hasPrevious: Boolean
  }

  input ProductInput {
    petType: String!
    petDetailType: String!
    category: String!
    title: String!
    description: String!
    price: Int!
    productStatus: String!
    mainImageUrl: String!
    subImageUrls: [String!]
    addressSido: String
    addressGugun: String
  }

  input ProductRequestInput {
    petType: String!
    petDetailType: String!
    category: String!
    title: String!
    description: String!
    desiredPrice: Int!
    mainImageUrl: String!
    subImageUrls: [String!]
    addressSido: String
    addressGugun: String
  }

  # ─── Notifications ───

  type Notification {
    notificationId: Int!
    notificationType: String!
    title: String!
    content: String!
    relatedEntityType: String!
    relatedEntityId: Int!
    isRead: Boolean!
    readAt: String
    createdAt: String!
    # 이 알림이 묶고 있는 건수. 채팅만 값이 있고 나머지는 null 이라 Int! 가 아니다.
    # 서버가 나중에 더한 필드라 배포가 늦으면 아예 안 올 수도 있다 — 그때도 null 로 받는다.
    groupCount: Int
  }

  type NotificationConnection {
    content: [Notification!]!
    page: Int!
    hasNext: Boolean!
  }

  type UnreadCount {
    unreadCount: Int!
  }

  # ─── Chat ───

  type ChatRoom {
    chatRoomId: Int!
    productId: Int
    productTitle: String
    productPrice: Int
    productImageUrl: String
    opponentId: Int
    opponentNickname: String
    opponentProfileImageUrl: String
    lastMessage: String
    lastMessageTime: String
    unreadCount: Int
  }

  type ChatRoomConnection {
    chatRooms: [ChatRoom!]!
    currentPage: Int!
    hasNext: Boolean!
  }

  type ChatMessage {
    messageId: Int
    senderId: Int
    senderNickname: String
    content: String
    messageType: String
    imageUrl: String
    createdAt: String
  }

  type ChatMessageConnection {
    messages: [ChatMessage!]!
    currentPage: Int!
    hasNext: Boolean!
  }

  type CreateChatRoomResponse {
    chatRoomId: Int!
  }

  # ─── Common ───

  type MutationResponse {
    success: Boolean!
    message: String
  }

  type CreateResponse {
    id: Int!
  }

  type ProfileUpdateResponse {
    success: Boolean!
    code: String!
  }

  # ─── Queries ───

  type Query {
    # Community
    communityPosts(
      page: Int = 0
      size: Int = 20
      boardType: String
      searchType: String
      keyword: String
      sortBy: String
    ): CommunityPostConnection!
    communityPost(id: Int!): CommunityPostDetail
    communityPostComments(postId: Int!, page: Int = 0, size: Int = 10): CommentConnection!
    communityReplies(commentId: Int!): CommentConnection!

    # User / Profile
    userProfile(userId: Int!): UserProfile
    myProfile: MyProfile
    myProducts(page: Int = 0, size: Int = 10): ProductConnection!
    myRequests(page: Int = 0, size: Int = 10): ProductConnection!
    myFavorites(page: Int = 0, size: Int = 10): ProductConnection!
    myBlockedUsers(page: Int = 0, size: Int = 10): BlockedUserConnection!
    userProducts(userId: Int!, page: Int = 0, size: Int = 10): ProductConnection!
    checkNickname(nickname: String!): NicknameCheckResponse!

    # Products
    products(
      page: Int = 0
      size: Int = 20
      keyword: String
      productType: String
      productStatuses: String
      minPrice: Int
      maxPrice: Int
      addressSido: String
      addressGugun: String
      categories: String
      petType: String
      petDetailType: String
      sortBy: String
      sortOrder: String
    ): ProductConnection!
    product(id: Int!): ProductDetail

    # Notifications
    notifications(page: Int = 0, size: Int = 10): NotificationConnection!
    unreadNotificationCount: UnreadCount!

    # Chat
    chatRooms(page: Int = 0, size: Int = 10): ChatRoomConnection!
    chatMessages(chatRoomId: Int!, page: Int = 0, size: Int = 50): ChatMessageConnection!
  }

  # ─── Mutations ───

  type Mutation {
    # Products
    createProduct(input: ProductInput!): CreateResponse!
    updateProduct(id: Int!, input: ProductInput!): MutationResponse!
    deleteProduct(id: Int!): MutationResponse!
    toggleFavorite(productId: Int!): MutationResponse!
    updateTradeStatus(id: Int!, tradeStatus: String!): MutationResponse!
    createProductRequest(input: ProductRequestInput!): CreateResponse!
    updateProductRequest(id: Int!, input: ProductRequestInput!): MutationResponse!

    # Community
    createPost(input: CommunityPostInput!): CreateResponse!
    updatePost(id: Int!, input: CommunityPostInput!): MutationResponse!
    deletePost(id: Int!): MutationResponse!
    createComment(postId: Int!, content: String!, parentId: Int): MutationResponse!
    deleteComment(commentId: Int!): MutationResponse!
    reportPost(postId: Int!, reason: String!, details: String): MutationResponse!

    # Profile
    updateProfile(input: ProfileUpdateInput!): ProfileUpdateResponse!
    changePassword(currentPassword: String!, newPassword: String!, confirmPassword: String!): MutationResponse!
    withdraw(reason: String!, detailReason: String!): MutationResponse!
    blockUser(userId: Int!): MutationResponse!
    unblockUser(userId: Int!): MutationResponse!
    reportUser(userId: Int!, reasonCode: String!, detailReason: String, imageFiles: [String!]): MutationResponse!

    # Notifications
    markAllNotificationsRead: MutationResponse!
    markNotificationRead(notificationId: Int!): MutationResponse!

    # Chat
    createChatRoom(productId: Int!): CreateChatRoomResponse!
    leaveChatRoom(chatRoomId: Int!): MutationResponse!
  }
`
