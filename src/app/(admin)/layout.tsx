import AdminSidebar from '@/features/admin/components/layout/AdminSidebar'
import AdminHeader from '@/features/admin/components/layout/AdminHeader'
import AdminStoreHydration from '@/features/admin/components/layout/AdminStoreHydration'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminStoreHydration />
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  )
}
