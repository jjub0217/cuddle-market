'use client'

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ColumnConfig, SortState } from '../../types/adminTable'

interface AdminTableHeaderProps<T> {
  columns: ColumnConfig<T>[]
  sort: SortState
  onSort: (key: string) => void
  hasActions: boolean
}

export default function AdminTableHeader<T>({
  columns,
  sort,
  onSort,
  hasActions,
}: AdminTableHeaderProps<T>) {
  return (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            className={cn(
              'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
              col.sortable && 'cursor-pointer select-none hover:bg-gray-100',
            )}
            style={col.width ? { width: col.width } : undefined}
            onClick={() => col.sortable && onSort(col.key)}
          >
            <div className="flex items-center gap-1">
              {col.label}
              {col.sortable && (
                <span className="text-gray-400">
                  {sort.key === col.key && sort.direction === 'asc' ? (
                    <ArrowUp size={14} />
                  ) : sort.key === col.key && sort.direction === 'desc' ? (
                    <ArrowDown size={14} />
                  ) : (
                    <ArrowUpDown size={14} />
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
        {hasActions && (
          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
            액션
          </th>
        )}
      </tr>
    </thead>
  )
}
