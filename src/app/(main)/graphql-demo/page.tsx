'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';

const GET_COMMUNITY_POSTS = gql`
  query GetCommunityPosts($page: Int, $size: Int, $keyword: String) {
    communityPosts(page: $page, size: $size, keyword: $keyword) {
      content {
        id
        title
        contentPreview
        authorNickname
        viewCount
        commentCount
        createdAt
        boardType
      }
      total
    }
  }
`;

const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: Int!) {
    userProfile(userId: $userId) {
      nickname
      profileImageUrl
      introduction
      rating
    }
  }
`;

const GET_PRODUCTS = gql`
  query GetProducts($page: Int, $size: Int, $keyword: String) {
    products(page: $page, size: $size, keyword: $keyword) {
      content {
        id
        title
        price
        mainImageUrl
        petDetailType
        tradeStatus
        viewCount
        favoriteCount
      }
      totalElements
      hasNext
    }
  }
`;

interface CommunityPost {
  id: number;
  title: string;
  contentPreview: string;
  authorNickname: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  boardType: string;
}

interface GetCommunityPostsData {
  communityPosts: {
    content: CommunityPost[];
    total: number;
  };
}

interface UserProfile {
  nickname: string;
  profileImageUrl: string;
  introduction: string;
  rating: number;
}

interface GetUserProfileData {
  userProfile: UserProfile;
}

interface Product {
  id: number;
  title: string;
  price: number;
  mainImageUrl: string;
  petDetailType: string;
  tradeStatus: string;
  viewCount: number;
  favoriteCount: number;
}

interface GetProductsData {
  products: {
    content: Product[];
    totalElements: number;
    hasNext: boolean;
  };
}

export default function GraphQLDemoPage() {
  const [keyword, setKeyword] = useState('');

  const {
    data: postsData,
    loading: postsLoading,
    error: postsError,
  } = useQuery<GetCommunityPostsData>(GET_COMMUNITY_POSTS, {
    variables: { page: 0, size: 5 },
  });

  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
  } = useQuery<GetUserProfileData>(GET_USER_PROFILE, {
    variables: { userId: 1 },
  });

  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
  } = useQuery<GetProductsData>(GET_PRODUCTS, {
    variables: { page: 0, size: 5 },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">
        GraphQL Demo - Community, Profile &amp; Products
      </h1>

      {/* Profile Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">User Profile</h2>
        {profileLoading && (
          <p className="text-gray-500 text-sm">Loading profile...</p>
        )}
        {profileError && (
          <p className="text-red-500 text-sm">
            Error loading profile: {profileError.message}
          </p>
        )}
        {profileData?.userProfile && (
          <div className="flex items-start gap-4">
            {profileData.userProfile.profileImageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profileData.userProfile.profileImageUrl}
                alt={profileData.userProfile.nickname}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">
                {profileData.userProfile.nickname}
              </p>
              {profileData.userProfile.introduction && (
                <p className="text-gray-600 text-sm">
                  {profileData.userProfile.introduction}
                </p>
              )}
              <p className="text-yellow-500 text-sm font-medium">
                Rating: {profileData.userProfile.rating}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Community Posts Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Community Posts
        </h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search posts..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {postsLoading && (
          <p className="text-gray-500 text-sm">Loading posts...</p>
        )}
        {postsError && (
          <p className="text-red-500 text-sm">
            Error loading posts: {postsError.message}
          </p>
        )}
        {postsData?.communityPosts && (
          <>
            <p className="text-gray-500 text-xs mb-3">
              Total: {postsData.communityPosts.total} posts
            </p>
            <ul className="space-y-3">
              {postsData.communityPosts.content.map((post) => (
                <li
                  key={post.id}
                  className="border border-gray-100 rounded-md p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {post.title}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {post.authorNickname} &middot; {post.boardType}
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 shrink-0">
                      <span>Views {post.viewCount}</span>
                      <span>Comments {post.commentCount}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Products Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Products</h2>
        {productsLoading && (
          <p className="text-gray-500 text-sm">Loading products...</p>
        )}
        {productsError && (
          <p className="text-red-500 text-sm">
            Error loading products: {productsError.message}
          </p>
        )}
        {productsData?.products && (
          <>
            <p className="text-gray-500 text-xs mb-3">
              Total: {productsData.products.totalElements} products
            </p>
            <ul className="space-y-3">
              {productsData.products.content.map((product) => (
                <li
                  key={product.id}
                  className="border border-gray-100 rounded-md p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {product.title}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {product.petDetailType} &middot; {product.tradeStatus}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">
                        {product.price.toLocaleString()}원
                      </p>
                      <div className="flex gap-2 text-xs text-gray-400 mt-1">
                        <span>Views {product.viewCount}</span>
                        <span>Favs {product.favoriteCount}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
