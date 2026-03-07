'use client'

import { useQuery } from '@tanstack/react-query'
import { Package, Users, UserCheck, UserX, ShoppingBag } from 'lucide-react'
import { fetchDashboardStats } from '@/lib/api/admin'
import StatCard from './StatCard'

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">대시보드</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="전체 회원"
          value={stats ? `${stats.totalUserCount.toLocaleString()}명` : '-'}
          icon={Users}
        />
        <StatCard
          title="활성 회원"
          value={stats ? `${stats.activeUserCount.toLocaleString()}명` : '-'}
          icon={UserCheck}
        />
        <StatCard
          title="탈퇴 회원"
          value={stats ? `${stats.withdrawnUserCount.toLocaleString()}명` : '-'}
          icon={UserX}
        />
        <StatCard
          title="전체 상품"
          value={stats ? `${stats.totalProductCount.toLocaleString()}개` : '-'}
          icon={Package}
        />
        <StatCard
          title="활성 상품"
          value={stats ? `${stats.activeProductCount.toLocaleString()}개` : '-'}
          icon={ShoppingBag}
        />
      </div>
    </div>
  )
}
