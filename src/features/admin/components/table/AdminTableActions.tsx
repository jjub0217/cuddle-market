'use client'

import { cn } from '@/lib/utils/cn'
import type { ActionConfig } from '../../types/adminTable'

interface AdminTableActionsProps<T> {
  actions: ActionConfig<T>[]
  row: T
}

export default function AdminTableActions<T>({ actions, row }: AdminTableActionsProps<T>) {
  const visibleActions = actions.filter((action) => !action.show || action.show(row))

  if (visibleActions.length === 0) return null

  return (
    <div className="flex items-center justify-end gap-2">
      {visibleActions.map((action) => (
        <button
          key={action.label}
          onClick={() => action.onClick(row)}
          className={cn(
            'cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            action.variant === 'danger'
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-600 hover:bg-gray-100',
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
