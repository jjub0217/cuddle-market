'use client'

import { useUserStore } from '@/store/userStore'

export default function AdminHeader() {
  const user = useUserStore((s) => s.user)

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-sm font-medium text-gray-500">관리자 대시보드</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user?.nickname ?? '관리자'}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
          {user?.nickname?.charAt(0) ?? 'A'}
        </div>
      </div>
    </header>
  )
}
