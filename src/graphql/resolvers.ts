const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface Context {
  authorization: string
}

function getHeaders(context: Context): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (context.authorization) headers['Authorization'] = context.authorization
  return headers
}

async function fetchAPI(path: string, context: Context, options?: RequestInit) {
  const headers = getHeaders(context)
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  })
  if (!res.ok) throw new Error(`REST API error: ${res.status}`)
  const json = await res.json()
  return json.data
}

// For endpoints where pagination is at the top level (chat endpoints)
async function fetchAPIRaw(path: string, context: Context) {
  const headers = getHeaders(context)
  const res = await fetch(`${API_BASE_URL}${path}`, { headers })
  if (!res.ok) throw new Error(`REST API error: ${res.status}`)
  return await res.json()
}

export const resolvers = {
  Query: {
    // ─── Community ───

    communityPosts: async (
      _parent: unknown,
      args: { page: number; size: number; boardType?: string; searchType?: string; keyword?: string; sortBy?: string },
      context: Context
    ) => {
      const params = new URLSearchParams({ page: String(args.page), size: String(args.size) })
      if (args.boardType) params.append('boardType', args.boardType)
      if (args.searchType) params.append('searchType', args.searchType)
      if (args.keyword) params.append('keyword', args.keyword)
      if (args.sortBy) params.append('sortBy', args.sortBy)
      return await fetchAPI(`/community/posts?${params}`, context)
    },

    communityPost: async (_parent: unknown, args: { id: number }, context: Context) => {
      return await fetchAPI(`/community/posts/${args.id}`, context)
    },

    communityPostComments: async (
      _parent: unknown,
      args: { postId: number; page: number; size: number },
      context: Context
    ) => {
      const data = await fetchAPI(
        `/community/posts/${args.postId}/comments?page=${args.page}&size=${args.size}`,
        context
      )
      return { comments: data.comments || [] }
    },

    communityReplies: async (_parent: unknown, args: { commentId: number }, context: Context) => {
      const data = await fetchAPI(`/community/comments/${args.commentId}/replies`, context)
      return { comments: data.comments || [] }
    },

    // ─── User / Profile ───

    userProfile: async (_parent: unknown, args: { userId: number }, context: Context) => {
      return await fetchAPI(`/profile/${args.userId}`, context)
    },

    myProfile: async (_parent: unknown, _args: unknown, context: Context) => {
      return await fetchAPI('/profile/me', context)
    },

    myProducts: async (_parent: unknown, args: { page: number; size: number }, context: Context) => {
      return await fetchAPI(`/profile/me/products?page=${args.page}&size=${args.size}`, context)
    },

    myRequests: async (_parent: unknown, args: { page: number; size: number }, context: Context) => {
      return await fetchAPI(`/profile/me/purchase-requests?page=${args.page}&size=${args.size}`, context)
    },

    myFavorites: async (_parent: unknown, args: { page: number; size: number }, context: Context) => {
      return await fetchAPI(`/profile/me/favorites?page=${args.page}&size=${args.size}`, context)
    },

    myBlockedUsers: async (_parent: unknown, args: { page: number; size: number }, context: Context) => {
      const data = await fetchAPI(`/profile/me/blocked-users?page=${args.page}&size=${args.size}`, context)
      // REST returns { blockedUsers: [...], page, hasNext, ... } — normalize to { content, page, hasNext }
      return {
        content: data.blockedUsers || data.content || [],
        page: data.page ?? 0,
        hasNext: data.hasNext ?? false,
        total: data.total ?? data.totalElements ?? 0,
      }
    },

    userProducts: async (
      _parent: unknown,
      args: { userId: number; page: number; size: number },
      context: Context
    ) => {
      return await fetchAPI(`/profile/${args.userId}/products?page=${args.page}&size=${args.size}`, context)
    },

    checkNickname: async (_parent: unknown, args: { nickname: string }) => {
      const res = await fetch(
        `${API_BASE_URL}/auth/nickname/check?nickname=${encodeURIComponent(args.nickname)}`
      )
      if (!res.ok) throw new Error(`REST API error: ${res.status}`)
      const json = await res.json()
      return { available: json.data, message: json.message }
    },

    // ─── Products ───

    products: async (
      _parent: unknown,
      args: {
        page: number; size: number; keyword?: string; productType?: string;
        productStatuses?: string; minPrice?: number; maxPrice?: number;
        addressSido?: string; addressGugun?: string; categories?: string;
        petType?: string; petDetailType?: string; sortBy?: string; sortOrder?: string
      },
      context: Context
    ) => {
      const params = new URLSearchParams({ page: String(args.page), size: String(args.size) })
      if (args.keyword) params.append('keyword', args.keyword)
      if (args.productType) params.append('productType', args.productType)
      if (args.productStatuses) params.append('productStatuses', args.productStatuses)
      if (args.minPrice != null) params.append('minPrice', String(args.minPrice))
      if (args.maxPrice != null) params.append('maxPrice', String(args.maxPrice))
      if (args.addressSido) params.append('addressSido', args.addressSido)
      if (args.addressGugun) params.append('addressGugun', args.addressGugun)
      if (args.categories) params.append('categories', args.categories)
      if (args.petType) params.append('petType', args.petType)
      if (args.petDetailType) params.append('petDetailType', args.petDetailType)
      if (args.sortBy) params.append('sortBy', args.sortBy)
      if (args.sortOrder) params.append('sortOrder', args.sortOrder)
      return await fetchAPI(`/products/search?${params}`, context)
    },

    product: async (_parent: unknown, args: { id: number }, context: Context) => {
      return await fetchAPI(`/products/${args.id}`, context)
    },

    // ─── Notifications ───

    notifications: async (_parent: unknown, args: { page: number; size: number }, context: Context) => {
      return await fetchAPI(`/notifications?page=${args.page}&size=${args.size}`, context)
    },

    unreadNotificationCount: async (_parent: unknown, _args: unknown, context: Context) => {
      return await fetchAPI('/notifications/unread-count', context)
    },

    // ─── Chat ───

    chatRooms: async (_parent: unknown, args: { page: number; size: number }, context: Context) => {
      const json = await fetchAPIRaw(`/chat/rooms?page=${args.page}&size=${args.size}`, context)
      return {
        chatRooms: json.data?.chatRooms || [],
        currentPage: json.currentPage ?? json.data?.page ?? 0,
        hasNext: json.hasNext ?? json.data?.hasNext ?? false,
      }
    },

    chatMessages: async (
      _parent: unknown,
      args: { chatRoomId: number; page: number; size: number },
      context: Context
    ) => {
      const json = await fetchAPIRaw(
        `/chat/rooms/${args.chatRoomId}/messages?page=${args.page}&size=${args.size}`,
        context
      )
      return {
        messages: json.data?.messages || [],
        currentPage: json.currentPage ?? json.data?.page ?? 0,
        hasNext: json.hasNext ?? json.data?.hasNext ?? false,
      }
    },
  },

  Mutation: {
    // ─── Products ───

    createProduct: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      context: Context
    ) => {
      const data = await fetchAPI('/products', context, {
        method: 'POST',
        body: JSON.stringify(args.input),
      })
      return { id: data.id }
    },

    updateProduct: async (
      _parent: unknown,
      args: { id: number; input: Record<string, unknown> },
      context: Context
    ) => {
      await fetchAPI(`/products/${args.id}`, context, {
        method: 'PATCH',
        body: JSON.stringify(args.input),
      })
      return { success: true }
    },

    deleteProduct: async (_parent: unknown, args: { id: number }, context: Context) => {
      await fetchAPI(`/products/${args.id}`, context, { method: 'DELETE' })
      return { success: true }
    },

    toggleFavorite: async (_parent: unknown, args: { productId: number }, context: Context) => {
      await fetchAPI(`/products/${args.productId}/favorite`, context, { method: 'POST' })
      return { success: true }
    },

    updateTradeStatus: async (
      _parent: unknown,
      args: { id: number; tradeStatus: string },
      context: Context
    ) => {
      await fetchAPI(`/products/${args.id}/trade-status`, context, {
        method: 'PATCH',
        body: JSON.stringify({ tradeStatus: args.tradeStatus }),
      })
      return { success: true }
    },

    createProductRequest: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      context: Context
    ) => {
      const data = await fetchAPI('/products/requests', context, {
        method: 'POST',
        body: JSON.stringify(args.input),
      })
      return { id: data.id }
    },

    updateProductRequest: async (
      _parent: unknown,
      args: { id: number; input: Record<string, unknown> },
      context: Context
    ) => {
      await fetchAPI(`/products/requests/${args.id}`, context, {
        method: 'PATCH',
        body: JSON.stringify(args.input),
      })
      return { success: true }
    },

    // ─── Community ───

    createPost: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      context: Context
    ) => {
      const data = await fetchAPI('/community/posts', context, {
        method: 'POST',
        body: JSON.stringify(args.input),
      })
      return { id: data.id }
    },

    updatePost: async (
      _parent: unknown,
      args: { id: number; input: Record<string, unknown> },
      context: Context
    ) => {
      await fetchAPI(`/community/posts/${args.id}`, context, {
        method: 'PATCH',
        body: JSON.stringify(args.input),
      })
      return { success: true }
    },

    deletePost: async (_parent: unknown, args: { id: number }, context: Context) => {
      await fetchAPI(`/community/posts/${args.id}`, context, { method: 'DELETE' })
      return { success: true }
    },

    createComment: async (
      _parent: unknown,
      args: { postId: number; content: string; parentId?: number },
      context: Context
    ) => {
      await fetchAPI(`/community/posts/${args.postId}/comments`, context, {
        method: 'POST',
        body: JSON.stringify({ content: args.content, parentId: args.parentId }),
      })
      return { success: true }
    },

    deleteComment: async (_parent: unknown, args: { commentId: number }, context: Context) => {
      await fetchAPI(`/community/comments/${args.commentId}`, context, { method: 'DELETE' })
      return { success: true }
    },

    reportPost: async (
      _parent: unknown,
      args: { postId: number; reason: string; details?: string },
      context: Context
    ) => {
      await fetchAPI(`/reports/community-posts/${args.postId}`, context, {
        method: 'POST',
        body: JSON.stringify({ reason: args.reason, details: args.details }),
      })
      return { success: true }
    },

    // ─── Profile ───

    updateProfile: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      context: Context
    ) => {
      const headers = getHeaders(context)
      const res = await fetch(`${API_BASE_URL}/profile/me`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(args.input),
      })
      if (!res.ok) throw new Error(`REST API error: ${res.status}`)
      const json = await res.json()
      return { success: true, code: json.code || 'SUCCESS' }
    },

    changePassword: async (
      _parent: unknown,
      args: { currentPassword: string; newPassword: string; confirmPassword: string },
      context: Context
    ) => {
      await fetchAPI('/auth/password/change', context, {
        method: 'PATCH',
        body: JSON.stringify(args),
      })
      return { success: true }
    },

    withdraw: async (_parent: unknown, args: { reason: string; detailReason: string }, context: Context) => {
      await fetchAPI('/auth/withdraw', context, {
        method: 'DELETE',
        body: JSON.stringify({ reason: args.reason, detailReason: args.detailReason }),
      })
      return { success: true }
    },

    blockUser: async (_parent: unknown, args: { userId: number }, context: Context) => {
      await fetchAPI(`/reports/blocks/users/${args.userId}`, context, { method: 'POST' })
      return { success: true }
    },

    unblockUser: async (_parent: unknown, args: { userId: number }, context: Context) => {
      await fetchAPI(`/reports/blocks/users/${args.userId}`, context, { method: 'DELETE' })
      return { success: true }
    },

    reportUser: async (
      _parent: unknown,
      args: { userId: number; reason: string; details?: string },
      context: Context
    ) => {
      await fetchAPI(`/reports/users/${args.userId}`, context, {
        method: 'POST',
        body: JSON.stringify({ reason: args.reason, details: args.details }),
      })
      return { success: true }
    },

    // ─── Notifications ───

    markAllNotificationsRead: async (_parent: unknown, _args: unknown, context: Context) => {
      await fetchAPI('/notifications/read-all', context, { method: 'PATCH' })
      return { success: true }
    },

    markNotificationRead: async (
      _parent: unknown,
      args: { notificationId: number },
      context: Context
    ) => {
      await fetchAPI(`/notifications/${args.notificationId}/read`, context, { method: 'PATCH' })
      return { success: true }
    },

    // ─── Chat ───

    createChatRoom: async (
      _parent: unknown,
      args: { productId: number },
      context: Context
    ) => {
      const data = await fetchAPI('/chat/rooms', context, {
        method: 'POST',
        body: JSON.stringify({ productId: args.productId }),
      })
      return { chatRoomId: data.chatRoomId }
    },

    leaveChatRoom: async (_parent: unknown, args: { chatRoomId: number }, context: Context) => {
      await fetchAPI(`/chat/rooms/${args.chatRoomId}`, context, { method: 'DELETE' })
      return { success: true }
    },
  },
}
