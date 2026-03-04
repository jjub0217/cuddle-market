'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type {
  TableConfig,
  SortState,
  FilterState,
  PaginationState,
  AdminTableResponse,
  SortDirection,
} from '../types/adminTable'

interface UseAdminTableOptions<T> {
  config: TableConfig<T>
  queryKey: string
  fetchFn: (params: {
    page: number
    pageSize: number
    sort?: SortState
    filters?: FilterState
    search?: string
  }) => Promise<AdminTableResponse<T>>
}

export function useAdminTable<T>({ config, queryKey, fetchFn }: UseAdminTableOptions<T>) {
  const [sort, setSort] = useState<SortState>({ key: '', direction: null })
  const [filters, setFilters] = useState<FilterState>({})
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: config.pagination.defaultPageSize,
    total: 0,
  })

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: sort.direction ? sort : undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      search: search || undefined,
    }),
    [pagination.page, pagination.pageSize, sort, filters, search],
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryKey, queryParams],
    queryFn: () => fetchFn(queryParams),
    placeholderData: keepPreviousData,
  })

  // 정렬 토글: asc → desc → null 순환
  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' as SortDirection }
      if (prev.direction === 'asc') return { key, direction: 'desc' as SortDirection }
      if (prev.direction === 'desc') return { key: '', direction: null }
      return { key, direction: 'asc' as SortDirection }
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      if (!value) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: value }
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }))
  }, [])

  const totalPages = Math.ceil((data?.total ?? 0) / pagination.pageSize)

  return {
    // 데이터
    data: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError,

    // 상태
    sort,
    filters,
    search,
    pagination: { ...pagination, total: data?.total ?? 0 },
    totalPages,

    // 핸들러
    handleSort,
    handleFilter,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  }
}
