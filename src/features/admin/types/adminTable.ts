// Config-driven 테이블 타입 정의

export type ColumnType = 'text' | 'number' | 'currency' | 'badge' | 'date' | 'image'

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  key: string
  direction: SortDirection
}

export interface FilterState {
  [key: string]: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface BadgeOption {
  value: string
  label: string
  color: string
}

export interface FilterConfig {
  key: string
  label: string
  options: { value: string; label: string }[]
}

export interface ColumnConfig<T = Record<string, unknown>> {
  key: keyof T & string
  label: string
  type: ColumnType
  sortable?: boolean
  width?: string
  badgeOptions?: BadgeOption[]
  /** 셀 렌더링 시 사용할 커스텀 포맷 함수 */
  format?: (value: unknown, row: T) => string
}

export interface ActionConfig<T = Record<string, unknown>> {
  label: string
  icon?: string
  onClick: (row: T) => void
  variant?: 'default' | 'danger'
  show?: (row: T) => boolean
}

export interface PaginationConfig {
  defaultPageSize: number
  pageSizeOptions: number[]
}

export interface TableConfig<T = Record<string, unknown>> {
  title: string
  rowKey: keyof T & string
  columns: ColumnConfig<T>[]
  filters: FilterConfig[]
  actions: ActionConfig<T>[]
  pagination: PaginationConfig
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
}

// API 응답 타입
export interface AdminTableResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// 목 데이터용 공통 처리 함수 타입
export interface MockDataHandler<T> {
  getData: (params: {
    page: number
    pageSize: number
    sort?: SortState
    filters?: FilterState
    search?: string
  }) => AdminTableResponse<T>
}
