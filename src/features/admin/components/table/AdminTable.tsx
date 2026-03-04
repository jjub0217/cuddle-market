'use client'

import type { TableConfig, AdminTableResponse, SortState, FilterState } from '../../types/adminTable'
import { useAdminTable } from '../../hooks/useAdminTable'
import AdminTableHeader from './AdminTableHeader'
import AdminTableBody from './AdminTableBody'
import AdminTableFilters from './AdminTableFilters'
import AdminTablePagination from './AdminTablePagination'

interface AdminTableProps<T extends object> {
  config: TableConfig<T>
  queryKey: string
  fetchFn: (params: {
    page: number
    pageSize: number
    sort?: SortState
    filters?: FilterState
    search?: string
  }) => Promise<AdminTableResponse<T>>
  onRowClick?: (row: T) => void
}

export default function AdminTable<T extends object>({
  config,
  queryKey,
  fetchFn,
  onRowClick,
}: AdminTableProps<T>) {
  const {
    data,
    isLoading,
    sort,
    filters,
    search,
    pagination,
    totalPages,
    handleSort,
    handleFilter,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  } = useAdminTable({ config, queryKey, fetchFn })

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
      </div>

      <AdminTableFilters
        filters={config.filters}
        filterState={filters}
        onFilterChange={handleFilter}
        searchable={config.searchable}
        searchPlaceholder={config.searchPlaceholder}
        search={search}
        onSearchChange={handleSearch}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <AdminTableHeader
            columns={config.columns}
            sort={sort}
            onSort={handleSort}
            hasActions={config.actions.length > 0}
          />
          <AdminTableBody
            data={data}
            columns={config.columns}
            actions={config.actions}
            isLoading={isLoading}
            onRowClick={onRowClick}
          />
        </table>
      </div>

      <AdminTablePagination
        pagination={pagination}
        paginationConfig={config.pagination}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
