'use client'

import AdminSidebar from '@/features/admin/components/layout/AdminSidebar'
import AdminHeader from '@/features/admin/components/layout/AdminHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  )
}
