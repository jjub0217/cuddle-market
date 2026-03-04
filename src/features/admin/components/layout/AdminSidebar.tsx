'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Package, Users, ChevronDown, ChevronRight, UserX, MessageSquare, Flag, ShieldAlert, AlertTriangle, FileWarning } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/constants/routes'

interface NavChild {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

interface NavItem {
  label: string
  icon: React.ComponentType<{ size?: number }>
  href?: string
  children?: NavChild[]
}

const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.ADMIN, label: '대시보드', icon: LayoutDashboard },
  {
    label: '회원 관리',
    icon: Users,
    children: [
      { href: ROUTES.ADMIN_MEMBERS_DASHBOARD, label: '대시보드', icon: LayoutDashboard },
      { href: ROUTES.ADMIN_MEMBERS_USERS, label: '유저 관리', icon: Users },
      { href: ROUTES.ADMIN_MEMBERS_WITHDRAWALS, label: '탈퇴 관리', icon: UserX },
    ],
  },
  { href: ROUTES.ADMIN_PRODUCTS, label: '상품 관리', icon: Package },
  { href: ROUTES.ADMIN_COMMUNITY, label: '커뮤니티 관리', icon: MessageSquare },
  {
    label: '신고 관리',
    icon: Flag,
    children: [
      { href: ROUTES.ADMIN_REPORTS_USER, label: '유저신고', icon: ShieldAlert },
      { href: ROUTES.ADMIN_REPORTS_PRODUCT_SELL, label: '판매상품 신고', icon: AlertTriangle },
      { href: ROUTES.ADMIN_REPORTS_PRODUCT_REQUEST, label: '판매요청 상품 신고', icon: FileWarning },
      { href: ROUTES.ADMIN_REPORTS_COMMUNITY, label: '커뮤니티 신고', icon: MessageSquare },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())

  // Auto-expand parent when child route is active
  useEffect(() => {
    for (const item of NAV_ITEMS) {
      if (item.children?.some((child) => pathname === child.href)) {
        setOpenMenus((prev) => new Set(prev).add(item.label))
      }
    }
  }, [pathname])

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href={ROUTES.ADMIN} className="text-lg font-bold text-gray-900">
          커들마켓 Admin
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isOpen = openMenus.has(item.label)
          const hasActiveChild = item.children?.some((c) => pathname === c.href)

          // Parent with children (2-depth)
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    hasActiveChild
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={18} />
                    {item.label}
                  </span>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isOpen && (
                  <div className="mt-1 ml-4 space-y-0.5">
                    {item.children.map((child) => {
                      const isActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-gray-100 font-medium text-gray-900'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                          )}
                        >
                          <child.icon size={16} />
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Simple 1-depth item
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <Link
          href={ROUTES.HOME}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 메인 사이트로
        </Link>
      </div>
    </aside>
  )
}
