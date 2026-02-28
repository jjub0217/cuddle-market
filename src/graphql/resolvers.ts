const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export const resolvers = {
  Query: {
    communityPosts: async (_parent: unknown, args: { page: number; size: number; keyword?: string }) => {
      const url = `${API_BASE_URL}/community/posts?page=${args.page}&size=${args.size}${args.keyword ? '&keyword=' + args.keyword : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`REST API error: ${res.status}`)
      const json = await res.json()
      return json.data
    },

    communityPost: async (_parent: unknown, args: { id: number }) => {
      const res = await fetch(`${API_BASE_URL}/community/posts/${args.id}`)
      if (!res.ok) throw new Error(`REST API error: ${res.status}`)
      const json = await res.json()
      return json.data
    },

    communityPostComments: async (_parent: unknown, args: { postId: number; page: number; size: number }) => {
      const res = await fetch(`${API_BASE_URL}/community/posts/${args.postId}/comments?page=${args.page}&size=${args.size}`)
      if (!res.ok) throw new Error(`REST API error: ${res.status}`)
      const json = await res.json()
      return { comments: json.data.comments || [] }
    },

    userProfile: async (_parent: unknown, args: { userId: number }) => {
      const res = await fetch(`${API_BASE_URL}/profile/${args.userId}`)
      if (!res.ok) throw new Error(`REST API error: ${res.status}`)
      const json = await res.json()
      return json.data
    },

    products: async (_parent: unknown, args: { page: number; size: number; keyword?: string }) => {
      const url = `${API_BASE_URL}/products/search?page=${args.page}&size=${args.size}${args.keyword ? '&keyword=' + args.keyword : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`REST API error: ${res.status}`)
      const json = await res.json()
      return json.data
    },

    product: async (_parent: unknown, args: { id: number }) => {
      const res = await fetch(`${API_BASE_URL}/products/${args.id}`)
      if (!res.ok) throw new Error(`REST API error: ${res.status}`)
      const json = await res.json()
      return json.data
    },
  },
}
