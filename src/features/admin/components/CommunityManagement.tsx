'use client'

import { useState } from 'react'
import AdminTable from './table/AdminTable'
import { communityTableConfig } from '../configs/communityTableConfig'
import { fetchAdminCommunityPosts } from '@/lib/api/admin'
import type { MockCommunityPost } from '../mocks/mockCommunityPosts'
import CommunityDetailModal from './community/CommunityDetailModal'

export default function CommunityManagement() {
  const [selectedPost, setSelectedPost] = useState<MockCommunityPost | null>(null)

  return (
    <>
      <AdminTable<MockCommunityPost>
        config={communityTableConfig}
        queryKey="admin-community"
        fetchFn={fetchAdminCommunityPosts}
        onRowClick={(post) => setSelectedPost(post)}
      />
      <CommunityDetailModal
        isOpen={selectedPost !== null}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </>
  )
}
