'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PaginationConfig, PaginationState } from '../../types/adminTable'

interface AdminTablePaginationProps {
  pagination: PaginationState
  paginationConfig: PaginationConfig
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export default function AdminTablePagination({
  pagination,
  paginationConfig,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: AdminTablePaginationProps) {
  const { page, pageSize, total } = pagination
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  // 표시할 페이지 번호 생성
  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')

    const rangeStart = Math.max(2, page - 1)
    const rangeEnd = Math.min(totalPages - 1, page + 1)

    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)

    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)

    return pages
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          {total > 0 ? `${start}-${end} / 총 ${total}건` : '데이터 없음'}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1 text-sm outline-none"
        >
          {paginationConfig.pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}개씩
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        {getPageNumbers().map((pageNum, i) =>
          pageNum === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'min-w-[32px] rounded px-2 py-1 text-sm',
                pageNum === page
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {pageNum}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
