import type { TableConfig } from '../types/adminTable'
import type { AdminProduct } from '../types/adminApi'
import { STATUS_EN_TO_KO, PRODUCT_CATEGORIES, CONDITION_ITEMS } from '@/constants/constants'

const PRODUCT_TYPE_EN_TO_KO: Record<string, string> = {
  SELL: '팝니다',
  REQUEST: '삽니다',
}

const TRADE_STATUS_EN_TO_KO: Record<string, string> = {
  SELLING: '판매중',
  BUYING: '요청중',
  RESERVED: '예약중',
  COMPLETED: '완료',
}

const PRODUCT_STATUS_EN_TO_KO: Record<string, string> = Object.fromEntries(
  CONDITION_ITEMS.map((item) => [item.value, item.title]),
)

const CATEGORY_EN_TO_KO: Record<string, string> = Object.fromEntries(
  PRODUCT_CATEGORIES.map((cat) => [cat.code, cat.name]),
)

export { PRODUCT_TYPE_EN_TO_KO, TRADE_STATUS_EN_TO_KO, PRODUCT_STATUS_EN_TO_KO, CATEGORY_EN_TO_KO }

export const productTableConfig: TableConfig<AdminProduct> = {
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
        { value: 'SELL', label: '팝니다', color: 'bg-[#7BA5D6] text-white' },
        { value: 'REQUEST', label: '삽니다', color: 'bg-[#FFF7ED] text-orange-800' },
      ],
    },
    { key: 'title', label: '상품명', type: 'text', sortable: true },
    { key: 'sellerNickname', label: '판매자', type: 'text', sortable: true, width: '120px' },
    {
      key: 'category',
      label: '카테고리',
      type: 'badge',
      width: '120px',
      badgeOptions: PRODUCT_CATEGORIES.map((cat) => ({
        value: cat.code,
        label: cat.name,
        color: 'bg-gray-100 text-gray-800',
      })),
    },
    {
      key: 'productStatus',
      label: '상품 상태',
      type: 'badge',
      width: '110px',
      badgeOptions: [
        { value: 'NEW', label: '새 상품', color: 'bg-[#DCFCE7] text-green-800' },
        { value: 'LIKE_NEW', label: '거의 새것', color: 'bg-[#DBEAFE] text-blue-800' },
        { value: 'USED', label: '사용감 있음', color: 'bg-[#FEF9C3] text-yellow-800' },
        { value: 'NEED_REPAIR', label: '수리 필요', color: 'bg-[#FEE2E2] text-red-800' },
      ],
    },
    { key: 'price', label: '가격', type: 'currency', sortable: true, width: '120px' },
    {
      key: 'tradeStatus',
      label: '거래 상태',
      type: 'badge',
      sortable: true,
      width: '100px',
      badgeOptions: [
        { value: 'SELLING', label: '판매중', color: 'bg-[#DCFCE7] text-green-800' },
        { value: 'BUYING', label: '요청중', color: 'bg-[#DCFCE7] text-green-800' },
        { value: 'RESERVED', label: '예약중', color: 'bg-[#FEF9C3] text-yellow-800' },
        { value: 'COMPLETED', label: '완료', color: 'bg-[#F3F4F6] text-gray-800' },
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
  ],
  filters: [
    {
      key: 'tradeStatus',
      label: '거래 상태',
      options: [
        ...STATUS_EN_TO_KO.map((s) => ({ value: s.name, label: s.name })),
        { value: '요청중', label: '요청중' },
      ],
    },
    {
      key: 'category',
      label: '카테고리',
      options: PRODUCT_CATEGORIES.map((cat) => ({ value: cat.name, label: cat.name })),
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
