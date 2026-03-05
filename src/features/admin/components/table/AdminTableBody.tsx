'use client'

import { cn } from '@/lib/utils/cn'
import type { ColumnConfig, ActionConfig } from '../../types/adminTable'
import TextCell from './cells/TextCell'
import CurrencyCell from './cells/CurrencyCell'
import BadgeCell from './cells/BadgeCell'
import DateCell from './cells/DateCell'
import ImageCell from './cells/ImageCell'
import AdminTableActions from './AdminTableActions'

interface AdminTableBodyProps<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  actions: ActionConfig<T>[]
  rowKey: keyof T & string
  isLoading: boolean
  onRowClick?: (row: T) => void
}

function renderCell<T>(column: ColumnConfig<T>, value: unknown, row: T) {
  if (column.format) {
    return <TextCell value={column.format(value, row)} />
  }
  switch (column.type) {
    case 'currency':
      return <CurrencyCell value={value as number} />
    case 'badge':
      return <BadgeCell value={value as string} options={column.badgeOptions} />
    case 'date':
      return value ? <DateCell value={value as string} /> : <TextCell value="-" />
    case 'image':
      return <ImageCell value={value as string} />
    case 'number':
      return <TextCell value={value as number} />
    case 'text':
    default:
      return <TextCell value={value as string} />
  }
}

export default function AdminTableBody<T extends object>({
  data,
  columns,
  actions,
  rowKey,
  isLoading,
  onRowClick,
}: AdminTableBodyProps<T>) {
  if (isLoading) {
    return (
      <tbody>
        {Array.from({ length: 5 }, (_, i) => (
          <tr key={i} className="animate-pulse">
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3">
                <div className="h-4 rounded bg-gray-200" />
              </td>
            ))}
            {actions.length > 0 && (
              <td className="px-4 py-3">
                <div className="h-4 rounded bg-gray-200" />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    )
  }

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
            className="px-4 py-12 text-center text-sm text-gray-500"
          >
            데이터가 없습니다.
          </td>
        </tr>
      </tbody>
    )
  }

  return (
    <tbody className="divide-y divide-gray-200 bg-white">
      {data.map((row) => (
        <tr
          key={String((row as Record<string, unknown>)[rowKey])}
          className={cn('hover:bg-gray-50', onRowClick && 'cursor-pointer')}
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((col) => (
            <td key={col.key} className="whitespace-nowrap px-4 py-3">
              {renderCell(col, (row as Record<string, unknown>)[col.key], row)}
            </td>
          ))}
          {actions.length > 0 && (
            <td className="whitespace-nowrap px-4 py-3 text-right">
              <AdminTableActions actions={actions} row={row} />
            </td>
          )}
        </tr>
      ))}
    </tbody>
  )
}
