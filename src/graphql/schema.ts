import gql from 'graphql-tag'

export const typeDefs = gql`
  type CommunityPost {
    id: Int!
    title: String!
    contentPreview: String
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
    authorNickname: String!
    authorProfileImageUrl: String
    createdAt: String!
  }

  type CommunityPostConnection {
    content: [CommunityPost!]!
    total: Int!
  }

  type CommentConnection {
    comments: [Comment!]!
  }

  type UserProfile {
    nickname: String!
    profileImageUrl: String
    introduction: String
    rating: Float
  }

  type Product {
    id: Int!
    title: String!
    price: Int!
    mainImageUrl: String
    petDetailType: String!
    productStatus: String!
    productType: String!
    tradeStatus: String!
    createdAt: String!
    viewCount: Int!
    favoriteCount: Int!
    isFavorite: Boolean
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
    tradeStatus: String!
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
    totalElements: Int!
    hasNext: Boolean!
  }

  type Query {
    communityPosts(page: Int = 0, size: Int = 20, keyword: String): CommunityPostConnection!
    communityPost(id: Int!): CommunityPostDetail
    communityPostComments(postId: Int!, page: Int = 0, size: Int = 10): CommentConnection!
    userProfile(userId: Int!): UserProfile
    products(page: Int = 0, size: Int = 20, keyword: String): ProductConnection!
    product(id: Int!): ProductDetail
  }
`
