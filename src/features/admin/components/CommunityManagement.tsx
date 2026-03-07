'use client'

import { useState } from 'react'
import AdminTable from './table/AdminTable'
import { communityTableConfig } from '../configs/communityTableConfig'
import { fetchAdminCommunityPosts } from '@/lib/api/admin'
import type { CommunityItem } from '@/types/community'
import CommunityDetailModal from './community/CommunityDetailModal'

export default function CommunityManagement() {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)

  return (
    <>
      <AdminTable<CommunityItem>
        config={communityTableConfig}
        queryKey="admin-community"
        fetchFn={fetchAdminCommunityPosts}
        onRowClick={(post) => setSelectedPostId(post.id)}
      />
      <CommunityDetailModal
        isOpen={selectedPostId !== null}
        postId={selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />
    </>
  )
}
