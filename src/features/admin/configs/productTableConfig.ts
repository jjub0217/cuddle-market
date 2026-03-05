import type { TableConfig } from '../types/adminTable'
import type { MockProduct } from '../mocks/mockProducts'

export const productTableConfig: TableConfig<MockProduct> = {
  title: '상품 관리',
  rowKey: 'id',
  searchable: true,
  searchPlaceholder: '상품명 검색...',
  columns: [
    { key: 'id', label: 'ID', type: 'number', sortable: true, width: '70px' },
    {
      key: 'productType',
      label: '유형',
      type: 'badge',
      sortable: true,
      width: '90px',
      badgeOptions: [
        { value: '팝니다', label: '팝니다', color: 'bg-[#7BA5D6] text-white' },
        { value: '삽니다', label: '삽니다', color: 'bg-[#FFF7ED] text-orange-800' },
      ],
    },
    { key: 'image', label: '이미지', type: 'image', width: '80px' },
    { key: 'name', label: '상품명', type: 'text', sortable: true },
    { key: 'nickname', label: '닉네임', type: 'text', sortable: true },
    { key: 'category', label: '카테고리', type: 'text', sortable: true, width: '120px' },
    { key: 'price', label: '가격', type: 'currency', sortable: true, width: '120px' },
    {
      key: 'tradeStatus',
      label: '거래 상태',
      type: 'badge',
      sortable: true,
      width: '100px',
      badgeOptions: [
        { value: '요청중', label: '요청중', color: 'bg-[#DCFCE7] text-green-800' },
        { value: '요청완료', label: '요청완료', color: 'bg-[#F3F4F6] text-gray-800' },
        { value: '판매중', label: '판매중', color: 'bg-[#DCFCE7] text-green-800' },
        { value: '예약중', label: '예약중', color: 'bg-[#FEF9C3] text-yellow-800' },
        { value: '판매완료', label: '판매완료', color: 'bg-[#F3F4F6] text-gray-800' },
      ],
    },
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
      key: 'tradeStatus',
      label: '거래 상태',
      options: [
        { value: '요청중', label: '요청중' },
        { value: '요청완료', label: '요청완료' },
        { value: '판매중', label: '판매중' },
        { value: '예약중', label: '예약중' },
        { value: '판매완료', label: '판매완료' },
      ],
    },
    {
      key: 'category',
      label: '카테고리',
      options: [
        { value: '사료/간식', label: '사료/간식' },
        { value: '장난감', label: '장난감' },
        { value: '사육장/하우스', label: '사육장/하우스' },
        { value: '건강/위생', label: '건강/위생' },
        { value: '의류/악세사리', label: '의류/악세사리' },
        { value: '이동장/목줄', label: '이동장/목줄' },
        { value: '미용용품', label: '미용용품' },
        { value: '기타', label: '기타' },
      ],
    },
    {
      key: 'productType',
      label: '유형',
      options: [
        { value: '팝니다', label: '팝니다' },
        { value: '삽니다', label: '삽니다' },
      ],
    },
  ],
  actions: [],
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  },
}
