import type { TableConfig } from '../types/adminTable'
import type { MockCommunityPost } from '../mocks/mockCommunityPosts'

export const communityTableConfig: TableConfig<MockCommunityPost> = {
  title: '커뮤니티 관리',
  searchable: true,
  searchPlaceholder: '제목 검색...',
  columns: [
    { key: 'id', label: '게시글 ID', type: 'number', sortable: true, width: '90px' },
    {
      key: 'boardType',
      label: '유형',
      type: 'badge',
      sortable: true,
      width: '110px',
      badgeOptions: [
        { value: '질문있어요', label: '질문있어요', color: 'bg-blue-100 text-blue-800' },
        { value: '정보공유', label: '정보공유', color: 'bg-green-100 text-green-800' },
      ],
    },
    { key: 'title', label: '제목', type: 'text', sortable: true },
    { key: 'nickname', label: '닉네임', type: 'text', sortable: true, width: '120px' },
    {
      key: 'createdAt',
      label: '작성일자',
      type: 'date',
      sortable: true,
      width: '120px',
      format: (v) => {
        const d = new Date(v as string)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      },
    },
    {
      key: 'updatedAt',
      label: '수정일자',
      type: 'date',
      sortable: true,
      width: '120px',
      format: (v) => {
        const d = new Date(v as string)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      },
    },
  ],
  filters: [
    {
      key: 'boardType',
      label: '게시글 유형',
      options: [
        { value: '질문있어요', label: '질문있어요' },
        { value: '정보공유', label: '정보공유' },
      ],
    },
    {
      key: 'sortOrder',
      label: '정렬',
      options: [
        { value: '최신순', label: '최신순' },
        { value: '오래된 순', label: '오래된 순' },
      ],
    },
  ],
  actions: [],
  pagination: { defaultPageSize: 10, pageSizeOptions: [5, 10, 20, 50] },
}
