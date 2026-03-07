'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { logout } from '@/lib/api/auth'
import { ROUTES } from '@/constants/routes'

export default function AdminHeader() {
  const user = useUserStore((s) => s.user)
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // 로그아웃 API 실패해도 클라이언트 상태는 클리어
    } finally {
      useUserStore.getState().clearAll()
      router.push(ROUTES.ADMIN_LOGIN)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-sm font-medium text-gray-500">관리자 대시보드</h1>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
        >
          <span className="text-sm text-gray-600">{user?.nickname ?? '관리자'}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
            {user?.nickname?.charAt(0) ?? 'A'}
          </div>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
